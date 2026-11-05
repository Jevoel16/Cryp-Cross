const mongoose = require('mongoose');
const User = require('../models/user');

// Lives in server/ so mongoose resolves from server/node_modules for every entry point,
// including the Vercel function in api/ (the root package doesn't depend on mongoose).
async function connectDb(url = process.env.DATABASE_URL) {
  await mongoose.connect(url, { serverSelectionTimeoutMS: 10_000 });
  // Brings the users collection's indexes in line with the schema. Databases from before
  // v2.0.0 still have a unique email index, which would refuse every new (email-less) account.
  await User.syncIndexes();
}

module.exports = { connectDb };
