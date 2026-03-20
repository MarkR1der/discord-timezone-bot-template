const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const isBotEnabled = process.env.BOT_ENABLED !== 'false';

let createTimezoneWebServer = null;
if (process.env.TIMEZONE_WEB_ENABLED === 'false') {
  console.log('ℹ️ Browser timezone web setup disabled by TIMEZONE_WEB_ENABLED=false');
} else {
  try {
    ({ createTimezoneWebServer } = require('./utils/timezoneWebServer'));
    process.env.TIMEZONE_WEB_ENABLED = 'true';
  } catch (error) {
    process.env.TIMEZONE_WEB_ENABLED = 'false';
    console.warn('⚠️ timezoneWebServer module not found. Browser timezone setup is disabled.');
  }
}

let createTimezoneInternalServer = null;
if (process.env.BOT_INTERNAL_API_ENABLED === 'true') {
  try {
    ({ createTimezoneInternalServer } = require('./utils/timezoneInternalServer'));
  } catch (error) {
    console.warn('⚠️ timezoneInternalServer module not found. Internal API is disabled.');
  }
}

if (createTimezoneWebServer) {
  createTimezoneWebServer();
}

if (createTimezoneInternalServer) {
  createTimezoneInternalServer();
}

if (!isBotEnabled) {
  console.log('ℹ️ BOT_ENABLED=false, Discord gateway login skipped.');
  return;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.cooldowns = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`✓ Loaded command: ${command.data.name}`);
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`✓ Loaded event: ${event.name}`);
}

client.login(process.env.DISCORD_TOKEN);
