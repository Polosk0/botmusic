const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, entersState, getVoiceConnection } = require('@discordjs/voice');
const { spawn } = require('child_process');
const LeaderboardTracker = require('./enhancedLeaderboardTracker');
const MusicTracker = require('./musicTracker');
const spotifyService = require('./spotdlService');

class VoiceManager {
    constructor() {
        this.connections = new Map(); // guildId -> connection
        this.players = new Map(); // guildId -> player
        this.processes = new Map(); // guildId -> ytdlpProcess
        this.volumes = new Map(); // guildId -> volume (0-1)
        this.queues = new Map(); // guildId -> queue array
        this.currentTrack = new Map(); // guildId -> current track info
        this.isLooping = new Map(); // guildId -> loop mode
        this.isShuffled = new Map(); // guildId -> shuffle state
        this.textChannels = new Map(); // guildId -> text channel
        this.musicMessages = new Map(); // guildId -> array of message objects with timestamps
        this.playStartTimes = new Map(); // guildId -> timestamp when music started playing
        
        // Démarrer le nettoyage périodique toutes les 5 minutes
        this.startPeriodicCleanup();
    }

    async joinChannel(channel, textChannel = null) {
        const guildId = channel.guild.id;
        
        // Si déjà connecté, déconnecter d'abord
        if (this.connections.has(guildId)) {
            await this.leaveChannel(channel.guild);
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
        
        const player = createAudioPlayer();
        
        // Gestion d'erreur pour le player
        player.on('error', (error) => {
            // Ignorer les erreurs de stream prématuré (normales)
            if (!error.message.includes('Premature close')) {
                console.error('Erreur du player audio:', error);
            }
        });

        connection.subscribe(player);

        this.connections.set(guildId, connection);
        this.players.set(guildId, player);

        // Initialiser la queue et les états
        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, []);
        }
        this.isLooping.set(guildId, false);
        this.isShuffled.set(guildId, false);
        
        // Stocker le canal de texte si fourni
        if (textChannel) {
            this.textChannels.set(guildId, textChannel);
        }

