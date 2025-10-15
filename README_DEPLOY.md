# 🚀 Guide de Déploiement VPS - Résumé Rapide

## 🎯 Emplacement Recommandé sur le VPS

```
/home/votre-utilisateur/botmusic/
```
ou
```
/opt/botmusic/
```

## ⚡ Déploiement en 3 commandes

### Sur votre PC Windows (PowerShell)

```powershell
# 1. Déployer sur le VPS
.\deploy-to-vps.ps1 -VpsHost "user@vps-ip" -VpsPath "~/botmusic"
```

### Sur le VPS

```bash
# 2. Configurer
nano .env  # Ajouter DISCORD_TOKEN, CLIENT_ID, etc.

# 3. Démarrer
pm2 start ecosystem.config.js
pm2 save
```

## 📂 Fichiers Créés pour le VPS

### Scripts de Déploiement
- **`deploy-to-vps.ps1`** - Script PowerShell pour Windows
- **`deploy-to-vps.sh`** - Script Bash pour Linux/WSL
- **`install-vps.sh`** - Installation automatique sur le VPS

### Configuration
- **`ecosystem.config.js`** - Configuration PM2
- **`start.sh`** - Script de démarrage (amélioré avec pnpm)
- **`.gitignore`** - Ignoré les fichiers inutiles

### Documentation
- **`VPS_SETUP.md`** - Guide complet détaillé
- **`DEPLOY_GUIDE_FR.md`** - Guide de déploiement en français
- **`README_DEPLOY.md`** - Ce fichier (résumé rapide)

## 🛠️ Prérequis VPS

Le script `install-vps.sh` installe automatiquement :
- Node.js 20+
- pnpm
- PM2
- FFmpeg
- Dépendances du projet

## 🎮 Commandes Essentielles

```bash
# Démarrer
pm2 start ecosystem.config.js

# Voir les logs
pm2 logs botmusic

# Redémarrer
pm2 restart botmusic

# Monitoring
pm2 monit

# Arrêter
pm2 stop botmusic
```

## 📋 Configuration .env Minimale

```env
DISCORD_TOKEN=votre_token
CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_ID=votre_spotify_id
SPOTIFY_CLIENT_SECRET=votre_spotify_secret
```

## 🔍 Vérification Rapide

```bash
# Le bot tourne ?
pm2 status

# Des erreurs ?
pm2 logs botmusic --err

# Stats système
./debug.sh stats
```

## 📚 Documentation Complète

- **Installation détaillée** → `VPS_SETUP.md`
- **Guide de déploiement** → `DEPLOY_GUIDE_FR.md`
- **Dépannage** → `DEBUG_README.md`

## 💡 Conseils

1. **Utilisez PM2** - Gestion automatique des redémarrages
2. **Configurez pm2 startup** - Démarrage automatique au boot
3. **Surveillez les logs** - `pm2 logs botmusic`
4. **Sauvegardez .env** - Avant toute mise à jour

## 🆘 Problème ?

```bash
# Réinstaller
pm2 delete botmusic
rm -rf node_modules
pnpm install
pm2 start ecosystem.config.js

# Logs détaillés
pm2 logs botmusic --lines 100
```

---

**🎵 Bon déploiement ! 🚀**

