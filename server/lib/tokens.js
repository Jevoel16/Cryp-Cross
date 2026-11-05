const crypto = require('crypto');

// One-time tokens for email links. The raw token goes in the email; only its hash is stored,
// so a database leak can't be used to verify or reset accounts.
function createToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

const isTokenShape = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

module.exports = { createToken, hashToken, isTokenShape };
