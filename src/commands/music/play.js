const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');
const spotifyService = require('../../utils/spotdlService');
const { spawn } = require('child_process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Jouer une musique depuis YouTube, Spotify, Deezer, SoundCloud ou Apple Music')
        .addStringOption(option =>
            option.setName('musique')
                .setDescription('Nom de la musique ou URL à jouer')
                .setRequired(true)),
    
    async execute(interaction) {
        const channel = interaction.member.voice.channel;
        
        if (!channel) {
            return interaction.editReply({
                content: '❌ Vous devez être dans un salon vocal pour utiliser cette commande!',
                flags: 64
            });
        }

        const query = interaction.options.getString('musique');
        
        try {
            console.log('Recherche de:', query);
            
            let videoUrl = query;
            let isSpotifySearch = false;
            let spotifyTrack = null;
            
            // Détecter si c'est une URL ou un nom de musique
            const isUrl = query.includes('http://') || query.includes('https://') || 
                         query.includes('youtube.com') || query.includes('youtu.be') ||
                         query.includes('spotify.com') || query.includes('open.spotify.com');
            
            if (!isUrl) {
                // C'est un nom de musique, utiliser Spotify pour la recherche
                if (!spotifyService.isConfigured()) {
                    return interaction.editReply({
                        content: '❌ Service Spotify non configuré. Veuillez fournir une URL YouTube directe (ex: https://www.youtube.com/watch?v=...)\n\n**Pour configurer Spotify :** Ajoutez SPOTIFY_CLIENT_ID et SPOTIFY_CLIENT_SECRET dans votre .env'
                    });
                }
                
                console.log('🔍 Recherche Spotify pour:', query);
                
                try {
                    console.log('🔍 [DEBUG] Début de la recherche Spotify dans play.js');
                    
                    // Utiliser la nouvelle méthode de recherche et stream Spotify
                    const streamData = await spotifyService.searchAndGetStream(query);
                    console.log('🔍 [DEBUG] Stream data reçu dans play.js');
                    
                    spotifyTrack = streamData.searchResult;
                    console.log('🔍 [DEBUG] Spotify track assigné:', spotifyTrack.title);
                    
                    // Convertir la durée de ms en secondes pour compatibilité
                    spotifyTrack.duration = Math.floor(spotifyTrack.duration_ms / 1000);
                    console.log('🔍 [DEBUG] Durée convertie:', spotifyTrack.duration, 'secondes');
                    
                    isSpotifySearch = true;
                    console.log('🔍 [DEBUG] isSpotifySearch défini à true');
                    
                    console.log('✅ [DEBUG] Musique Spotify trouvée:', spotifyTrack.title, 'par', spotifyTrack.artist);
                    console.log('🎵 [DEBUG] Type de stream:', streamData.streamData.type);
                    
                    // Spotify fonctionne normalement
                    console.log('✅ [DEBUG] Musique Spotify prête à être jouée');
                } catch (error) {
                    console.error('❌ [DEBUG] Erreur recherche Spotify dans play.js:', error.message);
                    console.error('❌ [DEBUG] Stack trace play.js:', error.stack);
                    return interaction.editReply({
                        content: `❌ Erreur lors de la recherche Spotify pour "${query}"\n\n**Erreur :** ${error.message}\n\n**Essayez :**\n• Un nom plus précis\n• Inclure le nom de l'artiste\n• Ou utilisez une URL YouTube directe`
                    });
                }
            } else if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
                // URL mais pas YouTube
                return interaction.editReply({
                    content: '❌ Veuillez fournir une URL YouTube directe (ex: https://www.youtube.com/watch?v=...)\n\n**Pour rechercher :** Tapez simplement le nom de la musique !'
                });
            }

            // Fonction pour obtenir les infos avec yt-dlp
            const getVideoInfo = (url) => {
                return new Promise((resolve, reject) => {
                    const ytdlp = spawn('yt-dlp', [
                        '--dump-json',
                        '--no-playlist',
                        url
                    ]);
                    
                    let data = '';
                    ytdlp.stdout.on('data', (chunk) => {
                        data += chunk;
                    });
                    
                    ytdlp.on('close', (code) => {
                        if (code === 0) {
                            try {
                                const info = JSON.parse(data);
                                resolve(info);
                            } catch (error) {
                                reject(new Error('Erreur de parsing JSON'));
                            }
                        } else {
                            reject(new Error(`yt-dlp a échoué avec le code ${code}`));
                        }
                    });
                    
                    ytdlp.on('error', (error) => {
                        reject(new Error(`yt-dlp non trouvé: ${error.message}`));
                    });
                });
            };

            // Obtenir les informations selon le type de recherche
            let videoInfo;
            
            if (isSpotifySearch) {
                // Utiliser les informations Spotify
                videoInfo = {
                    title: spotifyTrack.title,
                    uploader: spotifyTrack.artist,
                    duration: spotifyTrack.duration,
                    thumbnail: spotifyService.getBestImage(spotifyTrack.images),
                    view_count: null,
                    like_count: null,
                    upload_date: null,
                    formats: null,
                    url: spotifyTrack.url,
                    popularity: spotifyTrack.popularity, // Ajouter la popularité Spotify
                    release_date: spotifyTrack.release_date // Ajouter la date de publication Spotify
                };
                console.log('Informations Spotify obtenues:', videoInfo.title);
            } else {
                // Obtenir les informations YouTube avec yt-dlp
                videoInfo = await getVideoInfo(videoUrl);
                console.log('Informations vidéo obtenues:', videoInfo.title);
            }

            // Rejoindre le salon vocal si pas connecté
            if (!voiceManager.isConnected(interaction.guild)) {
                await voiceManager.joinChannel(channel, interaction.channel);
            }

            // Jouer la musique ou l'ajouter à la queue
            const urlToPlay = isSpotifySearch ? spotifyTrack.url : videoUrl;
            console.log('🔍 [DEBUG] URL à jouer:', urlToPlay);
            console.log('🔍 [DEBUG] isSpotifySearch:', isSpotifySearch);
            console.log('🔍 [DEBUG] videoInfo:', videoInfo ? 'OUI' : 'NON');
            
            console.log('🔍 [DEBUG] Appel de voiceManager.playMusic...');
            const track = await voiceManager.playMusic(interaction.guild, urlToPlay, videoInfo, isSpotifySearch);
            console.log('🔍 [DEBUG] voiceManager.playMusic terminé, track:', track ? track.title : 'NULL');

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

            // Fonction pour formater les vues
            const formatViews = (views) => {
                if (!views) return 'Inconnues';
                if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)}B`;
                if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
                if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
                return views.toString();
            };

            // Fonction pour formater les streams Spotify (basé sur la popularité)
            const formatSpotifyStreams = (popularity) => {
                if (!popularity) return 'Inconnues';
                
                // La popularité Spotify va de 0 à 100
                // On peut estimer les streams basés sur cette popularité
                // Popularité 100 = ~1B streams, 50 = ~100M, 25 = ~10M, etc.
                const estimatedStreams = Math.pow(10, (popularity / 10) - 1);
                
                if (estimatedStreams >= 1000000000) return `${(estimatedStreams / 1000000000).toFixed(1)}B`;
                if (estimatedStreams >= 1000000) return `${(estimatedStreams / 1000000).toFixed(1)}M`;
                if (estimatedStreams >= 1000) return `${(estimatedStreams / 1000).toFixed(1)}K`;
                return Math.floor(estimatedStreams).toString();
            };

            // Fonction pour nettoyer l'uploader
            const cleanUploader = (uploader) => {
                if (!uploader) return 'Inconnu';
                return uploader
                    .replace(/\s*(TV|Officiel|Official|Music|VEVO|VEVO Music|VEVO Music Group)\s*/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            };

            // Fonction pour obtenir la qualité audio
            const getAudioQuality = (formats) => {
                if (!formats || !Array.isArray(formats)) return 'Standard';
                const audioFormats = formats.filter(f => f.acodec && f.acodec !== 'none');
                if (audioFormats.length === 0) return 'Standard';
                
                const bestAudio = audioFormats.reduce((best, current) => {
                    const currentBitrate = current.abr || 0;
                    const bestBitrate = best.abr || 0;
                    return currentBitrate > bestBitrate ? current : best;
                });
                
                if (bestAudio.abr >= 256) return '🎵 Haute qualité';
                if (bestAudio.abr >= 128) return '🎶 Qualité standard';
                return '🔊 Qualité basse';
            };

            // Fonction pour obtenir le statut de lecture
            const getPlayStatus = () => {
                if (voiceManager.isPlaying(interaction.guild)) {
                    return '🎵 **En cours de lecture**';
                } else if (voiceManager.isPaused(interaction.guild)) {
                    return '⏸️ **En pause**';
                } else {
                    return '▶️ **Prêt à jouer**';
                }
            };

            // Fonction pour obtenir les informations de la queue
            const getQueueInfo = () => {
                const queue = voiceManager.getQueue(interaction.guild);
                const currentTrack = voiceManager.getCurrentTrack(interaction.guild);
                const queueLength = queue.length;
                
                if (queueLength === 0 && !currentTrack) {
                    return 'Aucune musique en queue';
                }
                
                let info = `**${queueLength}** musique${queueLength > 1 ? 's' : ''} en attente`;
                
                if (currentTrack) {
                    info += `\n🎵 **Actuellement:** ${currentTrack.title}`;
                }
                
                if (queueLength > 0) {
                    info += `\n⏭️ **Suivante:** ${queue[0].title}`;
                }
                
                return info;
            };

            // Créer l'embed avec toutes les informations
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B') // Couleur rose élégante
                .setTitle('🎵 Informations de la musique')
                .setDescription(`**[${videoInfo.title}](${isSpotifySearch ? spotifyTrack.url : videoUrl})**`)
                .addFields(
                    { 
                        name: '👤 **Artiste**', 
                        value: cleanUploader(videoInfo.uploader), 
                        inline: true 
                    },
                    { 
                        name: '⏱️ **Durée**', 
                        value: formatDuration(videoInfo.duration), 
                        inline: true 
                    },
                    { 
                        name: '📺 **Plateforme**', 
                        value: isSpotifySearch ? '🎵 Spotify' : '🎥 YouTube', 
                        inline: true 
                    },
                    { 
                        name: isSpotifySearch ? '🎧 **Écoutes**' : '👀 **Vues**', 
                        value: isSpotifySearch ? formatSpotifyStreams(videoInfo.popularity) : formatViews(videoInfo.view_count), 
                        inline: true 
                    },
                    ...(isSpotifySearch ? [] : [{
                        name: '👍 **Likes**',
                        value: formatViews(videoInfo.like_count),
                        inline: true
                    }]),
                    {
                        name: '📅 **Date de publication**',
                        value: isSpotifySearch ? (videoInfo.release_date || 'Inconnue') : 
                            (videoInfo.upload_date ? 
                                `${videoInfo.upload_date.slice(6,8)}/${videoInfo.upload_date.slice(4,6)}/${videoInfo.upload_date.slice(0,4)}` : 
                                'Inconnue'),
                        inline: true
                    },
                    { 
                        name: '🎵 **Qualité audio**', 
                        value: getAudioQuality(videoInfo.formats), 
                        inline: true 
                    },
                    { 
                        name: '🔊 **Volume**', 
                        value: `${voiceManager.getVolume(interaction.guild) || 100}%`, 
                        inline: true 
                    },
                    { 
                        name: '🔄 **Mode de lecture**', 
                        value: voiceManager.getLoopMode(interaction.guild) || 'Normal', 
                        inline: true 
                    },
                    { 
                        name: '📊 **Statut**', 
                        value: getPlayStatus(), 
                        inline: false 
                    },
                    { 
                        name: '📋 **Queue**', 
                        value: getQueueInfo(), 
                        inline: false 
                    }
                )
                .setThumbnail(videoInfo.thumbnail || 'https://via.placeholder.com/150')
                .setImage(videoInfo.thumbnail || 'https://via.placeholder.com/600x400')
                .setFooter({ 
                    text: `🎤 Demandé par ${interaction.user.tag} • ${new Date().toLocaleString('fr-FR')}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            // Créer les boutons d'action
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('lyrics_button')
                        .setLabel('Paroles')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎤'),
                    new ButtonBuilder()
                        .setCustomId('skip_button')
                        .setLabel('Skip')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('⏭️'),
                    new ButtonBuilder()
                        .setCustomId('queue_button')
                        .setLabel('Queue')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📋'),
                    new ButtonBuilder()
                        .setCustomId('nowplaying_button')
                        .setLabel('Now Playing')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🎶')
                );

            const reply = await interaction.editReply({ 
                embeds: [embed], 
                components: [actionRow] 
            });
            
            // Ajouter le message à la liste de surveillance pour suppression automatique
            const autoDeleteManager = require('../../utils/autoDeleteManager');
            autoDeleteManager.addMusicMessage(interaction.guild.id, reply);

        } catch (error) {
            console.error('Erreur dans la commande play:', error);
            return interaction.editReply({
                content: `❌ Une erreur est survenue: ${error.message}`
            });
        }
    }
};