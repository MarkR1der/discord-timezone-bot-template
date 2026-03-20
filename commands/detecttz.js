const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { createTimezoneSession } = require('../utils/timezoneSessionStore');

function getSetupBaseUrl() {
  const configuredBaseUrl = process.env.RENDER_EXTERNAL_URL
    || (process.env.NODE_ENV !== 'production' ? process.env.PUBLIC_BASE_URL : null);
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (process.env.ALLOW_LOCALHOST_DETECTTZ === 'true') {
    return `http://localhost:${process.env.PORT || process.env.TIMEZONE_WEB_PORT || 3000}`;
  }

  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('detecttz')
    .setDescription('Set your timezone using your browser on your device'),
  
  async execute(interaction) {
    if (process.env.TIMEZONE_WEB_ENABLED === 'false') {
      const fallbackReply = await interaction.editReply({
        content: '⚠️ Browser-based timezone setup is currently unavailable. Please use `/settimezone` (for example: `/settimezone Asia/Manila`).',
        fetchReply: true,
      });

      setTimeout(() => {
        fallbackReply.delete().catch(() => {});
      }, 15000);
      return;
    }

    const token = createTimezoneSession(interaction.user.id);
    const baseUrl = getSetupBaseUrl();

    if (!baseUrl) {
      const configReply = await interaction.editReply({
        content: '⚠️ Timezone setup link is not configured with a public URL. Set `PUBLIC_BASE_URL` to your public Render URL, then try `/detecttz` again. For local-only testing, you can set `ALLOW_LOCALHOST_DETECTTZ=true`. You can use `/settimezone` meanwhile.',
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

    const reply = await interaction.editReply({
      content: 'Open the link below on the device whose timezone you want to use. The page will read the browser timezone from that device and save only the timezone name.',
      components: [row],
      fetchReply: true,
    });

    setTimeout(() => {
      reply.delete().catch(() => {});
    }, 15000);
  },
};
