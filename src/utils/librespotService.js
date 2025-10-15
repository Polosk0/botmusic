const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class LibrespotService {
    constructor() {
        this.clientId = process.env.SPOTIFY_CLIENT_ID;
        this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async initialize() {
        if (!this.clientId || !this.clientSecret) {
            throw new Error('Configuration Spotify manquante. Vérifiez SPOTIFY_CLIENT_ID et SPOTIFY_CLIENT_SECRET dans votre .env');
        }
        console.log('✅ Service Librespot initialisé');
    }

    async authenticate() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const response = await axios.post('https://accounts.spotify.com/api/token', 
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            console.log('✅ Authentification Spotify réussie');
            return this.accessToken;
        } catch (error) {
            console.error('❌ Erreur authentification Spotify:', error.message);
            throw new Error('Impossible de s\'authentifier auprès de Spotify');
        }
    }

    async searchAndGetStream(query) {
        try {
            console.log('🔍 Recherche Spotify avec Librespot pour:', query);
            
            await this.initialize();
            const token = await this.authenticate();
            
            // Rechercher sur Spotify
            const response = await axios.get('https://api.spotify.com/v1/search', {
                params: {
                    q: query,
                    type: 'track',
                    limit: 1,
                    market: 'FR'
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.data.tracks.items.length) {
                throw new Error('Aucune musique trouvée sur Spotify');
            }

            const track = response.data.tracks.items[0];
            console.log('✅ Track trouvée:', track.name, 'par', track.artists.map(a => a.name).join(', '));

            // Extraire l'audio avec Librespot
            const streamData = await this.extractWithLibrespot(track);
            
            return {
                searchResult: {
                    title: track.name,
                    artist: track.artists.map(a => a.name).join(', '),
                    album: track.album.name,
                    duration_ms: track.duration_ms,
                    popularity: track.popularity,
                    images: track.album.images,
                    url: track.external_urls.spotify,
                    id: track.id
                },
                streamData: streamData
            };
        } catch (error) {
            console.error('❌ Erreur recherche Spotify avec Librespot:', error.message);
            throw error;
        }
    }

    async extractWithLibrespot(track) {
        try {
            console.log('🔍 Début extraction Librespot pour:', track.name);
            
            // Créer le dossier temp s'il n'existe pas
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const tempFile = path.join(tempDir, `librespot_${track.id}.mp3`);
            
            return new Promise((resolve, reject) => {
                // Utiliser librespot pour extraire l'audio
                const username = process.env.SPOTIFY_USERNAME || '';
                const password = process.env.SPOTIFY_PASSWORD || '';
                const trackId = track.id;
                const outputFile = tempFile;
                
                // Convertir le chemin Windows en format Python
                const pythonPath = outputFile.replace(/\\/g, '/');
                
                const librespotProcess = spawn('python', [
                    '-c', `
import librespot
from librespot.core import Session
from librespot.audio.decoders import AudioQuality, VorbisOnlyAudioQuality
import sys
import os

# Configuration
username = "${username}"
password = "${password}"
track_id = "${trackId}"
output_file = r"${pythonPath}"

try:
    if username and password:
        # Connexion avec identifiants
        session = Session.Builder().user_pass(username, password).create()
    else:
        # Connexion anonyme
        session = Session.Builder().anonymous().create()
    
    # Obtenir le track
    track = session.get_track(track_id)
    
    # Extraire l'audio
    audio_file = session.content_feeder().load(track, VorbisOnlyAudioQuality.HIGH, False, None)
    
    # Sauvegarder le fichier
    with open(output_file, 'wb') as f:
        f.write(audio_file.read())
    
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
                    `
                ]);

                let output = '';
                librespotProcess.stdout.on('data', (chunk) => {
                    output += chunk.toString();
                });

                librespotProcess.stderr.on('data', (chunk) => {
                    console.log('Librespot stderr:', chunk.toString());
                });

                librespotProcess.on('close', (code) => {
                    if (code === 0 && output.includes('SUCCESS')) {
                        console.log('✅ Extraction Librespot réussie');
                        
                        // Créer un stream depuis le fichier
                        const audioStream = fs.createReadStream(tempFile);
                        
                        // Nettoyer le fichier après lecture
                        audioStream.on('end', () => {
                            setTimeout(() => {
                                try {
                                    if (fs.existsSync(tempFile)) {
                                        fs.unlinkSync(tempFile);
                                        console.log('🔍 Fichier temporaire supprimé:', tempFile);
                                    }
                                } catch (error) {
                                    console.log('⚠️ Erreur suppression fichier:', error.message);
                                }
                            }, 5000);
                        });

                        resolve({
                            stream: audioStream,
                            trackInfo: track,
                            type: 'librespot-direct'
                        });
                    } else {
                        console.log('❌ Extraction Librespot échouée, code:', code);
                        reject(new Error('Extraction Librespot échouée'));
                    }
                });

                librespotProcess.on('error', (error) => {
                    console.log('❌ Erreur Librespot:', error.message);
                    reject(new Error(`Erreur Librespot: ${error.message}`));
                });

                // Timeout
                setTimeout(() => {
                    librespotProcess.kill();
                    reject(new Error('Timeout Librespot'));
                }, 60000);
            });
        } catch (error) {
            console.error('❌ Erreur extractWithLibrespot:', error);
            throw error;
        }
    }

    isConfigured() {
        return !!(this.clientId && this.clientSecret);
    }
}

module.exports = new LibrespotService();
