const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const autoDeleteManager = require('../../utils/autoDeleteManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('auto-delete-status')
        .setDescription('Afficher le statut de la suppression automatique des messages musicaux'),
    
    async execute(interaction) {
        const stats = autoDeleteManager.getStats();
        const guildMessages = autoDeleteManager.getGuildMessages(interaction.guild.id);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🗑️ Statut de la suppression automatique')
            .setDescription('Gestion automatique des messages musicaux')
            .addFields(
                { 
                    name: '📊 Statistiques globales', 
                    value: `**Serveurs surveillés:** ${stats.totalGuilds}\n**Messages surveillés:** ${stats.totalMessages}`, 
                    inline: true 
                },
                { 
                    name: '🎵 Ce serveur', 
                    value: `**Messages surveillés:** ${guildMessages.size}`, 
                    inline: true 
                },
                { 
                    name: '⏰ Délai de suppression', 
                    value: '**2 minutes** après l\'affichage', 
                    inline: true 
                }
            )
            .addFields(
                { 
                    name: '📋 Messages concernés', 
                    value: '• `/nowplaying` - Musique en cours\n• `/skip` - Musique passée\n• `/lyrics` - Paroles de chanson\n• `/songinfo` - Informations détaillées\n• `/play` - Informations de la musique', 
                    inline: false 
                }
            )
            .setFooter({ text: `Demandé par ${interaction.user.tag}` })
            .setTimestamp();

        if (guildMessages.size > 0) {
            embed.addFields({
                name: '🎯 Messages en surveillance',
                value: `IDs: \`${Array.from(guildMessages).join('`, `')}\``,
                inline: false
            });
        }

        return interaction.editReply({ embeds: [embed] });
    }
};








