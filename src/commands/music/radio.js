const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const { getVoiceConnection } = require('@discordjs/voice');
const Logger = require('../../utils/advancedLogger');
const LeaderboardTracker = require('../../utils/enhancedLeaderboardTracker');

// Créer une instance du logger pour ce module
const logger = new Logger();

// Importation des stations organisées par pays
const { SIMPLIFIED_RADIO_STATIONS, SIMPLIFIED_CATEGORIES, ALL_RADIO_STATIONS, RADIO_CATEGORIES } = require('./radio/index');

// Fonction pour mettre à jour le statut du bot
function updateBotStatus() {
    try {
        console.log('🔄 Tentative de mise à jour du statut du bot...');
        // Récupérer le gestionnaire de statut depuis index.js
        const { statusManager } = require('../../index');
        if (statusManager) {
            console.log('✅ StatusManager trouvé, mise à jour du statut...');
            statusManager.updateStatus();
        } else {
            console.log('❌ StatusManager non trouvé');
        }
    } catch (error) {
        console.log(`❌ Erreur lors de la mise à jour du statut: ${error.message}`);
    }
}

// Utiliser les stations simplifiées par défaut
const RADIO_STATIONS = SIMPLIFIED_RADIO_STATIONS;

// État global du bot radio
let radioState = {
    isLocked: false,
    currentStation: null,
    connection: null,
    player: null,
    lockedChannel: null,
    lockedBy: null,
    lockedAt: null
};

// Fonction pour créer l'embed de navigation par pays et styles
function createCountryNavigationEmbed() {
    const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle('🌍 **NAVIGATION PAR PAYS & STYLES** 🌍')
        .setDescription('🎵 **Choisissez un pays ou un style pour explorer ses stations de radio** 🎵\n\n' +
            '🇫🇷 **France** • 🇬🇧 **Royaume-Uni** • 🇺🇸 **États-Unis** • 🇦🇺 **Australie** • 🌍 **Internet**\n' +
            '🎤 **Rap & Hip-Hop** • 🎛️ **Techno & Electronic**')
        .setThumbnail('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/world-icon.png')
        .setImage('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/world-banner.png');

    // Afficher les statistiques par pays et styles
    const countryStats = [
        `🇫🇷 **France:** ${RADIO_CATEGORIES['🇫🇷 **RADIOS FRANÇAISES**'].length} stations`,
        `🇬🇧 **Royaume-Uni:** ${RADIO_CATEGORIES['🇬🇧 **RADIOS BRITANNIQUES**'].length} stations`,
        `🇺🇸 **États-Unis:** ${RADIO_CATEGORIES['🇺🇸 **RADIOS AMÉRICAINES**'].length} stations`,
        `🇦🇺 **Australie:** ${RADIO_CATEGORIES['🇦🇺 **RADIOS AUSTRALIENNES**'].length} stations`,
        `🌍 **Internet:** ${RADIO_CATEGORIES['🌍 **RADIOS INTERNET**'].length} stations`,
        `🎤 **Rap & Hip-Hop:** ${RADIO_CATEGORIES['🎤 **RAP & HIP-HOP**'].length} stations`,
        `🎛️ **Techno & Electronic:** ${RADIO_CATEGORIES['🎛️ **TECHNO & ELECTRONIC**'].length} stations`
    ];

    embed.addFields({
        name: '📊 **STATISTIQUES PAR CATÉGORIE**',
        value: countryStats.join('\n'),
        inline: false
    });

    embed.setFooter({ 
        text: `🌍 Radio Bot • Navigation par Pays & Styles • ${new Date().toLocaleTimeString('fr-FR')}`,
        iconURL: 'https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/world-icon.png'
    });

    return embed;
}

