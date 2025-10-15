const ComprehensiveLeaderboardTracker = require('./comprehensiveLeaderboardTracker');
const Logger = require('./advancedLogger');

const logger = new Logger();

async function initializeLeaderboardSystem(client) {
    try {
        logger.info('🚀 Initialisation du système de leaderboard complet...');
        
        await ComprehensiveLeaderboardTracker.loadData();
        
        ComprehensiveLeaderboardTracker.startTracking(client);
        
        logger.success('✅ Système de leaderboard complet initialisé avec succès');
        
        return true;
    } catch (error) {
        logger.error('❌ Erreur lors de l\'initialisation du système de leaderboard:', error);
        return false;
    }
}

function stopLeaderboardSystem() {
    try {
        logger.info('🛑 Arrêt du système de leaderboard...');
        
        ComprehensiveLeaderboardTracker.stopTracking();
        
        logger.success('✅ Système de leaderboard arrêté avec succès');
        
        return true;
    } catch (error) {
        logger.error('❌ Erreur lors de l\'arrêt du système de leaderboard:', error);
        return false;
    }
}

function getLeaderboardStatus() {
    const data = ComprehensiveLeaderboardTracker.getLeaderboardData();
    
    return {
        isTracking: data.metadata.isTracking,
        totalUsers: data.metadata.totalUsers,
        totalBots: data.metadata.totalBots,
        totalMessages: data.server.stats.totalMessages,
        totalVoiceTime: data.server.stats.totalVoiceTime,
        lastUpdate: new Date(data.metadata.lastUpdate).toLocaleString(),
        version: data.metadata.version
    };
}

module.exports = {
    initializeLeaderboardSystem,
    stopLeaderboardSystem,
    getLeaderboardStatus
};






