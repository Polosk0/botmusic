const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Mélanger la file d\'attente'),
    
    async execute(interaction) {
        if (!voiceManager.isConnected(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Le bot n\'est pas connecté à un salon vocal!',
                flags: 64
            });
        }

        const queue = voiceManager.getQueue(interaction.guild);

        if (queue.length < 2) {
            return interaction.editReply({
                content: '❌ Il faut au moins 2 musiques dans la queue pour mélanger!',
                flags: 64
            });
        }

        voiceManager.shuffle(interaction.guild);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔀 Queue mélangée')
            .setDescription(`La file d'attente a été mélangée avec succès!`)
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
