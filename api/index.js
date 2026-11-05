// Vercel serverless entry for the Express API. vercel.json rewrites /api/* here, so the
// site and the API share one origin and the session cookie stays first-party.
const { createApp } = require('../server/app');
const { checkEnv } = require('../server/lib/env');
const { connectDb } = require('../server/lib/db');

// Warm invocations reuse the module, so the connection and app are built once per instance.
// The app is created only after MongoDB connects: the session and rate-limit stores pick
// MongoDB only when the connection is already open.
let appPromise;

async function buildApp() {
  const errors = checkEnv();
  if (errors.length) throw new Error(errors.join(' '));
  await connectDb();
  return createApp();
}

module.exports = async function handler(req, res) {
  appPromise ||= buildApp();
  let app;
  try {
    app = await appPromise;
  } catch (error) {
    // Let the next request try again instead of caching the failure.
    appPromise = undefined;
    console.error('API startup failed:', error.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Service unavailable' }));
    return;
  }
  return app(req, res);
};
