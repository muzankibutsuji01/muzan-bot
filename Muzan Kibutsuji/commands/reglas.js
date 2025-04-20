const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const reglasPath = path.join(__dirname, '../data/reglas.json');

function guardarConfig(guildId, data) {
    let reglas = {};
    if (fs.existsSync(reglasPath)) {
        reglas = JSON.parse(fs.readFileSync(reglasPath, 'utf-8'));
    }
    reglas[guildId] = { ...reglas[guildId], ...data };
    fs.writeFileSync(reglasPath, JSON.stringify(reglas, null, 4));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reglas')
        .setDescription('📜 Comando para configurar las reglas del servidor')
        .addSubcommand(sub =>
            sub.setName('settittle').setDescription('📌 Configura el título del embed').addStringOption(opt =>
                opt.setName('titulo').setDescription('Título del embed').setRequired(true)
            )
        )
        .addSubcommand(sub =>
            sub.setName('setdescripcion').setDescription('📝 Configura la descripción del embed').addStringOption(opt =>
                opt.setName('descripcion').setDescription('Descripción con las reglas').setRequired(true)
            )
        )
        .addSubcommand(sub =>
            sub.setName('setimagen').setDescription('🖼️ Configura la imagen del embed').addStringOption(opt =>
                opt.setName('url').setDescription('URL de la imagen').setRequired(true)
            )
        )
        .addSubcommand(sub =>
            sub.setName('setrol').setDescription('🎭 Configura el rol que se dará al aceptar las reglas').addRoleOption(opt =>
                opt.setName('rol').setDescription('Rol que se asignará').setRequired(true)
            )
        )
        .addSubcommand(sub =>
            sub.setName('enviar').setDescription('📤 Envía las reglas con el botón para aceptar')
                .addChannelOption(opt => opt.setName('canal').setDescription('Canal donde enviar el mensaje').setRequired(true))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'settittle') {
            const titulo = interaction.options.getString('titulo');
            guardarConfig(guildId, { titulo });
            return interaction.reply({ content: '✅ Título configurado con éxito.', ephemeral: true });

        } else if (sub === 'setdescripcion') {
            const descripcion = interaction.options.getString('descripcion');
            guardarConfig(guildId, { descripcion });
            return interaction.reply({ content: '✅ Descripción configurada con éxito.', ephemeral: true });

        } else if (sub === 'setimagen') {
            const url = interaction.options.getString('url');
            guardarConfig(guildId, { imagen: url });
            return interaction.reply({ content: '✅ Imagen configurada con éxito.', ephemeral: true });

        } else if (sub === 'setrol') {
            const rol = interaction.options.getRole('rol');
            guardarConfig(guildId, { rol: rol.id });
            return interaction.reply({ content: `✅ Rol configurado: ${rol}`, ephemeral: true });

        } else if (sub === 'enviar') {
            if (!fs.existsSync(reglasPath)) return interaction.reply({ content: '❌ Aún no se ha configurado nada.', ephemeral: true });
            const reglas = JSON.parse(fs.readFileSync(reglasPath, 'utf-8'))[guildId];
            if (!reglas || !reglas.titulo || !reglas.descripcion || !reglas.rol) {
                return interaction.reply({ content: '❌ Faltan datos configurados (título, descripción o rol).', ephemeral: true });
            }

            const canal = interaction.options.getChannel('canal');
            const embed = new EmbedBuilder()
                .setTitle(reglas.titulo)
                .setDescription(reglas.descripcion)
                .setColor('Yellow')
                .setTimestamp();

            if (reglas.imagen) embed.setImage(reglas.imagen);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('aceptar_reglas')
                    .setLabel('✅ Aceptar Reglas')
                    .setStyle(ButtonStyle.Success)
            );

            canal.send({ embeds: [embed], components: [row] });
            interaction.reply({ content: '📤 Reglas enviadas correctamente.', ephemeral: true });
        }
    }
};
