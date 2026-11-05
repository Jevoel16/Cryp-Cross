const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

// Comma-separated allow-list; dev falls back to the Vite dev server only.
function allowedOrigins() {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (fromEnv.length) return fromEnv;
  return process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000'];
}

function createApp() {
  const app = express();

  // Behind Render/Railway set TRUST_PROXY=1 so rate limiting sees real client IPs.
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

  app.use(express.json({ limit: '10kb' }));

  const limiterOptions = {
    windowMs: 15 * 60 * 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' },
  };
  const apiLimiter = rateLimit({ ...limiterOptions, limit: 300 });
  // Stricter cap on writes.
  const writeLimiter = rateLimit({ ...limiterOptions, limit: 60, skip: (req) => req.method === 'GET' });
  app.use('/api', apiLimiter, writeLimiter);

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
