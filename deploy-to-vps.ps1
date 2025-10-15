# Script PowerShell pour déployer le bot sur VPS Linux depuis Windows

param(
    [Parameter(Mandatory=$true)]
    [string]$VpsHost,
    
    [Parameter(Mandatory=$true)]
    [string]$VpsPath
)

Write-Host "🚀 Déploiement du Bot sur VPS Linux" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Configuration:" -ForegroundColor Blue
Write-Host "  Host: $VpsHost" -ForegroundColor Cyan
Write-Host "  Path: $VpsPath" -ForegroundColor Cyan
Write-Host ""

$confirmation = Read-Host "Continuer le déploiement ? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Déploiement annulé" -ForegroundColor Yellow
    exit
}

if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host "❌ SCP n'est pas disponible. Installez OpenSSH ou utilisez WSL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation OpenSSH:" -ForegroundColor Yellow
    Write-Host "  Settings > Apps > Optional Features > Add a feature > OpenSSH Client" -ForegroundColor Cyan
    exit 1
}

Write-Host "📦 Transfert des fichiers..." -ForegroundColor Blue

$excludes = @(
    "node_modules",
    "logs",
    "temp",
    ".env",
    "*.log",
    ".git",
    "*.backup",
    "*.tar.gz"
)

$tempFile = [System.IO.Path]::GetTempFileName()
Get-ChildItem -Recurse -File | 
    Where-Object { 
        $path = $_.FullName
        -not ($excludes | Where-Object { $path -like "*$_*" })
    } | 
    ForEach-Object {
        $relativePath = $_.FullName.Replace($PWD.Path + "\", "").Replace("\", "/")
        Write-Host "  Copying: $relativePath" -ForegroundColor Gray
        
        $remoteDir = Split-Path "$VpsPath/$relativePath" -Parent
        ssh "$VpsHost" "mkdir -p '$remoteDir'"
        scp $_.FullName "${VpsHost}:$VpsPath/$relativePath"
    }

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du transfert" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Fichiers transférés" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Configuration du VPS..." -ForegroundColor Blue

ssh "$VpsHost" "cd $VpsPath && chmod +x *.sh && bash install-vps.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Installation terminée avec des avertissements" -ForegroundColor Yellow
} else {
    Write-Host "✅ Installation réussie" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Déploiement terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1. Connectez-vous au VPS: ssh $VpsHost"
Write-Host "  2. Allez dans le dossier: cd $VpsPath"
Write-Host "  3. Configurez .env: nano .env"
Write-Host "  4. Démarrez le bot: pm2 start ecosystem.config.js"
Write-Host "  5. Sauvegardez: pm2 save"
Write-Host ""

