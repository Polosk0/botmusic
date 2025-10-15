const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Mettre en pause la musique en cours'),
    
    async execute(interaction) {
        if (!voiceManager.isConnected(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Le bot n\'est pas connecté à un salon vocal!',
                flags: 64
            });
        }

        if (!voiceManager.isPlaying(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Aucune musique n\'est en cours de lecture!',
                flags: 64
            });
        }

        voiceManager.pause(interaction.guild);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('⏸️ Musique mise en pause')
            .setDescription('La musique a été mise en pause avec succès!')
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
