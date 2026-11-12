import { describe, expect, test } from 'vitest';
import {
  buildBoard,
  emptyLetters,
  entryAt,
  entryLabel,
  isFilled,
  lettersToRows,
  moveArrow,
  nextEntryIndex,
  rowsToLetters,
  stepInEntry,
} from './grid';

// CAT across the top row, TOP down the last column.
const puzzle = {
  width: 3,
  height: 3,
  layout: ['...', '##.', '##.'],
  entries: [
    { number: 1, direction: 'across', row: 0, col: 0, length: 3 },
    { number: 2, direction: 'down', row: 0, col: 2, length: 3 },
  ],
};
const board = buildBoard(puzzle);

describe('grid logic', () => {
  test('numbers start cells and links cells to entries', () => {
    expect(board.cells[0][0].number).toBe(1);
    expect(board.cells[0][2]).toEqual({ number: 2, across: 0, down: 1 });
    expect(board.cells[1][0]).toBeNull();
  });

  test('entryAt prefers the asked direction, then falls back', () => {
    expect(entryAt(board, 0, 2, 'down')).toEqual({ index: 1, direction: 'down' });
    expect(entryAt(board, 0, 0, 'down')).toEqual({ index: 0, direction: 'across' });
    expect(entryAt(board, 1, 0, 'across')).toBeNull();
  });

  test('typing moves within the entry and stops at its end', () => {
    expect(stepInEntry(board, 0, 0, 'across', 1)).toEqual([0, 1]);
    expect(stepInEntry(board, 0, 2, 'across', 1)).toEqual([0, 2]);
    expect(stepInEntry(board, 0, 0, 'across', -1)).toEqual([0, 0]);
    expect(stepInEntry(board, 1, 2, 'down', 1)).toEqual([2, 2]);
  });

  test('arrows skip blocks and stay put at the edge', () => {
    expect(moveArrow(board, 0, 1, 1, 0)).toEqual([0, 1]);
    expect(moveArrow(board, 2, 2, 0, -1)).toEqual([2, 2]);
    expect(moveArrow(board, 0, 2, 1, 0)).toEqual([1, 2]);
  });

  test('tab order wraps around', () => {
    expect(nextEntryIndex(board, 1, 1)).toBe(0);
    expect(nextEntryIndex(board, 0, -1)).toBe(1);
  });

  test('letters convert to API rows and back', () => {
    const letters = emptyLetters(board);
    expect(isFilled(board, letters)).toBe(false);
    letters[0] = ['C', 'A', 'T'];
    letters[1][2] = 'O';
    letters[2][2] = 'P';
    expect(isFilled(board, letters)).toBe(true);
    const rows = lettersToRows(board, letters);
    expect(rows).toEqual(['CAT', '##O', '##P']);
    expect(rowsToLetters(board, rows)).toEqual(letters);
    expect(rowsToLetters(board, ['C T', '##x'])[0]).toEqual(['C', '', 'T']);
  });
});

describe('entryLabel', () => {
  const entry = { ...puzzle.entries[0], clue: 'Xzg' };

  test('reads the clue and says when nothing is typed', () => {
    expect(entryLabel(entry, emptyLetters(board))).toBe('1 across, 3 letters. Encrypted clue: Xzg. Nothing entered.');
  });

  test('spells the typed letters, blanks included, and the check result', () => {
    const letters = emptyLetters(board);
    letters[0][0] = 'C';
    letters[0][2] = 'T';
    expect(entryLabel(entry, letters, 'wrong')).toBe(
      '1 across, 3 letters. Encrypted clue: Xzg. Entered: C blank T. Marked wrong.',
    );
    expect(entryLabel(entry, letters, 'incomplete')).not.toMatch(/Marked/);
  });
});
