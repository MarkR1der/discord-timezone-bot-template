const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    client.user.setActivity('members', { type: 'WATCHING' });
  },
};
