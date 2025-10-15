const { Events, EmbedBuilder } = require('discord.js');
const chalk = require('chalk');
const voiceManager = require('../utils/voiceManager');
const geniusService = require('../utils/geniusService');
const Logger = require('../utils/advancedLogger');

// Créer une instance du logger pour ce module
const logger = new Logger();

// Map pour stocker les messages à supprimer automatiquement
const autoDeleteMessages = new Map(); // guildId -> array of {message, timestamp, type}

// Fonction pour ajouter un message à la suppression automatique
function addToAutoDelete(guildId, message, type = 'general') {
    if (!autoDeleteMessages.has(guildId)) {
        autoDeleteMessages.set(guildId, []);
    }
    
    autoDeleteMessages.get(guildId).push({
        message: message,
        timestamp: Date.now(),
        type: type
    });
    
    console.log(`📝 Message ajouté à la suppression auto (${type}): ${message.id}`);
}

// Fonction pour nettoyer les anciens messages
async function cleanupOldMessages(guildId) {
    try {
        const messages = autoDeleteMessages.get(guildId);
        if (!messages) return;

        const now = Date.now();
        const twoMinutesAgo = now - 120000; // 2 minutes en millisecondes

        for (let i = messages.length - 1; i >= 0; i--) {
            const msgData = messages[i];
            if (msgData.timestamp < twoMinutesAgo) {
                try {
                    await msgData.message.delete();
                    messages.splice(i, 1);
                    console.log(`🗑️ Message ${msgData.type} supprimé automatiquement`);
                } catch (error) {
                    // Ne pas logger les erreurs de messages déjà supprimés
                    if (error.code !== 10008) { // Unknown Message
                        console.error('Erreur lors de la suppression:', error);
                    }
                    messages.splice(i, 1); // Supprimer de la liste même si la suppression échoue
                }
            }
            }
            } catch (error) {
        console.error('Erreur lors du nettoyage des messages:', error);
    }
}

// Démarrer le nettoyage périodique
setInterval(() => {
    console.log('🧹 Nettoyage périodique des anciens messages...');
    for (const guildId of autoDeleteMessages.keys()) {
        cleanupOldMessages(guildId);
    }
}, 5 * 60 * 1000); // Toutes les 5 minutes

// Système de cooldown pour éviter les interactions multiples
const cooldowns = new Map(); // userId -> timestamp
const COOLDOWN_TIME = 2000; // 2 secondes

// Nettoyer les cooldowns expirés toutes les 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [userId, timestamp] of cooldowns.entries()) {
        if (now - timestamp > COOLDOWN_TIME * 2) { // Garder un peu plus longtemps pour éviter les faux positifs
            cooldowns.delete(userId);
        }
    }
}, 5 * 60 * 1000); // 5 minutes

// Fonction pour vérifier le cooldown
function checkCooldown(userId) {
    const now = Date.now();
    const lastInteraction = cooldowns.get(userId);
    
    if (lastInteraction && (now - lastInteraction) < COOLDOWN_TIME) {
        return false; // En cooldown
    }
    
    cooldowns.set(userId, now);
    return true; // Pas en cooldown
}

// Fonction pour gérer les interactions de manière sécurisée
async function safeInteractionHandler(interaction, handler) {
    try {
        logger.warning(`🔍 Traitement interaction: ${interaction.customId || interaction.commandName}`);
        
        // Vérifier le cooldown
        if (!checkCooldown(interaction.user.id)) {
            logger.warning(`⏳ Cooldown actif pour ${interaction.user.tag}`);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '⏳ Veuillez patienter avant de réutiliser cette commande.',
                    ephemeral: false // Changé en public
                });
            }
            return;
        }

        // Vérifier si l'interaction est encore valide
        if (interaction.expired) {
            logger.warning(`⚠️ Interaction expirée ignorée: ${interaction.customId || interaction.commandName}`);
            return;
        }

        logger.warning(`✅ Exécution du handler pour: ${interaction.customId || interaction.commandName}`);
        await handler(interaction);
        logger.warning(`✅ Handler terminé pour: ${interaction.customId || interaction.commandName}`);
    } catch (error) {
        logger.error(`❌ Erreur dans la gestion sécurisée des interactions:`, error);
        
        // Gestion spécifique des erreurs d'interaction
        if (error.code === 10062 || error.message?.includes('Unknown interaction')) {
            logger.warning(`⚠️ Interaction expirée: ${interaction.customId || interaction.commandName}`);
            return;
        }
        
        if (error.code === 40060) {
            logger.warning(`⚠️ Interaction déjà reconnue: ${interaction.customId || interaction.commandName}`);
            return;
        }

        // Essayer de répondre à l'erreur seulement si l'interaction est encore valide
        try {
            if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors du traitement de votre demande.',
                    ephemeral: false // Changé en public
                });
            } else if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors du traitement de votre demande.'
                });
            }
        } catch (replyError) {
            // Ignorer les erreurs de réponse si l'interaction est expirée
            if (replyError.code !== 10062 && replyError.code !== 40060) {
                console.error('Erreur lors de la réponse à l\'interaction:', replyError);
            }
        }
    }
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Gérer les boutons
        if (interaction.isButton()) {
            logger.warning(`🔘 Bouton cliqué: ${interaction.customId} par ${interaction.user.tag}`);
            
            await safeInteractionHandler(interaction, async (int) => {
                // Extraire le type de bouton et l'ID de musique
                const customId = int.customId;
                let buttonType = '';
                let musicId = '';
                
                logger.warning(`🔍 Parsing customId: ${customId}`);
                
                if (customId === 'lyrics_button' || customId.startsWith('lyrics_button_')) {
                    buttonType = 'lyrics';
                    musicId = customId.replace('lyrics_button_', '') || 'current';
                } else if (customId === 'skip_button' || customId.startsWith('skip_button_')) {
                    buttonType = 'skip';
                    musicId = customId.replace('skip_button_', '') || 'current';
                } else if (customId === 'queue_button' || customId.startsWith('queue_button_')) {
                    buttonType = 'queue';
                    musicId = customId.replace('queue_button_', '') || 'current';
                } else if (customId === 'nowplaying_button' || customId.startsWith('nowplaying_button_')) {
                    buttonType = 'nowplaying';
                    musicId = customId.replace('nowplaying_button_', '') || 'current';
                } else if (customId.startsWith('leaderboard_')) {
                    // Gestion des boutons du leaderboard - laisser passer pour le collecteur de la commande
                    logger.warning(`📊 Bouton leaderboard détecté: ${customId} - laisser passer au collecteur`);
                    return;
                }
                
                logger.warning(`🎯 Résultat parsing: buttonType=${buttonType}, musicId=${musicId}`);
                
                // Vérifier si c'est un bouton de musique valide
                if (buttonType && musicId) {
                    // Vérifier si c'est un bouton de navigation des paroles (à ignorer ici)
                    if (customId.startsWith('lyrics_') && (customId.includes('_next_') || customId.includes('_prev_') || customId.includes('_page_'))) {
                        logger.warning(`🎵 Bouton de navigation paroles ignoré: ${customId}`);
                        return;
                    }
                    
                    logger.warning(`🎵 Bouton de musique détecté: ${buttonType} avec ID: ${musicId}`);
                    
                    // Vérifier si c'est la musique actuelle
                    const currentTrack = voiceManager.getCurrentTrack(int.guild);
                    logger.warning(`🔍 Vérification musique: currentTrack=${currentTrack ? 'TROUVÉ' : 'NULL'}`);
                    logger.warning(`🔍 Bot connecté: ${voiceManager.isConnected(int.guild) ? 'OUI' : 'NON'}`);
                    logger.warning(`🔍 Bot en cours de lecture: ${voiceManager.isPlaying(int.guild) ? 'OUI' : 'NON'}`);
                    
                    // REVENIR À LA LOGIQUE ORIGINALE: Tous les boutons nécessitent une musique en cours
                    if (!currentTrack) {
                        logger.warning(`❌ Aucune musique en cours pour ${int.user.tag}`);
                        return int.reply({
                            content: '❌ Aucune musique n\'est en cours de lecture!',
                            ephemeral: false
                        });
                    }
                    
                    logger.warning(`✅ Musique actuelle trouvée: ${currentTrack.title}`);
                    
                    // Exécuter l'action correspondante (sans validation stricte de l'ID)
                    switch (buttonType) {
                        case 'lyrics':
                            await handleLyricsButton(int);
                            break;
                        case 'skip':
                            await handleSkipButton(int);
                            break;
                        case 'queue':
                            await handleQueueButton(int);
                            break;
                        case 'nowplaying':
                            await handleNowPlayingButton(int);
                            break;
                    }
                }
            });
            return;
        }

        // Gérer les commandes slash
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(chalk.red(`❌ Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`));
            return;
        }

        await safeInteractionHandler(interaction, async (int) => {
            // Ne pas deferReply automatiquement pour les commandes de modération qui gèrent leurs propres réponses
            if (!int.replied && !int.deferred && 
                !['purge', 'nuke'].includes(int.commandName)) {
                await int.deferReply();
            }
            
            await command.execute(int);
            console.log(chalk.green(`✅ Commande ${int.commandName} exécutée par ${int.user.tag}`));
        });
    },
};

