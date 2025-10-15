const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.ensureLogDirectory();
        this.logFile = path.join(this.logDir, `bot-${moment().format('YYYY-MM-DD')}.log`);
        this.errorFile = path.join(this.logDir, `errors-${moment().format('YYYY-MM-DD')}.log`);
        
        // Configuration TEMPORAIRE : Logs d'erreurs pour diagnostiquer
        this.logToFile = {
            info: true,         // ✅ Logs INFO pour voir le tracking
            success: true,      // ✅ Logs SUCCESS pour voir les démarrages
            warning: true,      // ✅ Logs WARNING pour diagnostiquer
            error: true,        // ✅ Logs ERROR critiques
            debug: false,       // ❌ Pas de logs DEBUG en fichier
            music: false,       // ❌ Pas de logs MUSIC en fichier
            discord: false,     // ❌ Pas de logs DISCORD en fichier
            spotify: false      // ❌ Pas de logs SPOTIFY en fichier
        };
        
        // Nettoyage automatique DÉSACTIVÉ pour éviter les problèmes
        // this.cleanupOldLogs();
        
        // Nettoyage automatique DÉSACTIVÉ pour éviter les problèmes
        // this.cleanupInterval = setInterval(() => {
        //     this.cleanupOldLogs();
        // }, 60 * 60 * 1000); // 1 heure
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, data = null) {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        const logEntry = {
            timestamp,
            level,
            message,
            data: data || null,
            pid: process.pid
        };
        return JSON.stringify(logEntry);
    }

    writeToFile(filename, logEntry) {
        try {
            fs.appendFileSync(filename, logEntry + '\n');
        } catch (error) {
            console.error('Erreur lors de l\'écriture du log:', error);
        }
    }

    info(message, data = null) {
        const logEntry = this.formatMessage('INFO', message, data);
        console.log(chalk.blue(`[${moment().format('HH:mm:ss')}] ℹ️  INFO: ${message}`));
        if (this.logToFile.info) {
            this.writeToFile(this.logFile, logEntry);
        }
    }

    success(message, data = null) {
        const logEntry = this.formatMessage('SUCCESS', message, data);
        console.log(chalk.green(`[${moment().format('HH:mm:ss')}] ✅ SUCCESS: ${message}`));
        if (this.logToFile.success) {
            this.writeToFile(this.logFile, logEntry);
        }
    }

    warning(message, data = null) {
        const logEntry = this.formatMessage('WARNING', message, data);
        console.log(chalk.yellow(`[${moment().format('HH:mm:ss')}] ⚠️  WARNING: ${message}`));
        if (this.logToFile.warning) {
            this.writeToFile(this.logFile, logEntry);
        }
    }

    error(message, error = null, data = null) {
        const errorData = error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : null;
        
        const logEntry = this.formatMessage('ERROR', message, { ...data, error: errorData });
        console.log(chalk.red(`[${moment().format('HH:mm:ss')}] ❌ ERROR: ${message}`));
        if (error) {
            console.log(chalk.red(`Stack: ${error.stack}`));
        }
        
        if (this.logToFile.error) {
            this.writeToFile(this.logFile, logEntry);
            this.writeToFile(this.errorFile, logEntry);
        }
    }

    debug(message, data = null) {
        const logEntry = this.formatMessage('DEBUG', message, data);
        console.log(chalk.gray(`[${moment().format('HH:mm:ss')}] 🔍 DEBUG: ${message}`));
        if (this.logToFile.debug) {
            this.writeToFile(this.debugFile, logEntry);
        }
    }

    music(message, data = null) {
        const logEntry = this.formatMessage('MUSIC', message, data);
        console.log(chalk.magenta(`[${moment().format('HH:mm:ss')}] 🎵 MUSIC: ${message}`));
        if (this.logToFile.music) {
            this.writeToFile(this.logFile, logEntry);
        }
    }

    discord(message, data = null) {
        const logEntry = this.formatMessage('DISCORD', message, data);
        console.log(chalk.cyan(`[${moment().format('HH:mm:ss')}] 🤖 DISCORD: ${message}`));
        if (this.logToFile.discord) {
            this.writeToFile(this.logFile, logEntry);
        }
    }

    spotify(message, data = null) {
        const logEntry = this.formatMessage('SPOTIFY', message, data);
        console.log(chalk.green(`[${moment().format('HH:mm:ss')}] 🎧 SPOTIFY: ${message}`));
        if (this.logToFile.spotify) {
            this.writeToFile(this.logFile, logEntry);
        }
    }

    // Méthode pour nettoyer les anciens logs (garder 3 jours et limiter la taille à 25MB)
    cleanupOldLogs() {
        try {
            const files = fs.readdirSync(this.logDir);
            const threeDaysAgo = moment().subtract(3, 'days');
            const maxFileSize = 25 * 1024 * 1024; // 25MB max par fichier
            
            files.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                
                // Supprimer les fichiers anciens (plus de 3 jours)
                if (moment(stats.mtime).isBefore(threeDaysAgo)) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Ancien fichier de log supprimé: ${file}`);
                }
                // Supprimer les fichiers trop volumineux (plus de 25MB)
                else if (stats.size > maxFileSize) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Fichier de log volumineux supprimé: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
                }
            });
        } catch (error) {
            console.error('Erreur lors du nettoyage des logs:', error);
        }
    }

    // Méthode pour arrêter le nettoyage automatique
    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    // Méthode pour obtenir les statistiques des logs
    getLogStats() {
        try {
            const files = fs.readdirSync(this.logDir);
            const stats = {
                totalFiles: files.length,
                totalSize: 0,
                files: []
            };

            files.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const fileStats = fs.statSync(filePath);
                stats.totalSize += fileStats.size;
                stats.files.push({
                    name: file,
                    size: fileStats.size,
                    modified: fileStats.mtime
                });
            });

            return stats;
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques des logs:', error);
            return null;
        }
    }
}

module.exports = Logger;
