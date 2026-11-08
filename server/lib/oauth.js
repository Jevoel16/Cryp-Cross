// GitHub/Google OAuth 2 code flow with PKCE; a provider is on only when its ID and secret are set.
const crypto = require('crypto');

const PROVIDERS = {
  github: {
    label: 'GitHub',
    env: 'GITHUB',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    apiBase: 'https://api.github.com',
    // No scope: the public profile (ID and login) is all the app needs, and no email is requested.
    scope: '',
  },
  google: {
    label: 'Google',
    env: 'GOOGLE',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userinfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid profile',
  },
};

const REQUEST_TIMEOUT_MS = 10_000;

// Tests point the providers at a local fake server; nothing else calls this.
let overrides = {};
function setEndpointOverrides(next) {
  overrides = next || {};
}

const isKnownProvider = (id) => Object.prototype.hasOwnProperty.call(PROVIDERS, id);

function config(id) {
  const base = PROVIDERS[id];
  return {
    ...base,
    ...(overrides[id] || {}),
    clientId: process.env[`${base.env}_CLIENT_ID`],
    clientSecret: process.env[`${base.env}_CLIENT_SECRET`],
  };
}

function isEnabled(id) {
  if (!isKnownProvider(id)) return false;
  const { clientId, clientSecret } = config(id);
  return Boolean(clientId && clientSecret);
}

const enabledProviders = () => Object.keys(PROVIDERS).filter(isEnabled);

// Provider IDs with only one of the two settings, so the server can warn at startup.
const halfConfiguredProviders = () =>
  Object.keys(PROVIDERS).filter((id) => {
    const { clientId, clientSecret } = config(id);
    return Boolean(clientId) !== Boolean(clientSecret);
  });

// The API's public origin. With the Vite proxy (dev) or a same-origin deploy this is APP_URL.
function callbackUrl(id) {
  const base = (process.env.API_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/api/auth/oauth/${id}/callback`;
}

const base64url = (buf) => buf.toString('base64url');

// `state` ties the callback to this session; the PKCE verifier ties the code exchange to it.
function createAttempt() {
  const verifier = base64url(crypto.randomBytes(32));
  return {
    state: base64url(crypto.randomBytes(24)),
    verifier,
    challenge: base64url(crypto.createHash('sha256').update(verifier).digest()),
  };
}

function authorizeUrl(id, { state, challenge }) {
  const p = config(id);
  const url = new URL(p.authorizeUrl);
  url.search = new URLSearchParams({
    client_id: p.clientId,
    redirect_uri: callbackUrl(id),
    response_type: 'code',
    ...(p.scope ? { scope: p.scope } : {}),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    ...(id === 'google' ? { prompt: 'select_account' } : { allow_signup: 'true' }),
  }).toString();
  return url.toString();
}

async function getJson(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${new URL(url).pathname} answered ${res.status}`);
  return res.json();
}

async function exchangeCode(id, code, verifier) {
  const p = config(id);
  const json = await getJson(p.tokenUrl, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: p.clientId,
      client_secret: p.clientSecret,
      code,
      redirect_uri: callbackUrl(id),
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });
  if (typeof json.access_token !== 'string' || !json.access_token) throw new Error('no access token in response');
  return json.access_token;
}

// Normalized profile: provider user ID and a username hint. No email is read.
async function fetchProfile(id, accessToken) {
  const p = config(id);
  const auth = { Authorization: `Bearer ${accessToken}` };
  if (id === 'github') {
    const headers = { ...auth, Accept: 'application/vnd.github+json', 'User-Agent': 'Cryp-Cross' };
    const user = await getJson(`${p.apiBase}/user`, { headers });
    return { providerId: String(user.id), usernameHint: user.login || user.name || '' };
  }
  const info = await getJson(p.userinfoUrl, { headers: auth });
  return { providerId: String(info.sub), usernameHint: info.given_name || info.name || '' };
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = {
  PROVIDERS,
  isKnownProvider,
  isEnabled,
  enabledProviders,
  halfConfiguredProviders,
  callbackUrl,
  createAttempt,
  authorizeUrl,
  exchangeCode,
  fetchProfile,
  safeEqual,
  setEndpointOverrides,
};
