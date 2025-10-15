const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

class EventHandler {
    constructor(client) {
        this.client = client;
        this.events = new Map();
    }

    loadEvents() {
        const eventsPath = path.join(__dirname, '../events');
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            
            if ('name' in event && 'execute' in event) {
                this.events.set(event.name, event);
                
                if (event.once) {
                    this.client.once(event.name, (...args) => event.execute(...args));
                } else {
                    this.client.on(event.name, (...args) => event.execute(...args));
                }
                
                Logger.success(`Événement chargé: ${event.name}`);
            } else {
                Logger.error(`L'événement ${filePath} n'a pas de propriété "name" ou "execute"`);
            }
        }

        Logger.info(`${this.events.size} événements chargés avec succès`);
    }

    getEvent(name) {
        return this.events.get(name);
    }

    getAllEvents() {
        return Array.from(this.events.values());
    }
}

module.exports = EventHandler;


