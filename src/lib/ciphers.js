// Decoders mirroring server/puzzle/ciphers.js: only A-Z change; Vigenere advances on letters only.

const mod26 = (n) => ((n % 26) + 26) % 26;

function mapLetters(text, fn) {
  let index = 0;
  return text.replace(/[A-Za-z]/g, (ch) => {
    const base = ch <= 'Z' ? 65 : 97;
    const out = String.fromCharCode(base + fn(ch.charCodeAt(0) - base, index));
    index += 1;
    return out;
  });
}

export const caesarDecode = (text, shift) => mapLetters(text, (n) => mod26(n - shift));

export const atbashDecode = (text) => mapLetters(text, (n) => 25 - n);

// Returns null when the key has no letters yet, so the UI can prompt for one.
export function vigenereDecode(text, key) {
  const shifts = String(key || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .map((c) => c.charCodeAt(0) - 65);
  if (!shifts.length) return null;
  return mapLetters(text, (n, i) => mod26(n - shifts[i % shifts.length]));
}

export const CIPHER_INFO = {
  caesar: {
    name: 'Caesar shift',
    help: 'Every letter was moved the same number of places along the alphabet. Find the shift (1-25) that turns the clues into English.',
  },
  atbash: {
    name: 'Atbash',
    help: 'The alphabet is mirrored: A is Z, B is Y, C is X and so on. Apply the same mirror to read a clue.',
  },
  vigenere: {
    name: 'Vigenere',
    help: 'Each letter was shifted by the matching letter of a secret keyword, repeating. Solve the plain key clue to get the keyword.',
  },
};
