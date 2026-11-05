const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { startDb, clearDb, stopDb, listen, createClient } = require('./helpers/db');
const { APP_URL, setUpProviders, signIn } = require('./helpers/oauth');
const { createApp } = require('../app');
const User = require('../models/user');
const { usernameBase } = require('../routes/oauth');

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
  let tearDown;

  before(async () => {
    process.env.AUTH_RATE_LIMIT = '1000';
    ({ fake, tearDown } = await setUpProviders());
    await startDb();
    api = await listen(createApp());
  });
  after(async () => {
    await api.close();
    await stopDb();
    await tearDown();
    delete process.env.AUTH_RATE_LIMIT;
  });
  beforeEach(async () => {
    await clearDb();
    fake.profiles.clear();
    fake.verifiers.clear();
    fake.requestedPaths.length = 0;
  });

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

  test('the start redirect carries state, PKCE and the callback URL, and asks for no email', async () => {
    fake.profiles.set('octo', { id: 101, login: 'Octo-Cat' });
    const tab = createClient(api.base);
    const { authorize, location } = await signIn(tab, 'github', 'octo');
    assert.equal(authorize.origin + authorize.pathname, `${fake.base}/authorize`);
    assert.equal(authorize.searchParams.get('client_id'), 'gh-id');
    assert.equal(authorize.searchParams.get('redirect_uri'), `${APP_URL}/api/auth/oauth/github/callback`);
    assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(authorize.searchParams.get('scope'), null, 'GitHub: public profile only');
    const verifier = fake.verifiers.get('octo');
    const expected = crypto.createHash('sha256').update(verifier).digest('base64url');
    assert.equal(authorize.searchParams.get('code_challenge'), expected, 'the verifier matches the challenge');
    assert.ok(!authorize.toString().includes('gh-secret'), 'the client secret never reaches the browser');
    assert.equal(location, `${APP_URL}/play`);
    assert.ok(!fake.requestedPaths.includes('/user/emails'), 'emails are never fetched');

    const google = await tab.get('/api/auth/oauth/google');
    assert.equal(new URL(google.headers.get('location')).searchParams.get('scope'), 'openid profile');
  });

  test('a new GitHub user gets an account and a session that plays ranked', async () => {
    fake.profiles.set('octo', { id: 101, login: 'Octo-Cat' });
    const tab = createClient(api.base);
    const { location } = await signIn(tab, 'github', 'octo', { from: '/leaderboard' });
    assert.equal(location, `${APP_URL}/leaderboard`);
    const me = (await tab.get('/api/auth/me')).body.data;
    assert.deepEqual(me, {
      username: 'octo_cat',
      hasPassword: false,
      providers: ['github'],
      canSetPasswordWithoutCurrent: true,
    });
    assert.equal((await tab.get('/api/puzzles/today/progress')).status, 200);

    // Signing in again finds the same account, and a taken username gets a suffix.
    fake.profiles.set('octo2', { id: 202, login: 'octo_cat' });
    const second = createClient(api.base);
    await signIn(second, 'github', 'octo2');
    assert.match((await second.get('/api/auth/me')).body.data.username, /^octo_cat_\d{4}$/);
    const again = createClient(api.base);
    await signIn(again, 'github', 'octo');
    assert.equal((await again.get('/api/auth/me')).body.data.username, 'octo_cat');
    assert.equal(await User.countDocuments(), 2);
  });

  test('a Google sign-in never joins an existing GitHub account on its own', async () => {
    fake.profiles.set('gh', { id: 1, login: 'sam' });
    fake.profiles.set('g', { id: 'g-1', login: 'sam' });
    await signIn(createClient(api.base), 'github', 'gh');
    await signIn(createClient(api.base), 'google', 'g');
    assert.equal(await User.countDocuments(), 2);
  });

  test('bad, missing, reused or cross-provider state is refused', async () => {
    fake.profiles.set('octo', { id: 101, login: 'octo' });
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
    fake.profiles.set('octo', { id: 101, login: 'octo' });
    for (const from of ['//evil.example', 'https://evil.example', '/\\evil.example']) {
      const tab = createClient(api.base);
      const { location } = await signIn(tab, 'github', 'octo', { from });
      assert.equal(location, `${APP_URL}/play`, from);
    }
  });

  test('connect and disconnect from the Account page', async () => {
    fake.profiles.set('gh-alice', { id: 555, login: 'alice' });
    fake.profiles.set('g-alice', { id: 'g-555', login: 'Alice A' });
    const alice = createClient(api.base);
    await signIn(alice, 'github', 'gh-alice');
    const linked = await signIn(alice, 'google', 'g-alice', { link: true });
    assert.equal(linked.location, `${APP_URL}/account?linked=google`);
    const me = (await alice.get('/api/auth/me')).body.data;
    assert.equal(me.username, 'alice');
    assert.deepEqual(me.providers, ['github', 'google']);
    assert.equal(await User.countDocuments(), 1);

    // Linking needs a signed-in user.
    const guest = createClient(api.base);
    const start = await guest.get('/api/auth/oauth/github?link=1');
    assert.equal(start.headers.get('location'), `${APP_URL}/login?oauth=failed`);

    // The same GitHub account can't be linked to a second user.
    fake.profiles.set('gh-bob', { id: 556, login: 'bob' });
    const bob = createClient(api.base);
    await signIn(bob, 'github', 'gh-bob');
    const taken = await signIn(bob, 'google', 'g-alice', { link: true });
    assert.equal(taken.location, `${APP_URL}/account?oauth=linked`);

    const unlinked = await alice.post('/api/auth/oauth/github/unlink', {});
    assert.equal(unlinked.status, 200);
    assert.deepEqual(unlinked.body.data.providers, ['google']);
    assert.equal((await guest.post('/api/auth/oauth/github/unlink', {})).status, 401);
  });

  test("the last way to sign in can't be disconnected until a password is set", async () => {
    fake.profiles.set('octo', { id: 101, login: 'octo' });
    const tab = createClient(api.base);
    await signIn(tab, 'github', 'octo');
    assert.equal((await tab.post('/api/auth/oauth/github/unlink', {})).status, 400);

    await tab.put('/api/auth/password', { password: 'a long enough password' });
    const res = await tab.post('/api/auth/oauth/github/unlink', {});
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.providers, []);
    assert.equal(
      (await createClient(api.base).post('/api/auth/login', { username: 'octo', password: 'a long enough password' })).status,
      200
    );
  });
});
