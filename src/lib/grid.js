// Pure crossword-board logic, kept out of React so it can be unit tested.

const DELTA = { across: [0, 1], down: [1, 0] };

// Cells: null for blocks, else { number, across, down } with indexes into `entries`.
export function buildBoard({ width, height, layout, entries }) {
    const cells = layout.map((row) => [...row].map((ch) => (ch === '#' ? null : { number: null, across: null, down: null })));
    entries.forEach((entry, index) => {
        entryCells(entry).forEach(([r, c]) => {
            cells[r][c][entry.direction] = index;
        });
        cells[entry.row][entry.col].number = entry.number;
    });
    return { width, height, cells, entries };
}

export function entryCells(entry) {
    const [dr, dc] = DELTA[entry.direction];
    return Array.from({ length: entry.length }, (_, i) => [entry.row + dr * i, entry.col + dc * i]);
}

export const emptyLetters = (board) => board.cells.map((row) => row.map(() => ''));

const isOpen = (board, r, c) => r >= 0 && c >= 0 && r < board.height && c < board.width && board.cells[r][c] !== null;

// The entry under a cell in the wanted direction, falling back to the other one.
export function entryAt(board, row, col, direction) {
    const cell = board.cells[row]?.[col];
    if (!cell) return null;
    if (cell[direction] !== null) return { index: cell[direction], direction };
    const other = direction === 'across' ? 'down' : 'across';
    return cell[other] !== null ? { index: cell[other], direction: other } : null;
}

// Next/previous cell inside the same entry; stays put at the ends.
export function stepInEntry(board, row, col, direction, delta) {
    const [dr, dc] = DELTA[direction];
    const r = row + dr * delta;
    const c = col + dc * delta;
    const cell = isOpen(board, r, c) ? board.cells[r][c] : null;
    const current = board.cells[row][col][direction];
    return cell && current !== null && cell[direction] === current ? [r, c] : [row, col];
}

// Arrow keys: jump to the next open cell in that direction, skipping blocks.
export function moveArrow(board, row, col, dr, dc) {
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && c >= 0 && r < board.height && c < board.width) {
        if (board.cells[r][c]) return [r, c];
        r += dr;
        c += dc;
    }
    return [row, col];
}

// Entries in clue-list order (all across, then all down), wrapping around.
export function nextEntryIndex(board, index, delta) {
    const n = board.entries.length;
    return (((index + delta) % n) + n) % n;
}

export function isFilled(board, letters) {
    return board.cells.every((row, r) => row.every((cell, c) => !cell || letters[r][c]));
}

// Letters as rows of strings ('#' blocks, ' ' blanks), the shape the API stores.
export function lettersToRows(board, letters) {
    return board.cells.map((row, r) => row.map((cell, c) => (cell ? letters[r][c] || ' ' : '#')).join(''));
}

export function rowsToLetters(board, rows) {
    return board.cells.map((row, r) =>
        row.map((cell, c) => {
            const ch = rows?.[r]?.[c];
            return cell && ch && /[A-Z]/.test(ch) ? ch : '';
        })
    );
}
