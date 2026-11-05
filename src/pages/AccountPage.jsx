import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import FormMessage from '../components/FormMessage';
import { ProviderIcon } from '../components/OAuthButtons';
import { OAUTH_ERRORS, PROVIDER_LABELS, oauthStartUrl, useOAuthProviders } from '../lib/oauth';
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

function UsernameForm({ user, setUser }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(user.username);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    const onSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage(null);
        try {
            setUser(await api('/auth/username', { method: 'PUT', body: { username: value } }));
            setEditing(false);
            setMessage({ type: 'success', text: 'Username updated.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setBusy(false);
        }
    };

    if (!editing) {
        return (
            <>
                {user.username}{' '}
                <button type="button" className="link-btn" onClick={() => setEditing(true)}>
                    Change
                </button>
                <FormMessage message={message} />
            </>
        );
    }
    return (
        <form className="inline-form" onSubmit={onSubmit}>
            <label htmlFor="new-username" className="visually-hidden">
                New username
            </label>
            <input
                id="new-username"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                pattern="[A-Za-z0-9_]{3,20}"
                title="3-20 letters, numbers or underscores"
                disabled={busy}
            />
            <button type="submit" className="submit-btn" disabled={busy}>
                Save
            </button>
            <button type="button" className="link-btn" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
            </button>
            <FormMessage message={message} />
        </form>
    );
}

function ConnectedAccounts({ user, setUser }) {
    const providers = useOAuthProviders();
    const [params] = useSearchParams();
    const linked = PROVIDER_LABELS[params.get('linked')];
    const oauthError = OAUTH_ERRORS[params.get('oauth')];
    const [message, setMessage] = useState(() => {
        if (oauthError) return { type: 'error', text: oauthError };
        if (linked) return { type: 'success', text: `${linked} connected. You can now sign in with it.` };
        return null;
    });
    const [busy, setBusy] = useState(false);

    // Show connected providers even if their server config was later removed.
    const shown = [...new Set([...providers, ...user.providers])];
    if (!shown.length) return null;

    const unlink = async (provider) => {
        setBusy(true);
        setMessage(null);
        try {
            setUser(await api(`/auth/oauth/${provider}/unlink`, { method: 'POST' }));
            setMessage({ type: 'success', text: `${PROVIDER_LABELS[provider]} disconnected.` });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <h2>Connected accounts</h2>
            <ul className="connected-accounts">
                {shown.map((p) => {
                    const connected = user.providers.includes(p);
                    return (
                        <li key={p}>
                            <ProviderIcon provider={p} />
                            <span className="connected-name">{PROVIDER_LABELS[p] || p}</span>
                            {connected ? (
                                <button type="button" className="link-btn" onClick={() => unlink(p)} disabled={busy}>
                                    Disconnect
                                </button>
                            ) : (
                                providers.includes(p) && (
                                    <a className="link-btn" href={oauthStartUrl(p, { link: true, from: '/account' })}>
                                        Connect
                                    </a>
                                )
                            )}
                        </li>
                    );
                })}
            </ul>
            {!user.hasPassword && (
                <p className="hint">
                    You sign in with {user.providers.map((p) => PROVIDER_LABELS[p]).join(' or ')}. To add a password, use{' '}
                    <Link to="/forgot-password">Forgot password</Link> with your email.
                </p>
            )}
            <FormMessage message={message} />
        </>
    );
}

export default function AccountPage() {
    usePageMeta({ title: 'Account', description: 'Your Cryp-Cross account, streaks and solve history.', noindex: true });
    const { user, loading, logout, setUser } = useAuth();
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
                <dd>
                    <UsernameForm user={user} setUser={setUser} />
                </dd>
                <dt>Email</dt>
                <dd>
                    {user.email} {user.emailVerified ? '(verified)' : '(not verified yet)'}
                </dd>
            </dl>
            <ConnectedAccounts user={user} setUser={setUser} />
            <Stats />
            <p className="account-actions">
                <button type="button" className="primary-btn" onClick={onLogout}>
                    Log out
                </button>
            </p>
        </SectionWrapper>
    );
}
