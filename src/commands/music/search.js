const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { spawn } = require('child_process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Rechercher des musiques sur YouTube (optimisé)')
        .addStringOption(option =>
            option.setName('terme')
                .setDescription('Terme de recherche')
                .setRequired(true)),
    
    async execute(interaction) {
        const query = interaction.options.getString('terme');

        try {
            // Fonction optimisée pour rechercher avec yt-dlp
            const searchVideos = (searchQuery) => {
                return new Promise((resolve, reject) => {
                    const ytdlp = spawn('yt-dlp', [
                        '--dump-json',
                        '--no-playlist',
                        '--playlist-end', '5', // Réduit de 10 à 5 pour plus de rapidité
                        '--no-warnings', // Supprime les warnings pour moins de logs
                        '--quiet', // Mode silencieux
                        '--extractor-args', 'youtube:max_results=5', // Limite les résultats
                        `ytsearch5:${searchQuery}` // Recherche seulement 5 résultats
                    ]);
                    
                    let data = '';
                    let errorData = '';
                    
                    // Timeout de 15 secondes pour éviter les blocages
                    const timeout = setTimeout(() => {
                        ytdlp.kill('SIGTERM');
                        reject(new Error('⏰ Timeout: La recherche prend trop de temps'));
                    }, 15000);
                    
                    ytdlp.stdout.on('data', (chunk) => {
                        data += chunk;
                    });
                    
                    ytdlp.stderr.on('data', (chunk) => {
                        errorData += chunk;
                    });
                    
                    ytdlp.on('close', (code) => {
                        clearTimeout(timeout);
                        
                        if (code === 0) {
                            try {
                                const results = data.trim().split('\n').map(line => {
                                    if (line.trim()) {
                                        return JSON.parse(line);
                                    }
                                }).filter(Boolean);
                                resolve(results);
                            } catch (error) {
                                reject(new Error('❌ Erreur de parsing des résultats'));
                            }
                        } else {
                            reject(new Error(`❌ Recherche échouée (code ${code})`));
                        }
                    });
                    
                    ytdlp.on('error', (error) => {
                        clearTimeout(timeout);
                        reject(new Error(`❌ yt-dlp non trouvé: ${error.message}`));
                    });
                });
            };

            // Message de chargement (déjà deferré par interactionCreate.js)
            await interaction.editReply({
                content: '🔍 Recherche en cours...'
            });

            const startTime = Date.now();
            const results = await searchVideos(query);
            const searchTime = Date.now() - startTime;

            if (results.length === 0) {
                return interaction.editReply({
                    content: '❌ Aucun résultat trouvé pour cette recherche!'
                });
            }

            // Limiter la longueur des titres pour éviter les embeds trop longs
            const trackList = results.map((video, index) => {
                const title = video.title.length > 60 ? 
                    video.title.substring(0, 60) + '...' : 
                    video.title;
                const uploader = video.uploader || 'Inconnu';
                return `${index + 1}. [${title}](${video.webpage_url})\n   👤 ${uploader}`;
            }).join('\n\n');

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`🔍 Résultats pour "${query}"`)
                .setDescription(trackList)
                .addFields(
                    { name: '📊 **Statistiques**', value: `Trouvé ${results.length} résultat(s)\n⏱️ Recherche: ${searchTime}ms`, inline: true },
                    { name: '💡 **Astuce**', value: 'Utilisez `/play` avec le lien pour jouer directement', inline: true }
                )
                .setFooter({ text: 'Recherche optimisée • YouTube' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur dans la commande search:', error);
            
            // Messages d'erreur plus spécifiques
            let errorMessage = '❌ Une erreur est survenue lors de la recherche';
            
            if (error.message.includes('Timeout')) {
                errorMessage = '⏰ La recherche prend trop de temps. Essayez avec un terme plus spécifique.';
            } else if (error.message.includes('yt-dlp non trouvé')) {
                errorMessage = '❌ yt-dlp n\'est pas installé sur le serveur.';
            } else if (error.message.includes('parsing')) {
                errorMessage = '❌ Erreur lors du traitement des résultats.';
            }
            
            return interaction.editReply({
                content: errorMessage
            });
        }
    }
};
