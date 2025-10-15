# Bot Discord Musical - 🕲- 𝘮

## Description
Bot Discord musical avancé avec support multi-plateformes : YouTube, Spotify, Deezer, SoundCloud, Apple Music.

## Préfixe des commandes
/

## Installation

1. Installez Node.js (version 16 ou supérieure)
2. Clonez ce repository
3. Installez les dépendances :
```bash
npm install
```

4. Configurez votre fichier `.env` :
```
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
GUILD_ID=votre_guild_id
SPOTIFY_CLIENT_ID=votre_spotify_client_id
SPOTIFY_CLIENT_SECRET=votre_spotify_client_secret
```

## Utilisation

### Développement
```bash
npm run dev
```

### Production
```bash
npm start
```

## Commandes disponibles

- `/play <musique>` - Jouer une musique
- `/pause` - Mettre en pause
- `/resume` - Reprendre la lecture
- `/skip` - Passer à la musique suivante
- `/stop` - Arrêter la musique
- `/queue` - Voir la file d'attente
- `/volume <nombre>` - Changer le volume
- `/shuffle` - Mélanger la queue
- `/loop` - Activer/désactiver la répétition
- `/nowplaying` - Voir la musique actuelle
- `/search <terme>` - Rechercher des musiques

## Plateformes supportées

- ✅ YouTube
- ✅ Spotify
- ✅ Deezer
- ✅ SoundCloud
- ✅ Apple Music

## Structure du projet

```
botmusic/
├── src/
│   ├── index.js              # Point d'entrée principal
│   ├── config/
│   │   └── config.js         # Configuration du bot
│   ├── commands/
│   │   ├── music/           # Commandes musicales
│   │   └── general/         # Commandes générales
│   ├── events/              # Gestionnaires d'événements
│   ├── utils/               # Utilitaires
│   └── handlers/            # Gestionnaires de commandes
├── config/
│   └── config.json          # Configuration JSON
├── logs/                    # Fichiers de logs
├── .env                     # Variables d'environnement
├── .gitignore
└── README.md
```
