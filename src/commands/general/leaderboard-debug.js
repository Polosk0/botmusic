const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const LeaderboardTracker = require('../../utils/leaderboardTracker');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard-debug')
        .setDescription('Diagnostic du système de leaderboard'),
    
    async execute(interaction) {
        try {
            const diagnostic = LeaderboardTracker.getDiagnosticInfo(interaction.client);
            const dataDiagnostic = LeaderboardTracker.getCurrentDataDiagnostic();
            const data = await LeaderboardTracker.getRealtimeData();
            
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('🔧 **DIAGNOSTIC LEADERBOARD**')
                .setDescription('Informations de diagnostic du système de tracking')
                .addFields(
                    {
                        name: '📊 **État du Système**',
                        value: [
                            `🔄 **Tracking actif:** ${diagnostic.isTracking ? '✅ OUI' : '❌ NON'}`,
                            `⏰ **Uptime:** \`${diagnostic.uptime}s\``,
                            `🏠 **Serveurs:** \`${diagnostic.guildsCount}\``,
                            `🎤 **Connexions vocales:** \`${diagnostic.voiceConnections}\``,
                            `⏱️ **Timers actifs:** ${diagnostic.timersActive.updateTimer ? '✅' : '❌'} Update | ${diagnostic.timersActive.trackingTimer ? '✅' : '❌'} Tracking`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '📈 **Données Trackées**',
                        value: [
                            `👥 **Utilisateurs en vocal:** \`${diagnostic.totalUsers}\``,
                            `💬 **Messages utilisateurs:** \`${diagnostic.totalUserMessages}\``,
                            `🤖 **Messages bots:** \`${diagnostic.totalBotMessages}\``,
                            `🎵 **Temps de diffusion:** \`${diagnostic.botPlayTime}s\``,
                            `📅 **Dernière mise à jour:** \`${diagnostic.lastUpdate}\``
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🔍 **Test de Fonctionnement**',
                        value: [
                            `📊 **Fichier de données:** ${data ? '✅ Chargé' : '❌ Erreur'}`,
                            `🔄 **Tracking continu:** ${diagnostic.timersActive.trackingTimer ? '✅ Actif' : '❌ Inactif'}`,
                            `💾 **Sauvegarde auto:** ${diagnostic.timersActive.updateTimer ? '✅ Actif' : '❌ Inactif'}`,
                            `🎯 **État général:** ${diagnostic.isTracking && diagnostic.timersActive.trackingTimer ? '✅ FONCTIONNEL' : '❌ PROBLÈME'}`
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `🔧 Diagnostic • ${new Date().toLocaleTimeString('fr-FR')}`,
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Ajouter les détails des utilisateurs si il y en a
            if (dataDiagnostic.totalUsersTracked > 0) {
                let userDetails = '';
                Object.entries(dataDiagnostic.userPresenceDetails).forEach(([userId, details]) => {
                    userDetails += `👤 **${userId}:** ${details.timeFormatted} (dernière fois: ${details.lastSeen})\n`;
                });
                
                embed.addFields({
                    name: '👤 **Détails Utilisateurs Vocaux**',
                    value: userDetails.substring(0, 1024), // Limite Discord
                    inline: false
                });
            }

            // Ajouter les détails des messages si il y en a
            if (dataDiagnostic.totalUserMessages > 0) {
                let messageDetails = '';
                Object.entries(dataDiagnostic.userMessagesDetails).forEach(([userId, details]) => {
                    const typesInfo = Object.entries(details.messageTypes || {}).map(([type, count]) => `${type}: ${count}`).join(', ');
                    messageDetails += `💬 **${userId}:** ${details.messageCount} msgs (${typesInfo}) (dernier: ${details.lastMessage})\n`;
                });
                
                embed.addFields({
                    name: '💬 **Détails Messages Utilisateurs**',
                    value: messageDetails.substring(0, 1024), // Limite Discord
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Erreur dans la commande de diagnostic:', error);
            await interaction.editReply({
                content: `❌ Erreur lors du diagnostic: \`${error.message}\``
            });
        }
    }
};


