const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    if (client.runtimeDiagnostics) {
      client.runtimeDiagnostics.readyAt = Date.now();
    }
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    client.user.setActivity('members', { type: 'WATCHING' });
  },
};
