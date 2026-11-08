const express = require('express');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const User = require('../models/user');
const { validateLogin, validateUsername, validatePasswordChange } = require('../lib/validate');
const { createRateLimitStore } = require('../lib/rateLimitStore');
const { requireAuth, loadSessionUser } = require('../middleware/auth');
const { createOAuthRouter } = require('./oauth');

const BCRYPT_ROUNDS = 12;
// A GitHub/Google sign-in this recent can set a new password without the current one.
const RECENT_OAUTH_MS = 10 * 60 * 1000;
// Compared against when the username is unknown so login takes the same time either way.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const badRequest = (res, errors) => res.status(400).json({ success: false, message: errors.join('; '), errors });

// Brute-force guard for credential endpoints (counts shared via MongoDB).
const createAuthLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT) || 10,
    store: createRateLimitStore('auth'),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts, please try again later' },
  });

// Looser OAuth limit: two requests per sign-in, no password to guess (see docs/architecture.md#rate-limits).
const createOAuthLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.OAUTH_RATE_LIMIT) || 30,
    store: createRateLimitStore('oauth'),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      const linking = req.query.link === '1' || Boolean(req.session && req.session.oauth && req.session.oauth.linkUserId);
      const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      res.redirect(302, `${appUrl}${linking ? '/account' : '/login'}?oauth=busy`);
    },
  });

// New session id on login (no fixation); `via` records 'password' or 'oauth'.
function startSession(req, user, via) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = String(user._id);
      req.session.authAt = Date.now();
      req.session.authVia = via;
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

const recentOAuthSignIn = (session) =>
  session.authVia === 'oauth' && Date.now() - session.authAt <= RECENT_OAUTH_MS;

function createAuthRouter() {
  const router = express.Router();
  const authLimiter = createAuthLimiter();

  // Only accounts with a password can log in here; accounts come from GitHub/Google.
  router.post('/login', authLimiter, async (req, res, next) => {
    const { errors, data } = validateLogin(req.body);
    if (errors.length) return badRequest(res, errors);
    try {
      const user = await User.findOne({ username: data.username });
      const ok = await bcrypt.compare(data.password, user?.passwordHash || DUMMY_HASH);
      if (!user || !user.passwordHash || !ok) {
        return res.status(401).json({ success: false, message: 'Wrong username or password' });
      }
      await startSession(req, user, 'password');
      res.json({ success: true, data: user.toPublic() });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', (req, res, next) => {
    if (!req.session) return res.json({ success: true });
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('cc.sid', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
      res.json({ success: true });
    });
  });

  // 200 with data: null when signed out, so the frontend can call it on every load.
  router.get('/me', async (req, res, next) => {
    try {
      const user = await loadSessionUser(req);
      res.json({
        success: true,
        data: user ? { ...user.toPublic(), canSetPasswordWithoutCurrent: recentOAuthSignIn(req.session) } : null,
      });
    } catch (error) {
      next(error);
    }
  });

  router.put('/username', requireAuth, async (req, res, next) => {
    const { errors, data } = validateUsername(req.body);
    if (errors.length) return badRequest(res, errors);
    try {
      if (data.username !== req.user.username) {
        if (await User.exists({ username: data.username })) {
          return res.status(409).json({ success: false, message: 'That username is taken' });
        }
        req.user.username = data.username;
        await req.user.save();
      }
      res.json({ success: true, data: req.user.toPublic() });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ success: false, message: 'That username is taken' });
      next(error);
    }
  });

  // Needs the current password or a sign-in within 10 minutes, so a stolen session can't take over.
  router.put('/password', authLimiter, requireAuth, async (req, res, next) => {
    const { errors, data } = validatePasswordChange(req.body);
    if (errors.length) return badRequest(res, errors);
    try {
      const user = req.user;
      let proven = recentOAuthSignIn(req.session);
      if (!proven && user.passwordHash && data.currentPassword) {
        proven = await bcrypt.compare(data.currentPassword, user.passwordHash);
      }
      if (!proven) {
        const message = user.passwordHash
          ? 'Current password is wrong. Forgot it? Sign in with GitHub or Google, then set a new one.'
          : 'Sign in with GitHub or Google again, then set your password within 10 minutes.';
        return res.status(403).json({ success: false, message });
      }

      user.passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
      user.passwordChangedAt = new Date();
      await user.save();
      // Ends every other session and closes the OAuth grace window.
      req.session.authAt = user.passwordChangedAt.getTime();
      req.session.authVia = 'password';
      res.json({ success: true, message: 'Password saved', data: user.toPublic() });
    } catch (error) {
      next(error);
    }
  });

  router.use(createOAuthRouter({ oauthLimiter: createOAuthLimiter(), startSession }));

  return router;
}

module.exports = { createAuthRouter };
