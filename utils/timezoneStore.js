const fs = require('fs');
const path = require('path');

const timezoneDataPath = path.join(__dirname, '../data/timezones.json');

function canonicalizeTimezone(timezone) {
  if (typeof timezone !== 'string') {
    return null;
  }

  const value = timezone.trim();
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

function loadTimezones() {
  if (!fs.existsSync(timezoneDataPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(timezoneDataPath, 'utf8'));
  } catch (error) {
    console.error('Error reading timezone data:', error);
    return {};
  }
}

function saveTimezones(data) {
  fs.writeFileSync(timezoneDataPath, JSON.stringify(data, null, 2));
}

function setUserTimezone(userId, timezone) {
  const canonicalTimezone = canonicalizeTimezone(timezone);
  if (!canonicalTimezone) {
    throw new Error('Invalid timezone');
  }

  const data = loadTimezones();
  data[userId] = canonicalTimezone;
  saveTimezones(data);
}

function resetUserTimezone(userId) {
  const data = loadTimezones();
  if (!data[userId]) {
    return false;
  }

  delete data[userId];
  saveTimezones(data);
  return true;
}

function getUserSavedTimezone(userId) {
  const data = loadTimezones();
  const savedTimezone = data[userId];
  if (!savedTimezone) {
    return null;
  }

  const canonicalTimezone = canonicalizeTimezone(savedTimezone);
  if (!canonicalTimezone) {
    return null;
  }

  if (canonicalTimezone !== savedTimezone) {
    data[userId] = canonicalTimezone;
    saveTimezones(data);
  }

  return canonicalTimezone;
}

module.exports = {
  loadTimezones,
  saveTimezones,
  setUserTimezone,
  resetUserTimezone,
  getUserSavedTimezone,
};