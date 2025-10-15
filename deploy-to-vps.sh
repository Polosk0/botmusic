#!/bin/bash

echo "🚀 Déploiement du Bot sur VPS Linux"
echo "===================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}❌ Usage: ./deploy-to-vps.sh <user@host> <destination-path>${NC}"
    echo ""
    echo -e "${CYAN}Exemples:${NC}"
    echo "  ./deploy-to-vps.sh root@192.168.1.100 ~/botmusic"
    echo "  ./deploy-to-vps.sh user@vps.example.com /opt/botmusic"
    echo ""
    exit 1
fi

VPS_HOST=$1
VPS_PATH=$2

echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  Host: ${CYAN}$VPS_HOST${NC}"
echo -e "  Path: ${CYAN}$VPS_PATH${NC}"
echo ""

read -p "Continuer le déploiement ? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Déploiement annulé${NC}"
    exit 0
fi

echo -e "${BLUE}📦 Synchronisation des fichiers...${NC}"

rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude 'logs' \
    --exclude 'temp' \
    --exclude '.env' \
    --exclude '*.log' \
    --exclude '.git' \
    --exclude '*.backup' \
    --exclude '*.tar.gz' \
    --exclude '1759*-player-script.js' \
    ./ "$VPS_HOST:$VPS_PATH/"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du transfert${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Fichiers transférés${NC}"
echo ""

echo -e "${BLUE}🔧 Configuration du VPS...${NC}"

ssh "$VPS_HOST" "cd $VPS_PATH && chmod +x *.sh && bash install-vps.sh"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Installation terminée avec des avertissements${NC}"
else
    echo -e "${GREEN}✅ Installation réussie${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Déploiement terminé !${NC}"
echo ""
echo -e "${CYAN}📝 Prochaines étapes:${NC}"
echo "  1. Connectez-vous au VPS: ssh $VPS_HOST"
echo "  2. Allez dans le dossier: cd $VPS_PATH"
echo "  3. Configurez .env: nano .env"
echo "  4. Démarrez le bot: pm2 start ecosystem.config.js"
echo "  5. Sauvegardez: pm2 save"
echo ""

