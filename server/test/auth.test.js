const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startDb, clearDb, stopDb, listen, createClient } = require('./helpers/db');
const { createApp } = require('../app');
const User = require('../models/user');
const { outbox } = require('../lib/mailer');

// Pulls the one-time token out of the last email sent to an address.
function tokenFor(email, path) {
  const mail = [...outbox].reverse().find((m) => m.to === email && m.text.includes(path));
  assert.ok(mail, `no ${path} email for ${email}`);
  return mail.text.match(/token=([a-f0-9]{64})/)[1];
}

const ALICE = { email: 'Alice@Example.com', username: 'Alice_1', password: 'correct horse battery' };

describe('accounts', () => {
  let api;

  before(async () => {
    process.env.AUTH_RATE_LIMIT = '1000';
    await startDb();
    api = await listen(createApp());
  });
  after(async () => {
    await api.close();
    await stopDb();
    delete process.env.AUTH_RATE_LIMIT;
  });
  beforeEach(async () => {
    await clearDb();
    outbox.length = 0;
  });

  test('signup hashes the password, signs in and sends a verification link', async () => {
    const tab = createClient(api.base);
    const res = await tab.post('/api/auth/signup', ALICE);
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.data, { username: 'alice_1', email: 'alice@example.com', emailVerified: false });

    const cookie = res.headers.get('set-cookie');
    assert.match(cookie, /cc\.sid=/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);

    const user = await User.findOne({ email: 'alice@example.com' }).lean();
    assert.notEqual(user.passwordHash, ALICE.password);
    assert.match(user.passwordHash, /^\$2[aby]\$12\$/);
    const token = tokenFor('alice@example.com', '/verify-email');
    assert.notEqual(user.verifyTokenHash, token, 'only the token hash is stored');

    assert.equal((await tab.get('/api/auth/me')).body.data.emailVerified, false);
    const verify = await tab.post('/api/auth/verify-email', { token });
    assert.equal(verify.status, 200);
    assert.equal((await tab.get('/api/auth/me')).body.data.emailVerified, true);
    assert.equal((await tab.post('/api/auth/verify-email', { token })).status, 400, 'tokens are single-use');
  });

  test('signup validates input and protects existing accounts', async () => {
    const tab = createClient(api.base);
    const bad = await tab.post('/api/auth/signup', { email: 'nope', username: 'a', password: 'short' });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.errors.length, 3);
    assert.equal((await tab.post('/api/auth/signup', { ...ALICE, password: 'é'.repeat(40) })).status, 400);

    await tab.post('/api/auth/signup', ALICE);
    const sameName = await createClient(api.base).post('/api/auth/signup', { ...ALICE, email: 'other@example.com' });
    assert.equal(sameName.status, 409);

    // Same email: identical answer to a fresh signup, no second account, a heads-up email instead.
    const sameEmail = await createClient(api.base).post('/api/auth/signup', { ...ALICE, username: 'someone' });
    assert.equal(sameEmail.status, 201);
    assert.equal(sameEmail.body.data, undefined);
    assert.equal(await User.countDocuments(), 1);
    assert.ok(outbox.some((m) => m.subject === 'Your Cryp-Cross account'));
  });

  test('login, me and logout', async () => {
    await createClient(api.base).post('/api/auth/signup', ALICE);
    const tab = createClient(api.base);
    assert.equal((await tab.get('/api/auth/me')).body.data, null);

    const wrong = await tab.post('/api/auth/login', { email: ALICE.email, password: 'wrong password!' });
    assert.equal(wrong.status, 401);
    const unknown = await tab.post('/api/auth/login', { email: 'ghost@example.com', password: 'whatever123' });
    assert.equal(unknown.status, 401);
    assert.equal(unknown.body.message, wrong.body.message, 'no hint which part was wrong');

    const ok = await tab.post('/api/auth/login', { email: ' ALICE@example.com ', password: ALICE.password });
    assert.equal(ok.status, 200);
    assert.equal((await tab.get('/api/auth/me')).body.data.username, 'alice_1');

    assert.equal((await tab.post('/api/auth/logout')).status, 200);
    assert.equal((await tab.get('/api/auth/me')).body.data, null);
  });

  test('password reset uses an expiring single-use link and ends old sessions', async () => {
    const oldTab = createClient(api.base);
    await oldTab.post('/api/auth/signup', ALICE);

    const forgotUnknown = await createClient(api.base).post('/api/auth/forgot-password', { email: 'ghost@example.com' });
    const forgot = await createClient(api.base).post('/api/auth/forgot-password', { email: ALICE.email });
    assert.equal(forgot.status, 200);
    assert.equal(forgot.body.message, forgotUnknown.body.message);
    const token = tokenFor('alice@example.com', '/reset-password');

    const tab = createClient(api.base);
    assert.equal((await tab.post('/api/auth/reset-password', { token, password: 'short' })).status, 400);
    const reset = await tab.post('/api/auth/reset-password', { token, password: 'a brand new password' });
    assert.equal(reset.status, 200);
    assert.equal((await tab.post('/api/auth/reset-password', { token, password: 'another new password' })).status, 400);

    assert.equal((await oldTab.get('/api/auth/me')).body.data, null, 'old session is invalidated');
    assert.equal((await tab.post('/api/auth/login', { email: ALICE.email, password: ALICE.password })).status, 401);
    const login = await tab.post('/api/auth/login', { email: ALICE.email, password: 'a brand new password' });
    assert.equal(login.status, 200);
    assert.equal(login.body.data.emailVerified, true);
  });

  test('expired reset links are refused', async () => {
    await createClient(api.base).post('/api/auth/signup', ALICE);
    await createClient(api.base).post('/api/auth/forgot-password', { email: ALICE.email });
    const token = tokenFor('alice@example.com', '/reset-password');
    await User.updateOne({}, { resetTokenExpires: new Date(Date.now() - 1000) });
    const res = await createClient(api.base).post('/api/auth/reset-password', { token, password: 'a brand new password' });
    assert.equal(res.status, 400);
  });

  test('resend verification needs a session', async () => {
    assert.equal((await createClient(api.base).post('/api/auth/resend-verification')).status, 401);
    const tab = createClient(api.base);
    await tab.post('/api/auth/signup', ALICE);
    assert.equal((await tab.post('/api/auth/resend-verification')).status, 200);
    assert.equal(outbox.filter((m) => m.text.includes('/verify-email')).length, 2);
  });

  test('writes from foreign origins or without JSON are refused', async () => {
    const evil = createClient(api.base, { origin: 'https://evil.example' });
    assert.equal((await evil.post('/api/auth/login', { email: ALICE.email, password: 'x' })).status, 403);

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
    const tab = createClient(api.base);
    const statuses = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await tab.post('/api/auth/login', { email: 'a@b.co', password: 'wrong password' })).status);
    }
    assert.deepEqual(statuses, [401, 401, 401, 429]);
  });
});
