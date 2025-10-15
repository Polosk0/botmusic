const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('✨ Afficher l\'interface d\'aide époustouflante du bot musical'),
    
    async execute(interaction) {
        // Couleurs dynamiques basées sur l'heure
        const hour = new Date().getHours();
        const colors = {
            primary: hour < 6 ? '#1a1a2e' : hour < 12 ? '#16213e' : hour < 18 ? '#0f3460' : '#533483',
            secondary: hour < 6 ? '#16213e' : hour < 12 ? '#0f3460' : hour < 18 ? '#533483' : '#1a1a2e',
            accent: hour < 6 ? '#e94560' : hour < 12 ? '#f39c12' : hour < 18 ? '#27ae60' : '#8e44ad',
            gradient: hour < 6 ? '🌙' : hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌆'
        };

        const mainEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`${colors.gradient} 🕲- 𝘮 Bot Musical Premium ${colors.gradient}`)
            .setDescription(`✨ **Bienvenue dans l'expérience musicale ultime !** ✨\n\n🎶 *Le bot musical le plus avancé et élégant de Discord* 🎶\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            .addFields(
                {
                    name: '🎮 **Navigation Interactive**',
                    value: 'Utilisez les boutons ci-dessous pour explorer les différentes catégories de commandes et fonctionnalités.',
                    inline: false
                },
                {
                    name: '📊 **Statistiques en Temps Réel**',
                    value: [
                        `🤖 **Nom:** 🕲- 𝘮`,
                        `📦 **Version:** 2.0.0 Premium`,
                        `🎵 **Commandes:** 24 disponibles`,
                        `🌍 **Plateformes:** YouTube, Spotify`,
                        `⚡ **Uptime:** ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
                        `💾 **Mémoire:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚡ **Accès Rapide**',
                    value: [
                        '🎶 `/play` - Commencer la musique',
                        '📋 `/queue` - Voir la file',
                        '🎤 `/nowplaying` - Musique actuelle',
                        '🔍 `/search` - Rechercher',
                        '🎵 `/lyrics` - Paroles Genius',
                        '🔄 `/loop` - Mode répétition'
                    ].join('\n'),
                    inline: true
                }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setImage('https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif')
            .setFooter({ 
                text: `🎵 Bot Musical Premium • Créé avec ❤️ par Polosko • Version 2.0.0 • ${colors.gradient} ${new Date().toLocaleTimeString('fr-FR')}`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        const musicEmbed = new EmbedBuilder()
            .setColor(colors.accent)
            .setTitle('🎵 Commandes Musicales')
            .setDescription('🎶 Toutes les commandes pour contrôler la musique avec style')
            .addFields(
                {
                    name: '🎶 **Lecture & Connexion**',
                    value: [
                        '🎶 `/play <musique>` - Jouer une musique ou playlist',
                        '⚡ `/forceplay` - Forcer la lecture immédiate',
                        '🔊 `/join` - Rejoindre le salon vocal',
                        '👋 `/leave` - Quitter le salon vocal'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⏯️ **Contrôles Avancés**',
                    value: [
                        '⏸️ `/pause` - Mettre en pause',
                        '▶️ `/resume` - Reprendre la lecture',
                        '⏭️ `/skip` - Passer à la suivante',
                        '⏹️ `/stop` - Arrêter complètement',
                        '⏰ `/seek <temps>` - Avancer/reculer'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📋 **Gestion Queue**',
                    value: [
                        '📋 `/queue` - Voir la file d\'attente',
                        '🔀 `/shuffle` - Mélanger aléatoirement',
                        '🔄 `/loop <mode>` - Mode de répétition',
                        '🗑️ `/remove <position>` - Supprimer une musique',
                        '🧹 `/clear` - Vider la queue'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🔍 **Informations & Recherche**',
                    value: [
                        '🎤 `/nowplaying` - Musique actuelle',
                        '🔍 `/search <terme>` - Rechercher des musiques',
                        '📝 `/lyrics` - Afficher les paroles Genius',
                        'ℹ️ `/songinfo` - Infos détaillées',
                        '📻 `/radio` - Stations de radio live (Admin)'
                    ].join('\n'),
                    inline: true
                }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `Page 1/4 • Commandes Musicales • ${colors.gradient} ${new Date().toLocaleTimeString('fr-FR')}` })
            .setTimestamp();

        const moderationEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🛡️ Commandes de Modération')
            .setDescription('🔒 Commandes pour la gestion sécurisée du serveur')
            .addFields(
                {
                    name: '🗑️ **Gestion des Messages**',
                    value: [
                        '🗑️ `/purge <nombre>` - Supprimer des messages',
                        '💥 `/nuke` - Recréer le canal complet'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⚠️ **Sécurité & Permissions**',
                    value: [
                        '🔐 **Permissions requises:** Administrateur',
                        '🛡️ **Protection:** Anti-spam intégrée',
                        '⏰ **Timeout:** 30 secondes de confirmation',
                        '📝 **Logs:** Toutes les actions sont enregistrées'
                    ].join('\n'),
                    inline: false
                }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `Page 2/4 • Commandes de Modération • ${colors.gradient} ${new Date().toLocaleTimeString('fr-FR')}` })
            .setTimestamp();

        const utilityEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('ℹ️ Commandes Utilitaires')
            .setDescription('📊 Commandes d\'information et de diagnostic avancé')
            .addFields(
                {
                    name: '📊 **Diagnostic & Performance**',
                    value: [
                        '🏓 `/ping` - Vérifier la latence réseau',
                        '📊 `/status` - Statut complet du bot',
                        '🔐 `/permissions` - Vérifier les permissions',
                        '🏆 `/leaderboard` - Statistiques de diffusion et présence'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🔧 **Informations Techniques**',
                    value: [
                        `⚡ **Node.js:** ${process.version}`,
                        `💾 **Mémoire:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                        `⏱️ **Uptime:** ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
                        `🌐 **Discord.js:** ${require('discord.js').version}`
                    ].join('\n'),
                    inline: false
                }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `Page 3/4 • Commandes Utilitaires • ${colors.gradient} ${new Date().toLocaleTimeString('fr-FR')}` })
            .setTimestamp();

        const platformsEmbed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('📺 Plateformes & Fonctionnalités')
            .setDescription('🌟 Plateformes supportées et fonctionnalités disponibles')
            .addFields(
                {
                    name: '🎵 **Plateformes Actuellement Supportées**',
                    value: [
                        '🎥 **YouTube** ✅ - Vidéos, playlists, lives (FONCTIONNEL)',
                        '🎵 **Spotify** ✅ - Musiques, albums, playlists (FONCTIONNEL)',
                        '',
                        '⚠️ **Plateformes en développement:**',
                        '🎧 **SoundCloud** - Prévu prochainement',
                        '🎶 **Deezer** - À venir',
                        '🍎 **Apple Music** - En projet'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎮 **Fonctionnalités Disponibles**',
                    value: [
                        '🎵 **Lecture YouTube** - Qualité optimale',
                        '🎵 **Lecture Spotify** - Audio réel, métadonnées précises',
                        '📋 **Queue interactive** - Boutons de contrôle',
                        '🎤 **Paroles Genius** - Intégration automatique',
                        '🔄 **Modes de lecture** - Loop, shuffle, repeat',
                        '🗑️ **Auto-suppression** - Messages propres',
                        '🛡️ **Sécurité** - Commandes protégées'
                    ].join('\n'),
                    inline: true
                }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `Page 4/4 • Plateformes & Fonctionnalités • ${colors.gradient} ${new Date().toLocaleTimeString('fr-FR')}` })
            .setTimestamp();


        const createButtonRow = (activeButton = 'help_main') => {
            const buttonStyle = (id) => {
                if (activeButton === id) return ButtonStyle.Primary;
                return ButtonStyle.Secondary;
            };

            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('help_main')
                        .setLabel('Accueil')
                        .setStyle(buttonStyle('help_main'))
                        .setEmoji('🏠'),
                    new ButtonBuilder()
                        .setCustomId('help_music')
                        .setLabel('Musique')
                        .setStyle(buttonStyle('help_music'))
                        .setEmoji('🎵'),
                    new ButtonBuilder()
                        .setCustomId('help_moderation')
                        .setLabel('Modération')
                        .setStyle(buttonStyle('help_moderation'))
                        .setEmoji('🛡️'),
                    new ButtonBuilder()
                        .setCustomId('help_utility')
                        .setLabel('Utilitaires')
                        .setStyle(buttonStyle('help_utility'))
                        .setEmoji('ℹ️'),
                    new ButtonBuilder()
                        .setCustomId('help_platforms')
                        .setLabel('Plateformes')
                        .setStyle(buttonStyle('help_platforms'))
                        .setEmoji('📺')
                );
        };

        const row = createButtonRow('help_main');

        const response = await interaction.editReply({ 
            embeds: [mainEmbed], 
            components: [row] 
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 600000 // 10 minutes
        });

        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.user.id !== interaction.user.id) {
                return buttonInteraction.reply({ 
                    content: '❌ Seul l\'utilisateur qui a lancé la commande peut utiliser ces boutons.', 
                    ephemeral: true 
                });
            }

            let embedToShow;
            let componentsToShow;

            switch (buttonInteraction.customId) {
                case 'help_main':
                    embedToShow = mainEmbed;
                    componentsToShow = [createButtonRow('help_main')];
                    break;
                case 'help_music':
                    embedToShow = musicEmbed;
                    componentsToShow = [createButtonRow('help_music')];
                    break;
                case 'help_moderation':
                    embedToShow = moderationEmbed;
                    componentsToShow = [createButtonRow('help_moderation')];
                    break;
                case 'help_utility':
                    embedToShow = utilityEmbed;
                    componentsToShow = [createButtonRow('help_utility')];
                    break;
                case 'help_platforms':
                    embedToShow = platformsEmbed;
                    componentsToShow = [createButtonRow('help_platforms')];
                    break;
            }

            await buttonInteraction.update({ 
                embeds: [embedToShow], 
                components: componentsToShow 
            });
        });

        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('help_main_disabled')
                        .setLabel('Accueil')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🏠')
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('help_music_disabled')
                        .setLabel('Musique')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🎵')
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('help_moderation_disabled')
                        .setLabel('Modération')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🛡️')
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('help_utility_disabled')
                        .setLabel('Utilitaires')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('ℹ️')
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('help_platforms_disabled')
                        .setLabel('Plateformes')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📺')
                        .setDisabled(true)
                );


            try {
                await interaction.editReply({ 
                    embeds: [mainEmbed], 
                    components: [disabledRow] 
                });
            } catch (error) {
                // Le message peut avoir été supprimé, ignorer l'erreur
            }
        });
    }
};