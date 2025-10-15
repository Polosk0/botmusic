const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const voiceManager = require('../../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Activer/désactiver la répétition')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Mode de répétition')
                .setRequired(true)
                .addChoices(
                    { name: 'Désactivé', value: 'off' },
                    { name: 'Musique actuelle', value: 'track' }
                )),
    
    async execute(interaction) {
        if (!voiceManager.isConnected(interaction.guild)) {
            return interaction.editReply({
                content: '❌ Le bot n\'est pas connecté à un salon vocal!',
                flags: 64
            });
        }

        const mode = interaction.options.getString('mode');
        const isLooping = mode === 'track';

        voiceManager.setLoop(interaction.guild, isLooping);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔁 Mode de répétition')
            .setDescription(`Le mode de répétition a été réglé sur: **${isLooping ? 'Musique actuelle' : 'Désactivé'}**`)
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
