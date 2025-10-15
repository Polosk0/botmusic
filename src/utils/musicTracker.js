const fs = require('fs').promises;
const path = require('path');

class MusicTracker {
    constructor() {
        this.dataFile = path.join(__dirname, '../data/music-tracker.json');
        this.data = {
            currentTracks: {}, // guildId -> track info
            lastUpdate: Date.now()
        };
        this.loadData();
    }

    async loadData() {
        try {
            if (await this.fileExists(this.dataFile)) {
                const fileContent = await fs.readFile(this.dataFile, 'utf8');
                this.data = JSON.parse(fileContent);
                
                // Nettoyer les données anciennes (plus de 24h)
                const now = Date.now();
                const oneDayAgo = now - (24 * 60 * 60 * 1000);
                
                if (this.data.lastUpdate < oneDayAgo) {
                    this.data.currentTracks = {};
                    this.data.lastUpdate = now;
                    await this.saveData();
                }
                
                console.log('🎵 MusicTracker: Données chargées');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données MusicTracker:', error);
            this.data = {
                currentTracks: {},
                lastUpdate: Date.now()
            };
        }
    }

    async saveData() {
        try {
            this.data.lastUpdate = Date.now();
            await fs.writeFile(this.dataFile, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des données MusicTracker:', error);
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    setCurrentTrack(guildId, track) {
        console.log(`🎵 MusicTracker: Définition track pour guildId=${guildId}, titre=${track.title}`);
        this.data.currentTracks[guildId] = {
            ...track,
            timestamp: Date.now()
        };
        this.saveData();
    }

    getCurrentTrack(guildId) {
        const track = this.data.currentTracks[guildId];
        if (track) {
            console.log(`🎵 MusicTracker: Track trouvée pour guildId=${guildId}, titre=${track.title}`);
            return track;
        }
        console.log(`🎵 MusicTracker: Aucune track pour guildId=${guildId}`);
        return null;
    }

    clearCurrentTrack(guildId) {
        console.log(`🎵 MusicTracker: Suppression track pour guildId=${guildId}`);
        delete this.data.currentTracks[guildId];
        this.saveData();
    }

    getAllTracks() {
        return this.data.currentTracks;
    }

    // Nettoyage automatique toutes les heures
    startCleanup() {
        setInterval(() => {
            const now = Date.now();
            const oneDayAgo = now - (24 * 60 * 60 * 1000);
            
            let cleaned = false;
            for (const [guildId, track] of Object.entries(this.data.currentTracks)) {
                if (track.timestamp < oneDayAgo) {
                    delete this.data.currentTracks[guildId];
                    cleaned = true;
                }
            }
            
            if (cleaned) {
                console.log('🧹 MusicTracker: Nettoyage des anciennes tracks');
                this.saveData();
            }
        }, 60 * 60 * 1000); // 1 heure
    }
}

module.exports = new MusicTracker();










