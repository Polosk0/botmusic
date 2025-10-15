const { Events, EmbedBuilder } = require('discord.js');
const chalk = require('chalk');

module.exports = {
    name: Events.Error,
    execute(error) {
        console.error(chalk.red('❌ Erreur Discord.js:'), error);
    },
};