// Fonction pour créer l'embed des stations d'un pays
function createCountryStationsEmbed(countryKey, countryName, countryEmoji) {
    const stationIds = RADIO_CATEGORIES[countryKey];
    const stations = stationIds.map(id => ALL_RADIO_STATIONS[id]).filter(Boolean);
    
    const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle(`${countryEmoji} **${countryName.toUpperCase()}** ${countryEmoji}`)
        .setDescription(`🎵 **Stations de radio de ${countryName}** 🎵\n\n` +
            `📻 **${stations.length} stations disponibles** • 🎧 **Qualité HD**`)
        .setThumbnail('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/radio-icon.png')
        .setImage('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/radio-banner.png');

    if (stations.length > 0) {
        let stationList = '';
        for (let index = 0; index < stations.length; index++) {
            const station = stations[index];
            const rank = index + 1;
            const stationEntry = `${rank}. ${station.emoji} **${station.name}**\n` +
                               `   📝 ${station.description}\n` +
                               `   🎵 Style: **${station.style}**\n\n`;
            
            // Vérifier si l'ajout de cette station dépasserait la limite de 1024 caractères
            if (stationList.length + stationEntry.length > 1000) {
                stationList += `... et ${stations.length - index} autres stations`;
                break;
            }
            stationList += stationEntry;
        }
        
        embed.addFields({
            name: `📻 **STATIONS DE ${countryName.toUpperCase()}**`,
            value: stationList,
            inline: false
        });
    }

    embed.setFooter({ 
        text: `${countryEmoji} Radio Bot • ${countryName} • ${new Date().toLocaleTimeString('fr-FR')}`,
        iconURL: 'https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/radio-icon.png'
    });

    return embed;
}

// Fonction pour créer l'embed de sélection de radio
function createRadioSelectionEmbed() {
    const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle('📻 **RADIO STATION SELECTOR** 📻')
        .setDescription('🎵 **Choisissez votre station de radio préférée** 🎵\n\n' +
            '🌍 **Stations Internationales** • 🎶 **Styles Variés** • 🎧 **Qualité HD**')
        .setThumbnail('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/radio-icon.png')
        .setImage('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/radio-banner.png');

    // Grouper les stations par catégorie
    const categories = SIMPLIFIED_CATEGORIES;

    Object.entries(categories).forEach(([categoryName, stationIds]) => {
        let categoryText = '';
        stationIds.forEach(stationId => {
            const station = RADIO_STATIONS[stationId];
            categoryText += `${station.emoji} **${station.name}** - ${station.description}\n`;
        });
        
        embed.addFields({
            name: categoryName,
            value: categoryText,
            inline: false
        });
    });

    embed.setFooter({ 
        text: `🎧 Radio Bot • ${new Date().toLocaleTimeString('fr-FR')} • Qualité HD • Streaming Live`,
        iconURL: 'https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/radio-icon.png'
    });

    return embed;
}

// Fonction pour créer les boutons de navigation par pays et styles
function createCountryNavigationButtons() {
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('radio_country_france')
                .setLabel('France')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🇫🇷'),
            new ButtonBuilder()
                .setCustomId('radio_country_britain')
                .setLabel('Royaume-Uni')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🇬🇧'),
            new ButtonBuilder()
                .setCustomId('radio_country_america')
                .setLabel('États-Unis')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🇺🇸'),
            new ButtonBuilder()
                .setCustomId('radio_country_australia')
                .setLabel('Australie')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🇦🇺'),
            new ButtonBuilder()
                .setCustomId('radio_country_internet')
                .setLabel('Internet')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🌍')
        );
    
    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('radio_country_rap')
                .setLabel('Rap & Hip-Hop')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎤'),
            new ButtonBuilder()
                .setCustomId('radio_country_techno')
                .setLabel('Techno & Electronic')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎛️')
        );
    
    return [row1, row2];
}

