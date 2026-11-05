const fs = require('fs');
const path = require('path');

const WORD = /^[A-Z]{3,10}$/;

// Loads data/words.txt ("WORD|clue" per line). Invalid lines fail loudly at startup.
function loadWords(file = path.join(__dirname, '..', 'data', 'words.txt')) {
  const words = [];
  const seen = new Set();
  fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const [word, clue] = trimmed.split('|').map((s) => (s || '').trim());
      if (!WORD.test(word) || !clue) throw new Error(`words.txt line ${i + 1} is invalid`);
      if (seen.has(word)) throw new Error(`words.txt line ${i + 1} repeats ${word}`);
      seen.add(word);
      words.push({ word, clue });
    });
  return words;
}

module.exports = { loadWords };
