import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import { RowsSkeleton } from '../components/Skeleton';
import usePageMeta from '../usePageMeta';
import { api } from '../api';
import { useAuth } from '../auth/authContext';
import { formatDuration } from '../lib/format';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

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
    const [result, setResult] = useState({ key: null, board: null, error: '' });

    useEffect(() => {
        api(`/leaderboard${date ? `?date=${date}` : ''}`).then(
            (board) => setResult({ key: date, board, error: '' }),
            (err) => setResult({ key: date, board: null, error: err.message })
        );
    }, [date]);

    const loaded = result.key === date;
    const { board, error } = loaded ? result : { board: null, error: '' };

    return (
        <SectionWrapper title={board ? `Leaderboard · ${board.date}` : 'Leaderboard'}>
            {error && (
                <p className="form-message error" role="alert">
                    {error}
                </p>
            )}
            {!loaded && <RowsSkeleton label="Loading the leaderboard" />}
            {board && (
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
            )}
            <p className="archive-link">
                <Link to="/puzzles">Past puzzles and their leaderboards</Link>
            </p>
        </SectionWrapper>
    );
}
