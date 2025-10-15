const { Events } = require('discord.js');
const Logger = require('../utils/advancedLogger');

// Créer une instance du logger pour ce module
const logger = new Logger();

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        // Vérifier si c'est le bot qui change de salon vocal
        if (oldState.member.id !== newState.client.user.id) {
            return;
        }

        try {
            // Importer l'état de la radio
            const { radioState } = require('../commands/music/radio');

            // Si le bot est verrouillé et qu'il essaie de quitter le salon
            if (radioState.isLocked && radioState.lockedChannel) {
                const oldChannel = oldState.channel;
                const newChannel = newState.channel;

                // Si le bot quitte le salon verrouillé
                if (oldChannel && oldChannel.id === radioState.lockedChannel.id && !newChannel) {
                    logger.warning(`🔒 Tentative de déconnexion du salon verrouillé: ${radioState.lockedChannel.name}`);
                    
                    // Rejoindre immédiatement le salon verrouillé
                    setTimeout(async () => {
                        try {
                            const connection = await newState.member.voice.setChannel(radioState.lockedChannel);
                            logger.success(`🔒 Bot reconnexé au salon verrouillé: ${radioState.lockedChannel.name}`);
                        } catch (error) {
                            logger.error('Erreur lors de la reconnexion au salon verrouillé:', error);
                        }
                    }, 1000);
                }
                // Si le bot est déplacé vers un autre salon
                else if (oldChannel && newChannel && oldChannel.id === radioState.lockedChannel.id && newChannel.id !== radioState.lockedChannel.id) {
                    logger.warning(`🔒 Tentative de déplacement du salon verrouillé: ${radioState.lockedChannel.name} → ${newChannel.name}`);
                    
                    // Rejoindre immédiatement le salon verrouillé
                    setTimeout(async () => {
                        try {
                            const connection = await newState.member.voice.setChannel(radioState.lockedChannel);
                            logger.success(`🔒 Bot reconnexé au salon verrouillé: ${radioState.lockedChannel.name}`);
                        } catch (error) {
                            logger.error('Erreur lors de la reconnexion au salon verrouillé:', error);
                        }
                    }, 1000);
                }
            }

        } catch (error) {
            logger.error('Erreur lors de la gestion du changement de salon vocal du bot:', error);
        }
    },
};










