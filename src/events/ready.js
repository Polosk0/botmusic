const { Events, EmbedBuilder } = require('discord.js');
const chalk = require('chalk');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(chalk.green.bold(`🎵 Bot connecté en tant que ${client.user.tag}!`));
        console.log(chalk.blue(`📊 Servant ${client.guilds.cache.size} serveurs`));
        console.log(chalk.blue(`👥 Servant ${client.users.cache.size} utilisateurs`));
        
        // Enregistrer les commandes slash
        const { REST, Routes } = require('discord.js');
        const fs = require('fs');
        const path = require('path');
        
        const commands = [];
        const commandsPath = path.join(__dirname, '../commands');
        const commandFolders = fs.readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                }
            }
        }

        const rest = new REST().setToken(process.env.DISCORD_TOKEN);

        (async () => {
            try {
                console.log(chalk.yellow(`🔄 Enregistrement de ${commands.length} commandes slash...`));

                const data = await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commands },
                );

                console.log(chalk.green(`✅ ${data.length} commandes slash enregistrées avec succès!`));
            } catch (error) {
                if (error.code === 50240) {
                    console.log(chalk.yellow(`⚠️ Erreur Entry Point détectée - tentative d'enregistrement individuel...`));
                    
                    // Essayer d'enregistrer les commandes individuellement
                    try {
                        for (const command of commands) {
                            try {
                                await rest.post(Routes.applicationCommands(client.user.id), {
                                    body: command
                                });
                                console.log(chalk.green(`✅ Commande ${command.name} enregistrée individuellement`));
                            } catch (cmdError) {
                                if (cmdError.code === 50001) {
                                    console.log(chalk.yellow(`⚠️ Commande ${command.name} déjà existante, ignorée`));
                                } else {
                                    console.error(chalk.red(`❌ Erreur pour la commande ${command.name}:`), cmdError.message);
                                }
                            }
                        }
                        console.log(chalk.green(`✅ Enregistrement individuel terminé!`));
                    } catch (individualError) {
                        console.error(chalk.red('❌ Erreur lors de l\'enregistrement individuel:'), individualError);
                    }
                } else {
                    console.error(chalk.red('❌ Erreur lors de l\'enregistrement des commandes:'), error);
                }
            }
        })();
    },
};


