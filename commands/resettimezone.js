const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { resetUserTimezone } = require('../utils/timezoneStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resettimezone')
    .setDescription('Clear your saved timezone and use detection/manual setup again'),

  async execute(interaction) {
    if (!resetUserTimezone(interaction.user.id)) {
      const reply = await interaction.reply({
        content: 'ℹ️ You do not have a saved timezone to reset. Use /detecttz or /settimezone to set one.',
        flags: MessageFlags.Ephemeral,
        fetchReply: true,
      });
      setTimeout(() => reply.delete().catch(() => {}), 15000);
      return;
    }

    const reply = await interaction.reply({
      content: '✅ Your saved timezone has been removed. You can now use /detecttz or /settimezone again.',
      flags: MessageFlags.Ephemeral,
      fetchReply: true,
    });
    setTimeout(() => reply.delete().catch(() => {}), 15000);
  },
};