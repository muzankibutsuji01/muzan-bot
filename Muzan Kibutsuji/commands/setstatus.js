const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActivityType
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const CREATOR_ID = '734262131108610128'; // Tu ID
const statusPath = path.join(__dirname, '..', 'data', 'status.json');

// Asegurarse de que la carpeta 'data' exista
if (!fs.existsSync(path.dirname(statusPath))) {
    fs.mkdirSync(path.dirname(statusPath), { recursive: true });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setstatus')
        .setDescription('🔧 Cambia el estado del bot (solo el creador puede usarlo)')
        .addStringOption(option =>
            option.setName('mensaje')
                .setDescription('📝 Mensaje de estado')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('🎮 Tipo de actividad')
                .setRequired(true)
                .addChoices(
                    { name: 'Jugando 🎮', value: 'PLAYING' },
                    { name: 'Escuchando 🎧', value: 'LISTENING' },
                    { name: 'Viendo 👀', value: 'WATCHING' },
                    { name: 'Compitiendo 🏆', value: 'COMPETING' }
                ))
        .addStringOption(option =>
            option.setName('estado')
                .setDescription('🟢 Estado del bot')
                .setRequired(true)
                .addChoices(
                    { name: 'Online 🟢', value: 'online' },
                    { name: 'Idle 🌙', value: 'idle' },
                    { name: 'No molestar 🔴', value: 'dnd' },
                    { name: 'Invisible ⚫', value: 'invisible' }
                )),

    async execute(interaction) {
        if (interaction.user.id !== CREATOR_ID) {
            return interaction.reply({
                content: '🚫 Solo el creador del bot puede usar este comando.',
                ephemeral: true
            });
        }

        const mensaje = interaction.options.getString('mensaje');
        const tipo = interaction.options.getString('tipo');
        const estado = interaction.options.getString('estado');

        const tipoMap = {
            PLAYING: ActivityType.Playing,
            LISTENING: ActivityType.Listening,
            WATCHING: ActivityType.Watching,
            COMPETING: ActivityType.Competing
        };

        const tipoTexto = {
            PLAYING: 'Jugando 🎮',
            LISTENING: 'Escuchando 🎧',
            WATCHING: 'Viendo 👀',
            COMPETING: 'Compitiendo 🏆'
        };

        // Establecer presencia
        interaction.client.user.setPresence({
            activities: [{ name: mensaje, type: tipoMap[tipo] }],
            status: estado
        });

        // Guardar en status.json con el tipo como texto
        const statusData = { mensaje, tipo, estado };

        try {
            await fs.promises.writeFile(statusPath, JSON.stringify(statusData, null, 4));
        } catch (error) {
            console.error('Error al escribir en el archivo status.json:', error);
            return interaction.reply({
                content: '❌ Hubo un error al intentar guardar el estado.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('✅ Estado actualizado correctamente')
            .setColor('Green')
            .addFields(
                { name: '📝 Mensaje', value: `\`${mensaje}\`` },
                { name: '🎮 Tipo de actividad', value: `\`${tipoTexto[tipo] || 'Desconocido'}\`` },
                { name: '🟢 Estado', value: `\`${estado}\`` }
            )
            .setTimestamp()
            .setFooter({ text: 'Configurado por el creador', iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    },
};
