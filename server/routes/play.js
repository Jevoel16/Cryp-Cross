const express = require('express');
const attempts = require('../services/attempts');
const { requireAuth } = require('../middleware/auth');
const { handle, ok } = require('../lib/httpError');

const router = express.Router();

router.get(
  '/puzzles/today/progress',
  requireAuth,
  handle(async (req, res) => ok(res, await attempts.openAttempt(req.user))),
);

router.put(
  '/puzzles/today/progress',
  requireAuth,
  handle(async (req, res) => ok(res, await attempts.saveProgress(req.user, req.body))),
);

router.post(
  '/puzzles/today/check',
  requireAuth,
  handle(async (req, res) => ok(res, await attempts.checkGrid(req.user, req.body))),
);

router.post(
  '/puzzles/today/guest-check',
  handle(async (req, res) => ok(res, await attempts.guestCheck(req.body))),
);

router.post(
  '/puzzles/today/submit',
  requireAuth,
  handle(async (req, res) => ok(res, await attempts.submitGrid(req.user, req.body))),
);

router.get(
  '/leaderboard',
  handle(async (req, res) => ok(res, await attempts.leaderboard(req.query.date))),
);

router.get(
  '/me/stats',
  requireAuth,
  handle(async (req, res) => ok(res, await attempts.stats(req.user))),
);

module.exports = { router };