async function handleLyricsButton(interaction) {
    logger.warning(`🎵 Début handleLyricsButton pour ${interaction.user.tag}`);
    
    try {
        // Vérifier l'état de l'interaction avant de continuer
        if (interaction.expired) {
            logger.warning('⚠️ Interaction lyrics expirée, ignorée');
            return;
        }

        // Ne pas deferReply si déjà fait par le système parent
        if (!interaction.replied && !interaction.deferred) {
            logger.warning(`🔄 DeferReply pour lyrics par ${interaction.user.tag}`);
            await interaction.deferReply({ ephemeral: false });
        }
    } catch (error) {
        logger.error(`❌ Erreur lors du deferReply lyrics: ${error.message}`);
        return;
    }

    if (!voiceManager.isConnected(interaction.guild)) {
        return interaction.editReply({
            content: '❌ Le bot n\'est pas connecté à un salon vocal!'
        });
    }

    if (!voiceManager.isPlaying(interaction.guild)) {
        return interaction.editReply({
            content: '❌ Aucune musique n\'est en cours de lecture!'
        });
    }

    const track = voiceManager.getCurrentTrack(interaction.guild);

    if (!track) {
        return interaction.editReply({
            content: '❌ Aucune musique n\'est en cours de lecture!'
        });
    }

    try {
        // Améliorer la recherche en simplifiant la requête
        let searchQuery = track.title;
        
        // Nettoyer le titre des mots-clés YouTube
        searchQuery = searchQuery
            .replace(/\[.*?\]/g, '') // Supprimer [Clip Officiel], [Official Video], etc.
            .replace(/\(.*?\)/g, '') // Supprimer (Official), (Music Video), etc.
            .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
            .trim();
        
        // Si on a un artiste, l'ajouter pour améliorer la recherche (mais nettoyer d'abord)
        if (track.uploader && !searchQuery.toLowerCase().includes(track.uploader.toLowerCase())) {
            // Nettoyer l'uploader des mots-clés YouTube
            let cleanUploader = track.uploader
                .replace(/\s*(TV|Officiel|Official|Music|VEVO|VEVO Music|VEVO Music Group)\s*/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            // Ne pas ajouter si c'est trop court ou contient des caractères suspects
            if (cleanUploader.length > 2 && !cleanUploader.match(/^\d+[a-zA-Z]+\d+$/)) {
                searchQuery = `${cleanUploader} ${searchQuery}`;
            }
        }
        
        console.log('🔍 Recherche de paroles pour:', searchQuery);
        
        const songInfo = await geniusService.getSongInfo(searchQuery);
        
        if (!songInfo) {
            // Essayer une recherche plus simple avec juste le titre principal
            const simpleTitle = track.title.split(' - ')[0] || track.title.split(' – ')[0] || track.title;
            console.log('🔄 Tentative avec titre simplifié:', simpleTitle);
            
            const simpleSongInfo = await geniusService.getSongInfo(simpleTitle);
            
            if (!simpleSongInfo) {
                const embed = new EmbedBuilder()
                    .setColor('#ffaa00')
                    .setTitle('❌ Paroles non trouvées')
                    .setDescription(`**${track.title}**\n\nAucune parole trouvée pour cette musique sur Genius.\n\n*Essayez avec une musique plus populaire ou vérifiez l'orthographe.*`)
                    .setThumbnail(track.thumbnail || 'https://via.placeholder.com/150')
                    .setFooter({ text: `Demandé par ${interaction.user.tag}` })
                    .setTimestamp();
                
                const response = await interaction.editReply({ embeds: [embed] });
                
                // Ajouter le message à la suppression automatique
                addToAutoDelete(interaction.guild.id, response, 'lyrics_error');
                
                return response;
            }
            
            // Utiliser le résultat de la recherche simplifiée
            const lyrics = await geniusService.getLyrics(simpleSongInfo.id);
            
            if (!lyrics) {
                const embed = new EmbedBuilder()
                    .setColor('#ffaa00')
                    .setTitle('❌ Paroles non disponibles')
                    .setDescription(`**${simpleSongInfo.title}** par **${simpleSongInfo.artist}**\n\nLes paroles ne sont pas disponibles pour cette musique.`)
                    .setThumbnail(simpleSongInfo.thumbnail || 'https://via.placeholder.com/150')
                    .setFooter({ text: `Demandé par ${interaction.user.tag}` })
                    .setTimestamp();
                
                const response = await interaction.editReply({ embeds: [embed] });
                
                // Ajouter le message à la suppression automatique
                addToAutoDelete(interaction.guild.id, response, 'lyrics_error');
                
                return response;
            }

            // Formater et diviser les paroles de manière plus intelligente
            const formattedLyrics = formatLyrics(lyrics);
            console.log('📝 Paroles formatées:', formattedLyrics.length, 'caractères');
            console.log('📝 Aperçu paroles:', formattedLyrics.substring(0, 200) + '...');
            
            const lyricsParts = splitLyricsIntelligently(formattedLyrics);
            console.log('📄 Nombre de parties créées:', lyricsParts.length);
            lyricsParts.forEach((part, index) => {
                console.log(`📄 Partie ${index + 1}:`, part.length, 'caractères');
            });

            // Créer un système de pagination interactif
            await createLyricsPagination(interaction, simpleSongInfo, lyricsParts, 0);
        }

        // Récupérer les paroles
        const lyrics = await geniusService.getLyrics(songInfo.id);
        
        if (!lyrics) {
            const embed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('❌ Paroles non disponibles')
                .setDescription(`**${songInfo.title}** par **${songInfo.artist}**\n\nLes paroles ne sont pas disponibles pour cette musique.`)
                .setThumbnail(songInfo.thumbnail || 'https://via.placeholder.com/150')
                .setFooter({ text: `Demandé par ${interaction.user.tag}` })
                .setTimestamp();
            
            const response = await interaction.editReply({ embeds: [embed] });
            
            // Ajouter le message à la suppression automatique
            addToAutoDelete(interaction.guild.id, response, 'lyrics_error');
            
            return response;
        }

        // Formater et diviser les paroles de manière plus intelligente
        const formattedLyrics = formatLyrics(lyrics);
        console.log('📝 Paroles formatées:', formattedLyrics.length, 'caractères');
        console.log('📝 Aperçu paroles:', formattedLyrics.substring(0, 200) + '...');
        
        const lyricsParts = splitLyricsIntelligently(formattedLyrics);
        console.log('📄 Nombre de parties créées:', lyricsParts.length);
        lyricsParts.forEach((part, index) => {
            console.log(`📄 Partie ${index + 1}:`, part.length, 'caractères');
        });

        // Créer un système de pagination interactif
        await createLyricsPagination(interaction, songInfo, lyricsParts, 0);

    } catch (error) {
        console.error('Erreur dans la commande lyrics:', error);
        
        // Si c'est une erreur de token non configuré, afficher un message d'aide
        if (error.message.includes('Token Genius non configuré')) {
            const embed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('⚠️ API Genius non configurée')
                .setDescription(`**${track.title}**\n\nPour utiliser les paroles, vous devez configurer un token Genius.\n\n1. Allez sur https://genius.com/api-clients\n2. Créez une application\n3. Ajoutez \`GENIUS_ACCESS_TOKEN\` dans votre fichier .env`)
                .setThumbnail(track.thumbnail || 'https://via.placeholder.com/150')
                .setFooter({ text: `Demandé par ${interaction.user.tag}` })
                .setTimestamp();
            
            const response = await interaction.editReply({ embeds: [embed] });
            
            // Ajouter le message à la suppression automatique
            addToAutoDelete(interaction.guild.id, response, 'lyrics_error');
            
            return response;
        }
        
        return interaction.editReply({
            content: '❌ Impossible de récupérer les paroles pour cette musique!'
        });
    }
}

async function handleSkipButton(interaction) {
    // Vérifier l'état de l'interaction avant de continuer
    if (interaction.expired) {
        console.log(chalk.yellow('⚠️ Interaction skip expirée, ignorée'));
        return;
    }

    try {
        // Ne pas deferReply si déjà fait par le système parent
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({ ephemeral: false });
        }
    } catch (error) {
        logger.error(`❌ Erreur lors du deferReply skip: ${error.message}`);
        return;
    }

    if (!voiceManager.isConnected(interaction.guild)) {
        return interaction.editReply({
            content: '❌ Le bot n\'est pas connecté à un salon vocal!'
        });
    }

    if (!voiceManager.isPlaying(interaction.guild)) {
        return interaction.editReply({
            content: '❌ Aucune musique n\'est en cours de lecture!'
        });
    }

    const currentTrack = voiceManager.getCurrentTrack(interaction.guild);
    const queue = voiceManager.getQueue(interaction.guild);

    if (!currentTrack) {
        return interaction.editReply({
            content: '❌ Aucune musique n\'est en cours de lecture!'
        });
    }

    // Vérifier s'il y a une musique suivante
    if (queue.length === 0) {
        return interaction.editReply({
            content: '❌ Aucune musique suivante dans la queue!'
        });
    }

    try {
        // Passer à la musique suivante
        await voiceManager.skip(interaction.guild);
        
        // Attendre un peu pour que la nouvelle musique soit chargée
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const nextTrack = voiceManager.getCurrentTrack(interaction.guild);
        
        if (nextTrack) {
            // Vérifier que c'est vraiment une nouvelle chanson
            if (currentTrack.title === nextTrack.title) {
                // Si c'est la même chanson, afficher un message différent
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('⏭️ Musique passée')
                    .setDescription(`**${currentTrack.title}**`)
                    .addFields(
                        { name: '👤 **Artiste**', value: nextTrack.uploader || 'Inconnu', inline: true },
                        { name: '⏱️ **Durée**', value: nextTrack.duration ? `${Math.floor(nextTrack.duration / 60)}:${(nextTrack.duration % 60).toString().padStart(2, '0')}` : 'Inconnue', inline: true },
                        { name: '📋 **Queue**', value: `${queue.length - 1} musique${queue.length - 1 > 1 ? 's' : ''} en attente`, inline: true }
                    )
                    .setThumbnail(nextTrack.thumbnail || 'https://via.placeholder.com/150')
                    .setFooter({ text: `Passé par ${interaction.user.tag}` })
                    .setTimestamp();

                const response = await interaction.editReply({ embeds: [embed] });
                
                // Ajouter le message à la suppression automatique
                addToAutoDelete(interaction.guild.id, response, 'skip');
                
                return response;
            } else {
                // Chansons différentes, afficher la transition normale
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('⏭️ Musique passée')
                .setDescription(`**${currentTrack.title}** → **${nextTrack.title}**`)
                .addFields(
                    { name: '👤 **Artiste**', value: nextTrack.uploader || 'Inconnu', inline: true },
                    { name: '⏱️ **Durée**', value: nextTrack.duration ? `${Math.floor(nextTrack.duration / 60)}:${(nextTrack.duration % 60).toString().padStart(2, '0')}` : 'Inconnue', inline: true },
                    { name: '📋 **Queue**', value: `${queue.length - 1} musique${queue.length - 1 > 1 ? 's' : ''} en attente`, inline: true }
                )
                .setThumbnail(nextTrack.thumbnail || 'https://via.placeholder.com/150')
                .setFooter({ text: `Passé par ${interaction.user.tag}` })
                .setTimestamp();

                const response = await interaction.editReply({ embeds: [embed] });
                
                // Ajouter le message à la suppression automatique
                addToAutoDelete(interaction.guild.id, response, 'skip');
                
                return response;
            }
        } else {
            return interaction.editReply({
                content: '✅ Musique passée avec succès!'
            });
        }
    } catch (error) {
        console.error('Erreur lors du skip:', error);
        return interaction.editReply({
            content: '❌ Erreur lors du passage à la musique suivante!'
        });
    }
}

