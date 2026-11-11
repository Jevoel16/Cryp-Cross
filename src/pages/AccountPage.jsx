import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import { RowsSkeleton, TilesSkeleton } from '../components/Skeleton';
import FormMessage from '../components/FormMessage';
import { ProviderIcon } from '../components/OAuthButtons';
import { OAUTH_ERRORS, PROVIDER_LABELS, oauthStartUrl, useOAuthProviders } from '../lib/oauth';
import usePageMeta from '../usePageMeta';
import { api } from '../api';
import { useAuth } from '../auth/authContext';
import { AUTH_STATUS } from '../auth/authMachine';
import useSubmitState from '../hooks/useSubmitState';
import { SUBMIT, idleSubmit } from '../lib/submitMachine';
import { formatDuration } from '../lib/format';

function Stats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/me/stats').then(setStats, (err) => setError(err.message));
  }, []);

  if (error) return <p className="form-message error">{error}</p>;
  if (!stats) return <TilesSkeleton />;
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

function UsernameForm({ user, setUser }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(user.username);
  const { busy, message, run, reset } = useSubmitState();

  const onSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      setUser(await api('/auth/username', { method: 'PUT', body: { username: value } }));
      setEditing(false);
      return 'Username updated.';
    });
  };

  // Cancel drops the typed name and any error with it.
  const onCancel = () => {
    setValue(user.username);
    reset();
    setEditing(false);
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
        {busy ? 'Saving...' : 'Save'}
      </button>
      <button type="button" className="link-btn" onClick={onCancel} disabled={busy}>
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
  // The result of a connect attempt comes back in the URL, so it starts as a finished submit.
  const { busy, message, run } = useSubmitState(
    oauthError
      ? { status: SUBMIT.ERROR, message: oauthError }
      : linked
        ? { status: SUBMIT.SUCCESS, message: `${linked} connected. You can now sign in with it.` }
        : idleSubmit,
  );

  // Show connected providers even if their server config was later removed.
  const shown = [...new Set([...providers, ...user.providers])];
  if (!shown.length) return null;

  const unlink = (provider) =>
    run(async () => {
      setUser(await api(`/auth/oauth/${provider}/unlink`, { method: 'POST' }));
      return `${PROVIDER_LABELS[provider]} disconnected.`;
    });

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
      <FormMessage message={message} />
    </>
  );
}

// Password for username login; needs the current one unless signed in via GitHub/Google in the last 10 minutes.
function PasswordForm({ user, setUser, refresh }) {
  const needsCurrent = user.hasPassword && !user.canSetPasswordWithoutCurrent;
  const [form, setForm] = useState({ password: '', currentPassword: '' });
  const { busy, message, run } = useSubmitState();

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const error = await run(async () => {
      const body = { password: form.password };
      if (needsCurrent) body.currentPassword = form.currentPassword;
      const updated = await api('/auth/password', { method: 'PUT', body });
      setUser({ ...updated, canSetPasswordWithoutCurrent: false });
      setForm({ password: '', currentPassword: '' });
      return `Password saved. You can now log in as ${updated.username}.`;
    });
    // A 403 means the sign-in window closed: reload the session so the right fields show.
    if (error?.status === 403) await refresh().catch(() => {});
  };

  return (
    <>
      <h2>{user.hasPassword ? 'Change password' : 'Add a password'}</h2>
      <p className="hint">
        {user.hasPassword
          ? 'Log in with your username and this password, or with a connected account.'
          : 'Optional: add a password to also log in with your username.'}
        {!user.canSetPasswordWithoutCurrent && !user.hasPassword && (
          <>
            {' '}
            For safety,{' '}
            <a href={oauthStartUrl(user.providers[0], { from: '/account' })}>
              sign in again with {PROVIDER_LABELS[user.providers[0]]}
            </a>{' '}
            first.
          </>
        )}
      </p>
      <form className="auth-form" onSubmit={onSubmit}>
        {needsCurrent && (
          <div className="form-group">
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={form.currentPassword}
              onChange={onChange}
              disabled={busy}
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            value={form.password}
            onChange={onChange}
            disabled={busy}
          />
        </div>
        <button type="submit" className="submit-btn" disabled={busy}>
          {busy ? 'Saving...' : 'Save password'}
        </button>
        <FormMessage message={message} />
      </form>
      {needsCurrent && user.providers.length > 0 && (
        <p className="hint">
          Forgot it?{' '}
          <a href={oauthStartUrl(user.providers[0], { from: '/account' })}>
            Sign in again with {PROVIDER_LABELS[user.providers[0]]}
          </a>
          , then set a new one here within 10 minutes.
        </p>
      )}
      {needsCurrent && !user.providers.length && (
        <p className="hint">
          Connect GitHub or Google above so you can recover your account if you forget this password.
        </p>
      )}
    </>
  );
}

export default function AccountPage() {
  usePageMeta({ title: 'Account', description: 'Your Cryp-Cross account, streaks and solve history.', noindex: true });
  const { status, user, error, logout, refresh, setUser: replaceUser } = useAuth();
  // API answers carry the public profile only; keep session-only flags from /me.
  const setUser = (next) => replaceUser((current) => ({ ...current, ...next }));
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');
  const [retryError, setRetryError] = useState('');

  const onLogout = async () => {
    setLogoutError('');
    try {
      await logout();
      navigate('/');
    } catch (err) {
      setLogoutError(`You are still signed in: ${err.message}`);
    }
  };

  switch (status) {
    case AUTH_STATUS.LOADING:
      return (
        <SectionWrapper title="Account">
          <RowsSkeleton rows={3} label="Loading your account" />
        </SectionWrapper>
      );
    case AUTH_STATUS.ERROR:
      return (
        <SectionWrapper title="Account">
          <div className="form-message error" role="alert">
            <p>Your account didn&apos;t load. {retryError || error}</p>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => refresh().catch((err) => setRetryError(err.message))}
            >
              Try again
            </button>
          </div>
        </SectionWrapper>
      );
    case AUTH_STATUS.SIGNED_OUT:
      return <Navigate to="/login" replace state={{ from: '/account' }} />;
    case AUTH_STATUS.SIGNED_IN:
      return (
        <SectionWrapper title="Account">
          <dl className="account-details">
            <dt>Username</dt>
            <dd>
              <UsernameForm user={user} setUser={setUser} />
            </dd>
          </dl>
          <ConnectedAccounts user={user} setUser={setUser} />
          <PasswordForm user={user} setUser={setUser} refresh={refresh} />
          <Stats />
          <p className="account-actions">
            <button type="button" className="secondary-btn" onClick={onLogout}>
              Log out
            </button>
          </p>
          {logoutError && (
            <p className="form-message error" role="alert">
              {logoutError}
            </p>
          )}
        </SectionWrapper>
      );
    default:
      throw new Error(`Unknown auth status: ${status}`);
  }
}
