import { describe, expect, test } from 'vitest';
import { crosswordReducer } from './useCrossword';
import { buildBoard, emptyLetters } from '../lib/grid';

// CAT across the top row, TOP down the last column.
const board = buildBoard({
  width: 3,
  height: 3,
  layout: ['...', '##.', '##.'],
  entries: [
    { number: 1, direction: 'across', row: 0, col: 0, length: 3 },
    { number: 2, direction: 'down', row: 0, col: 2, length: 3 },
  ],
});
const start = { board, letters: emptyLetters(board), cursor: { row: 0, col: 0, direction: 'across' } };
const press = (state, ...keys) => keys.reduce((s, key) => crosswordReducer(s, { type: 'key', key }), state);

describe('crossword keyboard', () => {
  test('back-to-back letters fill consecutive cells', () => {
    const s = press(start, 'c', 'a', 't');
    expect(s.letters[0]).toEqual(['C', 'A', 'T']);
    expect(s.cursor).toEqual({ row: 0, col: 2, direction: 'across' });
  });

  test('backspace clears, then steps back on an empty cell', () => {
    // Cursor ends on the empty third cell, so Backspace steps back and clears "A".
    let s = press(start, 'c', 'a');
    s = press(s, 'Backspace');
    expect(s.letters[0]).toEqual(['C', '', '']);
    expect(s.cursor.col).toBe(1);
    // On a filled cell it clears in place.
    s = crosswordReducer(s, { type: 'select', row: 0, col: 0 });
    s = press(s, 'Backspace');
    expect(s.letters[0]).toEqual(['', '', '']);
    expect(s.cursor.col).toBe(0);
  });

  test('space and re-click toggle direction at a crossing', () => {
    let s = crosswordReducer(start, { type: 'select', row: 0, col: 2 });
    expect(s.cursor.direction).toBe('across');
    s = press(s, ' ');
    expect(s.cursor.direction).toBe('down');
    s = press(s, 't', 'o', 'p');
    expect([s.letters[0][2], s.letters[1][2], s.letters[2][2]]).toEqual(['T', 'O', 'P']);
  });

  test('tab moves to the next clue and locked grids ignore typing', () => {
    const s = press(start, 'Tab');
    expect(s.cursor).toEqual({ row: 0, col: 2, direction: 'down' });
    const locked = crosswordReducer(start, { type: 'key', key: 'x', locked: true });
    expect(locked).toBe(start);
  });
});
