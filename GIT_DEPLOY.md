# 🔄 Déploiement via Git

## 🎯 Méthodes de Déploiement

### Méthode 1 : Git Clone Direct (Recommandée)
✅ Plus simple
✅ Pas de configuration complexe
✅ Idéale pour débuter

### Méthode 2 : Git Remote SSH
✅ Déploiement automatique
✅ Gestion des versions
⚠️ Configuration initiale requise

---

## 🚀 Méthode 1 : Git Clone Direct

### 1️⃣ Créer un dépôt sur GitHub/GitLab/Bitbucket

```bash
# Sur votre PC (PowerShell ou CMD)
cd C:\Users\Polosko\Desktop\botmusic

# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Bot Discord Musical"

# Créer un repo sur GitHub, puis :
git remote add origin https://github.com/votre-username/botmusic.git
git branch -M main
git push -u origin main
```

### 2️⃣ Sur le VPS

```bash
# Se connecter au VPS
ssh user@vps-ip

# Cloner le dépôt
cd ~
git clone https://github.com/votre-username/botmusic.git
cd botmusic

# Installer
chmod +x install-vps.sh
./install-vps.sh

# Configurer
nano .env

# Démarrer
pm2 start ecosystem.config.js
pm2 save
```

### 3️⃣ Mises à jour futures

**Sur votre PC :**
```bash
git add .
git commit -m "Mise à jour"
git push origin main
```

**Sur le VPS :**
```bash
cd ~/botmusic
pm2 stop botmusic
git pull origin main
pnpm install  # Si nouvelles dépendances
pm2 restart botmusic
```

---

## 🔧 Méthode 2 : Git Remote SSH (Avancé)

### Configuration Initiale sur le VPS

```bash
# 1. Créer un dépôt bare
ssh user@vps-ip
mkdir -p ~/git/botmusic.git
cd ~/git/botmusic.git
git init --bare

# 2. Créer un hook post-receive
cat > hooks/post-receive << 'EOF'
#!/bin/bash

GIT_DIR=/home/user/git/botmusic.git
WORK_TREE=/home/user/botmusic

echo "🚀 Déploiement automatique..."

git --work-tree=$WORK_TREE --git-dir=$GIT_DIR checkout -f main

cd $WORK_TREE

echo "📦 Installation des dépendances..."
pnpm install

echo "🔄 Redémarrage du bot..."
pm2 restart botmusic || pm2 start ecosystem.config.js

echo "✅ Déploiement terminé !"
EOF

# 3. Rendre le hook exécutable
chmod +x hooks/post-receive

# 4. Créer le dossier de travail
mkdir -p ~/botmusic
```

### Sur votre PC

```bash
# Ajouter le remote VPS
git remote add vps ssh://user@vps-ip/home/user/git/botmusic.git

# Premier déploiement
git push vps main

# Déploiements futurs
git add .
git commit -m "Update"
git push vps main
```

### Script de Déploiement Rapide

```bash
# Rendre le script exécutable
chmod +x deploy-git.sh

# Déployer
./deploy-git.sh vps
```

---

## 📋 Configuration Git Initiale

### Sur votre PC Windows

```bash
# Ouvrir PowerShell/CMD
cd C:\Users\Polosko\Desktop\botmusic

# Configurer Git (si pas déjà fait)
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"

# Initialiser le dépôt
git init

# Ajouter les fichiers
git add .

# Premier commit
git commit -m "Initial commit"
```

### Ignorer les fichiers sensibles

Le fichier `.gitignore` est déjà configuré pour ignorer :
- ❌ `.env` (tokens secrets)
- ❌ `node_modules/` (dépendances)
- ❌ `logs/` (logs du bot)
- ❌ `temp/` (fichiers temporaires)
- ❌ `*.mp3` (fichiers audio)

---

## 🔐 Sécurité

### Configurer SSH Key (Recommandé)

```bash
# Sur votre PC (PowerShell)
ssh-keygen -t ed25519 -C "votre.email@example.com"

# Copier la clé publique sur le VPS
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh user@vps-ip "cat >> ~/.ssh/authorized_keys"

# Tester
ssh user@vps-ip
```

