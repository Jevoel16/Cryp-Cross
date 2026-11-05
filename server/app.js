const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const ProjectLog = require('./models/projectLog');

const STATUSES = ProjectLog.schema.path('status').enumValues;
const LIMITS = { title: 200, description: 2000 };
const OBJECT_ID = /^[a-f\d]{24}$/i;

// Comma-separated allow-list; dev falls back to the CRA dev server only.
function allowedOrigins() {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (fromEnv.length) return fromEnv;
  return process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000'];
}

// Validates title/description/status. `partial` allows omitted fields (PATCH).
function validateProject(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'], data };
  }

  for (const field of ['title', 'description']) {
    const value = body[field];
    if (value === undefined) {
      if (!partial) errors.push(`${field} is required`);
      continue;
    }
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`${field} must be a non-empty string`);
    } else if (value.trim().length > LIMITS[field]) {
      errors.push(`${field} must be at most ${LIMITS[field]} characters`);
    } else {
      data[field] = value.trim();
    }
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      errors.push(`status must be one of: ${STATUSES.join(', ')}`);
    } else {
      data.status = body.status;
    }
  }

  if (partial && !errors.length && !Object.keys(data).length) {
    errors.push('At least one field (title, description, or status) is required for update');
  }

  return { errors, data };
}

const badRequest = (res, errors) =>
  res.status(400).json({ success: false, message: errors.join('; '), errors });

const requireValidId = (req, res, next) =>
  OBJECT_ID.test(req.params.id)
    ? next()
    : res.status(400).json({ success: false, message: 'Invalid project id' });

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
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
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
  // Stricter cap on writes (POST/PATCH/DELETE).
  const writeLimiter = rateLimit({ ...limiterOptions, limit: 60, skip: (req) => req.method === 'GET' });
  app.use('/api', apiLimiter, writeLimiter);

  // READ - GET /api/projects
  app.get('/api/projects', async (req, res, next) => {
    try {
      const projects = await ProjectLog.find().sort({ createdAt: -1 });
      res.json({ success: true, count: projects.length, data: projects });
    } catch (error) {
      next(error);
    }
  });

  // CREATE - POST /api/projects
  app.post('/api/projects', async (req, res, next) => {
    const { errors, data } = validateProject(req.body);
    if (errors.length) return badRequest(res, errors);

    try {
      // Omitted status falls back to the schema default ('Pending').
      const savedProject = await new ProjectLog(data).save();
      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: savedProject,
      });
    } catch (error) {
      next(error);
    }
  });

  // UPDATE - PATCH /api/projects/:id
  app.patch('/api/projects/:id', requireValidId, async (req, res, next) => {
    const { errors, data } = validateProject(req.body, { partial: true });
    if (errors.length) return badRequest(res, errors);

    try {
      const updatedProject = await ProjectLog.findByIdAndUpdate(req.params.id, data, {
        new: true,
        runValidators: true,
      });
      if (!updatedProject) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      res.json({ success: true, message: 'Project updated successfully', data: updatedProject });
    } catch (error) {
      next(error);
    }
  });

  // DELETE - DELETE /api/projects/:id
  app.delete('/api/projects/:id', requireValidId, async (req, res, next) => {
    try {
      const deletedProject = await ProjectLog.findByIdAndDelete(req.params.id);
      if (!deletedProject) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to MERN Backend API',
      endpoints: {
        get: '/api/projects',
        post: '/api/projects',
        patch: '/api/projects/:id',
        delete: '/api/projects/:id',
      },
    });
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
      return res.status(400).json({ success: false, message: 'Invalid project data' });
    }
    console.error(`${req.method} ${req.path} failed:`, err.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  });

  return app;
}

module.exports = { createApp, validateProject, allowedOrigins };
