@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title Assistant de Déploiement - Bot Discord Musical

:menu
cls
echo ╔══════════════════════════════════════════════════════╗
echo ║   🎵 Assistant de Déploiement Bot Discord Musical   ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo Que voulez-vous faire ?
echo.
echo  [1] 🔧 Initialiser Git (première fois)
echo  [2] 📤 Pousser sur GitHub
echo  [3] 🚀 Déployer sur VPS (via rsync)
echo  [4] 📚 Ouvrir la documentation
echo  [5] ❌ Quitter
echo.
set /p choice="Votre choix (1-5) : "

if "%choice%"=="1" goto init_git
if "%choice%"=="2" goto push_github
if "%choice%"=="3" goto deploy_vps
if "%choice%"=="4" goto docs
if "%choice%"=="5" goto end
goto menu

:init_git
cls
echo ╔══════════════════════════════════════════════════════╗
echo ║              🔧 Initialisation Git                   ║
echo ╚══════════════════════════════════════════════════════╝
echo.

if exist .git (
    echo ✅ Git déjà initialisé !
    echo.
    echo Remotes configurés :
    git remote -v
    echo.
    pause
    goto menu
)

echo Lancement de l'initialisation Git...
echo.
call init-git.bat
pause
goto menu

:push_github
cls
echo ╔══════════════════════════════════════════════════════╗
echo ║            📤 Pousser sur GitHub                     ║
echo ╚══════════════════════════════════════════════════════╝
echo.

if not exist .git (
    echo ❌ Git n'est pas initialisé !
    echo.
    echo Exécutez d'abord l'option 1 : Initialiser Git
    pause
    goto menu
)

echo État actuel :
git status --short
echo.

set /p commit_msg="Message du commit : "
if "%commit_msg%"=="" set commit_msg=Update

git add .
git commit -m "%commit_msg%"

echo.
echo Pushing vers GitHub...
git push origin main

if errorlevel 1 (
    echo.
    echo ⚠️  Si c'est votre premier push, ajoutez le remote :
    echo.
    set /p github_url="URL de votre dépôt GitHub : "
    if not "!github_url!"=="" (
        git remote add origin !github_url!
        git push -u origin main
    )
)

echo.
pause
goto menu

:deploy_vps
cls
echo ╔══════════════════════════════════════════════════════╗
echo ║           🚀 Déploiement sur VPS                     ║
echo ╚══════════════════════════════════════════════════════╝
echo.

set /p vps_host="Hôte VPS (user@ip) : "
if "%vps_host%"=="" (
    echo ❌ Hôte VPS requis
    pause
    goto menu
)

set /p vps_path="Chemin sur VPS : "
if "%vps_path%"=="" set vps_path=~/botmusic

echo.
echo 📋 Configuration :
echo   Hôte : %vps_host%
echo   Chemin : %vps_path%
echo.

set /p confirm="Continuer ? (y/N) : "
if /i not "%confirm%"=="y" goto menu

echo.
echo Déploiement en cours...
call deploy-to-vps.bat "%vps_host%" "%vps_path%"

echo.
pause
goto menu

:docs
cls
echo ╔══════════════════════════════════════════════════════╗
echo ║              📚 Documentation                        ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo Quelle documentation voulez-vous consulter ?
echo.
echo  [1] START_HERE.md - Commencer ici ⭐
echo  [2] DEPLOY_GIT_QUICK.md - Guide Git rapide
echo  [3] QUICK_START_VPS.md - Démarrage VPS rapide
echo  [4] DEPLOY_GUIDE_FR.md - Guide complet
echo  [5] Retour au menu
echo.
set /p doc_choice="Votre choix (1-5) : "

if "%doc_choice%"=="1" start START_HERE.md
if "%doc_choice%"=="2" start DEPLOY_GIT_QUICK.md
if "%doc_choice%"=="3" start QUICK_START_VPS.md
if "%doc_choice%"=="4" start DEPLOY_GUIDE_FR.md
if "%doc_choice%"=="5" goto menu

goto docs

:end
cls
echo.
echo 👋 Au revoir !
echo.
timeout /t 2 /nobreak >nul
exit /b 0

