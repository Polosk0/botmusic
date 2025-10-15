const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');
const autoDeleteManager = require('../../utils/autoDeleteManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('songinfo')
        .setDescription('Afficher des informations détaillées sur la musique en cours'),
    
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

        const track = voiceManager.getCurrentTrack(interaction.guild);
        const queue = voiceManager.getQueue(interaction.guild);
        const volume = voiceManager.getVolume(interaction.guild);
        const isLooping = voiceManager.getLoopMode(interaction.guild);
        const isShuffled = voiceManager.getShuffleState(interaction.guild);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('ℹ️ Informations détaillées')
            .setDescription(`**[${track.title}](${track.url})**`)
            .addFields(
                { name: '👤 Artiste', value: track.uploader || 'Inconnu', inline: true },
                { name: '⏱️ Durée', value: track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : 'Inconnue', inline: true },
                { name: '📺 Plateforme', value: 'YouTube', inline: true },
                { name: '🔊 Volume', value: `${volume}%`, inline: true },
                { name: '🔁 Répétition', value: isLooping ? 'Activé' : 'Désactivé', inline: true },
                { name: '🔀 Aléatoire', value: isShuffled ? 'Activé' : 'Désactivé', inline: true },
                { name: '📋 Queue', value: `${queue.length} musique(s) en attente`, inline: true },
                { name: '🎵 Statut', value: voiceManager.isPaused(interaction.guild) ? 'En pause' : 'En cours', inline: true },
                { name: '🔗 URL', value: `[Cliquer ici](${track.url})`, inline: true }
            )
            .setThumbnail(track.thumbnail || 'https://via.placeholder.com/150')
            .setFooter({ text: `Demandé par ${interaction.user.tag}` })
            .setTimestamp();

        const reply = await interaction.editReply({ embeds: [embed] });
        
        // Ajouter le message à la liste de surveillance pour suppression automatique
        autoDeleteManager.addMusicMessage(interaction.guild.id, reply);
        
        return reply;
    }
};
