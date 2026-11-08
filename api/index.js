// Vercel entry for the API; /api/* is rewritten here so site and API share one origin.
const { createApp } = require('../server/app');
const { checkEnv } = require('../server/lib/env');
const { connectDb } = require('../server/lib/db');

// Built once per warm instance, after MongoDB connects (see docs/architecture.md#serverless-startup).
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
