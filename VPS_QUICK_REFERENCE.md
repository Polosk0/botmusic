# 🎵 Référence Rapide VPS - Bot Discord Musical

## 🚨 Problème Actuel Résolu

### Erreur yt-dlp
```bash
./fix-ytdlp.sh
pm2 restart botmusic
```

---

## 📊 Accès aux Logs/Debug

### Menu Interactif Complet ⭐

```bash
./logs-vps.sh
```

**Options disponibles :**
1. Logs en temps réel (tous)
2. Erreurs uniquement
3. Statistiques du bot
4. Logs des 50 dernières lignes
5. Logs des 100 dernières lignes
6. Logs du fichier applicatif
7. Nettoyer les logs
8. Redémarrer le bot
9. Vérifier l'état du système

### Commandes Rapides

```bash
./quick-commands.sh logs        # Logs en temps réel
./quick-commands.sh errors      # Erreurs uniquement
./quick-commands.sh status      # Statut du bot
./quick-commands.sh restart     # Redémarrer
./quick-commands.sh stop        # Arrêter
./quick-commands.sh start       # Démarrer
./quick-commands.sh update      # Mettre à jour depuis Git
./quick-commands.sh fix-ytdlp   # Réparer yt-dlp
./quick-commands.sh check       # Vérifier le système
./quick-commands.sh menu        # Menu interactif
```

### Commandes PM2

```bash
pm2 logs botmusic               # Logs en temps réel
pm2 logs botmusic --err         # Erreurs uniquement
pm2 logs botmusic --lines 100   # 100 dernières lignes
pm2 status                      # Statut
pm2 describe botmusic           # Statistiques détaillées
pm2 monit                       # Monitoring interactif
pm2 restart botmusic            # Redémarrer
pm2 stop botmusic               # Arrêter
pm2 start ecosystem.config.js   # Démarrer
```

---

## 🔧 Maintenance

### Mise à jour du bot

```bash
./update-vps.sh
```

Ou manuellement :
```bash
pm2 stop botmusic
git pull origin main
pnpm install
pm2 restart botmusic
```

### Vérifier l'état

```bash
./quick-commands.sh check
```

Ou :
```bash
pm2 status
yt-dlp --version
ffmpeg -version
node -v
```

### Réparer yt-dlp

```bash
./fix-ytdlp.sh
pm2 restart botmusic
```

---

## 🎮 Gestion du Bot

```bash
# Démarrer
pm2 start ecosystem.config.js

# Arrêter
pm2 stop botmusic

# Redémarrer
pm2 restart botmusic

# Recharger (sans downtime)
pm2 reload botmusic

# Supprimer de PM2
pm2 delete botmusic

# Sauvegarder la config
pm2 save

# Configurer le démarrage auto
pm2 startup
```

---

## 📁 Fichiers Importants

```
~/botmusic/
├── .env                    # Configuration (tokens secrets)
├── ecosystem.config.js     # Configuration PM2
├── logs/                   # Dossier des logs
├── temp/                   # Fichiers temporaires (musique)
└── src/                    # Code source
```

---

## 🔍 Dépannage

### Le bot ne répond pas

```bash
pm2 restart botmusic
pm2 logs botmusic
```

### Erreur "yt-dlp non trouvé"

```bash
./fix-ytdlp.sh
pm2 restart botmusic
```

### Mémoire saturée

```bash
pm2 restart botmusic
pm2 flush  # Nettoyer les logs PM2
```

### Bot crash au démarrage

```bash
# Voir les erreurs
pm2 logs botmusic --err

# Tester manuellement
node src/index.js

# Vérifier .env
cat .env
```

---

## 📊 Monitoring

### En temps réel

```bash
# Menu complet
./logs-vps.sh

# PM2 monitoring
pm2 monit

# Logs en continu
pm2 logs botmusic
```

### Statistiques

```bash
pm2 describe botmusic
pm2 status
./quick-commands.sh status
```

---

## 🧹 Nettoyage

```bash
# Nettoyer les logs PM2
pm2 flush

# Nettoyer les logs anciens
find logs -name "*.log" -mtime +7 -delete

# Nettoyer les fichiers temporaires
rm -rf temp/*
```

---

## 🔐 Sécurité

```bash
# Protéger .env
chmod 600 .env

# Vérifier les permissions
ls -la .env

# Firewall (si non configuré)
sudo ufw allow ssh
sudo ufw enable
```

---

## 📝 Logs Importants

```bash
# Logs PM2
logs/pm2-out.log          # Sorties standard
logs/pm2-error.log        # Erreurs

# Logs applicatifs
logs/bot-YYYY-MM-DD.log   # Logs du bot par jour

# Voir les derniers logs
tail -100 logs/pm2-error.log
tail -100 logs/bot-$(date +%Y-%m-%d).log
```

---

## ⚡ Commandes d'Urgence

```bash
# Bot crash : Redémarrer
pm2 restart botmusic

# Voir les erreurs
./quick-commands.sh errors

# État complet
./quick-commands.sh check

# Réparer yt-dlp
./fix-ytdlp.sh

# Mettre à jour
./update-vps.sh
```

---

## 📞 Support

**Documentation :**
- `URGENT_FIX.md` - Correction yt-dlp
- `FIX_YTDLP.md` - Guide détaillé yt-dlp
- `START_HERE.md` - Vue d'ensemble
- `DEBUG_README.md` - Dépannage général

**Commandes de debug :**
```bash
./logs-vps.sh          # Menu interactif
./quick-commands.sh    # Aide rapide
pm2 logs botmusic      # Logs PM2
```

---

**🎵 Accédez aux logs à tout moment avec `./logs-vps.sh` ! 🚀**

