const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const autoDeleteManager = require('../../utils/autoDeleteManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-music-messages')
        .setDescription('Supprimer immédiatement tous les messages musicaux surveillés')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(interaction) {
        // Vérifier les permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.editReply({
                content: '❌ Vous devez avoir la permission "Gérer les messages" pour utiliser cette commande!',
                flags: 64
            });
        }

        const guildMessages = autoDeleteManager.getGuildMessages(interaction.guild.id);
        
        if (guildMessages.size === 0) {
            return interaction.editReply({
                content: '✅ Aucun message musical en surveillance sur ce serveur.',
                flags: 64
            });
        }

        try {
            // Supprimer immédiatement tous les messages surveillés
            await autoDeleteManager.forceDeleteGuildMessages(interaction.guild.id, interaction.channel);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🗑️ Messages musicaux supprimés')
                .setDescription(`**${guildMessages.size}** message(s) musical(aux) supprimé(s) avec succès!`)
                .addFields(
                    { 
                        name: '📋 Types de messages supprimés', 
                        value: '• Messages "Now Playing"\n• Messages "Musique passée"\n• Messages "Paroles de chanson"\n• Messages "Informations de la musique"', 
                        inline: false 
                    }
                )
                .setFooter({ text: `Exécuté par ${interaction.user.tag}` })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Erreur lors de la suppression des messages:', error);
            
            return interaction.editReply({
                content: '❌ Erreur lors de la suppression des messages musicaux!',
                flags: 64
            });
        }
    }
};








