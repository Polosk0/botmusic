#!/bin/bash

# Script de démarrage amélioré avec debug automatique pour le bot Discord musical 🕲- 𝘮
# Usage: ./start-with-debug.sh [dev|prod]

echo "🎵 Démarrage du bot Discord musical 🕲- 𝘮 avec système de debug"
echo "=============================================================="

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

# Fonction pour vérifier les prérequis
check_prerequisites() {
    echo -e "$(timestamp) ${BLUE}🔍 Vérification des prérequis...${NC}"
    
    # Vérifier si Node.js est installé
    if ! command -v node &> /dev/null; then
        echo -e "$(timestamp) ${RED}❌ Node.js n'est pas installé. Veuillez installer Node.js version 16 ou supérieure.${NC}"
        exit 1
    fi

    # Vérifier la version de Node.js
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        echo -e "$(timestamp) ${RED}❌ Node.js version 16 ou supérieure requis. Version actuelle: $(node -v)${NC}"
        exit 1
    fi

    echo -e "$(timestamp) ${GREEN}✅ Node.js $(node -v) détecté${NC}"

    # Vérifier si le fichier .env existe
    if [ ! -f ".env" ]; then
        echo -e "$(timestamp) ${YELLOW}⚠️  Fichier .env non trouvé.${NC}"
        if [ -f "env.example" ]; then
            cp env.example .env
            echo -e "$(timestamp) ${GREEN}✅ Fichier .env créé à partir d'env.example${NC}"
            echo -e "$(timestamp) ${YELLOW}📝 Veuillez éditer le fichier .env avec vos configurations${NC}"
            exit 1
        else
            echo -e "$(timestamp) ${RED}❌ Fichier env.example non trouvé${NC}"
            exit 1
        fi
    fi

    echo -e "$(timestamp) ${GREEN}✅ Fichier .env trouvé${NC}"
}

# Fonction pour installer les dépendances
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        echo -e "$(timestamp) ${BLUE}📦 Installation des dépendances...${NC}"
        npm install
        if [ $? -ne 0 ]; then
            echo -e "$(timestamp) ${RED}❌ Erreur lors de l'installation des dépendances${NC}"
            exit 1
        fi
        echo -e "$(timestamp) ${GREEN}✅ Dépendances installées avec succès${NC}"
    else
        echo -e "$(timestamp) ${GREEN}✅ Dépendances déjà installées${NC}"
    fi
}

# Fonction pour créer les dossiers nécessaires
create_directories() {
    echo -e "$(timestamp) ${BLUE}📁 Création des dossiers nécessaires...${NC}"
    
    # Créer le dossier logs s'il n'existe pas
    if [ ! -d "logs" ]; then
        mkdir logs
        echo -e "$(timestamp) ${GREEN}✅ Dossier logs créé${NC}"
    else
        echo -e "$(timestamp) ${GREEN}✅ Dossier logs existe déjà${NC}"
    fi
}

# Fonction pour démarrer le bot avec debug
start_bot_with_debug() {
    local mode=$1
    
    echo -e "$(timestamp) ${MAGENTA}🚀 Démarrage du bot en mode ${mode} avec debug...${NC}"
    
    # Fonction pour nettoyer les processus à l'arrêt
    cleanup() {
        echo -e "\n$(timestamp) ${YELLOW}🛑 Arrêt du bot et du système de debug...${NC}"
        
        # Tuer le processus du bot
        if [ ! -z "$BOT_PID" ]; then
            kill $BOT_PID 2>/dev/null
            echo -e "$(timestamp) ${GREEN}✅ Processus du bot arrêté${NC}"
        fi
        
        # Tuer le processus de debug
        if [ ! -z "$DEBUG_PID" ]; then
            kill $DEBUG_PID 2>/dev/null
            echo -e "$(timestamp) ${GREEN}✅ Système de debug arrêté${NC}"
        fi
        
        echo -e "$(timestamp) ${BLUE}👋 Au revoir !${NC}"
        exit 0
    }

    # Capturer les signaux d'arrêt
    trap cleanup SIGINT SIGTERM

    # Démarrer le bot en arrière-plan
    if [ "$mode" = "dev" ]; then
        npm run dev &
    else
        npm start &
    fi
    
    BOT_PID=$!
    echo -e "$(timestamp) ${GREEN}✅ Bot démarré avec PID: $BOT_PID${NC}"

    # Attendre un peu que le bot démarre
    sleep 3

    # Démarrer le système de debug
    echo -e "$(timestamp) ${CYAN}🔍 Démarrage du système de debug...${NC}"
    ./debug.sh monitor &
    DEBUG_PID=$!
    echo -e "$(timestamp) ${GREEN}✅ Système de debug démarré avec PID: $DEBUG_PID${NC}"

    # Afficher les informations de monitoring
    echo -e "$(timestamp) ${BLUE}📊 Informations de monitoring:${NC}"
    echo -e "$(timestamp) ${BLUE}   - Bot PID: $BOT_PID${NC}"
    echo -e "$(timestamp) ${BLUE}   - Debug PID: $DEBUG_PID${NC}"
    echo -e "$(timestamp) ${BLUE}   - Logs: logs/bot-$(date +%Y-%m-%d).log${NC}"
    echo -e "$(timestamp) ${BLUE}   - Appuyez sur Ctrl+C pour arrêter${NC}"
    echo ""

    # Surveiller les processus
    while true; do
        # Vérifier si le bot est toujours en vie
        if ! kill -0 $BOT_PID 2>/dev/null; then
            echo -e "$(timestamp) ${RED}❌ Le bot s'est arrêté de manière inattendue${NC}"
            cleanup
        fi
        
        # Vérifier si le debug est toujours en vie
        if ! kill -0 $DEBUG_PID 2>/dev/null; then
            echo -e "$(timestamp) ${YELLOW}⚠️  Le système de debug s'est arrêté${NC}"
            # Redémarrer le debug
            ./debug.sh monitor &
            DEBUG_PID=$!
            echo -e "$(timestamp) ${GREEN}✅ Système de debug redémarré${NC}"
        fi
        
        sleep 5
    done
}

# Fonction principale
main() {
    local mode=${1:-prod}
    
    # Vérifications préliminaires
    check_prerequisites
    install_dependencies
    create_directories
    
    # Démarrer le bot avec debug
    start_bot_with_debug $mode
}

# Exécuter la fonction principale
main "$1"


