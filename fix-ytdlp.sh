#!/bin/bash

set -e

echo "🔧 Installation/Réparation de yt-dlp"
echo "====================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

timestamp() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC}"
}

echo -e "$(timestamp) ${BLUE}🔍 Vérification de yt-dlp...${NC}"

if command -v yt-dlp &> /dev/null; then
    echo -e "$(timestamp) ${YELLOW}⚠️  yt-dlp déjà installé: $(yt-dlp --version)${NC}"
    echo -e "$(timestamp) ${BLUE}Mise à jour...${NC}"
    sudo yt-dlp -U || sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
else
    echo -e "$(timestamp) ${YELLOW}⚠️  yt-dlp non trouvé. Installation...${NC}"
    sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
fi

sudo chmod a+rx /usr/local/bin/yt-dlp

echo -e "$(timestamp) ${GREEN}✅ yt-dlp installé/mis à jour${NC}"
echo ""
echo -e "$(timestamp) ${BLUE}Version installée:${NC}"
yt-dlp --version
echo ""

echo -e "$(timestamp) ${BLUE}🔍 Vérification de FFmpeg...${NC}"
if ! command -v ffmpeg &> /dev/null; then
    echo -e "$(timestamp) ${YELLOW}⚠️  FFmpeg non trouvé. Installation...${NC}"
    sudo apt-get update
    sudo apt-get install -y ffmpeg
    echo -e "$(timestamp) ${GREEN}✅ FFmpeg installé${NC}"
else
    echo -e "$(timestamp) ${GREEN}✅ FFmpeg déjà installé${NC}"
fi

echo ""
echo -e "$(timestamp) ${BLUE}🔍 Vérification de Python3...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "$(timestamp) ${YELLOW}⚠️  Python3 non trouvé. Installation...${NC}"
    sudo apt-get install -y python3 python3-pip
    echo -e "$(timestamp) ${GREEN}✅ Python3 installé${NC}"
else
    echo -e "$(timestamp) ${GREEN}✅ Python3 déjà installé: $(python3 --version)${NC}"
fi

echo ""
echo -e "$(timestamp) ${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo -e "$(timestamp) ${CYAN}🔄 Redémarrage du bot recommandé:${NC}"
echo -e "   ${YELLOW}pm2 restart botmusic${NC}"
echo ""

