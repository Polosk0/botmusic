const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Vérifier l\'état simple du bot'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🔍 État du Bot')
            .setTimestamp();

        if (!voiceManager.isConnected(interaction.guild)) {
            embed.setDescription('❌ Aucune queue active')
                .addFields(
                    { name: 'État', value: 'Pas de queue', inline: true },
                    { name: 'Connexion', value: 'Non connecté', inline: true },
                    { name: 'Musiques', value: '0', inline: true }
                );
        } else {
            const isPlaying = voiceManager.isPlaying(interaction.guild);
            const trackCount = voiceManager.getQueue(interaction.guild).length;
            const currentTrack = voiceManager.getCurrentTrack(interaction.guild);
            const volume = voiceManager.getVolume(interaction.guild);

            embed.setDescription('✅ Queue active')
                .addFields(
                    { name: 'État', value: isPlaying ? '🎵 En cours' : '⏹️ Arrêté', inline: true },
                    { name: 'Musiques en queue', value: trackCount.toString(), inline: true },
                    { name: 'Volume', value: `${volume}%`, inline: true }
                );

            if (currentTrack) {
                embed.addFields({
                    name: '🎵 Musique actuelle',
                    value: `**${currentTrack.title}**\nArtiste: ${currentTrack.uploader || 'Inconnu'}`,
                    inline: false
                });
            }
        }

        return interaction.editReply({ embeds: [embed] });
    }
};
