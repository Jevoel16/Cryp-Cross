import { useCallback, useMemo, useReducer } from 'react';
import { buildBoard, emptyLetters, entryAt, entryCells, moveArrow, nextEntryIndex, stepInEntry } from '../lib/grid';

const ARROWS = {
    ArrowUp: [-1, 0, 'down'],
    ArrowDown: [1, 0, 'down'],
    ArrowLeft: [0, -1, 'across'],
    ArrowRight: [0, 1, 'across'],
};

const other = (direction) => (direction === 'across' ? 'down' : 'across');

const withLetter = (letters, row, col, value) =>
    letters.map((r, ri) => (ri === row ? r.map((v, ci) => (ci === col ? value : v)) : r));

// Pure state transitions. A reducer (rather than reading state in event handlers)
// means fast typing never works from a stale cursor.
export function crosswordReducer(state, action) {
    const { board, letters, cursor } = state;
    const { row, col } = cursor;
    const direction = entryAt(board, row, col, cursor.direction)?.direction ?? cursor.direction;

    switch (action.type) {
        case 'select': {
            if (!board.cells[action.row]?.[action.col]) return state;
            // Clicking the current cell again flips between across and down.
            const same = action.row === row && action.col === col;
            const wanted = same ? other(direction) : direction;
            const found = entryAt(board, action.row, action.col, wanted);
            return { ...state, cursor: { row: action.row, col: action.col, direction: found ? found.direction : wanted } };
        }
        case 'selectEntry': {
            const e = board.entries[action.index];
            return { ...state, cursor: { row: e.row, col: e.col, direction: e.direction } };
        }
        case 'setLetters':
            return { ...state, letters: action.letters };
        case 'key': {
            const { key, shift, locked } = action;
            if (/^[a-zA-Z]$/.test(key)) {
                if (locked) return state;
                const [r, c] = stepInEntry(board, row, col, direction, 1);
                return {
                    ...state,
                    letters: withLetter(letters, row, col, key.toUpperCase()),
                    cursor: { row: r, col: c, direction },
                };
            }
            if (key === 'Backspace' || key === 'Delete') {
                if (locked) return state;
                if (letters[row][col] || key === 'Delete') return { ...state, letters: withLetter(letters, row, col, '') };
                const [r, c] = stepInEntry(board, row, col, direction, -1);
                return { ...state, letters: withLetter(letters, r, c, ''), cursor: { row: r, col: c, direction } };
            }
            if (ARROWS[key]) {
                const [dr, dc, axis] = ARROWS[key];
                // First press on the other axis only turns; the next one moves.
                if (direction !== axis && entryAt(board, row, col, axis)?.direction === axis) {
                    return { ...state, cursor: { row, col, direction: axis } };
                }
                const [r, c] = moveArrow(board, row, col, dr, dc);
                return { ...state, cursor: { row: r, col: c, direction: axis } };
            }
            if (key === ' ') return crosswordReducer(state, { type: 'select', row, col });
            if (key === 'Tab' || key === 'Enter') {
                const current = entryAt(board, row, col, direction);
                if (!current) return state;
                return crosswordReducer(state, {
                    type: 'selectEntry',
                    index: nextEntryIndex(board, current.index, shift ? -1 : 1),
                });
            }
            return state;
        }
        default:
            return state;
    }
}

export const HANDLED_KEYS = new Set(['Backspace', 'Delete', ' ', 'Tab', 'Enter', ...Object.keys(ARROWS)]);

function init({ puzzle, initialLetters }) {
    const board = buildBoard(puzzle);
    const first = board.entries[0];
    return {
        board,
        letters: initialLetters || emptyLetters(board),
        cursor: { row: first.row, col: first.col, direction: first.direction },
    };
}

// Board, typed letters and the cursor (cell + direction) for one puzzle.
// Remount (change `key`) to load a different puzzle.
export default function useCrossword(puzzle, initialLetters) {
    const [state, dispatch] = useReducer(crosswordReducer, { puzzle, initialLetters }, init);
    const { board, letters, cursor } = state;

    const active = entryAt(board, cursor.row, cursor.col, cursor.direction);
    const activeIndex = active ? active.index : null;
    const activeCells = useMemo(
        () => new Set(activeIndex === null ? [] : entryCells(board.entries[activeIndex]).map(([r, c]) => `${r},${c}`)),
        [board, activeIndex]
    );

    const selectCell = useCallback((row, col) => dispatch({ type: 'select', row, col }), []);
    const selectEntry = useCallback((index) => dispatch({ type: 'selectEntry', index }), []);
    const setLetters = useCallback((next) => dispatch({ type: 'setLetters', letters: next }), []);
    // Returns true when the key is one the grid uses (so the caller can preventDefault).
    const handleKey = useCallback((key, { shift = false, locked = false } = {}) => {
        if (!/^[a-zA-Z]$/.test(key) && !HANDLED_KEYS.has(key)) return false;
        dispatch({ type: 'key', key, shift, locked });
        return true;
    }, []);

    return { board, letters, setLetters, cursor, activeIndex, activeCells, selectCell, selectEntry, handleKey };
}
