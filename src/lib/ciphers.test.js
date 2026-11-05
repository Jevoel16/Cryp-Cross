import { describe, expect, test } from 'vitest';
import { atbashDecode, caesarDecode, vigenereDecode } from './ciphers';

describe('cipher decoders', () => {
    test('caesar undoes a shift and keeps punctuation', () => {
        expect(caesarDecode('Nhytlua dvyu dopsl jvvrpun', 7)).toBe('Garment worn while cooking');
        expect(caesarDecode("Khoor, zruog! It's", 3)).toBe("Hello, world! Fq'p");
    });

    test('atbash is its own inverse', () => {
        expect(atbashDecode('Zg')).toBe('At');
        expect(atbashDecode(atbashDecode('Small nut'))).toBe('Small nut');
    });

    test('vigenere matches the classic example and needs a key', () => {
        expect(vigenereDecode('LXFOPV EF RNHR', 'lemon')).toBe('ATTACK AT DAWN');
        expect(vigenereDecode('abc', '')).toBeNull();
        expect(vigenereDecode('abc', '12')).toBeNull();
    });
});
