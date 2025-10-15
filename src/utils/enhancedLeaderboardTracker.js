const fs = require('fs').promises;
const path = require('path');
const Logger = require('./advancedLogger');

// Créer une instance du logger pour ce module
const logger = new Logger();

// Chemin vers le fichier de données
const DATA_FILE = path.join(__dirname, '../data/enhanced-leaderboard.json');

// Variables globales pour le tracking amélioré
let trackingData = {
    botPlayTime: 0,
    radioPlayTime: 0, // Nouveau : temps de radio
    userPresence: {},
    userMessages: {},
    botMessages: {},
    userNames: {}, // Nouveau : cache des noms d'utilisateurs
    botNames: {}, // Nouveau : cache des noms de bots
    lastUpdate: Date.now(),
    botStartTime: Date.now(),
    isTracking: false,
    radioMode: false, // Nouveau : mode radio actif
    lastRadioStart: null,
    lastMusicStart: null
};

// Timer pour la mise à jour automatique
let updateTimer = null;
let trackingTimer = null;
let nameCacheTimer = null;

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
        if (!parsedData.radioPlayTime) {
            parsedData.radioPlayTime = 0;
        }
        if (!parsedData.userNames) {
            parsedData.userNames = {};
        }
        if (!parsedData.botNames) {
            parsedData.botNames = {};
        }
        if (!parsedData.radioMode) {
            parsedData.radioMode = false;
        }
        
        trackingData = { ...trackingData, ...parsedData };
        logger.info('📊 Données du leaderboard amélioré chargées');
        return trackingData;
    } catch (error) {
        // Créer le fichier s'il n'existe pas
        const defaultData = {
            botPlayTime: 0,
            radioPlayTime: 0,
            userPresence: {},
            userMessages: {},
            botMessages: {},
            userNames: {},
            botNames: {},
            lastUpdate: Date.now(),
            botStartTime: Date.now(),
            isTracking: false,
            radioMode: false,
            lastRadioStart: null,
            lastMusicStart: null
        };
        
        await saveData(defaultData);
        trackingData = defaultData;
        logger.info('📊 Nouveau fichier de données créé');
        return trackingData;
    }
}

// Fonction pour sauvegarder les données
async function saveData(data = trackingData) {
    try {
        // Créer le dossier data s'il n'existe pas
        const dataDir = path.dirname(DATA_FILE);
        await fs.mkdir(dataDir, { recursive: true });
        
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        logger.info('💾 Données du leaderboard sauvegardées');
    } catch (error) {
        logger.error('❌ Erreur lors de la sauvegarde des données:', error.message);
    }
}

// Fonction pour démarrer le tracking automatique
function startAutoTracking(client) {
    if (trackingData.isTracking) {
        logger.warning('⚠️ Le tracking automatique est déjà actif');
        return;
    }
    
    trackingData.isTracking = true;
    trackingData.botStartTime = Date.now();
    
    // Mise à jour toutes les 30 secondes
    updateTimer = setInterval(() => {
        updateContinuousTracking(client);
    }, 30000);
    
    // Tracking des présences toutes les 15 secondes
    trackingTimer = setInterval(() => {
        trackAllVoiceStates(client);
    }, 15000);
    
    // Mise à jour du cache des noms toutes les 5 minutes
    nameCacheTimer = setInterval(() => {
        updateNameCache(client);
    }, 300000);
    
    logger.info('🚀 Système de tracking automatique amélioré démarré');
    
    // Mise à jour immédiate
    updateContinuousTracking(client);
    updateNameCache(client);
}

// Fonction pour arrêter le tracking automatique
function stopAutoTracking() {
    if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
    }
    
    if (trackingTimer) {
        clearInterval(trackingTimer);
        trackingTimer = null;
    }
    
    if (nameCacheTimer) {
        clearInterval(nameCacheTimer);
        nameCacheTimer = null;
    }
    
    trackingData.isTracking = false;
    saveData();
    logger.info('🛑 Système de tracking automatique arrêté');
}

