// Small server-side validators. Each returns { errors, data } with cleaned values.

const USERNAME = /^[a-z0-9_]{3,20}$/;
// bcrypt only uses the first 72 bytes, so longer passwords are refused rather than silently cut.
const PASSWORD_MIN = 10;
const PASSWORD_MAX_BYTES = 72;

const isObject = (body) => body && typeof body === 'object' && !Array.isArray(body);

function checkPassword(value, errors, field = 'password') {
  if (typeof value !== 'string') return errors.push(`${field} is required`);
  if (value.length < PASSWORD_MIN) return errors.push(`${field} must be at least ${PASSWORD_MIN} characters`);
  if (Buffer.byteLength(value, 'utf8') > PASSWORD_MAX_BYTES) return errors.push(`${field} must be at most ${PASSWORD_MAX_BYTES} bytes`);
  return value;
}

function validateUsername(body) {
  if (!isObject(body)) return { errors: ['Request body must be a JSON object'], data: {} };
  const value = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  if (!USERNAME.test(value)) return { errors: ['username must be 3-20 letters, numbers or underscores'], data: {} };
  return { errors: [], data: { username: value } };
}

// Where to send the browser after sign-in: a same-site path only, never another host.
function safeRedirectPath(value, fallback = '/play') {
  if (typeof value !== 'string' || value.length > 200) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return fallback;
  return value;
}

function validateLogin(body) {
  if (!isObject(body)) return { errors: ['Request body must be a JSON object'], data: {} };
  const errors = [];
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  if (!username) errors.push('username is required');
  if (typeof body.password !== 'string' || !body.password) errors.push('password is required');
  return { errors, data: { username, password: body.password } };
}

// Current password is optional: a recent GitHub/Google sign-in also proves identity.
function validatePasswordChange(body) {
  if (!isObject(body)) return { errors: ['Request body must be a JSON object'], data: {} };
  const errors = [];
  const password = checkPassword(body.password, errors);
  const current = body.currentPassword;
  if (current !== undefined && (typeof current !== 'string' || current.length > 200)) {
    errors.push('currentPassword is not valid');
  }
  return { errors, data: { password, currentPassword: typeof current === 'string' && current ? current : null } };
}

module.exports = {
  USERNAME,
  validateLogin,
  validateUsername,
  validatePasswordChange,
  safeRedirectPath,
  checkPassword,
  isObject,
};
