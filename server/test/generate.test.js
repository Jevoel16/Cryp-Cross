const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generatePuzzle, MIN_WORDS } = require('../puzzle/generate');
const { loadWords } = require('../puzzle/words');
const { caesar, atbash, vigenere } = require('../puzzle/ciphers');
const { dayKey, isValidDayKey, previousDayKey } = require('../puzzle/dayKey');

const words = loadWords();

function dates(count) {
  const out = [];
  const d = new Date('2026-01-01T00:00:00Z');
  for (let i = 0; i < count; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

test('the word bank loads and is large enough', () => {
  assert.ok(words.length >= 150);
  for (const w of words) assert.match(w.word, /^[A-Z]{3,10}$/);
});

test('same date gives the same puzzle, different dates differ', () => {
  assert.deepEqual(generatePuzzle('2026-11-05', words), generatePuzzle('2026-11-05', words));
  assert.notDeepEqual(generatePuzzle('2026-11-05', words).solution, generatePuzzle('2026-11-06', words).solution);
});

test('a secret changes the puzzle and keeps it stable', () => {
  const plain = generatePuzzle('2026-11-05', words);
  const secret = generatePuzzle('2026-11-05', words, { secret: 'server-only' });
  assert.notDeepEqual(secret.solution, plain.solution);
  assert.deepEqual(generatePuzzle('2026-11-05', words, { secret: 'server-only' }), secret);
  assert.notDeepEqual(generatePuzzle('2026-11-05', words, { secret: 'other' }).solution, secret.solution);
});

test('a year of puzzles is consistent', () => {
  for (const date of dates(365)) {
    const p = generatePuzzle(date, words);
    assert.ok(p.entries.length >= MIN_WORDS, `${date}: only ${p.entries.length} words`);
    assert.equal(p.solution.length, p.height);
    assert.ok(p.solution.every((row) => row.length === p.width));
    assert.equal(new Set(p.entries.map((e) => e.answer)).size, p.entries.length, `${date}: repeated word`);

    // Every entry spells its answer in the grid, and every letter belongs to an entry.
    const covered = new Set();
    for (const e of p.entries) {
      const [dr, dc] = e.direction === 'across' ? [0, 1] : [1, 0];
      let spelled = '';
      for (let i = 0; i < e.length; i++) {
        spelled += p.solution[e.row + dr * i][e.col + dc * i];
        covered.add(`${e.row + dr * i},${e.col + dc * i}`);
      }
      assert.equal(spelled, e.answer, `${date}: ${e.number} ${e.direction}`);
    }
    const letters = p.solution.join('').replace(/#/g, '').length;
    assert.equal(covered.size, letters, `${date}: unclued letters`);

    // Numbers run 1..n in reading order.
    const numbers = [...new Set(p.entries.map((e) => e.number))].sort((a, b) => a - b);
    assert.deepEqual(numbers, numbers.map((_, i) => i + 1));
  }
});

test('clues decrypt back to the plain clue with the day cipher', () => {
  const seen = new Set();
  for (const date of dates(60)) {
    const { cipher, entries } = generatePuzzle(date, words);
    seen.add(cipher.type);
    for (const e of entries) {
      const plain =
        cipher.type === 'caesar'
          ? caesar.decrypt(e.cipherClue, cipher.shift)
          : cipher.type === 'atbash'
            ? atbash.decrypt(e.cipherClue)
            : vigenere.decrypt(e.cipherClue, cipher.key);
      assert.equal(plain, e.clue);
    }
    if (cipher.type === 'vigenere') {
      assert.ok(cipher.keyClue);
      assert.ok(!entries.some((e) => e.answer === cipher.key), 'key word must not be in the grid');
    }
  }
  assert.deepEqual([...seen].sort(), ['atbash', 'caesar', 'vigenere']);
});

test('day keys follow the puzzle time zone', () => {
  const instant = new Date('2026-11-05T23:30:00Z');
  assert.equal(dayKey(instant, 'UTC'), '2026-11-05');
  assert.equal(dayKey(instant, 'Asia/Manila'), '2026-11-06');
  assert.ok(isValidDayKey('2024-02-29'));
  assert.ok(!isValidDayKey('2026-02-30'));
  assert.ok(!isValidDayKey('2026-1-05'));
  assert.equal(previousDayKey('2026-03-01'), '2026-02-28');
});
