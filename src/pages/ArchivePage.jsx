import { Link, Navigate, useParams } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import { BoardSkeleton } from '../components/Skeleton';
import PuzzleBoard from '../components/PuzzleBoard';
import usePageMeta from '../usePageMeta';
import useCrossword from '../hooks/useCrossword';
import useLoad from '../hooks/useLoad';
import { api } from '../api';
import { CIPHER_INFO } from '../lib/ciphers';
import { LOAD } from '../lib/loadMachine';

const loadPuzzle = (date, signal) =>
  api(`/puzzles/${encodeURIComponent(date)}`, { signal }).catch((err) => {
    throw err.status === 404 ? new Error('There is no puzzle for that day.') : err;
  });

// A past day, read-only, with the solution, decoded clues and the cipher key shown.
function SolvedBoard({ puzzle }) {
  const crossword = useCrossword(puzzle);
  const { cipher } = puzzle;
  const key =
    cipher.type === 'caesar'
      ? `shift ${cipher.shift}`
      : cipher.type === 'vigenere'
        ? `keyword ${cipher.key}`
        : 'no key';
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
  const load = useLoad(loadPuzzle, date);

  switch (load.status) {
    case LOAD.PENDING:
      return (
        <SectionWrapper title={`Puzzle · ${date}`} className="play-section">
          <BoardSkeleton />
        </SectionWrapper>
      );
    case LOAD.FAILED:
      return (
        <SectionWrapper title={`Puzzle · ${date}`} className="play-section">
          <p className="form-message error" role="alert">
            {load.error} <Link to="/puzzles">See past puzzles</Link>.
          </p>
        </SectionWrapper>
      );
    case LOAD.LOADED:
      // Today's puzzle is still being played: no spoilers here.
      if (load.data.isToday) return <Navigate to="/play" replace />;
      return (
        <SectionWrapper title={`Puzzle · ${date}`} className="play-section">
          <SolvedBoard key={date} puzzle={load.data} />
        </SectionWrapper>
      );
    default:
      throw new Error(`Unknown load status: ${load.status}`);
  }
}
