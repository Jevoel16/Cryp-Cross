const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startDb, clearDb, stopDb, listen } = require('./helpers/db');
const { createApp } = require('../app');
const DailyPuzzle = require('../models/dailyPuzzle');
const { generatePuzzle } = require('../puzzle/generate');
const { wordList } = require('../puzzle/service');
const { dayKey, previousDayKey } = require('../puzzle/dayKey');

describe('puzzle API', () => {
  let api;

  before(async () => {
    await startDb();
    api = await listen(createApp());
  });
  after(async () => {
    await api.close();
    await stopDb();
  });
  beforeEach(clearDb);

  const get = async (path) => {
    const res = await fetch(api.base + path);
    return { status: res.status, body: await res.json() };
  };

  test('today is created once and hides answers and keys', async () => {
    const first = await get('/api/puzzles/today');
    assert.equal(first.status, 200);
    const { data } = first.body;
    assert.equal(data.date, dayKey());
    assert.equal(data.isToday, true);
    assert.equal(data.solution, undefined);
    assert.equal(data.cipher.shift, undefined);
    assert.equal(data.cipher.key, undefined);
    assert.ok(data.layout.every((row) => /^[#.]+$/.test(row)));

    const stored = await DailyPuzzle.findOne({ date: data.date }).lean();
    const raw = JSON.stringify(data);
    for (const e of stored.entries) {
      assert.ok(!raw.includes(e.answer), `answer ${e.answer} leaked`);
      assert.ok(!raw.includes(e.clue), 'plain clue leaked');
    }

    const again = await get('/api/puzzles/today');
    assert.deepEqual(again.body.data, data);
    assert.equal(await DailyPuzzle.countDocuments(), 1);
  });

  test('past stored puzzles reveal answers; unknown and future dates 404', async () => {
    const yesterday = previousDayKey(dayKey());
    await DailyPuzzle.create(generatePuzzle(yesterday, wordList()));

    const past = await get(`/api/puzzles/${yesterday}`);
    assert.equal(past.status, 200);
    assert.equal(past.body.data.isToday, false);
    assert.ok(past.body.data.solution.length > 0);
    assert.ok(past.body.data.entries.every((e) => e.answer && e.plainClue));

    assert.equal((await get('/api/puzzles/2001-01-01')).status, 404);
    assert.equal((await get('/api/puzzles/2999-01-01')).status, 404);
    assert.equal((await get('/api/puzzles/not-a-date')).status, 400);
    assert.equal(await DailyPuzzle.countDocuments(), 1, 'archive requests never create puzzles');

    const list = await get('/api/puzzles');
    assert.deepEqual(list.body.data.map((p) => p.date), [yesterday]);
  });
});
