const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { Player } = require('discord-player');
const { SpotifyExtractor, SoundCloudExtractor } = require('@discord-player/extractor');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Logger = require('./utils/advancedLogger');
const DebugMonitor = require('./utils/debugMonitor');
const MusicTracker = require('./utils/musicTracker');
const { initializeLeaderboardSystem } = require('./utils/leaderboardInitializer');
require('dotenv').config();

// Initialiser le système de logs avancé
const logger = new Logger();
const debugMonitor = new DebugMonitor();

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log(chalk.green('📁 Dossier logs créé'));
}

// Configuration du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Configuration du player musical (sans YouTube - utilise play-dl dans /play)
const player = new Player(client, {
    useLegacyFFmpeg: true,
    skipFFmpeg: false,
    connectionTimeout: 30000
});

// Configuration des extracteurs (sans YouTube - utilise play-dl dans /play)

try {
    if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
        player.extractors.register(SpotifyExtractor, {
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET
        });
        logger.success('Extracteur Spotify enregistré');
    } else {
        logger.warning('Credentials Spotify manquants - Spotify désactivé');
    }
} catch (error) {
    logger.warning('Erreur lors de l\'enregistrement de l\'extracteur Spotify:', error);
}

try {
    player.extractors.register(SoundCloudExtractor, {});
    logger.success('Extracteur SoundCloud enregistré');
} catch (error) {
    logger.warning('Erreur lors de l\'enregistrement de l\'extracteur SoundCloud:', error);
}

// Exporter le player pour les commandes (statusManager sera ajouté plus tard)
module.exports = { player, client, logger, debugMonitor };

// Collection pour stocker les commandes
client.commands = new Collection();

// Chargement des commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            logger.success(`Commande chargée: ${command.data.name}`);
        } else {
            logger.error(`La commande ${filePath} n'a pas de propriété "data" ou "execute"`);
        }
    }
}

// Chargement des événements
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    logger.success(`Événement chargé: ${event.name}`);
}

// Gestion des erreurs du player
player.events.on('error', (queue, error) => {
    logger.error(`Erreur dans la queue ${queue.guild.name}`, error, { guild: queue.guild.name });
    debugMonitor.logError(error, { type: 'player_queue', guild: queue.guild.name });
});

player.events.on('playerError', (queue, error) => {
    logger.error(`Erreur du player dans ${queue.guild.name}`, error, { guild: queue.guild.name });
    debugMonitor.logError(error, { type: 'player_error', guild: queue.guild.name });
});

// Gestion des erreurs des extracteurs
player.extractors.on('error', (extractor, error) => {
    logger.error(`Erreur de l'extracteur ${extractor.constructor.name}`, error, { extractor: extractor.constructor.name });
    debugMonitor.logError(error, { type: 'extractor_error', extractor: extractor.constructor.name });
});

// Événements pour détecter les arrêts automatiques
player.events.on('playerStart', (queue, track) => {
    logger.success(`🎵 Lecture démarrée: ${track.title}`, { guild: queue.guild.name, track: track.title });
    // Mettre à jour le statut immédiatement
    statusManager.updateStatus();
});

player.events.on('playerFinish', (queue, track) => {
    logger.info(`🏁 Lecture terminée: ${track.title}`, { guild: queue.guild.name, track: track.title });
    // Mettre à jour le statut immédiatement
    statusManager.updateStatus();
});

player.events.on('playerSkip', (queue, track) => {
    logger.info(`⏭️ Musique passée: ${track.title}`, { guild: queue.guild.name, track: track.title });
    // Mettre à jour le statut immédiatement
    statusManager.updateStatus();
});

player.events.on('emptyQueue', (queue) => {
    logger.warning(`⚠️ Queue vide dans ${queue.guild.name}`, { guild: queue.guild.name });
    // Mettre à jour le statut immédiatement
    statusManager.updateStatus();
});

