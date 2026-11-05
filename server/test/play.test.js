const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startDb, clearDb, stopDb, listen, createClient } = require('./helpers/db');
const { createApp } = require('../app');
const DailyPuzzle = require('../models/dailyPuzzle');
const Attempt = require('../models/attempt');
const User = require('../models/user');
const { outbox } = require('../lib/mailer');
const { streaks } = require('../routes/play');
const { dayKey, previousDayKey } = require('../puzzle/dayKey');

describe('streaks', () => {
  test('current streak survives until today ends; best streak scans all days', () => {
    assert.deepEqual(streaks([], '2026-11-05'), { current: 0, best: 0 });
    assert.deepEqual(streaks(['2026-11-04', '2026-11-03'], '2026-11-05'), { current: 2, best: 2 });
    assert.deepEqual(streaks(['2026-11-05', '2026-11-04'], '2026-11-05'), { current: 2, best: 2 });
    assert.deepEqual(streaks(['2026-11-03', '2026-10-01', '2026-10-02', '2026-10-03'], '2026-11-05'), {
      current: 0,
      best: 3,
    });
    assert.deepEqual(streaks(['2026-02-28', '2026-03-01'], '2026-03-01'), { current: 2, best: 2 });
  });
});

describe('playing the daily puzzle', () => {
  let api;
  let puzzle;

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
    await createClient(api.base).get('/api/puzzles/today');
    puzzle = await DailyPuzzle.findOne({ date: dayKey() }).lean();
  });

  async function player(name, { verify = true } = {}) {
    const tab = createClient(api.base);
    const email = `${name}@example.com`;
    await tab.post('/api/auth/signup', { email, username: name, password: 'a long enough password' });
    if (verify) {
      const mail = outbox.find((m) => m.to === email);
      const token = mail.text.match(/token=([a-f0-9]{64})/)[1];
      await tab.post('/api/auth/verify-email', { token });
    }
    return tab;
  }

  const blank = () => puzzle.solution.map((row) => row.replace(/[A-Z]/g, ' '));
  const body = (grid) => ({ date: puzzle.date, grid });

  test('guests and unverified players cannot save, check or submit', async () => {
    const guest = createClient(api.base);
    assert.equal((await guest.get('/api/puzzles/today/progress')).status, 401);
    assert.equal((await guest.post('/api/puzzles/today/submit', body(puzzle.solution))).status, 401);

    const unverified = await player('newbie', { verify: false });
    assert.equal((await unverified.get('/api/puzzles/today/progress')).status, 403);
    assert.equal((await unverified.post('/api/puzzles/today/check', body(blank()))).status, 403);
  });

  test('progress is saved per player and validated against the layout', async () => {
    const alice = await player('alice');
    const started = await alice.get('/api/puzzles/today/progress');
    assert.equal(started.status, 200);
    assert.deepEqual(started.body.data.grid, []);
    assert.ok(started.body.data.startedAt);

    const grid = blank();
    const first = puzzle.entries[0];
    grid[first.row] = grid[first.row].slice(0, first.col) + 'X' + grid[first.row].slice(first.col + 1);
    assert.equal((await alice.put('/api/puzzles/today/progress', body(grid))).status, 200);
    assert.deepEqual((await alice.get('/api/puzzles/today/progress')).body.data.grid, grid);
    assert.equal(
      (await alice.get('/api/puzzles/today/progress')).body.data.startedAt,
      started.body.data.startedAt,
      'the timer starts once'
    );

    // Another player's progress is separate.
    const bob = await player('bob');
    assert.deepEqual((await bob.get('/api/puzzles/today/progress')).body.data.grid, []);

    const lowercase = blank();
    lowercase[first.row] = lowercase[first.row].slice(0, first.col) + 'x' + lowercase[first.row].slice(first.col + 1);
    for (const bad of [
      { date: puzzle.date, grid: lowercase },
      { date: puzzle.date, grid: blank().slice(1) },
      { date: puzzle.date, grid: blank().map((r) => r.replace(/#/g, 'A')) },
      { date: previousDayKey(puzzle.date), grid: blank() },
      { date: puzzle.date, grid: 'nope' },
    ]) {
      assert.equal((await alice.put('/api/puzzles/today/progress', bad)).status, 400, JSON.stringify(bad).slice(0, 80));
    }
  });

  test('check reports entry status without answers; submit records one timed solve', async () => {
    const alice = await player('alice');
    await alice.get('/api/puzzles/today/progress');

    // Fill only the first entry correctly.
    const grid = blank().map((row) => row.split(''));
    const first = puzzle.entries[0];
    const [dr, dc] = first.direction === 'across' ? [0, 1] : [1, 0];
    for (let i = 0; i < first.length; i++) grid[first.row + dr * i][first.col + dc * i] = first.answer[i];
    const partial = grid.map((r) => r.join(''));

    const check = await alice.post('/api/puzzles/today/check', body(partial));
    assert.equal(check.status, 200);
    assert.equal(check.body.data.entries[0], 'right');
    assert.ok(check.body.data.entries.slice(1).every((s) => s === 'incomplete' || s === 'right'));
    assert.ok(!JSON.stringify(check.body).includes(puzzle.entries[1].answer));

    const wrongGrid = puzzle.solution.map((row) => row.replace(/[A-Z]/g, 'Q'));
    const wrong = await alice.post('/api/puzzles/today/submit', body(wrongGrid));
    assert.equal(wrong.body.data.solved, false);
    assert.equal(wrong.body.data.wrong, puzzle.entries.length);

    const solved = await alice.post('/api/puzzles/today/submit', body(puzzle.solution));
    assert.equal(solved.body.data.solved, true);
    assert.equal(solved.body.data.rank, 1);
    assert.ok(solved.body.data.timeMs >= 0);

    assert.equal((await alice.post('/api/puzzles/today/submit', body(puzzle.solution))).status, 409);
    // A solved grid can't be overwritten.
    await alice.put('/api/puzzles/today/progress', body(blank()));
    assert.deepEqual((await alice.get('/api/puzzles/today/progress')).body.data.grid, puzzle.solution);
  });

  test('leaderboard ranks by time and stats count streaks', async () => {
    const alice = await player('alice');
    const bob = await player('bob');
    const carol = await player('carol');
    await alice.get('/api/puzzles/today/progress');
    await bob.get('/api/puzzles/today/progress');
    await carol.get('/api/puzzles/today/progress');
    // Bob "started" earlier, so his solve takes longer.
    const bobUser = await User.findOne({ username: 'bob' });
    await Attempt.updateOne({ user: bobUser._id }, { startedAt: new Date(Date.now() - 60_000) });

    await alice.post('/api/puzzles/today/submit', body(puzzle.solution));
    await bob.post('/api/puzzles/today/submit', body(puzzle.solution));

    const board = await createClient(api.base).get('/api/leaderboard');
    assert.equal(board.status, 200);
    assert.equal(board.body.data.solvers, 2);
    assert.deepEqual(
      board.body.data.entries.map((e) => [e.rank, e.username]),
      [
        [1, 'alice'],
        [2, 'bob'],
      ]
    );
    assert.deepEqual(Object.keys(board.body.data.entries[0]).sort(), ['rank', 'timeMs', 'username']);
    assert.equal((await createClient(api.base).get('/api/leaderboard?date=bad')).status, 400);

    // Alice also solved yesterday and the day before.
    const aliceUser = await User.findOne({ username: 'alice' });
    const yesterday = previousDayKey(dayKey());
    for (const date of [yesterday, previousDayKey(yesterday)]) {
      await Attempt.create({ user: aliceUser._id, date, startedAt: new Date(), solvedAt: new Date(), timeMs: 5000 });
    }
    const stats = await alice.get('/api/me/stats');
    assert.equal(stats.body.data.solves, 3);
    assert.equal(stats.body.data.currentStreak, 3);
    assert.equal(stats.body.data.bestStreak, 3);
    assert.equal(stats.body.data.history[0].date, dayKey());

    const carolStats = await carol.get('/api/me/stats');
    assert.deepEqual(
      { solves: carolStats.body.data.solves, current: carolStats.body.data.currentStreak },
      { solves: 0, current: 0 }
    );
    assert.equal((await createClient(api.base).get('/api/me/stats')).status, 401);
  });
});
