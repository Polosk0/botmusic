#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ "$1" == "" ]; then
    echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}     🎵 ${GREEN}Commandes Rapides - Bot Discord${NC}          ${BLUE}║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Usage:${NC} ./quick-commands.sh [commande]"
    echo ""
    echo -e "${GREEN}Commandes disponibles:${NC}"
    echo -e "  ${YELLOW}logs${NC}      - Logs en temps réel"
    echo -e "  ${YELLOW}errors${NC}    - Erreurs uniquement"
    echo -e "  ${YELLOW}status${NC}    - Statut du bot"
    echo -e "  ${YELLOW}restart${NC}   - Redémarrer le bot"
    echo -e "  ${YELLOW}stop${NC}      - Arrêter le bot"
    echo -e "  ${YELLOW}start${NC}     - Démarrer le bot"
    echo -e "  ${YELLOW}update${NC}    - Mettre à jour depuis Git"
    echo -e "  ${YELLOW}fix-ytdlp${NC} - Réparer yt-dlp"
    echo -e "  ${YELLOW}check${NC}     - Vérifier l'état système"
    echo -e "  ${YELLOW}menu${NC}      - Menu interactif complet"
    echo ""
    echo -e "${CYAN}Exemples:${NC}"
    echo -e "  ./quick-commands.sh logs"
    echo -e "  ./quick-commands.sh restart"
    echo ""
    exit 0
fi

case "$1" in
    "logs")
        echo -e "${GREEN}📊 Logs en temps réel (CTRL+C pour quitter)${NC}"
        pm2 logs botmusic
        ;;
    "errors")
        echo -e "${RED}❌ Erreurs uniquement (CTRL+C pour quitter)${NC}"
        pm2 logs botmusic --err
        ;;
    "status")
        echo -e "${BLUE}📊 Statut du bot${NC}"
        pm2 status
        pm2 describe botmusic
        ;;
    "restart")
        echo -e "${BLUE}🔄 Redémarrage du bot...${NC}"
        pm2 restart botmusic
        echo -e "${GREEN}✅ Bot redémarré${NC}"
        ;;
    "stop")
        echo -e "${YELLOW}🛑 Arrêt du bot...${NC}"
        pm2 stop botmusic
        echo -e "${GREEN}✅ Bot arrêté${NC}"
        ;;
    "start")
        echo -e "${GREEN}🚀 Démarrage du bot...${NC}"
        pm2 start ecosystem.config.js
        echo -e "${GREEN}✅ Bot démarré${NC}"
        ;;
    "update")
        echo -e "${BLUE}🔄 Mise à jour depuis Git...${NC}"
        ./update-vps.sh
        ;;
    "fix-ytdlp")
        echo -e "${BLUE}🔧 Réparation yt-dlp...${NC}"
        ./fix-ytdlp.sh
        ;;
    "check")
        echo -e "${BLUE}🔍 Vérification système...${NC}"
        echo ""
        echo -e "${YELLOW}Node.js:${NC} $(node -v)"
        echo -e "${YELLOW}PM2:${NC} $(pm2 -v)"
        if command -v yt-dlp &> /dev/null; then
            echo -e "${GREEN}✅ yt-dlp: $(yt-dlp --version)${NC}"
        else
            echo -e "${RED}❌ yt-dlp NON installé${NC}"
        fi
        if command -v ffmpeg &> /dev/null; then
            echo -e "${GREEN}✅ FFmpeg installé${NC}"
        else
            echo -e "${RED}❌ FFmpeg NON installé${NC}"
        fi
        echo ""
        pm2 status
        ;;
    "menu")
        ./logs-vps.sh
        ;;
    *)
        echo -e "${RED}❌ Commande inconnue: $1${NC}"
        echo ""
        echo "Utilisez: ./quick-commands.sh (sans argument) pour voir l'aide"
        ;;
esac