// Fonction pour mettre à jour le cache des noms d'utilisateurs et bots
function updateNameCache(client) {
    try {
        logger.info('👥 Mise à jour du cache des noms...');
        
        // Mettre à jour les noms d'utilisateurs
        client.guilds.cache.forEach(guild => {
            guild.members.cache.forEach(member => {
                if (!member.user.bot) {
                    trackingData.userNames[member.user.id] = {
                        username: member.user.username,
                        displayName: member.displayName || member.user.username,
                        tag: member.user.tag,
                        lastSeen: Date.now()
                    };
                } else {
                    trackingData.botNames[member.user.id] = {
                        username: member.user.username,
                        displayName: member.displayName || member.user.username,
                        tag: member.user.tag,
                        lastSeen: Date.now()
                    };
                }
            });
        });
        
        logger.info(`👥 Cache mis à jour: ${Object.keys(trackingData.userNames).length} utilisateurs, ${Object.keys(trackingData.botNames).length} bots`);
        
        // Sauvegarder périodiquement
        if (!trackingData.lastSaveTime || Date.now() - trackingData.lastSaveTime > 300000) {
            saveData();
            trackingData.lastSaveTime = Date.now();
        }
    } catch (error) {
        logger.error('❌ Erreur lors de la mise à jour du cache des noms:', error.message);
    }
}

// Fonction pour obtenir le nom d'un utilisateur
function getUserName(userId) {
    const userData = trackingData.userNames[userId];
    if (userData) {
        return userData.displayName || userData.username || `Utilisateur ${userId}`;
    }
    return `Utilisateur ${userId}`;
}

// Fonction pour obtenir le nom d'un bot
function getBotName(botId) {
    const botData = trackingData.botNames[botId];
    if (botData) {
        return botData.displayName || botData.username || `Bot ${botId}`;
    }
    return `Bot ${botId}`;
}

// Fonction pour tracker tous les états vocaux (universel)
function trackAllVoiceStates(client) {
    try {
        client.guilds.cache.forEach(guild => {
            guild.members.cache.forEach(member => {
                if (member.voice.channel) {
                    // Utilisateur connecté en vocal
                    updateUserPresence(member.user.id, member.user.bot, 15); // 15 secondes
                }
            });
        });
    } catch (error) {
        logger.error('❌ Erreur lors du tracking des états vocaux:', error.message);
    }
}

// Fonction pour mettre à jour la présence d'un utilisateur/bot
function updateUserPresence(userId, isBot = false, timeSpent = 15) {
    if (!trackingData.userPresence[userId]) {
        trackingData.userPresence[userId] = {
            totalTime: 0,
            lastSeen: Date.now(),
            isBot: isBot,
            sessions: []
        };
        logger.info(`🆕 Nouvel utilisateur/bot pour présence: ${userId} (${isBot ? 'bot' : 'utilisateur'})`);
    }
    
    trackingData.userPresence[userId].totalTime += timeSpent;
    trackingData.userPresence[userId].lastSeen = Date.now();
    trackingData.userPresence[userId].isBot = isBot;
    
    logger.info(`⏰ ${isBot ? 'Bot' : 'Utilisateur'} ${userId}: +${timeSpent}s (total: ${trackingData.userPresence[userId].totalTime}s)`);
    
    // Sauvegarder périodiquement
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
    
    // Sauvegarder périodiquement
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
                general: 0,
                attachments: 0,
                links: 0,
                long_messages: 0
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
    
    // Sauvegarder périodiquement
    if (!trackingData.lastSaveTime || Date.now() - trackingData.lastSaveTime > 300000) {
        saveData();
        trackingData.lastSaveTime = Date.now();
    }
}

// Fonction pour mettre à jour le temps de lecture de musique
function updateMusicPlayTime(timeSpent = 15) {
    trackingData.botPlayTime += timeSpent;
    trackingData.lastMusicStart = Date.now();
    logger.info(`🎵 Temps de musique: +${timeSpent}s (total: ${trackingData.botPlayTime}s)`);
    
    // Sauvegarder périodiquement
    if (!trackingData.lastSaveTime || Date.now() - trackingData.lastSaveTime > 300000) {
        saveData();
        trackingData.lastSaveTime = Date.now();
    }
}

