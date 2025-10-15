const { Events } = require('discord.js');
const ComprehensiveLeaderboardTracker = require('../utils/comprehensiveLeaderboardTracker');
const Logger = require('../utils/advancedLogger');

// Créer une instance du logger pour ce module
const logger = new Logger();

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const userId = newState.member.id;
        const oldChannel = oldState.channel;
        const newChannel = newState.channel;

        // Utilisateur rejoint un salon vocal
        if (!oldChannel && newChannel) {
            ComprehensiveLeaderboardTracker.trackVoiceActivity(userId, {
                bot: newState.member.user.bot,
                username: newState.member.user.username,
                displayName: newState.member.displayName,
                tag: newState.member.user.tag,
                avatar: newState.member.user.displayAvatarURL(),
                channelId: newChannel.id,
                timeSpent: 0
            });
            const userType = newState.member.user.bot ? 'BOT' : 'USER';
            logger.info(`👤 LEADERBOARD: ${newState.member.user.tag} (${userType}) a rejoint ${newChannel.name}`);
        }
        
        // Utilisateur quitte un salon vocal
        else if (oldChannel && !newChannel) {
            const userType = newState.member.user.bot ? 'BOT' : 'USER';
            logger.info(`👤 LEADERBOARD: ${newState.member.user.tag} (${userType}) a quitté ${oldChannel.name}`);
        }
        
        // Utilisateur change de salon vocal
        else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
            const userType = newState.member.user.bot ? 'BOT' : 'USER';
            logger.info(`👤 LEADERBOARD: ${newState.member.user.tag} (${userType}) a changé de ${oldChannel.name} vers ${newChannel.name}`);
        }
        
        // Utilisateur se déconnecte du serveur
        else if (oldChannel && !newState.member) {
            logger.info(`👤 LEADERBOARD: ${userId} s'est déconnecté du serveur`);
        }
    },
};


