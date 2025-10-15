# 🎵 Bot Discord Musical - Déploiement Git

## ⚡ Démarrage Ultra-Rapide

### 1. Initialiser Git (Double-clic)

```
init-git.bat
```

### 2. Créer un dépôt GitHub

https://github.com/new → Créer un dépôt `botmusic`

### 3. Pousser le code

```bash
git remote add origin https://github.com/VOTRE-USERNAME/botmusic.git
git push -u origin main
```

### 4. Sur le VPS

```bash
git clone https://github.com/VOTRE-USERNAME/botmusic.git
cd botmusic
./install-vps.sh
nano .env  # Configurer
pm2 start ecosystem.config.js
pm2 save
```

---

## 🔄 Mettre à jour

### PC → GitHub

```bash
git add .
git commit -m "Update"
git push
```

### VPS → Mise à jour

```bash
./update-vps.sh
```

---

## 📚 Documentation

- **`DEPLOY_GIT_QUICK.md`** - Guide Git complet
- **`GIT_DEPLOY.md`** - Méthodes avancées
- **`DEPLOY_GUIDE_FR.md`** - Guide VPS complet
- **`QUICK_START_VPS.md`** - Démarrage rapide

---

## ✅ Fichiers créés

### Scripts Git
- `init-git.bat` / `init-git.ps1` - Initialisation Git
- `deploy-git.sh` - Déploiement via Git remote
- `update-vps.sh` - Mise à jour sur VPS

### Scripts VPS
- `deploy-to-vps.bat` / `.ps1` / `.sh` - Déploiement rsync
- `install-vps.sh` - Installation sur VPS
- `ecosystem.config.js` - Configuration PM2

### Configuration
- `.gitignore` - Fichiers ignorés
- `.gitattributes` - Gestion fins de ligne

**🚀 Prêt à déployer ! 🎵**

