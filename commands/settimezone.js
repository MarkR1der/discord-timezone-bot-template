const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { setUserTimezone } = require('../utils/timezoneStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settimezone')
    .setDescription('Set your timezone (e.g., America/New_York, Europe/London, Asia/Tokyo)')
    .addStringOption(option =>
      option
        .setName('timezone')
        .setDescription('Your timezone (e.g., America/New_York)')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const timezone = interaction.options.getString('timezone');
    const userId = interaction.user.id;

    // Validate timezone
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    } catch (error) {
      const reply = await interaction.reply({
        content: `❌ Invalid timezone: **${timezone}**\n\nUse timezones like:\n- \`America/New_York\`\n- \`America/Chicago\`\n- \`America/Los_Angeles\`\n- \`Europe/London\`\n- \`Europe/Paris\`\n- \`Asia/Tokyo\`\n- \`Asia/Dubai\`\n- \`Australia/Sydney\``,
        flags: MessageFlags.Ephemeral,
        fetchReply: true
      });
      setTimeout(() => reply.delete().catch(() => {}), 15000);
      return;
    }

    setUserTimezone(userId, timezone);

    const reply = await interaction.reply({
      content: `✅ Your timezone has been set to **${timezone}**!\n\nNow when people use \`/memberinfo\`, your time will be displayed in your timezone!`,
      flags: MessageFlags.Ephemeral,
      fetchReply: true
    });
    setTimeout(() => reply.delete().catch(() => {}), 15000);
  },
};
