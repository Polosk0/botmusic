# ⚡ Déploiement Git - Guide Rapide

## 🚀 Configuration en 5 minutes

### 1️⃣ Initialiser Git (Sur votre PC)

**Double-cliquez sur :**
```
init-git.bat
```

Ou en PowerShell :
```powershell
.\init-git.ps1
```

---

### 2️⃣ Créer un dépôt GitHub

1. Allez sur https://github.com/new
2. Nom : `botmusic` (ou autre)
3. **Privé ou Public** selon votre choix
4. **NE PAS** cocher README, .gitignore ou LICENSE
5. Cliquez sur **Create repository**

---

### 3️⃣ Pousser le code sur GitHub

```bash
# Remplacez VOTRE-USERNAME par votre nom d'utilisateur GitHub
git remote add origin https://github.com/VOTRE-USERNAME/botmusic.git
git push -u origin main
```

**Note :** Si demandé, entrez vos identifiants GitHub ou utilisez un token personnel

---

### 4️⃣ Cloner sur le VPS

```bash
# Se connecter au VPS
ssh user@vps-ip

# Cloner le dépôt
git clone https://github.com/VOTRE-USERNAME/botmusic.git
cd botmusic

# Installer
chmod +x install-vps.sh
./install-vps.sh

# Configurer le .env
nano .env
# Ajouter : DISCORD_TOKEN, CLIENT_ID, etc.

# Démarrer
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🔄 Mises à jour futures

### Sur votre PC (après modifications)

```bash
git add .
git commit -m "Description des changements"
git push origin main
```

### Sur le VPS

```bash
ssh user@vps-ip
cd ~/botmusic
pm2 stop botmusic
git pull origin main
pnpm install  # Si nouvelles dépendances
pm2 restart botmusic
```

---

## 🎯 Script de mise à jour rapide sur VPS

Créez ce script sur le VPS :

```bash
nano ~/botmusic/update.sh
```

Contenu :
```bash
#!/bin/bash
cd ~/botmusic
pm2 stop botmusic
git pull origin main
pnpm install
pm2 restart botmusic
pm2 logs botmusic --lines 20
```

Rendez-le exécutable :
```bash
chmod +x ~/botmusic/update.sh
```

**Mise à jour en une commande :**
```bash
ssh user@vps-ip "~/botmusic/update.sh"
```

---

## 🔐 Token GitHub Personnel (Si nécessaire)

Si GitHub demande un token au lieu du mot de passe :

1. Allez sur https://github.com/settings/tokens
2. **Generate new token** (classic)
3. Cochez **repo** (accès complet)
4. Générez et copiez le token
5. Utilisez-le comme mot de passe lors du push

---

## ✅ Checklist

- [ ] Git installé sur votre PC
- [ ] Dépôt initialisé avec `init-git.bat`
- [ ] Dépôt GitHub créé
- [ ] Code poussé sur GitHub
- [ ] `.env` NON inclus dans Git (vérifié avec `git status`)
- [ ] Dépôt cloné sur le VPS
- [ ] Bot configuré et démarré sur le VPS

---

## 🆘 Problèmes courants

### "Permission denied (publickey)"

Utilisez HTTPS au lieu de SSH :
```bash
git remote set-url origin https://github.com/USERNAME/botmusic.git
```

### "Git not found" sur le VPS

```bash
sudo apt-get update
sudo apt-get install git
```

### Fichier `.env` dans Git

Si accidentellement ajouté :
```bash
git rm --cached .env
git commit -m "Remove .env"
git push
```

---

**🎵 C'est tout ! Votre bot est maintenant versionné avec Git ! 🚀**

