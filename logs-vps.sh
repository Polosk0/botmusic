
#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

timestamp() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC}"
}

show_menu() {
    clear
    echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}     🎵 ${GREEN}Système de Debug - Bot Discord Musical${NC}    ${BLUE}║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Que voulez-vous voir ?${NC}"
    echo ""
    echo -e "  ${GREEN}[1]${NC} 📊 Logs en temps réel (tous)"
    echo -e "  ${GREEN}[2]${NC} ❌ Erreurs uniquement"
    echo -e "  ${GREEN}[3]${NC} 📈 Statistiques du bot"
    echo -e "  ${GREEN}[4]${NC} 🔍 Logs des 50 dernières lignes"
    echo -e "  ${GREEN}[5]${NC} 🔍 Logs des 100 dernières lignes"
    echo -e "  ${GREEN}[6]${NC} 💾 Logs du fichier applicatif"
    echo -e "  ${GREEN}[7]${NC} 🧹 Nettoyer les logs"
    echo -e "  ${GREEN}[8]${NC} 🔄 Redémarrer le bot"
    echo -e "  ${GREEN}[9]${NC} 🆘 Vérifier l'état du système"
    echo -e "  ${RED}[0]${NC} ❌ Quitter"
    echo ""
    echo -ne "${YELLOW}Votre choix : ${NC}"
}

logs_realtime() {
    echo -e "$(timestamp) ${GREEN}📊 Logs en temps réel (CTRL+C pour quitter)${NC}"
    echo ""
    pm2 logs botmusic
}

logs_errors() {
    echo -e "$(timestamp) ${RED}❌ Erreurs uniquement (CTRL+C pour quitter)${NC}"
    echo ""
    pm2 logs botmusic --err
}

show_stats() {
    echo -e "$(timestamp) ${BLUE}📈 Statistiques du bot${NC}"
    echo ""
    pm2 describe botmusic
    echo ""
    echo -e "${CYAN}Appuyez sur Entrée pour continuer...${NC}"
    read
}

logs_50() {
    echo -e "$(timestamp) ${BLUE}📋 50 dernières lignes de logs${NC}"
    echo ""
    pm2 logs botmusic --lines 50 --nostream
    echo ""
    echo -e "${CYAN}Appuyez sur Entrée pour continuer...${NC}"
    read
}

logs_100() {
    echo -e "$(timestamp) ${BLUE}📋 100 dernières lignes de logs${NC}"
    echo ""
    pm2 logs botmusic --lines 100 --nostream
    echo ""
    echo -e "${CYAN}Appuyez sur Entrée pour continuer...${NC}"
    read
}

logs_file() {
    echo -e "$(timestamp) ${BLUE}💾 Logs du fichier applicatif${NC}"
    echo ""
    if [ -f "logs/bot-$(date +%Y-%m-%d).log" ]; then
        tail -100 "logs/bot-$(date +%Y-%m-%d).log"
    else
        echo -e "${YELLOW}Aucun fichier de log trouvé pour aujourd'hui${NC}"
    fi
    echo ""
    echo -e "${CYAN}Appuyez sur Entrée pour continuer...${NC}"
    read
}

clean_logs() {
    echo -e "$(timestamp) ${YELLOW}🧹 Nettoyage des logs...${NC}"
    pm2 flush
    find logs -name "*.log" -mtime +7 -delete 2>/dev/null
    echo -e "$(timestamp) ${GREEN}✅ Logs nettoyés${NC}"
    sleep 2
}

restart_bot() {
    echo -e "$(timestamp) ${BLUE}🔄 Redémarrage du bot...${NC}"
    pm2 restart botmusic
    echo -e "$(timestamp) ${GREEN}✅ Bot redémarré${NC}"
    sleep 2
}

check_system() {
    clear
    echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}          🆘 ${CYAN}État du Système${NC}                      ${BLUE}║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${YELLOW}📊 Statut PM2:${NC}"
    pm2 status
    echo ""
    
    echo -e "${YELLOW}🔍 Vérification yt-dlp:${NC}"
    if command -v yt-dlp &> /dev/null; then
        echo -e "${GREEN}✅ yt-dlp installé: $(yt-dlp --version)${NC}"
    else
        echo -e "${RED}❌ yt-dlp NON installé${NC}"
        echo -e "${CYAN}   Installation: sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp${NC}"
    fi
    echo ""
    
    echo -e "${YELLOW}🔍 Vérification FFmpeg:${NC}"
    if command -v ffmpeg &> /dev/null; then
        echo -e "${GREEN}✅ FFmpeg installé${NC}"
    else
        echo -e "${RED}❌ FFmpeg NON installé${NC}"
    fi
    echo ""
    
    echo -e "${YELLOW}🔍 Vérification Node.js:${NC}"
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"
    else
        echo -e "${RED}❌ Node.js NON installé${NC}"
    fi
    echo ""
    
    echo -e "${YELLOW}💾 Utilisation disque:${NC}"
    df -h . | tail -1
    echo ""
    
    echo -e "${YELLOW}🧠 Utilisation mémoire:${NC}"
    free -h | grep -E "Mem|Swap"
    echo ""
    
    echo -e "${YELLOW}📁 Taille des logs:${NC}"
    if [ -d "logs" ]; then
        du -sh logs
    else
        echo "Aucun dossier logs"
    fi
    echo ""
    
    echo -e "${CYAN}Appuyez sur Entrée pour continuer...${NC}"
    read
}

while true; do
    show_menu
    read choice
    
    case $choice in
        1) logs_realtime ;;
        2) logs_errors ;;
        3) show_stats ;;
        4) logs_50 ;;
        5) logs_100 ;;
        6) logs_file ;;
        7) clean_logs ;;
        8) restart_bot ;;
        9) check_system ;;
        0) 
            echo -e "\n${BLUE}👋 Au revoir !${NC}\n"
            exit 0
            ;;
        *)
            echo -e "\n${RED}❌ Choix invalide${NC}"
            sleep 1
            ;;
    esac
done