// Fonction pour créer les boutons de stations d'un pays
function createCountryStationButtons(countryKey) {
    const stationIds = RADIO_CATEGORIES[countryKey];
    const rows = [];
    
    // Créer des rangées de boutons (max 5 par rangée)
    for (let i = 0; i < stationIds.length; i += 5) {
        const row = new ActionRowBuilder();
        const rowStations = stationIds.slice(i, i + 5);
        
        rowStations.forEach(stationId => {
            const station = ALL_RADIO_STATIONS[stationId];
            if (station) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`radio_${stationId}`)
                        .setLabel(station.name)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji(station.emoji)
                );
            }
        });
        
        rows.push(row);
    }
    
    // Bouton retour pour revenir au menu des pays
    const backRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('radio_back_countries')
                .setLabel('Retour aux pays')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🌍')
        );
    
    rows.push(backRow);
    
    return rows;
}

// Fonction pour créer les boutons de sélection de radio
function createRadioButtons() {
    const rows = [];
    const stations = Object.entries(RADIO_STATIONS);
    
    // Créer des rangées de boutons (max 5 par rangée)
    for (let i = 0; i < stations.length; i += 5) {
        const row = new ActionRowBuilder();
        const rowStations = stations.slice(i, i + 5);
        
        rowStations.forEach(([stationId, station]) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`radio_${stationId}`)
                    .setLabel(station.name)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(station.emoji)
            );
        });
        
        rows.push(row);
    }
    
    // Boutons de contrôle
    const controlRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('radio_stop')
                .setLabel('Arrêter')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⏹️'),
            new ButtonBuilder()
                .setCustomId('radio_lock')
                .setLabel('Verrouiller')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔒'),
            new ButtonBuilder()
                .setCustomId('radio_unlock')
                .setLabel('Déverrouiller')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🔓'),
            new ButtonBuilder()
                .setCustomId('radio_status')
                .setLabel('Statut')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📊')
        );
    
    rows.push(controlRow);
    
    return rows;
}

// Fonction pour démarrer une station de radio
async function startRadioStation(interaction, stationId) {
    const station = ALL_RADIO_STATIONS[stationId];
    if (!station) {
        return interaction.editReply({
            content: '❌ Station de radio introuvable!'
        });
    }

    try {
        // Vérifier si l'utilisateur est dans un salon vocal
        const member = interaction.member;
        if (!member.voice.channel) {
            return interaction.editReply({
                content: '❌ Vous devez être dans un salon vocal pour utiliser cette commande!'
            });
        }

        const voiceChannel = member.voice.channel;

        // Vérifier les permissions
        if (!voiceChannel.permissionsFor(interaction.guild.members.me).has(['Connect', 'Speak'])) {
            return interaction.editReply({
                content: '❌ Je n\'ai pas les permissions pour rejoindre ce salon vocal!'
            });
        }

        // Arrêter la radio actuelle si elle est en cours
        if (radioState.player || radioState.connection) {
            console.log('📻 Arrêt de l\'ancienne radio pour en démarrer une nouvelle');
            if (radioState.player) {
                radioState.player.stop();
            }
            if (radioState.connection) {
                radioState.connection.destroy();
            }
            // Réinitialiser l'état avant de démarrer la nouvelle radio
            radioState.currentStation = null;
            radioState.connection = null;
            radioState.player = null;
            // Mettre à jour le statut immédiatement après l'arrêt
            updateBotStatus();
        }

        // Créer la connexion vocale
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        // Créer le lecteur audio
        const player = createAudioPlayer();
        const resource = createAudioResource(station.url);

        // Configurer les événements
        player.on(AudioPlayerStatus.Playing, () => {
            logger.success(`🎵 Radio démarrée: ${station.name} dans ${voiceChannel.name}`);
            // Démarrer le tracking radio pour le leaderboard
            LeaderboardTracker.updateRadioPlayTime(15);
            // Mettre à jour le statut du bot
            updateBotStatus();
        });

        player.on(AudioPlayerStatus.Idle, () => {
            logger.warning(`⚠️ Radio en pause: ${station.name}`);
            // Mettre à jour le statut du bot
            updateBotStatus();
        });

        player.on('error', (error) => {
            logger.error(`❌ Erreur radio: ${station.name}`, error);
            // Mettre à jour le statut du bot
            updateBotStatus();
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            logger.success(`🔊 Connexion radio établie: ${station.name}`);
            // Mettre à jour le statut du bot
            updateBotStatus();
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            logger.warning(`🔌 Connexion radio perdue: ${station.name}`);
            // Mettre à jour le statut du bot
            updateBotStatus();
        });

        // Démarrer la lecture
        connection.subscribe(player);
        player.play(resource);

        // Mettre à jour l'état
        radioState.connection = connection;
        radioState.player = player;
        radioState.currentStation = station;
        radioState.lockedChannel = voiceChannel;

        // Mettre à jour le statut du bot après un court délai pour s'assurer que tout est configuré
        console.log(`📻 Mise à jour du statut après configuration de ${station.name}`);
        setTimeout(() => {
            updateBotStatus();
        }, 1000); // Délai de 1 seconde

        // Créer l'embed de confirmation
        const embed = new EmbedBuilder()
            .setColor(station.color)
            .setTitle(`📻 **${station.name}** ${station.emoji}`)
            .setDescription(`🎵 **${station.description}**\n\n` +
                `🔊 **Salon:** ${voiceChannel.name}\n` +
                `🎧 **Qualité:** HD (128kbps)\n` +
                `🌐 **Source:** ${station.url}\n` +
                `⏰ **Démarré:** ${new Date().toLocaleTimeString('fr-FR')}`)
            .setThumbnail('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/radio-icon.png')
            .setImage('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/radio-playing.png');

        embed.setFooter({ 
            text: `🎧 Radio Bot • ${station.name} • Streaming Live • ${new Date().toLocaleTimeString('fr-FR')}`,
            iconURL: 'https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/radio-icon.png'
        });

        // Importer les contrôles pour afficher seulement les boutons de contrôle
        const { createControlButtons } = require('./radio/controls');
        
        await interaction.editReply({
            embeds: [embed],
            components: [createControlButtons()]
        });

    } catch (error) {
        logger.error('Erreur lors du démarrage de la radio:', error);
        await interaction.editReply({
            content: '❌ Erreur lors du démarrage de la radio!'
        });
    }
}

