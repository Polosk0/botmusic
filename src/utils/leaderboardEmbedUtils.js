const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getTimeBasedColor() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return '#FFD700';
    if (hour >= 12 && hour < 18) return '#FF6B6B';
    if (hour >= 18 && hour < 22) return '#9B59B6';
    return '#3498DB';
}

function getTimeBasedEmoji() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return '🌅';
    if (hour >= 12 && hour < 18) return '☀️';
    if (hour >= 18 && hour < 22) return '🌆';
    return '🌙';
}

function createTabButtons(activeTab, userId = null) {
    const buttons = [
        new ButtonBuilder()
            .setCustomId('leaderboard_overview')
            .setLabel(activeTab === 'overview' ? 'VUE ULTIMATE' : 'Vue d\'ensemble')
            .setStyle(activeTab === 'overview' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setEmoji(activeTab === 'overview' ? '✨' : '📊'),
        
        new ButtonBuilder()
            .setCustomId('leaderboard_messages')
            .setLabel(activeTab === 'messages' ? 'CHAMPIONNAT' : 'Messages')
            .setStyle(activeTab === 'messages' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setEmoji(activeTab === 'messages' ? '🚀' : '💬'),
        
        new ButtonBuilder()
            .setCustomId('leaderboard_voice')
            .setLabel(activeTab === 'voice' ? 'ARÈNE ULTIME' : 'Vocal')
            .setStyle(activeTab === 'voice' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setEmoji(activeTab === 'voice' ? '🔥' : '🎤'),
        
        new ButtonBuilder()
            .setCustomId('leaderboard_activity')
            .setLabel(activeTab === 'activity' ? 'LÉGENDE' : 'Activité')
            .setStyle(activeTab === 'activity' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setEmoji(activeTab === 'activity' ? '⭐' : '📈'),
        
        new ButtonBuilder()
            .setCustomId('leaderboard_engagement')
            .setLabel(activeTab === 'engagement' ? 'SOCIAL' : 'Engagement')
            .setStyle(activeTab === 'engagement' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setEmoji(activeTab === 'engagement' ? '💝' : '🤝')
    ];
    
    const tabRow = new ActionRowBuilder().addComponents(buttons);
    
    // Deuxième ligne avec le bouton de réinitialisation (seulement pour polosko)
    const resetButton = new ButtonBuilder()
        .setCustomId('leaderboard_reset')
        .setLabel('🗑️ Réinitialiser DB')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️');
    
    const resetRow = new ActionRowBuilder().addComponents(resetButton);
    
    return [tabRow, resetRow];
}

function createOverviewEmbed(data, client) {
    const timeEmoji = getTimeBasedEmoji();
    const timeColor = getTimeBasedColor();
    
    const allUsers = { ...data.users, ...data.bots };
    const totalUsers = Object.keys(data.users).length;
    const totalBots = Object.keys(data.bots).length;
    const totalMessages = data.server.stats.totalMessages;
    const totalVoiceTime = data.server.stats.totalVoiceTime;
    
    const embed = new EmbedBuilder()
        .setColor(timeColor)
        .setTitle(`✨ ${timeEmoji} **LEADERBOARD ULTIMATE** ${timeEmoji} ✨`)
        .setDescription(`🎯 **Statistiques Premium** • Serveur en temps réel • ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n🔥 **Interface Interactive** • 🎨 **Design Premium** • ⚡ **Temps Réel**`)
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            {
                name: '👥 **COMMUNAUTÉ SERVEUR**',
                value: [
                    `👤 **Utilisateurs:** \`${totalUsers}\``,
                    `🤖 **Bots:** \`${totalBots}\``,
                    `📊 **Total membres:** \`${totalUsers + totalBots}\``,
                    `🎯 **Engagement:** ${totalUsers > 50 ? '🚀 **ÉLEVÉ**' : totalUsers > 20 ? '⚡ **MOYEN**' : '😴 **FAIBLE**'}`
                ].join('\n'),
                inline: true
            },
            {
                name: '💬 **ACTIVITÉ MESSAGERIE**',
                value: [
                    `📝 **Messages totaux:** \`${formatNumber(totalMessages)}\``,
                    `📈 **Moyenne/jour:** \`${formatNumber(Math.floor(totalMessages / 30))}\``,
                    `💬 **Activité:** ${totalMessages > 10000 ? '🚀 **TRÈS ACTIF**' : totalMessages > 5000 ? '⚡ **ACTIF**' : '😴 **CALME**'}`
                ].join('\n'),
                inline: true
            },
            {
                name: '🎤 **PRÉSENCE VOCALE**',
                value: [
                    `⏰ **Temps total:** \`${formatTime(totalVoiceTime)}\``,
                    `👥 **Utilisateurs actifs:** \`${Object.keys(allUsers).filter(id => allUsers[id].stats.voice.totalTime > 0).length}\``,
                    `🎯 **Engagement:** ${totalVoiceTime > 3600 ? '🔥 **ÉLEVÉ**' : totalVoiceTime > 1800 ? '⚡ **MOYEN**' : '❄️ **FAIBLE**'}`
                ].join('\n'),
                inline: true
            }
        )
        .setFooter({ 
            text: `✨ Leaderboard Ultimate • ${timeEmoji} ${new Date().toLocaleTimeString('fr-FR')} • Statistiques Premium • Interface Interactive`,
            iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

    return embed;
}

function createMessagesEmbed(data, client) {
    const allUsers = { ...data.users, ...data.bots };
    const sortedMessages = Object.values(allUsers)
        .sort((a, b) => b.stats.messages.total - a.stats.messages.total)
        .slice(0, 10);
    
    const totalMessages = data.server.stats.totalMessages;
    let messageColor = '#9B59B6';
    let messageEmoji = '💬';
    
    if (totalMessages > 10000) {
        messageColor = '#E74C3C';
        messageEmoji = '🚀';
    } else if (totalMessages > 5000) {
        messageColor = '#F39C12';
        messageEmoji = '⚡';
    } else if (totalMessages > 1000) {
        messageColor = '#27AE60';
        messageEmoji = '💬';
    } else {
        messageColor = '#95A5A6';
        messageEmoji = '😴';
    }

    const embed = new EmbedBuilder()
        .setColor(messageColor)
        .setTitle(`🚀 ${messageEmoji} **CHAMPIONNAT MESSAGERIE** ${messageEmoji} 🚀`)
        .setDescription(`🏆 **Classement Ultimate** • Top communicateurs • ${Object.keys(allUsers).length} participants\n\n💬 **Compétition Intense** • 🎯 **Classement Dynamique** • ⚡ **Mise à Jour Temps Réel**`)
        .setThumbnail(client.user.displayAvatarURL());

    if (sortedMessages.length > 0) {
        let messagesList = '';
        sortedMessages.forEach((user, index) => {
            const medal = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            const typeIcon = user.isBot ? '🤖' : '👤';
            const rank = index + 1;
            const stars = '⭐'.repeat(Math.min(5, Math.max(1, Math.floor(user.stats.messages.total / 100))));
            
            const messageTypes = user.stats.messages.byType;
            const typeDetails = [];
            
            if (messageTypes.embeds > 0) typeDetails.push(`📊${messageTypes.embeds}`);
            if (messageTypes.attachments > 0) typeDetails.push(`📎${messageTypes.attachments}`);
            if (messageTypes.links > 0) typeDetails.push(`🔗${messageTypes.links}`);
            if (messageTypes.commands > 0) typeDetails.push(`!${messageTypes.commands}`);
            if (messageTypes.reactions > 0) typeDetails.push(`👍${messageTypes.reactions}`);
            
            const typeString = typeDetails.length > 0 ? ` [${typeDetails.join(' ')}]` : '';
            messagesList += `${medal} **#${rank}** ${typeIcon} **${user.displayName}** \`${formatNumber(user.stats.messages.total)} msgs\`${typeString} ${stars}\n`;
        });
        
        embed.addFields({
            name: '🏆 **TOP 10 CHAMPIONS MESSAGERIE**',
            value: messagesList,
            inline: false
        });
    }

    const totalUserMessages = Object.values(data.users).reduce((sum, user) => sum + user.stats.messages.total, 0);
    const totalBotMessages = Object.values(data.bots).reduce((sum, bot) => sum + bot.stats.messages.total, 0);
    const avgMessages = Object.keys(allUsers).length > 0 ? Math.floor(totalMessages / Object.keys(allUsers).length) : 0;
    
    embed.addFields({
        name: '📊 **STATISTIQUES PREMIUM**',
        value: [
            `👤 **Messages utilisateurs:** \`${formatNumber(totalUserMessages)}\``,
            `🤖 **Messages bots:** \`${formatNumber(totalBotMessages)}\``,
            `📝 **Total général:** \`${formatNumber(totalMessages)}\``,
            `📈 **Moyenne par participant:** \`${formatNumber(avgMessages)}\``,
            `👥 **Participants actifs:** \`${Object.keys(allUsers).length}\``,
            `🎯 **Niveau d'activité:** ${totalMessages > 10000 ? '🚀 **LEGENDARY**' : totalMessages > 5000 ? '⚡ **EXPERT**' : totalMessages > 1000 ? '💬 **ACTIF**' : '😴 **DÉBUTANT**'}`
        ].join('\n'),
        inline: false
    });

    embed.setFooter({ 
        text: `🚀 Championnat Messagerie • ${messageEmoji} ${new Date().toLocaleTimeString('fr-FR')} • Classement Ultimate • Compétition Intense`,
        iconURL: client.user.displayAvatarURL()
    });

    return embed;
}

function createVoiceEmbed(data, client) {
    const allUsers = { ...data.users, ...data.bots };
    const sortedVoice = Object.values(allUsers)
        .sort((a, b) => b.stats.voice.totalTime - a.stats.voice.totalTime)
        .slice(0, 10);
    
    const totalVoiceTime = Object.values(allUsers).reduce((sum, user) => sum + (user.stats.voice.totalTime || 0), 0);
    let voiceColor = '#E74C3C';
    let voiceEmoji = '🎤';
    
    if (totalVoiceTime > 3600) {
        voiceColor = '#8E44AD';
        voiceEmoji = '🔥';
    } else if (totalVoiceTime > 1800) {
        voiceColor = '#E67E22';
        voiceEmoji = '⚡';
    } else if (totalVoiceTime > 600) {
        voiceColor = '#27AE60';
        voiceEmoji = '🎤';
    } else {
        voiceColor = '#95A5A6';
        voiceEmoji = '😴';
    }

    const embed = new EmbedBuilder()
        .setColor(voiceColor)
        .setTitle(`🔥 ${voiceEmoji} **ARÈNE VOCALE ULTIMATE** ${voiceEmoji} 🔥`)
        .setDescription(`🏆 **Tournoi Vocal** • Champions de la communication • ${sortedVoice.length} gladiateurs\n\n🎤 **Combat Vocal** • ⚔️ **Tournoi Intense** • 🌟 **Légendes Vivantes**`)
        .setThumbnail(client.user.displayAvatarURL());

    if (sortedVoice.length > 0) {
        let voiceList = '';
        sortedVoice.forEach((user, index) => {
            const medal = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            const userIcon = user.isBot ? '🤖' : '👤';
            const rank = index + 1;
            const timeInHours = user.stats.voice.totalTime / 3600;
            const level = timeInHours > 10 ? '🔥 **LEGENDARY**' : timeInHours > 5 ? '⚡ **EXPERT**' : timeInHours > 2 ? '🎤 **VETERAN**' : '🌟 **ROOKIE**';
            const flames = '🔥'.repeat(Math.min(5, Math.max(1, Math.floor(timeInHours))));
            
            voiceList += `${medal} **#${rank}** ${userIcon} **${user.displayName}** \`${formatTime(user.stats.voice.totalTime)}\` ${level} ${flames}\n`;
        });
        
        embed.addFields({
            name: '🏆 **TOP 10 GLADIATEURS VOCAUX**',
            value: voiceList,
            inline: false
        });
    }

    const totalUserVoice = Object.values(data.users).reduce((sum, user) => sum + user.stats.voice.totalTime, 0);
    const totalBotVoice = Object.values(data.bots).reduce((sum, bot) => sum + bot.stats.voice.totalTime, 0);
    const averageTime = Object.keys(allUsers).length > 0 ? Math.floor(totalVoiceTime / Object.keys(allUsers).length) : 0;
    const maxTime = sortedVoice.length > 0 ? Math.max(...sortedVoice.map(user => user.stats.voice.totalTime)) : 0;
    
    let userCount = 0;
    let botCount = 0;
    sortedVoice.forEach(user => {
        if (user.isBot) {
            botCount++;
        } else {
            userCount++;
        }
    });
    
    embed.addFields({
        name: '📊 **STATISTIQUES ARÈNE**',
        value: [
            `⏰ **Temps total de combat:** \`${formatTime(totalVoiceTime)}\``,
            `👥 **Gladiateurs actifs:** \`${sortedVoice.length}\` (👤 ${userCount} utilisateurs + 🤖 ${botCount} bots)`,
            `📈 **Moyenne par gladiateur:** \`${formatTime(averageTime)}\``,
            `🏆 **Record absolu:** \`${formatTime(maxTime)}\``,
            `🎯 **Niveau de l'arène:** ${totalVoiceTime > 3600 ? '🔥 **LEGENDARY**' : totalVoiceTime > 1800 ? '⚡ **EXPERT**' : totalVoiceTime > 600 ? '🎤 **VETERAN**' : '😴 **DÉBUTANT**'}`,
            `🌟 **Ambiance:** ${sortedVoice.length > 5 ? '🚀 **ÉLECTRISANTE**' : sortedVoice.length > 2 ? '⚡ **DÉCENTE**' : '😴 **CALME**'}`
        ].join('\n'),
        inline: false
    });

    embed.setFooter({ 
        text: `🔥 Arène Vocale Ultimate • ${voiceEmoji} ${new Date().toLocaleTimeString('fr-FR')} • Tournoi des Champions • Combat Vocal`,
        iconURL: client.user.displayAvatarURL()
    });

    return embed;
}

function createActivityEmbed(data, client) {
    const allUsers = { ...data.users, ...data.bots };
    const sortedActivity = Object.values(allUsers)
        .sort((a, b) => b.stats.activity.activeDays - a.stats.activity.activeDays)
        .slice(0, 10);
    
    const totalActiveDays = Object.values(allUsers).reduce((sum, user) => sum + user.stats.activity.activeDays, 0);
    let activityColor = '#9B59B6';
    let activityEmoji = '📈';
    
    if (totalActiveDays > 1000) {
        activityColor = '#E74C3C';
        activityEmoji = '🚀';
    } else if (totalActiveDays > 500) {
        activityColor = '#F39C12';
        activityEmoji = '⚡';
    } else if (totalActiveDays > 100) {
        activityColor = '#27AE60';
        activityEmoji = '📈';
    } else {
        activityColor = '#95A5A6';
        activityEmoji = '😴';
    }

    const embed = new EmbedBuilder()
        .setColor(activityColor)
        .setTitle(`⭐ ${activityEmoji} **LÉGENDE D'ACTIVITÉ** ${activityEmoji} ⭐`)
        .setDescription(`🏆 **Champions de l'Assiduité** • Maîtres de la régularité • ${sortedActivity.length} légendes\n\n📈 **Consistance Parfaite** • 🎯 **Dévouement Absolu** • ⚡ **Présence Légendaire**`)
        .setThumbnail(client.user.displayAvatarURL());

    if (sortedActivity.length > 0) {
        let activityList = '';
        sortedActivity.forEach((user, index) => {
            const medal = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            const userIcon = user.isBot ? '🤖' : '👤';
            const rank = index + 1;
            const streak = user.stats.activity.dailyStreak;
            const level = streak > 30 ? '🔥 **LEGENDARY**' : streak > 15 ? '⚡ **EXPERT**' : streak > 7 ? '📈 **VETERAN**' : '🌟 **ROOKIE**';
            const stars = '⭐'.repeat(Math.min(5, Math.max(1, Math.floor(user.stats.activity.activeDays / 10))));
            
            activityList += `${medal} **#${rank}** ${userIcon} **${user.displayName}** \`${user.stats.activity.activeDays} jours\` ${level} ${stars}\n`;
        });
        
        embed.addFields({
            name: '🏆 **TOP 10 LÉGENDES D\'ACTIVITÉ**',
            value: activityList,
            inline: false
        });
    }

    const totalUserActivity = Object.values(data.users).reduce((sum, user) => sum + user.stats.activity.activeDays, 0);
    const totalBotActivity = Object.values(data.bots).reduce((sum, bot) => sum + bot.stats.activity.activeDays, 0);
    const averageActivity = Object.keys(allUsers).length > 0 ? Math.floor(totalActiveDays / Object.keys(allUsers).length) : 0;
    const maxActivity = sortedActivity.length > 0 ? Math.max(...sortedActivity.map(user => user.stats.activity.activeDays)) : 0;
    
    embed.addFields({
        name: '📊 **STATISTIQUES LÉGENDAIRES**',
        value: [
            `📅 **Jours d'activité totaux:** \`${formatNumber(totalActiveDays)}\``,
            `👥 **Légendes actives:** \`${sortedActivity.length}\``,
            `📈 **Moyenne par légende:** \`${formatNumber(averageActivity)} jours\``,
            `🏆 **Record absolu:** \`${formatNumber(maxActivity)} jours\``,
            `🎯 **Niveau de légende:** ${totalActiveDays > 1000 ? '🔥 **LEGENDARY**' : totalActiveDays > 500 ? '⚡ **EXPERT**' : totalActiveDays > 100 ? '📈 **VETERAN**' : '😴 **DÉBUTANT**'}`,
            `🌟 **Consistance:** ${averageActivity > 30 ? '🚀 **PARFAITE**' : averageActivity > 15 ? '⚡ **EXCELLENTE**' : '😴 **MOYENNE**'}`
        ].join('\n'),
        inline: false
    });

    embed.setFooter({ 
        text: `⭐ Légende d'Activité • ${activityEmoji} ${new Date().toLocaleTimeString('fr-FR')} • Champions de l'Assiduité • Maîtres de la Régularité`,
        iconURL: client.user.displayAvatarURL()
    });

    return embed;
}

function createEngagementEmbed(data, client) {
    const allUsers = { ...data.users, ...data.bots };
    const sortedEngagement = Object.values(allUsers)
        .filter(user => user.stats && user.stats.engagement)
        .sort((a, b) => ((b.stats.engagement.reactionsGiven || 0) + (b.stats.engagement.reactionsReceived || 0) + (b.stats.engagement.mentions || 0)) - 
                        ((a.stats.engagement.reactionsGiven || 0) + (a.stats.engagement.reactionsReceived || 0) + (a.stats.engagement.mentions || 0)))
        .slice(0, 10);
    
    const totalEngagement = Object.values(allUsers).reduce((sum, user) => {
        if (user.stats && user.stats.engagement) {
            return sum + (user.stats.engagement.reactionsGiven || 0) + (user.stats.engagement.reactionsReceived || 0) + (user.stats.engagement.mentions || 0);
        }
        return sum;
    }, 0);
    
    let engagementColor = '#9B59B6';
    let engagementEmoji = '🤝';
    
    if (totalEngagement > 5000) {
        engagementColor = '#E74C3C';
        engagementEmoji = '🚀';
    } else if (totalEngagement > 2000) {
        engagementColor = '#F39C12';
        engagementEmoji = '⚡';
    } else if (totalEngagement > 500) {
        engagementColor = '#27AE60';
        engagementEmoji = '🤝';
    } else {
        engagementColor = '#95A5A6';
        engagementEmoji = '😴';
    }

    const embed = new EmbedBuilder()
        .setColor(engagementColor)
        .setTitle(`💝 ${engagementEmoji} **CHAMPIONS SOCIAUX** ${engagementEmoji} 💝`)
        .setDescription(`🏆 **Maîtres de l'Engagement** • Rois des interactions • ${sortedEngagement.length} champions\n\n💝 **Social Ultimate** • 🎯 **Engagement Parfait** • ⚡ **Influence Légendaire**`)
        .setThumbnail(client.user.displayAvatarURL());

    if (sortedEngagement.length > 0) {
        let engagementList = '';
        sortedEngagement.forEach((user, index) => {
            const medal = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            const userIcon = user.isBot ? '🤖' : '👤';
            const rank = index + 1;
            const totalEng = user.stats.engagement.reactionsGiven + user.stats.engagement.reactionsReceived + user.stats.engagement.mentions;
            const level = totalEng > 1000 ? '🔥 **LEGENDARY**' : totalEng > 500 ? '⚡ **EXPERT**' : totalEng > 100 ? '💝 **VETERAN**' : '🌟 **ROOKIE**';
            const hearts = '💝'.repeat(Math.min(5, Math.max(1, Math.floor(totalEng / 50))));
            
            engagementList += `${medal} **#${rank}** ${userIcon} **${user.displayName}** \`${formatNumber(totalEng)} interactions\` ${level} ${hearts}\n`;
        });
        
        embed.addFields({
            name: '🏆 **TOP 10 CHAMPIONS SOCIAUX**',
            value: engagementList,
            inline: false
        });
    }

    const totalReactions = Object.values(allUsers).reduce((sum, user) => {
        if (user.stats && user.stats.engagement) {
            return sum + (user.stats.engagement.reactionsGiven || 0) + (user.stats.engagement.reactionsReceived || 0);
        }
        return sum;
    }, 0);
    const totalMentions = Object.values(allUsers).reduce((sum, user) => {
        if (user.stats && user.stats.engagement) {
            return sum + (user.stats.engagement.mentions || 0);
        }
        return sum;
    }, 0);
    const averageEngagement = Object.keys(allUsers).length > 0 ? Math.floor(totalEngagement / Object.keys(allUsers).length) : 0;
    const maxEngagement = sortedEngagement.length > 0 ? Math.max(...sortedEngagement.map(user => 
        (user.stats.engagement.reactionsGiven || 0) + (user.stats.engagement.reactionsReceived || 0) + (user.stats.engagement.mentions || 0))) : 0;
    
    embed.addFields({
        name: '📊 **STATISTIQUES SOCIALES**',
        value: [
            `💝 **Interactions totales:** \`${formatNumber(totalEngagement)}\``,
            `👍 **Réactions:** \`${formatNumber(totalReactions)}\``,
            `📢 **Mentions:** \`${formatNumber(totalMentions)}\``,
            `👥 **Champions actifs:** \`${sortedEngagement.length}\``,
            `📈 **Moyenne par champion:** \`${formatNumber(averageEngagement)}\``,
            `🏆 **Record absolu:** \`${formatNumber(maxEngagement)}\``,
            `🎯 **Niveau social:** ${totalEngagement > 5000 ? '🔥 **LEGENDARY**' : totalEngagement > 2000 ? '⚡ **EXPERT**' : totalEngagement > 500 ? '💝 **VETERAN**' : '😴 **DÉBUTANT**'}`
        ].join('\n'),
        inline: false
    });

    embed.setFooter({ 
        text: `💝 Champions Sociaux • ${engagementEmoji} ${new Date().toLocaleTimeString('fr-FR')} • Maîtres de l'Engagement • Rois des Interactions`,
        iconURL: client.user.displayAvatarURL()
    });

    return embed;
}

module.exports = {
    formatTime,
    formatNumber,
    getTimeBasedColor,
    getTimeBasedEmoji,
    createTabButtons,
    createOverviewEmbed,
    createMessagesEmbed,
    createVoiceEmbed,
    createActivityEmbed,
    createEngagementEmbed
};
