const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const voiceManager = require('../../../utils/voiceManager');
const logger = require('../../../utils/logger');

// État du bot (lock, etc.)
const botStates = new Map();

function createControlButtons() {
    return new ActionRowBuilder()
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
}

function createCountryNavigationButtons() {
    return new ActionRowBuilder()
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
                .setEmoji('🌐')
        );
}

function createCountryStationButtons(countryKey) {
    const { ALL_RADIO_STATIONS, RADIO_CATEGORIES } = require('./index');
    const stations = RADIO_CATEGORIES[countryKey] || [];
    const buttons = [];

    stations.forEach(stationId => {
        const station = ALL_RADIO_STATIONS[stationId];
        if (station) {
            buttons.push(
                new ButtonBuilder()
                    .setCustomId(`radio_${stationId}`)
                    .setLabel(station.name)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(station.emoji)
            );
        }
    });

    // Ajouter le bouton retour pour les pages de pays
    buttons.push(
        new ButtonBuilder()
            .setCustomId('radio_back_countries')
            .setLabel('Retour aux pays')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🌍')
    );

    return new ActionRowBuilder().addComponents(buttons);
}

async function stopRadio(interaction) {
    try {
        const guild = interaction.guild;
        const connection = voiceManager.getConnection(guild);
        
        if (connection) {
            await voiceManager.leave(guild);
            botStates.delete(guild.id);
            
            await interaction.editReply({
                content: '⏹️ **Radio arrêtée!** Le bot a quitté le salon vocal.',
                components: [createCountryNavigationButtons(), createControlButtons()]
            });
            
            logger.success('🔇 Radio arrêtée par l\'utilisateur');
        } else {
            await interaction.editReply({
                content: '❌ **Aucune radio en cours!** Le bot n\'est pas connecté.',
                components: [createCountryNavigationButtons(), createControlButtons()]
            });
        }
    } catch (error) {
        logger.error('Erreur lors de l\'arrêt de la radio:', error);
        await interaction.editReply({
            content: '❌ **Erreur lors de l\'arrêt de la radio!**',
            components: [createCountryNavigationButtons(), createControlButtons()]
        });
    }
}

async function lockBot(interaction) {
    try {
        const guild = interaction.guild;
        const member = interaction.member;
        
        if (!member.voice.channel) {
            await interaction.editReply({
                content: '❌ **Vous devez être dans un salon vocal!**',
                components: [createControlButtons()]
            });
            return;
        }

        const botState = botStates.get(guild.id) || {};
        botState.isLocked = true;
        botState.lockedBy = member.user.tag;
        botState.lockedAt = new Date();
        botStates.set(guild.id, botState);

        await interaction.editReply({
            content: `🔒 **Bot verrouillé!** Seul **${member.user.tag}** peut le déverrouiller.`,
            components: [createControlButtons()]
        });
        
        logger.success(`🔒 Bot verrouillé par ${member.user.tag}`);
    } catch (error) {
        logger.error('Erreur lors du verrouillage du bot:', error);
        await interaction.editReply({
            content: '❌ **Erreur lors du verrouillage!**',
            components: [createControlButtons()]
        });
    }
}

async function unlockBot(interaction) {
    try {
        const guild = interaction.guild;
        const member = interaction.member;
        const botState = botStates.get(guild.id) || {};
        
        if (!botState.isLocked) {
            await interaction.editReply({
                content: '❌ **Le bot n\'est pas verrouillé!**',
                components: [createControlButtons()]
            });
            return;
        }

        const isAdmin = member.permissions.has('Administrator');
        const isBotOwner = member.user.id === '1088121021044887572'; // .polosko
        
        if (botState.lockedBy !== member.user.tag && !isAdmin && !isBotOwner) {
            await interaction.editReply({
                content: `❌ **Accès refusé!** Seul **${botState.lockedBy}**, un administrateur ou le propriétaire du bot peut déverrouiller.`,
                components: [createControlButtons()]
            });
            return;
        }

        botState.isLocked = false;
        botState.lockedBy = null;
        botState.lockedAt = null;
        botStates.set(guild.id, botState);

        await interaction.editReply({
            content: `🔓 **Bot déverrouillé!** Par **${member.user.tag}**.`,
            components: [createControlButtons()]
        });
        
        logger.success(`🔓 Bot déverrouillé par ${member.user.tag}`);
    } catch (error) {
        logger.error('Erreur lors du déverrouillage du bot:', error);
        await interaction.editReply({
            content: '❌ **Erreur lors du déverrouillage!**',
            components: [createControlButtons()]
        });
    }
}

async function showStatus(interaction) {
    try {
        const guild = interaction.guild;
        const connection = voiceManager.getConnection(guild);
        const botState = botStates.get(guild.id) || {};
        
        const embed = new EmbedBuilder()
            .setTitle('📊 **Statut de la Radio**')
            .setColor('#FF6B6B')
            .setTimestamp();

        // Statut de connexion
        if (connection) {
            embed.addFields({
                name: '🔊 **Connexion**',
                value: '✅ **Connecté**',
                inline: true
            });
            
            embed.addFields({
                name: '🎵 **Lecture**',
                value: voiceManager.isPlaying(guild) ? '▶️ **En cours**' : '⏸️ **En pause**',
                inline: true
            });
        } else {
            embed.addFields({
                name: '🔊 **Connexion**',
                value: '❌ **Déconnecté**',
                inline: true
            });
        }

        // Statut de verrouillage
        if (botState.isLocked) {
            embed.addFields({
                name: '🔒 **Verrouillage**',
                value: `🔒 **Verrouillé par ${botState.lockedBy}**\n📅 ${botState.lockedAt ? botState.lockedAt.toLocaleString('fr-FR') : 'Inconnu'}`,
                inline: false
            });
        } else {
            embed.addFields({
                name: '🔒 **Verrouillage**',
                value: '🔓 **Libre**',
                inline: true
            });
        }

        await interaction.editReply({
            embeds: [embed],
            components: [createControlButtons()]
        });
        
    } catch (error) {
        logger.error('Erreur lors de l\'affichage du statut:', error);
        await interaction.editReply({
            content: '❌ **Erreur lors de l\'affichage du statut!**',
            components: [createControlButtons()]
        });
    }
}

function isBotLocked(guild) {
    const botState = botStates.get(guild.id);
    return botState ? botState.isLocked : false;
}

function getBotState(guild) {
    return botStates.get(guild.id) || {};
}

module.exports = {
    createControlButtons,
    createCountryNavigationButtons,
    createCountryStationButtons,
    stopRadio,
    lockBot,
    unlockBot,
    showStatus,
    isBotLocked,
    getBotState,
    botStates
};
