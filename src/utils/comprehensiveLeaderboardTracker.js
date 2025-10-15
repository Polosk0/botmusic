const fs = require('fs').promises;
const path = require('path');
const Logger = require('./advancedLogger');

const logger = new Logger();
const DATA_FILE = path.join(__dirname, '../data/comprehensive-leaderboard.json');

let leaderboardData = {
    metadata: {
        version: "2.0.0",
        createdAt: Date.now(),
        lastUpdate: Date.now(),
        totalUsers: 0,
        totalBots: 0,
        serverId: null,
        isTracking: false
    },
    users: {},
    bots: {},
    server: {
        stats: {
            totalMessages: 0,
            totalVoiceTime: 0,
            totalUsers: 0,
            totalBots: 0,
            activeChannels: 0,
            peakConcurrentUsers: 0,
            averageDailyActivity: 0
        },
        channels: {}
    },
    leaderboards: {
        messages: { allTime: [], today: [], thisWeek: [], thisMonth: [] },
        voice: { allTime: [], today: [], thisWeek: [], thisMonth: [] },
        activity: { allTime: [], today: [], thisWeek: [], thisMonth: [] },
        engagement: { allTime: [], today: [], thisWeek: [], thisMonth: [] }
    },
    analytics: {
        dailyStats: {},
        hourlyStats: {},
        trends: {
            messageTrend: "stable",
            voiceTrend: "stable",
            userTrend: "stable",
            activityTrend: "stable"
        }
    }
};

let updateTimer = null;
let trackingTimer = null;
let analyticsTimer = null;

async function loadData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const parsedData = JSON.parse(data);
        leaderboardData = { ...leaderboardData, ...parsedData };
        logger.info('📊 Données du leaderboard complet chargées');
        return leaderboardData;
    } catch (error) {
        logger.info('📊 Création du nouveau fichier de données du leaderboard');
        await saveData();
        return leaderboardData;
    }
}

async function saveData() {
    try {
        const dataDir = path.dirname(DATA_FILE);
        await fs.mkdir(dataDir, { recursive: true });
        
        leaderboardData.metadata.lastUpdate = Date.now();
        await fs.writeFile(DATA_FILE, JSON.stringify(leaderboardData, null, 2));
        logger.info('💾 Données du leaderboard sauvegardées');
    } catch (error) {
        logger.error('❌ Erreur lors de la sauvegarde:', error.message);
    }
}

function initializeUser(userId, userData) {
    if (!leaderboardData.users[userId]) {
        leaderboardData.users[userId] = {
            id: userId,
            username: userData.username || 'Unknown',
            displayName: userData.displayName || userData.username || 'Unknown',
            tag: userData.tag || `${userData.username || 'Unknown'}#0000`,
            isBot: userData.bot || false,
            avatar: userData.avatar || null,
            joinedAt: Date.now(),
            lastSeen: Date.now(),
            stats: {
                messages: {
                    total: 0,
                    today: 0,
                    thisWeek: 0,
                    thisMonth: 0,
                    byType: {
                        text: 0,
                        embeds: 0,
                        attachments: 0,
                        links: 0,
                        commands: 0,
                        reactions: 0,
                        edits: 0,
                        deletes: 0
                    }
                },
                voice: {
                    totalTime: 0,
                    today: 0,
                    thisWeek: 0,
                    thisMonth: 0,
                    sessions: 0,
                    averageSession: 0,
                    longestSession: 0,
                    byChannel: {}
                },
                activity: {
                    dailyStreak: 0,
                    longestStreak: 0,
                    lastActiveDay: null,
                    activeDays: 0,
                    totalDays: 0
                },
                engagement: {
                    reactionsGiven: 0,
                    reactionsReceived: 0,
                    mentions: 0,
                    mentionsGiven: 0,
                    channelsActive: 0,
                    serversActive: 0
                }
            }
        };
        leaderboardData.metadata.totalUsers++;
        logger.info(`🆕 Nouvel utilisateur initialisé: ${userData.username || userId}`);
    }
}

function initializeBot(botId, botData) {
    if (!leaderboardData.bots[botId]) {
        leaderboardData.bots[botId] = {
            id: botId,
            username: botData.username || 'Unknown Bot',
            displayName: botData.displayName || botData.username || 'Unknown Bot',
            tag: botData.tag || `${botData.username || 'Unknown Bot'}#0000`,
            isBot: true,
            avatar: botData.avatar || null,
            addedAt: Date.now(),
            lastSeen: Date.now(),
            stats: {
                messages: {
                    total: 0,
                    today: 0,
                    thisWeek: 0,
                    thisMonth: 0,
                    byType: {
                        embeds: 0,
                        interactions: 0,
                        errors: 0,
                        responses: 0,
                        notifications: 0,
                        commands: 0
                    }
                },
                voice: {
                    totalTime: 0,
                    today: 0,
                    thisWeek: 0,
                    thisMonth: 0,
                    sessions: 0,
                    averageSession: 0,
                    longestSession: 0,
                    byChannel: {}
                },
                activity: {
                    uptime: 0,
                    commandsProcessed: 0,
                    errors: 0,
                    lastError: null,
                    reliability: 100
                }
            }
        };
        leaderboardData.metadata.totalBots++;
        logger.info(`🤖 Nouveau bot initialisé: ${botData.username || botId}`);
    }
}

