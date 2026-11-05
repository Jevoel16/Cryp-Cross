// Across and down clues. Each shows the encrypted text, plus (after the puzzle day)
// the plain clue and answer. Clicking a clue moves the cursor to it.
export default function ClueList({ entries, activeIndex, onSelect, status = {} }) {
    const groups = ['across', 'down'].map((direction) => ({
        direction,
        items: entries.map((entry, index) => ({ entry, index })).filter(({ entry }) => entry.direction === direction),
    }));

    return (
        <div className="clue-lists">
            {groups.map(({ direction, items }) => (
                <div key={direction} className="clue-group">
                    <h2>{direction === 'across' ? 'Across' : 'Down'}</h2>
                    <ol>
                        {items.map(({ entry, index }) => (
                            <li key={index}>
                                <button
                                    type="button"
                                    className={`clue${index === activeIndex ? ' active' : ''}${status[index] ? ` ${status[index]}` : ''}`}
                                    onClick={() => onSelect(index)}
                                    aria-current={index === activeIndex ? 'true' : undefined}
                                >
                                    <span className="clue-number">{entry.number}</span>
                                    <span className="clue-text">
                                        <span className="cipher-text">{entry.clue}</span>
                                        {entry.plainClue && <span className="plain-text">{entry.plainClue}</span>}
                                        {entry.answer && <span className="answer-text">{entry.answer}</span>}
                                        <span className="clue-length"> ({entry.length})</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ol>
                </div>
            ))}
        </div>
    );
}
