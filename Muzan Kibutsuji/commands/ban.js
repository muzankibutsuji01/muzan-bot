const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../data/banConfig.json');

function loadConfig() {
  if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, '{}');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Sistema de baneos y configuración de logs.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addSubcommand(sub =>
      sub.setName('ban')
        .setDescription('Banea a un usuario del servidor.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a banear').setRequired(true))
        .addStringOption(opt => opt.setName('razon').setDescription('Razón del baneo').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('unban')
        .setDescription('Desbanea a un usuario por ID.')
        .addStringOption(opt => opt.setName('id').setDescription('ID del usuario a desbanear').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('set-log')
        .setDescription('Establece el canal de logs de baneos.')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal para logs').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('reset-log')
        .setDescription('Reinicia el canal de logs de baneos.')
    ),

  async execute(interaction) {
    const { guild, options, member } = interaction;
    const config = loadConfig();
    const sub = options.getSubcommand();

    const guildID = guild.id;
    const logChannelID = config[guildID]?.logChannel;
    const logChannel = logChannelID ? guild.channels.cache.get(logChannelID) : null;

    if (sub === 'ban') {
      const user = options.getUser('usuario');
      const razon = options.getString('razon') || 'Sin razón especificada';

      try {
        await guild.members.ban(user.id, { reason: razon });

        const embed = new EmbedBuilder()
          .setTitle('🔨 Usuario Baneado')
          .setColor('Red')
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
        return interaction.reply({ content: '❌ No pude banear al usuario.', ephemeral: true });
      }

    } else if (sub === 'unban') {
      const id = options.getString('id');
      try {
        const user = await guild.members.unban(id);

        const embed = new EmbedBuilder()
          .setTitle('♻️ Usuario Desbaneado')
          .setColor('Green')
          .addFields(
            { name: '👤 Usuario', value: `${user.tag} (${user.id})` },
            { name: '👮 Ejecutado por', value: `${member.user.tag}` },
            { name: '📅 Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        if (logChannel) logChannel.send({ embeds: [embed] });

      } catch (err) {
        return interaction.reply({ content: '❌ No pude desbanear al usuario. Asegúrate que el ID es válido.', ephemeral: true });
      }

    } else if (sub === 'set-log') {
      const canal = options.getChannel('canal');
      config[guildID] = { logChannel: canal.id };
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setTitle('✅ Canal de logs establecido')
        .setDescription(`Los baneos ahora se enviarán a ${canal}`)
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
        .setDescription('Se eliminó la configuración del canal de logs.')
        .setColor('Orange')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};
