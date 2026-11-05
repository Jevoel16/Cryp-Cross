const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const puzzleRoutes = require('./routes/puzzles');
const { createAuthRouter } = require('./routes/auth');
const { router: playRoutes } = require('./routes/play');
const { createSessionMiddleware } = require('./lib/session');
const { createRateLimitStore } = require('./lib/rateLimitStore');

// Comma-separated allow-list; dev falls back to the Vite dev server only.
function allowedOrigins() {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (fromEnv.length) return fromEnv;
  return process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000'];
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// CSRF guard for cookie-authenticated writes: the browser always sends Origin on
// cross-site POSTs, so a foreign Origin is refused. Requiring a JSON body also blocks
// plain HTML form posts, which can't send application/json without a CORS preflight.
function csrfGuard(origins) {
  return (req, res, next) => {
    if (!UNSAFE_METHODS.has(req.method)) return next();
    const origin = req.get('origin');
    if (origin && !origins.includes(origin)) {
      return res.status(403).json({ success: false, message: 'Origin not allowed' });
    }
    if (!req.is('application/json')) {
      return res.status(415).json({ success: false, message: 'Send a JSON body (Content-Type: application/json)' });
    }
    next();
  };
}

function createApp() {
  const app = express();

  // Behind Vercel/Render/Railway set TRUST_PROXY=1 so rate limiting sees real client IPs.
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);
  app.disable('x-powered-by');

  app.use(helmet());

  const origins = allowedOrigins();
  app.use(
    cors({
      // Requests without an Origin header (curl, server-to-server) are allowed.
      origin: (origin, cb) => cb(null, !origin || origins.includes(origin)),
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    })
  );

  app.use('/api', csrfGuard(origins));
  app.use(express.json({ limit: '10kb' }));

  const limiterOptions = {
    windowMs: 15 * 60 * 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' },
  };
  const apiLimiter = rateLimit({ ...limiterOptions, limit: 300, store: createRateLimitStore('api') });
  // Stricter cap on writes.
  const writeLimiter = rateLimit({
    ...limiterOptions,
    limit: 60,
    skip: (req) => req.method === 'GET',
    store: createRateLimitStore('write'),
  });
  app.use('/api', apiLimiter, writeLimiter);

  app.use('/api', createSessionMiddleware());
  app.use('/api/auth', createAuthRouter());
  // Progress, check, submit, leaderboard and stats.
  app.use('/api', playRoutes);
  app.use('/api/puzzles', puzzleRoutes);

  app.get('/', (req, res) => {
    res.json({ message: 'Cryp-Cross API' });
  });

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
  });

  // Central error handler: never leak internal messages or stack traces to clients.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ success: false, message: 'Invalid JSON body' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ success: false, message: 'Request body too large' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }
    console.error(`${req.method} ${req.path} failed:`, err.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  });

  return app;
}

module.exports = { createApp, allowedOrigins };
