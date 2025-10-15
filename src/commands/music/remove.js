const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Supprimer une musique de la file d\'attente')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position de la musique à supprimer (1 = première en attente)')
                .setRequired(true)
                .setMinValue(1)),
    
    async execute(interaction) {
        if (!voiceManager.isConnected(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Le bot n\'est pas connecté à un salon vocal!',
                flags: 64
            });
        }

        const position = interaction.options.getInteger('position');
        const queue = voiceManager.getQueue(interaction.guild);

        if (position > queue.length) {
            return interaction.editReply({
                content: `❌ Position invalide! Il n'y a que ${queue.length} musique(s) en attente.`,
                flags: 64
            });
        }

        const trackToRemove = voiceManager.removeFromQueue(interaction.guild, position - 1);

        if (!trackToRemove) {
            return interaction.editReply({
                content: '❌ Impossible de supprimer cette musique!',
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🗑️ Musique supprimée')
            .setDescription(`**${trackToRemove.title}** a été supprimée de la queue`)
            .setThumbnail(trackToRemove.thumbnail || 'https://via.placeholder.com/150')
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
