const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/advancedLogger');

// Créer une instance du logger pour ce module
const logger = new Logger();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Supprimer un nombre spécifique de messages dans le canal actuel')
        .addIntegerOption(option =>
            option.setName('nombre')
                .setDescription('Nombre de messages à supprimer (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            // Vérifier les permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({
                    content: '❌ **Permission refusée**\n\nVous devez avoir la permission "Gérer les messages" pour utiliser cette commande.',
                    ephemeral: true
                });
            }

            const nombre = interaction.options.getInteger('nombre');
            
            // Vérifier que le nombre est valide
            if (nombre < 1 || nombre > 100) {
                return interaction.reply({
                    content: '❌ **Nombre invalide**\n\nLe nombre de messages à supprimer doit être entre 1 et 100.',
                    ephemeral: true
                });
            }

            // Répondre immédiatement pour éviter le timeout
            await interaction.reply({
                content: `🔄 **Suppression en cours...**\n\nSuppression de **${nombre}** message(s)...`,
                ephemeral: true
            });

            // Récupérer les messages à supprimer
            const messages = await interaction.channel.messages.fetch({ limit: nombre });
            
            // Filtrer les messages qui ne peuvent pas être supprimés (plus de 14 jours)
            const messagesToDelete = messages.filter(msg => {
                const messageAge = Date.now() - msg.createdTimestamp;
                const fourteenDays = 14 * 24 * 60 * 60 * 1000; // 14 jours en millisecondes
                return messageAge < fourteenDays;
            });

            if (messagesToDelete.size === 0) {
                return interaction.editReply({
                    content: '❌ **Aucun message à supprimer**\n\nTous les messages sont trop anciens (plus de 14 jours) pour être supprimés.'
                });
            }

            // Supprimer les messages
            const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true);

            // Créer l'embed de confirmation
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('🗑️ **Messages Supprimés**')
                .setDescription(`✅ **${deletedMessages.size}** message(s) ont été supprimés avec succès`)
                .addFields(
                    {
                        name: '📊 **Détails**',
                        value: [
                            `🗑️ **Messages supprimés:** ${deletedMessages.size}`,
                            `📝 **Messages demandés:** ${nombre}`,
                            `⏰ **Heure:** ${new Date().toLocaleTimeString('fr-FR')}`,
                            `👤 **Par:** ${interaction.user.tag}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '⚠️ **Note**',
                        value: 'Les messages de plus de 14 jours ne peuvent pas être supprimés automatiquement.',
                        inline: false
                    }
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp();

            // Mettre à jour la réponse
            await interaction.editReply({
                content: '',
                embeds: [embed]
            });

            // Logger l'action
            logger.success(`🗑️ ${interaction.user.tag} a supprimé ${deletedMessages.size} messages dans #${interaction.channel.name}`);

        } catch (error) {
            logger.error('Erreur lors de la suppression des messages:', error);
            
            // Gérer les erreurs spécifiques
            if (error.code === 50034) {
                return interaction.editReply({
                    content: '❌ **Erreur de suppression**\n\nLes messages sont trop anciens (plus de 14 jours) pour être supprimés automatiquement.'
                });
            }
            
            if (error.code === 50013) {
                return interaction.editReply({
                    content: '❌ **Permission insuffisante**\n\nJe n\'ai pas les permissions nécessaires pour supprimer des messages dans ce canal.'
                });
            }

            await interaction.editReply({
                content: '❌ **Erreur lors de la suppression des messages**\n\nUne erreur inattendue s\'est produite.'
            });
        }
    }
};