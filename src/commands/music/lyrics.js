const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');
const geniusService = require('../../utils/geniusService');
const autoDeleteManager = require('../../utils/autoDeleteManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Afficher les paroles de la musique en cours'),
    
    async execute(interaction) {
        if (!voiceManager.isConnected(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Le bot n\'est pas connecté à un salon vocal!',
                flags: 64
            });
        }

        if (!voiceManager.isPlaying(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Aucune musique n\'est en cours de lecture!',
                flags: 64
            });
        }

        const track = voiceManager.getCurrentTrack(interaction.guild);

        if (!track) {
            return interaction.editReply({
                content: '❌ Aucune musique n\'est en cours de lecture!',
                flags: 64
            });
        }

        try {
            // Améliorer la recherche en simplifiant la requête
            let searchQuery = track.title;
            
            // Si c'est une track Spotify, les données sont déjà propres
            if (track.isSpotify) {
                // Pour Spotify, utiliser directement le titre et l'artiste
                searchQuery = `${track.uploader} ${track.title}`;
                console.log('🎵 Recherche de paroles pour track Spotify:', searchQuery);
            } else {
                // Nettoyer le titre des mots-clés YouTube
                searchQuery = searchQuery
                    .replace(/\[.*?\]/g, '') // Supprimer [Clip Officiel], [Official Video], etc.
                    .replace(/\(.*?\)/g, '') // Supprimer (Official), (Music Video), etc.
                    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
                    .trim();
                
                // Si on a un artiste, l'ajouter pour améliorer la recherche (mais nettoyer d'abord)
                if (track.uploader && !searchQuery.toLowerCase().includes(track.uploader.toLowerCase())) {
                    // Nettoyer l'uploader des mots-clés YouTube
                    let cleanUploader = track.uploader
                        .replace(/\s*(TV|Officiel|Official|Music|VEVO|VEVO Music|VEVO Music Group)\s*/gi, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    
                    // Ne pas ajouter si c'est trop court ou contient des caractères suspects
                    if (cleanUploader.length > 2 && !cleanUploader.match(/^\d+[a-zA-Z]+\d+$/)) {
                        searchQuery = `${cleanUploader} ${searchQuery}`;
                    }
                }
            }
            
            console.log('🔍 Recherche de paroles pour:', searchQuery);
            
            const songInfo = await geniusService.getSongInfo(searchQuery);
            
            if (!songInfo) {
                // Essayer une recherche plus simple avec juste le titre principal
                const simpleTitle = track.title.split(' - ')[0] || track.title.split(' – ')[0] || track.title;
                console.log('🔄 Tentative avec titre simplifié:', simpleTitle);
                
                const simpleSongInfo = await geniusService.getSongInfo(simpleTitle);
                
                if (!simpleSongInfo) {
                    const embed = new EmbedBuilder()
                        .setColor('#ffaa00')
                        .setTitle('❌ Paroles non trouvées')
                        .setDescription(`**${track.title}**\n\nAucune parole trouvée pour cette musique sur Genius.\n\n*Essayez avec une musique plus populaire ou vérifiez l'orthographe.*`)
                        .setThumbnail(track.thumbnail || 'https://via.placeholder.com/150')
                        .setFooter({ text: `Demandé par ${interaction.user.tag}` })
                        .setTimestamp();
                    
                    const reply = await interaction.editReply({ embeds: [embed] });
                    
                    // Ajouter le message à la liste de surveillance pour suppression automatique
                    autoDeleteManager.addMusicMessage(interaction.guild.id, reply);
                    
                    return reply;
                }
                
                // Utiliser le résultat de la recherche simplifiée
                const lyrics = await geniusService.getLyrics(simpleSongInfo.id);
                
                if (!lyrics) {
                    const embed = new EmbedBuilder()
                        .setColor('#ffaa00')
                        .setTitle('❌ Paroles non disponibles')
                        .setDescription(`**${simpleSongInfo.title}** par **${simpleSongInfo.artist}**\n\nLes paroles ne sont pas disponibles pour cette musique.`)
                        .setThumbnail(simpleSongInfo.thumbnail || 'https://via.placeholder.com/150')
                        .setFooter({ text: `Demandé par ${interaction.user.tag}` })
                        .setTimestamp();
                    
                    const reply = await interaction.editReply({ embeds: [embed] });
                    
                    // Ajouter le message à la liste de surveillance pour suppression automatique
                    autoDeleteManager.addMusicMessage(interaction.guild.id, reply);
                    
                    return reply;
                }

                // Formater et diviser les paroles de manière plus intelligente
                const formattedLyrics = formatLyrics(lyrics);
                const lyricsParts = splitLyricsIntelligently(formattedLyrics);

                // Afficher les paroles avec le résultat simplifié dans un bel embed
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B') // Couleur rose élégante
                    .setTitle('🎵 Paroles de la chanson')
                    .setDescription(`**${simpleSongInfo.title}** par **${simpleSongInfo.artist}**`)
                    .setThumbnail(simpleSongInfo.thumbnail || 'https://via.placeholder.com/150')
                    .setFooter({ 
                        text: `🎤 Source: Genius • Demandé par ${interaction.user.tag}`,
                        iconURL: 'https://genius.com/favicon.ico'
                    })
                    .setTimestamp();

                // Ajouter chaque partie des paroles comme un champ séparé avec des couleurs différentes
                lyricsParts.forEach((part, index) => {
                    const colors = ['🎵', '🎶', '🎼', '🎭', '🌉', '🎤'];
                    const colorEmoji = colors[index % colors.length];
                    const fieldName = lyricsParts.length > 1 ? `${colorEmoji} Paroles (${index + 1}/${lyricsParts.length})` : '🎵 Paroles';
                    
                    embed.addFields({
                        name: fieldName,
                        value: `\`\`\`\n${part}\n\`\`\``,
                        inline: false
                    });
                });

                return interaction.editReply({ embeds: [embed] });
            }

            // Récupérer les paroles
            const lyrics = await geniusService.getLyrics(songInfo.id);
            
            if (!lyrics) {
                const embed = new EmbedBuilder()
                    .setColor('#ffaa00')
                    .setTitle('❌ Paroles non disponibles')
                    .setDescription(`**${songInfo.title}** par **${songInfo.artist}**\n\nLes paroles ne sont pas disponibles pour cette musique.`)
                    .setThumbnail(songInfo.thumbnail || 'https://via.placeholder.com/150')
                    .setFooter({ text: `Demandé par ${interaction.user.tag}` })
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [embed] });
            }

            // Formater et diviser les paroles de manière plus intelligente
            const formattedLyrics = formatLyrics(lyrics);
            const lyricsParts = splitLyricsIntelligently(formattedLyrics);

            // Afficher les paroles dans un bel embed Discord
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B') // Couleur rose élégante
                .setTitle('🎵 Paroles de la chanson')
                .setDescription(`**${songInfo.title}** par **${songInfo.artist}**`)
                .setThumbnail(songInfo.thumbnail || 'https://via.placeholder.com/150')
                .setFooter({ 
                    text: `🎤 Source: Genius • Demandé par ${interaction.user.tag}`,
                    iconURL: 'https://genius.com/favicon.ico'
                })
                .setTimestamp();

            // Ajouter chaque partie des paroles comme un champ séparé avec des couleurs différentes
            lyricsParts.forEach((part, index) => {
                const colors = ['🎵', '🎶', '🎼', '🎭', '🌉', '🎤'];
                const colorEmoji = colors[index % colors.length];
                const fieldName = lyricsParts.length > 1 ? `${colorEmoji} Paroles (${index + 1}/${lyricsParts.length})` : '🎵 Paroles';
                
                embed.addFields({
                    name: fieldName,
                    value: `\`\`\`\n${part}\n\`\`\``,
                    inline: false
                });
            });

                const reply = await interaction.editReply({ embeds: [embed] });
                
                // Ajouter le message à la liste de surveillance pour suppression automatique
                autoDeleteManager.addMusicMessage(interaction.guild.id, reply);
                
                return reply;

        } catch (error) {
            console.error('Erreur dans la commande lyrics:', error);
            
            // Si c'est une erreur de token non configuré, afficher un message d'aide
            if (error.message.includes('Token Genius non configuré')) {
                const embed = new EmbedBuilder()
                    .setColor('#ffaa00')
                    .setTitle('⚠️ API Genius non configurée')
                    .setDescription(`**${track.title}**\n\nPour utiliser les paroles, vous devez configurer un token Genius.\n\n1. Allez sur https://genius.com/api-clients\n2. Créez une application\n3. Ajoutez \`GENIUS_ACCESS_TOKEN\` dans votre fichier .env`)
                    .setThumbnail(track.thumbnail || 'https://via.placeholder.com/150')
                    .setFooter({ text: `Demandé par ${interaction.user.tag}` })
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [embed] });
            }
            
            return interaction.editReply({
                content: '❌ Impossible de récupérer les paroles pour cette musique!',
                flags: 64
            });
        }
    }
};

