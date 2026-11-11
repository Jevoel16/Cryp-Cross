// Sign in with GitHub or Google (mounted inside the auth router at /api/auth).
const express = require('express');
const accounts = require('../services/accounts');
const oauth = require('../lib/oauth');
const { safeRedirectPath } = require('../lib/validate');
const { HttpError, handle, ok } = require('../lib/httpError');
const { AUTH_VIA } = require('../lib/sessionAuth');
const { requireAuth, loadSessionUser } = require('../middleware/auth');

const ATTEMPT_TTL_MS = 10 * 60 * 1000;

// Errors go back to the login page as a fixed code; nothing from the provider is echoed.
const ERROR_CODES = new Set(['denied', 'state', 'failed', 'linked']);

const appUrl = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

function createOAuthRouter({ oauthLimiter, startSession }) {
  const router = express.Router();

  // Lets the frontend show only the buttons that will work.
  router.get('/providers', (req, res) => {
    res.json({ success: true, data: oauth.enabledProviders() });
  });

  router.get('/oauth/:provider', oauthLimiter, async (req, res, next) => {
    const { provider } = req.params;
    if (!oauth.isEnabled(provider)) return res.status(404).json({ success: false, message: 'Not found' });

    // Restart sign-in on the callback's host so the state cookie matches (see docs/architecture.md#oauth-host).
    if (process.env.NODE_ENV === 'production') {
      const target = new URL(oauth.callbackUrl(provider)).origin;
      if (`${req.protocol}://${req.get('host')}` !== target) {
        return res.redirect(302, `${target}${req.originalUrl}`);
      }
    }

    try {
      const link = req.query.link === '1';
      const linkUser = link ? await loadSessionUser(req) : null;
      if (link && !linkUser) return res.redirect(302, `${appUrl()}/login?oauth=failed`);

      const attempt = oauth.createAttempt();
      req.session.oauth = {
        provider,
        state: attempt.state,
        verifier: attempt.verifier,
        from: safeRedirectPath(req.query.from, link ? '/account' : '/play'),
        linkUserId: linkUser ? String(linkUser._id) : null,
        at: Date.now(),
      };
      req.session.save((err) => {
        if (err) return next(err);
        res.redirect(302, oauth.authorizeUrl(provider, attempt));
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/oauth/:provider/callback', oauthLimiter, async (req, res) => {
    const { provider } = req.params;
    const pending = req.session.oauth;
    delete req.session.oauth;

    const fail = (code) => {
      const safe = ERROR_CODES.has(code) ? code : 'failed';
      const target = pending && pending.linkUserId ? '/account' : '/login';
      res.redirect(302, `${appUrl()}${target}?oauth=${safe}`);
    };

    if (!oauth.isEnabled(provider)) return res.status(404).json({ success: false, message: 'Not found' });
    if (
      !pending ||
      pending.provider !== provider ||
      Date.now() - pending.at > ATTEMPT_TTL_MS ||
      !oauth.safeEqual(req.query.state, pending.state)
    ) {
      return fail('state');
    }
    if (req.query.error) return fail('denied');
    if (typeof req.query.code !== 'string' || !req.query.code || req.query.code.length > 2048) return fail('failed');

    try {
      const accessToken = await oauth.exchangeCode(provider, req.query.code, pending.verifier);
      const profile = await oauth.fetchProfile(provider, accessToken);

      let linkUser = null;
      if (pending.linkUserId) {
        linkUser = await loadSessionUser(req);
        if (!linkUser || String(linkUser._id) !== pending.linkUserId) return fail('failed');
      }

      const { user, error } = await accounts.resolveOAuthAccount(provider, profile, linkUser);
      if (error) return fail(error);

      if (linkUser) {
        await new Promise((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
        return res.redirect(
          302,
          `${appUrl()}${pending.from}${pending.from.includes('?') ? '&' : '?'}linked=${provider}`,
        );
      }
      await startSession(req, user, AUTH_VIA.OAUTH);
      res.redirect(302, `${appUrl()}${pending.from}`);
    } catch (error) {
      // Only the message: tokens and profile data never reach the logs.
      console.error(`OAuth ${provider} sign-in failed:`, error.message);
      fail('failed');
    }
  });

  router.post(
    '/oauth/:provider/unlink',
    requireAuth,
    handle(async (req, res) => {
      const { provider } = req.params;
      if (!oauth.isKnownProvider(provider)) throw new HttpError(404, 'Not found');
      ok(res, (await accounts.unlinkProvider(req.user, provider)).toPublic());
    }),
  );

  return router;
}

module.exports = { createOAuthRouter };