### Variables d'environnement

**⚠️ IMPORTANT : Ne JAMAIS commit le fichier .env**

Le `.gitignore` est configuré pour ignorer `.env`, mais vérifiez :

```bash
git status
# .env ne doit PAS apparaître
```

Sur le VPS, créez manuellement le fichier `.env` :

```bash
cd ~/botmusic
nano .env
# Coller vos tokens
```

---

## 🎮 Workflows Recommandés

### Workflow Simple (GitHub/GitLab)

```bash
# Sur PC : Développer et pousser
git add .
git commit -m "Nouvelle fonctionnalité"
git push origin main

# Sur VPS : Mettre à jour
cd ~/botmusic
pm2 stop botmusic
git pull origin main
pnpm install
pm2 restart botmusic
```

### Workflow Automatisé (Git Remote)

```bash
# Sur PC : Une seule commande
./deploy-git.sh vps

# Le VPS se met à jour automatiquement via le hook
```

---

## 🔄 Script de Mise à Jour Automatique sur VPS

Créez ce script sur le VPS pour simplifier les mises à jour :

```bash
# Sur le VPS
nano ~/botmusic/update.sh
```

Contenu :

```bash
#!/bin/bash

echo "🔄 Mise à jour du bot..."

cd ~/botmusic

pm2 stop botmusic

echo "📥 Pull des derniers changements..."
git pull origin main

echo "📦 Installation des dépendances..."
pnpm install

echo "🚀 Redémarrage du bot..."
pm2 restart botmusic

echo "✅ Mise à jour terminée !"
pm2 logs botmusic --lines 20
```

Rendre exécutable :

```bash
chmod +x ~/botmusic/update.sh
```

Utilisation :

```bash
ssh user@vps-ip "cd ~/botmusic && ./update.sh"
```

---

## 📊 Comparaison des Méthodes

| Critère | Git Clone Direct | Git Remote SSH |
|---------|------------------|----------------|
| **Simplicité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Rapidité** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Automatisation** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Configuration** | Facile | Moyenne |
| **Recommandé pour** | Débutants | Utilisateurs avancés |

---

## 🆘 Dépannage

### Erreur : "Permission denied (publickey)"

```bash
# Vérifier la clé SSH
ssh -v user@vps-ip

# Reconfigurer la clé
ssh-copy-id user@vps-ip
```

### Erreur : "Git not found"

```bash
# Installer Git sur le VPS
sudo apt-get update
sudo apt-get install git
```

### Conflits Git

```bash
# Sur le VPS
cd ~/botmusic
git stash  # Sauvegarder les modifications locales
git pull origin main
git stash pop  # Restaurer les modifications
```

---

## ✅ Checklist de Configuration Git

- [ ] Git installé localement
- [ ] Git installé sur le VPS
- [ ] Dépôt initialisé
- [ ] `.gitignore` configuré
- [ ] `.env` NON inclus dans Git
- [ ] Remote configuré (GitHub ou VPS)
- [ ] SSH Key configurée (optionnel mais recommandé)
- [ ] Premier commit effectué
- [ ] Premier push réussi
- [ ] Clone sur VPS réussi

---

## 📚 Commandes Git Utiles

```bash
# Voir l'état
git status

# Voir l'historique
git log --oneline

# Voir les remotes
git remote -v

# Annuler des changements
git checkout -- fichier.js

# Créer une branche
git checkout -b nouvelle-fonctionnalite

# Fusionner une branche
git checkout main
git merge nouvelle-fonctionnalite

# Tag une version
git tag -a v1.0 -m "Version 1.0"
git push origin v1.0
```

---

## 🎯 Recommandation Finale

**Pour débuter : Utilisez la Méthode 1 (Git Clone Direct)**

1. Créez un dépôt sur GitHub (public ou privé)
2. Pushez votre code
3. Clonez sur le VPS
4. Mettez à jour avec `git pull`

Simple, efficace, et vous pourrez toujours passer à la Méthode 2 plus tard !

---

**🚀 Prêt à déployer avec Git ! 🎵**

