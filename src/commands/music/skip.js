const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');
const autoDeleteManager = require('../../utils/autoDeleteManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Passer à la musique suivante'),
    
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

        const currentTrack = voiceManager.getCurrentTrack(interaction.guild);
        const queue = voiceManager.getQueue(interaction.guild);

        if (queue.length === 0) {
            return interaction.editReply({
                content: '❌ Aucune musique suivante dans la queue!',
                flags: 64
            });
        }

        await voiceManager.skip(interaction.guild);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('⏭️ Musique passée')
            .setDescription(`Musique passée: **${currentTrack?.title || 'Inconnue'}**`)
            .setTimestamp();

        const reply = await interaction.editReply({ embeds: [embed] });
        
        // Ajouter le message à la liste de surveillance pour suppression automatique
        autoDeleteManager.addMusicMessage(interaction.guild.id, reply);
        
        return reply;
    }
};
