const fs = require('fs').promises;
const path = require('path');
const Logger = require('./advancedLogger');

// Créer une instance du logger pour ce module
const logger = new Logger();

// Chemin vers le fichier de données
const DATA_FILE = path.join(__dirname, '../data/leaderboard.json');

// Variables globales pour le tracking
let trackingData = {
    botPlayTime: 0,
    userPresence: {},
    userMessages: {},
    botMessages: {},
    lastUpdate: Date.now(),
    botStartTime: Date.now(),
    isTracking: false
};

// Timer pour la mise à jour automatique
let updateTimer = null;
let trackingTimer = null;

// Fonction pour charger les données
async function loadData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const parsedData = JSON.parse(data);
        
        // Initialiser les données si elles n'existent pas
        if (!parsedData.botStartTime) {
            parsedData.botStartTime = Date.now();
        }
        if (!parsedData.isTracking) {
            parsedData.isTracking = false;
        }
        
        trackingData = { ...trackingData, ...parsedData };
        return trackingData;
    } catch (error) {
        // Créer le fichier s'il n'existe pas
        const defaultData = {
            botPlayTime: 0,
            userPresence: {},
            userMessages: {},
            botMessages: {},
            lastUpdate: Date.now(),
            botStartTime: Date.now(),
            isTracking: false
        };
        trackingData = defaultData;
        await saveData();
        return trackingData;
    }
}

// Fonction pour sauvegarder les données
async function saveData() {
    try {
        // Créer le dossier data s'il n'existe pas
        const dataDir = path.dirname(DATA_FILE);
        await fs.mkdir(dataDir, { recursive: true });
        
        trackingData.lastUpdate = Date.now();
        await fs.writeFile(DATA_FILE, JSON.stringify(trackingData, null, 2));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des données:', error);
    }
}

// Fonction pour démarrer le tracking automatique
function startAutoTracking(client) {
    if (trackingData.isTracking) {
        logger.warning('🔄 Tracking automatique déjà en cours...');
        return;
    }
    
    logger.success('🚀 Démarrage du tracking automatique du leaderboard...');
    trackingData.isTracking = true;
    trackingData.botStartTime = Date.now();
    
    // Timer pour la mise à jour automatique toutes les 30 secondes
    updateTimer = setInterval(async () => {
        try {
            await updateBotPlayTime();
            await saveData();
            logger.success('📊 Leaderboard mis à jour automatiquement');
        } catch (error) {
            logger.error('Erreur lors de la mise à jour automatique:', error);
        }
    }, 30000); // 30 secondes
    
    // Timer pour le tracking continu (toutes les 15 secondes)
    trackingTimer = setInterval(async () => {
        try {
            await updateContinuousTracking(client);
            // Log seulement si des utilisateurs sont trackés
        } catch (error) {
            logger.error('Erreur lors du tracking continu:', error);
        }
    }, 15000); // 15 secondes
    
    // Premier tracking immédiat
    updateContinuousTracking(client);
    
    logger.success('✅ Tracking automatique démarré avec succès');
}

// Fonction pour arrêter le tracking automatique
function stopAutoTracking() {
    if (!trackingData.isTracking) {
        return;
    }
    
    console.log('🛑 Arrêt du tracking automatique...');
    trackingData.isTracking = false;
    
    if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
    }
    
    if (trackingTimer) {
        clearInterval(trackingTimer);
        trackingTimer = null;
    }
    
    console.log('✅ Tracking automatique arrêté');
}

// Fonction pour mettre à jour le temps de diffusion du bot
async function updateBotPlayTime() {
    const currentTime = Date.now();
    const timeSinceStart = Math.floor((currentTime - trackingData.botStartTime) / 1000);
    
    // Estimer le temps de diffusion basé sur l'uptime (30% du temps en moyenne)
    const estimatedPlayTime = Math.floor(timeSinceStart * 0.3);
    trackingData.botPlayTime = estimatedPlayTime;
}

