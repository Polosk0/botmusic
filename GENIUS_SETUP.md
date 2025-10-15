# 🎵 Configuration de l'API Genius pour les Paroles

## 📋 Prérequis

Pour utiliser la fonctionnalité de paroles, vous devez obtenir un token d'accès Genius.

## 🔑 Comment obtenir votre token Genius

### Étape 1 : Créer un compte Genius
1. Allez sur [genius.com](https://genius.com)
2. Créez un compte ou connectez-vous

### Étape 2 : Créer une application API
1. Allez sur [genius.com/api-clients](https://genius.com/api-clients)
2. Cliquez sur "New API Client"
3. Remplissez le formulaire :
   - **App Name** : `🕲- 𝘮 Bot Musical`
   - **App Website URL** : `https://discord.com` (ou votre site)
   - **Redirect URI** : `https://discord.com` (ou votre site)
   - **App Description** : `Bot Discord musical pour afficher les paroles`

### Étape 3 : Obtenir le token
1. Une fois l'application créée, vous verrez votre **Client Access Token**
2. Copiez ce token

### Étape 4 : Configurer le bot
1. Ouvrez votre fichier `.env`
2. Ajoutez la ligne suivante :
   ```
   GENIUS_ACCESS_TOKEN=votre_token_ici
   ```
3. Remplacez `votre_token_ici` par le token que vous avez copié

## ✅ Test de la configuration

Une fois configuré, vous pouvez tester avec la commande `/lyrics` sur une musique en cours.

## 🚨 Limites et considérations

- **Gratuit** : L'API Genius est gratuite pour un usage raisonnable
- **Rate limiting** : Respectez les limites de l'API (environ 1000 requêtes/jour)
- **Usage privé** : Parfait pour un bot privé, évitez l'usage commercial intensif

## 🔧 Dépannage

### Erreur "Token Genius non configuré"
- Vérifiez que `GENIUS_ACCESS_TOKEN` est bien dans votre fichier `.env`
- Redémarrez le bot après avoir ajouté le token

### Erreur "Paroles non trouvées"
- Certaines musiques peuvent ne pas être disponibles sur Genius
- Essayez avec des musiques plus populaires pour tester

### Erreur "Paroles non disponibles"
- Certaines paroles peuvent être protégées ou non disponibles
- C'est normal, toutes les musiques n'ont pas leurs paroles sur Genius

## 📚 Ressources

- [Documentation API Genius](https://docs.genius.com/)
- [Genius API Clients](https://genius.com/api-clients)
- [Communauté Genius](https://genius.com/)

