const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../data/kickConfig.json');

function loadConfig() {
  if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, '{}');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Sistema de expulsión y configuración de logs.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addSubcommand(sub =>
      sub.setName('kick')
        .setDescription('Expulsa a un usuario del servidor.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
        .addStringOption(opt => opt.setName('razon').setDescription('Razón de la expulsión'))
    )
    .addSubcommand(sub =>
      sub.setName('set-log')
        .setDescription('Establece el canal de logs de expulsiones.')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal para logs').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('reset-log')
        .setDescription('Reinicia el canal de logs de expulsiones.')
    ),

  async execute(interaction) {
    const { guild, options, member } = interaction;
    const config = loadConfig();
    const sub = options.getSubcommand();
    const guildID = guild.id;
    const logChannelID = config[guildID]?.logChannel;
    const logChannel = logChannelID ? guild.channels.cache.get(logChannelID) : null;

    if (sub === 'kick') {
      const user = options.getUser('usuario');
      const razon = options.getString('razon') || 'Sin razón especificada';

      const memberTarget = await guild.members.fetch(user.id).catch(() => null);
      if (!memberTarget) {
        return interaction.reply({ content: '❌ No encontré al usuario en el servidor.', ephemeral: true });
      }

      try {
        await memberTarget.kick(razon);

        const embed = new EmbedBuilder()
          .setTitle('👢 Usuario Expulsado')
          .setColor('Orange')
          .addFields(
            { name: '👤 Usuario', value: `${user.tag} (${user.id})` },
            { name: '📝 Razón', value: razon },
            { name: '👮 Ejecutado por', value: `${member.user.tag}` },
            { name: '📅 Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        if (logChannel) logChannel.send({ embeds: [embed] });

      } catch (err) {
        console.error(err);
        return interaction.reply({ content: '❌ Ocurrió un error al expulsar al usuario.', ephemeral: true });
      }

    } else if (sub === 'set-log') {
      const canal = options.getChannel('canal');
      config[guildID] = { logChannel: canal.id };
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setTitle('📥 Canal de logs configurado')
        .setDescription(`Las expulsiones ahora se registrarán en ${canal}`)
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
        .setDescription('Se eliminó la configuración del canal de logs de expulsiones.')
        .setColor('Grey')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};
