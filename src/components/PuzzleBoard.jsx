import CrosswordGrid from './CrosswordGrid';
import ClueList from './ClueList';
import CipherTool from './CipherTool';
import { entryLabel } from '../lib/grid';

const focusGrid = () => document.querySelector('.crossword-input')?.focus({ preventScroll: true });

// Grid + decoder + clue lists for one puzzle. `crossword` comes from useCrossword.
export default function PuzzleBoard({ puzzle, crossword, marks, clueStatus, locked, solution, children }) {
  const { activeIndex, selectEntry } = crossword;
  const activeEntry = activeIndex === null ? puzzle.entries[0] : puzzle.entries[activeIndex];
  const shown = solution ? solution.map((row) => [...row]) : crossword.letters;
  const label = entryLabel(activeEntry, shown, clueStatus?.[activeIndex ?? 0]);

  return (
    <div className="puzzle-layout">
      <div className="puzzle-main">
        <p className="active-clue" aria-hidden="true">
          <strong>
            {activeEntry.number} {activeEntry.direction}
          </strong>{' '}
          <code>{activeEntry.clue}</code> ({activeEntry.length})
        </p>
        <CrosswordGrid crossword={crossword} marks={marks} locked={locked} solution={solution} label={label} />
        {children}
      </div>
      <CipherTool cipher={puzzle.cipher} text={activeEntry.clue} />
      <ClueList
        entries={puzzle.entries}
        activeIndex={activeIndex}
        status={clueStatus}
        onSelect={(index) => {
          selectEntry(index);
          focusGrid();
        }}
      />
    </div>
  );
}
