const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

class EmbedUtils {
    static createEmbed(options = {}) {
        const embed = new EmbedBuilder()
            .setColor(options.color || config.colors.primary)
            .setTimestamp();

        if (options.title) embed.setTitle(options.title);
        if (options.description) embed.setDescription(options.description);
        if (options.thumbnail) embed.setThumbnail(options.thumbnail);
        if (options.image) embed.setImage(options.image);
        if (options.footer) embed.setFooter(options.footer);
        if (options.author) embed.setAuthor(options.author);

        return embed;
    }

    static createSuccessEmbed(title, description) {
        return this.createEmbed({
            color: config.colors.success,
            title: `✅ ${title}`,
            description: description
        });
    }

    static createErrorEmbed(title, description) {
        return this.createEmbed({
            color: config.colors.error,
            title: `❌ ${title}`,
            description: description
        });
    }

    static createWarningEmbed(title, description) {
        return this.createEmbed({
            color: config.colors.warning,
            title: `⚠️ ${title}`,
            description: description
        });
    }

    static createInfoEmbed(title, description) {
        return this.createEmbed({
            color: config.colors.info,
            title: `ℹ️ ${title}`,
            description: description
        });
    }

    static formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
    }

    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = EmbedUtils;