        return { connection, player };
    }

    async leaveChannel(guild) {
        const guildId = guild.id;
        
        // Tuer le processus yt-dlp s'il existe
        if (this.processes.has(guildId)) {
            this.processes.get(guildId).kill();
            this.processes.delete(guildId);
        }

        // Déconnecter seulement si la connexion existe et n'est pas déjà détruite
        if (this.connections.has(guildId)) {
            const connection = this.connections.get(guildId);
            try {
                // Vérifier l'état de la connexion avant de la détruire
                if (connection.state.status !== 'destroyed' && connection.state.status !== 'disconnected') {
                    console.log(`🔌 Déconnexion de la voix pour guild: ${guild.name}`);
                    connection.destroy();
                } else {
                    console.log(`🔌 Connexion déjà détruite pour guild: ${guild.name}`);
                }
            } catch (error) {
                console.log(`⚠️ Erreur lors de la déconnexion (connexion déjà détruite): ${error.message}`);
            }
            this.connections.delete(guildId);
            this.players.delete(guildId);
        }

        // Nettoyer la queue et les états
        this.queues.delete(guildId);
        this.currentTrack.delete(guildId);
        this.isLooping.delete(guildId);
        this.isShuffled.delete(guildId);
        this.volumes.delete(guildId);
        this.textChannels.delete(guildId);
        this.musicMessages.delete(guildId);
    }

    async addToQueue(guild, videoInfo, videoUrl) {
        const guildId = guild.id;
        
        const track = {
            title: videoInfo.title,
            url: videoUrl,
            duration: videoInfo.duration,
            thumbnail: videoInfo.thumbnail,
            uploader: videoInfo.uploader,
            addedBy: guild.members.cache.get(guild.members.cache.firstKey())?.user.tag || 'Inconnu'
        };

        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, []);
        }

        this.queues.get(guildId).push(track);
        return track;
    }

    async playMusic(guild, videoUrl, videoInfo = null, isSpotifySearch = false) {
        const guildId = guild.id;
        console.log('🔍 [DEBUG] playMusic appelé, guildId:', guildId);
        console.log('🔍 [DEBUG] videoUrl:', videoUrl);
        console.log('🔍 [DEBUG] isSpotifySearch:', isSpotifySearch);
        console.log('🔍 [DEBUG] videoInfo:', videoInfo ? videoInfo.title : 'NULL');
        
        if (!this.connections.has(guildId)) {
            console.log('❌ [DEBUG] Bot pas connecté au salon vocal');
            throw new Error('Bot pas connecté au salon vocal');
        }

        // Créer la track
        const track = {
            title: videoInfo.title,
            url: videoUrl,
            duration: videoInfo.duration,
            thumbnail: videoInfo.thumbnail,
            uploader: videoInfo.uploader,
            isSpotify: isSpotifySearch
        };
        console.log('🔍 [DEBUG] Track créée:', track.title, 'isSpotify:', track.isSpotify);

        // Si pas de musique en cours, jouer immédiatement
        const isCurrentlyPlaying = this.isPlaying(guild);
        console.log('🔍 [DEBUG] Musique en cours:', isCurrentlyPlaying);
        
        if (!isCurrentlyPlaying) {
            console.log('🔍 [DEBUG] Pas de musique en cours, appel de playNext...');
            return await this.playNext(guild, videoUrl, videoInfo, isSpotifySearch);
        } else {
            console.log('🔍 [DEBUG] Musique en cours, ajout à la queue');
            // Ajouter à la queue
            if (!this.queues.has(guildId)) {
                this.queues.set(guildId, []);
            }
            this.queues.get(guildId).push(track);
            console.log('🔍 [DEBUG] Track ajoutée à la queue');
            return track;
        }
    }

    async playNext(guild, videoUrl = null, videoInfo = null, isSpotifySearch = false) {
        const guildId = guild.id;
        const queue = this.queues.get(guildId) || [];
        
        let track;
        let urlToPlay;
        
        if (videoUrl && videoInfo) {
            // Musique directe (première musique)
            track = {
                title: videoInfo.title,
                url: videoUrl,
                duration: videoInfo.duration,
                thumbnail: videoInfo.thumbnail,
                uploader: videoInfo.uploader,
                isSpotify: isSpotifySearch
            };
            urlToPlay = videoUrl;
        } else if (queue.length > 0) {
            // Prendre la première de la queue
            track = queue.shift();
            // Mettre à jour la queue dans le Map
            this.queues.set(guildId, queue);
            urlToPlay = track.url;
        } else {
            // Pas de musique à jouer - arrêter
            this.currentTrack.delete(guildId);
            return null;
        }

        const player = this.players.get(guildId);
        
        // Tuer l'ancien processus s'il existe
        if (this.processes.has(guildId)) {
            this.processes.get(guildId).kill();
        }

        // Gérer les URLs selon leur type
        let audioResource;
        
        if (track.isSpotify || urlToPlay.includes('spotify.com')) {
            console.log('🎵 [DEBUG] URL Spotify détectée, extraction directe...');
            
            try {
                console.log('🔍 [DEBUG] Appel de spotifyService.getSpotifyStream...');
                // Utiliser le service Spotify pour obtenir le stream direct
                const streamData = await spotifyService.getSpotifyStream(urlToPlay);
                console.log('🔍 [DEBUG] Stream data reçu dans voiceManager');
                console.log('🔍 [DEBUG] Stream data type:', streamData.type);
                console.log('🔍 [DEBUG] Stream data stream:', streamData.stream ? 'OUI' : 'NON');
                
                // Le stream est déjà un Readable stream, l'utiliser directement
                const audioStream = streamData.stream;
                console.log('🔍 [DEBUG] Audio stream extrait, type:', audioStream.constructor.name);
                console.log('🔍 [DEBUG] Type de stream data:', streamData.type);
                
                console.log('🔍 [DEBUG] Création de la ressource audio...');
                
                // Gérer différemment selon le type de stream
                if (streamData.type === 'youtube-with-spotify-metadata') {
                    // Stream YouTube avec métadonnées Spotify
                    audioResource = createAudioResource(audioStream, {
                        inputType: 'arbitrary',
                        volume: this.volumes.get(guildId) || 1.0
                    });
                    console.log('🔍 [DEBUG] Ressource audio YouTube créée avec métadonnées Spotify');
                } else if (streamData.type === 'spotify-simulated-stream') {
                    // Stream Spotify simulé (fichier temporaire)
                    audioResource = createAudioResource(audioStream, {
                        inputType: 'arbitrary',
                        volume: this.volumes.get(guildId) || 1.0,
                        inlineVolume: true
                    });
                    console.log('🔍 [DEBUG] Ressource audio Spotify simulée créée');
                } else if (streamData.type === 'librespot-direct') {
                    // Stream Librespot direct (audio réel Spotify)
                    audioResource = createAudioResource(audioStream, {
                        inputType: 'arbitrary',
                        volume: this.volumes.get(guildId) || 1.0,
                        inlineVolume: true
                    });
                    console.log('🔍 [DEBUG] Ressource audio Librespot créée');
                } else if (streamData.type === 'spotdl-direct') {
                    // Stream SpotDL direct (audio réel Spotify)
                    audioResource = createAudioResource(audioStream, {
                        inputType: 'arbitrary',
                        volume: this.volumes.get(guildId) || 1.0,
                        inlineVolume: true
                    });
                    console.log('🔍 [DEBUG] Ressource audio SpotDL créée');
                } else {
                    // Stream Spotify (preview ou autres)
                    audioResource = createAudioResource(audioStream, {
                        inputType: 'arbitrary',
                        volume: this.volumes.get(guildId) || 1.0
                    });
                    console.log('🔍 [DEBUG] Ressource audio Spotify créée');
                }
                
                console.log(`✅ [DEBUG] Stream ${streamData.type} créé avec succès`);
                
                // Stream Spotify prêt
                console.log('🎵 [DEBUG] Stream Spotify configuré avec succès');
            } catch (error) {
                console.error('❌ [DEBUG] Erreur extraction Spotify dans voiceManager:', error.message);
                console.error('❌ [DEBUG] Stack trace voiceManager:', error.stack);
                throw new Error(`Impossible de lire la musique Spotify: ${error.message}`);
            }
        } else {
            console.log('🎥 URL YouTube détectée, extraction avec yt-dlp...');
            
            // Créer le nouveau processus yt-dlp pour YouTube
            const ytdlpProcess = spawn('yt-dlp', [
                '-f', 'bestaudio',
                '--no-playlist',
                '-o', '-',
                urlToPlay
            ], { stdio: ['ignore', 'pipe', 'ignore'] });

            this.processes.set(guildId, ytdlpProcess);
            
            // Créer la ressource audio depuis le stream YouTube
            audioResource = createAudioResource(ytdlpProcess.stdout, {
                inputType: 'arbitrary',
                volume: this.volumes.get(guildId) || 1.0
            });
        }

        // La ressource audio est déjà créée selon le type (Spotify ou YouTube)

        // Démarrer le tracking du temps de diffusion
        this.playStartTimes.set(guildId, Date.now());
        
        // Mettre à jour le tracker de musique pour le leaderboard
        LeaderboardTracker.updateMusicPlayTime(15); // 15 secondes par défaut

        // Gestion d'erreur pour éviter les logs d'erreur
        audioResource.playStream.on('error', (error) => {
            // Ignorer les erreurs de stream prématuré (normales)
            if (!error.message.includes('Premature close')) {
                console.error('Erreur de stream audio:', error);
            }
        });

        // Supprimer tous les anciens listeners stateChange
        player.removeAllListeners('stateChange');
        
        // Gérer la fin de la musique
        player.on('stateChange', (oldState, newState) => {
            if (newState.status === 'idle' && oldState.status === 'playing') {
                console.log('🎵 Musique terminée');
                
                // Mettre à jour le temps de diffusion du bot
                if (this.playStartTimes.has(guildId)) {
                    const playTime = Math.floor((Date.now() - this.playStartTimes.get(guildId)) / 1000);
                    LeaderboardTracker.updateMusicPlayTime(playTime);
                    this.playStartTimes.delete(guildId);
                }
                
                // Si en mode loop, remettre la musique en queue
                if (this.isLooping.get(guildId) && track) {
                    this.queues.get(guildId).unshift(track);
                }
                
                // Vérifier s'il y a une musique suivante
                const remainingQueue = this.queues.get(guildId) || [];
                if (remainingQueue.length > 0) {
                    // Jouer la suivante immédiatement
                    this.playNext(guild).then(nextTrack => {
                        // Envoyer les boutons seulement lors des changements automatiques
                        if (nextTrack) {
                            this.sendMusicButtons(guild, nextTrack);
                        }
                    });
                } else {
                    // Plus de musique - arrêter
                    console.log(`🛑 VoiceManager: Suppression currentTrack pour guildId=${guildId} (fin de queue)`);
                    this.currentTrack.delete(guildId);
                    MusicTracker.clearCurrentTrack(guildId);
                }
            }
        });

        // Sauvegarder la track actuelle AVANT de jouer (dans les deux systèmes)
        console.log(`🎵 [DEBUG] VoiceManager: Définition currentTrack pour guildId=${guildId}, titre=${track.title}`);
        this.currentTrack.set(guildId, track);
        MusicTracker.setCurrentTrack(guildId, track);
        
        console.log('🔍 [DEBUG] Démarrage de la lecture avec player.play()...');
        console.log('🔍 [DEBUG] AudioResource créée:', audioResource ? 'OUI' : 'NON');
        console.log('🔍 [DEBUG] Player disponible:', player ? 'OUI' : 'NON');
        
        player.play(audioResource);
        console.log('🔍 [DEBUG] player.play() appelé');
        
        // Ajouter des listeners pour debug
        audioResource.playStream.on('error', (error) => {
            console.error('❌ [DEBUG] Erreur playStream:', error.message);
        });
        
        audioResource.playStream.on('end', () => {
            console.log('🔍 [DEBUG] playStream terminé');
        });
        
        audioResource.playStream.on('start', () => {
            console.log('🔍 [DEBUG] playStream démarré');
        });

        return track;
    }

    pause(guild) {
        const guildId = guild.id;
        if (this.players.has(guildId)) {
            this.players.get(guildId).pause();
        }
    }

    resume(guild) {
        const guildId = guild.id;
        if (this.players.has(guildId)) {
            this.players.get(guildId).unpause();
        }
    }

    stop(guild) {
        const guildId = guild.id;
        
        // Tuer le processus yt-dlp
        if (this.processes.has(guildId)) {
            this.processes.get(guildId).kill();
            this.processes.delete(guildId);
        }

        // Arrêter le player
        if (this.players.has(guildId)) {
            this.players.get(guildId).stop();
        }

        // Vider la queue et supprimer la track actuelle
        this.queues.set(guildId, []);
        this.currentTrack.delete(guildId);
    }

    setVolume(guild, volume) {
        const guildId = guild.id;
        const volumeValue = volume / 100; // Convertir de 0-100 à 0-1
        
        // Sauvegarder le volume pour la prochaine musique
        this.volumes.set(guildId, volumeValue);
        
        // Note: Le volume sera appliqué à la prochaine musique jouée
        // @discordjs/voice ne permet pas de changer le volume d'une ressource en cours
    }

    isConnected(guild) {
        const guildId = guild.id;
        return this.connections.has(guildId);
    }

    // Méthode spécifique pour vérifier les connexions YouTube (sans radio)
    isYouTubeConnected(guild) {
        const guildId = guild.id;
        
        // Vérifier d'abord si c'est une connexion radio
        try {
            const radioModule = require('../commands/music/radio');
            if (radioModule.radioState && radioModule.radioState.connection && radioModule.radioState.connection.joinConfig.guildId === guildId) {
                console.log(`📻 Connexion radio détectée pour guild: ${guild.name}, ne pas considérer comme connexion YouTube`);
                return false; // Ne pas considérer les connexions radio comme des connexions YouTube
            }
        } catch (error) {
            // Ignorer les erreurs de module
        }
        
        return this.connections.has(guildId);
    }

    isPlaying(guild) {
        const guildId = guild.id;
        if (this.players.has(guildId)) {
            return this.players.get(guildId).state.status === 'playing';
        }
        return false;
    }

    isPaused(guild) {
        const guildId = guild.id;
        if (this.players.has(guildId)) {
            return this.players.get(guildId).state.status === 'paused';
        }
        return false;
    }

    getVolume(guild) {
        const guildId = guild.id;
        const volume = this.volumes.get(guildId) || 1.0;
        return Math.round(volume * 100); // Convertir de 0-1 à 0-100
    }

    // Méthodes de queue
    getQueue(guild) {
        return this.queues.get(guild.id) || [];
    }

    getCurrentTrack(guildOrId) {
        const guildId = typeof guildOrId === 'string' ? guildOrId : guildOrId.id;
        
        // Essayer d'abord le MusicTracker (plus fiable)
        const musicTrackerTrack = MusicTracker.getCurrentTrack(guildId);
        if (musicTrackerTrack) {
            console.log(`🎵 VoiceManager.getCurrentTrack: Track trouvée via MusicTracker - ${musicTrackerTrack.title}`);
            return musicTrackerTrack;
        }
        
        // Fallback sur l'ancien système
        const current = this.currentTrack.get(guildId);
        console.log(`🔍 VoiceManager.getCurrentTrack: guildId=${guildId}, current=${current ? 'TROUVÉ' : 'NULL'} (fallback)`);
        if (current) {
            console.log(`🔍 Track trouvée: ${current.title} par ${current.uploader}`);
        }
        
        return current;
    }

    async skip(guild) {
        const guildId = guild.id;
        if (this.players.has(guildId)) {
            this.players.get(guildId).stop();
            // playNext sera appelé automatiquement par l'event stateChange
            // Mais on peut aussi l'appeler directement pour être sûr
            setTimeout(() => {
                this.playNext(guild);
            }, 500);
        }
    }

    shuffle(guild) {
        const guildId = guild.id;
        const queue = this.queues.get(guildId) || [];
        
        // Mélanger la queue (algorithme Fisher-Yates)
        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }
        
        this.isShuffled.set(guildId, true);
    }

    clearQueue(guild) {
        const guildId = guild.id;
        this.queues.set(guildId, []);
    }

    removeFromQueue(guild, index) {
        const guildId = guild.id;
        const queue = this.queues.get(guildId) || [];
        
        if (index >= 0 && index < queue.length) {
            return queue.splice(index, 1)[0];
        }
        return null;
    }

    setLoop(guild, mode) {
        const guildId = guild.id;
        this.isLooping.set(guildId, mode);
    }

    getLoopMode(guild) {
        return this.isLooping.get(guild.id) || false;
    }

    getShuffleState(guild) {
        return this.isShuffled.get(guild.id) || false;
    }

    async sendMusicButtons(guild, track) {
        const guildId = guild.id;
        const textChannel = this.textChannels.get(guildId);
        
        if (!textChannel || !track) return;

        // Supprimer TOUS les anciens messages de musique avant d'en créer de nouveaux
        await this.cleanupOldMusicMessages(guildId, true);

        try {
            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            
            // Fonction pour formater la durée
            const formatDuration = (seconds) => {
                if (!seconds) return 'Inconnue';
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                
                if (hours > 0) {
                    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                } else {
                    return `${minutes}:${secs.toString().padStart(2, '0')}`;
                }
            };

            // Fonction pour nettoyer l'uploader
            const cleanUploader = (uploader) => {
                if (!uploader) return 'Inconnu';
                return uploader
                    .replace(/\s*(TV|Officiel|Official|Music|VEVO|VEVO Music|VEVO Music Group)\s*/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            };

            // Créer l'embed
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('🎵 Nouvelle musique en cours')
                .setDescription(`**[${track.title}](${track.url})**`)
                .addFields(
                    { name: '👤 **Artiste**', value: cleanUploader(track.uploader), inline: true },
                    { name: '⏱️ **Durée**', value: formatDuration(track.duration), inline: true },
                    { name: '🔊 **Volume**', value: `${this.getVolume(guild)}%`, inline: true }
                )
                .setThumbnail(track.thumbnail || 'https://via.placeholder.com/150')
                .setFooter({ text: '🎵 Bot Musical' })
                .setTimestamp();

            // Générer un ID unique pour cette musique
            const musicId = `${guildId}_${Date.now()}`;
            
            // Créer les boutons avec des IDs uniques
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`lyrics_button_${musicId}`)
                        .setLabel('Paroles')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎤'),
                    new ButtonBuilder()
                        .setCustomId(`skip_button_${musicId}`)
                        .setLabel('Skip')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('⏭️'),
                    new ButtonBuilder()
                        .setCustomId(`queue_button_${musicId}`)
                        .setLabel('Queue')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📋'),
                    new ButtonBuilder()
                        .setCustomId(`nowplaying_button_${musicId}`)
                        .setLabel('Now Playing')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🎶')
                );

            const sentMessage = await textChannel.send({ 
                embeds: [embed], 
                components: [actionRow] 
            });
            
            // Ajouter le message à la liste de surveillance pour suppression automatique
            this.addMusicMessage(guildId, sentMessage);
        } catch (error) {
            console.error('Erreur lors de l\'envoi des boutons:', error);
        }
    }

    // Méthode pour ajouter un message à la liste de surveillance
    addMusicMessage(guildId, message) {
        if (!this.musicMessages.has(guildId)) {
            this.musicMessages.set(guildId, []);
        }
        
        this.musicMessages.get(guildId).push({
            message: message,
            timestamp: Date.now()
        });
        
        // Programmer la suppression après 2 minutes
        setTimeout(() => {
            this.deleteOldMusicMessage(guildId, message);
        }, 120000); // 120 secondes (2 minutes)
    }

    // Méthode pour supprimer un message spécifique
    async deleteOldMusicMessage(guildId, messageToDelete) {
        try {
            const messages = this.musicMessages.get(guildId);
            if (!messages) return;

            // Trouver et supprimer le message de la liste
            const index = messages.findIndex(msg => msg.message.id === messageToDelete.id);
            if (index !== -1) {
                messages.splice(index, 1);
                
                // Supprimer le message de Discord
                await messageToDelete.delete();
                console.log('🗑️ Message de musique supprimé automatiquement');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du message:', error);
        }
    }

    // Méthode pour nettoyer tous les anciens messages d'une guild
    async cleanupOldMusicMessages(guildId, deleteAll = false) {
        try {
            const messages = this.musicMessages.get(guildId);
            if (!messages) return;

            const now = Date.now();
            const twoMinutesAgo = now - 120000; // 2 minutes en millisecondes

            for (let i = messages.length - 1; i >= 0; i--) {
                const msgData = messages[i];
                // Si deleteAll est true, supprimer tous les messages
                // Sinon, supprimer seulement ceux de plus de 2 minutes
                if (deleteAll || msgData.timestamp < twoMinutesAgo) {
                    try {
                        await msgData.message.delete();
                        messages.splice(i, 1);
                        console.log('🗑️ Ancien message de musique supprimé');
                    } catch (error) {
                        console.error('Erreur lors de la suppression:', error);
                        messages.splice(i, 1); // Supprimer de la liste même si la suppression échoue
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors du nettoyage des messages:', error);
        }
    }

    // Méthode pour démarrer le nettoyage périodique
    startPeriodicCleanup() {
        // Nettoyer toutes les 5 minutes
        setInterval(() => {
            console.log('🧹 Nettoyage périodique des anciens messages de musique...');
            
            for (const guildId of this.musicMessages.keys()) {
                this.cleanupOldMusicMessages(guildId);
            }
        }, 300000); // 5 minutes en millisecondes
    }

    // Méthode pour détecter si c'est une station radio
    isRadioStation(guildId) {
        const connection = this.connections.get(guildId);
        if (!connection) {
            console.log(`❌ Pas de connexion pour guildId: ${guildId}`);
            return false;
        }
        
        // Vérifier si c'est vraiment une station radio en regardant le système de radio
        try {
            const radioModule = require('../commands/music/radio');
            if (radioModule && radioModule.radioState && radioModule.radioState.currentStation && radioModule.radioState.connection) {
                console.log(`📻 Station radio détectée: ${radioModule.radioState.currentStation.name}`);
                return true;
            }
        } catch (error) {
            console.log(`❌ Erreur lors de la vérification de la station radio: ${error.message}`);
        }
        
        // Si connecté mais pas de track ET pas de système de radio actif, 
        // c'est probablement une station radio
        const track = this.getCurrentTrack(guildId);
        const isRadio = connection.state.status === 'ready' && !track;
        console.log(`🔍 Vérification radio: connection=${connection.state.status}, track=${track ? 'OUI' : 'NON'}, isRadio=${isRadio}`);
        return isRadio;
    }

    // Méthode pour obtenir le nom de la station radio
    getRadioStationName(guildId) {
        try {
            // Essayer de récupérer le nom depuis le système de radio
            const radioModule = require('../commands/music/radio');
            if (radioModule && radioModule.radioState && radioModule.radioState.currentStation) {
                console.log(`📻 Station radio trouvée: ${radioModule.radioState.currentStation.name}`);
                return radioModule.radioState.currentStation.name;
            }
        } catch (error) {
            console.log(`❌ Erreur lors de la récupération de la station radio: ${error.message}`);
        }
        
        // Fallback générique
        console.log(`📻 Fallback: Station Radio générique`);
        return 'Station Radio';
    }
}

module.exports = new VoiceManager();
