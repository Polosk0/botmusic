const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Faire quitter le bot du salon vocal'),
    
    async execute(interaction) {
        // Vérifier d'abord les connexions YouTube
        const isYouTubeConnected = voiceManager.isConnected(interaction.guild);
        
        // Vérifier aussi les connexions radio
        let isRadioConnected = false;
        try {
            const radioModule = require('./radio');
            if (radioModule.radioState && radioModule.radioState.connection && 
                radioModule.radioState.connection.joinConfig.guildId === interaction.guild.id) {
                isRadioConnected = true;
            }
        } catch (error) {
            // Ignorer les erreurs de module
        }

        if (!isYouTubeConnected && !isRadioConnected) {
            return interaction.editReply({
                content: '❌ Le bot n\'est pas connecté à un salon vocal!',
                flags: 64
            });
        }

        const channel = interaction.member.voice.channel;
        const channelName = channel?.name || 'salon vocal';
        
        // Arrêter la radio si elle est active
        if (isRadioConnected) {
            try {
                const radioModule = require('./radio');
                if (radioModule.radioState && radioModule.radioState.player) {
                    radioModule.radioState.player.stop();
                }
                if (radioModule.radioState && radioModule.radioState.connection) {
                    radioModule.radioState.connection.destroy();
                }
                // Réinitialiser l'état radio
                radioModule.radioState.currentStation = null;
                radioModule.radioState.connection = null;
                radioModule.radioState.player = null;
                radioModule.radioState.lockedChannel = null;
                radioModule.radioState.lockedBy = null;
                radioModule.radioState.lockedAt = null;
                radioModule.radioState.isLocked = false;
                console.log('📻 Radio arrêtée via commande /leave');
            } catch (error) {
                console.log(`⚠️ Erreur lors de l'arrêt de la radio: ${error.message}`);
            }
        }
        
        // Déconnecter la connexion YouTube si elle existe
        if (isYouTubeConnected) {
            await voiceManager.leaveChannel(interaction.guild);
        }

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('👋 Bot déconnecté')
            .setDescription(`Le bot a quitté le salon vocal **${channelName}**`)
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
