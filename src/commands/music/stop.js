const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Arrêter la musique'),
    
    async execute(interaction) {
        if (!voiceManager.isConnected(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Le bot n\'est pas connecté à un salon vocal!',
                flags: 64
            });
        }

        voiceManager.stop(interaction.guild);

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('⏹️ Musique arrêtée')
            .setDescription('La musique a été arrêtée!')
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
