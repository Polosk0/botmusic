const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class SpotdlService {
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
        console.log('✅ Service SpotDL initialisé');
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
            console.log('🔍 Recherche Spotify avec SpotDL pour:', query);
            
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

            // Extraire l'audio avec SpotDL
            try {
                const streamData = await this.extractWithSpotdl(track);
                
                return {
                    searchResult: {
                        title: track.name,
                        artist: track.artists.map(a => a.name).join(', '),
                        album: track.album.name,
                        duration_ms: track.duration_ms,
                        popularity: track.popularity,
                        images: track.album.images,
                        url: track.external_urls.spotify,
                        id: track.id,
                        release_date: track.album.release_date
                    },
                    streamData: streamData
                };
            } catch (error) {
                console.log('⚠️ SpotDL échoué, utilisation du fallback YouTube:', error.message);
                
                // Fallback vers YouTube avec métadonnées Spotify
                const streamData = await this.getYouTubeFallback(track);
                
                return {
                    searchResult: {
                        title: track.name,
                        artist: track.artists.map(a => a.name).join(', '),
                        album: track.album.name,
                        duration_ms: track.duration_ms,
                        popularity: track.popularity,
                        images: track.album.images,
                        url: track.external_urls.spotify,
                        id: track.id,
                        release_date: track.album.release_date
                    },
                    streamData: streamData
                };
            }
        } catch (error) {
            console.error('❌ Erreur recherche Spotify avec SpotDL:', error.message);
            throw error;
        }
    }

    async extractWithSpotdl(track) {
        try {
            console.log('🔍 Début extraction SpotDL pour:', track.name);
            
            // Créer le dossier temp s'il n'existe pas
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const spotifyUrl = track.external_urls.spotify;
            const tempFile = path.join(tempDir, `spotdl_${track.id}.mp3`);
            
            return new Promise((resolve, reject) => {
                // Utiliser spotdl avec gestion des limites de taux
                const spotdlProcess = spawn('spotdl', [
                    'download',
                    spotifyUrl,
                    '--output', tempFile,
                    '--format', 'mp3',
                    '--bitrate', '320k',
                    '--max-retries', '3',
                    '--headless'
                ]);

                let output = '';
                let errorOutput = '';
                let hasRateLimit = false;

                spotdlProcess.stdout.on('data', (chunk) => {
                    output += chunk.toString();
                    console.log('SpotDL stdout:', chunk.toString());
                });

                spotdlProcess.stderr.on('data', (chunk) => {
                    errorOutput += chunk.toString();
                    console.log('SpotDL stderr:', chunk.toString());
                    
                    // Détecter les limites de taux
                    if (chunk.toString().includes('rate/request limit')) {
                        hasRateLimit = true;
                        console.log('⚠️ Limite de taux détectée, attente...');
                    }
                });

                spotdlProcess.on('close', (code) => {
                    console.log('🔍 SpotDL terminé avec code:', code);
                    
                    if (code === 0) {
                        // SpotDL crée un dossier avec le fichier à l'intérieur
                        const spotdlDir = path.join(tempDir, `spotdl_${track.id}.mp3`);
                        let actualFile = null;
                        
                        if (fs.existsSync(spotdlDir) && fs.statSync(spotdlDir).isDirectory()) {
                            // Chercher le fichier MP3 dans le dossier
                            const files = fs.readdirSync(spotdlDir);
                            const mp3File = files.find(file => file.endsWith('.mp3'));
                            
                            if (mp3File) {
                                actualFile = path.join(spotdlDir, mp3File);
                                console.log('✅ Fichier SpotDL trouvé:', actualFile);
                            }
                        } else if (fs.existsSync(tempFile)) {
                            // Fichier direct
                            actualFile = tempFile;
                            console.log('✅ Fichier SpotDL direct trouvé:', actualFile);
                        }
                        
                        if (actualFile) {
                            console.log('✅ Extraction SpotDL réussie');
                            
                            // Créer un stream depuis le fichier
                            const audioStream = fs.createReadStream(actualFile);
                            
                            // Nettoyer le fichier après lecture
                            audioStream.on('end', () => {
                                setTimeout(() => {
                                    try {
                                        if (fs.existsSync(actualFile)) {
                                            fs.unlinkSync(actualFile);
                                            console.log('🔍 Fichier temporaire supprimé:', actualFile);
                                        }
                                        // Nettoyer aussi le dossier si c'est un dossier
                                        if (fs.existsSync(spotdlDir) && fs.statSync(spotdlDir).isDirectory()) {
                                            fs.rmdirSync(spotdlDir);
                                            console.log('🔍 Dossier temporaire supprimé:', spotdlDir);
                                        }
                                    } catch (error) {
                                        console.log('⚠️ Erreur suppression fichier:', error.message);
                                    }
                                }, 5000);
                            });

                            resolve({
                                stream: audioStream,
                                trackInfo: track,
                                type: 'spotdl-direct'
                            });
                        } else {
                            console.log('❌ Fichier non créé par SpotDL');
                            reject(new Error('Fichier non créé par SpotDL'));
                        }
                    } else if (hasRateLimit) {
                        console.log('❌ SpotDL échoué à cause de la limite de taux');
                        reject(new Error('Limite de taux Spotify atteinte, réessayez plus tard'));
                    } else {
                        console.log('❌ SpotDL échoué, code:', code);
                        reject(new Error(`SpotDL échoué: ${errorOutput}`));
                    }
                });

                spotdlProcess.on('error', (error) => {
                    console.log('❌ Erreur SpotDL:', error.message);
                    reject(new Error(`Erreur SpotDL: ${error.message}`));
                });

                // Timeout plus long pour gérer les limites de taux
                setTimeout(() => {
                    spotdlProcess.kill();
                    reject(new Error('Timeout SpotDL'));
                }, 300000); // 5 minutes
            });
        } catch (error) {
            console.error('❌ Erreur extractWithSpotdl:', error);
            throw error;
        }
    }

    async getYouTubeFallback(track) {
        try {
            console.log('🔍 Fallback YouTube pour:', track.name);
            
            const searchQuery = `${track.artists.map(a => a.name).join(' ')} ${track.name}`;
            console.log('🔍 Recherche YouTube pour:', searchQuery);
            
            return new Promise((resolve, reject) => {
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
                                trackInfo: track,
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
        } catch (error) {
            console.error('❌ Erreur getYouTubeFallback:', error);
            throw error;
        }
    }

    async getSpotifyStream(spotifyUrl) {
        try {
            console.log('🎵 [DEBUG] Récupération des informations Spotify:', spotifyUrl);
            
            const token = await this.authenticate();
            console.log('🔍 [DEBUG] Token pour getSpotifyStream:', token ? 'OUI' : 'NON');
            
            const trackId = spotifyUrl.split('/track/')[1]?.split('?')[0];
            console.log('🔍 [DEBUG] Track ID extrait:', trackId);
            
            if (!trackId) {
                console.log('❌ [DEBUG] URL Spotify invalide, pas de track ID');
                throw new Error('URL Spotify invalide');
            }
            
            const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('🔍 [DEBUG] Réponse API track Spotify, status:', response.status);
            const track = response.data;
            console.log('✅ [DEBUG] Informations Spotify récupérées:', track.name, 'par', track.artists.map(a => a.name).join(', '));
            
            // Utiliser SpotDL pour extraire l'audio
            const streamData = await this.extractWithSpotdl(track);
            console.log('✅ [DEBUG] Stream Spotify créé avec succès, type:', streamData.type);
            
            // Ajouter la date de publication aux métadonnées
            streamData.trackInfo.release_date = track.album.release_date;
            
            return streamData;
        } catch (error) {
            console.error('❌ [DEBUG] Erreur récupération Spotify:', error.message);
            throw new Error(`Impossible de récupérer les informations Spotify: ${error.message}`);
        }
    }

    getBestImage(images) {
        if (!images || images.length === 0) {
            return 'https://via.placeholder.com/300x300/1DB954/FFFFFF?text=No+Image';
        }
        
        // Trier par taille (largeur) et prendre la plus grande
        const sortedImages = images.sort((a, b) => (b.width || 0) - (a.width || 0));
        return sortedImages[0].url;
    }

    isConfigured() {
        return !!(this.clientId && this.clientSecret);
    }
}

module.exports = new SpotdlService();
