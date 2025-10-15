# 🚀 DÉPLOYER MAINTENANT - 3 Étapes

## ⚡ Méthode la Plus Rapide

### 📍 Étape 1 : Sur Votre PC (2 minutes)

```
1. Double-cliquez → deploy-assistant.bat
2. Choisissez : [1] Initialiser Git
3. Choisissez : [2] Pousser sur GitHub
   (Créez le dépôt sur github.com/new d'abord)
```

**OU en ligne de commande :**

```bash
# Lancer l'assistant
init-git.bat

# Puis pousser
git remote add origin https://github.com/VOTRE-USERNAME/botmusic.git
git push -u origin main
```

---

### 📍 Étape 2 : Sur le VPS (2 minutes)

```bash
# Se connecter
ssh user@votre-vps-ip

# Cloner et installer (TOUT AUTOMATIQUE)
git clone https://github.com/VOTRE-USERNAME/botmusic.git
cd botmusic
chmod +x install-vps.sh && ./install-vps.sh
```

---

### 📍 Étape 3 : Configurer et Démarrer (1 minute)

```bash
# Configurer les tokens
nano .env
```

**Ajoutez ces 4 lignes** :
```
DISCORD_TOKEN=votre_token
CLIENT_ID=votre_id
SPOTIFY_CLIENT_ID=votre_spotify_id
SPOTIFY_CLIENT_SECRET=votre_spotify_secret
```

Sauvegardez : `CTRL+X` → `Y` → `ENTER`

```bash
# Démarrer le bot
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## ✅ Vérification

```bash
# Voir les logs
pm2 logs botmusic

# Si tout est OK, vous verrez :
# ✅ Bot connecté
# ✅ Prêt à jouer de la musique
```

---

## 🔄 Mises à Jour (30 secondes)

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

## 🎯 C'est Tout !

Votre bot tourne maintenant 24/7 sur votre VPS ! 🎉

---

## 📞 Besoin d'aide ?

- **Logs** : `pm2 logs botmusic`
- **Status** : `pm2 status`
- **Guide complet** : `START_HERE.md`

---

**Total : 5 minutes chrono ! ⏱️**

