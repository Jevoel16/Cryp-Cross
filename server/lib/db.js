const mongoose = require('mongoose');
const User = require('../models/user');

// In server/ so mongoose resolves from server/node_modules for every entry point.
async function connectDb(url = process.env.DATABASE_URL) {
  await mongoose.connect(url, { serverSelectionTimeoutMS: 10_000 });
  // Syncs indexes so pre-2.0 databases drop the old unique email index.
  await User.syncIndexes();
}

module.exports = { connectDb };
