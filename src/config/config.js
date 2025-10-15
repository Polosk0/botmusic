module.exports = {
    // Configuration du bot
    bot: {
        name: '🕲- 𝘮',
        prefix: '/',
        version: '1.0.0',
        author: 'Polosko'
    },

    // Configuration des couleurs des embeds
    colors: {
        primary: '#0099ff',
        success: '#00ff00',
        error: '#ff0000',
        warning: '#ffaa00',
        info: '#00aaff'
    },

    // Configuration du player musical
    player: {
        defaultVolume: 80,
        leaveOnEmpty: false, // Ne pas quitter quand la queue est vide
        leaveOnEmptyCooldown: 300000, // 5 minutes
        leaveOnEnd: false, // Ne pas quitter quand une musique se termine
        leaveOnEndCooldown: 300000, // 5 minutes
        selfDeaf: false // Empêcher le bot de se mettre en deafened
    },

    // Configuration des plateformes supportées
    platforms: {
        youtube: true,
        spotify: true,
        deezer: true,
        soundcloud: true,
        appleMusic: true
    },

    // Messages par défaut
    messages: {
        noVoiceChannel: '❌ Vous devez être dans un salon vocal pour utiliser cette commande!',
        noMusicPlaying: '❌ Aucune musique n\'est en cours de lecture!',
        noResults: '❌ Aucun résultat trouvé pour cette recherche!',
        errorOccurred: '❌ Une erreur est survenue!',
        success: '✅ Opération réussie!'
    }
};