function trackMessage(userId, messageData) {
    const isBot = messageData.bot || false;
    const userData = isBot ? leaderboardData.bots[userId] : leaderboardData.users[userId];
    
    if (!userData) {
        if (isBot) {
            initializeBot(userId, messageData);
        } else {
            initializeUser(userId, messageData);
        }
    }
    
    const targetData = isBot ? leaderboardData.bots[userId] : leaderboardData.users[userId];
    const now = Date.now();
    const today = new Date().toDateString();
    const thisWeek = getWeekStart();
    const thisMonth = new Date().getMonth();
    
    targetData.lastSeen = now;
    targetData.stats.messages.total++;
    
    if (targetData.stats.activity.lastActiveDay !== today) {
        targetData.stats.activity.activeDays++;
        targetData.stats.activity.lastActiveDay = today;
    }
    
    const messageType = determineMessageType(messageData);
    if (targetData.stats.messages.byType[messageType] !== undefined) {
        targetData.stats.messages.byType[messageType]++;
    }
    
    leaderboardData.server.stats.totalMessages++;
    
    logger.info(`💬 Message tracké: ${targetData.username} (${messageType})`);
    
    // Sauvegarder immédiatement
    saveData();
}

function trackVoiceActivity(userId, voiceData) {
    const isBot = voiceData.bot || false;
    const userData = isBot ? leaderboardData.bots[userId] : leaderboardData.users[userId];
    
    if (!userData) {
        if (isBot) {
            initializeBot(userId, voiceData);
        } else {
            initializeUser(userId, voiceData);
        }
    }
    
    const targetData = isBot ? leaderboardData.bots[userId] : leaderboardData.users[userId];
    const timeSpent = voiceData.timeSpent || 15;
    const channelId = voiceData.channelId;
    
    targetData.lastSeen = Date.now();
    targetData.stats.voice.totalTime += timeSpent;
    targetData.stats.voice.sessions++;
    
    if (channelId) {
        if (!targetData.stats.voice.byChannel[channelId]) {
            targetData.stats.voice.byChannel[channelId] = 0;
        }
        targetData.stats.voice.byChannel[channelId] += timeSpent;
    }
    
    targetData.stats.voice.averageSession = targetData.stats.voice.totalTime / targetData.stats.voice.sessions;
    
    if (timeSpent > targetData.stats.voice.longestSession) {
        targetData.stats.voice.longestSession = timeSpent;
    }
    
    leaderboardData.server.stats.totalVoiceTime += timeSpent;
    
    logger.info(`🎤 Activité vocale trackée: ${targetData.username} (+${timeSpent}s)`);
    
    // Sauvegarder immédiatement
    saveData();
}

function trackReaction(userId, reactionData) {
    const isBot = reactionData.bot || false;
    const userData = isBot ? leaderboardData.bots[userId] : leaderboardData.users[userId];
    
    if (!userData) {
        if (isBot) {
            initializeBot(userId, reactionData);
        } else {
            initializeUser(userId, reactionData);
        }
    }
    
    const targetData = isBot ? leaderboardData.bots[userId] : leaderboardData.users[userId];
    
    if (reactionData.type === 'given') {
        targetData.stats.engagement.reactionsGiven++;
    } else if (reactionData.type === 'received') {
        targetData.stats.engagement.reactionsReceived++;
    }
    
    logger.info(`👍 Réaction trackée: ${targetData.username} (${reactionData.type})`);
}

function trackMention(userId, mentionData) {
    const isBot = mentionData.bot || false;
    const userData = isBot ? leaderboardData.bots[userId] : leaderboardData.users[userId];
    
    if (!userData) {
        if (isBot) {
            initializeBot(userId, mentionData);
        } else {
            initializeUser(userId, mentionData);
        }
    }
    
    const targetData = isBot ? leaderboardData.bots[userId] : leaderboardData.users[userId];
    
    if (mentionData.type === 'given') {
        targetData.stats.engagement.mentionsGiven++;
    } else if (mentionData.type === 'received') {
        targetData.stats.engagement.mentions++;
    }
    
    logger.info(`📢 Mention trackée: ${targetData.username} (${mentionData.type})`);
}

