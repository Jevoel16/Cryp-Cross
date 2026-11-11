const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startDb, clearDb, stopDb, listen, createClient } = require('./helpers/db');
const { createApp } = require('../app');
const User = require('../models/user');
const Attempt = require('../models/attempt');
const DailyPuzzle = require('../models/dailyPuzzle');
const { dayKey } = require('../puzzle/dayKey');
const { DEMO_ACCOUNT, seedDemoUser, demoEnabled } = require('../seed/demo');

const seed = () => seedDemoUser({ rounds: 4 });

describe('demo account', () => {
  let api;
  let puzzle;

  before(async () => {
    process.env.AUTH_RATE_LIMIT = '1000';
    process.env.MIN_SOLVE_SECONDS = '0';
    await startDb();
    api = await listen(createApp());
  });
  after(async () => {
    await api.close();
    await stopDb();
    delete process.env.AUTH_RATE_LIMIT;
    delete process.env.MIN_SOLVE_SECONDS;
    delete process.env.DEMO_ACCOUNT;
  });
  beforeEach(async () => {
    delete process.env.DEMO_ACCOUNT;
    await clearDb();
    await createClient(api.base).get('/api/puzzles/today');
    puzzle = await DailyPuzzle.findOne({ date: dayKey() }).lean();
  });

  const body = (grid) => ({ date: puzzle.date, grid });

  async function demoTab() {
    await seed();
    const tab = createClient(api.base);
    const res = await tab.post('/api/auth/login', DEMO_ACCOUNT);
    assert.equal(res.status, 200);
    return tab;
  }

  test('seeding is idempotent and repairs a changed password', async () => {
    const first = await seed();
    const second = await seed();
    assert.equal(String(first._id), String(second._id));
    assert.equal(await User.countDocuments({ isDemo: true }), 1);

    await User.updateOne({ _id: first._id }, { passwordHash: 'broken' });
    await seed();
    assert.equal((await createClient(api.base).post('/api/auth/login', DEMO_ACCOUNT)).status, 200);
  });

  test('a real player who owns the username is left alone', async () => {
    await User.create({ username: DEMO_ACCOUNT.username, githubId: '42' });
    assert.equal(await seed(), null);
    assert.equal(await User.countDocuments({ isDemo: true }), 0);
    assert.equal((await createClient(api.base).get('/api/auth/demo')).body.data, null);
  });

  test('the credentials are served only while the account is on and seeded', async () => {
    const guest = createClient(api.base);
    assert.equal((await guest.get('/api/auth/demo')).body.data, null);
    await seed();
    assert.deepEqual((await guest.get('/api/auth/demo')).body.data, { ...DEMO_ACCOUNT });

    process.env.DEMO_ACCOUNT = 'off';
    assert.equal(demoEnabled(), false);
    assert.equal((await guest.get('/api/auth/demo')).body.data, null);
    assert.equal(await seed(), null);
  });

  test('the demo account can play, and is marked as demo', async () => {
    const tab = await demoTab();
    const me = (await tab.get('/api/auth/me')).body.data;
    assert.equal(me.demo, true);
    assert.equal(me.hasPassword, true);
    assert.equal((await tab.get('/api/puzzles/today/progress')).status, 200);
    assert.equal((await tab.put('/api/puzzles/today/progress', body(puzzle.solution))).status, 200);
    assert.equal((await tab.post('/api/puzzles/today/check', body(puzzle.solution))).status, 200);
  });

  test('the demo account cannot change how it signs in', async () => {
    const tab = await demoTab();
    assert.equal((await tab.put('/api/auth/username', { username: 'hijacked' })).status, 403);
    const password = await tab.put('/api/auth/password', {
      password: 'a brand new password',
      currentPassword: DEMO_ACCOUNT.password,
    });
    assert.equal(password.status, 403);
    assert.equal((await tab.post('/api/auth/oauth/github/unlink', {})).status, 403);
    assert.equal((await createClient(api.base).post('/api/auth/login', DEMO_ACCOUNT)).status, 200);
    assert.equal(await User.countDocuments({ username: 'hijacked' }), 0);
  });

  test('demo solves are never ranked and do not move real players', async () => {
    const tab = await demoTab();
    await tab.get('/api/puzzles/today/progress');
    const solved = await tab.post('/api/puzzles/today/submit', body(puzzle.solution));
    assert.equal(solved.body.data.solved, true);
    assert.equal(solved.body.data.rank, null);

    const board = (await createClient(api.base).get('/api/leaderboard')).body.data;
    assert.equal(board.solvers, 0);
    assert.deepEqual(board.entries, []);

    // A real player who is slower than the demo solve still ranks first.
    const alice = await User.create({ username: 'alice', githubId: '1' });
    await Attempt.create({
      user: alice._id,
      date: puzzle.date,
      grid: puzzle.solution,
      startedAt: new Date(Date.now() - 600_000),
      solvedAt: new Date(),
      timeMs: 600_000,
    });
    const after = (await createClient(api.base).get('/api/leaderboard')).body.data;
    assert.equal(after.solvers, 1);
    assert.deepEqual(after.entries, [{ rank: 1, username: 'alice', timeMs: 600_000 }]);
  });

  test('each demo login starts today from an empty grid', async () => {
    const first = await demoTab();
    await first.get('/api/puzzles/today/progress');
    await first.post('/api/puzzles/today/submit', body(puzzle.solution));

    const second = await demoTab();
    const progress = (await second.get('/api/puzzles/today/progress')).body.data;
    assert.deepEqual(progress.grid, []);
    assert.equal(progress.solvedAt, null);
  });
});
