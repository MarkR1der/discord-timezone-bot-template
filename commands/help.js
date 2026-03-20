const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all available commands and how to use them'),
  
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('⚙️ TimeZone Bot - Help Menu')
      .setDescription('Here are all the available commands:')
      .addFields(
        {
          name: '📋 `/memberinfo`',
          value: 'View member information with time and day details\n'
            + '• Shows member\'s username, ID, join date\n'
            + '• Displays current time in their timezone\n'
            + '• Shows timezone and current day\n'
            + '• Admins/Mods see account creation date\n'
            + '**Usage:** `/memberinfo` or `/memberinfo @user`',
          inline: false
        },
        {
          name: '🌍 `/detecttz`',
          value: 'Open a browser link and read the timezone from that device\n'
            + '• Uses the browser timezone from the device that opens the link\n'
            + '• Saves only the timezone name\n'
            + '• Requires `PUBLIC_BASE_URL` to be configured for remote use\n'
            + '• If unavailable, use `/settimezone` as manual fallback\n'
            + '**Usage:** `/detecttz`',
          inline: false
        },
        {
          name: '🕐 `/settimezone`',
          value: 'Manually set your timezone\n'
            + '• Set a custom timezone if auto-detect doesn\'t work\n'
            + '• Examples: `America/New_York`, `Europe/London`, `Asia/Tokyo`\n'
            + '• Overrides auto-detection\n'
            + '**Usage:** `/settimezone America/New_York`',
          inline: false
        },
        {
          name: '🗑️ `/resettimezone`',
          value: 'Remove your saved timezone\n'
            + '• Clears your current saved timezone\n'
            + '• Lets you run `/detecttz` or `/settimezone` again\n'
            + '**Usage:** `/resettimezone`',
          inline: false
        },
        {
          name: '❓ `/help`',
          value: 'Shows this help menu with all commands',
          inline: false
        }
      )
      .addFields(
        {
          name: '💡 Quick Start',
          value: '1️⃣ Use `/detecttz` and open the browser link on your device\n'
            + '2️⃣ Use `/memberinfo @friend` to see their time\n'
            + '3️⃣ Or manually set with `/settimezone [timezone]`\n'
            + '4️⃣ Use `/resettimezone` if you want to clear it',
          inline: false
        },
        {
          name: '🔒 Privacy & Security',
          value: '✅ The browser sends only the timezone name\n'
            + '✅ The bot does NOT need your IP address\n'
            + '✅ Admins and Moderators cannot see hidden device data\n'
            + '✅ Only your saved timezone is stored',
          inline: false
        }
      )
      .setFooter({ text: 'TimeZone Bot v1.0' })
      .setTimestamp();

    const reply = await interaction.editReply({ 
      embeds: [embed], 
      fetchReply: true
    });
    setTimeout(() => reply.delete().catch(() => {}), 15000);
  },
};
