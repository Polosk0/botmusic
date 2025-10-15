const axios = require('axios');

class GeniusService {
    constructor() {
        this.baseURL = 'https://api.genius.com';
        this.accessToken = process.env.GENIUS_ACCESS_TOKEN;
        
        if (!this.accessToken) {
            console.warn('⚠️ GENIUS_ACCESS_TOKEN non configuré - Les paroles ne seront pas disponibles');
        }
    }

    // Fonction pour nettoyer le nom de la musique pour une meilleure recherche
    cleanSongTitle(title) {
        if (!title) return '';
        
        console.log('🧹 Nettoyage du titre original:', title);
        
        let cleanedTitle = title;
        
        // Supprimer les informations entre parenthèses et crochets
        cleanedTitle = cleanedTitle.replace(/\([^)]*\)/g, ''); // (Clip Officiel), (Official Video), etc.
        cleanedTitle = cleanedTitle.replace(/\[[^\]]*\]/g, ''); // [HD], [4K], etc.
        
        // Supprimer les mots-clés communs qui polluent la recherche
        const keywordsToRemove = [
            'clip officiel', 'official video', 'official music video', 'official audio',
            'music video', 'lyrics video', 'lyric video', 'audio officiel',
            'hd', '4k', '8k', 'ultra hd', 'full hd',
            'explicit', 'clean', 'radio edit', 'radio version',
            'remastered', 'remaster', 'remix', 'remix version',
            'live', 'live version', 'concert', 'acoustic',
            'feat', 'featuring', 'ft', 'ft.',
            'prod', 'produced by', 'beat by',
            'new', 'latest', '2024', '2023', '2022', '2021', '2020',
            'vevo', 'vevo music', 'vevo music group',
            'tv', 'television', 'channel'
        ];
        
        // Supprimer les mots-clés (insensible à la casse)
        keywordsToRemove.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            cleanedTitle = cleanedTitle.replace(regex, '');
        });
        
        // Supprimer les caractères spéciaux et symboles (garder les accents)
        cleanedTitle = cleanedTitle.replace(/[^\w\s\-'&àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/gi, ' '); // Garder lettres avec accents
        
        // Supprimer les espaces multiples
        cleanedTitle = cleanedTitle.replace(/\s+/g, ' ');
        
        // Supprimer les espaces en début et fin
        cleanedTitle = cleanedTitle.trim();
        
        // Si le titre est trop court après nettoyage, garder une version moins agressive
        if (cleanedTitle.length < 3) {
            console.log('⚠️ Titre trop court après nettoyage, utilisation d\'une version moins agressive');
            cleanedTitle = title
                .replace(/\([^)]*\)/g, '') // Seulement les parenthèses
                .replace(/\[[^\]]*\]/g, '') // Seulement les crochets
                .replace(/\s+/g, ' ')
                .trim();
        }
        
        console.log('✨ Titre nettoyé:', cleanedTitle);
        return cleanedTitle;
    }

    // Fonction pour extraire l'artiste du titre YouTube
    extractArtistFromTitle(title) {
        if (!title) return '';
        
        // Patterns communs pour séparer artiste et titre
        const patterns = [
            /^([^-]+)\s*-\s*(.+)$/, // "Artiste - Titre"
            /^([^:]+)\s*:\s*(.+)$/, // "Artiste : Titre"
            /^([^|]+)\s*\|\s*(.+)$/, // "Artiste | Titre"
            /^([^(]+)\s*\((.+)\)$/, // "Artiste (Titre)"
        ];
        
        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) {
                const artist = match[1].trim();
                const songTitle = match[2].trim();
                
                // Vérifier que l'artiste n'est pas trop long (probablement pas un artiste)
                if (artist.length <= 50 && artist.length > 2) {
                    console.log('🎤 Artiste extrait:', artist);
                    return artist;
                }
            }
        }
        
        return '';
    }

    async searchSong(query) {
        if (!this.accessToken) {
            throw new Error('Token Genius non configuré');
        }

        try {
            console.log('🔍 Recherche Genius pour:', query);
            console.log('🔑 Token utilisé:', this.accessToken.substring(0, 10) + '...');
            
            // Créer plusieurs variantes de recherche pour améliorer les résultats
            const searchVariants = this.createSearchVariants(query);
            console.log('🎯 Variantes de recherche créées:', searchVariants);
            
            // Essayer chaque variante jusqu'à trouver des résultats
            for (let i = 0; i < searchVariants.length; i++) {
                const searchQuery = searchVariants[i];
                console.log(`🔍 Tentative ${i + 1}/${searchVariants.length}: "${searchQuery}"`);
                
                try {
            const response = await axios.get(`${this.baseURL}/search`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                params: {
                            q: searchQuery
                        },
                        timeout: 10000 // Timeout de 10 secondes
            });
            
            const hits = response.data.response.hits;
                    console.log(`📊 Résultats pour "${searchQuery}":`, hits.length);

                    if (hits.length > 0) {
            // Afficher les premiers résultats pour debug
            hits.slice(0, 3).forEach((hit, index) => {
                console.log(`🎵 Résultat ${index + 1}:`, hit.result.title, 'par', hit.result.primary_artist.name);
            });

            // Chercher spécifiquement un résultat en français (pas de traduction)
            const frenchResult = hits.find(hit => 
                !hit.result.title.toLowerCase().includes('translation') &&
                !hit.result.title.toLowerCase().includes('übersetzung') &&
                !hit.result.title.toLowerCase().includes('traducción') &&
                !hit.result.title.toLowerCase().includes('traduzione')
            );

                        // Chercher un résultat qui correspond mieux à notre recherche
                        const bestMatch = this.findBestMatch(hits, searchQuery, searchVariants[0]);
                        
                        // Retourner le meilleur résultat trouvé
                        const selectedResult = bestMatch || (frenchResult ? frenchResult.result : hits[0].result);
                        console.log(`✅ Résultat sélectionné: "${selectedResult.title}" par ${selectedResult.primary_artist.name}`);
                        return selectedResult;
                    }
                } catch (error) {
                    console.log(`⚠️ Erreur pour la variante "${searchQuery}":`, error.message);
                    // Continuer avec la variante suivante
                    continue;
                }
            }
            
            console.log('❌ Aucun résultat trouvé pour toutes les variantes');
            return null;
        } catch (error) {
            console.error('❌ Erreur lors de la recherche Genius:', error.response?.data || error.message);
            throw new Error('Impossible de rechercher les paroles');
        }
    }

    // Créer plusieurs variantes de recherche pour améliorer les résultats
    createSearchVariants(query) {
        const variants = [];
        
        // 1. Titre nettoyé seulement
        const cleanedTitle = this.cleanSongTitle(query);
        if (cleanedTitle && cleanedTitle !== query) {
            variants.push(cleanedTitle);
        }
        
        // 2. Titre original
        variants.push(query);
        
        // 3. Titre nettoyé + artiste extrait
        const extractedArtist = this.extractArtistFromTitle(query);
        if (extractedArtist && cleanedTitle) {
            variants.push(`${extractedArtist} ${cleanedTitle}`);
        }
        
        // 4. Artiste extrait + titre nettoyé (ordre inversé)
        if (extractedArtist && cleanedTitle) {
            variants.push(`${cleanedTitle} ${extractedArtist}`);
        }
        
        // 5. Version encore plus nettoyée (supprimer plus de mots)
        const superCleaned = cleanedTitle
            .replace(/\b(feat|featuring|ft|ft\.|prod|produced by|beat by)\b/gi, '')
            .replace(/\b(new|latest|2024|2023|2022|2021|2020)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (superCleaned && superCleaned !== cleanedTitle && superCleaned.length > 3) {
            variants.push(superCleaned);
        }
        
        // 6. Recherche par artiste seulement (pour les titres courts/acronymes)
        if (extractedArtist && extractedArtist.length > 2) {
            variants.push(extractedArtist);
        }
        
        // 7. Recherche par titre seulement (sans artiste)
        const titleOnly = cleanedTitle.replace(/^[^-]+-\s*/, '').trim();
        if (titleOnly && titleOnly !== cleanedTitle && titleOnly.length > 2) {
            variants.push(titleOnly);
        }
        
        // 8. Recherche avec mots-clés français pour le rap
        const frenchKeywords = ['rap', 'hip hop', 'français', 'french rap'];
        if (extractedArtist && cleanedTitle) {
            frenchKeywords.forEach(keyword => {
                variants.push(`${extractedArtist} ${keyword}`);
                variants.push(`${cleanedTitle} ${keyword}`);
            });
        }
        
        // 9. Recherche avec l'artiste et des mots-clés génériques
        if (extractedArtist) {
            const genericKeywords = ['song', 'track', 'music', 'lyrics'];
            genericKeywords.forEach(keyword => {
                variants.push(`${extractedArtist} ${keyword}`);
            });
        }
        
        // 10. Pour les acronymes, essayer de les développer
        const acronymExpansions = this.expandAcronyms(cleanedTitle);
        acronymExpansions.forEach(expansion => {
            if (extractedArtist) {
                variants.push(`${extractedArtist} ${expansion}`);
            }
            variants.push(expansion);
        });
        
        // Supprimer les doublons et les variantes vides
        return [...new Set(variants)].filter(v => v && v.length > 2);
    }

    // Fonction pour développer les acronymes courants
    expandAcronyms(title) {
        const expansions = [];
        const acronymMap = {
            'MMA': ['Mixed Martial Arts', 'MMA'],
            'NBA': ['National Basketball Association', 'NBA'],
            'NFL': ['National Football League', 'NFL'],
            'FIFA': ['FIFA'],
            'UFC': ['Ultimate Fighting Championship', 'UFC'],
            'CEO': ['Chief Executive Officer', 'CEO'],
            'VIP': ['Very Important Person', 'VIP'],
            'CEO': ['Chief Executive Officer', 'CEO'],
            'MVP': ['Most Valuable Player', 'MVP'],
            'GOAT': ['Greatest Of All Time', 'GOAT'],
            'FR': ['France', 'French'],
            'UK': ['United Kingdom', 'UK'],
            'USA': ['United States', 'USA'],
            'EU': ['Europe', 'European Union'],
            'UN': ['United Nations', 'UN'],
            'AI': ['Artificial Intelligence', 'AI'],
            'IT': ['Information Technology', 'IT'],
            'HR': ['Human Resources', 'HR'],
            'PR': ['Public Relations', 'PR'],
            'CEO': ['Chief Executive Officer', 'CEO']
        };
        
        // Chercher des acronymes dans le titre
        Object.keys(acronymMap).forEach(acronym => {
            if (title.toUpperCase().includes(acronym)) {
                acronymMap[acronym].forEach(expansion => {
                    const expandedTitle = title.replace(new RegExp(acronym, 'gi'), expansion);
                    expansions.push(expandedTitle);
                });
            }
        });
        
        return expansions;
    }

    // Fonction pour trouver le meilleur match parmi les résultats
    findBestMatch(hits, searchQuery, originalQuery) {
        if (!hits || hits.length === 0) return null;
        
        const originalArtist = this.extractArtistFromTitle(originalQuery);
        const originalTitle = this.cleanSongTitle(originalQuery);
        
        // Score chaque résultat
        const scoredHits = hits.map(hit => {
            let score = 0;
            const resultTitle = hit.result.title.toLowerCase();
            const resultArtist = hit.result.primary_artist.name.toLowerCase();
            const searchLower = searchQuery.toLowerCase();
            
            // Score basé sur la correspondance exacte
            if (resultTitle.includes(searchLower) || searchLower.includes(resultTitle)) {
                score += 10;
            }
            
            // Score basé sur l'artiste original
            if (originalArtist && resultArtist.includes(originalArtist.toLowerCase())) {
                score += 8;
            }
            
            // Score basé sur le titre original
            if (originalTitle && resultTitle.includes(originalTitle.toLowerCase())) {
                score += 6;
            }
            
            // Score basé sur la longueur du titre (préférer les titres courts)
            if (resultTitle.length < 50) {
                score += 2;
            }
            
            // Pénalité pour les traductions
            if (resultTitle.includes('translation') || resultTitle.includes('traduction')) {
                score -= 5;
            }
            
            return { hit, score };
        });
        
        // Trier par score et retourner le meilleur
        scoredHits.sort((a, b) => b.score - a.score);
        
        console.log(`🎯 Meilleurs matches trouvés:`);
        scoredHits.slice(0, 3).forEach((item, index) => {
            console.log(`   ${index + 1}. "${item.hit.result.title}" par ${item.hit.result.primary_artist.name} (score: ${item.score})`);
        });
        
        return scoredHits[0].score > 0 ? scoredHits[0].hit.result : null;
    }

    async getLyrics(songId) {
        if (!this.accessToken) {
            throw new Error('Token Genius non configuré');
        }

        try {
            const response = await axios.get(`${this.baseURL}/songs/${songId}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                params: {
                    text_format: 'plain'
                }
            });

            const song = response.data.response.song;
            
            // Les paroles ne sont pas directement dans l'API Genius
            // Il faut scraper la page web de Genius
            return await this.scrapeLyrics(song.url, {
                title: song.title,
                artist: song.primary_artist.name
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des paroles:', error.message);
            throw new Error('Impossible de récupérer les paroles');
        }
    }

    // Fonction pour formater le texte selon les règles de français
    formatFrenchText(text) {
        if (!text || text.length === 0) return text;
        
        console.log('🇫🇷 DEBUG - Formatage français du texte:', text.substring(0, 100) + '...');
        
        // 1. SÉPARATION DES MOTS COLLÉS - PRIORITÉ ABSOLUE
        // Séparer les mots qui sont collés ensemble
        text = text.replace(/([a-z])([A-Z])/g, '$1 $2'); // Séparer les mots collés
        text = text.replace(/([a-z])([0-9])/g, '$1 $2'); // Séparer lettres et chiffres
        text = text.replace(/([0-9])([a-z])/g, '$1 $2'); // Séparer chiffres et lettres
        
        // Séparer les mots spécifiques qui sont souvent collés
        const commonCollisions = [
            'ComMaeva', 'Comj', 'pattey', 'carteOn', 'intacte', 'colèreMon',
            'bâtints', 'entièreÇa', 'irisDes', 'PayPalLa', 'lobbyN',
            'dateCom', 'qu\'entre', 'rates-pi', 'âsera', 'illeur'
        ];
        
        commonCollisions.forEach(collision => {
            const regex = new RegExp(collision, 'gi');
            text = text.replace(regex, collision.replace(/([a-z])([A-Z])/g, '$1 $2'));
        });
        
        // 2. CORRECTION DES ESPACES ET PONCTUATION
        // Supprimer les espaces avant la ponctuation
        text = text.replace(/\s+([,.!?;:])/g, '$1');
        
        // Ajouter des espaces après la ponctuation
        text = text.replace(/([,.!?;:])(?!\s)/g, '$1 ');
        
        // Corriger les espaces multiples
        text = text.replace(/\s+/g, ' ');
        
        // 3. CORRECTION DES MAJUSCULES
        // Majuscule en début de phrase
        text = text.charAt(0).toUpperCase() + text.slice(1);
        
        // Majuscules après les points
        text = text.replace(/\.\s*([a-z])/g, (match, letter) => {
            return '. ' + letter.toUpperCase();
        });
        
        // Majuscules après les points d'exclamation et d'interrogation
        text = text.replace(/[!?]\s*([a-z])/g, (match, letter) => {
            return match.charAt(0) + ' ' + letter.toUpperCase();
        });
        
        // 4. CORRECTION DES APOSTROPHES ET GUILLEMETS
        text = text.replace(/'/g, "'"); // Apostrophe courbe
        text = text.replace(/"/g, '"'); // Guillemets courbes
        text = text.replace(/"/g, '"');
        
        // 5. CORRECTION DES TIRETS
        text = text.replace(/ - /g, ' – '); // Tiret long pour les dialogues
        text = text.replace(/^-/g, '–'); // Tiret long en début de ligne
        
        // 6. CORRECTION DES MOTS FRANÇAIS COURANTS
        const frenchWords = {
            'je': 'Je', 'tu': 'Tu', 'il': 'Il', 'elle': 'Elle',
            'nous': 'Nous', 'vous': 'Vous', 'ils': 'Ils', 'elles': 'Elles',
            'le': 'Le', 'la': 'La', 'les': 'Les', 'un': 'Un', 'une': 'Une',
            'des': 'Des', 'du': 'Du', 'de': 'De', 'dans': 'Dans',
            'sur': 'Sur', 'avec': 'Avec', 'sans': 'Sans', 'pour': 'Pour',
            'par': 'Par', 'et': 'Et', 'ou': 'Ou', 'mais': 'Mais',
            'donc': 'Donc', 'car': 'Car', 'ni': 'Ni', 'or': 'Or'
        };
        
        // Appliquer les corrections de mots français (seulement en début de phrase)
        const sentences = text.split(/[.!?]\s+/);
        const correctedSentences = sentences.map(sentence => {
            if (sentence.length > 0) {
                const firstWord = sentence.split(' ')[0].toLowerCase();
                if (frenchWords[firstWord]) {
                    sentence = sentence.replace(new RegExp(`^${firstWord}`, 'i'), frenchWords[firstWord]);
                }
            }
            return sentence;
        });
        
        text = correctedSentences.join('. ');
        
        // 7. NETTOYAGE FINAL
        text = text.trim();
        
        // Supprimer les espaces en début et fin de chaque ligne
        text = text.split('\n').map(line => line.trim()).join('\n');
        
        console.log('🇫🇷 DEBUG - Texte formaté:', text.substring(0, 100) + '...');
        
        return text;
    }

    // Analyser la structure HTML de Genius pour extraire les éléments
    analyzeHTMLStructure(html) {
        console.log('🔍 DEBUG - Analyse de la structure HTML Genius...');
        
        const structure = {
            lyrics: [],
            timecodes: [],
            sections: [],
            rawText: ''
        };
        
        // Extraire tous les éléments avec data-time (timecodes Genius)
        const timecodeElements = html.match(/<[^>]*data-time="(\d+)"[^>]*>([^<]*)<\/[^>]*>/gi) || [];
        console.log(`⏰ DEBUG - Trouvé ${timecodeElements.length} éléments avec timecodes`);
        
        timecodeElements.forEach((element, index) => {
            const timeMatch = element.match(/data-time="(\d+)"/);
            const textMatch = element.match(/>([^<]*)</);
            
            if (timeMatch && textMatch) {
                const seconds = parseInt(timeMatch[1]);
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                const timecode = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                const text = textMatch[1].trim();
                
                structure.timecodes.push({
                    time: timecode,
                    seconds: seconds,
                    text: text,
                    element: element
                });
                
                console.log(`⏰ DEBUG - Timecode ${index + 1}: [${timecode}] "${text.substring(0, 50)}..."`);
            }
        });
        
        // Extraire les sections (couplets, refrains, etc.)
        const sectionElements = html.match(/<[^>]*class="[^"]*ReferentFragment[^"]*"[^>]*>([^<]*)<\/[^>]*>/gi) || [];
        console.log(`📝 DEBUG - Trouvé ${sectionElements.length} éléments de paroles`);
        
        sectionElements.forEach((element, index) => {
            const textMatch = element.match(/>([^<]*)</);
            if (textMatch) {
                const text = textMatch[1].trim();
                if (text.length > 0) {
                    structure.lyrics.push({
                        text: text,
                        element: element,
                        index: index
                    });
                    
                    console.log(`📝 DEBUG - Parole ${index + 1}: "${text.substring(0, 50)}..."`);
                }
            }
        });
        
        // Extraire le texte brut pour analyse
        structure.rawText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        console.log('🔍 DEBUG - Structure analysée:', {
            timecodes: structure.timecodes.length,
            lyrics: structure.lyrics.length,
            rawTextLength: structure.rawText.length
        });
        
        return structure;
    }

    // Créer un formatage optimisé pour Discord avec aération parfaite
    createDiscordOptimizedFormat(htmlStructure, songInfo) {
        console.log('🎨 DEBUG - Création du format Discord optimisé...');
        
        const lines = [];
        let currentCharCount = 0;
        const maxCharsPerPage = 1800; // Limite Discord avec marge
        
        // Header élégant
        const header = `🎵 **${songInfo.title}** par **${songInfo.artist}**`;
        lines.push(header);
        lines.push(''); // Ligne vide
        lines.push('─'.repeat(Math.min(40, songInfo.title.length + songInfo.artist.length + 5)));
        lines.push(''); // Ligne vide
        
        currentCharCount += header.length + 50; // Compter les lignes vides et séparateur
        
        // Traiter les timecodes et paroles
        if (htmlStructure.timecodes.length > 0) {
            console.log('⏰ DEBUG - Formatage avec timecodes...');
            
            htmlStructure.timecodes.forEach((item, index) => {
                const timecodeLine = `**${item.time}** ${item.text}`;
                
                // Vérifier si on dépasse la limite
                if (currentCharCount + timecodeLine.length > maxCharsPerPage) {
                    console.log(`⚠️ DEBUG - Limite atteinte à l'élément ${index}`);
                    return;
                }
                
                lines.push(timecodeLine);
                currentCharCount += timecodeLine.length + 1; // +1 pour le \n
                
                // Ajouter une ligne vide tous les 3-4 éléments pour l'aération
                if ((index + 1) % 4 === 0) {
                    lines.push('');
                    currentCharCount += 1;
                }
            });
        } else if (htmlStructure.lyrics.length > 0) {
            console.log('📝 DEBUG - Formatage sans timecodes...');
            
            htmlStructure.lyrics.forEach((item, index) => {
                let lyricLine = item.text;
                
                // Nettoyer le texte
                lyricLine = this.formatFrenchText(lyricLine);
                
                // Vérifier si on dépasse la limite
                if (currentCharCount + lyricLine.length > maxCharsPerPage) {
                    console.log(`⚠️ DEBUG - Limite atteinte à l'élément ${index}`);
                    return;
                }
                
                lines.push(lyricLine);
                currentCharCount += lyricLine.length + 1;
                
                // Ajouter une ligne vide tous les 3-4 éléments pour l'aération
                if ((index + 1) % 3 === 0) {
                    lines.push('');
                    currentCharCount += 1;
                }
            });
        } else {
            console.log('⚠️ DEBUG - Aucune parole trouvée, utilisation du texte brut...');
            
            // Utiliser le texte brut comme fallback
            const rawLines = htmlStructure.rawText.split(/[.!?]\s+/);
            rawLines.forEach((line, index) => {
                if (line.trim().length > 0) {
                    const cleanLine = this.formatFrenchText(line.trim());
                    
                    if (currentCharCount + cleanLine.length > maxCharsPerPage) {
                        return;
                    }
                    
                    lines.push(cleanLine);
                    currentCharCount += cleanLine.length + 1;
                    
                    if ((index + 1) % 3 === 0) {
                        lines.push('');
                        currentCharCount += 1;
                    }
                }
            });
        }
        
        // Footer
        lines.push(''); // Ligne vide
        lines.push('─'.repeat(30));
        lines.push('📄 Source: Genius • 🎤 Paroles optimisées');
        
        const result = lines.join('\n');
        
        console.log('🎨 DEBUG - Format Discord créé:', {
            totalLines: lines.length,
            totalChars: result.length,
            maxChars: maxCharsPerPage,
            utilization: `${Math.round((result.length / maxCharsPerPage) * 100)}%`
        });
        
        return result;
    }

    // Créer un formatage simple et propre
    createSimpleFormat(lyrics, songInfo) {
        console.log('🎨 DEBUG - Création du format simple...');
        
        if (!lyrics || lyrics.length === 0) {
            return 'Aucune paroles disponibles';
        }
        
        // Diviser en lignes et nettoyer
        const lines = lyrics.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const formattedLines = [];
        
        // Header simple
        formattedLines.push(`🎵 **${songInfo.title}** par **${songInfo.artist}**`);
        formattedLines.push('');
        formattedLines.push('─'.repeat(30));
        formattedLines.push('');
        
        // Traiter chaque ligne
        lines.forEach((line, index) => {
            // Nettoyer la ligne
            const cleanLine = this.formatFrenchText(line);
            
            // Détecter les timecodes
            const timecodeMatch = cleanLine.match(/^\[(\d{1,2}:\d{2})\]/);
            if (timecodeMatch) {
                const timecode = timecodeMatch[1];
                const text = cleanLine.replace(/^\[\d{1,2}:\d{2}\]\s*/, '').trim();
                formattedLines.push(`**${timecode}** ${text}`);
            } else if (cleanLine.includes('[') && cleanLine.includes(']')) {
                // Section
                formattedLines.push(`**${cleanLine}**`);
            } else {
                // Ligne normale
                formattedLines.push(cleanLine);
            }
            
            // Ajouter une ligne vide tous les 3 éléments
            if ((index + 1) % 3 === 0) {
                formattedLines.push('');
            }
        });
        
        // Footer simple
        formattedLines.push('');
        formattedLines.push('─'.repeat(20));
        formattedLines.push('📄 Source: Genius');
        
        const result = formattedLines.join('\n');
        
        console.log('🎨 DEBUG - Format simple créé:', {
            totalLines: formattedLines.length,
            totalChars: result.length
        });
        
        return result;
    }

    async scrapeLyrics(geniusUrl, songInfo = { title: 'Titre inconnu', artist: 'Artiste inconnu' }) {
        try {
            console.log('🌐 Scraping des paroles depuis:', geniusUrl);
            
            // Utiliser une approche différente : chercher directement les paroles dans le texte
            const response = await axios.get(geniusUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });

            const html = response.data;
            console.log('📄 HTML reçu, taille:', html.length, 'caractères');
            
            // DEBUG: Afficher les premières lignes du HTML brut
            console.log('🔍 DEBUG - Premières 500 caractères du HTML brut:');
            console.log('='.repeat(80));
            console.log(html.substring(0, 500));
            console.log('='.repeat(80));
            
            // DEBUG: Chercher des mots-clés spécifiques dans le HTML
            const debugKeywords = ['lyrics', 'Lyrics', 'paroles', 'song', 'verse', 'chorus', 'refrain'];
            console.log('🔍 DEBUG - Recherche de mots-clés dans le HTML:');
            debugKeywords.forEach(keyword => {
                const count = (html.match(new RegExp(keyword, 'gi')) || []).length;
                if (count > 0) {
                    console.log(`  - "${keyword}": ${count} occurrences`);
                }
            });
            
            // DEBUG: Chercher des classes CSS liées aux paroles
            const cssClasses = ['Lyrics__Container', 'ReferentFragment', 'lyrics', 'song-lyrics', 'lyrics-container'];
            console.log('🔍 DEBUG - Recherche de classes CSS:');
            cssClasses.forEach(className => {
                const regex = new RegExp(`class="[^"]*${className}[^"]*"`, 'gi');
                const matches = html.match(regex);
                if (matches && matches.length > 0) {
                    console.log(`  - "${className}": ${matches.length} occurrences`);
                    console.log(`    Exemples:`, matches.slice(0, 2));
                }
            });
            
            // Approche améliorée : chercher les paroles dans plusieurs patterns
            let lyrics = '';
            
            // Patterns multiples pour extraire les paroles avec timecodes
            const lyricPatterns = [
                // Pattern principal pour les paroles Genius modernes avec timecodes
                /<div[^>]*class="[^"]*Lyrics__Container[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
                // Pattern pour les spans de paroles avec timecodes
                /<span[^>]*class="[^"]*ReferentFragment[^"]*"[^>]*>([^<]*)<\/span>/gi,
                // Pattern pour les paroles dans les divs avec data-testid
                /<div[^>]*data-testid="[^"]*lyrics[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
                // Pattern pour les paroles dans les sections
                /<section[^>]*class="[^"]*lyrics[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
                // Pattern pour les paroles dans les articles
                /<article[^>]*class="[^"]*lyrics[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
                // Pattern générique pour les divs contenant des paroles
                /<div[^>]*class="[^"]*lyrics[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
                // Pattern pour les paroles dans les p
                /<p[^>]*class="[^"]*lyrics[^"]*"[^>]*>([^<]*)<\/p>/gi,
                // Pattern spécial pour les timecodes Genius
                /<span[^>]*class="[^"]*ReferentFragment[^"]*"[^>]*data-time="(\d+)"[^>]*>([^<]*)<\/span>/gi,
                // Pattern pour les éléments avec attributs de temps
                /<[^>]*data-time="(\d+)"[^>]*>([^<]*)<\/[^>]*>/gi
            ];
            
            for (let i = 0; i < lyricPatterns.length; i++) {
                const pattern = lyricPatterns[i];
                console.log(`🔍 DEBUG - Test du pattern ${i + 1}/${lyricPatterns.length}:`, pattern.toString());
                
                const matches = html.match(pattern);
                if (matches && matches.length > 0) {
                    console.log(`✅ Trouvé ${matches.length} éléments avec le pattern ${i + 1}`);
                    
                    // DEBUG: Afficher les premiers matches bruts
                    console.log('🔍 DEBUG - Premiers matches bruts:');
                    matches.slice(0, 3).forEach((match, index) => {
                        console.log(`  Match ${index + 1}:`, match.substring(0, 200) + (match.length > 200 ? '...' : ''));
                    });
                    
                    // Extraire le texte de chaque match de manière plus robuste avec timecodes
                    const extractedLyrics = matches.map(match => {
                        // Supprimer toutes les balises HTML pour extraire le texte brut
                        let text = match.replace(/<[^>]*>/g, '');
                        
                        // Décoder les entités HTML
                        text = text.replace(/&amp;/g, '&')
                                  .replace(/&lt;/g, '<')
                                  .replace(/&gt;/g, '>')
                                  .replace(/&quot;/g, '"')
                                  .replace(/&#x27;/g, "'")
                                  .replace(/&nbsp;/g, ' ')
                                  .replace(/&hellip;/g, '...');
                        
                        // Essayer d'extraire les timecodes des attributs data-time
                        const timecodeMatch = match.match(/data-time="(\d+)"/);
                        if (timecodeMatch) {
                            const seconds = parseInt(timecodeMatch[1]);
                            const minutes = Math.floor(seconds / 60);
                            const remainingSeconds = seconds % 60;
                            const timecode = `[${minutes}:${remainingSeconds.toString().padStart(2, '0')}]`;
                            text = timecode + ' ' + text.trim();
                        }
                        
                        return text.trim();
                    }).filter(text => text.length > 0);
                    
                    console.log(`🔍 DEBUG - ${extractedLyrics.length} éléments extraits après nettoyage`);
                    
                    if (extractedLyrics.length > 0) {
                        lyrics = extractedLyrics.join('\n');
                        console.log('📝 Paroles extraites, longueur:', lyrics.length);
                        console.log('🔍 DEBUG - Paroles complètes extraites:');
                        console.log('='.repeat(80));
                        console.log(lyrics);
                        console.log('='.repeat(80));
                        
                        // Si on a trouvé des paroles substantielles, on s'arrête
                        if (lyrics.length > 50) {
                            console.log('✅ Paroles substantielles trouvées, arrêt de la recherche');
                        break;
                        }
                    }
                } else {
                    console.log(`❌ Aucun match trouvé avec le pattern ${i + 1}`);
                }
            }
            
            // Si aucun pattern n'a fonctionné, essayer une approche plus agressive
            if (!lyrics || lyrics.length < 50) {
                console.log('🔄 Tentative d\'extraction agressive...');
                
                // Chercher tous les textes entre balises qui pourraient être des paroles
                const aggressivePattern = /<[^>]*>([^<]{10,})<\/[^>]*>/gi;
                const aggressiveMatches = html.match(aggressivePattern);
                
                if (aggressiveMatches && aggressiveMatches.length > 0) {
                    console.log(`🔍 DEBUG - Trouvé ${aggressiveMatches.length} éléments potentiels avec extraction agressive`);
                    
                    // DEBUG: Afficher les premiers matches agressifs
                    console.log('🔍 DEBUG - Premiers matches agressifs bruts:');
                    aggressiveMatches.slice(0, 5).forEach((match, index) => {
                        console.log(`  Match agressif ${index + 1}:`, match.substring(0, 150) + (match.length > 150 ? '...' : ''));
                    });
                    
                    const potentialLyrics = aggressiveMatches
                        .map(match => {
                            let text = match.replace(/<[^>]*>/g, '');
                            text = text.replace(/&amp;/g, '&')
                                      .replace(/&lt;/g, '<')
                                      .replace(/&gt;/g, '>')
                                      .replace(/&quot;/g, '"')
                                      .replace(/&#x27;/g, "'")
                                      .replace(/&nbsp;/g, ' ')
                                      .replace(/&hellip;/g, '...');
                            return text.trim();
                        })
                        .filter(text => {
                            // Filtrer les textes qui ressemblent à des paroles
                            return text.length > 10 && 
                                   !text.includes('Genius') && 
                                   !text.includes('About') &&
                                   !text.includes('Share') &&
                                   !text.includes('Embed') &&
                                   !text.includes('Edit') &&
                                   !text.includes('Verified') &&
                                   !text.includes('Contributors') &&
                                   !text.includes('Translations') &&
                                   !text.match(/^\d+$/) && // Pas de nombres purs
                                   !text.match(/^[A-Z\s]+$/) && // Pas de texte en majuscules uniquement
                                   text.includes(' '); // Doit contenir des espaces
                        });
                    
                    console.log(`🔍 DEBUG - ${potentialLyrics.length} éléments filtrés après nettoyage agressif`);
                    
                    if (potentialLyrics.length > 0) {
                        lyrics = potentialLyrics.join('\n');
                        console.log('📝 Paroles extraites (mode agressif), longueur:', lyrics.length);
                        console.log('🔍 DEBUG - Paroles complètes (mode agressif):');
                        console.log('='.repeat(80));
                        console.log(lyrics);
                        console.log('='.repeat(80));
                    }
                }
            }
            
            if (!lyrics || lyrics.length < 50) {
                console.log('❌ Aucune parole valide trouvée');
                return null;
            }
            
            // Nettoyage avancé des paroles avec formatage français
            console.log('🧹 DEBUG - Début du nettoyage et formatage français des paroles...');
            console.log('🔍 DEBUG - Paroles AVANT nettoyage:');
            console.log('='.repeat(80));
            console.log(lyrics);
            console.log('='.repeat(80));
            
            // Supprimer les éléments non-lyriques spécifiques à Genius
            const nonLyricPatterns = [
                /\d+\s*Contributors?/gi,
                /\d+\s*Translations?/gi,
                /Embed\s*\d*/gi,
                /Share\s*\d*/gi,
                /Edit\s*\d*/gi,
                /Verified\s*\d*/gi,
                /Genius\s*\d*/gi,
                /About\s*\d*/gi,
                /Start the Song Bio/gi,
                /Add a Song/gi,
                /Music IQ/gi,
                /Featured/gi,
                /Charts/gi,
                /Videos/gi,
                /Promote/gi,
                /Forums/gi,
                /FORUMS/gi,
                /FEED/gi,
                /ME\s*\d*/gi,
                /MESSAGES\s*\d*/gi,
                /Track\s*\d+\s*on/gi,
                /Viewer/gi,
                /Viewers/gi,
                /Jun\.\s*\d+,\s*\d+/gi, // Dates
                /Jan\.|Feb\.|Mar\.|Apr\.|May|Jun\.|Jul\.|Aug\.|Sep\.|Oct\.|Nov\.|Dec\./gi,
                /\[Paroles de.*?\]/gi, // En-têtes de paroles
                /\[Couplet \d+\]/gi, // En-têtes de couplets
                /\[Refrain\]/gi,
                /\[Intro\]/gi,
                /\[Outro\]/gi,
                /\[Bridge\]/gi,
                /\[Chorus\]/gi,
                /\[Verse \d+\]/gi
            ];
            
            console.log(`🔍 DEBUG - Application de ${nonLyricPatterns.length} patterns de nettoyage`);
            nonLyricPatterns.forEach((pattern, index) => {
                const beforeLength = lyrics.length;
                lyrics = lyrics.replace(pattern, '');
                const afterLength = lyrics.length;
                if (beforeLength !== afterLength) {
                    console.log(`  Pattern ${index + 1}: ${beforeLength - afterLength} caractères supprimés`);
                }
            });
            
            // Supprimer les lignes vides multiples
            lyrics = lyrics.replace(/\n\s*\n\s*\n/g, '\n\n');
            
            // Supprimer les espaces en début et fin de chaque ligne
            lyrics = lyrics.split('\n').map(line => line.trim()).join('\n');
            
            // Supprimer les lignes vides en début et fin
            lyrics = lyrics.replace(/^\s*\n+|\n+\s*$/g, '');
            
            // FORMATAGE SIMPLE ET PROPRE
            console.log('🎨 DEBUG - Application du formatage simple...');
            
            // Formatage simple et propre
            lyrics = this.createSimpleFormat(lyrics, songInfo);
            
            console.log('🎨 DEBUG - Format simple créé:', lyrics.substring(0, 200) + '...');
            
            console.log('🧹 DEBUG - Paroles APRÈS formatage français:');
            console.log('='.repeat(80));
            console.log(lyrics);
            console.log('='.repeat(80));
            console.log('🧹 Paroles formatées, longueur finale:', lyrics.length);
            
            // Vérifier que les paroles sont valides
            if (lyrics.length < 50) {
                console.log('⚠️ Paroles trop courtes après nettoyage');
                return null;
            }
            
            // Limiter la longueur pour Discord (2000 caractères max)
            if (lyrics.length > 1900) {
                lyrics = lyrics.substring(0, 1900) + '...';
            }
            
            console.log('🎯 DEBUG - Résultat final retourné:');
            console.log('='.repeat(80));
            console.log(lyrics.trim());
            console.log('='.repeat(80));
            console.log('🎯 Longueur finale:', lyrics.trim().length, 'caractères');
            
            return lyrics.trim();
        } catch (error) {
            console.error('❌ Erreur lors du scraping des paroles:', error.message);
            return null;
        }
    }

    async getSongInfo(query) {
        try {
            const song = await this.searchSong(query);
            if (!song) {
                return null;
            }

            return {
                id: song.id,
                title: song.title,
                artist: song.primary_artist.name,
                url: song.url,
                thumbnail: song.song_art_image_url,
                releaseDate: song.release_date_for_display
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des infos:', error.message);
            return null;
        }
    }
}

module.exports = new GeniusService();
