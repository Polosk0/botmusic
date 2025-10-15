const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Recréer le canal actuel avec les mêmes permissions (DANGEREUX)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        // Vérifier les permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Vous devez être **Administrateur** du serveur pour utiliser cette commande!',
                ephemeral: true
            });
        }

        const channel = interaction.channel;
        const guild = interaction.guild;

        // Embed d'avertissement sévère
        const warningEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚨 DANGER - NUKE CANAL')
            .setDescription(`**${interaction.user.tag}** (Administrateur) s'apprête à **DÉTRUIRE** ce canal!`)
            .addFields(
                { name: '💥 **Action**', value: 'Suppression et recréation du canal', inline: true },
                { name: '👤 **Utilisateur**', value: `${interaction.user.tag} (Admin)`, inline: true },
                { name: '📅 **Date**', value: new Date().toLocaleString('fr-FR'), inline: true },
                { name: '🔒 **Sécurité**', value: 'Commande réservée aux **Administrateurs**', inline: true },
                { name: '⚠️ **CONSÉQUENCES**', value: '• Tous les messages seront **PERDUS**\n• Le canal sera **SUPPRIMÉ**\n• Un nouveau canal sera **CRÉÉ**\n• Les permissions seront **COPIÉES**', inline: false },
                { name: '🚨 **AVERTISSEMENT**', value: 'Cette action est **EXTRÊMEMENT DANGEREUSE** et **IRRÉVERSIBLE**!', inline: false }
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setImage('https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif')
            .setFooter({ 
                text: '💀 COMMANDE NUKE • DESTRUCTION TOTALE',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        // Boutons de confirmation avec style danger
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_nuke')
                    .setLabel('NUKE CANAL')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💀'),
                new ButtonBuilder()
                    .setCustomId('cancel_nuke')
                    .setLabel('ANNULER')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🛡️')
            );

        const warningMessage = await interaction.reply({
            embeds: [warningEmbed],
            components: [confirmRow],
            ephemeral: false
        });

        // Collecteur d'interactions pour les boutons
        const filter = (buttonInteraction) => {
            return buttonInteraction.user.id === interaction.user.id && 
                   (buttonInteraction.customId === 'confirm_nuke' || buttonInteraction.customId === 'cancel_nuke');
        };

        try {
            const buttonInteraction = await interaction.channel.awaitMessageComponent({
                filter,
                time: 30000 // 30 secondes
            });

            if (buttonInteraction.customId === 'confirm_nuke') {
                // Supprimer le message d'avertissement
                await warningMessage.delete().catch(() => {});

                console.log('💥 NUKE: Sauvegarde des données du canal...');
                console.log(`📋 Nom: ${channel.name}`);
                console.log(`📋 Type: ${channel.type}`);
                console.log(`📋 Permissions: ${channel.permissionOverwrites.cache.size}`);
                console.log(`📋 Position: ${channel.position}`);
                console.log(`📋 Slowmode: ${channel.rateLimitPerUser || 0}s`);
                console.log(`📋 Bitrate: ${channel.bitrate || 'N/A'}`);

                // Sauvegarder les informations du canal
                const channelData = {
                    name: channel.name,
                    type: channel.type,
                    topic: channel.topic,
                    nsfw: channel.nsfw,
                    parentId: channel.parentId,
                    position: channel.position,
                    rateLimitPerUser: channel.rateLimitPerUser,
                    bitrate: channel.bitrate,
                    userLimit: channel.userLimit,
                    rtcRegion: channel.rtcRegion,
                    videoQualityMode: channel.videoQualityMode,
                    permissionOverwrites: channel.permissionOverwrites.cache.map(overwrite => ({
                        id: overwrite.id,
                        type: overwrite.type,
                        allow: overwrite.allow,
                        deny: overwrite.deny
                    }))
                };

                // Créer le nouveau canal
                const newChannel = await guild.channels.create({
                    name: channelData.name,
                    type: channelData.type,
                    topic: channelData.topic,
                    nsfw: channelData.nsfw,
                    parent: channelData.parentId,
                    position: channelData.position,
                    rateLimitPerUser: channelData.rateLimitPerUser,
                    bitrate: channelData.bitrate,
                    userLimit: channelData.userLimit,
                    rtcRegion: channelData.rtcRegion,
                    videoQualityMode: channelData.videoQualityMode,
                    permissionOverwrites: channelData.permissionOverwrites
                });

                // Supprimer l'ancien canal
                await channel.delete();

                console.log('✅ NUKE: Nouveau canal créé avec succès!');
                console.log(`🆕 Nouveau ID: ${newChannel.id}`);
                console.log(`🆕 Permissions restaurées: ${newChannel.permissionOverwrites.cache.size}`);

                // Embed de confirmation dans le nouveau canal
                const successEmbed = new EmbedBuilder()
                    .setColor('#00ff88')
                    .setTitle('💥 NUKE TERMINÉ')
                    .setDescription(`Le canal a été **DÉTRUIT** et **RECRÉÉ** avec succès!`)
                    .addFields(
                        { name: '💀 **Ancien canal**', value: `#${channelData.name}`, inline: true },
                        { name: '✨ **Nouveau canal**', value: `<#${newChannel.id}>`, inline: true },
                        { name: '👤 **Modérateur**', value: interaction.user.tag, inline: true },
                        { name: '📊 **Statistiques**', value: `Permissions: ${channelData.permissionOverwrites.length}\nPosition: ${channelData.position}\nSlowmode: ${channelData.rateLimitPerUser || 0}s\nBitrate: ${channelData.bitrate || 'N/A'}`, inline: false },
                        { name: '✅ **Résultat**', value: 'Canal recréé avec toutes les permissions originales!', inline: false },
                        { name: '⏰ **Auto-suppression**', value: 'Ce message sera supprimé dans **1 minute**', inline: false }
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setImage('https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif')
                    .setFooter({ 
                        text: '💥 NUKE SUCCESSFUL • Canal recréé • Auto-suppression dans 1min',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();

                const nukeMessage = await newChannel.send({
                    embeds: [successEmbed]
                });

                // Supprimer le message après 1 minute
                console.log(`💥 NUKE: Message de confirmation programmé pour suppression dans 60s`);
                setTimeout(async () => {
                    try {
                        console.log(`💥 NUKE: Tentative de suppression du message de confirmation...`);
                        await nukeMessage.delete();
                        console.log(`✅ NUKE: Message de confirmation supprimé avec succès`);
                    } catch (error) {
                        console.log(`❌ NUKE: Impossible de supprimer le message de confirmation:`, error.message);
                    }
                }, 60000);

            } else if (buttonInteraction.customId === 'cancel_nuke') {
                // Supprimer le message d'avertissement
                await warningMessage.delete().catch(() => {});

                const cancelEmbed = new EmbedBuilder()
                    .setColor('#00ff88')
                    .setTitle('🛡️ NUKE ANNULÉ')
                    .setDescription(`**${interaction.user.tag}** a annulé la destruction du canal!`)
                    .addFields(
                        { name: '✅ **Résultat**', value: 'Le canal est **SAUVÉ**!', inline: true },
                        { name: '👤 **Utilisateur**', value: interaction.user.tag, inline: true },
                        { name: '📅 **Heure**', value: new Date().toLocaleString('fr-FR'), inline: true },
                        { name: '⏰ **Auto-suppression**', value: 'Ce message sera supprimé dans **1 minute**', inline: false }
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter({ text: '🛡️ Destruction évitée • Auto-suppression dans 1min' })
                    .setTimestamp();

                const cancelMessage = await buttonInteraction.reply({
                    embeds: [cancelEmbed],
                    ephemeral: false
                });

                // Supprimer le message après 1 minute
                console.log(`💥 NUKE: Message d'annulation programmé pour suppression dans 60s`);
                setTimeout(async () => {
                    try {
                        console.log(`💥 NUKE: Tentative de suppression du message d'annulation...`);
                        await cancelMessage.delete();
                        console.log(`✅ NUKE: Message d'annulation supprimé avec succès`);
                    } catch (error) {
                        console.log(`❌ NUKE: Impossible de supprimer le message d'annulation:`, error.message);
                    }
                }, 60000);
            }

        } catch (error) {
            // Timeout ou erreur
            await warningMessage.delete().catch(() => {});
            
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#ff6b35')
                .setTitle('⏰ Timeout')
                .setDescription('La confirmation pour nuker le canal a expiré.')
                .setFooter({ text: '⏰ Temps écoulé' })
                .setTimestamp();

            await interaction.followUp({
                embeds: [timeoutEmbed],
                ephemeral: true
            });
        }
    },
};
