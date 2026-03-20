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
