// Starts an in-memory MongoDB for a test file and wipes it between tests.
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

module.exports = { startDb, clearDb, stopDb, listen };
