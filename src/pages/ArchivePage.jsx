import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import { BoardSkeleton } from '../components/Skeleton';
import PuzzleBoard from '../components/PuzzleBoard';
import usePageMeta from '../usePageMeta';
import useCrossword from '../hooks/useCrossword';
import { api } from '../api';
import { CIPHER_INFO } from '../lib/ciphers';

// A past day, read-only, with the solution, decoded clues and the cipher key shown.
function SolvedBoard({ puzzle }) {
    const crossword = useCrossword(puzzle);
    const { cipher } = puzzle;
    const key =
        cipher.type === 'caesar' ? `shift ${cipher.shift}` : cipher.type === 'vigenere' ? `keyword ${cipher.key}` : 'no key';
    return (
        <>
            <p>
                Cipher: <strong>{CIPHER_INFO[cipher.type].name}</strong> ({key}).{' '}
                <Link to={`/leaderboard?date=${puzzle.date}`}>Leaderboard for this day</Link>
            </p>
            <PuzzleBoard puzzle={puzzle} crossword={crossword} locked solution={puzzle.solution} />
        </>
    );
}

export default function ArchivePage() {
    const { date } = useParams();
    usePageMeta({
        title: `Puzzle ${date}`,
        description: `The Cryp-Cross cipher crossword for ${date}, with answers and decoded clues.`,
        noindex: true,
    });
    const [result, setResult] = useState({ date: null, puzzle: null, error: '' });

    useEffect(() => {
        api(`/puzzles/${encodeURIComponent(date)}`).then(
            (puzzle) => setResult({ date, puzzle, error: '' }),
            (err) => setResult({ date, puzzle: null, error: err.status === 404 ? 'There is no puzzle for that day.' : err.message })
        );
    }, [date]);

    const current = result.date === date ? result : { puzzle: null, error: '' };
    // Today's puzzle is still being played: no spoilers here.
    if (current.puzzle?.isToday) return <Navigate to="/play" replace />;

    return (
        <SectionWrapper title={`Puzzle · ${date}`} className="play-section">
            {current.error && (
                <p className="form-message error" role="alert">
                    {current.error} <Link to="/puzzles">See past puzzles</Link>.
                </p>
            )}
            {!current.puzzle && !current.error && <BoardSkeleton />}
            {current.puzzle && <SolvedBoard key={date} puzzle={current.puzzle} />}
        </SectionWrapper>
    );
}
