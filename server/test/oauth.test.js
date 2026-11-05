const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const { startDb, clearDb, stopDb, listen, createClient } = require('./helpers/db');
const { createApp } = require('../app');
const User = require('../models/user');
const { outbox } = require('../lib/mailer');
const oauth = require('../lib/oauth');
const { usernameBase } = require('../routes/oauth');

const APP_URL = 'http://localhost:3000';

// A stand-in for GitHub and Google: the access token is the code, and each code maps to
// a profile the test sets up. It also records the PKCE verifiers it receives.
function startFakeProvider() {
  const profiles = new Map();
  const verifiers = new Map();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://fake');
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
    if (url.pathname === '/user/emails') {
      return send(200, [
        { email: 'secondary@example.com', primary: false, verified: true },
        { email: p.email, primary: true, verified: p.verified },
      ]);
    }
    if (url.pathname === '/userinfo') {
      return send(200, { sub: p.id, email: p.email, email_verified: p.verified, name: p.login });
    }
    send(404, {});
  });
  return new Promise((resolve) => {
    server.listen(0, () => {
      const base = `http://127.0.0.1:${server.address().port}`;
      resolve({ base, profiles, verifiers, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

describe('usernameBase', () => {
  test('turns provider names into valid usernames', () => {
    assert.equal(usernameBase('Octo-Cat Dev'), 'octo_cat_dev');
    assert.equal(usernameBase('José'), 'jose');
    assert.equal(usernameBase('a'), 'player');
    assert.equal(usernameBase('x'.repeat(40)).length, 20);
  });
});

describe('sign in with GitHub and Google', () => {
  let api;
  let fake;

  before(async () => {
    process.env.AUTH_RATE_LIMIT = '1000';
    process.env.APP_URL = APP_URL;
    process.env.GITHUB_CLIENT_ID = 'gh-id';
    process.env.GITHUB_CLIENT_SECRET = 'gh-secret';
    process.env.GOOGLE_CLIENT_ID = 'g-id';
    process.env.GOOGLE_CLIENT_SECRET = 'g-secret';
    fake = await startFakeProvider();
    oauth.setEndpointOverrides({
      github: { authorizeUrl: `${fake.base}/authorize`, tokenUrl: `${fake.base}/token`, apiBase: fake.base },
      google: { authorizeUrl: `${fake.base}/authorize`, tokenUrl: `${fake.base}/token`, userinfoUrl: `${fake.base}/userinfo` },
    });
    await startDb();
    api = await listen(createApp());
  });
  after(async () => {
    await api.close();
    await fake.close();
    await stopDb();
    oauth.setEndpointOverrides(null);
    for (const name of ['AUTH_RATE_LIMIT', 'APP_URL', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']) {
      delete process.env[name];
    }
  });
  beforeEach(async () => {
    await clearDb();
    outbox.length = 0;
    fake.profiles.clear();
    fake.verifiers.clear();
  });

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

  async function passwordAccount(name, { verify }) {
    const tab = createClient(api.base);
    const email = `${name}@example.com`;
    await tab.post('/api/auth/signup', { email, username: name, password: 'a long enough password' });
    if (verify) {
      const token = outbox.find((m) => m.to === email).text.match(/token=([a-f0-9]{64})/)[1];
      await tab.post('/api/auth/verify-email', { token });
    }
    return tab;
  }

  test('lists only configured providers and 404s the rest', async () => {
    const tab = createClient(api.base);
    assert.deepEqual((await tab.get('/api/auth/providers')).body.data, ['github', 'google']);
    assert.equal((await tab.get('/api/auth/oauth/twitter')).status, 404);

    const secret = process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CLIENT_SECRET;
    try {
      assert.deepEqual((await tab.get('/api/auth/providers')).body.data, ['github']);
      assert.equal((await tab.get('/api/auth/oauth/google')).status, 404);
    } finally {
      process.env.GOOGLE_CLIENT_SECRET = secret;
    }
  });

  test('the start redirect carries state, PKCE and the callback URL', async () => {
    fake.profiles.set('octo', { id: 101, login: 'Octo-Cat', email: 'octo@example.com', verified: true });
    const tab = createClient(api.base);
    const { authorize, location } = await signIn(tab, 'github', 'octo');
    assert.equal(authorize.origin + authorize.pathname, `${fake.base}/authorize`);
    assert.equal(authorize.searchParams.get('client_id'), 'gh-id');
    assert.equal(authorize.searchParams.get('redirect_uri'), `${APP_URL}/api/auth/oauth/github/callback`);
    assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
    const verifier = fake.verifiers.get('octo');
    const expected = crypto.createHash('sha256').update(verifier).digest('base64url');
    assert.equal(authorize.searchParams.get('code_challenge'), expected, 'the verifier matches the challenge');
    assert.ok(!authorize.toString().includes('gh-secret'), 'the client secret never reaches the browser');
    assert.equal(location, `${APP_URL}/play`);
  });

  test('a new GitHub user gets a verified account and a session', async () => {
    fake.profiles.set('octo', { id: 101, login: 'Octo-Cat', email: 'Octo@Example.com', verified: true });
    const tab = createClient(api.base);
    const { location } = await signIn(tab, 'github', 'octo', { from: '/leaderboard' });
    assert.equal(location, `${APP_URL}/leaderboard`);
    const me = (await tab.get('/api/auth/me')).body.data;
    assert.deepEqual(me, {
      username: 'octo_cat',
      email: 'octo@example.com',
      emailVerified: true,
      hasPassword: false,
      providers: ['github'],
    });
    // Signed-in OAuth players are verified, so they can play ranked.
    assert.equal((await tab.get('/api/puzzles/today/progress')).status, 200);

    // Signing in again finds the same account, and a taken username gets a suffix.
    fake.profiles.set('octo2', { id: 202, login: 'octo_cat', email: 'other@example.com', verified: true });
    const second = createClient(api.base);
    await signIn(second, 'github', 'octo2');
    const other = (await second.get('/api/auth/me')).body.data;
    assert.match(other.username, /^octo_cat_\d{4}$/);
    const again = createClient(api.base);
    await signIn(again, 'github', 'octo');
    assert.equal((await again.get('/api/auth/me')).body.data.username, 'octo_cat');
    assert.equal(await User.countDocuments(), 2);
  });

  test('a password account is linked when the provider has verified the same email', async () => {
    await passwordAccount('alice', { verify: true });
    fake.profiles.set('g-alice', { id: 'g-1', login: 'Alice A', email: 'alice@example.com', verified: true });
    const tab = createClient(api.base);
    await signIn(tab, 'google', 'g-alice');
    const me = (await tab.get('/api/auth/me')).body.data;
    assert.equal(me.username, 'alice');
    assert.equal(me.hasPassword, true);
    assert.deepEqual(me.providers, ['google']);
    assert.equal(await User.countDocuments(), 1);
  });

  test('linking an unverified pre-registered account drops the unproven password', async () => {
    const squatter = await passwordAccount('squatter', { verify: false });
    await User.updateOne({ username: 'squatter' }, { email: 'victim@example.com' });
    fake.profiles.set('victim', { id: 'g-9', login: 'Victim', email: 'victim@example.com', verified: true });
    const tab = createClient(api.base);
    await signIn(tab, 'google', 'victim');
    const me = (await tab.get('/api/auth/me')).body.data;
    assert.equal(me.emailVerified, true);
    assert.equal(me.hasPassword, false);
    // The squatter's password and session no longer work.
    assert.equal((await squatter.get('/api/auth/me')).body.data, null);
    const login = await createClient(api.base).post('/api/auth/login', {
      email: 'victim@example.com',
      password: 'a long enough password',
    });
    assert.equal(login.status, 401);
  });

  test('a squatter cannot keep a provider linked to an account the email owner claims', async () => {
    const squatter = await passwordAccount('squatter', { verify: false });
    fake.profiles.set('gh-squat', { id: 777, login: 'squat', email: 'squat@example.com', verified: true });
    // Unverified accounts can't link a provider at all.
    const start = await squatter.get('/api/auth/oauth/github?link=1');
    assert.equal(start.headers.get('location'), `${APP_URL}/account?oauth=unverified`);

    // Even if a provider got linked before (e.g. older data), claiming the email removes it.
    await User.updateOne({ username: 'squatter' }, { email: 'victim@example.com', githubId: '777' });
    fake.profiles.set('victim', { id: 'g-9', login: 'Victim', email: 'victim@example.com', verified: true });
    await signIn(createClient(api.base), 'google', 'victim');
    const claimed = await User.findOne({ email: 'victim@example.com' });
    assert.equal(claimed.githubId, undefined);
    assert.equal(claimed.googleId, 'g-9');
    const attacker = createClient(api.base);
    await signIn(attacker, 'github', 'gh-squat');
    assert.notEqual((await attacker.get('/api/auth/me')).body.data.email, 'victim@example.com');
  });

  test('a password reset on an unverified account removes linked providers', async () => {
    await passwordAccount('carol', { verify: false });
    await User.updateOne({ username: 'carol' }, { githubId: '888' });
    await createClient(api.base).post('/api/auth/forgot-password', { email: 'carol@example.com' });
    const token = outbox.at(-1).text.match(/token=([a-f0-9]{64})/)[1];
    await createClient(api.base).post('/api/auth/reset-password', { token, password: 'another long password' });
    const carol = await User.findOne({ username: 'carol' });
    assert.equal(carol.emailVerified, true);
    assert.equal(carol.githubId, undefined);
  });

  test('an email the provider has not verified is refused', async () => {
    await passwordAccount('bob', { verify: true });
    fake.profiles.set('fake-bob', { id: 303, login: 'bob', email: 'bob@example.com', verified: false });
    const tab = createClient(api.base);
    const { location } = await signIn(tab, 'github', 'fake-bob');
    assert.equal(location, `${APP_URL}/login?oauth=noemail`);
    assert.equal((await tab.get('/api/auth/me')).body.data, null);
    assert.equal((await User.findOne({ username: 'bob' })).githubId, undefined);
  });

  test('bad, missing, reused or cross-provider state is refused', async () => {
    fake.profiles.set('octo', { id: 101, login: 'octo', email: 'octo@example.com', verified: true });
    const tab = createClient(api.base);
    // No attempt started in this session.
    let res = await tab.get('/api/auth/oauth/github/callback?code=octo&state=abc');
    assert.equal(res.headers.get('location'), `${APP_URL}/login?oauth=state`);

    const start = await tab.get('/api/auth/oauth/github');
    const state = new URL(start.headers.get('location')).searchParams.get('state');
    res = await tab.get('/api/auth/oauth/github/callback?code=octo&state=wrong');
    assert.equal(res.headers.get('location'), `${APP_URL}/login?oauth=state`);
    // The failed callback used up the attempt, so the real state no longer works either.
    res = await tab.get(`/api/auth/oauth/github/callback?code=octo&state=${state}`);
    assert.equal(res.headers.get('location'), `${APP_URL}/login?oauth=state`);

    const google = await tab.get('/api/auth/oauth/google');
    const gState = new URL(google.headers.get('location')).searchParams.get('state');
    res = await tab.get(`/api/auth/oauth/github/callback?code=octo&state=${gState}`);
    assert.equal(res.headers.get('location'), `${APP_URL}/login?oauth=state`);

    // The provider's own error (user pressed Cancel).
    const again = await tab.get('/api/auth/oauth/github');
    const s2 = new URL(again.headers.get('location')).searchParams.get('state');
    res = await tab.get(`/api/auth/oauth/github/callback?error=access_denied&state=${s2}`);
    assert.equal(res.headers.get('location'), `${APP_URL}/login?oauth=denied`);
    assert.equal(await User.countDocuments(), 0);
  });

  test('an expired attempt and a failed code exchange are refused', async () => {
    const tab = createClient(api.base);
    const realNow = Date.now;
    const start = await tab.get('/api/auth/oauth/github');
    const state = new URL(start.headers.get('location')).searchParams.get('state');
    Date.now = () => realNow() + 11 * 60 * 1000;
    try {
      const res = await tab.get(`/api/auth/oauth/github/callback?code=x&state=${state}`);
      assert.equal(res.headers.get('location'), `${APP_URL}/login?oauth=state`);
    } finally {
      Date.now = realNow;
    }

    const { location } = await signIn(tab, 'github', 'unknown-code');
    assert.equal(location, `${APP_URL}/login?oauth=failed`);
  });

  test('unsafe "from" values fall back to /play', async () => {
    fake.profiles.set('octo', { id: 101, login: 'octo', email: 'octo@example.com', verified: true });
    for (const from of ['//evil.example', 'https://evil.example', '/\\evil.example']) {
      const tab = createClient(api.base);
      const { location } = await signIn(tab, 'github', 'octo', { from });
      assert.equal(location, `${APP_URL}/play`, from);
    }
  });

  test('connect and disconnect from the Account page', async () => {
    const alice = await passwordAccount('alice', { verify: true });
    fake.profiles.set('gh-alice', { id: 555, login: 'alice-gh', email: 'different@example.com', verified: true });
    const linked = await signIn(alice, 'github', 'gh-alice', { link: true });
    assert.equal(linked.location, `${APP_URL}/account?linked=github`);
    let me = (await alice.get('/api/auth/me')).body.data;
    assert.equal(me.username, 'alice');
    assert.deepEqual(me.providers, ['github']);

    // Linking needs a signed-in user.
    const guest = createClient(api.base);
    const start = await guest.get('/api/auth/oauth/github?link=1');
    assert.equal(start.headers.get('location'), `${APP_URL}/login?oauth=failed`);

    // The same GitHub account can't be linked to a second user.
    const bob = await passwordAccount('bob', { verify: true });
    const taken = await signIn(bob, 'github', 'gh-alice', { link: true });
    assert.equal(taken.location, `${APP_URL}/account?oauth=linked`);

    const unlinked = await alice.post('/api/auth/oauth/github/unlink', {});
    assert.equal(unlinked.status, 200);
    assert.deepEqual(unlinked.body.data.providers, []);
    assert.equal((await guest.post('/api/auth/oauth/github/unlink', {})).status, 401);
  });

  test("the last way to sign in can't be disconnected", async () => {
    fake.profiles.set('octo', { id: 101, login: 'octo', email: 'octo@example.com', verified: true });
    const tab = createClient(api.base);
    await signIn(tab, 'github', 'octo');
    assert.equal((await tab.post('/api/auth/oauth/github/unlink', {})).status, 400);

    fake.profiles.set('g-octo', { id: 'g-101', login: 'octo', email: 'octo@example.com', verified: true });
    await signIn(tab, 'google', 'g-octo', { link: true });
    const res = await tab.post('/api/auth/oauth/github/unlink', {});
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.providers, ['google']);
  });

  test('users can change their username', async () => {
    const alice = await passwordAccount('alice', { verify: true });
    await passwordAccount('bob', { verify: true });
    assert.equal((await alice.put('/api/auth/username', { username: 'Bob' })).status, 409);
    assert.equal((await alice.put('/api/auth/username', { username: 'no spaces' })).status, 400);
    const ok = await alice.put('/api/auth/username', { username: 'Alice_2' });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.data.username, 'alice_2');
    assert.equal((await createClient(api.base).put('/api/auth/username', { username: 'zed' })).status, 401);
  });
});
