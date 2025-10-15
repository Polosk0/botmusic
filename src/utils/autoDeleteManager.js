class AutoDeleteManager {
    constructor() {
        this.musicMessages = new Map(); // guildId -> Set of messageIds
        this.deleteTimeout = 2 * 60 * 1000; // 2 minutes en millisecondes
    }

    /**
     * Ajouter un message à la liste de suppression automatique
     * @param {string} guildId - ID du serveur
     * @param {Object} message - Message Discord à supprimer
     */
    addMusicMessage(guildId, message) {
        if (!this.musicMessages.has(guildId)) {
            this.musicMessages.set(guildId, new Set());
        }

        const guildMessages = this.musicMessages.get(guildId);
        guildMessages.add(message.id);

        // Programmer la suppression automatique
        setTimeout(async () => {
            try {
                await message.delete();
                guildMessages.delete(message.id);
                
                // Nettoyer si le Set est vide
                if (guildMessages.size === 0) {
                    this.musicMessages.delete(guildId);
                }
                
                console.log(`🗑️ Message musical supprimé automatiquement: ${message.id}`);
            } catch (error) {
                // Message déjà supprimé ou erreur de permissions
                console.log(`⚠️ Impossible de supprimer le message ${message.id}: ${error.message}`);
                guildMessages.delete(message.id);
                
                // Nettoyer si le Set est vide
                if (guildMessages.size === 0) {
                    this.musicMessages.delete(guildId);
                }
            }
        }, this.deleteTimeout);

        console.log(`⏰ Message ${message.id} programmé pour suppression dans 2 minutes`);
    }

    /**
     * Supprimer immédiatement un message de la liste de surveillance
     * @param {string} guildId - ID du serveur
     * @param {string} messageId - ID du message
     */
    removeMusicMessage(guildId, messageId) {
        if (this.musicMessages.has(guildId)) {
            const guildMessages = this.musicMessages.get(guildId);
            guildMessages.delete(messageId);
            
            // Nettoyer si le Set est vide
            if (guildMessages.size === 0) {
                this.musicMessages.delete(guildId);
            }
            
            console.log(`❌ Message ${messageId} retiré de la liste de suppression automatique`);
        }
    }

    /**
     * Vérifier si un message est dans la liste de surveillance
     * @param {string} guildId - ID du serveur
     * @param {string} messageId - ID du message
     * @returns {boolean}
     */
    isMusicMessage(guildId, messageId) {
        if (this.musicMessages.has(guildId)) {
            return this.musicMessages.get(guildId).has(messageId);
        }
        return false;
    }

    /**
     * Obtenir tous les messages surveillés pour un serveur
     * @param {string} guildId - ID du serveur
     * @returns {Set<string>}
     */
    getGuildMessages(guildId) {
        return this.musicMessages.get(guildId) || new Set();
    }

    /**
     * Nettoyer tous les messages d'un serveur
     * @param {string} guildId - ID du serveur
     */
    clearGuildMessages(guildId) {
        if (this.musicMessages.has(guildId)) {
            const guildMessages = this.musicMessages.get(guildId);
            console.log(`🧹 Nettoyage de ${guildMessages.size} messages pour le serveur ${guildId}`);
            this.musicMessages.delete(guildId);
        }
    }

    /**
     * Obtenir les statistiques de surveillance
     * @returns {Object}
     */
    getStats() {
        const stats = {
            totalGuilds: this.musicMessages.size,
            totalMessages: 0,
            guilds: {}
        };

        for (const [guildId, messages] of this.musicMessages) {
            stats.totalMessages += messages.size;
            stats.guilds[guildId] = messages.size;
        }

        return stats;
    }

    /**
     * Supprimer immédiatement tous les messages surveillés d'un serveur
     * @param {string} guildId - ID du serveur
     * @param {Object} channel - Canal Discord
     */
    async forceDeleteGuildMessages(guildId, channel) {
        if (!this.musicMessages.has(guildId)) {
            return;
        }

        const guildMessages = this.musicMessages.get(guildId);
        const messageIds = Array.from(guildMessages);
        
        console.log(`🗑️ Suppression forcée de ${messageIds.length} messages pour le serveur ${guildId}`);

        for (const messageId of messageIds) {
            try {
                const message = await channel.messages.fetch(messageId);
                if (message) {
                    await message.delete();
                    console.log(`✅ Message ${messageId} supprimé avec succès`);
                }
            } catch (error) {
                console.log(`⚠️ Impossible de supprimer le message ${messageId}: ${error.message}`);
            }
        }

        // Nettoyer la liste
        this.musicMessages.delete(guildId);
    }
}

// Instance singleton
const autoDeleteManager = new AutoDeleteManager();

module.exports = autoDeleteManager;








