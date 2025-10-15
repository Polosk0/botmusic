const Logger = require('./advancedLogger');
const fs = require('fs');
const path = require('path');

class DebugMonitor {
    constructor() {
        this.logger = new Logger();
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.errorCount = 0;
        this.warningCount = 0;
        this.startTime = new Date();
        this.lastErrorTime = null;
        this.performanceMetrics = {
            memoryUsage: [],
            cpuUsage: [],
            uptime: 0
        };
    }

    startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ Le monitoring est déjà actif');
            return;
        }

        this.isMonitoring = true;
        console.log('🔍 Système de monitoring ESSENTIEL démarré');
        
        // Monitoring ULTRA-LÉGER toutes les 30 minutes seulement
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            // Pas de checkLogFiles ni monitorPerformance pour éviter les logs
        }, 1800000); // 30 minutes seulement

        // Nettoyage des logs toutes les 2 heures (moins fréquent)
        setInterval(() => {
            this.logger.cleanupOldLogs();
        }, 7200000); // 2 heures

        console.log('✅ Monitoring configuré: métriques toutes les 30min, nettoyage toutes les 2h');
    }

    stopMonitoring() {
        if (!this.isMonitoring) {
            this.logger.warning('Le monitoring n\'est pas actif');
            return;
        }

        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        this.logger.success('🔍 Système de monitoring debug arrêté');
    }

    collectMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        this.performanceMetrics.memoryUsage.push({
            timestamp: new Date(),
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external
        });

        this.performanceMetrics.cpuUsage.push({
            timestamp: new Date(),
            user: cpuUsage.user,
            system: cpuUsage.system
        });

        // Garder seulement les 100 dernières entrées
        if (this.performanceMetrics.memoryUsage.length > 100) {
            this.performanceMetrics.memoryUsage.shift();
        }
        if (this.performanceMetrics.cpuUsage.length > 100) {
            this.performanceMetrics.cpuUsage.shift();
        }

        this.performanceMetrics.uptime = process.uptime();
    }

    checkLogFiles() {
        try {
            const logDir = path.join(__dirname, '../logs');
            if (!fs.existsSync(logDir)) {
                this.logger.warning('Dossier de logs introuvable');
                return;
            }

            const files = fs.readdirSync(logDir);
            const logFiles = files.filter(file => file.endsWith('.log'));
            
            // Log seulement le nombre de fichiers, pas la liste complète
            this.logger.debug(`Fichiers de logs détectés: ${logFiles.length}`);

            // Vérifier la taille des fichiers (seulement si > 20MB)
            logFiles.forEach(file => {
                const filePath = path.join(logDir, file);
                const stats = fs.statSync(filePath);
                const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                
                if (stats.size > 20 * 1024 * 1024) { // 20MB
                    this.logger.warning(`Fichier de log volumineux détecté: ${file} (${sizeMB}MB)`);
                }
            });

        } catch (error) {
            this.logger.error('Erreur lors de la vérification des fichiers de logs', error);
        }
    }

    monitorPerformance() {
        // Fonction désactivée pour éviter les logs excessifs
        return;
    }

    logError(error, context = {}) {
        this.errorCount++;
        this.lastErrorTime = new Date();
        
        this.logger.error(`Erreur #${this.errorCount}`, error, {
            context,
            errorCount: this.errorCount,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    }

    logWarning(message, context = {}) {
        this.warningCount++;
        
        this.logger.warning(`Avertissement #${this.warningCount}: ${message}`, {
            context,
            warningCount: this.warningCount,
            uptime: process.uptime()
        });
    }

    getStatus() {
        const uptime = process.uptime();
        const memUsage = process.memoryUsage();
        
        return {
            isMonitoring: this.isMonitoring,
            uptime: uptime,
            uptimeFormatted: this.formatUptime(uptime),
            errorCount: this.errorCount,
            warningCount: this.warningCount,
            lastErrorTime: this.lastErrorTime,
            memoryUsage: {
                rss: (memUsage.rss / 1024 / 1024).toFixed(2) + 'MB',
                heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
                heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + 'MB'
            },
            startTime: this.startTime,
            logStats: this.logger.getLogStats()
        };
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours}h ${minutes}m ${secs}s`;
    }

    generateReport() {
        const status = this.getStatus();
        const report = {
            timestamp: new Date(),
            status: status,
            performance: {
                averageMemoryUsage: this.calculateAverageMemoryUsage(),
                peakMemoryUsage: this.getPeakMemoryUsage(),
                errorRate: this.calculateErrorRate()
            }
        };

        this.logger.info('Rapport de monitoring généré', report);
        return report;
    }

    calculateAverageMemoryUsage() {
        if (this.performanceMetrics.memoryUsage.length === 0) return 0;
        
        const total = this.performanceMetrics.memoryUsage.reduce((sum, entry) => sum + entry.heapUsed, 0);
        return (total / this.performanceMetrics.memoryUsage.length / 1024 / 1024).toFixed(2) + 'MB';
    }

    getPeakMemoryUsage() {
        if (this.performanceMetrics.memoryUsage.length === 0) return '0MB';
        
        const peak = Math.max(...this.performanceMetrics.memoryUsage.map(entry => entry.heapUsed));
        return (peak / 1024 / 1024).toFixed(2) + 'MB';
    }

    calculateErrorRate() {
        const uptimeHours = process.uptime() / 3600;
        return uptimeHours > 0 ? (this.errorCount / uptimeHours).toFixed(2) : 0;
    }
}

module.exports = DebugMonitor;


