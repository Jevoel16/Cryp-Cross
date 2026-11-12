import { Link } from 'react-router-dom';
import { TilesSkeleton } from '../Skeleton';
import useLoad from '../../hooks/useLoad';
import { api } from '../../api';
import { formatDuration } from '../../lib/format';
import { LOAD } from '../../lib/loadMachine';

const loadStats = (key, signal) => api('/me/stats', { signal });

export default function Stats() {
  const load = useLoad(loadStats);
  switch (load.status) {
    case LOAD.PENDING:
      return <TilesSkeleton />;
    case LOAD.FAILED:
      return (
        <p className="form-message error" role="alert">
          {load.error}
        </p>
      );
    case LOAD.LOADED: {
      const stats = load.data;
      return (
        <>
          <ul className="stat-tiles">
            <li>
              <span className="stat-value">{stats.solves}</span> puzzles solved
            </li>
            <li>
              <span className="stat-value">{stats.currentStreak}</span> day streak
            </li>
            <li>
              <span className="stat-value">{stats.bestStreak}</span> best streak
            </li>
            <li>
              <span className="stat-value">{formatDuration(stats.bestTimeMs)}</span> best time
            </li>
          </ul>
          {stats.history.length === 0 && (
            <p className="muted">
              No solves yet. <Link to="/play">Play today&apos;s puzzle</Link> to start a streak.
            </p>
          )}
          {stats.history.length > 0 && (
            <>
              <h2>Recent solves</h2>
              <table className="leaderboard">
                <thead>
                  <tr>
                    <th scope="col">Day</th>
                    <th scope="col">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.history.map((s) => (
                    <tr key={s.date}>
                      <td>
                        <Link to={`/leaderboard?date=${s.date}`}>{s.date}</Link>
                      </td>
                      <td>{formatDuration(s.timeMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      );
    }
    default:
      throw new Error(`Unknown load status: ${load.status}`);
  }
}
