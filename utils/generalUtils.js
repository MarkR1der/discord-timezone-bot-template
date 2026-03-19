/**
 * General utility functions
 */

/**
 * Checks if a user has specific role
 * @param {GuildMember} member - The guild member
 * @param {string} roleName - The role name to check
 * @returns {boolean} True if member has role
 */
function hasRole(member, roleName) {
  return member.roles.cache.some(role => role.name.toLowerCase() === roleName.toLowerCase());
}

/**
 * Gets member's highest role
 * @param {GuildMember} member - The guild member
 * @returns {Role} The highest role
 */
function getHighestRole(member) {
  return member.roles.highest;
}

/**
 * Formats milliseconds to readable time
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted string
 */
function formatMs(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.length > 0 ? parts.join(' ') : '0s';
}

module.exports = {
  hasRole,
  getHighestRole,
  formatMs,
};
