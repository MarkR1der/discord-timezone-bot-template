const fs = require('fs');
const path = require('path');

const settingsFilePath = path.join(__dirname, '../data/serverSettings.json');

function loadSettings() {
  if (!fs.existsSync(settingsFilePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
  } catch {
    return {};
  }
}

function saveSettings(data) {
  try {
    fs.writeFileSync(settingsFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving server settings:', error);
  }
}

function getServerSettings(serverId) {
  const data = loadSettings();
  return data[serverId] || {
    hourFormat: '12h', // default: 12-hour
    commandAliases: {}, // { originalName: newName }
  };
}

function setHourFormat(serverId, format) {
  if (!['12h', '24h'].includes(format)) {
    throw new Error('Hour format must be 12h or 24h');
  }
  const data = loadSettings();
  if (!data[serverId]) {
    data[serverId] = { hourFormat: format, commandAliases: {} };
  } else {
    data[serverId].hourFormat = format;
  }
  saveSettings(data);
}

function setCommandAlias(serverId, commandName, newName) {
  const data = loadSettings();
  if (!data[serverId]) {
    data[serverId] = { hourFormat: '12h', commandAliases: {} };
  }
  
  // Check if new name is already used
  const aliases = data[serverId].commandAliases;
  for (const [orig, alias] of Object.entries(aliases)) {
    if (alias.toLowerCase() === newName.toLowerCase() && orig !== commandName) {
      throw new Error(`"${newName}" is already an alias for /${orig}`);
    }
  }
  
  data[serverId].commandAliases[commandName] = newName;
  saveSettings(data);
}

function removeCommandAlias(serverId, commandName) {
  const data = loadSettings();
  if (data[serverId]?.commandAliases) {
    delete data[serverId].commandAliases[commandName];
    saveSettings(data);
  }
}

module.exports = {
  getServerSettings,
  setHourFormat,
  setCommandAlias,
  removeCommandAlias,
};
