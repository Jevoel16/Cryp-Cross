const { halfConfiguredProviders, enabledProviders } = require('./oauth');

const REQUIRED_IN_PRODUCTION = ['SESSION_SECRET', 'PUZZLE_SECRET', 'APP_URL'];

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
  // Accounts are created only through GitHub/Google, so with neither set nobody can sign up.
  if (!enabledProviders().length) {
    console.warn('No sign-in provider configured (GITHUB_* or GOOGLE_*): players can only play as guests.');
  }
  return errors;
}

module.exports = { checkEnv };
