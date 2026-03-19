const { Events } = require('discord.js');
const { getServerSettings } = require('../utils/serverSettingsStore');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      // Check if user might be trying to use a command alias
      const settings = getServerSettings(interaction.guildId);
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
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ There was an error executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ There was an error executing this command!', ephemeral: true });
      }
    }
  },
};
