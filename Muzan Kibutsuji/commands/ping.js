const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('📶 Comprueba la latencia del bot'),
        
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('🏓 Pong!')
            .setDescription(`📡 Latencia: \`${Date.now() - interaction.createdTimestamp}ms\``)
            .setFooter({ text: 'Sistema de ping del bot', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    },
};
