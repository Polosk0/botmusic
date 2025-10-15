const { Events } = require('discord.js');
const { PermissionFlagsBits } = require('discord.js');
const Logger = require('../utils/advancedLogger');

// Créer une instance du logger pour ce module
const logger = new Logger();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Gérer seulement les interactions de boutons de radio
        if (!interaction.isButton() || !interaction.customId.startsWith('radio_')) {
            return;
        }

        try {
            // Déferrer l'interaction pour éviter les erreurs
            if (!interaction.replied && !interaction.deferred) {
                await interaction.deferReply({ ephemeral: false });
            }

            const { startRadioStation, stopRadio, lockBot, unlockBot, showStatus, createCountryNavigationEmbed, createCountryNavigationButtons, createCountryStationsEmbed, createCountryStationButtons, RADIO_CATEGORIES, ALL_RADIO_STATIONS } = require('../commands/music/radio');
            const { createControlButtons } = require('../commands/music/radio/controls');

            if (interaction.customId === 'radio_stop') {
                await stopRadio(interaction);
            } else if (interaction.customId === 'radio_lock') {
                await lockBot(interaction);
            } else if (interaction.customId === 'radio_unlock') {
                await unlockBot(interaction);
            } else if (interaction.customId === 'radio_status') {
                await showStatus(interaction);
            } else if (interaction.customId === 'radio_back_countries') {
                // Retour au menu des pays
                const embed = createCountryNavigationEmbed();
                const buttons = createCountryNavigationButtons();
                
                // Ajouter les boutons de contrôle
                buttons.push(createControlButtons());
                
                await interaction.editReply({
                    embeds: [embed],
                    components: buttons
                });
            } else if (interaction.customId.startsWith('radio_country_')) {
                // Navigation par pays
                const country = interaction.customId.replace('radio_country_', '');
                const countryMappings = {
                    'france': { key: '🇫🇷 **RADIOS FRANÇAISES**', name: 'France', emoji: '🇫🇷' },
                    'britain': { key: '🇬🇧 **RADIOS BRITANNIQUES**', name: 'Royaume-Uni', emoji: '🇬🇧' },
                    'america': { key: '🇺🇸 **RADIOS AMÉRICAINES**', name: 'États-Unis', emoji: '🇺🇸' },
                    'australia': { key: '🇦🇺 **RADIOS AUSTRALIENNES**', name: 'Australie', emoji: '🇦🇺' },
                    'internet': { key: '🌍 **RADIOS INTERNET**', name: 'Internet', emoji: '🌍' },
                    'rap': { key: '🎤 **RAP & HIP-HOP**', name: 'Rap & Hip-Hop', emoji: '🎤' },
                    'techno': { key: '🎛️ **TECHNO & ELECTRONIC**', name: 'Techno & Electronic', emoji: '🎛️' }
                };
                
                const countryInfo = countryMappings[country];
                if (countryInfo) {
                    const embed = createCountryStationsEmbed(countryInfo.key, countryInfo.name, countryInfo.emoji);
                    const buttons = createCountryStationButtons(countryInfo.key);
                    
                    // Ajouter les boutons de contrôle
                    buttons.push(createControlButtons());
                    
                    await interaction.editReply({
                        embeds: [embed],
                        components: buttons
                    });
                }
            } else if (interaction.customId.startsWith('radio_') && interaction.customId !== 'radio_stop' && 
                       interaction.customId !== 'radio_lock' && interaction.customId !== 'radio_unlock' && 
                       interaction.customId !== 'radio_status' && !interaction.customId.startsWith('radio_country_') &&
                       interaction.customId !== 'radio_back_countries') {
                // C'est une sélection de station
                const stationId = interaction.customId.replace('radio_', '');
                await startRadioStation(interaction, stationId);
            }

        } catch (error) {
            logger.error('Erreur lors du traitement de l\'interaction radio:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.deferReply({ ephemeral: false });
            }
            
            await interaction.editReply({
                content: '❌ Erreur lors du traitement de l\'interaction radio!'
            });
        }
    },
};
