const crypto = require('crypto');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET is required in production');
  // Development fallback: sessions just don't survive an API restart.
  return crypto.randomBytes(32).toString('hex');
}

// httpOnly session cookie backed by MongoDB; memory store only without a database (tests).
function createSessionMiddleware() {
  const store =
    mongoose.connection.readyState === 1
      ? MongoStore.create({
          client: mongoose.connection.getClient(),
          collectionName: 'sessions',
          ttl: TWO_WEEKS_MS / 1000,
        })
      : undefined;

  return session({
    name: 'cc.sid',
    secret: sessionSecret(),
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: TWO_WEEKS_MS,
    },
  });
}

module.exports = { createSessionMiddleware };
