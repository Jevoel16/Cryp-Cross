const bcrypt = require('bcryptjs');
const User = require('../models/user');

// Public on purpose: shown on the Log in page so reviewers can try the signed-in app.
const DEMO_ACCOUNT = Object.freeze({ username: 'demo', password: 'decode-the-grid' });

// On unless DEMO_ACCOUNT is set to off, 0 or false.
const demoEnabled = (env = process.env) =>
  !['off', '0', 'false'].includes(String(env.DEMO_ACCOUNT || '').toLowerCase());

// Creates or repairs the demo user; safe to run on every start. Returns the user, or null when skipped.
async function seedDemoUser({ rounds = 12 } = {}) {
  if (!demoEnabled()) return null;
  const existing = await User.findOne({ username: DEMO_ACCOUNT.username });
  if (existing && !existing.isDemo) {
    console.warn(`Demo account skipped: the username "${DEMO_ACCOUNT.username}" belongs to a real player.`);
    return null;
  }
  const user = existing || new User({ username: DEMO_ACCOUNT.username, isDemo: true });
  const passwordOk = user.passwordHash && (await bcrypt.compare(DEMO_ACCOUNT.password, user.passwordHash));
  if (existing && passwordOk) return existing;
  user.passwordHash = await bcrypt.hash(DEMO_ACCOUNT.password, rounds);
  try {
    await user.save();
  } catch (error) {
    // Two instances can seed at once; the unique username index lets one win.
    if (error.code === 11000) return User.findOne({ username: DEMO_ACCOUNT.username, isDemo: true });
    throw error;
  }
  return user;
}

// What the Log in page may show, or null when the demo account is off or was not seeded.
async function demoCredentials() {
  if (!demoEnabled()) return null;
  const seeded = await User.exists({ username: DEMO_ACCOUNT.username, isDemo: true });
  return seeded ? { ...DEMO_ACCOUNT } : null;
}

module.exports = { DEMO_ACCOUNT, demoEnabled, seedDemoUser, demoCredentials };
