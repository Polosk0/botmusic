# 📤 Pousser sur GitHub - Instructions

## 🎯 Étapes Rapides

### 1️⃣ Vérifier Git

```bash
# Vérifier l'état
git status

# Tout devrait être prêt (staged)
```

### 2️⃣ Créer un Dépôt GitHub

1. Allez sur : https://github.com/new
2. **Nom du dépôt :** `botmusic` (ou autre nom)
3. **Visibilité :** 
   - **Privé** (recommandé) - Seul vous y avez accès
   - **Public** - Visible par tous
4. **NE PAS cocher :**
   - ❌ Add README
   - ❌ Add .gitignore
   - ❌ Choose a license
5. Cliquez sur **"Create repository"**

### 3️⃣ Connecter et Pousser

GitHub vous donnera des commandes. Utilisez celles-ci :

```bash
# Si Git n'est pas initialisé (peu probable à ce stade)
git init
git add .
git commit -m "Setup complet - Bot Discord Musical avec déploiement VPS"

# Ajouter le remote GitHub
git remote add origin https://github.com/VOTRE-USERNAME/botmusic.git

# Renommer la branche en main (si nécessaire)
git branch -M main

# Pousser !
git push -u origin main
```

**Remplacez `VOTRE-USERNAME` par votre nom d'utilisateur GitHub !**

---

## 🔐 Authentification GitHub

### Option 1 : Token Personnel (Recommandé)

Si GitHub demande un mot de passe :

1. Allez sur : https://github.com/settings/tokens
2. Cliquez sur **"Generate new token"** → **"Generate new token (classic)"**
3. **Note :** `botmusic-deploy`
4. **Expiration :** 90 jours (ou No expiration)
5. Cochez : **`repo`** (accès complet aux dépôts)
6. Cliquez sur **"Generate token"**
7. **COPIEZ le token** (vous ne le verrez qu'une fois !)
8. Utilisez ce token comme **mot de passe** lors du push

### Option 2 : SSH Key

```bash
# Générer une clé SSH (si pas déjà fait)
ssh-keygen -t ed25519 -C "votre.email@example.com"

# Afficher la clé publique
type $env:USERPROFILE\.ssh\id_ed25519.pub

# Copiez cette clé et ajoutez-la sur GitHub :
# https://github.com/settings/keys
# Cliquez sur "New SSH key"

# Puis utilisez l'URL SSH pour le remote :
git remote set-url origin git@github.com:VOTRE-USERNAME/botmusic.git
git push -u origin main
```

---

## ✅ Vérification

Après le push, vous devriez voir sur GitHub :
- ✅ Tous vos fichiers (sauf `.env`, `node_modules`, `logs`)
- ✅ Documentation visible
- ✅ Scripts présents

---

## 🚀 Maintenant : Déployer sur VPS

Une fois poussé sur GitHub :

```bash
# Se connecter au VPS
ssh user@votre-vps-ip

# Cloner le dépôt
git clone https://github.com/VOTRE-USERNAME/botmusic.git
cd botmusic

# Installation automatique
chmod +x install-vps.sh fix-ytdlp.sh logs-vps.sh quick-commands.sh update-vps.sh
./install-vps.sh

# Configurer
nano .env

# Démarrer
pm2 start ecosystem.config.js
pm2 save
pm2 startup
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

```bash
./update-vps.sh
```

---

## 🆘 Problèmes Courants

### "Permission denied (publickey)"

Utilisez HTTPS au lieu de SSH :
```bash
git remote set-url origin https://github.com/VOTRE-USERNAME/botmusic.git
git push -u origin main
```

### "Repository not found"

Vérifiez :
1. Le nom du dépôt est correct
2. L'URL est correcte
3. Vous êtes connecté au bon compte GitHub

```bash
# Voir les remotes
git remote -v

# Corriger l'URL si nécessaire
git remote set-url origin https://github.com/CORRECT-USERNAME/botmusic.git
```

### "Failed to push some refs"

```bash
# Forcer le push (première fois seulement)
git push -u origin main --force
```

### "Support for password authentication was removed"

Vous devez utiliser un **token personnel** au lieu du mot de passe.  
Voir "Option 1 : Token Personnel" ci-dessus.

---

## 📝 Note Importante

**Le fichier `.env` ne sera PAS poussé sur GitHub** (c'est normal et sécurisé).  

Vérifiez :
```bash
git status
# .env ne doit PAS apparaître
```

Si `.env` apparaît :
```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
```

---

## 🎉 C'est Fait !

Une fois poussé sur GitHub :
1. ✅ Votre code est sauvegardé
2. ✅ Vous pouvez cloner sur le VPS
3. ✅ Vous pouvez partager (si public)
4. ✅ Vous avez un historique Git

**Passez maintenant au déploiement VPS !** 🚀

Voir : `DEPLOY_NOW.md` ou `START_HERE.md`

