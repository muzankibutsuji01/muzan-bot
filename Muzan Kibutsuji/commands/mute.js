const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ms = require('ms');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../data/muteConfig.json');

function loadConfig() {
  if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, '{}');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Sistema de muteo temporal y configuración de logs.')
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
    .addSubcommand(sub =>
      sub.setName('mute')
        .setDescription('Silencia temporalmente a un usuario en el servidor.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a silenciar').setRequired(true))
        .addStringOption(opt => opt.setName('tiempo').setDescription('Tiempo de muteo (ej: 10m, 1h)').setRequired(true))
        .addStringOption(opt => opt.setName('razon').setDescription('Razón del muteo'))
    )
    .addSubcommand(sub =>
      sub.setName('set-log')
        .setDescription('Establece el canal de logs de muteos.')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal para logs').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('reset-log')
        .setDescription('Reinicia el canal de logs de muteos.')
    ),

  async execute(interaction) {
    const { guild, options, member } = interaction;
    const config = loadConfig();
    const sub = options.getSubcommand();
    const guildID = guild.id;
    const logChannelID = config[guildID]?.logChannel;
    const logChannel = logChannelID ? guild.channels.cache.get(logChannelID) : null;

    if (sub === 'mute') {
      const user = options.getUser('usuario');
      const tiempoTexto = options.getString('tiempo');
      const tiempoMs = ms(tiempoTexto);
      const razon = options.getString('razon') || 'Sin razón especificada';

      if (!tiempoMs || tiempoMs < 5000 || tiempoMs > 2419200000) {
        return interaction.reply({ content: '❌ Ingresa un tiempo válido entre 5s y 28d.', ephemeral: true });
      }

      const memberTarget = await guild.members.fetch(user.id).catch(() => null);
      if (!memberTarget) {
        return interaction.reply({ content: '❌ No encontré al usuario en el servidor.', ephemeral: true });
      }

      try {
        await memberTarget.timeout(tiempoMs, razon);

        const embed = new EmbedBuilder()
          .setTitle('🔇 Usuario Silenciado')
          .setColor('Orange')
          .addFields(
            { name: '👤 Usuario', value: `${user.tag} (${user.id})` },
            { name: '⏳ Tiempo', value: tiempoTexto },
            { name: '📝 Razón', value: razon },
            { name: '👮 Ejecutado por', value: `${member.user.tag}` },
            { name: '📅 Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        if (logChannel) logChannel.send({ embeds: [embed] });

      } catch (err) {
        console.error(err);
        return interaction.reply({ content: '❌ No se pudo silenciar al usuario.', ephemeral: true });
      }

    } else if (sub === 'set-log') {
      const canal = options.getChannel('canal');
      config[guildID] = { logChannel: canal.id };
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setTitle('📥 Canal de logs configurado')
        .setDescription(`Los muteos ahora se registrarán en ${canal}`)
        .setColor('Blue')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (sub === 'reset-log') {
      if (!config[guildID]) {
        return interaction.reply({ content: '⚠️ No hay canal de log configurado.', ephemeral: true });
      }

      delete config[guildID];
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setTitle('♻️ Canal de logs reiniciado')
        .setDescription('Se eliminó la configuración del canal de logs de muteos.')
        .setColor('Grey')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};
