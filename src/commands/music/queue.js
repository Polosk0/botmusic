const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Afficher la file d\'attente des musiques'),
    
    async execute(interaction) {
        if (!voiceManager.isConnected(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Le bot n\'est pas connecté à un salon vocal!',
                flags: 64
            });
        }

        const currentTrack = voiceManager.getCurrentTrack(interaction.guild);
        const queue = voiceManager.getQueue(interaction.guild);

        if (!currentTrack && queue.length === 0) {
            return interaction.editReply({
                content: '❌ Aucune musique dans la queue!',
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 File d\'attente');

        if (currentTrack) {
            embed.setDescription(`**Musique actuelle:**\n[${currentTrack.title}](${currentTrack.url})`)
                .setThumbnail(currentTrack.thumbnail || 'https://via.placeholder.com/150');
        }

        if (queue.length > 0) {
            const queueList = queue.slice(0, 10).map((track, index) => 
                `${index + 1}. [${track.title}](${track.url})`
            ).join('\n');

            embed.addFields({
                name: 'Prochaines musiques',
                value: queueList + (queue.length > 10 ? `\n... et ${queue.length - 10} autres` : ''),
                inline: false
            });
        } else {
            embed.addFields({
                name: 'Prochaines musiques',
                value: 'Aucune musique en attente',
                inline: false
            });
        }

        embed.setFooter({ text: `Total: ${queue.length + (currentTrack ? 1 : 0)} musique(s)` })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
