# Guide de Déploiement Multi-Serveurs

## 🎯 Objectif
Déployer votre bot Discord musical sur plusieurs serveurs Discord.

## 📋 Prérequis

### 1. Vérifier les Permissions du Bot
Assurez-vous que votre bot a les permissions suivantes :
- ✅ **Envoyer des messages**
- ✅ **Utiliser les commandes slash**
- ✅ **Se connecter aux salons vocaux**
- ✅ **Parler dans les salons vocaux**
- ✅ **Intégrer des liens**
- ✅ **Joindre des salons vocaux**
- ✅ **Afficher les embeds**

### 2. Configuration du Bot dans le Portail Développeur

1. **Aller sur le [Portail Développeur Discord](https://discord.com/developers/applications)**
2. **Sélectionner votre application**
3. **Aller dans "General Information"**
4. **Copier l'Application ID (CLIENT_ID)**

## 🚀 Méthodes de Déploiement

### Méthode 1 : Déploiement Global (Recommandé)

#### Étape 1 : Configurer les Commandes Slash Globales

```bash
# Installer les dépendances
npm install

# Enregistrer les commandes globalement (remplacez VOTRE_CLIENT_ID)
npx discord.js deploy-commands --client-id VOTRE_CLIENT_ID --token VOTRE_TOKEN --guild-id 0
```

#### Étape 2 : Modifier le fichier .env

```env
# Token du bot Discord (obligatoire)
DISCORD_TOKEN=votre_token_ici

# ID du client Discord (obligatoire)
CLIENT_ID=votre_client_id_ici

# SUPPRIMER ou commenter cette ligne pour le déploiement global
# GUILD_ID=

# Configuration Spotify (optionnel)
SPOTIFY_CLIENT_ID=votre_spotify_client_id
SPOTIFY_CLIENT_SECRET=votre_spotify_client_secret

# Configuration Genius (optionnel)
GENIUS_ACCESS_TOKEN=votre_token_genius

# Configuration de la base de données (optionnel)
DATABASE_URL=mongodb://localhost:27017/botmusic

# Configuration des logs
LOG_LEVEL=info
LOG_FILE=logs/bot.log

# Configuration du bot
BOT_PREFIX=/
BOT_NAME=🕲- 𝘮
BOT_VERSION=1.0.0
```

#### Étape 3 : Inviter le Bot sur de Nouveaux Serveurs

1. **Générer le lien d'invitation** :
   ```
   https://discord.com/api/oauth2/authorize?client_id=VOTRE_CLIENT_ID&permissions=3148800&scope=bot%20applications.commands
   ```

2. **Partager ce lien** avec les administrateurs des serveurs cibles

3. **Ils cliquent sur le lien** et sélectionnent leur serveur

### Méthode 2 : Déploiement par Serveur (Avancé)

#### Étape 1 : Créer un Script de Déploiement

```javascript
// deploy-to-guild.js
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];

// Charger toutes les commandes
const commandsPath = path.join(__dirname, 'src/commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

// Fonction pour déployer sur un serveur spécifique
async function deployToGuild(guildId) {
    try {
        console.log(`Déploiement des commandes sur le serveur ${guildId}...`);
        
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
            { body: commands },
        );
        
        console.log(`✅ Commandes déployées avec succès sur le serveur ${guildId}`);
    } catch (error) {
        console.error(`❌ Erreur lors du déploiement sur le serveur ${guildId}:`, error);
    }
}

// Utilisation
if (process.argv[2]) {
    deployToGuild(process.argv[2]);
} else {
    console.log('Usage: node deploy-to-guild.js GUILD_ID');
    console.log('Exemple: node deploy-to-guild.js 1401727737697271903');
}
```

#### Étape 2 : Déployer sur un Serveur Spécifique

```bash
# Déployer sur un serveur spécifique
node deploy-to-guild.js ID_DU_SERVEUR
```

## 🔧 Configuration Post-Déploiement

### 1. Vérifier le Fonctionnement

Une fois le bot invité sur un nouveau serveur :

1. **Tester une commande simple** : `/ping`
2. **Tester une commande musicale** : `/play [nom de la musique]`
3. **Vérifier les permissions** dans les salons vocaux

### 2. Configuration des Salons

- **Salon de commandes** : Le bot peut répondre dans n'importe quel salon
- **Salon vocal** : Le bot peut rejoindre n'importe quel salon vocal
- **Permissions** : Vérifiez que le bot a les permissions nécessaires

### 3. Personnalisation par Serveur (Optionnel)

Si vous voulez des configurations différentes par serveur, vous pouvez :

1. **Créer un système de configuration par serveur**
2. **Utiliser une base de données** pour stocker les préférences
3. **Ajouter des commandes d'administration** pour chaque serveur

## 🛠️ Dépannage

### Problèmes Courants

#### 1. "Application Command Not Found"
- **Solution** : Redéployez les commandes avec le script approprié
- **Vérification** : Vérifiez que le CLIENT_ID est correct

#### 2. "Missing Permissions"
- **Solution** : Réinvitez le bot avec les bonnes permissions
- **Vérification** : Vérifiez les permissions du bot dans le serveur

#### 3. "Bot Not Responding"
- **Solution** : Vérifiez les logs du bot
- **Vérification** : Assurez-vous que le bot est en ligne

### Logs et Debugging

```bash
# Voir les logs en temps réel
npm run dev

# Voir les logs de debug
npm run debug

# Voir les statistiques
npm run debug:stats
```

## 📊 Monitoring

### 1. Vérifier le Statut

Le bot affiche automatiquement :
- **Nombre de serveurs** connectés
- **Nombre d'utilisateurs** servis
- **Statut de la musique** en cours

### 2. Logs Avancés

Les logs sont automatiquement sauvegardés dans :
- `logs/bot-YYYY-MM-DD.log`
- `logs/errors-YYYY-MM-DD.log`

### 3. Métriques

Le bot track automatiquement :
- **Musiques jouées** par serveur
- **Utilisateurs actifs**
- **Erreurs et performances**

## 🔐 Sécurité

### 1. Protection des Tokens

- **Ne jamais** commiter les fichiers `.env`
- **Utiliser** des variables d'environnement en production
- **Régénérer** les tokens si compromis

### 2. Permissions Minimales

- **Donner uniquement** les permissions nécessaires
- **Révoquer** les permissions inutilisées
- **Surveiller** l'activité du bot

## 🚀 Déploiement en Production

### 1. Serveur VPS/Dédié

```bash
# Cloner le repository
git clone votre-repo-url
cd botmusic

# Installer les dépendances
npm install

# Configurer l'environnement
cp env.example .env
# Éditer .env avec vos vraies valeurs

# Démarrer le bot
npm start
```

### 2. PM2 (Process Manager)

```bash
# Installer PM2
npm install -g pm2

# Démarrer le bot avec PM2
pm2 start src/index.js --name "botmusic"

# Configurer le démarrage automatique
pm2 startup
pm2 save
```

### 3. Docker (Optionnel)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## 📝 Checklist de Déploiement

- [ ] **Configuration .env** complétée
- [ ] **Commandes déployées** (global ou par serveur)
- [ ] **Bot invité** sur les serveurs cibles
- [ ] **Permissions vérifiées** sur chaque serveur
- [ ] **Tests fonctionnels** effectués
- [ ] **Monitoring activé**
- [ ] **Logs configurés**
- [ ] **Sauvegarde** de la configuration

## 🆘 Support

En cas de problème :

1. **Vérifiez les logs** du bot
2. **Consultez** ce guide de dépannage
3. **Testez** sur un serveur de test d'abord
4. **Vérifiez** les permissions Discord

---

**Bon déploiement ! 🎵**