function determineMessageType(messageData) {
    if (messageData.embeds && messageData.embeds.length > 0) return 'embeds';
    if (messageData.attachments && messageData.attachments.length > 0) return 'attachments';
    if (messageData.content && messageData.content.includes('http')) return 'links';
    if (messageData.content && messageData.content.startsWith('/')) return 'commands';
    if (messageData.reactions && messageData.reactions.length > 0) return 'reactions';
    if (messageData.edited) return 'edits';
    return 'text';
}

function getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    return new Date(now.setDate(diff)).toDateString();
}

function updateLeaderboards() {
    const allUsers = { ...leaderboardData.users, ...leaderboardData.bots };
    
    leaderboardData.leaderboards.messages.allTime = Object.values(allUsers)
        .sort((a, b) => b.stats.messages.total - a.stats.messages.total)
        .slice(0, 50);
    
    leaderboardData.leaderboards.voice.allTime = Object.values(allUsers)
        .sort((a, b) => b.stats.voice.totalTime - a.stats.voice.totalTime)
        .slice(0, 50);
    
    leaderboardData.leaderboards.activity.allTime = Object.values(allUsers)
        .sort((a, b) => b.stats.activity.activeDays - a.stats.activity.activeDays)
        .slice(0, 50);
    
    leaderboardData.leaderboards.engagement.allTime = Object.values(allUsers)
        .filter(user => user.stats && user.stats.engagement)
        .sort((a, b) => ((b.stats.engagement.reactionsGiven || 0) + (b.stats.engagement.reactionsReceived || 0)) - 
                        ((a.stats.engagement.reactionsGiven || 0) + (a.stats.engagement.reactionsReceived || 0)))
        .slice(0, 50);
    
    logger.info('🏆 Leaderboards mis à jour');
}

function updateAnalytics() {
    const now = new Date();
    const today = now.toDateString();
    const hour = now.getHours();
    const dateHour = `${today}_${hour}`;
    
    if (!leaderboardData.analytics.dailyStats[today]) {
        leaderboardData.analytics.dailyStats[today] = {
            messages: 0,
            voiceTime: 0,
            activeUsers: 0,
            activeBots: 0,
            newUsers: 0,
            peakConcurrent: 0
        };
    }
    
    if (!leaderboardData.analytics.hourlyStats[dateHour]) {
        leaderboardData.analytics.hourlyStats[dateHour] = {
            messages: 0,
            voiceTime: 0,
            activeUsers: 0
        };
    }
    
    const allUsers = { ...leaderboardData.users, ...leaderboardData.bots };
    const activeUsers = Object.values(allUsers).filter(user => 
        Date.now() - user.lastSeen < 3600000
    );
    
    leaderboardData.analytics.dailyStats[today].activeUsers = activeUsers.filter(u => !u.isBot).length;
    leaderboardData.analytics.dailyStats[today].activeBots = activeUsers.filter(u => u.isBot).length;
    
    leaderboardData.analytics.hourlyStats[dateHour].activeUsers = activeUsers.length;
    
    logger.info('📈 Analytics mises à jour');
}

function startTracking(client) {
    if (leaderboardData.metadata.isTracking) {
        logger.warning('⚠️ Le tracking est déjà actif');
        return;
    }
    
    leaderboardData.metadata.isTracking = true;
    leaderboardData.metadata.serverId = client.guilds.cache.first()?.id;
    
    // Initialiser tous les utilisateurs et bots existants
    initializeExistingUsers(client);
    
    trackingTimer = setInterval(() => {
        trackAllVoiceStates(client);
    }, 15000);
    
    updateTimer = setInterval(() => {
        updateLeaderboards();
        updateAnalytics();
        saveData();
    }, 30000);
    
    analyticsTimer = setInterval(() => {
        updateAnalytics();
    }, 300000);
    
    logger.info('🚀 Système de tracking complet démarré');
}

function stopTracking() {
    if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
    }
    
    if (trackingTimer) {
        clearInterval(trackingTimer);
        trackingTimer = null;
    }
    
    if (analyticsTimer) {
        clearInterval(analyticsTimer);
        analyticsTimer = null;
    }
    
    leaderboardData.metadata.isTracking = false;
    saveData();
    logger.info('🛑 Système de tracking arrêté');
}

