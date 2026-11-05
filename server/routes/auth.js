const express = require('express');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const User = require('../models/user');
const { createToken, hashToken, isTokenShape } = require('../lib/tokens');
const { validateSignup, validateLogin, validateEmailOnly, checkPassword, isObject } = require('../lib/validate');
const mailer = require('../lib/mailer');
const { requireAuth, loadSessionUser } = require('../middleware/auth');

const BCRYPT_ROUNDS = 12;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
// Compared against when the email is unknown so login takes the same time either way.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const badRequest = (res, errors) => res.status(400).json({ success: false, message: errors.join('; '), errors });

// Brute-force guard for credential and email-sending endpoints (one per app instance).
const createAuthLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT) || 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts, please try again later' },
  });

// Swaps the session id on login so a pre-set id can't be reused (session fixation).
function startSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = String(user._id);
      req.session.authAt = Date.now();
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

async function issueVerification(user) {
  const { token, hash } = createToken();
  user.verifyTokenHash = hash;
  user.verifyTokenExpires = new Date(Date.now() + VERIFY_TTL_MS);
  await user.save();
  await mailer.sendVerificationEmail(user.email, token);
}

function createAuthRouter() {
  const router = express.Router();
  const authLimiter = createAuthLimiter();

  router.post('/signup', authLimiter, async (req, res, next) => {
    const { errors, data } = validateSignup(req.body);
    if (errors.length) return badRequest(res, errors);
    try {
      if (await User.exists({ username: data.username })) {
        return res.status(409).json({ success: false, message: 'That username is taken' });
      }
      const existing = await User.findOne({ email: data.email });
      if (existing) {
        // Same answer as a new signup so the form can't be used to find registered emails.
        await mailer.sendAlreadyRegisteredEmail(existing.email);
        return res.status(201).json({ success: true, message: 'Check your email to verify your account' });
      }
      const user = new User({
        email: data.email,
        username: data.username,
        passwordHash: await bcrypt.hash(data.password, BCRYPT_ROUNDS),
      });
      await issueVerification(user);
      await startSession(req, user);
      res
        .status(201)
        .json({ success: true, message: 'Check your email to verify your account', data: user.toPublic() });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ success: false, message: 'That username is taken' });
      next(error);
    }
  });

  router.post('/login', authLimiter, async (req, res, next) => {
    const { errors, data } = validateLogin(req.body);
    if (errors.length) return badRequest(res, errors);
    try {
      const user = await User.findOne({ email: data.email });
      const ok = await bcrypt.compare(data.password, user ? user.passwordHash : DUMMY_HASH);
      if (!user || !ok) return res.status(401).json({ success: false, message: 'Wrong email or password' });
      await startSession(req, user);
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
      res.json({ success: true, data: user ? user.toPublic() : null });
    } catch (error) {
      next(error);
    }
  });

  router.post('/verify-email', async (req, res, next) => {
    const token = isObject(req.body) ? req.body.token : undefined;
    if (!isTokenShape(token)) return badRequest(res, ['token is not valid']);
    try {
      const user = await User.findOne({ verifyTokenHash: hashToken(token), verifyTokenExpires: { $gt: new Date() } });
      if (!user) return res.status(400).json({ success: false, message: 'This link is invalid or has expired' });
      user.emailVerified = true;
      user.verifyTokenHash = undefined;
      user.verifyTokenExpires = undefined;
      await user.save();
      res.json({ success: true, message: 'Email verified' });
    } catch (error) {
      next(error);
    }
  });

  router.post('/resend-verification', authLimiter, requireAuth, async (req, res, next) => {
    try {
      if (req.user.emailVerified) return res.json({ success: true, message: 'Email already verified' });
      await issueVerification(req.user);
      res.json({ success: true, message: 'Verification email sent' });
    } catch (error) {
      next(error);
    }
  });

  router.post('/forgot-password', authLimiter, async (req, res, next) => {
    const { errors, data } = validateEmailOnly(req.body);
    if (errors.length) return badRequest(res, errors);
    try {
      const user = await User.findOne({ email: data.email });
      if (user) {
        const { token, hash } = createToken();
        user.resetTokenHash = hash;
        user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
        await user.save();
        await mailer.sendPasswordResetEmail(user.email, token);
      }
      // Same answer whether or not the email exists.
      res.json({ success: true, message: 'If that email has an account, a reset link is on its way' });
    } catch (error) {
      next(error);
    }
  });

  router.post('/reset-password', authLimiter, async (req, res, next) => {
    const body = isObject(req.body) ? req.body : {};
    const errors = [];
    if (!isTokenShape(body.token)) errors.push('token is not valid');
    const password = checkPassword(body.password, errors);
    if (errors.length) return badRequest(res, errors);
    try {
      const user = await User.findOne({
        resetTokenHash: hashToken(body.token),
        resetTokenExpires: { $gt: new Date() },
      });
      if (!user) return res.status(400).json({ success: false, message: 'This link is invalid or has expired' });
      user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      user.resetTokenHash = undefined;
      user.resetTokenExpires = undefined;
      // Reaching the inbox proves ownership of the email.
      user.emailVerified = true;
      user.passwordChangedAt = new Date();
      await user.save();
      res.json({ success: true, message: 'Password updated. You can log in now.' });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createAuthRouter };