// Fonction pour le tracking continu
async function updateContinuousTracking(client) {
    let totalUsersTracked = 0;
    let totalGuildsProcessed = 0;
    
    logger.info('🔄 Début du tracking continu...');
    
    // Tracker TOUS les utilisateurs en vocal sur TOUS les serveurs, même si le bot n'est pas connecté
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            totalGuildsProcessed++;
            
            // Récupérer tous les salons vocaux du serveur
            const voiceChannels = guild.channels.cache.filter(channel => 
                channel.type === 2 && channel.members.size > 0 // Voice channels avec des membres
            );
            
            logger.info(`🏠 Serveur ${guild.name}: ${voiceChannels.size} salons vocaux actifs`);
            
            // Tracker tous les utilisateurs dans tous les salons vocaux
            voiceChannels.forEach(channel => {
                logger.info(`🎤 Salon ${channel.name}: ${channel.members.size} membres`);
                channel.members.forEach(member => {
                    // Tracker TOUS les membres (utilisateurs ET bots)
                    updateUserPresence(member.id, 30); // +30 secondes
                    totalUsersTracked++;
                    
                    if (member.user.bot) {
                        logger.info(`🤖 Tracking BOT: ${member.user.tag} dans ${channel.name}`);
                    } else {
                        logger.info(`👤 Tracking USER: ${member.user.tag} dans ${channel.name}`);
                    }
                });
            });
        } catch (error) {
            logger.error(`Erreur lors du tracking du serveur ${guildId}:`, error);
        }
    }
    
    // Log des statistiques de tracking
    logger.info(`📊 Tracking: ${totalUsersTracked} utilisateurs en vocal sur ${totalGuildsProcessed} serveurs`);
    
    // Mettre à jour le temps de diffusion du bot
    await updateBotPlayTime();
}

// Fonction pour mettre à jour la présence d'un utilisateur
function updateUserPresence(userId, timeSpent) {
    if (!trackingData.userPresence[userId]) {
        trackingData.userPresence[userId] = {
            totalTime: 0,
            sessions: 0,
            lastSeen: Date.now()
        };
        logger.info(`🆕 Nouvel utilisateur/bot tracké: ${userId}`);
    }
    
    trackingData.userPresence[userId].totalTime += timeSpent;
    trackingData.userPresence[userId].lastSeen = Date.now();
    
    logger.info(`⏰ Utilisateur/Bot ${userId}: +${timeSpent}s (total: ${trackingData.userPresence[userId].totalTime}s)`);
    
    // Sauvegarder périodiquement (toutes les 5 minutes)
    if (!trackingData.lastSaveTime || Date.now() - trackingData.lastSaveTime > 300000) {
        saveData();
        trackingData.lastSaveTime = Date.now();
        logger.info('💾 Sauvegarde périodique des données de tracking');
    }
}

// Fonction pour mettre à jour les messages d'un utilisateur
function updateUserMessages(userId, messageCount = 1, messageType = 'general') {
    if (!trackingData.userMessages[userId]) {
        trackingData.userMessages[userId] = {
            messageCount: 0,
            lastMessage: Date.now(),
            messageTypes: {}
        };
        logger.info(`🆕 Nouvel utilisateur pour messages: ${userId}`);
    }
    
    trackingData.userMessages[userId].messageCount += messageCount;
    trackingData.userMessages[userId].lastMessage = Date.now();
    
    // Compter les types de messages
    if (!trackingData.userMessages[userId].messageTypes[messageType]) {
        trackingData.userMessages[userId].messageTypes[messageType] = 0;
    }
    trackingData.userMessages[userId].messageTypes[messageType] += messageCount;
    
    logger.info(`💬 Utilisateur ${userId}: +${messageCount} msg (${messageType}) (total: ${trackingData.userMessages[userId].messageCount} msgs)`);
    
    // Sauvegarder périodiquement (toutes les 5 minutes)
    if (!trackingData.lastSaveTime || Date.now() - trackingData.lastSaveTime > 300000) {
        saveData();
        trackingData.lastSaveTime = Date.now();
        logger.info('💾 Sauvegarde périodique des données de tracking');
    }
}

// Fonction pour mettre à jour les messages d'un bot
function updateBotMessages(botId, messageCount = 1, messageType = 'general') {
    if (!trackingData.botMessages[botId]) {
        trackingData.botMessages[botId] = {
            messageCount: 0,
            lastMessage: Date.now(),
            messageTypes: {
                embeds: 0,
                interactions: 0,
                errors: 0,
                responses: 0,
                general: 0
            }
        };
    }
    
    trackingData.botMessages[botId].messageCount += messageCount;
    trackingData.botMessages[botId].lastMessage = Date.now();
    
    // Compter par type de message
    if (trackingData.botMessages[botId].messageTypes[messageType] !== undefined) {
        trackingData.botMessages[botId].messageTypes[messageType] += messageCount;
    } else {
        trackingData.botMessages[botId].messageTypes.general += messageCount;
    }
    
    // Sauvegarder périodiquement (toutes les 5 minutes)
    if (!trackingData.lastSaveTime || Date.now() - trackingData.lastSaveTime > 300000) {
        saveData();
        trackingData.lastSaveTime = Date.now();
    }
}