// Fonctions utilitaires pour le formatage des paroles
function formatLyrics(lyrics) {
    // Formatage minimal - juste nettoyer les espaces
    return lyrics
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
}

function splitLyricsIntelligently(lyrics) {
    const maxLength = 100; // Très court pour être sûr
    const parts = [];
    
    if (!lyrics || lyrics.length === 0) {
        return ['Aucune paroles trouvées'];
    }

    // Diviser d'abord par lignes
    const lines = lyrics.split('\n');
    let currentPart = '';
    
    for (const line of lines) {
        // Si ajouter cette ligne dépasse la limite
        if (currentPart.length + line.length + 1 > maxLength) {
            // Si on a déjà du contenu, l'ajouter aux parties
            if (currentPart.trim()) {
                parts.push(currentPart.trim());
                currentPart = '';
            }
            
            // Si la ligne seule est trop longue, la diviser par mots
            if (line.length > maxLength) {
                const words = line.split(' ');
                let currentLine = '';
                
                for (const word of words) {
                    if (currentLine.length + word.length + 1 > maxLength) {
                        if (currentLine.trim()) {
                            parts.push(currentLine.trim());
                            currentLine = '';
                        }
                        
                        // Si un mot seul est trop long, le couper
                        if (word.length > maxLength) {
                            parts.push(word.substring(0, maxLength));
                            currentLine = word.substring(maxLength);
                        } else {
                            currentLine = word;
                        }
                    } else {
                        currentLine += (currentLine ? ' ' : '') + word;
                    }
                }
                
                if (currentLine.trim()) {
                    currentPart = currentLine;
                }
            } else {
                currentPart = line;
            }
        } else {
            currentPart += (currentPart ? '\n' : '') + line;
        }
    }
    
    // Ajouter la dernière partie
    if (currentPart.trim()) {
        parts.push(currentPart.trim());
    }

    return parts.length > 0 ? parts : ['Paroles trop courtes pour être affichées'];
}
