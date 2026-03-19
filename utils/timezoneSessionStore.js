const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const sessionsFilePath = path.join(__dirname, '../data/sessions.json');

function loadSessions() {
  if (!fs.existsSync(sessionsFilePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(sessionsFilePath, 'utf8'));
  } catch {
    return {};
  }
}

function saveSessions(data) {
  try {
    fs.writeFileSync(sessionsFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
}

function createTimezoneSession(userId) {
  const token = crypto.randomUUID();
  const data = loadSessions();
  data[token] = { userId };
  saveSessions(data);
  return token;
}

function getTimezoneSession(token) {
  const data = loadSessions();
  return data[token] || null;
}

function consumeTimezoneSession(token) {
  const data = loadSessions();
  const session = data[token];
  if (!session) return null;
  delete data[token];
  saveSessions(data);
  return session;
}

function cleanupExpiredSessions() {
  // Sessions are permanent until used — nothing to clean up
}

module.exports = {
  createTimezoneSession,
  getTimezoneSession,
  consumeTimezoneSession,
  cleanupExpiredSessions,
};