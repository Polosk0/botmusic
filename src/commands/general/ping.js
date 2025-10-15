const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Vérifier la latence du bot'),
    
    async execute(interaction) {
        const sent = await interaction.editReply({ content: 'Pong! 🏓', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Latence du bot', value: `${latency}ms`, inline: true },
                { name: 'Latence de l\'API', value: `${apiLatency}ms`, inline: true }
            )
            .setTimestamp();

        return interaction.editReply({ content: '', embeds: [embed] });
    }
};


