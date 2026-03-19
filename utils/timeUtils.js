const { getUserSavedTimezone } = require('./timezoneStore');

// Map Discord locales to timezones
const localeToTimezone = {
  'en-US': 'America/New_York',
  'en-GB': 'Europe/London',
  'en-AU': 'Australia/Sydney',
  'en-CA': 'America/Toronto',
  'en-NZ': 'Pacific/Auckland',
  'en-IE': 'Europe/Dublin',
  'de': 'Europe/Berlin',
  'de-DE': 'Europe/Berlin',
  'de-AT': 'Europe/Vienna',
  'de-CH': 'Europe/Zurich',
  'fr': 'Europe/Paris',
  'fr-FR': 'Europe/Paris',
  'fr-CA': 'America/Toronto',
  'es': 'Europe/Madrid',
  'es-ES': 'Europe/Madrid',
  'es-MX': 'America/Mexico_City',
  'es-AR': 'America/Argentina/Buenos_Aires',
  'it': 'Europe/Rome',
  'it-IT': 'Europe/Rome',
  'pt-BR': 'America/Sao_Paulo',
  'pt-PT': 'Europe/Lisbon',
  'ja': 'Asia/Tokyo',
  'ja-JP': 'Asia/Tokyo',
  'zh-CN': 'Asia/Shanghai',
  'zh-TW': 'Asia/Taipei',
  'ko': 'Asia/Seoul',
  'ko-KR': 'Asia/Seoul',
  'ru': 'Europe/Moscow',
  'ru-RU': 'Europe/Moscow',
  'pl': 'Europe/Warsaw',
  'pl-PL': 'Europe/Warsaw',
  'nl': 'Europe/Amsterdam',
  'nl-NL': 'Europe/Amsterdam',
  'sv': 'Europe/Stockholm',
  'sv-SE': 'Europe/Stockholm',
  'no': 'Europe/Oslo',
  'nb-NO': 'Europe/Oslo',
  'da': 'Europe/Copenhagen',
  'da-DK': 'Europe/Copenhagen',
  'fi': 'Europe/Helsinki',
  'fi-FI': 'Europe/Helsinki',
  'th': 'Asia/Bangkok',
  'th-TH': 'Asia/Bangkok',
  'vi': 'Asia/Ho_Chi_Minh',
  'vi-VN': 'Asia/Ho_Chi_Minh',
  'id': 'Asia/Jakarta',
  'id-ID': 'Asia/Jakarta',
  'hi': 'Asia/Kolkata',
  'hi-IN': 'Asia/Kolkata',
  'ar': 'Asia/Dubai',
  'ar-SA': 'Asia/Riyadh',
  'tr': 'Europe/Istanbul',
  'tr-TR': 'Europe/Istanbul',
  'el': 'Europe/Athens',
  'el-GR': 'Europe/Athens',
  'cs': 'Europe/Prague',
  'cs-CZ': 'Europe/Prague',
  'hu': 'Europe/Budapest',
  'hu-HU': 'Europe/Budapest',
  'ro': 'Europe/Bucharest',
  'ro-RO': 'Europe/Bucharest',
};

function guessTimezoneFromLocale(locale) {
  return localeToTimezone[locale] || null;
}

function getMemberTimeInfo() {
  const now = new Date();
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  const day = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  
  let hours24 = now.getHours();
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours = String((hours24 % 12) || 12).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return {
    time: `${hours}:${minutes}:${seconds} ${ampm}`,
    day: `${day}, ${month} ${date}, ${year}`,
    fullDateTime: `${day}, ${month} ${date}, ${year} at ${hours}:${minutes}:${seconds} ${ampm}`
  };
}

/**
 * Gets a user's timezone - first from manual setting, then from Discord locale
 * @param {Object} user - The Discord user object
 * @returns {string} The timezone
 */
function getUserTimezone(user) {
  if (user) {
    const savedTimezone = getUserSavedTimezone(user.id);
    if (savedTimezone) {
      return savedTimezone;
    }
  }

  if (user && user.locale) {
    return guessTimezoneFromLocale(user.locale);
  }

  return null;
}

/**
 * Gets a user's time in their detected timezone
 * @param {Object} user - The Discord user object
 * @returns {Object} Object with time and day in user's timezone
 */
function getUserTimeInfo(user) {
  const timezone = getUserTimezone(user);
  if (!timezone) {
    return {
      time: 'Not set',
      day: 'This member needs to use /detecttz or /settimezone.',
      fullDateTime: 'Timezone not set.',
      timezone: 'Not set',
      configured: false,
    };
  }

  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const parts = formatter.formatToParts(now);
  const partObj = {};
  
  for (const part of parts) {
    if (part.type !== 'literal') {
      partObj[part.type] = part.value;
    }
  }

  const day = partObj.weekday;
  const month = partObj.month;
  const date = partObj.day;
  const year = partObj.year;
  const time = `${partObj.hour}:${partObj.minute}:${partObj.second} ${partObj.dayPeriod}`;

  return {
    time: time,
    day: `${day}, ${month} ${date}, ${year}`,
    fullDateTime: `${day}, ${month} ${date}, ${year} at ${time}`,
    timezone: timezone,
    configured: true,
  };
}

/**
 * Formats a timestamp into readable time and day
 * @param {number} timestamp - Unix timestamp
 * @returns {Object} Object with time and day
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  const day = days[date.getDay()];
  const dateNum = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  let hours24 = date.getHours();
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours = String((hours24 % 12) || 12).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return {
    time: `${hours}:${minutes}:${seconds} ${ampm}`,
    day: `${day}, ${month} ${dateNum}, ${year}`,
    fullDateTime: `${day}, ${month} ${dateNum}, ${year} at ${hours}:${minutes}:${seconds} ${ampm}`
  };
}

module.exports = {
  getMemberTimeInfo,
  getUserTimeInfo,
  getUserTimezone,
  guessTimezoneFromLocale,
  formatTimestamp,
};
