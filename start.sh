#!/bin/bash

set -e

echo "🎵 Démarrage du bot Discord musical 🕲- 𝘮"
echo "========================================"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

timestamp() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC}"
}

if ! command -v node &> /dev/null; then
    echo -e "$(timestamp) ${RED}❌ Node.js n'est pas installé.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "$(timestamp) ${RED}❌ Node.js 16+ requis. Version actuelle: $(node -v)${NC}"
    exit 1
fi

echo -e "$(timestamp) ${GREEN}✅ Node.js $(node -v) détecté${NC}"

if ! command -v pnpm &> /dev/null; then
    echo -e "$(timestamp) ${YELLOW}⚠️  pnpm non trouvé, utilisation de npm...${NC}"
    PKG_MANAGER="npm"
else
    echo -e "$(timestamp) ${GREEN}✅ pnpm détecté${NC}"
    PKG_MANAGER="pnpm"
fi

if [ ! -f ".env" ]; then
    echo -e "$(timestamp) ${YELLOW}⚠️  Fichier .env non trouvé.${NC}"
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "$(timestamp) ${GREEN}✅ Fichier .env créé${NC}"
        echo -e "$(timestamp) ${YELLOW}📝 Éditez .env avec vos tokens${NC}"
        exit 1
    else
        echo -e "$(timestamp) ${RED}❌ env.example introuvable${NC}"
        exit 1
    fi
fi

if [ ! -d "node_modules" ]; then
    echo -e "$(timestamp) ${BLUE}📦 Installation des dépendances...${NC}"
    $PKG_MANAGER install
    echo -e "$(timestamp) ${GREEN}✅ Dépendances installées${NC}"
fi

mkdir -p logs
mkdir -p temp

cleanup() {
    echo -e "\n$(timestamp) ${YELLOW}🛑 Arrêt du bot...${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

MODE=${1:-prod}

if [ "$MODE" = "dev" ]; then
    echo -e "$(timestamp) ${BLUE}🚀 Démarrage en mode développement...${NC}"
    $PKG_MANAGER run dev
else
    echo -e "$(timestamp) ${BLUE}🚀 Démarrage en mode production...${NC}"
    $PKG_MANAGER start
fi

