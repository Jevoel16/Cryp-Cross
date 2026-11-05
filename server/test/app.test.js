// These tests cover paths that never reach MongoDB, so no database is needed.
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp, validateProject, allowedOrigins } = require('../app');

describe('validateProject', () => {
  test('accepts a full, valid project and trims strings', () => {
    const { errors, data } = validateProject({ title: '  A  ', description: 'B', status: 'Complete' });
    assert.deepEqual(errors, []);
    assert.deepEqual(data, { title: 'A', description: 'B', status: 'Complete' });
  });

  test('leaves status out when omitted so the schema default applies', () => {
    const { errors, data } = validateProject({ title: 'A', description: 'B' });
    assert.deepEqual(errors, []);
    assert.equal(data.status, undefined);
  });

  test('rejects missing fields, wrong types, bad status and long values', () => {
    assert.equal(validateProject({}).errors.length, 2);
    assert.ok(validateProject({ title: 1, description: 'B' }).errors[0].includes('title'));
    assert.ok(validateProject({ title: 'A', description: 'B', status: 'pending' }).errors[0].includes('status'));
    assert.ok(validateProject({ title: 'x'.repeat(201), description: 'B' }).errors[0].includes('200'));
    assert.equal(validateProject(['x']).errors.length, 1);
  });

  test('partial mode requires at least one field', () => {
    assert.equal(validateProject({}, { partial: true }).errors.length, 1);
    assert.deepEqual(validateProject({ status: 'InProgress' }, { partial: true }).errors, []);
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

  const post = (path, body, headers = {}) =>
    fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });

  test('POST rejects invalid data with 400 and no internal details', async () => {
    const res = await post('/api/projects', { title: '', description: 'B' });
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error, undefined);
  });

  test('malformed JSON returns 400', async () => {
    const res = await post('/api/projects', '{bad json');
    assert.equal(res.status, 400);
    assert.equal((await res.json()).message, 'Invalid JSON body');
  });

  test('oversized body returns 413', async () => {
    const res = await post('/api/projects', { title: 'A', description: 'x'.repeat(20000) });
    assert.equal(res.status, 413);
  });

  test('PATCH and DELETE reject malformed ids', async () => {
    const patch = await fetch(`${base}/api/projects/123`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Complete' }),
    });
    assert.equal(patch.status, 400);
    const del = await fetch(`${base}/api/projects/not-an-id`, { method: 'DELETE' });
    assert.equal(del.status, 400);
  });

  test('CORS allows listed origins only', async () => {
    const ok = await fetch(`${base}/`, { headers: { Origin: 'http://localhost:3000' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    const blocked = await fetch(`${base}/`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(blocked.headers.get('access-control-allow-origin'), null);
  });

  test('sends security headers and rate-limit headers, hides x-powered-by', async () => {
    const res = await fetch(`${base}/api/projects/123`, { method: 'DELETE' });
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
});