// Fonction pour obtenir les statistiques actuelles
function getStats() {
    return {
        ...trackingData,
        uptime: Date.now() - trackingData.botStartTime,
        isTracking: trackingData.isTracking
    };
}

// Fonction pour nettoyer les sessions inactives
function cleanupInactiveSessions() {
    const now = Date.now();
    const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 heures
    
    // Nettoyer les utilisateurs inactifs
    Object.keys(trackingData.userPresence).forEach(userId => {
        if (now - trackingData.userPresence[userId].lastSeen > inactiveThreshold) {
            delete trackingData.userPresence[userId];
        }
    });
    
    Object.keys(trackingData.userMessages).forEach(userId => {
        if (now - trackingData.userMessages[userId].lastMessage > inactiveThreshold) {
            delete trackingData.userMessages[userId];
        }
    });
    
    Object.keys(trackingData.botMessages).forEach(botId => {
        if (now - trackingData.botMessages[botId].lastMessage > inactiveThreshold) {
            delete trackingData.botMessages[botId];
        }
    });
}

// Fonction pour obtenir les données en temps réel
async function getRealtimeData() {
    await loadData();
    cleanupInactiveSessions();
    return trackingData;
}

// Fonction pour diagnostiquer les données actuelles
function getCurrentDataDiagnostic() {
    const diagnostic = {
        totalUsersTracked: Object.keys(trackingData.userPresence).length,
        totalUserMessages: Object.keys(trackingData.userMessages).length,
        totalBotMessages: Object.keys(trackingData.botMessages).length,
        userPresenceDetails: {},
        userMessagesDetails: {},
        botMessagesDetails: {}
    };
    
    // Détails des utilisateurs trackés
    Object.entries(trackingData.userPresence).forEach(([userId, data]) => {
        diagnostic.userPresenceDetails[userId] = {
            totalTime: data.totalTime,
            lastSeen: new Date(data.lastSeen).toLocaleString(),
            timeFormatted: formatTime(data.totalTime)
        };
    });
    
    // Détails des messages utilisateurs
    Object.entries(trackingData.userMessages).forEach(([userId, data]) => {
        diagnostic.userMessagesDetails[userId] = {
            messageCount: data.messageCount,
            messageTypes: data.messageTypes || {},
            lastMessage: new Date(data.lastMessage).toLocaleString()
        };
    });
    
    // Détails des messages bots
    Object.entries(trackingData.botMessages).forEach(([botId, data]) => {
        diagnostic.botMessagesDetails[botId] = {
            messageCount: data.messageCount,
            messageTypes: data.messageTypes || {},
            lastMessage: new Date(data.lastMessage).toLocaleString()
        };
    });
    
    return diagnostic;
}

// Fonction pour réinitialiser toutes les données
async function resetAllData() {
    console.log('🗑️ Réinitialisation de toutes les données du leaderboard...');
    
    // Réinitialiser les données
    trackingData = {
        botPlayTime: 0,
        userPresence: {},
        userMessages: {},
        botMessages: {},
        lastUpdate: Date.now(),
        botStartTime: Date.now(),
        isTracking: false,
        lastSaveTime: Date.now()
    };
    
    // Sauvegarder immédiatement
    await saveData();
    
    console.log('✅ Toutes les données du leaderboard ont été réinitialisées');
    
    return trackingData;
}

// Fonction de diagnostic pour vérifier l'état du système
function getDiagnosticInfo(client) {
    const now = Date.now();
    const uptime = now - trackingData.botStartTime;
    
    return {
        isTracking: trackingData.isTracking,
        uptime: Math.floor(uptime / 1000),
        botStartTime: new Date(trackingData.botStartTime).toLocaleString(),
        lastUpdate: new Date(trackingData.lastUpdate).toLocaleString(),
        totalUsers: Object.keys(trackingData.userPresence).length,
        totalUserMessages: Object.keys(trackingData.userMessages).length,
        totalBotMessages: Object.keys(trackingData.botMessages).length,
        botPlayTime: trackingData.botPlayTime,
        guildsCount: client.guilds.cache.size,
        voiceConnections: client.voice?.connections?.size || 0,
        timersActive: {
            updateTimer: updateTimer !== null,
            trackingTimer: trackingTimer !== null
        }
    };
}

module.exports = {
    loadData,
    saveData,
    startAutoTracking,
    stopAutoTracking,
    updateUserPresence,
    updateBotPlayTime,
    updateUserMessages,
    updateBotMessages,
    getStats,
    getRealtimeData,
    cleanupInactiveSessions,
    getDiagnosticInfo,
    getCurrentDataDiagnostic,
    resetAllData
};