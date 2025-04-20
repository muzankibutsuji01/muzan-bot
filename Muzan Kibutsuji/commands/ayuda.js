const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ayuda')
    .setDescription('📚 Muestra todos los comandos disponibles'),

  async execute(interaction) {
    const commands = interaction.client.commands;

    const embed = new EmbedBuilder()
      .setTitle('📚 Comandos disponibles')
      .setDescription('Aquí tienes una lista de todos los comandos cargados en el bot:')
      .setColor('Aqua')
      .setFooter({ text: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    const campos = [];

    for (const [name, command] of commands) {
      if (!command.data?.description) continue;

      campos.push({
        name: `/${name}`,
        value: command.data.description,
        inline: true
      });
    }

    embed.addFields(campos);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
