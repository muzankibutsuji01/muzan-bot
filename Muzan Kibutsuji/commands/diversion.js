const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const cooldown = new Map();

const chistes = [
  '¿Por qué los programadores confunden Halloween y Navidad? Porque OCT 31 == DEC 25.',
  '—¿Cómo se llama un perro sin patas?\n—No importa, no va a venir.',
  '¿Qué le dice un jardinero a otro?\n—¡Disfrutemos mientras podamos!',
  '¿Por qué el libro de matemáticas estaba triste?\n—Porque tenía demasiados problemas.',
];

const respuestas8Ball = [
  '🎯 Sí, definitivamente.',
  '❌ No cuentes con ello.',
  '🤔 Es posible...',
  '🔮 Pregunta de nuevo más tarde.',
  '✅ Sin duda.',
  '⚠️ No lo creo.',
  '🌀 Tal vez.',
  '📉 Mis fuentes dicen que no.',
];

const gifs = {
  kiss: [
    'https://media.tenor.com/Iko1sJYwHcsAAAAC/anime-kiss-love.gif',
    'https://media.tenor.com/ONeJmOoxWqsAAAAC/kiss-anime.gif',
    'https://media.tenor.com/kCZjTqCKiggAAAAC/anime-kiss.gif',
  ],
  hug: [
    'https://media.tenor.com/GfSX-u7VGM4AAAAC/anime-hug.gif',
    'https://media.tenor.com/2dlLVRjB8A8AAAAC/anime-hug-hug.gif',
  ],
  slap: [
    'https://media.tenor.com/Rs7K35yRZQcAAAAC/anime-slap.gif',
    'https://media.tenor.com/XjRmpVpLGEQAAAAC/slap.gif',
  ],
  kill: [
    'https://media.tenor.com/Yn7V8Zat7WwAAAAC/anime-death.gif',
    'https://media.tenor.com/GHtVoN7XlHMAAAAC/kill-anime.gif',
  ],
  pat: [
    'https://media.tenor.com/I3fSmnGoWQ0AAAAC/anime-pat.gif',
    'https://media.tenor.com/6-xBdYtG2K0AAAAC/anime-head-pat.gif',
  ],
  chiste: [
    'https://media.tenor.com/umU6XTRlqzIAAAAd/laughing-anime.gif',
    'https://media.tenor.com/SvH3ndCMkq0AAAAC/funny-anime-laugh.gif',
  ],
  coinflip: [
    'https://media.tenor.com/OexhM1Xe_SIAAAAC/coin-flip.gif',
  ],
  ball: [
    'https://media.tenor.com/4YBZWOPNvMoAAAAC/magic8ball-prediction.gif',
  ]
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('diversion')
    .setDescription('Comandos divertidos 🎉')
    .addSubcommand(sub =>
      sub.setName('chiste')
        .setDescription('Te cuento un chiste 🤡')
    )
    .addSubcommand(sub =>
      sub.setName('coinflip')
        .setDescription('Lanza una moneda 🪙')
    )
    .addSubcommand(sub =>
      sub.setName('kiss')
        .setDescription('Envía un beso a alguien 😘')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a besar').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('hug')
        .setDescription('Abraza a un usuario 🤗')
        .addUserOption(opt => opt.setName('usuario').setDescription('A quién abrazas').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('slap')
        .setDescription('Da una bofetada a alguien 👋')
        .addUserOption(opt => opt.setName('usuario').setDescription('A quién das la bofetada').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('kill')
        .setDescription('Elimina a un usuario de forma dramática 🔪')
        .addUserOption(opt => opt.setName('usuario').setDescription('A quién matas').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('pat')
        .setDescription('Acaricia a alguien 🐾')
        .addUserOption(opt => opt.setName('usuario').setDescription('A quién acaricias').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('8ball')
        .setDescription('Hazle una pregunta a la bola mágica 🎱')
        .addStringOption(opt => opt.setName('pregunta').setDescription('Tu pregunta').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const cooldownKey = `${sub}-${userId}`;

    // Anti-spam: 5 segundos por subcomando
    if (cooldown.has(cooldownKey)) {
      const lastUsed = cooldown.get(cooldownKey);
      const now = Date.now();
      const remaining = Math.ceil((lastUsed + 5000 - now) / 1000);
      if (now < lastUsed + 5000) {
        return interaction.reply({ content: `⏳ Espera ${remaining}s antes de usar este comando de nuevo.`, ephemeral: true });
      }
    }
    cooldown.set(cooldownKey, Date.now());

    if (sub === 'chiste') {
      const chiste = chistes[Math.floor(Math.random() * chistes.length)];
      const gif = gifs.chiste[Math.floor(Math.random() * gifs.chiste.length)];

      const embed = new EmbedBuilder()
        .setTitle('😂 Chiste del día')
        .setDescription(chiste)
        .setImage(gif)
        .setColor('Random')
        .setFooter({ text: '¡Espero que te hayas reído!' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (sub === 'coinflip') {
      const resultado = Math.random() < 0.5 ? '🪙 Cara' : '🪙 Cruz';
      const gif = gifs.coinflip[0];

      const embed = new EmbedBuilder()
        .setTitle('🪙 Lanzamiento de Moneda')
        .setDescription(`Resultado: **${resultado}**`)
        .setImage(gif)
        .setColor('Gold')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (sub === 'kiss') {
      const usuario = interaction.options.getUser('usuario');
      const gif = gifs.kiss[Math.floor(Math.random() * gifs.kiss.length)];

      const embed = new EmbedBuilder()
        .setTitle('💏 Beso enviado')
        .setDescription(`${interaction.user} le ha dado un beso a ${usuario} 😘`)
        .setImage(gif)
        .setColor('Pink')
        .setFooter({ text: '¡Qué tierno!' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (sub === 'hug') {
      const usuario = interaction.options.getUser('usuario');
      const gif = gifs.hug[Math.floor(Math.random() * gifs.hug.length)];

      const embed = new EmbedBuilder()
        .setTitle('🤗 Abrazo enviado')
        .setDescription(`${interaction.user} ha abrazado a ${usuario} con cariño 🤗`)
        .setImage(gif)
        .setColor('Purple')
        .setFooter({ text: '¡Qué bonito abrazo!' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (sub === 'slap') {
      const usuario = interaction.options.getUser('usuario');
      const gif = gifs.slap[Math.floor(Math.random() * gifs.slap.length)];

      const embed = new EmbedBuilder()
        .setTitle('👋 Bofetada enviada')
        .setDescription(`${interaction.user} le dio una bofetada a ${usuario} 👋`)
        .setImage(gif)
        .setColor('Red')
        .setFooter({ text: '¡Duro como un anime!' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (sub === 'kill') {
      const usuario = interaction.options.getUser('usuario');
      const gif = gifs.kill[Math.floor(Math.random() * gifs.kill.length)];

      const embed = new EmbedBuilder()
        .setTitle('🔪 Eliminado')
        .setDescription(`${interaction.user} ha "eliminado" dramáticamente a ${usuario} 💀`)
        .setImage(gif)
        .setColor('DarkRed')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (sub === 'pat') {
      const usuario = interaction.options.getUser('usuario');
      const gif = gifs.pat[Math.floor(Math.random() * gifs.pat.length)];

      const embed = new EmbedBuilder()
        .setTitle('🐾 Caricia')
        .setDescription(`${interaction.user} acarició la cabeza de ${usuario} con ternura ✨`)
        .setImage(gif)
        .setColor('Green')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (sub === '8ball') {
      const pregunta = interaction.options.getString('pregunta');
      const respuesta = respuestas8Ball[Math.floor(Math.random() * respuestas8Ball.length)];
      const gif = gifs.ball[Math.floor(Math.random() * gifs.ball.length)];

      const embed = new EmbedBuilder()
        .setTitle('🎱 Bola Mágica')
        .addFields(
          { name: '❓ Pregunta', value: pregunta },
          { name: '🔮 Respuesta', value: respuesta }
        )
        .setImage(gif)
        .setColor('Purple')
        .setFooter({ text: 'La bola ha hablado...' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};