// Fonction pour arrêter la radio
async function stopRadio(interaction) {
    if (!radioState.player) {
        return interaction.editReply({
            content: '❌ Aucune radio n\'est en cours de lecture!'
        });
    }

    try {
        radioState.player.stop();
        if (radioState.connection) {
            radioState.connection.destroy();
        }

        // Réinitialiser complètement l'état
        console.log('📻 Réinitialisation complète de radioState');
        radioState.isLocked = false;
        radioState.currentStation = null;
        radioState.connection = null;
        radioState.player = null;
        radioState.lockedChannel = null;
        radioState.lockedBy = null;
        radioState.lockedAt = null;
        
        // Arrêter le tracking radio pour le leaderboard
        LeaderboardTracker.stopRadioMode();

        // Mettre à jour le statut du bot immédiatement et après un délai
        console.log('📻 Arrêt de la radio - mise à jour du statut');
        updateBotStatus();
        
        // Forcer une mise à jour après un délai pour s'assurer que radioState est bien réinitialisé
        setTimeout(() => {
            console.log('📻 Mise à jour différée du statut après arrêt radio');
            updateBotStatus();
        }, 2000);

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('⏹️ **RADIO ARRÊTÉE**')
            .setDescription('🔇 **La radio a été arrêtée avec succès**\n\n' +
                `⏰ **Arrêté:** ${new Date().toLocaleTimeString('fr-FR')}\n` +
                `🔓 **Statut:** Déverrouillé`)
            .setThumbnail('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/radio-stop.png');

        // Importer les contrôles pour afficher les boutons de navigation
        const { createControlButtons } = require('./radio/controls');
        
        await interaction.editReply({
            embeds: [embed],
            components: [createControlButtons()]
        });

        logger.success('🎵 Radio arrêtée par l\'utilisateur');

    } catch (error) {
        logger.error('Erreur lors de l\'arrêt de la radio:', error);
        await interaction.editReply({
            content: '❌ Erreur lors de l\'arrêt de la radio!'
        });
    }
}

