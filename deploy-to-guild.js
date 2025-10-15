const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];

// Charger toutes les commandes
const commandsPath = path.join(__dirname, 'src/commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`✅ Commande chargée: ${command.data.name}`);
        } else {
            console.log(`❌ Commande invalide: ${file}`);
        }
    }
}

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

// Fonction pour déployer sur un serveur spécifique
async function deployToGuild(guildId) {
    try {
        console.log(`🚀 Déploiement de ${commands.length} commandes sur le serveur ${guildId}...`);
        
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
            { body: commands },
        );
        
        console.log(`✅ Commandes déployées avec succès sur le serveur ${guildId}`);
        console.log(`📊 ${commands.length} commandes sont maintenant disponibles`);
    } catch (error) {
        console.error(`❌ Erreur lors du déploiement sur le serveur ${guildId}:`, error);
        
        if (error.code === 50001) {
            console.error('💡 Vérifiez que le bot est bien invité sur ce serveur');
        } else if (error.code === 50013) {
            console.error('💡 Vérifiez les permissions du bot (applications.commands)');
        } else if (error.code === 10004) {
            console.error('💡 Vérifiez que le GUILD_ID est correct');
        }
    }
}

// Fonction pour déployer globalement
async function deployGlobal() {
    try {
        console.log(`🌍 Déploiement global de ${commands.length} commandes...`);
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        
        console.log(`✅ Commandes déployées globalement avec succès`);
        console.log(`📊 ${commands.length} commandes sont maintenant disponibles sur tous les serveurs`);
        console.log(`⏰ Note: Les commandes globales peuvent prendre jusqu'à 1 heure pour apparaître`);
    } catch (error) {
        console.error(`❌ Erreur lors du déploiement global:`, error);
        
        if (error.code === 401) {
            console.error('💡 Vérifiez votre DISCORD_TOKEN');
        } else if (error.code === 403) {
            console.error('💡 Vérifiez que votre CLIENT_ID est correct');
        }
    }
}

// Fonction pour lister les serveurs
async function listGuilds() {
    try {
        console.log('📋 Serveurs où le bot est présent:');
        
        const guilds = await rest.get(Routes.userGuilds());
        
        if (guilds.length === 0) {
            console.log('❌ Aucun serveur trouvé. Assurez-vous que le bot est invité sur au moins un serveur.');
            return;
        }
        
        guilds.forEach((guild, index) => {
            console.log(`${index + 1}. ${guild.name} (ID: ${guild.id})`);
        });
        
        console.log(`\n📊 Total: ${guilds.length} serveur(s)`);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des serveurs:', error);
    }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'guild':
        if (args[1]) {
            deployToGuild(args[1]);
        } else {
            console.log('❌ Usage: node deploy-to-guild.js guild GUILD_ID');
            console.log('📝 Exemple: node deploy-to-guild.js guild 1401727737697271903');
        }
        break;
        
    case 'global':
        deployGlobal();
        break;
        
    case 'list':
        listGuilds();
        break;
        
    default:
        console.log('🤖 Script de déploiement des commandes Discord');
        console.log('');
        console.log('📋 Commandes disponibles:');
        console.log('  node deploy-to-guild.js guild GUILD_ID  - Déployer sur un serveur spécifique');
        console.log('  node deploy-to-guild.js global          - Déployer globalement');
        console.log('  node deploy-to-guild.js list            - Lister les serveurs');
        console.log('');
        console.log('📝 Exemples:');
        console.log('  node deploy-to-guild.js guild 1401727737697271903');
        console.log('  node deploy-to-guild.js global');
        console.log('  node deploy-to-guild.js list');
        console.log('');
        console.log('💡 Astuce: Utilisez "global" pour déployer sur tous les serveurs automatiquement');
        break;
}








