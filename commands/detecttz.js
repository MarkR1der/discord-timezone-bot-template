const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { createTimezoneSession } = require('../utils/timezoneSessionStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('detecttz')
    .setDescription('Set your timezone using your browser on your device'),
  
  async execute(interaction) {
    if (process.env.TIMEZONE_WEB_ENABLED === 'false') {
      const fallbackReply = await interaction.reply({
        content: '⚠️ Browser-based timezone setup is currently unavailable. Please use `/settimezone` (for example: `/settimezone Asia/Manila`).',
        flags: MessageFlags.Ephemeral,
        fetchReply: true,
      });

      setTimeout(() => {
        fallbackReply.delete().catch(() => {});
      }, 15000);
      return;
    }

    const token = createTimezoneSession(interaction.user.id);
    const configuredBaseUrl = process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL;
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const baseUrl = configuredBaseUrl || (isDevelopment
      ? `http://localhost:${process.env.PORT || process.env.TIMEZONE_WEB_PORT || 3000}`
      : null);

    if (!baseUrl) {
      const configReply = await interaction.reply({
        content: '⚠️ Timezone setup link is not configured on this deployment. Set `PUBLIC_BASE_URL` to your public Render URL, then try `/detecttz` again. You can use `/settimezone` meanwhile.',
        flags: MessageFlags.Ephemeral,
        fetchReply: true,
      });

      setTimeout(() => {
        configReply.delete().catch(() => {});
      }, 20000);
      return;
    }

    const setupUrl = `${baseUrl.replace(/\/$/, '')}/timezone/setup?token=${token}`;
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Open Timezone Setup')
        .setStyle(ButtonStyle.Link)
        .setURL(setupUrl)
    );

    const reply = await interaction.reply({
      content: 'Open the link below on the device whose timezone you want to use. The page will read the browser timezone from that device and save only the timezone name.',
      components: [row],
      flags: MessageFlags.Ephemeral,
      fetchReply: true,
    });

    setTimeout(() => {
      reply.delete().catch(() => {});
    }, 15000);
  },
};
