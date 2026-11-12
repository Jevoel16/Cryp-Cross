import { useState } from 'react';
import FormMessage from '../FormMessage';
import useSubmitState from '../../hooks/useSubmitState';
import { api } from '../../api';
import { describedBy } from '../../lib/forms';
import { PROVIDER_LABELS, oauthStartUrl } from '../../lib/oauth';

// Password for username login; needs the current one unless signed in via GitHub/Google in the last 10 minutes.
export default function PasswordForm({ user, setUser, refresh }) {
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
              {...describedBy(message, 'password-message')}
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
            {...describedBy(message, 'password-message')}
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
        <FormMessage message={message} id="password-message" />
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
