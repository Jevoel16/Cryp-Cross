import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import FormMessage from '../components/FormMessage';
import OAuthButtons from '../components/OAuthButtons';
import { OAUTH_ERRORS, useOAuthProviderState } from '../lib/oauth';
import usePageMeta from '../usePageMeta';
import { api } from '../api';
import { useAuth } from '../auth/authContext';

export default function LoginPage() {
  usePageMeta({
    title: 'Log In',
    description: 'Sign in to Cryp-Cross with GitHub or Google to solve and submit the daily cipher crossword.',
    noindex: true,
  });
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { providers, status } = useOAuthProviderState();
  const [form, setForm] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const oauthError = OAUTH_ERRORS[params.get('oauth')];
  const [message, setMessage] = useState(() => (oauthError ? { type: 'error', text: oauthError } : null));
  const from = location.state?.from;
  const safeFrom = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/play';

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      setUser(await api('/auth/login', { method: 'POST', body: form }));
      // Back to where the player came from (e.g. /play), never an external URL.
      navigate(safeFrom, { replace: true });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setBusy(false);
    }
  };

  return (
    <SectionWrapper title="Log In" className="auth-section">
      <OAuthButtons from={safeFrom} divider="or log in with your username" />
      {status === 'ready' && !providers.length && (
        <p className="hint">Sign-in providers are not set up on this server yet.</p>
      )}
      {status === 'error' && <p className="hint">Couldn&apos;t load the sign-in options. Refresh to try again.</p>}
      <form className="auth-form" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            value={form.username}
            onChange={onChange}
            disabled={busy}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={onChange}
            disabled={busy}
          />
        </div>
        <button type="submit" className="secondary-btn" disabled={busy}>
          {busy ? 'Logging in...' : 'Log in'}
        </button>
        <FormMessage message={message} />
      </form>
      <p className="auth-links">
        New here? GitHub or Google creates your account (no email is stored). Username login works once you set a
        password on your Account page; forgot it? Sign in with GitHub or Google and set a new one within 10 minutes.
      </p>
    </SectionWrapper>
  );
}
