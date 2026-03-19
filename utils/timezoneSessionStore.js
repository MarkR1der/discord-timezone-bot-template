const crypto = require('crypto');

// Use DISCORD_TOKEN as HMAC secret — it's always available and never changes
function getSecret() {
  return process.env.DISCORD_TOKEN || 'fallback-secret';
}

function createTimezoneSession(userId) {
  const nonce = crypto.randomUUID();
  const payload = Buffer.from(JSON.stringify({ userId, nonce })).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function getTimezoneSession(token) {
  try {
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex === -1) return null;
    const payload = token.slice(0, dotIndex);
    const sig = token.slice(dotIndex + 1);
    const expectedSig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
    if (sig !== expectedSig) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function consumeTimezoneSession(token) {
  return getTimezoneSession(token);
}

function cleanupExpiredSessions() {}

module.exports = {
  createTimezoneSession,
  getTimezoneSession,
  consumeTimezoneSession,
  cleanupExpiredSessions,
};