const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletemessages')
    .setDescription('🧹 Borra un número específico de mensajes en el canal actual.')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Número de mensajes a borrar (máximo 100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)),

  async execute(interaction) {
    const cantidad = interaction.options.getInteger('cantidad');

    // Crear un embed elegante para la confirmación
    const embed = new EmbedBuilder()
      .setTitle('🧹 Confirmación para borrar mensajes')
      .setColor('#FF3B3F') // Color rojo al estilo de Muzan
      .setDescription(`¿Estás seguro de que deseas borrar **${cantidad}** mensajes?`)
      .setFooter({ text: 'Confirmación de borrado', iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    // Crear botones para confirmar o cancelar
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirmar')
        .setLabel('Confirmar')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancelar')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );

    // Enviar el mensaje de confirmación
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });

    // Esperar la interacción del usuario (botón)
    const filter = i => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
      if (i.customId === 'confirmar') {
        // Borrar los mensajes si se confirma
        try {
          const messages = await interaction.channel.messages.fetch({ limit: cantidad });
          await interaction.channel.bulkDelete(messages, true);
          
          const successEmbed = new EmbedBuilder()
            .setTitle('✅ Mensajes borrados')
            .setColor('#3FFDA5')
            .setDescription(`Se han borrado **${cantidad}** mensajes correctamente.`)
            .setFooter({ text: 'Operación completada', iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();
          
          await i.update({
            embeds: [successEmbed],
            components: [] // Eliminar los botones después de la acción
          });

        } catch (error) {
          console.error('Error al borrar mensajes:', error);
          const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error al borrar mensajes')
            .setColor('#FF3B3F')
            .setDescription('Hubo un error al intentar borrar los mensajes. Intenta de nuevo más tarde.')
            .setFooter({ text: 'Error', iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

          await i.update({
            embeds: [errorEmbed],
            components: [] // Eliminar los botones después del error
          });
        }

      } else if (i.customId === 'cancelar') {
        // Cancelar la acción de borrado
        const cancelEmbed = new EmbedBuilder()
          .setTitle('❌ Borrado cancelado')
          .setColor('#FF3B3F')
          .setDescription('La acción de borrado ha sido cancelada.')
          .setFooter({ text: 'Operación cancelada', iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        await i.update({
          embeds: [cancelEmbed],
          components: [] // Eliminar los botones después de la cancelación
        });
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle('⏳ Tiempo de espera agotado')
          .setColor('#FF3B3F')
          .setDescription('El tiempo de espera para confirmar la acción ha expirado.')
          .setFooter({ text: 'Operación no confirmada', iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        interaction.editReply({
          embeds: [timeoutEmbed],
          components: [] // Eliminar los botones después del tiempo agotado
        });
      }
    });
  },
};
