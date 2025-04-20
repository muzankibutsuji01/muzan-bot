const { Client, GatewayIntentBits, Collection, EmbedBuilder, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// 📦 Cargar comandos automáticamente desde /commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[⚠️] El comando en ${filePath} no tiene las propiedades requeridas "data" o "execute".`);
  }
}

console.log(`📦 Comandos cargados: [\n  ${[...client.commands.keys()].join(',\n  ')}\n]`);

client.once(Events.ClientReady, async () => {
  console.log(`✅ ¡Conectado como ${client.user.tag}!`);

  // 🌐 Restaurar presencia desde status.json
  const statusPath = path.join(__dirname, 'data', 'status.json');
  let mensaje = '¡Estoy listo!';
  let tipo = 'PLAYING';
  let estado = 'online';

  if (fs.existsSync(statusPath)) {
    try {
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      mensaje = status.mensaje || mensaje;
      tipo = status.tipo || tipo;
      estado = status.estado || estado;

      client.user.setPresence({
        activities: [{ name: mensaje, type: tipo }],
        status: estado
      });

      console.log('🟢 Presencia del bot configurada');
    } catch (err) {
      console.error('❌ Error al leer status.json:', err);
    }
  }

  // 📤 Enviar log de reinicio
  const logPath = path.join(__dirname, 'data', 'logchannel.json');
  if (fs.existsSync(logPath)) {
    const logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));

    for (const [guildId, channelId] of Object.entries(logData)) {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;
      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;

      const embed = new EmbedBuilder()
        .setTitle('🔄 Bot reiniciado')
        .setDescription('El bot está de nuevo **en línea**.')
        .setColor('Blue')
        .addFields(
          { name: '📝 Mensaje', value: `\`${mensaje}\`` },
          { name: '🎮 Tipo', value: `\`${tipo}\`` },
          { name: '🟢 Estado', value: `\`${estado}\`` }
        )
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

      channel.send({ embeds: [embed] }).catch(console.error);
    }
  }

  // 🔍 Verificar comandos registrados en Discord
  client.application.commands.fetch()
    .then(commands => {
      console.log('📄 Comandos registrados en Discord: [\n  ' + commands.map(cmd => cmd.name).join(',\n  ') + '\n]');
    })
    .catch(console.error);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // 📦 Botones personalizados
  if (interaction.isButton()) {
    if (interaction.customId === 'aceptar_reglas') {
      const reglasPath = path.join(__dirname, 'data', 'reglas.json');
      if (!fs.existsSync(reglasPath)) return;

      const reglasData = JSON.parse(fs.readFileSync(reglasPath, 'utf-8'));
      const reglas = reglasData[interaction.guild.id];
      if (!reglas || !reglas.rol) {
        return interaction.reply({ content: '❌ No se ha configurado ningún rol.', ephemeral: true });
      }

      const rol = interaction.guild.roles.cache.get(reglas.rol);
      if (!rol) {
        return interaction.reply({ content: '❌ El rol configurado no existe.', ephemeral: true });
      }

      try {
        await interaction.member.roles.add(rol);
        interaction.reply({ content: '✅ Has aceptado las reglas y se te ha asignado el rol.', ephemeral: true });
      } catch (error) {
        console.error(error);
        interaction.reply({ content: '❌ Hubo un error al asignarte el rol.', ephemeral: true });
      }
    }
    return;
  }

  // 📥 Comandos normales
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    // 📝 Log de ejecución
    const logPath = path.join(__dirname, 'data', 'logchannel.json');
    if (fs.existsSync(logPath)) {
      const logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));

      for (const [guildId, channelId] of Object.entries(logData)) {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;
        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;

        const embed = new EmbedBuilder()
          .setTitle('📝 Comando ejecutado')
          .setDescription(`\`/${interaction.commandName}\` fue ejecutado por <@${interaction.user.id}>`)
          .setColor('Yellow')
          .addFields(
            { name: '👤 Usuario', value: interaction.user.tag },
            { name: '📅 Fecha', value: new Date().toLocaleString() }
          )
          .setTimestamp()
          .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

        channel.send({ embeds: [embed] }).catch(console.error);
      }
    }

    await command.execute(interaction);
  } catch (error) {
    console.error(`💥 Error ejecutando /${interaction.commandName}:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ Ocurrió un error al ejecutar este comando.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '❌ Ocurrió un error al ejecutar este comando.',
        ephemeral: true
      });
    }
  }
});

// 🚀 Iniciar el bot
client.login(process.env.TOKEN);
console.log('🔑 Iniciando sesión...');
console.log('🔁 Esperando interacciones...');
console.log('🔄 Reiniciando...');