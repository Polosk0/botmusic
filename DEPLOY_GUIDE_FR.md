# 🚀 Guide de Déploiement Rapide sur VPS

## 📍 Où placer le bot sur le VPS ?

### Option 1 : Dossier utilisateur (Recommandé)
```bash
/home/votre-utilisateur/botmusic/
```
✅ Facile à gérer
✅ Pas besoin de sudo pour les modifications
✅ Idéal pour un seul utilisateur

### Option 2 : Dossier système
```bash
/opt/botmusic/
```
✅ Standard pour les applications
✅ Visible par tous les utilisateurs
⚠️ Nécessite sudo pour certaines opérations

## 🎯 Méthode Rapide (Recommandée)

### Depuis Windows

```powershell
# Ouvrir PowerShell dans le dossier du bot
cd C:\Users\Polosko\Desktop\botmusic

# Déployer sur le VPS
.\deploy-to-vps.ps1 -VpsHost "votre-user@votre-vps-ip" -VpsPath "~/botmusic"

# Exemple concret :
.\deploy-to-vps.ps1 -VpsHost "root@192.168.1.100" -VpsPath "/opt/botmusic"
```

### Depuis WSL ou Linux

```bash
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh votre-user@votre-vps-ip ~/botmusic

# Exemple concret :
./deploy-to-vps.sh root@192.168.1.100 /opt/botmusic
```

## 📝 Étapes Détaillées

### 1️⃣ Préparer le VPS

```bash
# Se connecter au VPS
ssh votre-user@votre-vps-ip

# Créer le dossier
mkdir -p ~/botmusic
cd ~/botmusic
```

### 2️⃣ Transférer les fichiers

**Option A : Script automatique (recommandé)**
```bash
# Sur votre PC Windows/Linux
./deploy-to-vps.sh user@vps-ip ~/botmusic
```

**Option B : Manuellement avec rsync**
```bash
rsync -avz --exclude 'node_modules' --exclude 'logs' --exclude 'temp' \
  ./ user@vps-ip:~/botmusic/
```

**Option C : Avec SCP**
```bash
scp -r * user@vps-ip:~/botmusic/
```

**Option D : Avec Git**
```bash
# Sur le VPS
git clone votre-repo botmusic
cd botmusic
```

### 3️⃣ Installer sur le VPS

```bash
# Sur le VPS
cd ~/botmusic
chmod +x install-vps.sh
./install-vps.sh
```

Ce script installe automatiquement :
- ✅ Node.js (si absent)
- ✅ pnpm
- ✅ PM2
- ✅ FFmpeg
- ✅ Dépendances du bot

### 4️⃣ Configurer le bot

```bash
# Éditer le fichier .env
nano .env
```

**Configuration minimale :**
```env
DISCORD_TOKEN=votre_token_discord_ici
CLIENT_ID=votre_client_id_ici
SPOTIFY_CLIENT_ID=votre_spotify_id
SPOTIFY_CLIENT_SECRET=votre_spotify_secret
```

Sauvegarder : `CTRL+X` → `Y` → `ENTER`

### 5️⃣ Démarrer le bot

```bash
# Avec PM2 (recommandé)
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# OU sans PM2
./start.sh
```

## 🔍 Vérification

```bash
# Voir si le bot tourne
pm2 status

# Voir les logs
pm2 logs botmusic

# Monitoring
pm2 monit
```

## 🎮 Commandes PM2 Utiles

```bash
# Démarrer
pm2 start ecosystem.config.js

# Arrêter
pm2 stop botmusic

# Redémarrer
pm2 restart botmusic

# Logs en temps réel
pm2 logs botmusic

# Effacer les logs
pm2 flush

# Supprimer
pm2 delete botmusic

# Sauvegarder
pm2 save

# Démarrage automatique au boot
pm2 startup
```

## 🔄 Mettre à jour le bot

```bash
# 1. Arrêter
pm2 stop botmusic

# 2. Mettre à jour les fichiers
# Option A : Re-déployer depuis votre PC
./deploy-to-vps.sh user@vps-ip ~/botmusic

# Option B : Avec git sur le VPS
git pull

# 3. Réinstaller les dépendances si nécessaire
pnpm install

# 4. Redémarrer
pm2 restart botmusic
```

## 🛠️ Dépannage

### Le bot ne démarre pas

```bash
# Voir les erreurs
pm2 logs botmusic --err

# Tester manuellement
node src/index.js
```

### Vérifier la config

```bash
# Voir le .env
cat .env

# Tester Node.js
node -v  # Doit être 16+

# Tester FFmpeg
ffmpeg -version
```

### Réinstaller

```bash
pm2 delete botmusic
rm -rf node_modules
pnpm install
pm2 start ecosystem.config.js
```

## 📊 Monitoring

```bash
# Statistiques PM2
pm2 status
pm2 info botmusic

# Utilisation système
htop  # ou top

# Logs applicatifs
tail -f logs/bot-*.log

# Debug
./debug.sh monitor
./debug.sh stats
./debug.sh errors
```

## 💾 Sauvegarde

```bash
# Créer une sauvegarde
tar -czf botmusic-backup-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' --exclude='logs' --exclude='temp' .

# Télécharger la sauvegarde
scp user@vps-ip:~/botmusic/botmusic-backup-*.tar.gz ./
```

## 🔐 Sécurité

```bash
# Protéger le .env
chmod 600 .env

# Configurer le firewall
sudo ufw allow ssh
sudo ufw enable
```

## ✅ Checklist de déploiement

- [ ] VPS accessible via SSH
- [ ] Node.js 16+ installé
- [ ] FFmpeg installé
- [ ] Fichier .env configuré
- [ ] Token Discord valide
- [ ] Tokens Spotify configurés
- [ ] PM2 installé et configuré
- [ ] pm2 startup configuré
- [ ] Bot démarre sans erreur
- [ ] Logs accessibles

## 📞 Obtenir de l'aide

Si problème, vérifiez :
1. `pm2 logs botmusic` - Voir les erreurs
2. `cat .env` - Vérifier la config
3. `node -v` - Version Node.js
4. `ffmpeg -version` - FFmpeg installé
5. `pm2 status` - État du processus

---

**🎵 Bon déploiement ! 🚀**

