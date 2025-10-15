# 🔧 Correction Erreur yt-dlp

## ❌ Erreur Rencontrée

```
❌ Une erreur est survenue: yt-dlp non trouvé: spawn yt-dlp ENOENT
```

## ✅ Solution Rapide

### Sur le VPS

```bash
# Méthode 1 : Script automatique (recommandé)
chmod +x fix-ytdlp.sh
./fix-ytdlp.sh

# Puis redémarrer le bot
pm2 restart botmusic
```

### Méthode Manuelle

```bash
# Installer yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Vérifier l'installation
yt-dlp --version

# Installer FFmpeg si nécessaire
sudo apt-get update
sudo apt-get install -y ffmpeg

# Installer Python3 si nécessaire
sudo apt-get install -y python3 python3-pip

# Redémarrer le bot
pm2 restart botmusic
```

## 🔍 Vérification

```bash
# Vérifier yt-dlp
yt-dlp --version

# Vérifier FFmpeg
ffmpeg -version

# Vérifier Python3
python3 --version

# Voir les logs
pm2 logs botmusic
```

## 📊 Accéder au Debug à Tout Moment

### Script Interactif (Recommandé)

```bash
chmod +x logs-vps.sh
./logs-vps.sh
```

Menu disponible :
- 📊 Logs en temps réel
- ❌ Erreurs uniquement
- 📈 Statistiques
- 🔍 Logs récents
- 💾 Logs fichier
- 🧹 Nettoyer
- 🔄 Redémarrer
- 🆘 État système

### Commandes Rapides

```bash
# Logs en temps réel
pm2 logs botmusic

# Erreurs uniquement
pm2 logs botmusic --err

# 100 dernières lignes
pm2 logs botmusic --lines 100

# Statistiques
pm2 describe botmusic

# État du système
pm2 status
```

## 🔄 Mise à Jour du Script d'Installation

Le script `install-vps.sh` a été mis à jour pour installer automatiquement :
- ✅ Node.js
- ✅ pnpm
- ✅ PM2
- ✅ FFmpeg
- ✅ **yt-dlp** (nouveau)
- ✅ Python3 (nouveau)

Si vous avez déjà installé le bot, exécutez simplement :

```bash
./fix-ytdlp.sh
pm2 restart botmusic
```

## 🎵 Test

Une fois corrigé, testez :

```bash
# Sur Discord
/play nom de la musique

# Surveiller les logs
pm2 logs botmusic
```

## 🆘 Si le Problème Persiste

1. **Vérifier les chemins :**
   ```bash
   which yt-dlp
   echo $PATH
   ```

2. **Réinstaller complètement :**
   ```bash
   sudo rm /usr/local/bin/yt-dlp
   ./fix-ytdlp.sh
   ```

3. **Vérifier les permissions :**
   ```bash
   ls -la /usr/local/bin/yt-dlp
   # Devrait être : -rwxr-xr-x
   ```

4. **Tester yt-dlp manuellement :**
   ```bash
   yt-dlp --version
   yt-dlp --print title "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   ```

5. **Voir les logs détaillés :**
   ```bash
   ./logs-vps.sh
   # Choisir [1] Logs en temps réel
   ```

## 📝 Notes

- **yt-dlp** est la version moderne de youtube-dl
- Il télécharge la musique depuis YouTube et d'autres plateformes
- Il nécessite Python3 et FFmpeg pour fonctionner
- Le script `install-vps.sh` installe maintenant tout automatiquement

---

**✅ Après correction, votre bot pourra jouer de la musique !** 🎵

