const http = require('http');
const { URL } = require('url');
const { consumeTimezoneSession, getTimezoneSession, cleanupExpiredSessions } = require('./timezoneSessionStore');
const { setUserTimezone } = require('./timezoneStore');

function sendHtml(response, statusCode, html) {
  response.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function renderPage(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4efe6;
      --card: #fffaf2;
      --text: #1d1d1d;
      --muted: #5e5a53;
      --accent: #0c7c59;
      --accent-strong: #095c42;
      --border: #d9d0c2;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, 'Times New Roman', serif;
      background: radial-gradient(circle at top, #fff6dd 0%, var(--bg) 55%, #ece1d2 100%);
      color: var(--text);
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .card {
      width: min(560px, 100%);
      background: color-mix(in srgb, var(--card) 92%, white 8%);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 24px 60px rgba(56, 40, 18, 0.14);
    }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(1.7rem, 4vw, 2.4rem);
      line-height: 1.1;
    }
    p {
      margin: 0 0 14px;
      color: var(--muted);
      line-height: 1.5;
    }
    .pill {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      background: #efe5d2;
      border: 1px solid var(--border);
      color: #5a4521;
      font-size: 0.95rem;
      margin-bottom: 14px;
    }
    button {
      border: 0;
      border-radius: 12px;
      padding: 14px 18px;
      background: var(--accent);
      color: white;
      font: inherit;
      cursor: pointer;
      min-width: 180px;
      transition: transform 120ms ease, background 120ms ease;
    }
    button:hover { background: var(--accent-strong); transform: translateY(-1px); }
    button:disabled { opacity: 0.65; cursor: wait; transform: none; }
    .meta {
      margin-top: 16px;
      font-size: 0.95rem;
      color: var(--muted);
    }
    code {
      background: #f2eadb;
      padding: 2px 6px;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <main class="card">
    ${body}
  </main>
</body>
</html>`;
}

function getCommonTimezones() {
  // All IANA timezone identifiers organized by region
  const zones = [
    // Pacific
    'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu', 'Pacific/Samoa',
    // Asia
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore', 
    'Asia/Bangkok', 'Asia/Manila', 'Asia/Seoul', 'Asia/Jakarta',
    'Asia/Kolkata', 'Asia/Dubai', 'Asia/Bangkok', 'Asia/Baghdad',
    // Australia
    'Australia/Sydney', 'Australia/Perth', 'Australia/Melbourne', 'Australia/Brisbane',
    // Europe
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Moscow',
    'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna', 'Europe/Prague',
    // Africa
    'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
    // Americas
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Anchorage', 'America/Mexico_City', 'America/Toronto',
    'America/Buenos_Aires', 'America/Sao_Paulo',
    // UTC
    'UTC'
  ];
  return [...new Set(zones)].sort();
}

function renderSetupPage(token) {
  const allTimezones = getCommonTimezones();
  const tzOptions = allTimezones.map(tz => `<option value="${tz}">${tz}</option>`).join('');

  return renderPage('Set Device Timezone', `
    <div class="pill">Browser Timezone Setup</div>
    <h1>Share Your Device Timezone</h1>
    <p>Step 1: The button below will detect your timezone from your browser.</p>
    <button id="detectButton">Detect My Timezone</button>
    <div id="detected" style="display:none; margin-top: 20px;">
      <p style="margin: 0 0 8px; font-size: 0.95rem; color: var(--muted);">Detected timezone:</p>
      <p style="margin: 0 0 16px; font-size: 1.1rem; font-weight: bold;"><code id="detectedTz"></code></p>
      <p style="margin: 0 0 8px; font-size: 0.95rem; color: var(--muted);">Step 2: Confirm or select a different timezone:</p>
      <select id="tzSelect" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-family: Georgia, serif; margin-bottom: 14px;">
        <option value="">-- Choose a timezone --</option>
        ${tzOptions}
      </select>
      <button id="submitButton" style="width: 100%;">Confirm Timezone</button>
    </div>
    <p class="meta" id="status">Click the button above to begin.</p>
    <script>
      const detectBtn = document.getElementById('detectButton');
      const submitBtn = document.getElementById('submitButton');
      const detectedDiv = document.getElementById('detected');
      const detectedTzSpan = document.getElementById('detectedTz');
      const tzSelect = document.getElementById('tzSelect');
      const status = document.getElementById('status');
      let selectedTimezone = null;

      detectBtn.addEventListener('click', () => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!timezone) {
          status.textContent = '❌ Your browser did not expose a timezone. Set it manually in Discord.';
          return;
        }

        selectedTimezone = timezone;
        detectedTzSpan.textContent = timezone;
        tzSelect.value = timezone;
        detectedDiv.style.display = 'block';
        detectBtn.style.display = 'none';
        status.textContent = '✓ Timezone detected! Confirm or select a different one below.';
      });

      submitBtn.addEventListener('click', async () => {
        const chosen = tzSelect.value;
        if (!chosen) {
          status.textContent = '⚠️ Please select a timezone.';
          return;
        }

        submitBtn.disabled = true;
        status.textContent = 'Saving...';

        const response = await fetch('/timezone/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: '${token}', timezone: chosen })
        });

        const payload = await response.json();
        if (!response.ok) {
          status.textContent = '❌ ' + (payload.message || 'Something went wrong.');
          submitBtn.disabled = false;
          return;
        }

        document.body.innerHTML = payload.html;
      });
    </script>
  `);
}

function renderSuccessFragment(timezone) {
  return `
    <main class="card">
      <div class="pill">Saved</div>
      <h1>Timezone Updated</h1>
      <p>Your device timezone was saved as <code>${timezone}</code>.</p>
      <p>You can return to Discord and use <code>/memberinfo</code> right away.</p>
    </main>
  `;
}

function createTimezoneWebServer(client) {
  const port = Number(process.env.PORT || process.env.TIMEZONE_WEB_PORT || 3000);
  const startupGraceMs = 2 * 60 * 1000;
  const server = http.createServer(async (request, response) => {
    cleanupExpiredSessions();

    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === 'GET' && url.pathname === '/timezone/setup') {
      const token = url.searchParams.get('token');
      if (!token || !getTimezoneSession(token)) {
        sendHtml(response, 400, renderPage('Invalid Link', `
          <div class="pill">Invalid Session</div>
          <h1>That setup link is no longer valid</h1>
          <p>Go back to Discord and run <code>/detecttz</code> again to get a fresh link.</p>
        `));
        return;
      }

      sendHtml(response, 200, renderSetupPage(token));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/timezone/complete') {
      let body = '';
      request.on('data', chunk => {
        body += chunk;
      });

      request.on('end', () => {
        try {
          const { token, timezone } = JSON.parse(body || '{}');
          const session = consumeTimezoneSession(token);
          if (!session) {
            sendJson(response, 400, { message: 'This setup link expired. Run /detecttz again.' });
            return;
          }

          try {
            new Intl.DateTimeFormat('en-US', { timeZone: timezone });
          } catch (error) {
            sendJson(response, 400, { message: 'The browser sent an invalid timezone.' });
            return;
          }

          setUserTimezone(session.userId, timezone);
          sendJson(response, 200, {
            message: 'Timezone saved.',
            html: renderSuccessFragment(timezone),
          });
        } catch (error) {
          console.error('Error completing timezone setup:', error);
          sendJson(response, 500, { message: 'Failed to save timezone.' });
        }
      });
      return;
    }

    if ((request.method === 'GET' || request.method === 'HEAD') && (url.pathname === '/health' || url.pathname === '/')) {
      const inStartupGrace = process.uptime() * 1000 < startupGraceMs;
      const botReady = !client || client.isReady();
      // Health checks should reflect process liveness so hosting platforms don't restart in a loop.
      const statusCode = 200;
      response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      if (request.method === 'HEAD') {
        response.end();
      } else {
        response.end(JSON.stringify({
          ok: true,
          botReady,
          inStartupGrace,
          uptimeSeconds: Math.floor(process.uptime()),
        }));
      }
      return;
    }

    sendHtml(response, 404, renderPage('Not Found', `
      <div class="pill">404</div>
      <h1>Page not found</h1>
      <p>Use the setup link from Discord instead of opening this server directly.</p>
    `));
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`✓ Timezone web server listening on port ${port}`);
  });

  return server;
}

module.exports = {
  createTimezoneWebServer,
};