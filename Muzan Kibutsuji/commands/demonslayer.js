const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demonslayer')
        .setDescription('🗡️ Comandos de roleplay basados en Demon Slayer')
        .addSubcommand(subcommand =>
            subcommand
                .setName('respirar')
                .setDescription('🌬️ Realiza una técnica de respiración')
                .addStringOption(option =>
                    option
                        .setName('estilo')
                        .setDescription('Elige tu estilo de respiración')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Respiración del Agua 💧', value: 'agua' },
                            { name: 'Respiración del Fuego 🔥', value: 'fuego' },
                            { name: 'Respiración del Rayo ⚡', value: 'rayo' },
                            { name: 'Respiración de la Bestia 🐗', value: 'bestia' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ataque')
                .setDescription('⚔️ Realiza un ataque contra un demonio')
                .addStringOption(option =>
                    option
                        .setName('tecnica')
                        .setDescription('Nombre de tu técnica de ataque')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('transformar')
                .setDescription('👹 Transformarte en un demonio')
                .addBooleanOption(option =>
                    option
                        .setName('aceptar')
                        .setDescription('¿Aceptas convertirte en un demonio?')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'respirar') {
            const estilo = interaction.options.getString('estilo');
            const estilos = {
                agua: '💧 Agua',
                fuego: '🔥 Fuego',
                rayo: '⚡ Rayo',
                bestia: '🐗 Bestia'
            };

            const embed = new EmbedBuilder()
                .setTitle('🌬️ ¡Técnica de Respiración!')
                .setDescription(`${interaction.user} ha usado la técnica de **Respiración del ${estilos[estilo]}**`)
                .setColor('Blue')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'ataque') {
            const tecnica = interaction.options.getString('tecnica');

            const embed = new EmbedBuilder()
                .setTitle('⚔️ ¡Ataque Realizado!')
                .setDescription(`${interaction.user} ha realizado el ataque especial: **${tecnica}**`)
                .setColor('Red')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'transformar') {
            const aceptar = interaction.options.getBoolean('aceptar');

            const embed = new EmbedBuilder()
                .setColor(aceptar ? 'DarkRed' : 'Grey')
                .setTitle(aceptar ? '👹 Te has convertido en un demonio' : '🛡️ Has rechazado la oscuridad')
                .setDescription(aceptar
                    ? `${interaction.user} ha aceptado el poder demoníaco... ¡Prepárate para la oscuridad!`
                    : `${interaction.user} ha mantenido su humanidad y rechazó convertirse en demonio.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },
};
