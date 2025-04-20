const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Ruta del archivo logchannel.json
const logChannelPath = path.join(__dirname, '..', 'data', 'logchannel.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogchannel')
    .setDescription('🔧 Configura el canal de logs para los comandos ejecutados.')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('El canal de logs donde se enviarán los registros de los comandos')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Verificar que el usuario tenga permisos de administrador
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: '🚫 Solo los administradores pueden configurar el canal de logs.',
        ephemeral: true
      });
    }

    const canalLogs = interaction.options.getChannel('canal');

    // Leer el archivo logchannel.json y actualizarlo
    let logData = {};
    if (fs.existsSync(logChannelPath)) {
      logData = JSON.parse(fs.readFileSync(logChannelPath, 'utf8'));
    }

    // Guardar el nuevo canal de logs para el servidor actual
    logData[interaction.guild.id] = canalLogs.id;
    fs.writeFileSync(logChannelPath, JSON.stringify(logData, null, 4));

    const embed = new EmbedBuilder()
      .setTitle('✅ Canal de logs configurado')
      .setColor('Green')
      .setDescription(`El canal de logs ha sido configurado en: ${canalLogs}`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
