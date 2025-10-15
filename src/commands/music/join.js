const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Faire rejoindre le bot au salon vocal'),
    
    async execute(interaction) {
        const channel = interaction.member.voice.channel;

        if (!channel) {
            return interaction.editReply({
                content: '❌ Vous devez être dans un salon vocal pour utiliser cette commande!',
                flags: 64
            });
        }

        try {
            await voiceManager.joinChannel(channel);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔊 Bot connecté')
                .setDescription(`Le bot a rejoint le salon vocal **${channel.name}**`)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande join:', error);
            return interaction.editReply({
                content: `❌ Impossible de rejoindre le salon vocal: ${error.message}`,
                flags: 64
            });
        }
    }
};
