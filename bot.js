const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let createTimezoneWebServer = null;
try {
  ({ createTimezoneWebServer } = require('./utils/timezoneWebServer'));
  process.env.TIMEZONE_WEB_ENABLED = 'true';
} catch (error) {
  process.env.TIMEZONE_WEB_ENABLED = 'false';
  console.warn('⚠️ timezoneWebServer module not found. Browser timezone setup is disabled.');
}

function getPublicBaseUrl() {
  return process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_BASE_URL || null;
}

function logStartupConfiguration() {
  const publicBaseUrl = getPublicBaseUrl();
  const configuredPort = Number(process.env.PORT || process.env.TIMEZONE_WEB_PORT || 3000);
  const configuredPublicBaseUrl = process.env.PUBLIC_BASE_URL || null;
  const renderExternalUrl = process.env.RENDER_EXTERNAL_URL || null;

  console.log('✓ Startup configuration:', {
    nodeVersion: process.version,
    timezoneWebEnabled: process.env.TIMEZONE_WEB_ENABLED === 'true',
    port: configuredPort,
    hasDiscordToken: Boolean(process.env.DISCORD_TOKEN),
    hasClientId: Boolean(process.env.CLIENT_ID),
    hasGuildId: Boolean(process.env.GUILD_ID),
    hasPublicBaseUrl: Boolean(process.env.PUBLIC_BASE_URL),
    hasRenderExternalUrl: Boolean(process.env.RENDER_EXTERNAL_URL),
    publicBaseUrl: publicBaseUrl || 'not-configured',
  });

  if (configuredPublicBaseUrl && renderExternalUrl && configuredPublicBaseUrl !== renderExternalUrl) {
    console.warn('⚠️ URL mismatch detected: PUBLIC_BASE_URL differs from RENDER_EXTERNAL_URL.');
    console.warn(`   PUBLIC_BASE_URL=${configuredPublicBaseUrl}`);
    console.warn(`   RENDER_EXTERNAL_URL=${renderExternalUrl}`);
    console.warn('   Using RENDER_EXTERNAL_URL for setup links and keep-alive pings.');
  }
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

if (createTimezoneWebServer) {
  createTimezoneWebServer(client);

  // Keep Render free tier alive by pinging our own public health endpoint every 14 minutes.
  // Without this, Render spins down the process after 15 min of no external HTTP traffic,
  // which kills the Discord gateway and causes "application did not respond" errors.
  const publicUrl = getPublicBaseUrl();
  if (publicUrl) {
    const pinger = publicUrl.startsWith('https') ? require('https') : require('http');
    const healthUrl = `${publicUrl.replace(/\/$/, '')}/health`;
    setInterval(() => {
      pinger.get(healthUrl, (res) => {
        console.log(`[keep-alive] ping ${res.statusCode}`);
      }).on('error', (err) => {
        console.warn('[keep-alive] ping failed:', err.message);
      });
    }, 14 * 60 * 1000);
    console.log(`✓ Keep-alive enabled → ${healthUrl}`);
  }
}

client.on(Events.ShardDisconnect, (closeEvent, shardId) => {
  console.warn(`⚠️ Shard ${shardId} disconnected with code ${closeEvent.code}.`);
});

client.on(Events.ShardResume, (shardId, replayedEvents) => {
  console.log(`✓ Shard ${shardId} resumed with ${replayedEvents} replayed events.`);
});

client.on(Events.ShardError, (error, shardId) => {
  console.error(`❌ Shard ${shardId} error:`, error);
});

client.on(Events.Invalidated, () => {
  console.error('❌ Discord session invalidated. Exiting so the platform can restart the bot.');
  process.exit(1);
});

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ Missing DISCORD_TOKEN environment variable.');
  process.exit(1);
}

logStartupConfiguration();

client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log('✓ Discord login request accepted, waiting for ready event...');
  })
  .catch((error) => {
    console.error('❌ Discord login failed:', error);
    process.exit(1);
  });
