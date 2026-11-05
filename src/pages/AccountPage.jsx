import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import usePageMeta from '../usePageMeta';
import { api } from '../api';
import { useAuth } from '../auth/authContext';
import { formatDuration } from '../lib/format';

function Stats() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api('/me/stats').then(setStats, (err) => setError(err.message));
    }, []);

    if (error) return <p className="form-message error">{error}</p>;
    if (!stats) return <p>Loading stats...</p>;
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

export default function AccountPage() {
    usePageMeta({ title: 'Account', description: 'Your Cryp-Cross account, streaks and solve history.', noindex: true });
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    if (loading) {
        return (
            <SectionWrapper title="Account">
                <p>Loading...</p>
            </SectionWrapper>
        );
    }
    if (!user) return <Navigate to="/login" replace state={{ from: '/account' }} />;

    const onLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <SectionWrapper title="Account">
            <dl className="account-details">
                <dt>Username</dt>
                <dd>{user.username}</dd>
                <dt>Email</dt>
                <dd>
                    {user.email} {user.emailVerified ? '(verified)' : '(not verified yet)'}
                </dd>
            </dl>
            <Stats />
            <p className="account-actions">
                <button type="button" className="primary-btn" onClick={onLogout}>
                    Log out
                </button>
            </p>
        </SectionWrapper>
    );
}
