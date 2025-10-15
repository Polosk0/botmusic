const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('permissions')
        .setDescription('Vérifier les permissions du bot dans le salon vocal'),
    
    async execute(interaction) {

        const member = interaction.guild.members.cache.get(interaction.client.user.id);
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.editReply({
                content: '❌ Vous devez être dans un salon vocal!',
                flags: 64
            });
        }

        const permissions = voiceChannel.permissionsFor(member);
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🔐 Permissions du Bot')
            .setDescription(`Salon: **${voiceChannel.name}**`)
            .setTimestamp();

        const requiredPermissions = [
            { name: 'Connect', bit: PermissionsBitField.Flags.Connect },
            { name: 'Speak', bit: PermissionsBitField.Flags.Speak },
            { name: 'View Channel', bit: PermissionsBitField.Flags.ViewChannel }
        ];

        const permissionStatus = requiredPermissions.map(perm => {
            const hasPermission = permissions.has(perm.bit);
            return {
                name: perm.name,
                value: hasPermission ? '✅ Autorisé' : '❌ Refusé',
                inline: true
            };
        });

        embed.addFields(permissionStatus);

        // Vérifier si le bot est muté
        const botVoiceState = member.voice;
        const isMuted = botVoiceState?.mute || false;
        const isDeafened = botVoiceState?.deaf || false;

        embed.addFields(
            { name: '🔇 État Audio', value: isMuted ? '❌ MUTÉ' : '✅ Démuté', inline: true },
            { name: '🔇 État Écoute', value: isDeafened ? '❌ SOURD' : '✅ Entend', inline: true },
            { name: '📡 Connexion', value: botVoiceState?.channel ? `✅ ${botVoiceState.channel.name}` : '❌ Non connecté', inline: true }
        );

        if (isMuted || isDeafened) {
            embed.setColor('#ff0000');
            embed.addFields({
                name: '⚠️ Action Requise',
                value: 'Le bot est muté ou sourd! Clic droit sur le bot → Démuter',
                inline: false
            });
        }

        return interaction.editReply({ embeds: [embed] });
    }
};

