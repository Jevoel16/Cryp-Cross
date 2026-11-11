const express = require('express');
const Attempt = require('../models/attempt');
const { getTodayPuzzle } = require('../puzzle/service');
const { dayKey, isValidDayKey, previousDayKey } = require('../puzzle/dayKey');
const { requireAuth } = require('../middleware/auth');
const { isObject } = require('../lib/validate');

const LEADERBOARD_SIZE = 50;
const HISTORY_SIZE = 30;
const DEFAULT_MIN_SOLVE_SECONDS = 30;

// Solves faster than this must have been prepared before the timer started.
function minSolveMs() {
  const seconds = Number(process.env.MIN_SOLVE_SECONDS);
  return (Number.isFinite(seconds) && seconds >= 0 ? seconds : DEFAULT_MIN_SOLVE_SECONDS) * 1000;
}

// The grid must match today's layout: same size, same blocks, only A-Z or blanks.
function validateGrid(body, puzzle) {
  if (!isObject(body)) return 'Request body must be a JSON object';
  if (body.date !== puzzle.date) return 'This puzzle has ended. Reload to get the new one.';
  const { grid } = body;
  if (!Array.isArray(grid) || grid.length !== puzzle.height) return 'grid has the wrong number of rows';
  for (let r = 0; r < puzzle.height; r++) {
    const row = grid[r];
    if (typeof row !== 'string' || row.length !== puzzle.width) return `grid row ${r + 1} has the wrong length`;
    for (let c = 0; c < puzzle.width; c++) {
      const isBlock = puzzle.solution[r][c] === '#';
      if (isBlock ? row[c] !== '#' : !/[A-Z ]/.test(row[c])) return `grid cell ${r + 1},${c + 1} is not valid`;
    }
  }
  return null;
}

function entryStatus(puzzle, grid) {
  return puzzle.entries.map((e) => {
    const [dr, dc] = e.direction === 'across' ? [0, 1] : [1, 0];
    let typed = '';
    for (let i = 0; i < e.length; i++) typed += grid[e.row + dr * i][e.col + dc * i];
    if (typed.includes(' ')) return 'incomplete';
    return typed === e.answer ? 'right' : 'wrong';
  });
}

const publicAttempt = (a) => ({
  date: a.date,
  grid: a.grid,
  startedAt: a.startedAt,
  solvedAt: a.solvedAt || null,
  timeMs: a.timeMs ?? null,
});

// Only GET /progress starts the timer (see docs/architecture.md#solve-timer).
async function findOrStartAttempt(user, date) {
  return Attempt.findOneAndUpdate(
    { user: user._id, date },
    { $setOnInsert: { user: user._id, date, startedAt: new Date(), grid: [] } },
    { upsert: true, new: true },
  );
}

const badRequest = (res, message) => res.status(400).json({ success: false, message });

const notStarted = (res) =>
  res.status(409).json({ success: false, message: "Open today's puzzle first to start your timer" });

const router = express.Router();
// Every account comes from a GitHub/Google sign-in, so any signed-in player can play ranked.
const player = [requireAuth];

router.get('/puzzles/today/progress', player, async (req, res, next) => {
  try {
    const puzzle = await getTodayPuzzle();
    const attempt = await findOrStartAttempt(req.user, puzzle.date);
    res.json({ success: true, data: publicAttempt(attempt) });
  } catch (error) {
    next(error);
  }
});

router.put('/puzzles/today/progress', player, async (req, res, next) => {
  try {
    const puzzle = await getTodayPuzzle();
    const problem = validateGrid(req.body, puzzle);
    if (problem) return badRequest(res, problem);
    const attempt = await Attempt.findOne({ user: req.user._id, date: puzzle.date });
    if (!attempt) return notStarted(res);
    // A solved grid is final.
    if (!attempt.solvedAt) {
      attempt.grid = req.body.grid;
      await attempt.save();
    }
    res.json({ success: true, data: publicAttempt(attempt) });
  } catch (error) {
    next(error);
  }
});