player.events.on('disconnect', (queue) => {
    logger.warning(`⚠️ Déconnexion du salon vocal dans ${queue.guild.name}`, { guild: queue.guild.name });
    // Mettre à jour le statut immédiatement
    statusManager.updateStatus();
});

// Événements du player pour le monitoring
player.events.on('trackStart', (queue, track) => {
    logger.music(`Musique démarrée: ${track.title}`, { 
        guild: queue.guild.name, 
        track: track.title,
        author: track.author 
    });
});

player.events.on('trackEnd', (queue, track) => {
    logger.music(`Musique terminée: ${track.title}`, { 
        guild: queue.guild.name, 
        track: track.title 
    });
});

player.events.on('queueEnd', (queue) => {
    logger.music(`Queue terminée dans ${queue.guild.name}`, { guild: queue.guild.name });
});

// Système de gestion du statut dynamique
class BotStatusManager {
    constructor(client) {
        this.client = client;
        this.updateInterval = null;
        this.currentStatus = null;
    }

    start() {
        // Mettre à jour le statut toutes les 10 secondes
        this.updateInterval = setInterval(() => {
            this.updateStatus();
        }, 10000);
        
        // Mise à jour initiale
        this.updateStatus();
    }

    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async updateStatus() {
        try {
            const voiceManager = require('./utils/voiceManager');
            
            // Chercher dans tous les serveurs pour trouver une musique en cours
            let currentTrack = null;
            let radioStation = null;
            
            // D'abord vérifier le système de radio
            try {
                const radioModule = require('./commands/music/radio');
                if (radioModule.radioState && radioModule.radioState.currentStation && radioModule.radioState.connection) {
                    // Vérifier que la connexion est vraiment active et non détruite
                    const connectionStatus = radioModule.radioState.connection.state.status;
                    if (connectionStatus === 'ready' || connectionStatus === 'connecting') {
                        logger.discord(`📻 Station radio active détectée: ${radioModule.radioState.currentStation.name} (status: ${connectionStatus})`);
                        radioStation = radioModule.radioState.currentStation.name;
                    } else {
                        logger.discord(`📻 Radio configurée mais connexion inactive: ${connectionStatus}`);
                        // Si la connexion est détruite, réinitialiser radioState
                        if (connectionStatus === 'destroyed' || connectionStatus === 'disconnected') {
                            console.log('📻 Connexion radio détruite, réinitialisation de radioState');
                            radioModule.radioState.currentStation = null;
                            radioModule.radioState.connection = null;
                            radioModule.radioState.player = null;
                        }
                    }
                } else {
                    logger.discord(`📻 Aucune radio active détectée`);
                }
            } catch (error) {
                logger.discord(`❌ Erreur lors de la vérification du système radio: ${error.message}`);
            }

            // Si pas de radio, vérifier les musiques YouTube
            if (!radioStation) {
                for (const guild of this.client.guilds.cache.values()) {
                    // Vérifier si le bot est connecté à un salon vocal YouTube ET si la musique est vraiment en cours
                    if (voiceManager.isYouTubeConnected(guild) && voiceManager.isPlaying(guild)) {
                        logger.discord(`🔍 Vérification statut pour guild: ${guild.name} (musique en cours)`);
                        
                        // Essayer de récupérer la musique en cours seulement si vraiment en cours
                        const track = voiceManager.getCurrentTrack(guild.id);
                        if (track && voiceManager.isPlaying(guild)) {
                            logger.discord(`🎵 Track trouvée ET en cours: ${track.title}`);
                            currentTrack = track;
                            break;
                        } else if (track) {
                            logger.discord(`❌ Track trouvée mais pas en cours: ${track.title}`);
                        } else {
                            logger.discord(`❌ Aucune track trouvée pour guild: ${guild.name}`);
                        }
                    } else if (voiceManager.isYouTubeConnected(guild)) {
                        logger.discord(`🔍 Guild ${guild.name} connecté YouTube mais pas de musique en cours`);
                    }
                }
            }
            
            let statusText = '/help pour les commandes';
            let statusType = ActivityType.Listening;
            
            if (currentTrack) {
                // Tronquer le titre si trop long (limite Discord: 128 caractères)
                const title = currentTrack.title.length > 50 ? 
                    currentTrack.title.substring(0, 47) + '...' : 
                    currentTrack.title;
                statusText = `🎵 ${title}`;
                statusType = ActivityType.Listening;
                logger.discord(`🎵 Statut musique: ${statusText}`);
            } else if (radioStation) {
                statusText = `📻 ${radioStation}`;
                statusType = ActivityType.Listening;
                logger.discord(`📻 Statut radio: ${statusText}`);
            } else {
                logger.discord(`💤 Statut par défaut: ${statusText}`);
            }
            
            // Ne mettre à jour que si le statut a changé
            if (statusText !== this.currentStatus) {
                this.client.user.setActivity(statusText, { type: statusType });
                this.currentStatus = statusText;
                logger.discord(`Statut mis à jour: ${statusText}`);
            }
            
        } catch (error) {
            logger.error('Erreur lors de la mise à jour du statut:', error);
        }
    }
}

