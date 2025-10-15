# Script PowerShell pour initialiser Git

Write-Host "🔧 Initialisation du dépôt Git" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git n'est pas installé" -ForegroundColor Red
    Write-Host ""
    Write-Host "Téléchargez Git depuis : https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git détecté : $(git --version)" -ForegroundColor Green
Write-Host ""

if (Test-Path .git) {
    Write-Host "⚠️  Dépôt Git déjà initialisé" -ForegroundColor Yellow
    Write-Host ""
    git remote -v
    exit 0
}

Write-Host "📋 Configuration Git..." -ForegroundColor Blue
Write-Host ""

$username = Read-Host "Votre nom (pour les commits)"
$email = Read-Host "Votre email"

git config --global user.name "$username"
git config --global user.email "$email"

Write-Host ""
Write-Host "✅ Configuration Git globale définie" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 Initialisation du dépôt..." -ForegroundColor Blue
git init
git branch -M main

Write-Host ""
Write-Host "📦 Ajout des fichiers..." -ForegroundColor Blue
git add .

Write-Host ""
Write-Host "💾 Premier commit..." -ForegroundColor Blue
git commit -m "Initial commit - Bot Discord Musical"

Write-Host ""
Write-Host "✅ Dépôt Git initialisé avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes :" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Créez un dépôt sur GitHub/GitLab :" -ForegroundColor Yellow
Write-Host "   - Allez sur https://github.com/new"
Write-Host "   - Créez un nouveau dépôt (exemple: botmusic)"
Write-Host "   - NE PAS ajouter README/LICENSE/.gitignore"
Write-Host ""
Write-Host "2. Ajoutez le remote et poussez :" -ForegroundColor Yellow
Write-Host "   git remote add origin https://github.com/VOTRE-USERNAME/botmusic.git" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Ensuite sur le VPS :" -ForegroundColor Yellow
Write-Host "   git clone https://github.com/VOTRE-USERNAME/botmusic.git" -ForegroundColor Cyan
Write-Host ""

