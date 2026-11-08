const DailyPuzzle = require('../models/dailyPuzzle');
const { generatePuzzle } = require('./generate');
const { loadWords } = require('./words');
const { dayKey } = require('./dayKey');

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

module.exports = { getOrCreatePuzzle, getTodayPuzzle, toPublicPuzzle, wordList };