// Initialiser le gestionnaire de statut
const statusManager = new BotStatusManager(client);

// Ajouter statusManager à l'export après initialisation
module.exports.statusManager = statusManager;

// Démarrer le système de monitoring
debugMonitor.startMonitoring();

// Connexion du bot
client.login(process.env.DISCORD_TOKEN).then(async () => {
    logger.success('🎵 Bot Discord Musical 🕲- 𝘮 connecté avec succès!');
    logger.discord(`Connecté en tant que ${client.user.tag}`);
    logger.discord(`Servant ${client.guilds.cache.size} serveurs`);
    logger.discord(`Servant ${client.users.cache.size} utilisateurs`);
    
    // Démarrer le gestionnaire de statut dynamique
    statusManager.start();
    
    // Initialiser le système de leaderboard complet
    try {
        await initializeLeaderboardSystem(client);
        logger.success('📊 Système de leaderboard complet initialisé');
        
        // Initialiser le MusicTracker
        MusicTracker.startCleanup();
        logger.success('🎵 Système de tracking des musiques démarré');
        
        // Système de leaderboard complètement initialisé
        
    } catch (error) {
        logger.error('Erreur lors de l\'initialisation du système de leaderboard:', error);
    }
    
    // Générer un rapport initial (DÉSACTIVÉ URGENCE)
    // setTimeout(() => {
    //     const report = debugMonitor.generateReport();
    //     logger.info('Rapport de démarrage généré', report);
    // }, 5000);
    
}).catch(error => {
    logger.error('Erreur de connexion Discord', error);
    debugMonitor.logError(error, { type: 'discord_connection' });
    process.exit(1);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    logger.error('Exception non capturée', error);
    debugMonitor.logError(error, { type: 'uncaught_exception' });
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promesse rejetée non gérée', reason, { promise: promise.toString() });
    debugMonitor.logError(reason, { type: 'unhandled_rejection', promise: promise.toString() });
});

// Arrêt propre du bot
process.on('SIGINT', () => {
    logger.info('Signal SIGINT reçu, arrêt du bot...');
    statusManager.stop();
    const { stopLeaderboardSystem } = require('./utils/leaderboardInitializer');
    stopLeaderboardSystem();
    debugMonitor.stopMonitoring();
    logger.stopCleanup();
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Signal SIGTERM reçu, arrêt du bot...');
    statusManager.stop();
    const { stopLeaderboardSystem } = require('./utils/leaderboardInitializer');
    stopLeaderboardSystem();
    debugMonitor.stopMonitoring();
    logger.stopCleanup();
    client.destroy();
    process.exit(0);
});
