const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'warns.json');
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '{}');

function guardarWarns(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Sistema de advertencias')
        .addSubcommand(sub => 
            sub.setName('add')
                .setDescription('🚫 Añade una advertencia a un usuario')
                .addUserOption(opt => 
                    opt.setName('usuario').setDescription('Usuario a advertir').setRequired(true))
                .addStringOption(opt => 
                    opt.setName('razon').setDescription('Razón de la advertencia').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('quit')
                .setDescription('✅ Quita una advertencia a un usuario')
                .addUserOption(opt => 
                    opt.setName('usuario').setDescription('Usuario').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('check')
                .setDescription('🔍 Ver advertencias de un usuario')
                .addUserOption(opt => 
                    opt.setName('usuario').setDescription('Usuario').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('warnlogs')
                .setDescription('📋 Establece el canal para logs de advertencias')
                .addChannelOption(opt =>
                    opt.setName('canal').setDescription('Canal de logs').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('warnremovelogs')
                .setDescription('🗑️ Elimina la configuración del canal de logs')
        ),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const warns = JSON.parse(fs.readFileSync(dataPath));
        const guildId = interaction.guild.id;

        switch (sub) {
            case 'add': {
                const user = interaction.options.getUser('usuario');
                const razon = interaction.options.getString('razon');

                if (!warns[guildId]) warns[guildId] = {};
                if (!warns[guildId][user.id]) warns[guildId][user.id] = [];
                warns[guildId][user.id].push({ razon, autor: interaction.user.id, fecha: Date.now() });
                guardarWarns(warns);

                const embed = new EmbedBuilder()
                    .setTitle('🚫 Nueva Advertencia')
                    .setDescription(`**Usuario:** ${user}\n**Razón:** \`${razon}\`\n**Autor:** <@${interaction.user.id}>`)
                    .setColor('Red')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });

                const logPath = path.join(__dirname, '..', 'data', 'warnlogs.json');
                if (fs.existsSync(logPath)) {
                    const logs = JSON.parse(fs.readFileSync(logPath));
                    const channelId = logs[guildId];
                    const logChannel = interaction.guild.channels.cache.get(channelId);
                    if (logChannel) logChannel.send({ embeds: [embed] });
                }

                break;
            }
            case 'quit': {
                const user = interaction.options.getUser('usuario');
                if (warns[guildId]?.[user.id]?.length > 0) {
                    warns[guildId][user.id].pop();
                    guardarWarns(warns);
                    await interaction.reply(`✅ Se ha eliminado la última advertencia de ${user}.`);
                } else {
                    await interaction.reply(`⚠️ ${user} no tiene advertencias.`);
                }
                break;
            }
            case 'check': {
                const user = interaction.options.getUser('usuario');
                const lista = warns[guildId]?.[user.id];

                if (lista && lista.length > 0) {
                    const embed = new EmbedBuilder()
                        .setTitle(`📄 Advertencias de ${user.username}`)
                        .setColor('Orange')
                        .setDescription(lista.map((w, i) =>
                            `\`${i + 1}.\` ${w.razon} — <@${w.autor}> — <t:${Math.floor(w.fecha / 1000)}:F>`
                        ).join('\n'))
                        .setFooter({ text: `Total: ${lista.length}` });

                    await interaction.reply({ embeds: [embed] });
                } else {
                    await interaction.reply(`🎉 ${user} no tiene advertencias.`);
                }
                break;
            }
            case 'warnlogs': {
                if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: '❌ No tienes permisos para hacer esto.', ephemeral: true });
                }

                const canal = interaction.options.getChannel('canal');
                const logPath = path.join(__dirname, '..', 'data', 'warnlogs.json');
                let logs = {};

                if (fs.existsSync(logPath)) {
                    logs = JSON.parse(fs.readFileSync(logPath));
                }

                logs[guildId] = canal.id;
                fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

                await interaction.reply(`✅ Canal de logs configurado: ${canal}`);
                break;
            }
            case 'warnremovelogs': {
                const logPath = path.join(__dirname, '..', 'data', 'warnlogs.json');
                if (fs.existsSync(logPath)) {
                    const logs = JSON.parse(fs.readFileSync(logPath));
                    delete logs[guildId];
                    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
                }

                await interaction.reply('🗑️ Canal de logs eliminado correctamente.');
                break;
            }
        }
    }
};
