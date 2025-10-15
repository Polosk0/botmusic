@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 Déploiement du Bot sur VPS Linux
echo ====================================
echo.

if "%~1"=="" (
    echo ❌ Usage: deploy-to-vps.bat ^<user@host^> ^<destination-path^>
    echo.
    echo Exemples:
    echo   deploy-to-vps.bat root@192.168.1.100 ~/botmusic
    echo   deploy-to-vps.bat user@vps.example.com /opt/botmusic
    echo.
    exit /b 1
)

if "%~2"=="" (
    echo ❌ Usage: deploy-to-vps.bat ^<user@host^> ^<destination-path^>
    echo.
    exit /b 1
)

set VPS_HOST=%~1
set VPS_PATH=%~2

echo 📋 Configuration:
echo   Host: %VPS_HOST%
echo   Path: %VPS_PATH%
echo.

set /p CONFIRM="Continuer le déploiement ? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Déploiement annulé
    exit /b 0
)

echo.
echo 📦 Vérification de PowerShell...

where powershell >nul 2>nul
if errorlevel 1 (
    echo ❌ PowerShell n'est pas disponible
    exit /b 1
)

echo ✅ PowerShell trouvé
echo.
echo 🚀 Lancement du déploiement via PowerShell...
echo.

powershell -ExecutionPolicy Bypass -File "deploy-to-vps.ps1" -VpsHost "%VPS_HOST%" -VpsPath "%VPS_PATH%"

if errorlevel 1 (
    echo.
    echo ❌ Erreur lors du déploiement
    pause
    exit /b 1
)

echo.
echo ✅ Déploiement terminé avec succès !
echo.
pause

