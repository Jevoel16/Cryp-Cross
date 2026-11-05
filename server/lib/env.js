const { halfConfiguredProviders } = require('./oauth');

const REQUIRED_IN_PRODUCTION = ['SESSION_SECRET', 'PUZZLE_SECRET', 'SMTP_HOST', 'APP_URL'];

// Checks the settings both entry points (server.js and the Vercel function) need.
// Returns fatal problems as a list; warnings are logged here.
function checkEnv(env = process.env) {
  const errors = [];
  if (!env.DATABASE_URL) {
    errors.push('DATABASE_URL is not set. Copy server/.env.example to server/.env.');
  }

  if (env.NODE_ENV === 'production') {
    const missing = REQUIRED_IN_PRODUCTION.filter((name) => !env[name]);
    if (missing.length) errors.push(`Missing required production settings: ${missing.join(', ')}`);
    if (!env.CORS_ORIGINS) console.warn('CORS_ORIGINS is not set: browsers on other origins will be blocked.');
  }

  const halfConfigured = halfConfiguredProviders();
  if (halfConfigured.length) {
    console.warn(`OAuth sign-in disabled for ${halfConfigured.join(', ')}: set both the client ID and the client secret.`);
  }
  return errors;
}

module.exports = { checkEnv };