// Says which entries are right, wrong or incomplete, without revealing answers.
router.post('/puzzles/today/check', player, async (req, res, next) => {
  try {
    const puzzle = await getTodayPuzzle();
    const problem = validateGrid(req.body, puzzle);
    if (problem) return badRequest(res, problem);
    const attempt = await Attempt.findOne({ user: req.user._id, date: puzzle.date });
    if (!attempt) return notStarted(res);
    if (!attempt.solvedAt) {
      attempt.grid = req.body.grid;
      attempt.checks += 1;
      await attempt.save();
    }
    res.json({ success: true, data: { entries: entryStatus(puzzle, req.body.grid) } });
  } catch (error) {
    next(error);
  }
});

// Guests can check and finish, but nothing is stored or ranked.
router.post('/puzzles/today/guest-check', async (req, res, next) => {
  try {
    const puzzle = await getTodayPuzzle();
    const problem = validateGrid(req.body, puzzle);
    if (problem) return badRequest(res, problem);
    const entries = entryStatus(puzzle, req.body.grid);
    res.json({ success: true, data: { entries, solved: entries.every((s) => s === 'right') } });
  } catch (error) {
    next(error);
  }
});

router.post('/puzzles/today/submit', player, async (req, res, next) => {
  try {
    const puzzle = await getTodayPuzzle();
    const problem = validateGrid(req.body, puzzle);
    if (problem) return badRequest(res, problem);
    const attempt = await Attempt.findOne({ user: req.user._id, date: puzzle.date });
    if (!attempt) return notStarted(res);
    if (attempt.solvedAt) {
      return res.status(409).json({ success: false, message: "You already solved today's puzzle" });
    }

    const status = entryStatus(puzzle, req.body.grid);
    attempt.grid = req.body.grid;
    if (status.some((s) => s !== 'right')) {
      await attempt.save();
      return res.json({
        success: true,
        data: {
          solved: false,
          wrong: status.filter((s) => s === 'wrong').length,
          incomplete: status.filter((s) => s === 'incomplete').length,
        },
      });
    }

    const solvedAt = new Date();
    if (solvedAt - attempt.startedAt < minSolveMs()) {
      await attempt.save();
      return badRequest(res, 'That solve was too fast to record. Submit again in a few seconds.');
    }
    attempt.solvedAt = solvedAt;
    attempt.timeMs = solvedAt - attempt.startedAt;
    await attempt.save();
    const faster = await Attempt.countDocuments({ date: puzzle.date, timeMs: { $lt: attempt.timeMs } });
    res.json({ success: true, data: { solved: true, timeMs: attempt.timeMs, rank: faster + 1 } });
  } catch (error) {
    next(error);
  }
});

// Fastest solves by signed-in players for a day (default today). Only usernames and times are public.
router.get('/leaderboard', async (req, res, next) => {
  const date = req.query.date === undefined ? dayKey() : req.query.date;
  if (!isValidDayKey(date)) return badRequest(res, 'date must be YYYY-MM-DD');
  try {
    const filter = { date, solvedAt: { $exists: true } };
    const [rows, solvers] = await Promise.all([
      Attempt.find(filter).sort({ timeMs: 1, solvedAt: 1 }).limit(LEADERBOARD_SIZE).populate('user', 'username').lean(),
      Attempt.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: {
        date,
        solvers,
        entries: rows
          .filter((r) => r.user)
          .map((r, i) => ({ rank: i + 1, username: r.user.username, timeMs: r.timeMs })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Streaks count consecutive days; today's missing solve breaks it only once the day ends.
function streaks(solvedDates, today) {
  const set = new Set(solvedDates);
  let current = 0;
  let day = set.has(today) ? today : previousDayKey(today);
  while (set.has(day)) {
    current += 1;
    day = previousDayKey(day);
  }
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of [...set].sort()) {
    run = prev && previousDayKey(d) === prev ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best };
}

router.get('/me/stats', requireAuth, async (req, res, next) => {
  try {
    const solved = await Attempt.find({ user: req.user._id, solvedAt: { $exists: true } })
      .sort({ date: -1 })
      .select('date timeMs -_id')
      .lean();
    const { current, best } = streaks(
      solved.map((s) => s.date),
      dayKey(),
    );
    res.json({
      success: true,
      data: {
        solves: solved.length,
        currentStreak: current,
        bestStreak: best,
        bestTimeMs: solved.length ? Math.min(...solved.map((s) => s.timeMs)) : null,
        history: solved.slice(0, HISTORY_SIZE),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = { router, streaks, validateGrid, minSolveMs };
