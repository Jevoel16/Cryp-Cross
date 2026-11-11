const DailyPuzzle = require('../models/dailyPuzzle');
const { generatePuzzle } = require('./generate');
const { loadWords } = require('./words');
const { dayKey, isValidDayKey } = require('./dayKey');
const { HttpError, badRequest } = require('../lib/httpError');

const ARCHIVE_LIMIT = 60;

let words;
const wordList = () => (words ||= loadWords());

// Deterministic generation: a race stores the same puzzle and the loser reads the winner's copy.
async function getOrCreatePuzzle(date) {
  const existing = await DailyPuzzle.findOne({ date }).lean();
  if (existing) return existing;
  try {
    const created = await DailyPuzzle.create(generatePuzzle(date, wordList(), { secret: process.env.PUZZLE_SECRET }));
    return created.toObject();
  } catch (error) {
    if (error.code === 11000) return DailyPuzzle.findOne({ date }).lean();
    throw error;
  }
}

const getTodayPuzzle = () => getOrCreatePuzzle(dayKey());

// Player view: answers, plain clues and keys stay hidden unless `reveal` (past days).
function toPublicPuzzle(puzzle, { reveal = false } = {}) {
  const { cipher } = puzzle;
  const publicCipher = { type: cipher.type };
  if (cipher.type === 'vigenere') {
    publicCipher.keyClue = cipher.keyClue;
    publicCipher.keyLength = cipher.key.length;
  }
  if (reveal) {
    if (cipher.type === 'caesar') publicCipher.shift = cipher.shift;
    if (cipher.type === 'vigenere') publicCipher.key = cipher.key;
  }

  return {
    date: puzzle.date,
    cipher: publicCipher,
    width: puzzle.width,
    height: puzzle.height,
    // '#' = block, '.' = open cell.
    layout: puzzle.solution.map((row) => row.replace(/[A-Z]/g, '.')),
    entries: puzzle.entries.map((e) => ({
      number: e.number,
      direction: e.direction,
      row: e.row,
      col: e.col,
      length: e.length,
      clue: e.cipherClue,
      ...(reveal ? { answer: e.answer, plainClue: e.clue } : {}),
    })),
    ...(reveal ? { solution: puzzle.solution } : {}),
  };
}

const todayForPlayers = async () => ({ ...toPublicPuzzle(await getTodayPuzzle()), isToday: true });

// Past puzzles that were actually played (stored), newest first.
async function listArchive() {
  const days = await DailyPuzzle.find({ date: { $lt: dayKey() } })
    .sort({ date: -1 })
    .limit(ARCHIVE_LIMIT)
    .select('date cipher.type -_id')
    .lean();
  return days.map((p) => ({ date: p.date, cipher: p.cipher.type }));
}

// Only stored days are served, so the archive can never be used to fill the database.
async function puzzleForDate(date) {
  if (!isValidDayKey(date)) throw badRequest('date must be YYYY-MM-DD');
  const today = dayKey();
  if (date === today) return todayForPlayers();
  const puzzle = date < today ? await DailyPuzzle.findOne({ date }).lean() : null;
  if (!puzzle) throw new HttpError(404, 'Puzzle not found');
  return { ...toPublicPuzzle(puzzle, { reveal: true }), isToday: false };
}

module.exports = {
  getOrCreatePuzzle,
  getTodayPuzzle,
  toPublicPuzzle,
  wordList,
  todayForPlayers,
  listArchive,
  puzzleForDate,
};
