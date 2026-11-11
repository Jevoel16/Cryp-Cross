const mongoose = require('mongoose');
const User = require('../models/user');

// In server/ so mongoose resolves from server/node_modules for every entry point.
// No query may hold a request longer than this.
const QUERY_TIMEOUT_MS = 5_000;

async function connectDb(url = process.env.DATABASE_URL) {
  mongoose.set('maxTimeMS', QUERY_TIMEOUT_MS);
  await mongoose.connect(url, { serverSelectionTimeoutMS: 10_000, socketTimeoutMS: 20_000 });
  // Syncs indexes so pre-2.0 databases drop the old unique email index.
  await User.syncIndexes();
}

module.exports = { connectDb };
