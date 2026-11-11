const express = require('express');
const { rateLimit } = require('express-rate-limit');
const accounts = require('../services/accounts');
const { validateLogin, validateUsername, validatePasswordChange } = require('../lib/validate');
const { createRateLimitStore } = require('../lib/rateLimitStore');
const { requireAuth, loadSessionUser } = require('../middleware/auth');
const { createOAuthRouter } = require('./oauth');
const { AUTH_VIA, canSetPasswordWithoutCurrent, signIn } = require('../lib/sessionAuth');
const { badRequest, handle, ok } = require('../lib/httpError');

// Returns the cleaned data, or throws a 400 listing every problem.
function valid({ errors, data }) {
  if (errors.length) throw badRequest(errors.join('; '), { errors });
  return data;
}

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
      const linking =
        req.query.link === '1' || Boolean(req.session && req.session.oauth && req.session.oauth.linkUserId);
      const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      res.redirect(302, `${appUrl}${linking ? '/account' : '/login'}?oauth=busy`);
    },
  });

// New session id on login (no fixation); `via` is an AUTH_VIA value.
function startSession(req, user, via) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      signIn(req.session, user._id, via);
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

function createAuthRouter() {
  const router = express.Router();
  const authLimiter = createAuthLimiter();

  router.post(
    '/login',
    authLimiter,
    handle(async (req, res) => {
      const user = await accounts.verifyLogin(valid(validateLogin(req.body)));
      await startSession(req, user, AUTH_VIA.PASSWORD);
      ok(res, user.toPublic());
    }),
  );

  router.post('/logout', (req, res, next) => {
    if (!req.session) return res.json({ success: true });
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('cc.sid', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
      res.json({ success: true });
    });
  });

  // 200 with data: null when signed out, so the frontend can call it on every load.
  router.get(
    '/me',
    handle(async (req, res) => {
      const user = await loadSessionUser(req);
      ok(
        res,
        user ? { ...user.toPublic(), canSetPasswordWithoutCurrent: canSetPasswordWithoutCurrent(req.session) } : null,
      );
    }),
  );

  router.put(
    '/username',
    requireAuth,
    handle(async (req, res) => {
      const { username } = valid(validateUsername(req.body));
      ok(res, (await accounts.changeUsername(req.user, username)).toPublic());
    }),
  );

  // Needs the current password or a sign-in within 10 minutes, so a stolen session can't take over.
  router.put(
    '/password',
    authLimiter,
    requireAuth,
    handle(async (req, res) => {
      const data = valid(validatePasswordChange(req.body));
      const recentSignIn = canSetPasswordWithoutCurrent(req.session);
      const user = await accounts.changePassword(req.user, data, { recentSignIn });
      // Ends every other session and closes the OAuth grace window.
      signIn(req.session, user._id, AUTH_VIA.PASSWORD, user.passwordChangedAt.getTime());
      ok(res, user.toPublic(), 'Password saved');
    }),
  );

  router.use(createOAuthRouter({ oauthLimiter: createOAuthLimiter(), startSession }));

  return router;
}

module.exports = { createAuthRouter };
