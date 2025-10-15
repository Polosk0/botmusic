# 🚨 CORRECTION URGENTE - Erreur yt-dlp

## ❌ Problème

```
❌ Une erreur est survenue: yt-dlp non trouvé: spawn yt-dlp ENOENT
```

Le bot ne peut pas jouer de musique car **yt-dlp** n'est pas installé.

---

## ✅ SOLUTION RAPIDE (2 minutes)

### Sur le VPS

```bash
# Se connecter au VPS
ssh user@votre-vps-ip

# Aller dans le dossier du bot
cd ~/botmusic

# Exécuter le script de correction
chmod +x fix-ytdlp.sh
./fix-ytdlp.sh

# Redémarrer le bot
pm2 restart botmusic

# Vérifier que ça fonctionne
pm2 logs botmusic
```

---

## 📊 ACCÉDER AU DEBUG À TOUT MOMENT

### Méthode 1 : Menu Interactif (Recommandé) ⭐

```bash
chmod +x logs-vps.sh
./logs-vps.sh
```

**Menu disponible :**
- 📊 Logs en temps réel (tous)
- ❌ Erreurs uniquement
- 📈 Statistiques du bot
- 🔍 Logs récents (50/100 lignes)
- 💾 Logs du fichier applicatif
- 🧹 Nettoyer les logs
- 🔄 Redémarrer le bot
- 🆘 Vérifier l'état du système

### Méthode 2 : Commandes Rapides

```bash
chmod +x quick-commands.sh

# Aide
./quick-commands.sh

# Exemples
./quick-commands.sh logs        # Logs en temps réel
./quick-commands.sh errors      # Erreurs uniquement
./quick-commands.sh status      # Statut du bot
./quick-commands.sh restart     # Redémarrer
./quick-commands.sh check       # Vérifier le système
./quick-commands.sh menu        # Menu interactif
```

### Méthode 3 : Commandes PM2 Directes

```bash
# Logs en temps réel (CTRL+C pour quitter)
pm2 logs botmusic

# Erreurs uniquement
pm2 logs botmusic --err

# 100 dernières lignes
pm2 logs botmusic --lines 100

# Statut
pm2 status

# Statistiques détaillées
pm2 describe botmusic

# Monitoring interactif
pm2 monit
```

---

## 🔍 VÉRIFICATION

Après avoir exécuté `fix-ytdlp.sh`, vérifiez :

```bash
# yt-dlp installé ?
yt-dlp --version

# FFmpeg installé ?
ffmpeg -version

# Python3 installé ?
python3 --version

# Bot en cours d'exécution ?
pm2 status

# Logs du bot
pm2 logs botmusic --lines 20
```

---

## 🎵 TEST

Une fois corrigé, testez sur Discord :

```
/play nom de la chanson
```

Surveillez les logs en temps réel :

```bash
pm2 logs botmusic
```

Vous devriez voir :
- ✅ Recherche de la musique
- ✅ Téléchargement avec yt-dlp
- ✅ Lecture de la musique

---

## 🔄 MISE À JOUR AUTOMATIQUE

Le script `install-vps.sh` a été mis à jour pour installer automatiquement :
- ✅ **yt-dlp** (nouveau)
- ✅ **Python3** (nouveau)
- ✅ FFmpeg
- ✅ Node.js
- ✅ pnpm
- ✅ PM2

**Si vous réinstallez le bot à l'avenir**, tout sera automatique !

---

## 🆘 SI LE PROBLÈME PERSISTE

### 1. Vérifier l'installation

```bash
which yt-dlp
# Devrait afficher : /usr/local/bin/yt-dlp

ls -la /usr/local/bin/yt-dlp
# Devrait être exécutable : -rwxr-xr-x
```

### 2. Réinstaller manuellement

```bash
sudo rm /usr/local/bin/yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
yt-dlp --version
```

### 3. Tester yt-dlp

```bash
yt-dlp --print title "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### 4. Vérifier les logs détaillés

```bash
./logs-vps.sh
# Choisir [1] Logs en temps réel
# Puis essayer /play sur Discord
```

### 5. Vérifier l'état complet

```bash
./quick-commands.sh check
```

---

## 📝 NOUVEAUX FICHIERS CRÉÉS

### Scripts de Debug
- ✅ **`logs-vps.sh`** - Menu interactif pour les logs
- ✅ **`quick-commands.sh`** - Commandes rapides
- ✅ **`fix-ytdlp.sh`** - Correction yt-dlp

### Documentation
- ✅ **`FIX_YTDLP.md`** - Guide détaillé
- ✅ **`URGENT_FIX.md`** - Ce fichier (guide rapide)

### Configuration Mise à Jour
- ✅ **`install-vps.sh`** - Installe maintenant yt-dlp + Python3
- ✅ **`ecosystem.config.js`** - Debug activé (DEBUG=*)

---

## ⚡ RÉSUMÉ EN 3 COMMANDES

```bash
# 1. Corriger yt-dlp
./fix-ytdlp.sh

# 2. Redémarrer le bot
pm2 restart botmusic

# 3. Voir les logs
pm2 logs botmusic
```

---

## 📞 ACCÈS RAPIDE AUX LOGS

**À tout moment, depuis le VPS :**

```bash
# Menu complet
./logs-vps.sh

# Ou commande rapide
./quick-commands.sh logs
```

**Vous pouvez maintenant accéder au debug complet 24/7 !** 🎉

---

**✅ Après cette correction, votre bot fonctionnera parfaitement ! 🎵**

