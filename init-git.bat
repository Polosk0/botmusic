@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🔧 Initialisation du dépôt Git
echo ================================
echo.

where git >nul 2>nul
if errorlevel 1 (
    echo ❌ Git n'est pas installé
    echo.
    echo Téléchargez Git depuis : https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git détecté : 
git --version
echo.

if exist .git (
    echo ⚠️  Dépôt Git déjà initialisé
    echo.
    git remote -v
    pause
    exit /b 0
)

echo 📋 Configuration Git...
echo.

set /p USERNAME="Votre nom (pour les commits) : "
set /p EMAIL="Votre email : "

git config --global user.name "%USERNAME%"
git config --global user.email "%EMAIL%"

echo.
echo ✅ Configuration Git globale définie
echo.

echo 🎯 Initialisation du dépôt...
git init
git branch -M main

echo.
echo 📦 Ajout des fichiers...
git add .

echo.
echo 💾 Premier commit...
git commit -m "Initial commit - Bot Discord Musical"

echo.
echo ✅ Dépôt Git initialisé avec succès !
echo.
echo 📝 Prochaines étapes :
echo.
echo 1. Créez un dépôt sur GitHub/GitLab :
echo    - Allez sur https://github.com/new
echo    - Créez un nouveau dépôt (exemple: botmusic)
echo    - NE PAS ajouter README/LICENSE/.gitignore
echo.
echo 2. Ajoutez le remote et poussez :
echo    git remote add origin https://github.com/VOTRE-USERNAME/botmusic.git
echo    git push -u origin main
echo.
echo 3. Ensuite sur le VPS :
echo    git clone https://github.com/VOTRE-USERNAME/botmusic.git
echo.

pause

