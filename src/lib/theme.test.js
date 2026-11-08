import { describe, expect, it } from 'vitest';
import { themeColor } from './theme';

describe('themeColor', () => {
    it('returns the light background for the light theme', () => {
        expect(themeColor('light')).toBe('#f3f6ef');
    });

    it('falls back to the dark background', () => {
        expect(themeColor('dark')).toBe('#070b12');
        expect(themeColor(undefined)).toBe('#070b12');
    });
});
