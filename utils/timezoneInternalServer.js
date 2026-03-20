const http = require('http');
const { URL } = require('url');
const { setUserTimezone } = require('./timezoneStore');
const { consumeTimezoneSession } = require('./timezoneSessionStore');

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function createTimezoneInternalServer() {
  const port = Number(process.env.INTERNAL_API_PORT || 10000);

  const server = http.createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === 'GET' && url.pathname === '/internal/healthz') {
      sendJson(response, 200, { ok: true, service: 'timezone-internal-api' });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/internal/timezone/complete') {
      let body = '';
      request.on('data', chunk => {
        body += chunk;
      });

      request.on('end', () => {
        try {
          const expectedToken = process.env.INTERNAL_API_TOKEN;
          const authHeader = request.headers.authorization || '';
          const providedToken = authHeader.startsWith('Bearer ')
            ? authHeader.slice('Bearer '.length)
            : '';

          if (!expectedToken || providedToken !== expectedToken) {
            sendJson(response, 401, { message: 'Unauthorized.' });
            return;
          }

          const { token, timezone } = JSON.parse(body || '{}');
          const session = consumeTimezoneSession(token);
          if (!session) {
            sendJson(response, 400, { message: 'This setup link expired. Run /detecttz again.' });
            return;
          }

          try {
            new Intl.DateTimeFormat('en-US', { timeZone: timezone });
          } catch (error) {
            sendJson(response, 400, { message: 'Invalid timezone.' });
            return;
          }

          setUserTimezone(session.userId, timezone);
          sendJson(response, 200, { message: 'Timezone saved.' });
        } catch (error) {
          console.error('Internal timezone API error:', error);
          sendJson(response, 500, { message: 'Internal API failed to save timezone.' });
        }
      });

      return;
    }

    sendJson(response, 404, { message: 'Not found.' });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`✓ Internal timezone API listening on port ${port}`);
  });

  return server;
}

module.exports = {
  createTimezoneInternalServer,
};
