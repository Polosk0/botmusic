const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Avancer ou reculer dans la musique (fonctionnalité limitée)')
        .addStringOption(option =>
            option.setName('temps')
                .setDescription('Temps au format MM:SS (ex: 1:30 pour 1 minute 30 secondes)')
                .setRequired(true)),
    
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

        const timeInput = interaction.options.getString('temps');
        
        // Valider le format du temps (MM:SS)
        const timeRegex = /^(\d{1,2}):(\d{2})$/;
        const match = timeInput.match(timeRegex);
        
        if (!match) {
            return interaction.editReply({
                content: '❌ Format de temps invalide! Utilisez le format MM:SS (ex: 1:30)',
                flags: 64
            });
        }

        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        
        if (seconds >= 60) {
            return interaction.editReply({
                content: '❌ Les secondes doivent être inférieures à 60!',
                flags: 64
            });
        }

        const totalSeconds = minutes * 60 + seconds;
        
        const currentTrack = voiceManager.getCurrentTrack(interaction.guild);
        
        if (!currentTrack || !currentTrack.duration) {
            return interaction.editReply({
                content: '❌ Impossible de déterminer la durée de la musique!',
                flags: 64
            });
        }

        if (totalSeconds > currentTrack.duration) {
            return interaction.editReply({
                content: `❌ Le temps demandé (${timeInput}) dépasse la durée de la musique (${Math.floor(currentTrack.duration / 60)}:${(currentTrack.duration % 60).toString().padStart(2, '0')})!`,
                flags: 64
            });
        }

        // Note: @discordjs/voice ne supporte pas directement le seeking
        // Cette commande est préparée pour une future implémentation
        const embed = new EmbedBuilder()
            .setColor('#ffaa00')
            .setTitle('⚠️ Fonctionnalité Seek')
            .setDescription('La fonction de recherche dans la musique n\'est pas encore pleinement supportée par Discord.js Voice.')
            .addFields(
                { name: '🎵 **Musique actuelle**', value: currentTrack.title, inline: true },
                { name: '⏱️ **Durée totale**', value: `${Math.floor(currentTrack.duration / 60)}:${(currentTrack.duration % 60).toString().padStart(2, '0')}`, inline: true },
                { name: '🎯 **Temps demandé**', value: timeInput, inline: true },
                { name: '📝 **Note**', value: 'Cette fonctionnalité sera implémentée dans une future version avec un système de streaming plus avancé.', inline: false }
            )
            .setThumbnail(currentTrack.thumbnail || 'https://via.placeholder.com/150')
            .setFooter({ 
                text: '⚠️ Fonctionnalité en développement',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};









