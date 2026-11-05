const mongoose = require('mongoose');

// Lives in server/ so mongoose resolves from server/node_modules for every entry point,
// including the Vercel function in api/ (the root package doesn't depend on mongoose).
function connectDb(url = process.env.DATABASE_URL) {
  return mongoose.connect(url, { serverSelectionTimeoutMS: 10_000 });
}

module.exports = { connectDb };
