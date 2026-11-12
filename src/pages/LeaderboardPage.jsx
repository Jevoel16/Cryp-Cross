import { Link, useSearchParams } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import { RowsSkeleton } from '../components/Skeleton';
import usePageMeta from '../usePageMeta';
import useLoad from '../hooks/useLoad';
import { api } from '../api';
import { useAuth } from '../auth/authContext';
import { formatDuration } from '../lib/format';
import { LOAD } from '../lib/loadMachine';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const loadBoard = (date, signal) => api(`/leaderboard${date ? `?date=${date}` : ''}`, { signal });

function Board({ load, date, user }) {
  switch (load.status) {
    case LOAD.PENDING:
      return <RowsSkeleton label="Loading the leaderboard" />;
    case LOAD.FAILED:
      return (
        <p className="form-message error" role="alert">
          {load.error}
        </p>
      );
    case LOAD.LOADED: {
      const board = load.data;
      return (
        <>
          <p>
            {board.solvers === 0
              ? 'Nobody has solved this puzzle yet.'
              : `${board.solvers} ${board.solvers === 1 ? 'player has' : 'players have'} solved this puzzle.`}{' '}
            {!date && <Link to="/play">Play today&apos;s puzzle</Link>}
            {date && <Link to={`/puzzles/${date}`}>See this puzzle</Link>}
          </p>
          {board.entries.length > 0 && (
            <table className="leaderboard">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Player</th>
                  <th scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {board.entries.map((row) => (
                  <tr
                    key={row.rank}
                    className={
                      [row.rank <= 3 ? `podium rank-${row.rank}` : '', user?.username === row.username ? 'me' : '']
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                  >
                    <td>
                      <span className="rank">{row.rank}</span>
                    </td>
                    <td>{row.username}</td>
                    <td>{formatDuration(row.timeMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      );
    }
    default:
      throw new Error(`Unknown load status: ${load.status}`);
  }
}

export default function LeaderboardPage() {
  const [params] = useSearchParams();
  const requested = params.get('date');
  const date = requested && DATE.test(requested) ? requested : '';
  usePageMeta({
    title: date ? `Leaderboard ${date}` : 'Leaderboard',
    description: "The fastest solvers of today's Cryp-Cross cipher crossword. Sign in, solve and see your rank.",
    path: date ? undefined : '/leaderboard',
    noindex: Boolean(date),
  });
  const { user } = useAuth();
  const load = useLoad(loadBoard, date);

  return (
    <SectionWrapper title={load.status === LOAD.LOADED ? `Leaderboard · ${load.data.date}` : 'Leaderboard'}>
      <Board load={load} date={date} user={user} />
      <p className="archive-link">
        <Link to="/puzzles">Past puzzles and their leaderboards</Link>
      </p>
    </SectionWrapper>
  );
}
