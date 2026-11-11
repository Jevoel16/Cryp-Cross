import { useRef } from 'react';

// A hidden focused input takes physical and on-screen keyboards (onInput letters, onKeyDown moves).
export default function CrosswordGrid({ crossword, marks = {}, locked = false, solution = null, label }) {
  const { board, letters, cursor, activeCells, selectCell, handleKey } = crossword;
  const inputRef = useRef(null);

  const focusInput = () => inputRef.current?.focus({ preventScroll: true });

  const onKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // Letters are handled in onInput so mobile keyboards (which send key 229) work too.
    if (/^[a-zA-Z]$/.test(e.key)) return;
    if (handleKey(e.key, { shift: e.shiftKey, locked })) e.preventDefault();
  };

  // One input event can carry several letters (paste, some mobile keyboards): type them in order.
  const onInput = (e) => {
    const typed = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 30);
    e.target.value = '';
    for (const ch of typed) handleKey(ch, { locked });
  };

  return (
    <div className="crossword">
      <input
        ref={inputRef}
        className="crossword-input"
        aria-label={label}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        onKeyDown={onKeyDown}
        onInput={onInput}
      />
      <div className="crossword-grid" style={{ '--cols': board.width }} onClick={focusInput} role="presentation">
        {board.cells.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return <div key={`${r}-${c}`} className="cell block" />;
            const isCursor = cursor.row === r && cursor.col === c;
            const classes = ['cell'];
            if (activeCells.has(`${r},${c}`)) classes.push('in-entry');
            if (isCursor) classes.push('cursor');
            if (marks[`${r},${c}`]) classes.push(marks[`${r},${c}`]);
            const letter = solution ? solution[r][c] : letters[r][c];
            return (
              <div key={`${r}-${c}`} className={classes.join(' ')} onMouseDown={() => selectCell(r, c)}>
                {cell.number && <span className="cell-number">{cell.number}</span>}
                <span className="cell-letter">{letter}</span>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
