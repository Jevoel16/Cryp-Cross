import { expect, test } from 'vitest';
import { formatDuration } from './format';

test('formatDuration', () => {
  expect(formatDuration(0)).toBe('0:00');
  expect(formatDuration(75_000)).toBe('1:15');
  expect(formatDuration(3_725_999)).toBe('1:02:05');
  expect(formatDuration(null)).toBe('-');
  expect(formatDuration(-5)).toBe('-');
});
