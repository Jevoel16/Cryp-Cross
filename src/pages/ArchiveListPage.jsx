import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import { RowsSkeleton } from '../components/Skeleton';
import usePageMeta from '../usePageMeta';
import { api } from '../api';
import { CIPHER_INFO } from '../lib/ciphers';

export default function ArchiveListPage() {
  usePageMeta({
    title: 'Past Puzzles',
    description: 'Past Cryp-Cross daily cipher crosswords with their answers, decoded clues and leaderboards.',
    path: '/puzzles',
  });
  const [days, setDays] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/puzzles').then(setDays, (err) => setError(err.message));
  }, []);

  return (
    <SectionWrapper title="Past Puzzles">
      {error && (
        <p className="form-message error" role="alert">
          {error}
        </p>
      )}
      {!days && !error && <RowsSkeleton rows={6} label="Loading past puzzles" />}
      {days && days.length === 0 && (
        <p>
          No past puzzles yet. <Link to="/play">Play today&apos;s</Link>.
        </p>
      )}
      {days && days.length > 0 && (
        <ul className="archive-list">
          {days.map((day) => (
            <li key={day.date}>
              <Link to={`/puzzles/${day.date}`}>{day.date}</Link>{' '}
              <span className="muted">{CIPHER_INFO[day.cipher]?.name}</span> ·{' '}
              <Link to={`/leaderboard?date=${day.date}`}>leaderboard</Link>
            </li>
          ))}
        </ul>
      )}
    </SectionWrapper>
  );
}
