const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startDb, clearDb, stopDb } = require('./helpers/db');
const { MongoRateLimitStore, createRateLimitStore, RateLimit } = require('../lib/rateLimitStore');

describe('MongoRateLimitStore', () => {
  before(startDb);
  after(stopDb);
  beforeEach(clearDb);

  const makeStore = (prefix, windowMs = 60_000) => {
    const store = new MongoRateLimitStore({ prefix });
    store.init({ windowMs });
    return store;
  };

  test('is used only while MongoDB is connected', () => {
    assert.ok(createRateLimitStore('x') instanceof MongoRateLimitStore);
  });

  test('counts hits within one window', async () => {
    const store = makeStore('t');
    const first = await store.increment('1.2.3.4');
    const second = await store.increment('1.2.3.4');
    assert.equal(first.totalHits, 1);
    assert.equal(second.totalHits, 2);
    assert.equal(second.resetTime.getTime(), first.resetTime.getTime());
  });

  test('concurrent first hits are all counted', async () => {
    const store = makeStore('t');
    const results = await Promise.all(Array.from({ length: 10 }, () => store.increment('race')));
    assert.deepEqual(
      results.map((r) => r.totalHits).sort((a, b) => a - b),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    );
  });

  test('starts a new window once the old one has ended', async () => {
    const store = makeStore('t', 50);
    await store.increment('k');
    await store.increment('k');
    await new Promise((resolve) => setTimeout(resolve, 80));
    const next = await store.increment('k');
    assert.equal(next.totalHits, 1);
  });

  test('prefixes keep limiters apart', async () => {
    const auth = makeStore('auth');
    const api = makeStore('api');
    await auth.increment('ip');
    await auth.increment('ip');
    assert.equal((await api.increment('ip')).totalHits, 1);
  });

  test('decrement and resetKey', async () => {
    const store = makeStore('t');
    await store.increment('k');
    await store.increment('k');
    await store.decrement('k');
    assert.equal((await RateLimit.findById('t:k').lean()).hits, 1);
    await store.resetKey('k');
    assert.equal(await RateLimit.findById('t:k'), null);
  });
});
