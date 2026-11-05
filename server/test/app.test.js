// These tests cover paths that never reach MongoDB, so no database is needed.
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp, allowedOrigins, trustProxyHops } = require('../app');

describe('trustProxyHops', () => {
  const saved = { TRUST_PROXY: process.env.TRUST_PROXY, VERCEL: process.env.VERCEL };
  const restore = () => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };

  test('defaults to 0 off Vercel and 1 on Vercel', () => {
    delete process.env.TRUST_PROXY;
    delete process.env.VERCEL;
    assert.equal(trustProxyHops(), 0);
    process.env.VERCEL = '1';
    assert.equal(trustProxyHops(), 1);
    restore();
  });

  test('TRUST_PROXY overrides the default, including 0', () => {
    process.env.VERCEL = '1';
    process.env.TRUST_PROXY = '0';
    assert.equal(trustProxyHops(), 0);
    process.env.TRUST_PROXY = '2';
    assert.equal(trustProxyHops(), 2);
    restore();
  });
});

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

  const postFrom = (origin) =>
    fetch(`${base}/api/anything`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: '{}',
    });

  test('writes from a foreign origin are refused', async () => {
    const res = await postFrom('https://evil.example');
    assert.equal(res.status, 403);
    assert.equal((await res.json()).message, 'Origin not allowed');
  });

  test('same-origin writes pass without being listed in CORS_ORIGINS', async () => {
    // base is http://127.0.0.1:<port>, which is not in CORS_ORIGINS.
    const res = await postFrom(base);
    assert.notEqual(res.status, 403);
  });

  test('a matching scheme is required for same-origin writes', async () => {
    const res = await postFrom(base.replace('http://', 'https://'));
    assert.equal(res.status, 403);
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
