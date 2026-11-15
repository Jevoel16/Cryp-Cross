import { describe, expect, it } from 'vitest';
import { parseTheme, resolveTheme, themeColor } from './theme';

describe('parseTheme', () => {
  it('keeps a saved light or dark choice', () => {
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('dark')).toBe('dark');
  });

  it('treats anything else as System', () => {
    expect(parseTheme(null)).toBe('system');
    expect(parseTheme('')).toBe('system');
    expect(parseTheme('system')).toBe('system');
    expect(parseTheme('Dark')).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('follows the device for System', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('keeps an explicit choice whatever the device says', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('themeColor', () => {
  it('returns the light background for the light theme', () => {
    expect(themeColor('light')).toBe('#f3f6ef');
  });

  it('falls back to the dark background', () => {
    expect(themeColor('dark')).toBe('#070b12');
    expect(themeColor(undefined)).toBe('#070b12');
  });
});
