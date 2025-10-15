// Importation de toutes les stations de radio par pays et style
const FRENCH_RADIO_STATIONS = require('./france');
const BRITISH_RADIO_STATIONS = require('./britain');
const AMERICAN_RADIO_STATIONS = require('./america');
const AUSTRALIAN_RADIO_STATIONS = require('./australia');
const INTERNET_RADIO_STATIONS = require('./internet');
const RAP_RADIO_STATIONS = require('./rap');
const TECHNO_RADIO_STATIONS = require('./techno');

// Combinaison de toutes les stations
const ALL_RADIO_STATIONS = {
    ...FRENCH_RADIO_STATIONS,
    ...BRITISH_RADIO_STATIONS,
    ...AMERICAN_RADIO_STATIONS,
    ...AUSTRALIAN_RADIO_STATIONS,
    ...INTERNET_RADIO_STATIONS,
    ...RAP_RADIO_STATIONS,
    ...TECHNO_RADIO_STATIONS
};

// Stations simplifiées (les plus connues uniquement)
const SIMPLIFIED_RADIO_STATIONS = {
    ...FRENCH_RADIO_STATIONS,
    'radio-paradise': INTERNET_RADIO_STATIONS['radio-paradise']
};

// Catégories par pays et style
const RADIO_CATEGORIES = {
    '🇫🇷 **RADIOS FRANÇAISES**': Object.keys(FRENCH_RADIO_STATIONS),
    '🇬🇧 **RADIOS BRITANNIQUES**': Object.keys(BRITISH_RADIO_STATIONS),
    '🇺🇸 **RADIOS AMÉRICAINES**': Object.keys(AMERICAN_RADIO_STATIONS),
    '🇦🇺 **RADIOS AUSTRALIENNES**': Object.keys(AUSTRALIAN_RADIO_STATIONS),
    '🌍 **RADIOS INTERNET**': Object.keys(INTERNET_RADIO_STATIONS),
    '🎤 **RAP & HIP-HOP**': Object.keys(RAP_RADIO_STATIONS),
    '🎛️ **TECHNO & ELECTRONIC**': Object.keys(TECHNO_RADIO_STATIONS)
};

// Catégories simplifiées
const SIMPLIFIED_CATEGORIES = {
    '🇫🇷 **RADIOS FRANÇAISES**': Object.keys(FRENCH_RADIO_STATIONS),
    '🌍 **RADIOS INTERNET**': ['radio-paradise']
};

module.exports = {
    ALL_RADIO_STATIONS,
    SIMPLIFIED_RADIO_STATIONS,
    RADIO_CATEGORIES,
    SIMPLIFIED_CATEGORIES,
    FRENCH_RADIO_STATIONS,
    BRITISH_RADIO_STATIONS,
    AMERICAN_RADIO_STATIONS,
    AUSTRALIAN_RADIO_STATIONS,
    INTERNET_RADIO_STATIONS,
    RAP_RADIO_STATIONS,
    TECHNO_RADIO_STATIONS
};
