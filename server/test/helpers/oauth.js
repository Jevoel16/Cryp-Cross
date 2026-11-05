// A stand-in for GitHub and Google plus the browser side of the sign-in flow.
const http = require('node:http');
const assert = require('node:assert/strict');
const oauth = require('../../lib/oauth');

const APP_URL = 'http://localhost:3000';
const ENV = {
  APP_URL,
  GITHUB_CLIENT_ID: 'gh-id',
  GITHUB_CLIENT_SECRET: 'gh-secret',
  GOOGLE_CLIENT_ID: 'g-id',
  GOOGLE_CLIENT_SECRET: 'g-secret',
};

// The access token is the code, and each code maps to a profile the test sets up.
// It also records the PKCE verifiers and the scopes it was asked for.
function startFakeProvider() {
  const profiles = new Map();
  const verifiers = new Map();
  const requestedPaths = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://fake');
    requestedPaths.push(url.pathname);
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (req.method === 'POST' && url.pathname === '/token') {
      let raw = '';
      req.on('data', (chunk) => (raw += chunk));
      req.on('end', () => {
        const form = new URLSearchParams(raw);
        if (!profiles.has(form.get('code'))) return send(400, { error: 'bad_verification_code' });
        verifiers.set(form.get('code'), form.get('code_verifier'));
        send(200, { access_token: form.get('code'), token_type: 'bearer' });
      });
      return;
    }
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const p = profiles.get(token);
    if (!p) return send(401, { message: 'Bad credentials' });
    if (url.pathname === '/user') return send(200, { id: p.id, login: p.login });
    if (url.pathname === '/userinfo') return send(200, { sub: p.id, name: p.login });
    send(404, {});
  });
  return new Promise((resolve) => {
    server.listen(0, () => {
      const base = `http://127.0.0.1:${server.address().port}`;
      resolve({ base, profiles, verifiers, requestedPaths, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

// Enables both providers against the fake one. Returns a function that undoes it.
async function setUpProviders() {
  Object.assign(process.env, ENV);
  const fake = await startFakeProvider();
  oauth.setEndpointOverrides({
    github: { authorizeUrl: `${fake.base}/authorize`, tokenUrl: `${fake.base}/token`, apiBase: fake.base },
    google: { authorizeUrl: `${fake.base}/authorize`, tokenUrl: `${fake.base}/token`, userinfoUrl: `${fake.base}/userinfo` },
  });
  const tearDown = async () => {
    await fake.close();
    oauth.setEndpointOverrides(null);
    for (const name of Object.keys(ENV)) delete process.env[name];
  };
  return { fake, tearDown };
}

// Runs the browser side of the flow: start, (provider approves), callback.
async function signIn(tab, provider, code, { from, link } = {}) {
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (link) query.set('link', '1');
  const start = await tab.get(`/api/auth/oauth/${provider}?${query}`);
  assert.equal(start.status, 302);
  const authorize = new URL(start.headers.get('location'));
  const state = authorize.searchParams.get('state');
  const callback = await tab.get(`/api/auth/oauth/${provider}/callback?code=${encodeURIComponent(code)}&state=${state}`);
  return { start, authorize, callback, location: callback.headers.get('location') };
}

module.exports = { APP_URL, setUpProviders, signIn };
