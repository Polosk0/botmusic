# ⚡ Démarrage Rapide VPS - Une Page

## 🎯 Déploiement Complet en 5 Minutes

### 1️⃣ Depuis votre PC Windows

```cmd
deploy-to-vps.bat root@192.168.1.100 ~/botmusic
```

### 2️⃣ Sur le VPS - Configurer

```bash
cd ~/botmusic
nano .env
```

Ajouter :
```
DISCORD_TOKEN=votre_token
CLIENT_ID=votre_id
SPOTIFY_CLIENT_ID=votre_spotify_id
SPOTIFY_CLIENT_SECRET=votre_spotify_secret
```

Sauvegarder : `CTRL+X` → `Y` → `ENTER`

### 3️⃣ Démarrer

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## ✅ C'est tout ! Le bot tourne maintenant

---

## 🎮 Commandes Quotidiennes

```bash
pm2 logs botmusic        # Voir les logs
pm2 restart botmusic     # Redémarrer
pm2 stop botmusic        # Arrêter
pm2 monit                # Monitoring
```

## 🔄 Mettre à jour

```bash
pm2 stop botmusic
# Transférer les nouveaux fichiers depuis votre PC
pm2 restart botmusic
```

## 🆘 Problème ?

```bash
pm2 logs botmusic --err  # Voir les erreurs
node src/index.js        # Tester manuellement
./debug.sh stats         # Statistiques
```

---

**Documentation complète** : `DEPLOY_GUIDE_FR.md`

