const axios = require('axios');
const { spawn } = require('child_process');

class SimpleSpotifyService {
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
        console.log('✅ Service Spotify simple initialisé');
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
            console.log('🔍 Recherche Spotify simple pour:', query);
            
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

            // Rechercher sur YouTube avec les métadonnées Spotify
            const searchQuery = `${track.artists.map(a => a.name).join(' ')} ${track.name}`;
            console.log('🔍 Recherche YouTube pour:', searchQuery);

            const streamData = await this.getYouTubeStream(searchQuery, track);
            
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
            console.error('❌ Erreur recherche Spotify simple:', error.message);
            throw error;
        }
    }

    async getYouTubeStream(searchQuery, spotifyTrack) {
        return new Promise((resolve, reject) => {
            console.log('🔍 Début extraction YouTube pour:', searchQuery);
            
            // Rechercher sur YouTube
            const searchProcess = spawn('yt-dlp', [
                '--dump-json',
                '--no-playlist',
                `ytsearch1:${searchQuery}`
            ]);

            let searchData = '';
            searchProcess.stdout.on('data', (chunk) => {
                searchData += chunk;
            });

            searchProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const searchResult = JSON.parse(searchData);
                        console.log('✅ URL YouTube trouvée:', searchResult.webpage_url);
                        
                        // Extraire l'audio
                        const ytdlpProcess = spawn('yt-dlp', [
                            '-f', 'bestaudio',
                            '--no-playlist',
                            '-o', '-',
                            searchResult.webpage_url
                        ], { stdio: ['ignore', 'pipe', 'ignore'] });

                        console.log('✅ Stream YouTube créé avec métadonnées Spotify');
                        resolve({
                            stream: ytdlpProcess.stdout,
                            trackInfo: spotifyTrack,
                            type: 'youtube-with-spotify-metadata'
                        });
                    } catch (error) {
                        console.error('❌ Erreur parsing YouTube:', error.message);
                        reject(new Error('Impossible de trouver une version YouTube de cette musique'));
                    }
                } else {
                    reject(new Error('Recherche YouTube échouée'));
                }
            });

            searchProcess.on('error', (error) => {
                reject(new Error(`Erreur recherche YouTube: ${error.message}`));
            });

            // Timeout
            setTimeout(() => {
                searchProcess.kill();
                reject(new Error('Timeout recherche YouTube'));
            }, 30000);
        });
    }

    isConfigured() {
        return !!(this.clientId && this.clientSecret);
    }
}

module.exports = new SimpleSpotifyService();
