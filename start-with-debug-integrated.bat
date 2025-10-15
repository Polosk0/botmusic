@echo off
echo 🎵 Bot Discord Musical 🕲- 𝘮 avec Debug Complet
echo ==============================================

REM Vérifier les prérequis
if not exist ".env" (
    echo ❌ Fichier .env non trouvé !
    echo 📝 Copiez env.example vers .env et configurez-le
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation
        pause
        exit /b 1
    )
)

REM Créer le dossier logs
if not exist "logs" (
    mkdir logs
    echo 📁 Dossier logs créé
)

echo ✅ Prérequis vérifiés
echo.
echo 🚀 Démarrage du bot avec debug intégré...
echo 📊 Tous les logs s'affichent dans cette fenêtre avec des couleurs
echo 🔍 Le système de debug surveille automatiquement :
echo    - Erreurs et avertissements
echo    - Événements musicaux
echo    - Connexions Discord/Spotify
echo    - Performances du bot
echo.
echo 🛑 Appuyez sur Ctrl+C pour arrêter
echo ==============================================

REM Démarrer le bot avec le debug intégré
node src/index.js

echo.
echo 👋 Bot arrêté
pause


