const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { startDb, clearDb, stopDb, listen, createClient } = require('./helpers/db');
const { setUpProviders, signIn } = require('./helpers/oauth');
const { createApp } = require('../app');
const User = require('../models/user');

const PASSWORD = 'correct horse battery';

describe('accounts', () => {
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
  });

  // A GitHub-created account, signed in, that sets a password right away.
  async function accountWithPassword(login, id) {
    fake.profiles.set(login, { id, login });
    const tab = createClient(api.base);
    await signIn(tab, 'github', login);
    const set = await tab.put('/api/auth/password', { password: PASSWORD });
    assert.equal(set.status, 200);
    return tab;
  }

  test('the old email routes are gone', async () => {
    const tab = createClient(api.base);
    for (const path of ['/api/auth/signup', '/api/auth/verify-email', '/api/auth/forgot-password', '/api/auth/reset-password']) {
      assert.equal((await tab.post(path, {})).status, 404, path);
    }
  });

  test('a fresh GitHub sign-in can set a password; it is hashed and no email is stored', async () => {
    const tab = await accountWithPassword('Alice', 1);
    const me = (await tab.get('/api/auth/me')).body.data;
    assert.equal(me.username, 'alice');
    assert.equal(me.hasPassword, true);
    assert.deepEqual(me.providers, ['github']);
    assert.equal('email' in me, false);

    const user = await User.findOne({ username: 'alice' }).lean();
    assert.equal(user.email, undefined);
    assert.notEqual(user.passwordHash, PASSWORD);
    assert.match(user.passwordHash, /^\$2[aby]\$12\$/);
    // Saving the password keeps this session signed in.
    assert.equal((await tab.get('/api/puzzles/today/progress')).status, 200);
  });

  test('login with username and password, me and logout', async () => {
    await accountWithPassword('alice', 1);
    const tab = createClient(api.base);
    assert.equal((await tab.get('/api/auth/me')).body.data, null);

    const wrong = await tab.post('/api/auth/login', { username: 'alice', password: 'wrong password!' });
    assert.equal(wrong.status, 401);
    const unknown = await tab.post('/api/auth/login', { username: 'ghost', password: 'whatever123' });
    assert.equal(unknown.status, 401);
    assert.equal(unknown.body.message, wrong.body.message, 'no hint which part was wrong');
    assert.equal((await tab.post('/api/auth/login', { password: 'x' })).status, 400);

    const ok = await tab.post('/api/auth/login', { username: ' ALICE ', password: PASSWORD });
    assert.equal(ok.status, 200);
    const cookie = ok.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.equal((await tab.get('/api/auth/me')).body.data.username, 'alice');

    assert.equal((await tab.post('/api/auth/logout')).status, 200);
    assert.equal((await tab.get('/api/auth/me')).body.data, null);
  });

  test('accounts without a password cannot log in with one', async () => {
    fake.profiles.set('bob', { id: 2, login: 'bob' });
    await signIn(createClient(api.base), 'github', 'bob');
    const res = await createClient(api.base).post('/api/auth/login', { username: 'bob', password: 'anything long' });
    assert.equal(res.status, 401);
  });

  test('changing the password needs the current one and ends other sessions', async () => {
    const first = await accountWithPassword('alice', 1);
    const tab = createClient(api.base);
    await tab.post('/api/auth/login', { username: 'alice', password: PASSWORD });

    // Signed in by password: the current password is required.
    assert.equal((await tab.put('/api/auth/password', { password: 'a brand new password' })).status, 403);
    const wrong = await tab.put('/api/auth/password', { password: 'a brand new password', currentPassword: 'nope nope nope' });
    assert.equal(wrong.status, 403);
    assert.equal((await tab.put('/api/auth/password', { password: 'short', currentPassword: PASSWORD })).status, 400);
    const ok = await tab.put('/api/auth/password', { password: 'a brand new password', currentPassword: PASSWORD });
    assert.equal(ok.status, 200);

    assert.equal((await tab.get('/api/auth/me')).body.data.username, 'alice', 'this session stays');
    assert.equal((await first.get('/api/auth/me')).body.data, null, 'other sessions end');
    assert.equal((await createClient(api.base).post('/api/auth/login', { username: 'alice', password: PASSWORD })).status, 401);
    assert.equal(
      (await createClient(api.base).post('/api/auth/login', { username: 'alice', password: 'a brand new password' })).status,
      200
    );
  });

  test('forgot password: a recent GitHub sign-in can set a new one, an old one cannot', async () => {
    await accountWithPassword('alice', 1);
    const tab = createClient(api.base);
    await signIn(tab, 'github', 'alice');
    assert.equal((await tab.get('/api/auth/me')).body.data.canSetPasswordWithoutCurrent, true);

    const realNow = Date.now;
    Date.now = () => realNow() + 11 * 60 * 1000;
    try {
      assert.equal((await tab.put('/api/auth/password', { password: 'too late password' })).status, 403);
      assert.equal((await tab.get('/api/auth/me')).body.data.canSetPasswordWithoutCurrent, false);
    } finally {
      Date.now = realNow;
    }
    assert.equal((await tab.put('/api/auth/password', { password: 'a recovered password' })).status, 200);
    // The grace window closes once used.
    assert.equal((await tab.put('/api/auth/password', { password: 'yet another password' })).status, 403);
  });

  test('password and username changes need a session', async () => {
    const guest = createClient(api.base);
    assert.equal((await guest.put('/api/auth/password', { password: 'a long password!' })).status, 401);
    assert.equal((await guest.put('/api/auth/username', { username: 'zed' })).status, 401);
  });

  test('users can change their username', async () => {
    const alice = await accountWithPassword('alice', 1);
    await accountWithPassword('bob', 2);
    assert.equal((await alice.put('/api/auth/username', { username: 'Bob' })).status, 409);
    assert.equal((await alice.put('/api/auth/username', { username: 'no spaces' })).status, 400);
    const ok = await alice.put('/api/auth/username', { username: 'Alice_2' });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.data.username, 'alice_2');
    assert.equal((await createClient(api.base).post('/api/auth/login', { username: 'alice_2', password: PASSWORD })).status, 200);
  });

  test('writes from foreign origins or without JSON are refused', async () => {
    const evil = createClient(api.base, { origin: 'https://evil.example' });
    assert.equal((await evil.post('/api/auth/login', { username: 'alice', password: 'x' })).status, 403);

    const form = await fetch(`${api.base}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: 'http://localhost:3000' },
      body: 'a=1',
    });
    assert.equal(form.status, 415);
  });
});

describe('auth rate limit', () => {
  let api;

  before(async () => {
    process.env.AUTH_RATE_LIMIT = '3';
    await startDb();
    api = await listen(createApp());
  });
  after(async () => {
    await api.close();
    await stopDb();
    delete process.env.AUTH_RATE_LIMIT;
  });

  test('blocks repeated login attempts', async () => {
    await User.create({ username: 'alice', passwordHash: bcrypt.hashSync(PASSWORD, 4) });
    const tab = createClient(api.base);
    const statuses = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await tab.post('/api/auth/login', { username: 'alice', password: 'wrong password' })).status);
    }
    assert.deepEqual(statuses, [401, 401, 401, 429]);
  });
});
