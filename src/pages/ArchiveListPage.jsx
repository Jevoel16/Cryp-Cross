import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import { RowsSkeleton } from '../components/Skeleton';
import usePageMeta from '../usePageMeta';
import useLoad from '../hooks/useLoad';
import { api } from '../api';
import { CIPHER_INFO } from '../lib/ciphers';
import { LOAD } from '../lib/loadMachine';

const loadDays = (key, signal) => api('/puzzles', { signal });

function Days({ load }) {
  switch (load.status) {
    case LOAD.PENDING:
      return <RowsSkeleton rows={6} label="Loading past puzzles" />;
    case LOAD.FAILED:
      return (
        <p className="form-message error" role="alert">
          {load.error}
        </p>
      );
    case LOAD.LOADED:
      if (load.data.length === 0) {
        return (
          <p>
            No past puzzles yet. <Link to="/play">Play today&apos;s</Link>.
          </p>
        );
      }
      return (
        <ul className="archive-list">
          {load.data.map((day) => (
            <li key={day.date}>
              <Link to={`/puzzles/${day.date}`}>{day.date}</Link>{' '}
              <span className="muted">{CIPHER_INFO[day.cipher]?.name}</span> ·{' '}
              <Link to={`/leaderboard?date=${day.date}`}>leaderboard</Link>
            </li>
          ))}
        </ul>
      );
    default:
      throw new Error(`Unknown load status: ${load.status}`);
  }
}

export default function ArchiveListPage() {
  usePageMeta({
    title: 'Past Puzzles',
    description: 'Past Cryp-Cross daily cipher crosswords with their answers, decoded clues and leaderboards.',
    path: '/puzzles',
  });
  const load = useLoad(loadDays);

  return (
    <SectionWrapper title="Past Puzzles">
      <Days load={load} />
    </SectionWrapper>
  );
}
