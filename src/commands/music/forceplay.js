const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forceplay')
        .setDescription('Forcer le démarrage de la musique en queue'),
    
    async execute(interaction) {
        if (!voiceManager.isConnected(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Le bot n\'est pas connecté à un salon vocal!',
                flags: 64
            });
        }

        const queue = voiceManager.getQueue(interaction.guild);
        const currentTrack = voiceManager.getCurrentTrack(interaction.guild);

        if (queue.length === 0 && !currentTrack) {
            return interaction.editReply({
                content: '❌ Aucune musique dans la queue!',
                flags: 64
            });
        }

        try {
            if (!voiceManager.isPlaying(interaction.guild)) {
                // Si pas de musique en cours mais qu'il y a une queue, jouer la suivante
                if (queue.length > 0) {
                    await voiceManager.playNext(interaction.guild);
                    
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('▶️ Lecture forcée')
                        .setDescription('La musique a été forcée à démarrer!')
                        .setTimestamp();

                    return interaction.editReply({ embeds: [embed] });
                } else {
                    return interaction.editReply({
                        content: '❌ Aucune musique à jouer!',
                        flags: 64
                    });
                }
            } else {
                return interaction.editReply({
                    content: '✅ La musique est déjà en cours de lecture!',
                    flags: 64
                });
            }
        } catch (error) {
            console.error('Erreur dans forceplay:', error);
            return interaction.editReply({
                content: `❌ Erreur lors du démarrage de la musique: ${error.message}`,
                flags: 64
            });
        }
    }
};
