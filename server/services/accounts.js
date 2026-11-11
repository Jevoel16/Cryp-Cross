const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user');
const { USERNAME } = require('../lib/validate');
const { HttpError } = require('../lib/httpError');

const BCRYPT_ROUNDS = 12;
// Compared against when the username is unknown so login takes the same time either way.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const providerField = (id) => `${id}Id`;
const usernameTaken = () => new HttpError(409, 'That username is taken');

// Only accounts with a password can log in this way; the answer never says which part was wrong.
async function verifyLogin({ username, password }) {
  const user = await User.findOne({ username });
  const matches = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !user.passwordHash || !matches) throw new HttpError(401, 'Wrong username or password');
  return user;
}

async function changeUsername(user, username) {
  if (username === user.username) return user;
  if (await User.exists({ username })) throw usernameTaken();
  user.username = username;
  try {
    await user.save();
  } catch (error) {
    // Two players can pass the check above at once; the unique index decides.
    if (error.code === 11000) throw usernameTaken();
    throw error;
  }
  return user;
}

// `recentSignIn` is true inside the 10 minute GitHub/Google window; otherwise the current password is the proof.
async function changePassword(user, { password, currentPassword }, { recentSignIn }) {
  let proven = recentSignIn;
  if (!proven && user.passwordHash && currentPassword) {
    proven = await bcrypt.compare(currentPassword, user.passwordHash);
  }
  if (!proven) {
    throw new HttpError(
      403,
      user.passwordHash
        ? 'Current password is wrong. Forgot it? Sign in with GitHub or Google, then set a new one.'
        : 'Sign in with GitHub or Google again, then set your password within 10 minutes.',
    );
  }
  user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date();
  await user.save();
  return user;
}

// "Octo Cat!" -> "octo_cat"; replaced when too short to be a valid username.
function usernameBase(hint) {
  const cleaned = String(hint || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
  return cleaned.length >= 3 ? cleaned : 'player';
}

async function uniqueUsername(hint) {
  const base = usernameBase(hint);
  if (!(await User.exists({ username: base }))) return base;
  for (let i = 0; i < 8; i++) {
    const candidate = `${base.slice(0, 15)}_${crypto.randomInt(1000, 10000)}`;
    if (USERNAME.test(candidate) && !(await User.exists({ username: candidate }))) return candidate;
  }
  return `player_${crypto.randomBytes(4).toString('hex')}`;
}

// Finds or creates the account for a provider profile. Returns { user } or { error: 'linked' }.
async function resolveOAuthAccount(provider, profile, linkUser) {
  const field = providerField(provider);
  const owner = await User.findOne({ [field]: profile.providerId });

  // Connecting from the Account page.
  if (linkUser) {
    if (owner && !owner._id.equals(linkUser._id)) return { error: 'linked' };
    linkUser[field] = profile.providerId;
    await linkUser.save();
    return { user: linkUser };
  }
  if (owner) return { user: owner };

  // Matched by provider ID only (no email); players link providers from the Account page.
  const user = new User({ username: await uniqueUsername(profile.usernameHint), [field]: profile.providerId });
  await user.save();
  return { user };
}

// Disconnects a provider, unless it is the account's only way to sign in.
async function unlinkProvider(user, provider) {
  const field = providerField(provider);
  if (!user[field]) return user;
  if (!User.canRemoveSignInMethod(user, provider)) {
    throw new HttpError(400, 'This is your only way to sign in. Set a password or connect another account first.');
  }
  user[field] = undefined;
  await user.save();
  return user;
}

module.exports = {
  BCRYPT_ROUNDS,
  verifyLogin,
  changeUsername,
  changePassword,
  resolveOAuthAccount,
  unlinkProvider,
  usernameBase,
};
