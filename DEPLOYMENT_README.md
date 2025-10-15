# 🚀 Guide de Déploiement Complet - Bot Discord Musical

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Déploiement Rapide](#déploiement-rapide)
3. [Scripts Disponibles](#scripts-disponibles)
4. [Documentation](#documentation)
5. [FAQ](#faq)

---

## 🎯 Vue d'ensemble

Vous avez **3 options** pour déployer votre bot sur un VPS Linux :

| Méthode | Difficulté | Temps | Recommandation |
|---------|-----------|-------|----------------|
| **Git Clone** | ⭐ Facile | 5 min | ✅ Recommandée |
| **Rsync/SCP** | ⭐⭐ Moyenne | 3 min | Pour mises à jour manuelles |
| **Git Remote** | ⭐⭐⭐ Avancée | 10 min | Déploiement automatique |

---

## ⚡ Déploiement Rapide

### Option 1 : Via Git (Recommandé) 🌟

#### Sur votre PC

1. **Initialiser Git :**
   ```
   Double-clic → init-git.bat
   ```

2. **Créer un dépôt GitHub :**
   - https://github.com/new
   - Nom : `botmusic`
   - Créer le dépôt

3. **Pousser le code :**
   ```bash
   git remote add origin https://github.com/VOTRE-USERNAME/botmusic.git
   git push -u origin main
   ```

#### Sur le VPS

```bash
# Cloner
git clone https://github.com/VOTRE-USERNAME/botmusic.git
cd botmusic

# Installer
chmod +x install-vps.sh
./install-vps.sh

# Configurer
nano .env  # Ajouter vos tokens

# Démarrer
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Mises à jour futures :**
```bash
# PC
git add . && git commit -m "Update" && git push

# VPS
./update-vps.sh
```

---

### Option 2 : Via Rsync (Transfert Direct)

#### Sur votre PC Windows

```cmd
deploy-to-vps.bat user@vps-ip ~/botmusic
```

#### Ou PowerShell

```powershell
.\deploy-to-vps.ps1 -VpsHost "user@vps-ip" -VpsPath "~/botmusic"
```

Le script fait tout automatiquement :
- ✅ Transfert des fichiers
- ✅ Installation des dépendances
- ✅ Configuration de PM2

---

## 🛠️ Scripts Disponibles

### Scripts d'Initialisation

| Script | Utilisation | Description |
|--------|-------------|-------------|
| **`init-git.bat`** | Double-clic | Initialise Git sur Windows |
| **`init-git.ps1`** | PowerShell | Version PowerShell |
| **`deploy-assistant.bat`** | Double-clic | Assistant interactif |

### Scripts de Déploiement

| Script | Utilisation | Méthode |
|--------|-------------|---------|
| **`deploy-to-vps.bat`** | `deploy-to-vps.bat user@ip ~/path` | Rsync (Windows) |
| **`deploy-to-vps.ps1`** | `.\deploy-to-vps.ps1 -VpsHost user@ip -VpsPath ~/path` | Rsync (PowerShell) |
| **`deploy-to-vps.sh`** | `./deploy-to-vps.sh user@ip ~/path` | Rsync (Linux/WSL) |
| **`deploy-git.sh`** | `./deploy-git.sh remote-name` | Git remote SSH |

### Scripts VPS

| Script | Utilisation | Description |
|--------|-------------|-------------|
| **`install-vps.sh`** | Sur VPS | Installation complète automatique |
| **`update-vps.sh`** | Sur VPS | Mise à jour depuis Git |
| **`start.sh`** | Sur VPS | Démarrage manuel |
| **`debug.sh`** | Sur VPS | Debug et monitoring |

---

## 📚 Documentation

### Pour Commencer

| Document | Quand l'utiliser |
|----------|------------------|
| **`START_HERE.md`** | ⭐ Commencer ici - Vue d'ensemble |
| **`DEPLOY_GIT_QUICK.md`** | Guide Git rapide (5 min) |
| **`QUICK_START_VPS.md`** | Référence VPS (1 page) |

### Guides Détaillés

| Document | Contenu |
|----------|---------|
| **`DEPLOY_GUIDE_FR.md`** | Guide complet en français |
| **`GIT_DEPLOY.md`** | Toutes les méthodes Git |
| **`VPS_SETUP.md`** | Installation VPS détaillée |
| **`DEBUG_README.md`** | Dépannage et logs |

### Résumés Rapides

| Document | Usage |
|----------|-------|
| **`README_GIT.md`** | Résumé Git |
| **`README_DEPLOY.md`** | Résumé déploiement |
| **`DEPLOYMENT_README.md`** | Ce fichier |

---

## 🎮 Utilisation de PM2 sur le VPS

```bash
# Démarrer
pm2 start ecosystem.config.js

# Arrêter
pm2 stop botmusic

# Redémarrer
pm2 restart botmusic

# Logs en temps réel
pm2 logs botmusic

# Monitoring
pm2 monit

# Sauvegarder la config
pm2 save

# Démarrage automatique au boot
pm2 startup
```

---

## 🔧 Configuration Minimale (.env)

```env
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_ID=votre_spotify_id
SPOTIFY_CLIENT_SECRET=votre_spotify_secret
```

---

## 📁 Structure des Fichiers

```
botmusic/
├── 🚀 Scripts d'initialisation
│   ├── init-git.bat              # Initialiser Git (Windows)
│   ├── init-git.ps1              # Initialiser Git (PowerShell)
│   └── deploy-assistant.bat      # Assistant interactif
│
├── 📤 Scripts de déploiement
│   ├── deploy-to-vps.bat         # Déployer via rsync (Windows)
│   ├── deploy-to-vps.ps1         # Déployer via rsync (PowerShell)
│   ├── deploy-to-vps.sh          # Déployer via rsync (Linux/WSL)
│   └── deploy-git.sh             # Déployer via Git remote
│
├── 🔧 Scripts VPS
│   ├── install-vps.sh            # Installation automatique
│   ├── update-vps.sh             # Mise à jour automatique
│   ├── start.sh                  # Démarrage manuel
│   └── debug.sh                  # Debug et monitoring
│
├── ⚙️ Configuration
│   ├── ecosystem.config.js       # Configuration PM2
│   ├── .gitignore                # Fichiers Git ignorés
│   ├── .gitattributes            # Gestion fins de ligne
│   └── env.example               # Template .env
│
├── 📚 Documentation
│   ├── START_HERE.md             # ⭐ Commencer ici
│   ├── DEPLOY_GIT_QUICK.md       # Guide Git rapide
│   ├── QUICK_START_VPS.md        # Démarrage VPS rapide
│   ├── DEPLOY_GUIDE_FR.md        # Guide complet
│   ├── GIT_DEPLOY.md             # Méthodes Git avancées
│   ├── VPS_SETUP.md              # Setup VPS détaillé
│   ├── DEBUG_README.md           # Dépannage
│   └── DEPLOYMENT_README.md      # Ce fichier
│
└── src/                          # Code source du bot
```

---

## ❓ FAQ

### Q: Quelle méthode de déploiement choisir ?

**R:** Pour débuter, utilisez **Git Clone** (Option 1). C'est le plus simple et le plus standard.

### Q: Où placer le bot sur le VPS ?

**R:** Utilisez `/home/votre-utilisateur/botmusic/` (recommandé) ou `/opt/botmusic/`

### Q: Comment mettre à jour le bot ?

**R:** 
- **PC :** `git add . && git commit -m "Update" && git push`
- **VPS :** `./update-vps.sh`

### Q: Le fichier .env est-il sauvegardé dans Git ?

**R:** Non, il est automatiquement ignoré par `.gitignore` pour la sécurité.

### Q: Comment voir les logs ?

**R:** `pm2 logs botmusic` ou `pm2 monit`

### Q: Le bot ne démarre pas sur le VPS ?

**R:** 
1. Vérifiez les logs : `pm2 logs botmusic --err`
2. Testez manuellement : `node src/index.js`
3. Vérifiez `.env` : `cat .env`
4. Consultez `DEBUG_README.md`

### Q: Comment sécuriser mon VPS ?

**R:**
```bash
chmod 600 .env
sudo ufw allow ssh
sudo ufw enable
```

### Q: Puis-je utiliser npm au lieu de pnpm ?

**R:** Oui, les scripts détectent automatiquement npm si pnpm n'est pas installé.

---

## ✅ Checklist de Déploiement

### Préparation (PC)

- [ ] Git installé et configuré
- [ ] Git initialisé (`init-git.bat`)
- [ ] Dépôt GitHub créé
- [ ] Code poussé sur GitHub
- [ ] `.env` NON inclus dans Git (vérifier avec `git status`)

### VPS

- [ ] Dépôt cloné
- [ ] `install-vps.sh` exécuté avec succès
- [ ] Node.js 16+ installé
- [ ] PM2 installé
- [ ] FFmpeg installé
- [ ] `.env` créé et configuré
- [ ] Bot démarré : `pm2 start ecosystem.config.js`
- [ ] Configuration sauvegardée : `pm2 save`
- [ ] Démarrage auto configuré : `pm2 startup`
- [ ] Logs sans erreur : `pm2 logs botmusic`

---

## 🎯 Commandes Essentielles

### Sur votre PC

```bash
# Initialiser Git
init-git.bat

# Pousser les changements
git add .
git commit -m "Description"
git push origin main

# Déployer via rsync (si pas Git)
deploy-to-vps.bat user@vps-ip ~/botmusic
```

### Sur le VPS

```bash
# Première installation
git clone https://github.com/USERNAME/botmusic.git
cd botmusic
./install-vps.sh
nano .env
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Mises à jour
./update-vps.sh

# Monitoring
pm2 logs botmusic
pm2 monit
./debug.sh stats
```

---

## 🔐 Sécurité

### Fichiers à NE JAMAIS commit

- ❌ `.env`
- ❌ `config/config.json`
- ❌ `logs/`
- ❌ `node_modules/`
- ❌ `temp/`

Ces fichiers sont déjà dans `.gitignore` ✅

### SSH Key (Recommandé)

```bash
# Sur PC
ssh-keygen -t ed25519
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh user@vps "cat >> ~/.ssh/authorized_keys"

# Tester
ssh user@vps
```

---

## 🆘 Support

En cas de problème :

1. **Vérifiez les logs** : `pm2 logs botmusic`
2. **Consultez** `DEBUG_README.md`
3. **Testez manuellement** : `node src/index.js`
4. **Vérifiez la config** : `cat .env`
5. **Consultez** les guides dans la documentation

---

## 🎉 Prêt à Déployer !

**Commencez par :**
1. Lire `START_HERE.md`
2. Suivre `DEPLOY_GIT_QUICK.md`
3. Déployer en 5 minutes ! 🚀

---

**🎵 Bon déploiement ! Votre bot sera opérationnel très rapidement ! 🚀**

