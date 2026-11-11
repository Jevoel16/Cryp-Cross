const Attempt = require('../models/attempt');
const { getTodayPuzzle } = require('../puzzle/service');
const { dayKey, isValidDayKey, previousDayKey } = require('../puzzle/dayKey');
const { isObject } = require('../lib/validate');
const { HttpError, badRequest } = require('../lib/httpError');
const {
  ATTEMPT_STATUS,
  ATTEMPT_EVENT,
  attemptStatus,
  nextAttemptStatus,
  whileStarted,
} = require('../lib/attemptStatus');

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

const countOf = (entries, status) => entries.filter((s) => s === status).length;

const publicAttempt = (a) => ({
  date: a.date,
  grid: a.grid,
  startedAt: a.startedAt,
  solvedAt: a.solvedAt || null,
  timeMs: a.timeMs ?? null,
});

const notStarted = () => new HttpError(409, "Open today's puzzle first to start your timer");
const alreadySolved = () => new HttpError(409, "You already solved today's puzzle");

// Today's puzzle plus the validated grid from the request body.
async function todayGrid(body) {
  const puzzle = await getTodayPuzzle();
  const problem = validateGrid(body, puzzle);
  if (problem) throw badRequest(problem);
  return { puzzle, grid: body.grid };
}

// Only this starts the timer (see docs/architecture.md#solve-timer).
async function openAttempt(user) {
  const puzzle = await getTodayPuzzle();
  const attempt = await Attempt.findOneAndUpdate(
    { user: user._id, date: puzzle.date },
    { $setOnInsert: { user: user._id, date: puzzle.date, startedAt: new Date(), grid: [] } },
    { upsert: true, new: true },
  );
  return publicAttempt(attempt);
}

// A solved grid is final, so the update only matches unsolved attempts.
async function writeWhileStarted(user, date, event, update) {
  const filter = { user: user._id, date };
  const attempt =
    (await Attempt.findOneAndUpdate(whileStarted(filter), update, { new: true })) || (await Attempt.findOne(filter));
  if (!nextAttemptStatus(attemptStatus(attempt), event)) throw notStarted();
  return attempt;
}

async function saveProgress(user, body) {
  const { puzzle, grid } = await todayGrid(body);
  return publicAttempt(await writeWhileStarted(user, puzzle.date, ATTEMPT_EVENT.SAVE, { $set: { grid } }));
}

// Says which entries are right, wrong or incomplete, without revealing answers.
async function checkGrid(user, body) {
  const { puzzle, grid } = await todayGrid(body);
  await writeWhileStarted(user, puzzle.date, ATTEMPT_EVENT.CHECK, { $set: { grid }, $inc: { checks: 1 } });
  return { entries: entryStatus(puzzle, grid) };
}

// Guests can check and finish, but nothing is stored or ranked.
async function guestCheck(body) {
  const { puzzle, grid } = await todayGrid(body);
  const entries = entryStatus(puzzle, grid);
  return { entries, solved: entries.every((s) => s === 'right') };
}

async function submitGrid(user, body) {
  const { puzzle, grid } = await todayGrid(body);
  const filter = { user: user._id, date: puzzle.date };
  const attempt = await Attempt.findOne(filter);
  const status = attemptStatus(attempt);
  if (status === ATTEMPT_STATUS.NOT_STARTED) throw notStarted();
  if (!nextAttemptStatus(status, ATTEMPT_EVENT.SOLVE)) throw alreadySolved();

  const entries = entryStatus(puzzle, grid);
  if (entries.some((s) => s !== 'right')) {
    await Attempt.updateOne(whileStarted(filter), { $set: { grid } });
    return { solved: false, wrong: countOf(entries, 'wrong'), incomplete: countOf(entries, 'incomplete') };
  }

  const solvedAt = new Date();
  const timeMs = solvedAt - attempt.startedAt;
  if (timeMs < minSolveMs()) {
    await Attempt.updateOne(whileStarted(filter), { $set: { grid } });
    throw badRequest('That solve was too fast to record. Submit again in a few seconds.');
  }
  // Only the first of two simultaneous submits matches; the other gets 409.
  const solved = await Attempt.findOneAndUpdate(
    whileStarted(filter),
    { $set: { grid, solvedAt, timeMs } },
    { new: true },
  );
  if (!solved) throw alreadySolved();
  const faster = await Attempt.countDocuments({ date: puzzle.date, timeMs: { $lt: timeMs } });
  return { solved: true, timeMs, rank: faster + 1 };
}

// Fastest solves for a day (default today). Only usernames and times are public.
async function leaderboard(requestedDate) {
  const date = requestedDate === undefined ? dayKey() : requestedDate;
  if (!isValidDayKey(date)) throw badRequest('date must be YYYY-MM-DD');
  const filter = { date, solvedAt: { $exists: true } };
  const [rows, solvers] = await Promise.all([
    Attempt.find(filter).sort({ timeMs: 1, solvedAt: 1 }).limit(LEADERBOARD_SIZE).populate('user', 'username').lean(),
    Attempt.countDocuments(filter),
  ]);
  return {
    date,
    solvers,
    entries: rows.filter((r) => r.user).map((r, i) => ({ rank: i + 1, username: r.user.username, timeMs: r.timeMs })),
  };
}

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

async function stats(user) {
  const solved = await Attempt.find({ user: user._id, solvedAt: { $exists: true } })
    .sort({ date: -1 })
    .select('date timeMs -_id')
    .lean();
  const { current, best } = streaks(
    solved.map((s) => s.date),
    dayKey(),
  );
  return {
    solves: solved.length,
    currentStreak: current,
    bestStreak: best,
    bestTimeMs: solved.length ? Math.min(...solved.map((s) => s.timeMs)) : null,
    history: solved.slice(0, HISTORY_SIZE),
  };
}

module.exports = {
  openAttempt,
  saveProgress,
  checkGrid,
  guestCheck,
  submitGrid,
  leaderboard,
  stats,
  streaks,
  validateGrid,
  minSolveMs,
};
