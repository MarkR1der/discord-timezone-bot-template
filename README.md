# Discord Bot - Member Info Display

A Discord.js bot that displays member information with time and day details.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env` file values:
     - `DISCORD_TOKEN`: Your bot token from [Discord Developer Portal](https://discord.com/developers/applications)
     - `CLIENT_ID`: Your bot's application ID
     - `GUILD_ID`: Your server/guild ID (find it by enabling Developer Mode in Discord)

3. **Deploy slash commands:**
   ```bash
   node deploy-commands.js
   ```

4. **Start the bot:**
   ```bash
   npm start
   ```

## Features

- **Member Info Command** (`/memberinfo`): 
  - Shows member information with current time and day
  - Displays username, user ID, account creation date, server join date
  - Shows all member roles
  - Real-time time and date display

## Project Structure

```
commands/
  └── memberinfo.js      # Member info command with time/day display
events/
  ├── ready.js          # Bot startup event
  └── interactionCreate.js  # Slash command handler
utils/
  └── timeUtils.js      # Time and date utility functions
bot.js                  # Main bot file
deploy-commands.js      # Command registration script
package.json           # Dependencies
.env                   # Environment variables
```

## Usage

In your Discord server, type:
```
/memberinfo
/memberinfo @user
```

The bot will display a formatted embed with the member's information including the current time and day.

## Requirements

- Node.js 16.11.0 or higher
- Discord.js 14.x
- A Discord bot token

## Render Deployment

This repo is configured for split Render deployment via `render.yaml`:
- Worker service for the Discord bot connection (gateway)
- Web service for `/detecttz` browser setup page

1. Create a new Blueprint service in Render from this repository.
2. Set worker environment variables in Render (`discord-timezone-bot-worker`):
  - `DISCORD_TOKEN`
  - `CLIENT_ID`
  - `GUILD_ID`
  - `PUBLIC_BASE_URL` = your web service URL, e.g. `https://discord-timezone-web.onrender.com`
  - `INTERNAL_API_TOKEN` = any long random string
3. Set web environment variables in Render (`discord-timezone-web`):
  - `DISCORD_TOKEN` (same value as worker)
  - `BOT_INTERNAL_URL` = private URL of worker internal API, e.g. `http://discord-timezone-bot-worker:10000`
  - `INTERNAL_API_TOKEN` (same value as worker)
4. Deploy both services.

Notes:
- The worker is responsible for saving user timezone data.
- The web service forwards timezone completion to the worker internal API.

## UptimeRobot (Free-Tier Mitigation)

If your web service sleeps on free tier, UptimeRobot can reduce cold starts:

1. Create an HTTP(s) monitor in UptimeRobot.
2. Use your web service health URL: `https://your-web-service.onrender.com/healthz`
3. Set monitor interval to 5 minutes.

This helps but does not guarantee 100% uptime on free plans.
