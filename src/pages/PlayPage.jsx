import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import PuzzleBoard from '../components/PuzzleBoard';
import usePageMeta from '../usePageMeta';
import useCrossword from '../hooks/useCrossword';
import { api } from '../api';
import { useAuth } from '../auth/authContext';
import { buildBoard, lettersToRows, rowsToLetters } from '../lib/grid';

const storageKey = (date) => `cc:grid:${date}`;

// Per-browser draft of the grid, so a refresh doesn't lose typed letters.
function readDraft(date) {
    try {
        return JSON.parse(localStorage.getItem(storageKey(date)));
    } catch {
        return null;
    }
}

function writeDraft(date, rows) {
    try {
        localStorage.setItem(storageKey(date), JSON.stringify(rows));
    } catch {
        // Storage blocked: the draft just won't survive a refresh.
    }
}

function TodayPuzzle({ puzzle }) {
    const { user } = useAuth();
    const crossword = useCrossword(puzzle, rowsToLetters(buildBoard(puzzle), readDraft(puzzle.date)));
    const { board, letters } = crossword;

    useEffect(() => {
        writeDraft(puzzle.date, lettersToRows(board, letters));
    }, [puzzle.date, board, letters]);

    return (
        <PuzzleBoard puzzle={puzzle} crossword={crossword}>
            {!user && (
                <p className="play-hint">
                    <Link to="/login" state={{ from: '/play' }}>Log in</Link> or <Link to="/signup">sign up</Link> to check
                    answers, submit your solve and join the leaderboard.
                </p>
            )}
        </PuzzleBoard>
    );
}

export default function PlayPage() {
    usePageMeta({
        title: "Today's Puzzle",
        description:
            "Play today's Cryp-Cross: a free daily crossword whose clues are encrypted with a classical cipher. Decode the clues, fill the grid and race the leaderboard.",
        path: '/play',
    });
    const [puzzle, setPuzzle] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api('/puzzles/today').then(setPuzzle, (err) => setError(err.message));
    }, []);

    return (
        <SectionWrapper title={puzzle ? `Today's Puzzle · ${puzzle.date}` : "Today's Puzzle"} className="play-section">
            {error && (
                <p className="form-message error" role="alert">
                    {error}
                </p>
            )}
            {!puzzle && !error && <p>Loading today&apos;s puzzle...</p>}
            {puzzle && <TodayPuzzle key={puzzle.date} puzzle={puzzle} />}
        </SectionWrapper>
    );
}
