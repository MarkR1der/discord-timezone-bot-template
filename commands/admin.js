const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getServerSettings, setHourFormat, setCommandAlias, removeCommandAlias } = require('../utils/serverSettingsStore');

const VALID_COMMANDS = ['detecttz', 'help', 'memberinfo', 'resettimezone', 'settimezone'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setting')
    .setDescription('Server settings (owner only)')
    .addSubcommand(sub =>
      sub.setName('hour-format')
        .setDescription('Set the hour format for the entire server')
        .addStringOption(opt =>
          opt.setName('format')
            .setDescription('Choose 12-hour or 24-hour format')
            .setRequired(true)
            .addChoices(
              { name: '12-hour (e.g., 2:45 PM)', value: '12h' },
              { name: '24-hour (e.g., 14:45)', value: '24h' }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('rename-command')
        .setDescription('Rename a command (admin only)')
        .addStringOption(opt =>
          opt.setName('command')
            .setDescription('Original command name')
            .setRequired(true)
            .addChoices(...VALID_COMMANDS.map(cmd => ({ name: cmd, value: cmd })))
        )
        .addStringOption(opt =>
          opt.setName('new-name')
            .setDescription('New command name (lowercase, no spaces)')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('reset-command')
        .setDescription('Reset a renamed command to its original name')
        .addStringOption(opt =>
          opt.setName('command')
            .setDescription('Command to reset')
            .setRequired(true)
            .addChoices(...VALID_COMMANDS.map(cmd => ({ name: cmd, value: cmd })))
        )
    )
    .addSubcommand(sub =>
      sub.setName('view-settings')
        .setDescription('View current server settings')
    ),

  async execute(interaction) {
    // Check if user is server owner
    if (interaction.user.id !== interaction.guild.ownerId) {
      await interaction.editReply({
        content: '❌ Only the server owner can use admin commands.',
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const serverId = interaction.guildId;

    if (subcommand === 'hour-format') {
      const format = interaction.options.getString('format');
      try {
        setHourFormat(serverId, format);
        const label = format === '12h' ? '12-hour (e.g., 2:45 PM)' : '24-hour (e.g., 14:45)';
        await interaction.editReply({
          content: `✓ Hour format changed to **${label}** for this server.`,
        });
      } catch (error) {
        await interaction.editReply({
          content: `❌ Error: ${error.message}`,
        });
      }
      return;
    }

    if (subcommand === 'rename-command') {
      const command = interaction.options.getString('command');
      const newName = interaction.options.getString('new-name').toLowerCase();

      // Validation
      if (!/^[a-z0-9\-_]{1,32}$/.test(newName)) {
        await interaction.editReply({
          content: '❌ Command name must be lowercase, 1-32 characters, and contain only letters, numbers, hyphens, or underscores.',
        });
        return;
      }

      try {
        setCommandAlias(serverId, command, newName);
        await interaction.editReply({
          content: `✓ Command \`/${command}\` is now aliased as \`/${newName}\`. Both names will work.`,
        });
      } catch (error) {
        await interaction.editReply({
          content: `❌ Error: ${error.message}`,
        });
      }
      return;
    }

    if (subcommand === 'reset-command') {
      const command = interaction.options.getString('command');
      removeCommandAlias(interaction.guildId, command);
      await interaction.editReply({
        content: `✓ Command \`/${command}\` reset to its original name.`,
      });
      return;
    }

    if (subcommand === 'view-settings') {
      const settings = getServerSettings(serverId);
      const formatLabel = settings.hourFormat === '12h' ? '12-hour (e.g., 2:45 PM)' : '24-hour (e.g., 14:45)';
      const aliasText = Object.keys(settings.commandAliases).length > 0
        ? Object.entries(settings.commandAliases)
          .map(([orig, alias]) => `\`/${orig}\` → \`/${alias}\``)
          .join('\n')
        : 'None';

      const embed = new EmbedBuilder()
        .setTitle('Server Settings')
        .setColor(0x0c7c59)
        .addFields(
          { name: 'Hour Format', value: formatLabel, inline: false },
          { name: 'Command Aliases', value: aliasText, inline: false }
        )
        .setFooter({ text: 'Only the server owner can change these settings.' });

      await interaction.editReply({
        embeds: [embed],
      });
      return;
    }
  },
};
