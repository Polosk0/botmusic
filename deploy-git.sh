#!/bin/bash

set -e

echo "🚀 Déploiement via Git sur VPS"
echo "==============================="
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
    echo -e "$(timestamp) ${YELLOW}Exécutez d'abord: git init${NC}"
    exit 1
fi

if [ -z "$1" ]; then
    echo -e "${RED}❌ Usage: ./deploy-git.sh <remote-name>${NC}"
    echo ""
    echo -e "${CYAN}Exemples:${NC}"
    echo "  ./deploy-git.sh vps"
    echo "  ./deploy-git.sh production"
    echo ""
    echo -e "${YELLOW}Note: Configurez d'abord votre remote Git sur le VPS${NC}"
    echo "Voir GIT_DEPLOY.md pour les instructions"
    exit 1
fi

REMOTE=$1

echo -e "$(timestamp) ${BLUE}📋 Vérification du dépôt Git...${NC}"

if ! git remote | grep -q "^${REMOTE}$"; then
    echo -e "$(timestamp) ${RED}❌ Remote '$REMOTE' non trouvé${NC}"
    echo ""
    echo -e "${YELLOW}Remotes disponibles:${NC}"
    git remote -v
    echo ""
    echo -e "${CYAN}Pour ajouter un remote:${NC}"
    echo "  git remote add $REMOTE ssh://user@vps-ip/chemin/vers/repo.git"
    exit 1
fi

echo -e "$(timestamp) ${GREEN}✅ Remote '$REMOTE' trouvé${NC}"

if [ -n "$(git status --porcelain)" ]; then
    echo -e "$(timestamp) ${YELLOW}⚠️  Modifications non committées détectées${NC}"
    echo ""
    git status --short
    echo ""
    read -p "Voulez-vous commit ces changements ? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Message du commit: " COMMIT_MSG
        git commit -m "${COMMIT_MSG:-Update}"
        echo -e "$(timestamp) ${GREEN}✅ Changements committés${NC}"
    else
        echo -e "$(timestamp) ${YELLOW}Déploiement annulé${NC}"
        exit 0
    fi
fi

CURRENT_BRANCH=$(git branch --show-current)
echo -e "$(timestamp) ${BLUE}📤 Push vers $REMOTE/$CURRENT_BRANCH...${NC}"

git push $REMOTE $CURRENT_BRANCH

if [ $? -eq 0 ]; then
    echo -e "$(timestamp) ${GREEN}✅ Déploiement réussi !${NC}"
    echo ""
    echo -e "${CYAN}📝 Prochaines étapes sur le VPS:${NC}"
    echo "  ssh user@vps-ip"
    echo "  cd /chemin/vers/botmusic"
    echo "  git pull"
    echo "  pnpm install"
    echo "  pm2 restart botmusic"
else
    echo -e "$(timestamp) ${RED}❌ Erreur lors du push${NC}"
    exit 1
fi