async function handleQueueButton(interaction) {
    // Vérifier l'état de l'interaction avant de continuer
    if (interaction.expired) {
        console.log(chalk.yellow('⚠️ Interaction queue expirée, ignorée'));
        return;
    }

    try {
        // Ne pas deferReply si déjà fait par le système parent
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({ ephemeral: false });
        }
    } catch (error) {
        logger.error(`❌ Erreur lors du deferReply queue: ${error.message}`);
        return;
    }

    if (!voiceManager.isConnected(interaction.guild)) {
        return interaction.editReply({
            content: '❌ Le bot n\'est pas connecté à un salon vocal!'
        });
    }

    const queue = voiceManager.getQueue(interaction.guild);
    const currentTrack = voiceManager.getCurrentTrack(interaction.guild);

    if (queue.length === 0 && !currentTrack) {
        return interaction.editReply({
            content: '❌ Aucune musique dans la queue!'
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('📋 Queue de musique')
        .setTimestamp();

    if (currentTrack) {
        embed.addFields({
            name: '🎵 **En cours de lecture**',
            value: `**${currentTrack.title}**\n👤 ${currentTrack.uploader || 'Inconnu'}\n⏱️ ${currentTrack.duration ? `${Math.floor(currentTrack.duration / 60)}:${(currentTrack.duration % 60).toString().padStart(2, '0')}` : 'Inconnue'}`,
            inline: false
        });
    }

    if (queue.length > 0) {
        let queueText = '';
        queue.slice(0, 10).forEach((track, index) => {
            queueText += `**${index + 1}.** ${track.title}\n👤 ${track.uploader || 'Inconnu'}\n⏱️ ${track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : 'Inconnue'}\n\n`;
        });

        if (queue.length > 10) {
            queueText += `... et ${queue.length - 10} autres musiques`;
        }

        embed.addFields({
            name: `📝 **Queue (${queue.length} musiques)**`,
            value: queueText,
            inline: false
        });
    }

    embed.setFooter({ text: `Demandé par ${interaction.user.tag}` });

    return interaction.editReply({ embeds: [embed] });
}

async function handleNowPlayingButton(interaction) {
    // Vérifier l'état de l'interaction avant de continuer
    if (interaction.expired) {
        console.log(chalk.yellow('⚠️ Interaction nowplaying expirée, ignorée'));
        return;
    }

    try {
        // Ne pas deferReply si déjà fait par le système parent
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({ ephemeral: false });
        }
    } catch (error) {
        logger.error(`❌ Erreur lors du deferReply nowplaying: ${error.message}`);
        return;
    }

    if (!voiceManager.isConnected(interaction.guild)) {
        return interaction.editReply({
            content: '❌ Le bot n\'est pas connecté à un salon vocal!'
        });
    }

    if (!voiceManager.isPlaying(interaction.guild)) {
        return interaction.editReply({
            content: '❌ Aucune musique n\'est en cours de lecture!'
        });
    }

    const currentTrack = voiceManager.getCurrentTrack(interaction.guild);
    const queue = voiceManager.getQueue(interaction.guild);
    const volume = voiceManager.getVolume(interaction.guild);
    const loopMode = voiceManager.getLoopMode(interaction.guild);
    const shuffleState = voiceManager.getShuffleState(interaction.guild);

    if (!currentTrack) {
        return interaction.editReply({
            content: '❌ Aucune musique n\'est en cours de lecture!'
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🎵 Now Playing')
        .setDescription(`**[${currentTrack.title}](${currentTrack.url})**`)
        .addFields(
            { name: '👤 **Artiste**', value: currentTrack.uploader || 'Inconnu', inline: true },
            { name: '⏱️ **Durée**', value: currentTrack.duration ? `${Math.floor(currentTrack.duration / 60)}:${(currentTrack.duration % 60).toString().padStart(2, '0')}` : 'Inconnue', inline: true },
            { name: '🔊 **Volume**', value: `${volume || 100}%`, inline: true },
            { name: '🔄 **Mode**', value: loopMode || 'Normal', inline: true },
            { name: '🔀 **Shuffle**', value: shuffleState ? 'Activé' : 'Désactivé', inline: true },
            { name: '📋 **Queue**', value: `${queue.length} musique${queue.length > 1 ? 's' : ''} en attente`, inline: true }
        )
        .setThumbnail(currentTrack.thumbnail || 'https://via.placeholder.com/150')
        .setFooter({ text: `Demandé par ${interaction.user.tag}` })
        .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
}

// Fonctions utilitaires pour le formatage des paroles (copiées de lyrics.js)
function formatLyrics(lyrics) {
    if (!lyrics || typeof lyrics !== 'string') {
        return '';
    }
    
    console.log('🔍 Paroles brutes reçues:', lyrics.length, 'caractères');
    
    // Formatage minimal - juste nettoyer les espaces sans tronquer
    const formatted = lyrics
        .replace(/\r\n/g, '\n') // Normaliser les retours à la ligne
        .replace(/\r/g, '\n')   // Normaliser les retours à la ligne
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Réduire les espaces multiples entre paragraphes
        .replace(/[ \t]+/g, ' ') // Réduire les espaces multiples
        .trim();
    
    console.log('✅ Paroles formatées:', formatted.length, 'caractères');
    return formatted;
}

// Fonction pour créer une barre de progression visuelle
function createProgressBar(current, total) {
    const percentage = Math.round((current / total) * 100);
    const filledBlocks = Math.round((current / total) * 10);
    const emptyBlocks = 10 - filledBlocks;
    
    const filled = '█'.repeat(filledBlocks);
    const empty = '░'.repeat(emptyBlocks);
    
    return `\`${filled}${empty}\` ${percentage}%`;
}

// Fonction pour optimiser l'affichage des très longues paroles
function optimizeLongLyricsDisplay(lyricsParts, currentPage) {
    // Pour les très longues paroles (>50 pages), utiliser une stratégie d'affichage optimisée
    if (lyricsParts.length > 50) {
        console.log('📚 Optimisation d\'affichage pour très longues paroles');
        
        // Créer un résumé des sections principales
        const sections = [];
        const sectionSize = Math.ceil(lyricsParts.length / 10); // Diviser en 10 sections
        
        for (let i = 0; i < 10; i++) {
            const startPage = i * sectionSize;
            const endPage = Math.min((i + 1) * sectionSize - 1, lyricsParts.length - 1);
            
            if (startPage < lyricsParts.length) {
                const sectionContent = lyricsParts.slice(startPage, endPage + 1).join('\n\n');
                const preview = sectionContent.substring(0, 200) + (sectionContent.length > 200 ? '...' : '');
                
                sections.push({
                    startPage,
                    endPage,
                    preview: preview.replace(/\n/g, ' ').trim()
                });
            }
        }
        
        return {
            isOptimized: true,
            sections,
            currentSection: Math.floor(currentPage / sectionSize)
        };
    }
    
    return { isOptimized: false };
}

// Fonction pour créer une barre de progression avancée
function createAdvancedProgressBar(current, total) {
    const percentage = Math.round((current / total) * 100);
    const filledBlocks = Math.round((current / total) * 20); // Barre plus longue
    const emptyBlocks = 20 - filledBlocks;
    
    const filled = '█'.repeat(filledBlocks);
    const empty = '░'.repeat(emptyBlocks);
    
    // Ajouter des indicateurs de sections pour très longues paroles
    let sectionIndicators = '';
    if (total > 20) {
        const sectionSize = Math.ceil(total / 4);
        for (let i = 0; i < 4; i++) {
            const sectionStart = i * sectionSize;
            const sectionEnd = Math.min((i + 1) * sectionSize - 1, total - 1);
            const isCurrentSection = current >= sectionStart && current <= sectionEnd;
            sectionIndicators += isCurrentSection ? '🔸' : '⚪';
        }
    }
    
    return `\`${filled}${empty}\` ${percentage}%${sectionIndicators ? `\n${sectionIndicators}` : ''}`;
}

// Fonction pour formater les paroles pour un affichage élégant
function formatLyricsForDisplay(lyrics, songInfo, currentPage, totalPages) {
    if (!lyrics || lyrics.length === 0) return 'Aucune paroles disponibles';
    
    console.log('🎨 DEBUG - Formatage des paroles pour affichage...');
    console.log('📝 Paroles brutes:', lyrics.substring(0, 200) + '...');
    
    // Diviser les paroles en lignes et nettoyer
    const lines = lyrics.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const formattedLines = [];
    
    // Créer un header centré et élégant
    const titleLength = songInfo.title.length;
    const artistLength = songInfo.artist.length;
    const maxWidth = 50; // Réduire pour éviter les débordements
    
    // Centrer le titre
    const titlePadding = Math.max(0, Math.floor((maxWidth - titleLength) / 2));
    const centeredTitle = ' '.repeat(titlePadding) + `🎵 **${songInfo.title}**`;
    formattedLines.push(centeredTitle);
    
    // Centrer l'artiste
    const artistPadding = Math.max(0, Math.floor((maxWidth - artistLength - 4) / 2));
    const centeredArtist = ' '.repeat(artistPadding) + `🎤 par **${songInfo.artist}**`;
    formattedLines.push(centeredArtist);
    
    formattedLines.push(''); // Ligne vide
    
    // Ajouter une séparateur décoratif centré
    const separatorLength = Math.min(30, Math.max(titleLength, artistLength) + 2);
    const separatorPadding = Math.max(0, Math.floor((maxWidth - separatorLength) / 2));
    const separator = '─'.repeat(separatorLength);
    formattedLines.push(' '.repeat(separatorPadding) + `**${separator}**`);
    formattedLines.push(''); // Ligne vide
    
    // Traiter chaque ligne de paroles avec formatage amélioré
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Nettoyer la ligne
        line = cleanLyricsLine(line);
        
        if (!line || line.length === 0) {
            formattedLines.push(''); // Ligne vide
            continue;
        }
        
        // Détecter les timecodes
        const timecodeMatch = line.match(/^\[(\d{1,2}:\d{2})\]/);
        if (timecodeMatch) {
            // Ligne avec timecode - formatage spécial
            const timecode = timecodeMatch[1];
            const text = line.replace(/^\[\d{1,2}:\d{2}\]\s*/, '').trim();
            
            if (text.length > 0) {
                formattedLines.push(`**${timecode}** ${text}`);
            } else {
                formattedLines.push(`**${timecode}**`);
            }
        } else if (line.includes('[') && line.includes(']')) {
            // Section (Couplet, Refrain, etc.) - centrer en gras
            const padding = Math.max(0, Math.floor((maxWidth - line.length) / 2));
            const centeredSection = ' '.repeat(padding) + `**${line}**`;
            formattedLines.push(centeredSection);
        } else if (line.length < 35) {
            // Ligne courte - centrer avec italique
            const padding = Math.max(0, Math.floor((maxWidth - line.length) / 2));
            const centeredLine = ' '.repeat(padding) + `*${line}*`;
            formattedLines.push(centeredLine);
        } else {
            // Ligne normale - formatage standard avec indentation
            const indentedLine = '  ' + line;
            formattedLines.push(indentedLine);
        }
        
        // Ajouter une ligne vide après chaque ligne importante
        if (line.includes('[') && line.includes(']')) {
            formattedLines.push('');
        }
    }
    
    // Ajouter un footer centré avec informations
    formattedLines.push(''); // Ligne vide
    const footerText = `📄 Page ${currentPage + 1}/${totalPages} • 🎤 Source: Genius`;
    const footerPadding = Math.max(0, Math.floor((maxWidth - footerText.length) / 2));
    const centeredFooter = ' '.repeat(footerPadding) + `*${footerText}*`;
    formattedLines.push(centeredFooter);
    
    const result = formattedLines.join('\n');
    console.log('🎨 DEBUG - Résultat formaté:', result.substring(0, 200) + '...');
    
    return result;
}

// Fonction pour nettoyer une ligne de paroles
function cleanLyricsLine(line) {
    if (!line) return '';
    
    // Séparer les mots collés
    line = line.replace(/([a-z])([A-Z])/g, '$1 $2');
    line = line.replace(/([a-z])([0-9])/g, '$1 $2');
    line = line.replace(/([0-9])([a-z])/g, '$1 $2');
    
    // Corriger les espaces et la ponctuation
    line = line.replace(/\s+([,.!?;:])/g, '$1');
    line = line.replace(/([,.!?;:])(?!\s)/g, '$1 ');
    line = line.replace(/\s+/g, ' ');
    
    // Corriger les apostrophes
    line = line.replace(/'/g, "'");
    
    return line.trim();
}

// Fonction spécialisée pour diviser les très longues paroles
function splitLongLyrics(lyrics, maxLength) {
    console.log('📚 Division optimisée pour paroles très longues');
    
    // Diviser par sections logiques (couplets, refrains, etc.)
    const sections = lyrics.split(/\n\s*\n/); // Diviser par paragraphes vides
    const parts = [];
    let currentPart = '';
    
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (!section) continue;
        
        // Si une section seule dépasse la limite, la diviser
        if (section.length > maxLength) {
            // Sauvegarder la partie actuelle si elle n'est pas vide
            if (currentPart.trim()) {
                parts.push(currentPart.trim());
                currentPart = '';
            }
            
            // Diviser cette section trop longue
            const subParts = splitOversizedSection(section, maxLength);
            parts.push(...subParts);
        } else {
            // Vérifier si ajouter cette section dépasse la limite
            const testLength = currentPart + (currentPart ? '\n\n' : '') + section;
            
            if (testLength.length > maxLength && currentPart.trim()) {
                // Sauvegarder la partie actuelle
                parts.push(currentPart.trim());
                currentPart = section;
            } else {
                // Ajouter à la partie actuelle
                currentPart = testLength;
            }
        }
    }
    
    // Ajouter la dernière partie si elle n'est pas vide
    if (currentPart.trim()) {
        parts.push(currentPart.trim());
    }
    
    console.log(`📚 Paroles très longues divisées en ${parts.length} parties`);
    return parts;
}

// Fonction pour diviser une section trop longue
function splitOversizedSection(section, maxLength) {
    const lines = section.split('\n');
    const parts = [];
    let currentPart = '';
    
    for (const line of lines) {
        const testLength = currentPart + (currentPart ? '\n' : '') + line;
        
        if (testLength.length > maxLength && currentPart.trim()) {
            parts.push(currentPart.trim());
            currentPart = line;
                    } else {
            currentPart = testLength;
        }
    }
    
    if (currentPart.trim()) {
        parts.push(currentPart.trim());
    }
    
    return parts;
}

function splitLyricsIntelligently(lyrics) {
    const maxLength = 800; // Limite réduite pour éviter les erreurs Discord (1024 max, on prend 800 pour être sûr)
    const parts = [];
    
    console.log('🔍 Début splitLyricsIntelligently avec:', lyrics.length, 'caractères');
    
    if (!lyrics || lyrics.length === 0) {
        console.log('❌ Paroles vides ou nulles');
        return ['Aucune paroles trouvées'];
    }

    // Nettoyer et préparer les paroles
    const cleanLyrics = lyrics.trim();
    console.log('🧹 Paroles nettoyées:', cleanLyrics.length, 'caractères');
    
    // Si les paroles sont courtes, les retourner en une seule partie
    if (cleanLyrics.length <= maxLength) {
        console.log('📄 Paroles courtes, une seule partie');
        return [cleanLyrics];
    }
    
    // Pour les très longues paroles (>5000 caractères), utiliser une stratégie différente
    if (cleanLyrics.length > 5000) {
        console.log('📚 Paroles très longues détectées, utilisation de la stratégie optimisée');
        return splitLongLyrics(cleanLyrics, maxLength);
    }
    
    // Diviser les paroles en lignes pour un meilleur contrôle
    const lines = cleanLyrics.split('\n');
    console.log('📝 Nombre de lignes:', lines.length);
    
    let currentPart = '';
    let currentLength = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineLength = line.length;
        
        // Calculer la longueur avec le retour à la ligne
        const totalLength = currentLength + lineLength + (currentPart ? 1 : 0);
        
        // Si ajouter cette ligne dépasse la limite
        if (totalLength > maxLength && currentPart.trim()) {
            // Sauvegarder la partie actuelle
            console.log(`📄 Création partie ${parts.length + 1} avec ${currentPart.length} caractères`);
                parts.push(currentPart.trim());
            
            // Commencer une nouvelle partie
            currentPart = line;
            currentLength = lineLength;
        } else {
            // Ajouter la ligne à la partie actuelle
            if (currentPart) {
                currentPart += '\n' + line;
                currentLength = totalLength;
            } else {
                currentPart = line;
                currentLength = lineLength;
            }
        }
        
        // Si une ligne seule est trop longue, la diviser par mots
        if (lineLength > maxLength) {
            console.log(`⚠️ Ligne trop longue détectée: ${lineLength} caractères`);
                const words = line.split(' ');
                let currentLine = '';
            let wordLength = 0;
                
                for (const word of words) {
                const wordWithSpace = wordLength > 0 ? ' ' + word : word;
                const newLength = wordLength + wordWithSpace.length;
                
                if (newLength > maxLength && currentLine.trim()) {
                    // Sauvegarder la ligne actuelle
                    if (currentPart.trim()) {
                        console.log(`📄 Création partie ${parts.length + 1} avec ${currentPart.length} caractères`);
                        parts.push(currentPart.trim());
                    }
                    currentPart = currentLine.trim();
                    currentLength = wordLength;
                    currentLine = word;
                    wordLength = word.length;
                    } else {
                    currentLine += wordWithSpace;
                    wordLength = newLength;
                }
            }
            
            // Mettre à jour la partie actuelle avec la ligne reconstruite
            currentPart = currentLine.trim();
            currentLength = wordLength;
        }
    }
    
    // Ajouter la dernière partie si elle n'est pas vide
    if (currentPart.trim()) {
        console.log(`📄 Création partie finale ${parts.length + 1} avec ${currentPart.length} caractères`);
        parts.push(currentPart.trim());
    }

    // S'assurer qu'on a au moins une partie
    if (parts.length === 0) {
        console.log('⚠️ Aucune partie créée, utilisation des paroles complètes');
        parts.push(cleanLyrics);
    }
    
    console.log(`✅ Split terminé: ${parts.length} parties créées`);
    const totalChars = parts.reduce((total, part) => total + part.length, 0);
    console.log(`📊 Total caractères dans toutes les parties: ${totalChars}`);
    
    return parts;
}

// Fonction pour créer un système de pagination interactif pour les paroles
async function createLyricsPagination(interaction, songInfo, lyricsParts, currentPage = 0) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    // Vérifier si on a besoin de pagination
    if (lyricsParts.length <= 1) {
        // Pas besoin de pagination, afficher directement
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🎵 Paroles de la chanson')
            .setDescription(`**${songInfo.title}** par **${songInfo.artist}**`)
            .setThumbnail(songInfo.thumbnail || 'https://via.placeholder.com/150')
            .setFooter({ 
                text: `🎤 Source: Genius • Paroles complètes (${lyricsParts[0].length} caractères) • Demandé par ${interaction.user.tag}`,
                iconURL: 'https://genius.com/favicon.ico'
            })
            .setTimestamp()
            .addFields({
                name: `🎵 Paroles complètes (${lyricsParts[0].length} caractères)`,
                value: `\`\`\`\n${lyricsParts[0]}\n\`\`\``,
                inline: false
            });
        
        const response = await interaction.editReply({ embeds: [embed] });
        
        // Ajouter le message à la suppression automatique
        addToAutoDelete(interaction.guild.id, response, 'lyrics');
        
        return response;
    }
    
    // Créer l'embed avec pagination
    // Créer l'embed avec les informations de la chanson
    const totalCharacters = lyricsParts.reduce((total, part) => total + part.length, 0);
    const progressBar = lyricsParts.length > 20 ? 
        createAdvancedProgressBar(currentPage + 1, lyricsParts.length) : 
        createProgressBar(currentPage + 1, lyricsParts.length);
    
    // Informations supplémentaires pour très longues paroles
    let additionalInfo = '';
    if (lyricsParts.length > 20) {
        const sectionSize = Math.ceil(lyricsParts.length / 4);
        const currentSection = Math.floor(currentPage / sectionSize) + 1;
        additionalInfo = `\n📖 **Section:** ${currentSection}/4`;
    }
    
    // Optimisation pour très longues paroles (>50 pages)
    const optimization = optimizeLongLyricsDisplay(lyricsParts, currentPage);
    if (optimization.isOptimized) {
        additionalInfo += `\n📚 **Mode optimisé** pour ${lyricsParts.length} pages`;
    }
    
    const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🎵 Paroles de la chanson')
        .setDescription(`**${songInfo.title}** par **${songInfo.artist}**\n\n${progressBar}${additionalInfo}`)
        .setThumbnail(songInfo.thumbnail || 'https://via.placeholder.com/150')
        .addFields({
            name: '📊 Informations',
            value: `📄 **Pages:** ${lyricsParts.length}\n📝 **Caractères:** ${totalCharacters.toLocaleString()}\n🎤 **Source:** Genius`,
            inline: true
        })
        .setFooter({ 
            text: `Page ${currentPage + 1}/${lyricsParts.length} • Demandé par ${interaction.user.tag}`,
            iconURL: 'https://genius.com/favicon.ico'
        })
        .setTimestamp();
    
    // Ajouter les paroles de la page actuelle (vérifier la limite de 1024 caractères)
    const colors = ['🎵', '🎶', '🎼', '🎭', '🌉', '🎤'];
    const colorEmoji = colors[currentPage % colors.length];
    
    // Utiliser directement le contenu optimisé de Genius
    let lyricsContent;
    try {
        lyricsContent = lyricsParts[currentPage];
        
        console.log(`📝 Paroles optimisées: ${lyricsContent.length} caractères`);
        console.log(`📄 Contenu de la page ${currentPage + 1}:`, lyricsContent.substring(0, 200) + '...');
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des paroles:', error);
        lyricsContent = lyricsParts[currentPage];
    }
    
    // Vérifier la limite Discord de 1024 caractères
    if (lyricsContent.length > 1024) {
        lyricsContent = lyricsContent.substring(0, 1020) + '...';
        console.log(`⚠️ Contenu tronqué: ${lyricsContent.length} caractères`);
    }
    
    const fieldName = `${colorEmoji} Paroles (Page ${currentPage + 1}/${lyricsParts.length})`;
    
    embed.addFields({
        name: fieldName,
        value: lyricsContent,
        inline: false
    });
    
    // Créer les boutons de navigation principaux
    const mainRow = new ActionRowBuilder();
    
    // Bouton Première page (si pas sur la première)
    if (currentPage > 0) {
        mainRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`lyrics_first_${interaction.user.id}`)
                .setLabel('Début')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⏮️')
        );
    }
    
    // Bouton Précédent
    if (currentPage > 0) {
        mainRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`lyrics_prev_${interaction.user.id}_${currentPage}`)
                .setLabel('Précédent')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
        );
    }
    
    // Bouton Page Actuelle (pour info)
    mainRow.addComponents(
        new ButtonBuilder()
            .setCustomId(`lyrics_page_${interaction.user.id}_${currentPage}`)
                .setLabel(`${currentPage + 1}/${lyricsParts.length}`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📄')
            .setDisabled(true)
    );
    
    // Bouton Suivant
    if (currentPage < lyricsParts.length - 1) {
        mainRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`lyrics_next_${interaction.user.id}_${currentPage}`)
                .setLabel('Suivant')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('▶️')
        );
    }
    
    // Bouton Dernière page (si pas sur la dernière)
    if (currentPage < lyricsParts.length - 1) {
        mainRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`lyrics_last_${interaction.user.id}`)
                .setLabel('Fin')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⏭️')
        );
    }
    
    // Créer la deuxième rangée avec navigation rapide et contrôles
    const controlRow = new ActionRowBuilder();
    
    // Navigation rapide (si plus de 3 pages)
    if (lyricsParts.length > 3) {
        // Bouton -5 pages
        if (currentPage >= 5) {
            controlRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`lyrics_jump_prev_${interaction.user.id}_${currentPage}`)
                    .setLabel('-5')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏪')
            );
        }
        
        // Bouton +5 pages
        if (currentPage < lyricsParts.length - 5) {
            controlRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`lyrics_jump_next_${interaction.user.id}_${currentPage}`)
                    .setLabel('+5')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏩')
            );
        }
    }
    
    // Navigation par sections pour très longues paroles (>20 pages)
    if (lyricsParts.length > 20) {
        const sectionSize = Math.ceil(lyricsParts.length / 4); // Diviser en 4 sections
        const currentSection = Math.floor(currentPage / sectionSize);
        
        // Bouton Section précédente
        if (currentSection > 0) {
            const prevSectionStart = (currentSection - 1) * sectionSize;
            controlRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`lyrics_section_prev_${interaction.user.id}_${prevSectionStart}`)
                    .setLabel('Section -')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📖')
            );
        }
        
        // Bouton Section suivante
        if (currentSection < 3) {
            const nextSectionStart = (currentSection + 1) * sectionSize;
            controlRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`lyrics_section_next_${interaction.user.id}_${nextSectionStart}`)
                    .setLabel('Section +')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📖')
            );
        }
    }
    
    // Bouton Fermer
    controlRow.addComponents(
        new ButtonBuilder()
            .setCustomId(`lyrics_close_${interaction.user.id}`)
        .setLabel('Fermer')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );
    
    // Assembler les composants
    const components = [mainRow];
    if (controlRow.components.length > 0) {
        components.push(controlRow);
    }
    
    const response = await interaction.editReply({ 
        embeds: [embed], 
        components: components
    });
    
    // Ajouter le message à la suppression automatique
    addToAutoDelete(interaction.guild.id, response, 'lyrics');
    
    // Créer un collector pour gérer les interactions des boutons
    const filter = (buttonInteraction) => {
        return buttonInteraction.user.id === interaction.user.id && 
               buttonInteraction.customId.startsWith('lyrics_');
    };
    
    const collector = response.createMessageComponentCollector({ 
        filter, 
        time: 300000 // 5 minutes
    });
    
    collector.on('collect', async (buttonInteraction) => {
        try {
            const customId = buttonInteraction.customId;
            console.log(`🔍 Parsing customId lyrics: ${customId}`);
            
            // Vérifier si l'interaction n'est pas expirée
            if (buttonInteraction.expired) {
                console.log('⚠️ Interaction expirée, ignorée');
                return;
            }
            
            let newPage = currentPage;
            
            if (customId.startsWith('lyrics_prev_')) {
                // Format: lyrics_prev_userId_page
                const parts = customId.split('_');
                if (parts.length >= 4) {
                    newPage = parseInt(parts[3]) - 1;
                }
            } else if (customId.startsWith('lyrics_next_')) {
                // Format: lyrics_next_userId_page
                const parts = customId.split('_');
                if (parts.length >= 4) {
                    newPage = parseInt(parts[3]) + 1;
                }
            } else if (customId.startsWith('lyrics_first_')) {
                newPage = 0;
            } else if (customId.startsWith('lyrics_last_')) {
                newPage = lyricsParts.length - 1;
            } else if (customId.startsWith('lyrics_jump_prev_')) {
                const parts = customId.split('_');
                if (parts.length >= 5) {
                    const currentPageNum = parseInt(parts[4]);
                    newPage = Math.max(0, currentPageNum - 5);
                }
            } else if (customId.startsWith('lyrics_jump_next_')) {
                const parts = customId.split('_');
                if (parts.length >= 5) {
                    const currentPageNum = parseInt(parts[4]);
                    newPage = Math.min(lyricsParts.length - 1, currentPageNum + 5);
                }
            } else if (customId.startsWith('lyrics_section_prev_')) {
                // Navigation vers section précédente
                const parts = customId.split('_');
                if (parts.length >= 4) {
                    newPage = parseInt(parts[3]) || 0;
                }
            } else if (customId.startsWith('lyrics_section_next_')) {
                // Navigation vers section suivante
                const parts = customId.split('_');
                if (parts.length >= 4) {
                    newPage = parseInt(parts[3]) || 0;
                }
            } else if (customId.startsWith('lyrics_close_')) {
                try {
                    await buttonInteraction.deferUpdate();
                    
                    // Créer un embed de fermeture élégant
                    const closeEmbed = new EmbedBuilder()
                        .setColor('#666666')
                        .setTitle('🎵 Paroles fermées')
                        .setDescription('Les paroles ont été fermées avec succès.')
                        .setFooter({ 
                            text: `Fermé par ${buttonInteraction.user.tag}`,
                            iconURL: 'https://genius.com/favicon.ico'
                        })
                        .setTimestamp();
                    
                    // Désactiver tous les boutons
                    const disabledRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('lyrics_disabled')
                                .setLabel('Fermé')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        );
                    
                    await buttonInteraction.editReply({ 
                        embeds: [closeEmbed], 
                        components: [disabledRow] 
                    });
                    return;
                } catch (closeError) {
                    console.error('❌ Erreur lors de la fermeture:', closeError);
                    // Si l'erreur persiste, essayer de supprimer le message
                    try {
                        await buttonInteraction.deleteReply();
                    } catch (deleteError) {
                        console.error('❌ Impossible de supprimer le message:', deleteError);
                    }
                    return;
                }
            } else if (customId.startsWith('lyrics_page_')) {
                // Bouton de page actuelle, ne rien faire
                return;
            }
            
            // Vérifier que la nouvelle page est valide
            if (newPage >= 0 && newPage < lyricsParts.length) {
                console.log(`📄 Navigation vers la page ${newPage + 1}/${lyricsParts.length}`);
                await buttonInteraction.deferUpdate();
                await createLyricsPagination(buttonInteraction, songInfo, lyricsParts, newPage);
        } else {
                console.log(`⚠️ Page invalide: ${newPage}`);
            }
            
        } catch (error) {
            console.error('❌ Erreur dans le collector de paroles:', error);
            
            // Ne pas afficher de message d'erreur si l'interaction est déjà traitée
            if (error.code === 40060) { // Interaction has already been acknowledged
                console.log('⚠️ Interaction déjà traitée, ignorée');
                return;
            }
            
            try {
                if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                    await buttonInteraction.deferUpdate();
                }
                await buttonInteraction.editReply({
                    content: '❌ Erreur lors de la navigation des paroles',
                    embeds: [],
                    components: []
                });
            } catch (editError) {
                console.error('❌ Erreur lors de l\'édition de la réponse:', editError);
            }
        }
    });
    
    collector.on('end', async () => {
        try {
            // Désactiver tous les boutons quand le collector se termine
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('lyrics_expired')
                        .setLabel('⏰ Session expirée')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );
            
            await response.edit({ 
                embeds: [embed], 
                components: [disabledRow] 
            });
        } catch (error) {
            // Ignorer les erreurs si le message a été supprimé
        }
    });
}


