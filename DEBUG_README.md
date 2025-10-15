# 🔍 Système de Debug et Monitoring - Bot Discord Musical 🕲- 𝘮

## 📋 Description
Système de debug complet et monitoring en temps réel pour surveiller les performances et détecter les erreurs de votre bot Discord musical.

## 🎯 Fonctionnalités du Système de Debug

### 📊 Monitoring en Temps Réel
- **Surveillance des logs** avec couleurs et catégorisation
- **Métriques de performance** (mémoire, CPU, uptime)
- **Détection automatique des erreurs** et alertes
- **Statistiques détaillées** des événements

### 📁 Gestion des Logs
- **Logs structurés** en JSON avec timestamps
- **Rotation automatique** des fichiers de logs
- **Nettoyage automatique** des anciens logs (7 jours)
- **Séparation par type** (erreurs, debug, général)

### 🚨 Alertes et Notifications
- **Détection des erreurs** en temps réel
- **Alertes de performance** (mémoire élevée, etc.)
- **Statistiques d'erreurs** par heure/jour
- **Rapports automatiques** de santé du système

## 🚀 Utilisation

### 📱 Scripts de Démarrage

#### Démarrage Standard avec Debug
```bash
# Linux/Mac
./start-with-debug.sh

# Windows
start-with-debug.bat

# Ou avec npm
npm run start:debug
```

#### Démarrage en Mode Développement avec Debug
```bash
# Linux/Mac
./start-with-debug.sh dev

# Windows
start-with-debug.bat dev

# Ou avec npm
npm run start:debug:dev
```

### 🔧 Scripts de Debug Individuels

#### Surveillance des Logs en Temps Réel
```bash
# Linux/Mac
./debug.sh monitor

# Windows
debug.bat monitor
```

#### Afficher les Statistiques
```bash
# Linux/Mac
./debug.sh stats

# Windows
debug.bat stats
```

#### Voir les Dernières Erreurs
```bash
# Linux/Mac
./debug.sh errors

# Windows
debug.bat errors
```

#### Nettoyer les Anciens Logs
```bash
# Linux/Mac
./debug.sh cleanup

# Windows
debug.bat cleanup
```

### 🎮 Commandes Discord

#### Afficher les Statistiques de Debug
```
/debug stats
```

#### Rapport Complet
```
/debug report
```

#### Statut du Système
```
/debug status
```

## 📁 Structure des Logs

```
logs/
├── bot-YYYY-MM-DD.log          # Logs généraux du jour
├── errors-YYYY-MM-DD.log       # Erreurs du jour
├── debug-YYYY-MM-DD.log        # Logs de debug du jour
└── monitoring-YYYY-MM-DD.log   # Métriques de monitoring
```

### 📝 Format des Logs
```json
{
  "timestamp": "2024-01-15 14:30:25.123",
  "level": "INFO",
  "message": "Bot connecté avec succès",
  "data": {
    "guilds": 5,
    "users": 150
  },
  "pid": 12345
}
```

## 🎨 Types de Logs et Couleurs

| Type | Couleur | Description |
|------|---------|-------------|
| **INFO** | 🔵 Bleu | Informations générales |
| **SUCCESS** | 🟢 Vert | Opérations réussies |
| **WARNING** | 🟡 Jaune | Avertissements |
| **ERROR** | 🔴 Rouge | Erreurs critiques |
| **MUSIC** | 🟣 Magenta | Événements musicaux |
| **DISCORD** | 🔵 Cyan | Événements Discord |
| **SPOTIFY** | 🟢 Vert | Événements Spotify |
| **DEBUG** | ⚫ Gris | Informations de debug |

## 📊 Métriques Surveillées

### 💾 Utilisation Mémoire
- **RSS** (Resident Set Size)
- **Heap Used** (Mémoire heap utilisée)
- **Heap Total** (Mémoire heap totale)
- **External** (Mémoire externe)

### ⏱️ Performance
- **Uptime** (Temps de fonctionnement)
- **CPU Usage** (Utilisation CPU)
- **Error Rate** (Taux d'erreurs par heure)
- **Response Time** (Temps de réponse)

### 📈 Statistiques
- **Nombre d'erreurs** par jour/heure
- **Nombre d'avertissements**
- **Taille des fichiers de logs**
- **Nombre de fichiers de logs**

## 🚨 Alertes Automatiques

### ⚠️ Alertes de Performance
- **Mémoire > 500MB** : Avertissement d'utilisation mémoire élevée
- **Fichier log > 50MB** : Avertissement de fichier volumineux
- **Erreurs > 10/heure** : Alerte de taux d'erreurs élevé

### 🔴 Alertes Critiques
- **Bot arrêté** : Notification d'arrêt inattendu
- **Erreurs de connexion** : Problèmes Discord/Spotify
- **Erreurs non capturées** : Exceptions système

## 🔧 Configuration

### 📝 Variables d'Environnement
```env
# Configuration des logs
LOG_LEVEL=info                    # Niveau de log (debug, info, warn, error)
LOG_FILE=logs/bot.log            # Fichier de log principal

# Configuration du monitoring
MONITORING_INTERVAL=30000        # Intervalle de monitoring (ms)
LOG_CLEANUP_DAYS=7              # Jours avant suppression des logs
MAX_LOG_SIZE=50                 # Taille max des fichiers (MB)
```

### ⚙️ Personnalisation
Vous pouvez modifier les paramètres dans `src/utils/debugMonitor.js` :
- Intervalle de monitoring
- Seuils d'alerte
- Durée de rétention des logs
- Métriques surveillées

## 🛠️ Dépannage

### ❌ Problèmes Courants

#### Le système de debug ne démarre pas
```bash
# Vérifier les permissions
chmod +x debug.sh
chmod +x start-with-debug.sh

# Vérifier les dépendances
npm install
```

#### Les logs ne s'affichent pas
```bash
# Vérifier le dossier logs
ls -la logs/

# Vérifier les permissions
chmod 755 logs/
```

#### Erreurs de mémoire
```bash
# Vérifier l'utilisation mémoire
./debug.sh stats

# Nettoyer les anciens logs
./debug.sh cleanup
```

### 🔍 Debug Avancé

#### Analyser les Logs
```bash
# Chercher des erreurs spécifiques
grep "ERROR" logs/bot-*.log

# Analyser les performances
grep "memory" logs/debug-*.log

# Voir les événements musicaux
grep "MUSIC" logs/bot-*.log
```

#### Monitoring Personnalisé
```bash
# Surveiller un fichier spécifique
tail -f logs/errors-$(date +%Y-%m-%d).log

# Compter les erreurs par type
grep -c "player_error" logs/bot-*.log
```

## 📞 Support

Pour toute question ou problème avec le système de debug :
1. Vérifiez les logs dans le dossier `logs/`
2. Utilisez `/debug status` pour voir l'état du système
3. Consultez les statistiques avec `/debug stats`
4. Ouvrez une issue sur GitHub si nécessaire

## 🔄 Mises à Jour

Le système de debug est automatiquement mis à jour avec le bot. Les nouvelles fonctionnalités incluent :
- Métriques supplémentaires
- Alertes personnalisées
- Rapports améliorés
- Interface de monitoring web (à venir)

---

**Note** : Ce système de debug est conçu pour un usage privé et optimisé pour surveiller un bot Discord musical. Il peut être adapté pour d'autres types de bots si nécessaire.


