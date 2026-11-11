const { halfConfiguredProviders, enabledProviders } = require('./oauth');

const REQUIRED_IN_PRODUCTION = ['SESSION_SECRET', 'PUZZLE_SECRET', 'APP_URL'];

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

// Returns fatal config problems for both entry points; logs warnings.
function checkEnv(env = process.env) {
  const errors = [];
  if (!env.DATABASE_URL) {
    errors.push('DATABASE_URL is not set. Copy the Local block of server/.env.example into server/.env.');
  }

  if (env.NODE_ENV === 'production') {
    const missing = REQUIRED_IN_PRODUCTION.filter((name) => !env[name]);
    if (missing.length) errors.push(`Missing required production settings: ${missing.join(', ')}`);
    if (!env.CORS_ORIGINS) console.warn('CORS_ORIGINS is not set: browsers on other origins will be blocked.');
    if (env.API_URL && env.APP_URL && originOf(env.API_URL) !== originOf(env.APP_URL)) {
      console.warn(
        `API_URL (${originOf(env.API_URL)}) differs from APP_URL: OAuth sign-in starts and finishes on API_URL's host, ` +
          'so leave API_URL empty for a same-origin deploy.',
      );
    }
  }

  const halfConfigured = halfConfiguredProviders();
  if (halfConfigured.length) {
    console.warn(
      `OAuth sign-in disabled for ${halfConfigured.join(', ')}: set both the client ID and the client secret.`,
    );
  }
  // Accounts are created only through GitHub/Google, so with neither set nobody can sign up.
  if (!enabledProviders().length) {
    console.warn('No sign-in provider configured (GITHUB_* or GOOGLE_*): players can only play as guests.');
  }
  return errors;
}

module.exports = { checkEnv };
