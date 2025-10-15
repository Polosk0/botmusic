// Stations de radio internet/éclectiques
const INTERNET_RADIO_STATIONS = {
    'radio-paradise': {
        name: 'Radio Paradise',
        url: 'https://stream.radioparadise.com/aac-320',
        description: 'Radio internet éclectique - Musique du monde entier',
        emoji: '🌍',
        color: '#6C5CE7',
        style: 'Éclectique'
    },
    'soma-fm': {
        name: 'SomaFM Groove Salad',
        url: 'https://ice1.somafm.com/groovesalad-256-mp3',
        description: 'Radio internet électronique - Ambient, downtempo, chillout',
        emoji: '🌙',
        color: '#A29BFE',
        style: 'Électronique'
    },
    'jazz-radio': {
        name: 'Jazz Radio',
        url: 'https://jazz-wr09.ice.infomaniak.ch/jazz-wr09-128.mp3',
        description: 'Radio jazz internationale - Jazz, blues, soul',
        emoji: '🎷',
        color: '#FDCB6E',
        style: 'Jazz'
    }
    // deep-house et classical-radio supprimées car elles ne fonctionnent pas
};

module.exports = INTERNET_RADIO_STATIONS;