// Fonction pour verrouiller le bot
async function lockBot(interaction) {
    if (!radioState.player) {
        return interaction.editReply({
            content: '❌ Aucune radio n\'est en cours de lecture!'
        });
    }

    if (radioState.isLocked) {
        return interaction.editReply({
            content: '🔒 Le bot est déjà verrouillé dans ce salon vocal!'
        });
    }

    radioState.isLocked = true;
    radioState.lockedBy = interaction.user.id;
    radioState.lockedAt = Date.now();

    const embed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('🔒 **BOT VERROUILLÉ**')
        .setDescription(`🔐 **Le bot est maintenant verrouillé dans le salon vocal**\n\n` +
            `📻 **Station:** ${radioState.currentStation.name}\n` +
            `🎧 **Salon:** ${radioState.lockedChannel.name}\n` +
            `👤 **Verrouillé par:** ${interaction.user.tag}\n` +
            `⏰ **Verrouillé:** ${new Date().toLocaleTimeString('fr-FR')}\n\n` +
            `⚠️ **Seuls les administrateurs peuvent déverrouiller le bot**`)
        .setThumbnail('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/lock-icon.png');

    // Importer les contrôles pour afficher les boutons de contrôle
    const { createControlButtons } = require('./radio/controls');
    
    await interaction.editReply({
        embeds: [embed],
        components: [createControlButtons()]
    });

    logger.success(`🔒 Bot verrouillé par ${interaction.user.tag} dans ${radioState.lockedChannel.name}`);
}

// Fonction pour déverrouiller le bot
async function unlockBot(interaction) {
    if (!radioState.isLocked) {
        return interaction.editReply({
            content: '🔓 Le bot n\'est pas verrouillé!'
        });
    }

    // Vérifier les permissions administrateur ou propriétaire du bot
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    const isBotOwner = interaction.user.id === '1088121021044887572'; // .polosko
    
    if (!isAdmin && !isBotOwner) {
        return interaction.editReply({
            content: '❌ **Permission refusée**\n\nSeuls les administrateurs et le propriétaire du bot peuvent déverrouiller le bot.'
        });
    }

    radioState.isLocked = false;
    radioState.lockedBy = null;
    radioState.lockedAt = null;

    const embed = new EmbedBuilder()
        .setColor('#27AE60')
        .setTitle('🔓 **BOT DÉVERROUILLÉ**')
        .setDescription(`🔓 **Le bot a été déverrouillé avec succès**\n\n` +
            `📻 **Station:** ${radioState.currentStation.name}\n` +
            `🎧 **Salon:** ${radioState.lockedChannel.name}\n` +
            `👤 **Déverrouillé par:** ${interaction.user.tag}\n` +
            `⏰ **Déverrouillé:** ${new Date().toLocaleTimeString('fr-FR')}\n\n` +
            `✅ **Le bot peut maintenant être déplacé librement**`)
        .setThumbnail('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/unlock-icon.png');

    // Importer les contrôles pour afficher les boutons de contrôle
    const { createControlButtons } = require('./radio/controls');
    
    await interaction.editReply({
        embeds: [embed],
        components: [createControlButtons()]
    });

    logger.success(`🔓 Bot déverrouillé par ${interaction.user.tag}`);
}

