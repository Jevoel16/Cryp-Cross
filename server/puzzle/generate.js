const crypto = require('crypto');
const { createRng } = require('./rng');
const { encryptWith, CIPHER_TYPES } = require('./ciphers');

const SIZE = 13;
const TARGET_WORDS = 12;
const MIN_WORDS = 8;
const MAX_TRIES = 20;
const EMPTY = null;

const DIRS = {
  across: { dr: 0, dc: 1 },
  down: { dr: 1, dc: 0 },
};

const inBounds = (r, c) => r >= 0 && c >= 0 && r < SIZE && c < SIZE;

// Crossing count for a placement, or -1 if illegal (see docs/architecture.md#puzzle-generator).
function scorePlacement(grid, word, row, col, dir) {
  const { dr, dc } = DIRS[dir];
  const endR = row + dr * (word.length - 1);
  const endC = col + dc * (word.length - 1);
  if (!inBounds(row, col) || !inBounds(endR, endC)) return -1;

  const before = [row - dr, col - dc];
  const after = [endR + dr, endC + dc];
  if (inBounds(...before) && grid[before[0]][before[1]] !== EMPTY) return -1;
  if (inBounds(...after) && grid[after[0]][after[1]] !== EMPTY) return -1;

  let crossings = 0;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const cell = grid[r][c];
    if (cell === word[i]) {
      crossings += 1;
      continue;
    }
    if (cell !== EMPTY) return -1;
    // Neighbours across the word's direction must be empty for new letters.
    const sides = [
      [r + dc, c + dr],
      [r - dc, c - dr],
    ];
    for (const [sr, sc] of sides) {
      if (inBounds(sr, sc) && grid[sr][sc] !== EMPTY) return -1;
    }
  }
  return crossings;
}

function place(grid, word, row, col, dir) {
  const { dr, dc } = DIRS[dir];
  for (let i = 0; i < word.length; i++) grid[row + dr * i][col + dc * i] = word[i];
}

function bestPlacement(grid, word, rng) {
  let best = [];
  let bestScore = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      for (const dir of Object.keys(DIRS)) {
        const score = scorePlacement(grid, word, r, c, dir);
        if (score <= 0) continue;
        if (score > bestScore) {
          bestScore = score;
          best = [{ row: r, col: c, dir }];
        } else if (score === bestScore) {
          best.push({ row: r, col: c, dir });
        }
      }
    }
  }
  return best.length ? rng.pick(best) : null;
}

function layout(words, rng) {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  const pool = rng.shuffle(words);
  const placed = [];

  // Start with a long word across the middle so others have room to cross it.
  const firstIndex = pool.findIndex((w) => w.word.length >= 6 && w.word.length <= 9);
  const [first] = pool.splice(Math.max(firstIndex, 0), 1);
  const startCol = Math.floor((SIZE - first.word.length) / 2);
  const mid = Math.floor(SIZE / 2);
  place(grid, first.word, mid, startCol, 'across');
  placed.push({ ...first, row: mid, col: startCol, dir: 'across' });

  for (const entry of pool) {
    if (placed.length >= TARGET_WORDS) break;
    const spot = bestPlacement(grid, entry.word, rng);
    if (!spot) continue;
    place(grid, entry.word, spot.row, spot.col, spot.dir);
    placed.push({ ...entry, ...spot });
  }
  return { grid, placed };
}

// Crops empty rows/columns and numbers entries in reading order.
function finalize(grid, placed) {
  let top = SIZE;
  let left = SIZE;
  let bottom = -1;
  let right = -1;
  grid.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === EMPTY) return;
      top = Math.min(top, r);
      bottom = Math.max(bottom, r);
      left = Math.min(left, c);
      right = Math.max(right, c);
    })
  );

  const solution = grid
    .slice(top, bottom + 1)
    .map((row) => row.slice(left, right + 1).map((cell) => cell || '#').join(''));

  // Words sharing a start cell (one across, one down) share a number.
  const numbers = new Map();
  const entries = placed
    .map((p) => ({ ...p, row: p.row - top, col: p.col - left }))
    .sort((x, y) => x.row - y.row || x.col - y.col)
    .map((p) => {
      const key = `${p.row},${p.col}`;
      if (!numbers.has(key)) numbers.set(key, numbers.size + 1);
      return {
        number: numbers.get(key),
        direction: p.dir,
        row: p.row,
        col: p.col,
        length: p.word.length,
        answer: p.word,
        clue: p.clue,
      };
    })
    .sort((x, y) => (x.direction === y.direction ? x.number - y.number : x.direction === 'across' ? -1 : 1));

  return { width: right - left + 1, height: bottom - top + 1, solution, entries };
}

function chooseCipher(rng, words, usedWords) {
  const type = rng.pick(CIPHER_TYPES);
  if (type === 'caesar') return { type, shift: rng.int(1, 25) };
  if (type === 'atbash') return { type };
  // Vigenere: the key is the answer to an extra plain-text clue that is not in the grid.
  const candidates = words.filter((w) => w.word.length >= 4 && w.word.length <= 7 && !usedWords.has(w.word));
  const keyWord = rng.pick(candidates);
  return { type, key: keyWord.word, keyClue: keyWord.clue };
}

// HMAC(secret, date) seed so future puzzles can't be computed from the public source.
function seedFor(date, attempt, secret) {
  const text = `${date}#${attempt}`;
  return secret ? crypto.createHmac('sha256', secret).update(text).digest('hex') : text;
}

// Builds the puzzle for a day. Same date + word list + secret => same puzzle.
function generatePuzzle(date, words, { secret } = {}) {
  let best = null;
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const rng = createRng(seedFor(date, attempt, secret));
    const { grid, placed } = layout(words, rng);
    if (!best || placed.length > best.placed.length) best = { grid, placed, rng };
    if (placed.length >= MIN_WORDS) break;
  }

  const { grid, placed, rng } = best;
  const board = finalize(grid, placed);
  const cipher = chooseCipher(rng, words, new Set(placed.map((p) => p.word)));
  const entries = board.entries.map((e) => ({ ...e, cipherClue: encryptWith(cipher, e.clue) }));
  return { date, cipher, width: board.width, height: board.height, solution: board.solution, entries };
}

module.exports = { generatePuzzle, scorePlacement, SIZE, MIN_WORDS };
