# 🚀 Guide d'Installation sur VPS Linux

## 📋 Prérequis

- VPS Linux (Ubuntu 20.04+ / Debian 11+ recommandé)
- Accès SSH au VPS
- Au moins 512 MB de RAM (1 GB recommandé)
- 2 GB d'espace disque

## 🔧 Installation Rapide

### 1. Connexion au VPS

```bash
ssh votre-utilisateur@votre-vps-ip
```

### 2. Placement du Bot

**Option A : Utilisateur standard (recommandé)**
```bash
cd ~
mkdir -p botmusic
cd botmusic
```

**Option B : Emplacement système**
```bash
sudo mkdir -p /opt/botmusic
sudo chown $USER:$USER /opt/botmusic
cd /opt/botmusic
```

### 3. Upload des Fichiers

**Depuis votre machine locale :**

```bash
# Via SCP (tous les fichiers)
scp -r * votre-utilisateur@votre-vps-ip:~/botmusic/

# Via rsync (recommandé, plus rapide)
rsync -avz --exclude 'node_modules' --exclude 'logs' --exclude 'temp' \
  ./ votre-utilisateur@votre-vps-ip:~/botmusic/

# Via Git (si vous avez un repo)
# Sur le VPS :
git clone votre-repo-url botmusic
cd botmusic
```

### 4. Installation Automatique

```bash
chmod +x install-vps.sh
./install-vps.sh
```

### 5. Configuration

```bash
nano .env
```

**Configuration minimale requise :**
```env
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_ID=votre_spotify_id
SPOTIFY_CLIENT_SECRET=votre_spotify_secret
```

Sauvegardez avec `CTRL+X`, puis `Y`, puis `ENTRÉE`

## 🎮 Démarrage du Bot

### Avec PM2 (Recommandé pour Production)

```bash
# Démarrer le bot
pm2 start ecosystem.config.js

# Sauvegarder la configuration pour redémarrage auto
pm2 save

# Configurer le démarrage automatique au boot
pm2 startup
# Suivez les instructions affichées (copier/coller la commande)

# Voir les logs en temps réel
pm2 logs botmusic

# Monitoring
pm2 monit

# Redémarrer le bot
pm2 restart botmusic

# Arrêter le bot
pm2 stop botmusic

# Supprimer le bot de PM2
pm2 delete botmusic
```

### Sans PM2 (Développement)

```bash
# Démarrage simple
./start.sh

# Ou en mode développement avec auto-reload
./start.sh dev

# En arrière-plan avec nohup
nohup ./start.sh > output.log 2>&1 &
```

## 📊 Monitoring et Debug

### Voir les logs

```bash
# Logs PM2
pm2 logs botmusic

# Logs applicatifs
tail -f logs/bot-$(date +%Y-%m-%d).log

# Dernières erreurs
grep ERROR logs/bot-$(date +%Y-%m-%d).log | tail -20
```

### Statistiques

```bash
# Avec PM2
pm2 status
pm2 info botmusic

# Utilisation système
./debug.sh stats
```

### Debug

```bash
# Monitoring en temps réel
./debug.sh monitor

# Dernières erreurs
./debug.sh errors

# Nettoyage des logs anciens
./debug.sh cleanup
```

## 🔒 Sécurité

### Pare-feu (UFW)

```bash
# Installer UFW si nécessaire
sudo apt-get install ufw

# Autoriser SSH
sudo ufw allow ssh

# Activer le pare-feu
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

### Permissions

```bash
# Protéger le fichier .env
chmod 600 .env

# Permissions correctes pour les scripts
chmod +x *.sh
```

## 🔄 Mise à Jour du Bot

```bash
# Arrêter le bot
pm2 stop botmusic

# Sauvegarder la config
cp .env .env.backup

# Mettre à jour les fichiers (via git ou rsync)
git pull
# OU
# rsync depuis votre machine locale

# Réinstaller les dépendances si nécessaire
pnpm install

# Redémarrer
pm2 restart botmusic
```

## 🛠️ Commandes Utiles

### Gestion des Processus

```bash
# Voir tous les processus PM2
pm2 list

# Redémarrer tous les processus
pm2 restart all

# Arrêter tous les processus
pm2 stop all

# Supprimer tous les processus
pm2 delete all

# Vider les logs
pm2 flush
```

### Gestion du Système

```bash
# Espace disque
df -h

# Mémoire
free -h

# Processus Node
ps aux | grep node

# Tuer un processus bloqué
pkill -f "node.*index.js"
```

## 📦 Sauvegarde

### Script de Sauvegarde Rapide

```bash
# Créer une sauvegarde
tar -czf botmusic-backup-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='logs' \
  --exclude='temp' \
  .

# Télécharger la sauvegarde
scp votre-utilisateur@votre-vps-ip:~/botmusic/botmusic-backup-*.tar.gz ./
```

## 🆘 Dépannage

### Le bot ne démarre pas

```bash
# Vérifier les logs
pm2 logs botmusic --lines 100

# Vérifier la configuration
cat .env | grep -v "^#"

# Tester manuellement
node src/index.js
```

### Problèmes de mémoire

```bash
# Augmenter la limite mémoire dans ecosystem.config.js
# max_memory_restart: '1G' → '2G'

pm2 restart botmusic
```

### FFmpeg manquant

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

### Problèmes de permissions

```bash
# Réparer les permissions
chmod -R u+rwX .
chmod +x *.sh
```

## 📞 Support

En cas de problème, vérifiez :
1. Les logs : `pm2 logs botmusic`
2. Le fichier .env : configuration correcte
3. Les dépendances : `pnpm install`
4. La version Node.js : `node -v` (16+)
5. FFmpeg installé : `ffmpeg -version`

---

**Note:** Ce bot nécessite une connexion internet stable et FFmpeg installé pour fonctionner correctement.