function initializeExistingUsers(client) {
    try {
        logger.info('👥 Initialisation des utilisateurs et bots existants...');
        
        if (!client || !client.guilds || !client.guilds.cache) {
            logger.warning('⚠️ Client Discord non disponible pour l\'initialisation');
            return;
        }
        
        client.guilds.cache.forEach(guild => {
            if (!guild.members || !guild.members.cache) {
                logger.warning(`⚠️ Guild ${guild.id} n'a pas de membres cache`);
                return;
            }
            
            guild.members.cache.forEach(member => {
                try {
                    if (member.user.bot) {
                        initializeBot(member.user.id, {
                            username: member.user.username,
                            displayName: member.displayName || member.user.username,
                            tag: member.user.tag,
                            avatar: member.user.displayAvatarURL ? member.user.displayAvatarURL() : null
                        });
                    } else {
                        initializeUser(member.user.id, {
                            username: member.user.username,
                            displayName: member.displayName || member.user.username,
                            tag: member.user.tag,
                            avatar: member.user.displayAvatarURL ? member.user.displayAvatarURL() : null
                        });
                    }
                } catch (memberError) {
                    logger.error(`❌ Erreur lors de l'initialisation du membre ${member.user.id}:`, memberError.message);
                }
            });
        });
        
        logger.info(`👥 Initialisation terminée: ${Object.keys(leaderboardData.users).length} utilisateurs, ${Object.keys(leaderboardData.bots).length} bots`);
    } catch (error) {
        logger.error('❌ Erreur lors de l\'initialisation des utilisateurs:', error.message);
    }
}

function trackAllVoiceStates(client) {
    try {
        if (!client || !client.guilds || !client.guilds.cache) {
            logger.warning('⚠️ Client Discord non disponible pour le tracking vocal');
            return;
        }
        
        let usersTracked = 0;
        
        client.guilds.cache.forEach(guild => {
            if (!guild.members || !guild.members.cache) {
                logger.warning(`⚠️ Guild ${guild.id} n'a pas de membres cache`);
                return;
            }
            
            guild.members.cache.forEach(member => {
                try {
                    if (member.voice && member.voice.channel) {
                        trackVoiceActivity(member.user.id, {
                            bot: member.user.bot,
                            username: member.user.username,
                            displayName: member.displayName || member.user.username,
                            tag: member.user.tag,
                            avatar: member.user.displayAvatarURL ? member.user.displayAvatarURL() : null,
                            channelId: member.voice.channel.id,
                            timeSpent: 15
                        });
                        usersTracked++;
                    }
                } catch (memberError) {
                    logger.error(`❌ Erreur lors du tracking du membre ${member.user.id}:`, memberError.message);
                }
            });
        });
        
        if (usersTracked > 0) {
            logger.info(`🎤 Tracking vocal: ${usersTracked} utilisateurs en vocal détectés`);
        }
    } catch (error) {
        logger.error('❌ Erreur lors du tracking vocal:', error.message);
    }
}

function getLeaderboardData() {
    return leaderboardData;
}

function resetAllData(client = null) {
    leaderboardData = {
        metadata: {
            version: "2.0.0",
            createdAt: Date.now(),
            lastUpdate: Date.now(),
            totalUsers: 0,
            totalBots: 0,
            serverId: null,
            isTracking: false
        },
        users: {},
        bots: {},
        server: {
            stats: {
                totalMessages: 0,
                totalVoiceTime: 0,
                totalUsers: 0,
                totalBots: 0,
                activeChannels: 0,
                peakConcurrentUsers: 0,
                averageDailyActivity: 0
            },
            channels: {}
        },
        leaderboards: {
            messages: { allTime: [], today: [], thisWeek: [], thisMonth: [] },
            voice: { allTime: [], today: [], thisWeek: [], thisMonth: [] },
            activity: { allTime: [], today: [], thisWeek: [], thisMonth: [] },
            engagement: { allTime: [], today: [], thisWeek: [], thisMonth: [] }
        },
        analytics: {
            dailyStats: {},
            hourlyStats: {},
            trends: {
                messageTrend: "stable",
                voiceTrend: "stable",
                userTrend: "stable",
                activityTrend: "stable"
            }
        }
    };
    
    saveData();
    logger.info('🔄 Toutes les données ont été réinitialisées');
    
    // Redémarrer le tracking si un client est fourni
    if (client) {
        logger.info('🔄 Redémarrage du tracking après reset...');
        initializeExistingUsers(client);
        
        // Détecter immédiatement les utilisateurs en vocal
        setTimeout(() => {
            logger.info('🔍 Détection des utilisateurs en vocal après reset...');
            trackAllVoiceStates(client);
        }, 2000); // Attendre 2 secondes pour que l'initialisation soit terminée
        
        logger.info('✅ Tracking redémarré avec succès');
    }
}

module.exports = {
    loadData,
    saveData,
    startTracking,
    stopTracking,
    trackMessage,
    trackVoiceActivity,
    trackReaction,
    trackMention,
    getLeaderboardData,
    resetAllData,
    updateLeaderboards,
    updateAnalytics
};