// Fonction pour mettre à jour le temps de radio
function updateRadioPlayTime(timeSpent = 15) {
    trackingData.radioPlayTime += timeSpent;
    trackingData.lastRadioStart = Date.now();
    trackingData.radioMode = true;
    logger.info(`📻 Temps de radio: +${timeSpent}s (total: ${trackingData.radioPlayTime}s)`);
    
    // Sauvegarder périodiquement
    if (!trackingData.lastSaveTime || Date.now() - trackingData.lastSaveTime > 300000) {
        saveData();
        trackingData.lastSaveTime = Date.now();
    }
}

// Fonction pour arrêter le mode radio
function stopRadioMode() {
    trackingData.radioMode = false;
    trackingData.lastRadioStart = null;
    logger.info('📻 Mode radio arrêté');
    saveData();
}

// Fonction pour obtenir les statistiques actuelles
function getStats() {
    return {
        ...trackingData,
        uptime: Date.now() - trackingData.botStartTime,
        isTracking: trackingData.isTracking,
        totalPlayTime: trackingData.botPlayTime + trackingData.radioPlayTime
    };
}

// Fonction pour obtenir les données de diagnostic
function getCurrentDataDiagnostic() {
    const stats = getStats();
    
    return {
        timestamp: new Date().toISOString(),
        uptime: Math.floor(stats.uptime / 1000),
        musicPlayTime: Math.floor(stats.botPlayTime),
        radioPlayTime: Math.floor(stats.radioPlayTime),
        totalPlayTime: Math.floor(stats.totalPlayTime),
        radioMode: stats.radioMode,
        usersTracked: Object.keys(stats.userPresence).length,
        userMessagesTracked: Object.keys(stats.userMessages).length,
        botMessagesTracked: Object.keys(stats.botMessages).length,
        userNamesCached: Object.keys(stats.userNames).length,
        botNamesCached: Object.keys(stats.botNames).length,
        isTracking: stats.isTracking,
        lastUpdate: new Date(stats.lastUpdate).toISOString()
    };
}

// Fonction pour réinitialiser toutes les données
function resetAllData() {
    trackingData = {
        botPlayTime: 0,
        radioPlayTime: 0,
        userPresence: {},
        userMessages: {},
        botMessages: {},
        userNames: {},
        botNames: {},
        lastUpdate: Date.now(),
        botStartTime: Date.now(),
        isTracking: false,
        radioMode: false,
        lastRadioStart: null,
        lastMusicStart: null
    };
    
    saveData();
    logger.info('🔄 Toutes les données du leaderboard ont été réinitialisées');
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
    
    // Nettoyer le cache des noms inactifs
    Object.keys(trackingData.userNames).forEach(userId => {
        if (now - trackingData.userNames[userId].lastSeen > inactiveThreshold) {
            delete trackingData.userNames[userId];
        }
    });
    
    Object.keys(trackingData.botNames).forEach(botId => {
        if (now - trackingData.botNames[botId].lastSeen > inactiveThreshold) {
            delete trackingData.botNames[botId];
        }
    });
    
    logger.info('🧹 Sessions inactives nettoyées');
    saveData();
}

// Fonction pour mettre à jour le tracking continu
function updateContinuousTracking(client) {
    try {
        // Mettre à jour le cache des noms
        updateNameCache(client);
        
        // Tracker les états vocaux
        trackAllVoiceStates(client);
        
        // Mettre à jour le temps de lecture selon le mode
        if (trackingData.radioMode) {
            updateRadioPlayTime(30); // 30 secondes
        } else {
            updateMusicPlayTime(30); // 30 secondes
        }
        
        trackingData.lastUpdate = Date.now();
        
        logger.info('🔄 Tracking continu mis à jour');
    } catch (error) {
        logger.error('❌ Erreur lors de la mise à jour du tracking continu:', error.message);
    }
}

// Exporter les fonctions
module.exports = {
    loadData,
    saveData,
    startAutoTracking,
    stopAutoTracking,
    updateUserPresence,
    updateUserMessages,
    updateBotMessages,
    updateMusicPlayTime,
    updateRadioPlayTime,
    stopRadioMode,
    getUserName,
    getBotName,
    getStats,
    getCurrentDataDiagnostic,
    resetAllData,
    cleanupInactiveSessions,
    updateContinuousTracking,
    updateNameCache
};










