// Starts an in-memory MongoDB for a test file and wipes it between tests.
process.env.NODE_ENV = 'test';
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;

async function startDb() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

async function clearDb() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

async function stopDb() {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}

// Listens on a random port and returns the base URL plus a close function.
async function listen(app) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// Minimal cookie-keeping JSON client, like a browser tab with its own session.
function createClient(base, { origin = 'http://localhost:3000' } = {}) {
  let cookie = '';
  async function request(method, path, body) {
    const headers = { Origin: origin };
    if (cookie) headers.Cookie = cookie;
    if (method !== 'GET') headers['Content-Type'] = 'application/json';
    const res = await fetch(base + path, { method, headers, body: method === 'GET' ? undefined : JSON.stringify(body || {}) });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
  }
  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    get cookie() {
      return cookie;
    },
  };
}

module.exports = { startDb, clearDb, stopDb, listen, createClient };
