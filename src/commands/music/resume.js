const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Reprendre la musique mise en pause'),
    
    async execute(interaction) {
        if (!voiceManager.isConnected(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Le bot n\'est pas connecté à un salon vocal!',
                flags: 64
            });
        }

        if (!voiceManager.isPaused(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Aucune musique n\'est en pause!',
                flags: 64
            });
        }

        voiceManager.resume(interaction.guild);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('▶️ Musique reprise')
            .setDescription('La musique a été reprise avec succès!')
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
