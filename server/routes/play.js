const express = require('express');
const Attempt = require('../models/attempt');
const { getTodayPuzzle } = require('../puzzle/service');
const { dayKey, isValidDayKey, previousDayKey } = require('../puzzle/dayKey');
const { requireAuth, requireVerified } = require('../middleware/auth');
const { isObject } = require('../lib/validate');

const LEADERBOARD_SIZE = 50;
const HISTORY_SIZE = 30;

// The grid a player sends must match today's layout exactly: same size, blocks in the
// same places, and only A-Z or blanks in open cells.
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

// Creates the attempt (and starts the timer) the first time a player opens today's puzzle.
async function findOrStartAttempt(user, date) {
  return Attempt.findOneAndUpdate(
    { user: user._id, date },
    { $setOnInsert: { user: user._id, date, startedAt: new Date(), grid: [] } },
    { upsert: true, new: true }
  );
}

const badRequest = (res, message) => res.status(400).json({ success: false, message });

const router = express.Router();
const player = [requireAuth, requireVerified];

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
    const attempt = await findOrStartAttempt(req.user, puzzle.date);
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
    const attempt = await findOrStartAttempt(req.user, puzzle.date);
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

router.post('/puzzles/today/submit', player, async (req, res, next) => {
  try {
    const puzzle = await getTodayPuzzle();
    const problem = validateGrid(req.body, puzzle);
    if (problem) return badRequest(res, problem);
    const attempt = await findOrStartAttempt(req.user, puzzle.date);
    if (attempt.solvedAt) {
      return res.status(409).json({ success: false, message: 'You already solved today\'s puzzle' });
    }

    const status = entryStatus(puzzle, req.body.grid);
    attempt.grid = req.body.grid;
    if (status.some((s) => s !== 'right')) {
      await attempt.save();
      return res.json({
        success: true,
        data: { solved: false, wrong: status.filter((s) => s === 'wrong').length, incomplete: status.filter((s) => s === 'incomplete').length },
      });
    }

    attempt.solvedAt = new Date();
    attempt.timeMs = attempt.solvedAt - attempt.startedAt;
    await attempt.save();
    const faster = await Attempt.countDocuments({ date: puzzle.date, timeMs: { $lt: attempt.timeMs } });
    res.json({ success: true, data: { solved: true, timeMs: attempt.timeMs, rank: faster + 1 } });
  } catch (error) {
    next(error);
  }
});

// Fastest verified solves for a day (default today). Only usernames and times are public.
router.get('/leaderboard', async (req, res, next) => {
  const date = req.query.date === undefined ? dayKey() : req.query.date;
  if (!isValidDayKey(date)) return badRequest(res, 'date must be YYYY-MM-DD');
  try {
    const filter = { date, solvedAt: { $exists: true } };
    const [rows, solvers] = await Promise.all([
      Attempt.find(filter)
        .sort({ timeMs: 1, solvedAt: 1 })
        .limit(LEADERBOARD_SIZE)
        .populate('user', 'username')
        .lean(),
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

// Streaks count consecutive puzzle days. Today's missing solve doesn't break the
// current streak until the day is over.
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
      dayKey()
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

module.exports = { router, streaks, validateGrid };
