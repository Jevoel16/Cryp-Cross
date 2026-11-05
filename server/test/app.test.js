// These tests cover paths that never reach MongoDB, so no database is needed.
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp, allowedOrigins } = require('../app');

describe('allowedOrigins', () => {
  test('reads CORS_ORIGINS and strips trailing slashes', () => {
    process.env.CORS_ORIGINS = 'https://a.example/, https://b.example';
    assert.deepEqual(allowedOrigins(), ['https://a.example', 'https://b.example']);
    delete process.env.CORS_ORIGINS;
  });
});

describe('HTTP API (no database)', () => {
  let server;
  let base;

  before(async () => {
    process.env.CORS_ORIGINS = 'http://localhost:3000';
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    server.close();
    delete process.env.CORS_ORIGINS;
  });

  const post = (path, body) =>
    fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });

  test('malformed JSON returns 400', async () => {
    const res = await post('/api/anything', '{bad json');
    assert.equal(res.status, 400);
    assert.equal((await res.json()).message, 'Invalid JSON body');
  });

  test('oversized body returns 413', async () => {
    const res = await post('/api/anything', { text: 'x'.repeat(20000) });
    assert.equal(res.status, 413);
  });

  test('CORS allows listed origins only, with credentials', async () => {
    const ok = await fetch(`${base}/`, { headers: { Origin: 'http://localhost:3000' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(ok.headers.get('access-control-allow-credentials'), 'true');
    const blocked = await fetch(`${base}/`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(blocked.headers.get('access-control-allow-origin'), null);
  });

  test('sends security headers and rate-limit headers, hides x-powered-by', async () => {
    const res = await fetch(`${base}/api/nope`);
    assert.ok(res.headers.get('content-security-policy'));
    assert.ok(res.headers.get('strict-transport-security'));
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.ok(res.headers.get('ratelimit-policy'));
  });

  test('unknown routes return JSON 404', async () => {
    const res = await fetch(`${base}/nope`);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).success, false);
  });

  test('the old Project Log API is gone', async () => {
    const res = await fetch(`${base}/api/projects`);
    assert.equal(res.status, 404);
  });
});
