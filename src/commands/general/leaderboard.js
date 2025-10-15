const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ComprehensiveLeaderboardTracker = require('../../utils/comprehensiveLeaderboardTracker');
const {
    createTabButtons,
    createOverviewEmbed,
    createMessagesEmbed,
    createVoiceEmbed,
    createActivityEmbed,
    createEngagementEmbed
} = require('../../utils/leaderboardEmbedUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Afficher les statistiques complètes du serveur avec onglets interactifs'),
    
    async execute(interaction) {
        try {
            const data = ComprehensiveLeaderboardTracker.getLeaderboardData();
            
            const embed = createOverviewEmbed(data, interaction.client);
            const buttonRows = createTabButtons('overview', interaction.user.id);
            
            const response = await interaction.editReply({ 
                embeds: [embed], 
                components: buttonRows 
            });

            const collector = response.createMessageComponentCollector({ 
                time: 600000
            });

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.user.id !== interaction.user.id) {
                    return buttonInteraction.reply({
                        content: '❌ Seul l\'utilisateur qui a lancé la commande peut utiliser ces boutons.',
                        ephemeral: true
                    });
                }

                try {
                    const updatedData = ComprehensiveLeaderboardTracker.getLeaderboardData();
                    
                    // Log pour debug
                    console.log('🔍 Données récupérées pour onglet:', buttonInteraction.customId);
                    console.log('📊 Utilisateurs:', Object.keys(updatedData.users).length);
                    console.log('🤖 Bots:', Object.keys(updatedData.bots).length);
                    
                    let newEmbed;
                    let currentTab;

                    if (buttonInteraction.customId === 'leaderboard_overview') {
                        newEmbed = createOverviewEmbed(updatedData, interaction.client);
                        currentTab = 'overview';
                    } else if (buttonInteraction.customId === 'leaderboard_messages') {
                        newEmbed = createMessagesEmbed(updatedData, interaction.client);
                        currentTab = 'messages';
                    } else if (buttonInteraction.customId === 'leaderboard_voice') {
                        newEmbed = createVoiceEmbed(updatedData, interaction.client);
                        currentTab = 'voice';
                    } else if (buttonInteraction.customId === 'leaderboard_activity') {
                        newEmbed = createActivityEmbed(updatedData, interaction.client);
                        currentTab = 'activity';
                    } else if (buttonInteraction.customId === 'leaderboard_engagement') {
                        newEmbed = createEngagementEmbed(updatedData, interaction.client);
                        currentTab = 'engagement';
                    } else if (buttonInteraction.customId === 'leaderboard_reset') {
                        // Vérifier que c'est polosko (ID: 1088121021044887572)
                        if (buttonInteraction.user.id !== '1088121021044887572') {
                            await buttonInteraction.reply({
                                content: '❌ **Accès refusé**\n\nSeul **polosko** peut réinitialiser la base de données du leaderboard.',
                                ephemeral: true
                            });
                            return;
                        }

                        // Demander confirmation pour la réinitialisation
                        const confirmEmbed = new EmbedBuilder()
                            .setColor('#FF6B6B')
                            .setTitle('⚠️ **CONFIRMATION REQUISE**')
                            .setDescription('Êtes-vous sûr de vouloir réinitialiser toutes les données du leaderboard ?\n\n**Cette action est irréversible !**')
                            .addFields(
                                {
                                    name: '🗑️ **Données qui seront supprimées :**',
                                    value: [
                                        '• Temps de diffusion musicale',
                                        '• Présence vocale des utilisateurs',
                                        '• Messages des utilisateurs',
                                        '• Messages des bots',
                                        '• Toutes les statistiques'
                                    ].join('\n'),
                                    inline: false
                                },
                                {
                                    name: '👑 **Accès autorisé :**',
                                    value: 'polosko uniquement',
                                    inline: true
                                }
                            )
                            .setFooter({ text: 'Cliquez sur "Confirmer" pour continuer ou ignorez pour annuler' })
                            .setTimestamp();

                        const confirmButtons = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('leaderboard_reset_confirm')
                                    .setLabel('Confirmer')
                                    .setStyle(ButtonStyle.Danger)
                                    .setEmoji('✅'),
                                new ButtonBuilder()
                                    .setCustomId('leaderboard_reset_cancel')
                                    .setLabel('Annuler')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setEmoji('❌')
                            );

                        await buttonInteraction.update({
                            embeds: [confirmEmbed],
                            components: [confirmButtons]
                        });
                        return;
                    } else if (buttonInteraction.customId === 'leaderboard_reset_confirm') {
                        // Vérifier à nouveau que c'est polosko
                        if (buttonInteraction.user.id !== '1088121021044887572') {
                            await buttonInteraction.reply({
                                content: '❌ **Accès refusé**\n\nSeul **polosko** peut réinitialiser la base de données du leaderboard.',
                                ephemeral: true
                            });
                            return;
                        }

                        // Réinitialiser les données
                        ComprehensiveLeaderboardTracker.resetAllData(interaction.client);
                        
                        const resetEmbed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle('✅ **DONNÉES RÉINITIALISÉES**')
                            .setDescription('Toutes les données du leaderboard ont été supprimées avec succès !\n\nLe tracking repart maintenant à zéro.')
                            .addFields(
                                {
                                    name: '👑 **Action effectuée par :**',
                                    value: buttonInteraction.user.tag,
                                    inline: true
                                },
                                {
                                    name: '⏰ **Heure :**',
                                    value: new Date().toLocaleString('fr-FR'),
                                    inline: true
                                }
                            )
                            .setFooter({ text: 'Redémarrage du tracking en cours...' })
                            .setTimestamp();

                        await buttonInteraction.update({
                            embeds: [resetEmbed],
                            components: []
                        });
                        return;
                    } else if (buttonInteraction.customId === 'leaderboard_reset_cancel') {
                        // Vérifier que c'est polosko
                        if (buttonInteraction.user.id !== '1088121021044887572') {
                            await buttonInteraction.reply({
                                content: '❌ **Accès refusé**\n\nSeul **polosko** peut utiliser cette fonctionnalité.',
                                ephemeral: true
                            });
                            return;
                        }

                        // Annuler la réinitialisation
                        const cancelledEmbed = new EmbedBuilder()
                            .setColor('#FFA500')
                            .setTitle('❌ **RÉINITIALISATION ANNULÉE**')
                            .setDescription('La réinitialisation a été annulée. Les données sont préservées.')
                            .addFields(
                                {
                                    name: '👑 **Action annulée par :**',
                                    value: buttonInteraction.user.tag,
                                    inline: true
                                },
                                {
                                    name: '⏰ **Heure :**',
                                    value: new Date().toLocaleString('fr-FR'),
                                    inline: true
                                }
                            )
                            .setTimestamp();

                        await buttonInteraction.update({
                            embeds: [cancelledEmbed],
                            components: []
                        });
                        return;
                    }

                    if (newEmbed && currentTab) {
                        const newButtonRows = createTabButtons(currentTab, interaction.user.id);
                        
                        await buttonInteraction.update({
                            embeds: [newEmbed],
                            components: newButtonRows
                        });
                    }

                } catch (error) {
                    console.error('Erreur lors de la mise à jour du leaderboard:', error);
                    await buttonInteraction.reply({
                        content: '❌ Une erreur est survenue lors de la mise à jour.',
                        ephemeral: true
                    });
                }
            });

            collector.on('end', () => {
                const disabledTabRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('leaderboard_overview')
                            .setLabel('Session Expirée')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('⏰')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('leaderboard_messages')
                            .setLabel('Verrouillé')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🔒')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('leaderboard_voice')
                            .setLabel('Inactif')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('💤')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('leaderboard_activity')
                            .setLabel('Fermé')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🔒')
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('leaderboard_engagement')
                            .setLabel('Inactif')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('💤')
                            .setDisabled(true)
                    );

                const disabledResetRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('leaderboard_reset')
                            .setLabel('Session Expirée')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('⏰')
                            .setDisabled(true)
                    );

                response.edit({ components: [disabledTabRow, disabledResetRow] }).catch(() => {});
            });

        } catch (error) {
            console.error('Erreur dans la commande leaderboard:', error);
            return interaction.editReply({
                content: '❌ Une erreur est survenue lors de la récupération des statistiques.',
                flags: 64
            });
        }
    }
};