// Fonction pour afficher le statut
async function showStatus(interaction) {
    const embed = new EmbedBuilder()
        .setColor(radioState.currentStation ? radioState.currentStation.color : '#95A5A6')
        .setTitle('📊 **STATUT RADIO**')
        .setDescription('📻 **Informations sur la radio actuelle**\n\n' +
            `📻 **Station:** ${radioState.currentStation ? radioState.currentStation.name : 'Aucune'}\n` +
            `🎧 **Salon:** ${radioState.lockedChannel ? radioState.lockedChannel.name : 'Aucun'}\n` +
            `🔒 **Verrouillé:** ${radioState.isLocked ? 'Oui' : 'Non'}\n` +
            `👤 **Verrouillé par:** ${radioState.lockedBy ? `<@${radioState.lockedBy}>` : 'Personne'}\n` +
            `⏰ **Verrouillé depuis:** ${radioState.lockedAt ? new Date(radioState.lockedAt).toLocaleTimeString('fr-FR') : 'N/A'}\n` +
            `🔊 **Connexion:** ${radioState.connection ? 'Active' : 'Inactive'}\n` +
            `🎵 **Lecteur:** ${radioState.player ? 'Actif' : 'Inactif'}`)
        .setThumbnail('https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/status-icon.png');

    embed.setFooter({ 
        text: `🎧 Radio Bot • Statut • ${new Date().toLocaleTimeString('fr-FR')}`,
        iconURL: 'https://cdn.discordapp.com/attachments/1234567890123456789/1234567890123456789/radio-icon.png'
    });

    // Importer les contrôles pour afficher les boutons de contrôle
    const { createControlButtons } = require('./radio/controls');
    
    await interaction.editReply({
        embeds: [embed],
        components: [createControlButtons()]
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('Démarrer une station de radio dans un salon vocal (Administrateurs uniquement)')
        .addStringOption(option =>
            option.setName('station')
                .setDescription('Station de radio à démarrer')
                .setRequired(false)
                .addChoices(
                    { name: '🇫🇷 France Inter', value: 'france-inter' },
                    { name: '🎵 France Musique', value: 'france-musique' },
                    { name: '📚 France Culture', value: 'france-culture' },
                    { name: '📰 France Info', value: 'france-info' },
                    { name: '🎧 FIP', value: 'fip' },
                    { name: '🎤 Mouv\'', value: 'mouv' },
                    { name: '🎤 Skyrock', value: 'skyrock' },
                    { name: '🌟 Radio Nova', value: 'radio-nova' },
                    { name: '🎷 TSF Jazz', value: 'tsf-jazz' },
                    { name: '🇺🇸 KEXP Seattle', value: 'kexp' },
                    { name: '🌍 Radio Paradise', value: 'radio-paradise' },
                    { name: '🌙 SomaFM Groove Salad', value: 'soma-fm' },
                    { name: '🎷 Jazz Radio', value: 'jazz-radio' }
                )),
    
    async execute(interaction) {
        try {
            // Vérifier les permissions administrateur ou propriétaire du bot
            const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            const isBotOwner = interaction.user.id === '1088121021044887572'; // .polosko
            
            if (!isAdmin && !isBotOwner) {
                return interaction.editReply({
                    content: '❌ **Permission refusée**\n\nSeuls les administrateurs et le propriétaire du bot peuvent utiliser la commande `/radio`.'
                });
            }

            const stationId = interaction.options.getString('station');
            
            if (stationId) {
                // Démarrer une station spécifique
                await startRadioStation(interaction, stationId);
            } else {
                // Afficher le menu de navigation par pays
                const embed = createCountryNavigationEmbed();
                const buttons = createCountryNavigationButtons();
                
                // Ajouter les boutons de contrôle
                const { createControlButtons } = require('./radio/controls');
                buttons.push(createControlButtons());
                
                await interaction.editReply({
                    embeds: [embed],
                    components: buttons
                });
            }
        } catch (error) {
            logger.error('Erreur dans la commande /radio:', error);
            await interaction.editReply({
                content: '❌ Erreur lors de l\'exécution de la commande radio!'
            });
        }
    },

    // Fonctions exportées pour les interactions de boutons
    startRadioStation,
    stopRadio,
    lockBot,
    unlockBot,
    showStatus,
    createCountryNavigationEmbed,
    createCountryNavigationButtons,
    createCountryStationsEmbed,
    createCountryStationButtons,
    RADIO_STATIONS,
    RADIO_CATEGORIES,
    ALL_RADIO_STATIONS,
    radioState
};
