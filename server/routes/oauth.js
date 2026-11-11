// Sign in with GitHub or Google (mounted inside the auth router at /api/auth).
const express = require('express');
const crypto = require('crypto');
const User = require('../models/user');
const oauth = require('../lib/oauth');
const { USERNAME, safeRedirectPath } = require('../lib/validate');
const { AUTH_VIA } = require('../lib/sessionAuth');
const { requireAuth, loadSessionUser } = require('../middleware/auth');

const ATTEMPT_TTL_MS = 10 * 60 * 1000;

// Errors go back to the login page as a fixed code; nothing from the provider is echoed.
const ERROR_CODES = new Set(['denied', 'state', 'failed', 'linked']);

const appUrl = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

const providerField = (id) => `${id}Id`;

// "Octo Cat!" -> "octo_cat"; padded or replaced when too short to be a valid username.
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

// Finds or creates the account for a provider profile. Returns { user } or { error }.
async function resolveAccount(provider, profile, linkUser) {
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
  const user = new User({
    username: await uniqueUsername(profile.usernameHint),
    [field]: profile.providerId,
  });
  await user.save();
  return { user };
}

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

      const { user, error } = await resolveAccount(provider, profile, linkUser);
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

  // Disconnects a provider, unless it is the account's only way to sign in.
  router.post('/oauth/:provider/unlink', requireAuth, async (req, res, next) => {
    const { provider } = req.params;
    if (!oauth.isKnownProvider(provider)) return res.status(404).json({ success: false, message: 'Not found' });
    try {
      const user = req.user;
      const field = providerField(provider);
      if (user[field]) {
        if (!User.canRemoveSignInMethod(user, provider)) {
          return res.status(400).json({
            success: false,
            message: 'This is your only way to sign in. Set a password or connect another account first.',
          });
        }
        user[field] = undefined;
        await user.save();
      }
      res.json({ success: true, data: user.toPublic() });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createOAuthRouter, usernameBase };
