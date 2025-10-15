#!/bin/bash

set -e

echo "🔄 Mise à jour du bot depuis Git"
echo "================================="
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

if [ ! -d ".git" ]; then
    echo -e "$(timestamp) ${RED}❌ Ce n'est pas un dépôt Git${NC}"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo -e "$(timestamp) ${YELLOW}⚠️  PM2 non trouvé, le bot ne sera pas redémarré automatiquement${NC}"
    PM2_INSTALLED=false
else
    PM2_INSTALLED=true
fi

echo -e "$(timestamp) ${BLUE}💾 Sauvegarde de l'état actuel...${NC}"
if [ "$PM2_INSTALLED" = true ]; then
    pm2 stop botmusic 2>/dev/null || echo -e "$(timestamp) ${YELLOW}⚠️  Bot non démarré${NC}"
fi

echo -e "$(timestamp) ${BLUE}📥 Pull des derniers changements...${NC}"
BEFORE_COMMIT=$(git rev-parse HEAD)
git pull origin main

AFTER_COMMIT=$(git rev-parse HEAD)

if [ "$BEFORE_COMMIT" = "$AFTER_COMMIT" ]; then
    echo -e "$(timestamp) ${GREEN}✅ Déjà à jour${NC}"
else
    echo -e "$(timestamp) ${GREEN}✅ Mise à jour récupérée${NC}"
    echo -e "$(timestamp) ${BLUE}📊 Changements:${NC}"
    git log --oneline $BEFORE_COMMIT..$AFTER_COMMIT
fi

if [ -f "package.json" ]; then
    echo -e "$(timestamp) ${BLUE}📦 Vérification des dépendances...${NC}"
    
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v npm &> /dev/null; then
        npm install
    else
        echo -e "$(timestamp) ${RED}❌ npm/pnpm non trouvé${NC}"
        exit 1
    fi
    
    echo -e "$(timestamp) ${GREEN}✅ Dépendances installées${NC}"
fi

if [ "$PM2_INSTALLED" = true ]; then
    echo -e "$(timestamp) ${BLUE}🚀 Redémarrage du bot...${NC}"
    
    if pm2 list | grep -q "botmusic"; then
        pm2 restart botmusic
    else
        pm2 start ecosystem.config.js
    fi
    
    echo -e "$(timestamp) ${GREEN}✅ Bot redémarré${NC}"
    echo ""
    echo -e "$(timestamp) ${CYAN}📊 Logs:${NC}"
    pm2 logs botmusic --lines 20 --nostream
else
    echo -e "$(timestamp) ${YELLOW}⚠️  Redémarrez manuellement le bot${NC}"
    echo -e "$(timestamp) ${CYAN}Commande: node src/index.js${NC}"
fi

echo ""
echo -e "$(timestamp) ${GREEN}🎉 Mise à jour terminée !${NC}"

