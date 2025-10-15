const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'src/commands');
const commandFolders = fs.readdirSync(commandsPath);

console.log('🔄 Chargement des commandes...');

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
            console.log(`⚠️  Commande ignorée: ${file} (manque 'data' ou 'execute')`);
        }
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`🔄 Enregistrement de ${commands.length} commandes slash...`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ ${data.length} commandes slash enregistrées avec succès!`);
        console.log('🎉 Déploiement terminé!');
        
        // Afficher la liste des commandes déployées
        console.log('\n📋 Commandes déployées:');
        commands.forEach(cmd => {
            console.log(`   - /${cmd.name}: ${cmd.description}`);
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement des commandes:', error);
    }
})();














