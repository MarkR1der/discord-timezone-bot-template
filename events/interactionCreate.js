const { Events, MessageFlags } = require('discord.js');
const { getServerSettings } = require('../utils/serverSettingsStore');

const EPHEMERAL_COMMANDS = new Set([
  'admin',
  'detecttz',
  'help',
  'resettimezone',
  'settimezone',
]);

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const settings = getServerSettings(interaction.guildId);
    let resolvedCommandName = interaction.commandName;

    if (!interaction.client.commands.has(resolvedCommandName)) {
      const aliasMatch = Object.entries(settings.commandAliases || {})
        .find(([, alias]) => alias.toLowerCase() === interaction.commandName.toLowerCase());

      if (aliasMatch) {
        resolvedCommandName = aliasMatch[0];
      }
    }

    const command = interaction.client.commands.get(resolvedCommandName);

    if (!command) {
      let helpText = `No command matching \`${interaction.commandName}\` was found.`;
      
      const aliasMatches = Object.entries(settings.commandAliases || {})
        .filter(([, alias]) => alias.toLowerCase() === interaction.commandName.toLowerCase());
      
      if (aliasMatches.length > 0) {
        const originalName = aliasMatches[0][0];
        helpText = `The command \`/${interaction.commandName}\` is not registered. Did you mean \`/${originalName}\`?`;
      }
      
      console.error(helpText);
      await interaction.reply({ content: `❌ ${helpText}`, ephemeral: true }).catch(() => {});
      return;
    }

    try {
      // Acknowledge quickly to avoid Discord's 3-second timeout during cold starts.
      const shouldBeEphemeral = EPHEMERAL_COMMANDS.has(resolvedCommandName);
      await interaction.deferReply(shouldBeEphemeral ? { flags: MessageFlags.Ephemeral } : {});
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({ content: '❌ There was an error executing this command!' });
      } else if (interaction.replied) {
        await interaction.followUp({ content: '❌ There was an error executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ There was an error executing this command!', ephemeral: true });
      }
    }
  },
};
