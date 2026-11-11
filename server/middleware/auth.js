const User = require('../models/user');
const { signOut } = require('../lib/sessionAuth');

// Signed-in user or null; sessions older than the last password change don't count.
async function loadSessionUser(req) {
  const userId = req.session && req.session.userId;
  if (!userId) return null;
  const user = await User.findById(userId);
  const stale = user && user.passwordChangedAt && !(req.session.authAt >= user.passwordChangedAt.getTime());
  if (!user || stale) {
    signOut(req.session);
    return null;
  }
  return user;
}

async function requireAuth(req, res, next) {
  try {
    const user = await loadSessionUser(req);
    if (!user) return res.status(401).json({ success: false, message: 'Please log in' });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { loadSessionUser, requireAuth };
