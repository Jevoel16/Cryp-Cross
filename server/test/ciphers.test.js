const { test } = require('node:test');
const assert = require('node:assert/strict');
const { caesar, atbash, vigenere, encryptWith } = require('../puzzle/ciphers');

const TEXT = "Bowl-shaped hole, left by an impact! (It's big.)";

test('caesar round-trips and keeps punctuation and case', () => {
  for (let shift = 1; shift < 26; shift++) {
    const enc = caesar.encrypt(TEXT, shift);
    assert.equal(enc.replace(/[A-Za-z]/g, 'x'), TEXT.replace(/[A-Za-z]/g, 'x'));
    assert.equal(caesar.decrypt(enc, shift), TEXT);
  }
  assert.equal(caesar.encrypt('Abc xyz', 3), 'Def abc');
});

test('atbash mirrors the alphabet and is its own inverse', () => {
  assert.equal(atbash.encrypt('Az by'), 'Za yb');
  assert.equal(atbash.decrypt(atbash.encrypt(TEXT)), TEXT);
});

test('vigenere advances the key on letters only', () => {
  assert.equal(vigenere.encrypt('ATTACK AT DAWN', 'LEMON'), 'LXFOPV EF RNHR');
  assert.equal(vigenere.decrypt(vigenere.encrypt(TEXT, 'Key'), 'KEY'), TEXT);
  assert.throws(() => vigenere.encrypt('x', '123'));
});

test('encryptWith dispatches on cipher type', () => {
  assert.equal(encryptWith({ type: 'caesar', shift: 1 }, 'abc'), 'bcd');
  assert.equal(encryptWith({ type: 'atbash' }, 'abc'), 'zyx');
  assert.equal(encryptWith({ type: 'vigenere', key: 'B' }, 'abc'), 'bcd');
  assert.throws(() => encryptWith({ type: 'rot13' }, 'abc'));
});
