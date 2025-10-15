const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

class CommandHandler {
    constructor(client) {
        this.client = client;
        this.commands = new Map();
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, '../commands');
        const commandFolders = fs.readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    this.commands.set(command.data.name, command);
                    Logger.success(`Commande chargée: ${command.data.name}`);
                } else {
                    Logger.error(`La commande ${filePath} n'a pas de propriété "data" ou "execute"`);
                }
            }
        }

        Logger.info(`${this.commands.size} commandes chargées avec succès`);
    }

    getCommand(name) {
        return this.commands.get(name);
    }

    getAllCommands() {
        return Array.from(this.commands.values());
    }
}

module.exports = CommandHandler;


