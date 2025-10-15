# 🚀 DÉMARRAGE - Bot Discord Musical sur VPS

## 🎯 Vous êtes ici → VPS Linux

### ⚡ Méthode Rapide (Recommandée)

```
1. Double-clic → init-git.bat
2. Créer repo GitHub
3. git push
4. Sur VPS → git clone
```

---

## 📝 Guide Étape par Étape

### Étape 1 : Initialiser Git sur votre PC

**Double-cliquez sur ce fichier :**
```
init-git.bat
```

Ou en PowerShell :
```powershell
.\init-git.ps1
```

### Étape 2 : Créer un dépôt GitHub

1. Allez sur https://github.com/new
2. Nom du dépôt : `botmusic`
3. Public ou Privé : **À votre choix**
4. **NE RIEN COCHER** (pas de README, .gitignore, etc.)
5. **Create repository**

### Étape 3 : Pousser votre code

```bash
# Remplacez VOTRE-USERNAME par votre nom GitHub
git remote add origin https://github.com/VOTRE-USERNAME/botmusic.git
git push -u origin main
```

### Étape 4 : Déployer sur le VPS

```bash
# Se connecter au VPS
ssh user@votre-vps-ip

# Cloner le dépôt
git clone https://github.com/VOTRE-USERNAME/botmusic.git
cd botmusic

# Installation automatique
chmod +x install-vps.sh
./install-vps.sh

# Configurer les tokens
nano .env
# Ajouter : DISCORD_TOKEN, CLIENT_ID, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET

# Démarrer le bot
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Étape 5 : Vérifier

```bash
pm2 logs botmusic
```

---

## 🔄 Mises à Jour Futures

### Sur votre PC (après modifications)

```bash
git add .
git commit -m "Description des changements"
git push origin main
```

### Sur le VPS

**Méthode 1 - Script automatique :**
```bash
./update-vps.sh
```

**Méthode 2 - Manuelle :**
```bash
pm2 stop botmusic
git pull origin main
pnpm install
pm2 restart botmusic
```

---

## 📚 Documentation Disponible

| Fichier | Description | Quand l'utiliser |
|---------|-------------|------------------|
| **`DEPLOY_GIT_QUICK.md`** | Guide Git rapide | ⭐ Commencer ici |
| **`QUICK_START_VPS.md`** | Démarrage VPS (1 page) | Référence rapide |
| **`DEPLOY_GUIDE_FR.md`** | Guide complet français | Détails complets |
| **`GIT_DEPLOY.md`** | Méthodes Git avancées | Utilisateurs avancés |
| **`VPS_SETUP.md`** | Installation VPS détaillée | Problèmes techniques |
| **`DEBUG_README.md`** | Dépannage | En cas de problème |

---

## 🎮 Commandes PM2 Essentielles

```bash
pm2 start ecosystem.config.js   # Démarrer
pm2 stop botmusic               # Arrêter
pm2 restart botmusic            # Redémarrer
pm2 logs botmusic               # Voir les logs
pm2 monit                       # Monitoring temps réel
pm2 status                      # État des processus
```

---

## ✅ Checklist de Déploiement

- [ ] Git initialisé sur PC (`init-git.bat`)
- [ ] Dépôt GitHub créé
- [ ] Code poussé sur GitHub
- [ ] `.env` NON inclus dans Git
- [ ] Dépôt cloné sur VPS
- [ ] `install-vps.sh` exécuté
- [ ] `.env` configuré sur VPS
- [ ] Bot démarré avec PM2
- [ ] `pm2 save` et `pm2 startup` configurés
- [ ] Logs vérifiés sans erreur

---

## 🆘 Besoin d'Aide ?

### Erreur yt-dlp (Bot ne peut pas jouer de musique)

```bash
# Sur le VPS
./fix-ytdlp.sh
pm2 restart botmusic
```

**Voir `URGENT_FIX.md` pour plus de détails**

### Accéder aux Logs/Debug sur le VPS

```bash
# Menu interactif complet
./logs-vps.sh

# Ou commandes rapides
./quick-commands.sh logs    # Logs en temps réel
./quick-commands.sh errors  # Erreurs uniquement
./quick-commands.sh status  # Statut du bot
```

### Problème sur PC

```bash
# Vérifier Git
git --version

# Vérifier l'état
git status
```

### Problème sur VPS

```bash
# Voir les erreurs
pm2 logs botmusic --err

# Tester manuellement
node src/index.js

# Vérifier l'état système
./quick-commands.sh check
```

---

## 🎯 Où Placer le Bot sur le VPS ?

**Option 1 (Recommandée) :**
```
/home/votre-utilisateur/botmusic/
```

**Option 2 :**
```
/opt/botmusic/
```

---

## 🔐 Sécurité Important

**⚠️ NE JAMAIS commit le fichier `.env` dans Git !**

Le `.gitignore` est configuré pour l'ignorer automatiquement.

Vérifiez avec :
```bash
git status
# .env ne doit PAS apparaître
```

---

## 💡 Astuce

### Mise à jour rapide depuis votre PC

```bash
ssh user@vps-ip "cd ~/botmusic && ./update-vps.sh"
```

Une seule commande pour tout mettre à jour sur le VPS ! 🚀

---

## 📞 Support

Si vous avez un problème :

1. Vérifiez les logs : `pm2 logs botmusic`
2. Consultez `DEBUG_README.md`
3. Vérifiez que `.env` est correct
4. Testez manuellement : `node src/index.js`

---

**🎵 Bon déploiement ! Votre bot sera opérationnel en quelques minutes ! 🚀**

---

## 📋 Résumé des Fichiers Créés

### Scripts Windows
- `init-git.bat` / `init-git.ps1` - Initialiser Git
- `deploy-to-vps.bat` / `.ps1` - Déployer via rsync

### Scripts Linux/VPS
- `install-vps.sh` - Installation automatique
- `update-vps.sh` - Mise à jour automatique
- `deploy-to-vps.sh` - Déploiement rsync
- `deploy-git.sh` - Déploiement Git remote
- `start.sh` - Démarrage manuel

### Configuration
- `ecosystem.config.js` - Configuration PM2
- `.gitignore` - Fichiers ignorés
- `.gitattributes` - Gestion fins de ligne

### Documentation
- `START_HERE.md` - **CE FICHIER** ⭐
- `DEPLOY_GIT_QUICK.md` - Guide Git rapide
- `DEPLOY_GUIDE_FR.md` - Guide complet
- `GIT_DEPLOY.md` - Méthodes Git avancées
- `VPS_SETUP.md` - Setup VPS détaillé
- `QUICK_START_VPS.md` - Référence rapide
- `README_GIT.md` - Résumé Git
- `README_DEPLOY.md` - Résumé déploiement

**Commencez par `DEPLOY_GIT_QUICK.md` ! 🚀**

