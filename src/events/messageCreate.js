const { Events } = require('discord.js');
const ComprehensiveLeaderboardTracker = require('../utils/comprehensiveLeaderboardTracker');
const Logger = require('../utils/advancedLogger');

// Créer une instance du logger pour ce module
const logger = new Logger();

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignorer seulement les messages privés
        if (!message.guild) {
            return;
        }

        try {
            // Tracker TOUS les messages des utilisateurs et des bots
            const isBot = message.author.bot;
            
            if (isBot) {
                // Détecter le type de message automatiquement pour les bots (comme pour les utilisateurs)
                let messageType = 'general';
                
                if (message.interaction) {
                    messageType = 'interactions';
                } else if (message.embeds.length > 0) {
                    messageType = 'embeds';
                } else if (message.attachments.size > 0) {
                    messageType = 'attachments';
                } else if (message.content && (
                    message.content.includes('❌') || 
                    message.content.includes('⚠️') || 
                    message.content.includes('Erreur') ||
                    message.content.includes('Error')
                )) {
                    messageType = 'errors';
                } else if (message.content && (
                    message.content.includes('✅') || 
                    message.content.includes('🎵') || 
                    message.content.includes('📊') ||
                    message.content.includes('Réponse')
                )) {
                    messageType = 'responses';
                } else if (message.content && message.content.includes('http')) {
                    messageType = 'links';
                } else if (message.content && message.content.length > 100) {
                    messageType = 'long_messages';
                }
                
                // Compter TOUS les messages des bots avec leur type
                ComprehensiveLeaderboardTracker.trackMessage(message.author.id, {
                    bot: true,
                    username: message.author.username,
                    displayName: message.member?.displayName || message.author.username,
                    tag: message.author.tag,
                    avatar: message.author.displayAvatarURL(),
                    content: message.content,
                    embeds: message.embeds,
                    attachments: message.attachments,
                    reactions: message.reactions.cache.size,
                    edited: message.editedAt !== null
                });
                
                // Log détaillé pour les bots
                logger.info(`🤖 LEADERBOARD: Message de ${message.author.tag} (${messageType})`);
            } else {
                // Détecter le type de message pour les utilisateurs aussi
                let messageType = 'general';
                
                if (message.interaction) {
                    messageType = 'interactions';
                } else if (message.embeds.length > 0) {
                    messageType = 'embeds';
                } else if (message.attachments.size > 0) {
                    messageType = 'attachments';
                } else if (message.content && message.content.startsWith('!')) {
                    messageType = 'commands';
                } else if (message.content && message.content.length > 100) {
                    messageType = 'long_messages';
                } else if (message.content && message.content.includes('http')) {
                    messageType = 'links';
                }
                
                // Compter TOUS les messages des utilisateurs avec leur type
                ComprehensiveLeaderboardTracker.trackMessage(message.author.id, {
                    bot: false,
                    username: message.author.username,
                    displayName: message.member?.displayName || message.author.username,
                    tag: message.author.tag,
                    avatar: message.author.displayAvatarURL(),
                    content: message.content,
                    embeds: message.embeds,
                    attachments: message.attachments,
                    reactions: message.reactions.cache.size,
                    edited: message.editedAt !== null
                });
                
                // Log détaillé pour les utilisateurs
                logger.info(`👤 LEADERBOARD: Message de ${message.author.tag} (${messageType})`);
            }
        } catch (error) {
            logger.error('Erreur lors du tracking des messages:', error);
        }
    },
};
