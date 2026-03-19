const fs = require('fs');
const path = require('path');

const timezoneDataPath = path.join(__dirname, '../data/timezones.json');

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
  const data = loadTimezones();
  data[userId] = timezone;
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
  return data[userId] || null;
}

module.exports = {
  loadTimezones,
  saveTimezones,
  setUserTimezone,
  resetUserTimezone,
  getUserSavedTimezone,
};