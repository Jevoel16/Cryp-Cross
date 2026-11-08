// Clue ciphers: only A-Z change (case kept) so the clue's shape stays readable.

const A = 'A'.charCodeAt(0);
const a = 'a'.charCodeAt(0);

function mapLetters(text, fn) {
  let letterIndex = 0;
  return text.replace(/[A-Za-z]/g, (ch) => {
    const base = ch <= 'Z' ? A : a;
    const out = String.fromCharCode(base + fn(ch.charCodeAt(0) - base, letterIndex));
    letterIndex += 1;
    return out;
  });
}

const mod26 = (n) => ((n % 26) + 26) % 26;

const caesar = {
  encrypt: (text, shift) => mapLetters(text, (n) => mod26(n + shift)),
  decrypt: (text, shift) => mapLetters(text, (n) => mod26(n - shift)),
};

// Atbash mirrors the alphabet (A<->Z), so it is its own inverse.
const atbash = {
  encrypt: (text) => mapLetters(text, (n) => 25 - n),
  decrypt: (text) => mapLetters(text, (n) => 25 - n),
};

function keyShifts(key) {
  const shifts = String(key).toUpperCase().replace(/[^A-Z]/g, '').split('').map((c) => c.charCodeAt(0) - A);
  if (!shifts.length) throw new Error('Vigenere key must contain letters');
  return shifts;
}

// The key advances only on letters, matching the classic pen-and-paper method.
const vigenere = {
  encrypt(text, key) {
    const shifts = keyShifts(key);
    return mapLetters(text, (n, i) => mod26(n + shifts[i % shifts.length]));
  },
  decrypt(text, key) {
    const shifts = keyShifts(key);
    return mapLetters(text, (n, i) => mod26(n - shifts[i % shifts.length]));
  },
};

const CIPHER_TYPES = ['caesar', 'atbash', 'vigenere'];

function encryptWith(cipher, text) {
  if (cipher.type === 'caesar') return caesar.encrypt(text, cipher.shift);
  if (cipher.type === 'atbash') return atbash.encrypt(text);
  if (cipher.type === 'vigenere') return vigenere.encrypt(text, cipher.key);
  throw new Error(`Unknown cipher: ${cipher.type}`);
}

module.exports = { caesar, atbash, vigenere, encryptWith, CIPHER_TYPES };
