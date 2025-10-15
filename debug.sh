#!/bin/bash

# Script de debug et monitoring pour le bot Discord musical 🕲- 𝘮
# Ce script surveille en temps réel les logs et les performances du bot

echo "🔍 Démarrage du système de debug et monitoring"
echo "=============================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour afficher le timestamp
timestamp() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC}"
}

# Fonction pour afficher les logs en temps réel
monitor_logs() {
    echo -e "$(timestamp) ${GREEN}📊 Surveillance des logs en temps réel${NC}"
    echo -e "$(timestamp) ${BLUE}Appuyez sur Ctrl+C pour arrêter${NC}"
    echo ""
    
    # Surveiller le fichier de log principal
    if [ -f "logs/bot-$(date +%Y-%m-%d).log" ]; then
        tail -f "logs/bot-$(date +%Y-%m-%d).log" | while read line; do
            # Colorer les différents types de logs
            if echo "$line" | grep -q "ERROR"; then
                echo -e "$(timestamp) ${RED}❌ $line${NC}"
            elif echo "$line" | grep -q "WARNING"; then
                echo -e "$(timestamp) ${YELLOW}⚠️  $line${NC}"
            elif echo "$line" | grep -q "SUCCESS"; then
                echo -e "$(timestamp) ${GREEN}✅ $line${NC}"
            elif echo "$line" | grep -q "MUSIC"; then
                echo -e "$(timestamp) ${MAGENTA}🎵 $line${NC}"
            elif echo "$line" | grep -q "DISCORD"; then
                echo -e "$(timestamp) ${CYAN}🤖 $line${NC}"
            elif echo "$line" | grep -q "SPOTIFY"; then
                echo -e "$(timestamp) ${GREEN}🎧 $line${NC}"
            else
                echo -e "$(timestamp) ${BLUE}ℹ️  $line${NC}"
            fi
        done
    else
        echo -e "$(timestamp) ${YELLOW}⚠️  Aucun fichier de log trouvé pour aujourd'hui${NC}"
        echo -e "$(timestamp) ${BLUE}Attente de la création du fichier de log...${NC}"
        
        # Attendre que le fichier soit créé
        while [ ! -f "logs/bot-$(date +%Y-%m-%d).log" ]; do
            sleep 1
        done
        
        # Relancer la surveillance
        monitor_logs
    fi
}

# Fonction pour afficher les statistiques
show_stats() {
    echo -e "$(timestamp) ${BLUE}📈 Statistiques du bot${NC}"
    echo "========================"
    
    # Vérifier si le bot est en cours d'exécution
    if pgrep -f "node.*src/index.js" > /dev/null; then
        echo -e "$(timestamp) ${GREEN}✅ Bot en cours d'exécution${NC}"
        
        # Afficher l'utilisation mémoire
        MEMORY=$(ps -o pid,rss,comm -p $(pgrep -f "node.*src/index.js") | tail -1 | awk '{print $2}')
        if [ ! -z "$MEMORY" ]; then
            MEMORY_MB=$((MEMORY / 1024))
            echo -e "$(timestamp) ${BLUE}💾 Utilisation mémoire: ${MEMORY_MB}MB${NC}"
        fi
        
        # Afficher l'uptime
        UPTIME=$(ps -o pid,etime,comm -p $(pgrep -f "node.*src/index.js") | tail -1 | awk '{print $2}')
        echo -e "$(timestamp) ${BLUE}⏱️  Uptime: ${UPTIME}${NC}"
        
    else
        echo -e "$(timestamp) ${RED}❌ Bot non démarré${NC}"
    fi
    
    # Afficher les statistiques des logs
    if [ -d "logs" ]; then
        LOG_COUNT=$(find logs -name "*.log" | wc -l)
        TOTAL_SIZE=$(du -sh logs 2>/dev/null | cut -f1)
        echo -e "$(timestamp) ${BLUE}📁 Fichiers de logs: ${LOG_COUNT} (${TOTAL_SIZE})${NC}"
        
        # Compter les erreurs d'aujourd'hui
        ERROR_COUNT=$(grep -c "ERROR" logs/bot-$(date +%Y-%m-%d).log 2>/dev/null || echo "0")
        WARNING_COUNT=$(grep -c "WARNING" logs/bot-$(date +%Y-%m-%d).log 2>/dev/null || echo "0")
        
        echo -e "$(timestamp) ${RED}❌ Erreurs aujourd'hui: ${ERROR_COUNT}${NC}"
        echo -e "$(timestamp) ${YELLOW}⚠️  Avertissements aujourd'hui: ${WARNING_COUNT}${NC}"
    fi
    
    echo ""
}

# Fonction pour nettoyer les logs anciens
cleanup_logs() {
    echo -e "$(timestamp) ${BLUE}🧹 Nettoyage des anciens logs${NC}"
    
    if [ -d "logs" ]; then
        # Supprimer les logs de plus de 7 jours
        find logs -name "*.log" -mtime +7 -delete 2>/dev/null
        echo -e "$(timestamp) ${GREEN}✅ Nettoyage terminé${NC}"
    else
        echo -e "$(timestamp) ${YELLOW}⚠️  Dossier logs introuvable${NC}"
    fi
}

# Fonction pour afficher les dernières erreurs
show_recent_errors() {
    echo -e "$(timestamp) ${RED}🚨 Dernières erreurs${NC}"
    echo "=================="
    
    if [ -f "logs/bot-$(date +%Y-%m-%d).log" ]; then
        grep "ERROR" logs/bot-$(date +%Y-%m-%d).log | tail -5 | while read line; do
            echo -e "$(timestamp) ${RED}$line${NC}"
        done
    else
        echo -e "$(timestamp) ${YELLOW}⚠️  Aucun fichier de log trouvé${NC}"
    fi
    
    echo ""
}

# Fonction d'aide
show_help() {
    echo -e "${BLUE}🔍 Système de Debug et Monitoring - Bot Discord Musical${NC}"
    echo "=========================================================="
    echo ""
    echo -e "${GREEN}Commandes disponibles:${NC}"
    echo "  monitor    - Surveiller les logs en temps réel"
    echo "  stats      - Afficher les statistiques"
    echo "  errors     - Afficher les dernières erreurs"
    echo "  cleanup    - Nettoyer les anciens logs"
    echo "  help       - Afficher cette aide"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./debug.sh monitor    # Surveillance en temps réel"
    echo "  ./debug.sh stats      # Statistiques rapides"
    echo "  ./debug.sh errors     # Dernières erreurs"
    echo ""
}

# Fonction principale
main() {
    case "$1" in
        "monitor")
            monitor_logs
            ;;
        "stats")
            show_stats
            ;;
        "errors")
            show_recent_errors
            ;;
        "cleanup")
            cleanup_logs
            ;;
        "help"|"")
            show_help
            ;;
        *)
            echo -e "$(timestamp) ${RED}❌ Commande inconnue: $1${NC}"
            show_help
            ;;
    esac
}

# Gestion des signaux pour un arrêt propre
trap 'echo -e "\n$(timestamp) ${YELLOW}🛑 Arrêt du monitoring${NC}"; exit 0' INT TERM

# Exécuter la fonction principale
main "$1"


