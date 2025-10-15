#!/bin/bash

set -e

echo "🎵 Installation du Bot Discord Musical sur VPS Linux"
echo "====================================================="
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

echo -e "$(timestamp) ${BLUE}🔍 Vérification de l'environnement...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "$(timestamp) ${YELLOW}⚠️  Node.js n'est pas installé. Installation en cours...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo -e "$(timestamp) ${GREEN}✅ Node.js $(node -v) détecté${NC}"

if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "$(timestamp) ${RED}❌ Node.js 16+ requis. Veuillez mettre à jour Node.js${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "$(timestamp) ${YELLOW}⚠️  pnpm n'est pas installé. Installation en cours...${NC}"
    npm install -g pnpm
fi

echo -e "$(timestamp) ${GREEN}✅ pnpm $(pnpm -v) installé${NC}"

if ! command -v pm2 &> /dev/null; then
    echo -e "$(timestamp) ${YELLOW}⚠️  PM2 n'est pas installé. Installation en cours...${NC}"
    npm install -g pm2
    pm2 startup
fi

echo -e "$(timestamp) ${GREEN}✅ PM2 installé${NC}"

if ! command -v ffmpeg &> /dev/null; then
    echo -e "$(timestamp) ${YELLOW}⚠️  FFmpeg n'est pas installé. Installation en cours...${NC}"
    sudo apt-get update
    sudo apt-get install -y ffmpeg
fi

echo -e "$(timestamp) ${GREEN}✅ FFmpeg installé${NC}"

echo -e "$(timestamp) ${BLUE}📦 Installation des dépendances...${NC}"
pnpm install

if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        echo -e "$(timestamp) ${YELLOW}⚠️  Fichier .env manquant. Copie de env.example...${NC}"
        cp env.example .env
        echo -e "$(timestamp) ${YELLOW}📝 IMPORTANT: Éditez le fichier .env avec vos tokens!${NC}"
        echo -e "$(timestamp) ${YELLOW}    nano .env${NC}"
    else
        echo -e "$(timestamp) ${RED}❌ Fichier env.example introuvable${NC}"
        exit 1
    fi
else
    echo -e "$(timestamp) ${GREEN}✅ Fichier .env trouvé${NC}"
fi

mkdir -p logs
mkdir -p temp

chmod +x start.sh
chmod +x debug.sh

echo ""
echo -e "$(timestamp) ${GREEN}✅ Installation terminée avec succès !${NC}"
echo ""
echo -e "${BLUE}📋 Commandes disponibles:${NC}"
echo -e "  ${CYAN}pm2 start ecosystem.config.js${NC}  - Démarrer le bot avec PM2"
echo -e "  ${CYAN}pm2 stop botmusic${NC}             - Arrêter le bot"
echo -e "  ${CYAN}pm2 restart botmusic${NC}          - Redémarrer le bot"
echo -e "  ${CYAN}pm2 logs botmusic${NC}             - Voir les logs en temps réel"
echo -e "  ${CYAN}pm2 monit${NC}                     - Monitoring interactif"
echo -e "  ${CYAN}pm2 save${NC}                      - Sauvegarder la configuration"
echo -e "  ${CYAN}./start.sh${NC}                    - Démarrer sans PM2"
echo ""
echo -e "${YELLOW}⚠️  N'oubliez pas de configurer votre fichier .env !${NC}"
echo ""

