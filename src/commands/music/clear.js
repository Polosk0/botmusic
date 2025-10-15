const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Vider complètement la file d\'attente'),
    
    async execute(interaction) {
        if (!voiceManager.isConnected(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Le bot n\'est pas connecté à un salon vocal!',
                flags: 64
            });
        }

        const queue = voiceManager.getQueue(interaction.guild);
        const trackCount = queue.length;
        
        if (trackCount === 0) {
            return interaction.editReply({
                content: '❌ La file d\'attente est déjà vide!',
                flags: 64
            });
        }

        voiceManager.clearQueue(interaction.guild);

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🗑️ File d\'attente vidée')
            .setDescription(`${trackCount} musique(s) ont été supprimées de la queue`)
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
