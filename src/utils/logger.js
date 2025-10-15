const chalk = require('chalk');
const moment = require('moment');

class Logger {
    static info(message) {
        console.log(chalk.blue(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] INFO: ${message}`));
    }

    static success(message) {
        console.log(chalk.green(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] SUCCESS: ${message}`));
    }

    static warning(message) {
        console.log(chalk.yellow(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] WARNING: ${message}`));
    }

    static error(message) {
        console.log(chalk.red(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ERROR: ${message}`));
    }

    static debug(message) {
        if (process.env.LOG_LEVEL === 'debug') {
            console.log(chalk.gray(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] DEBUG: ${message}`));
        }
    }
}

module.exports = Logger;


