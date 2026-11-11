import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import FormMessage from '../components/FormMessage';
import OAuthButtons from '../components/OAuthButtons';
import { OAUTH_ERRORS, useOAuthProviderState } from '../lib/oauth';
import usePageMeta from '../usePageMeta';
import { api } from '../api';
import { useAuth } from '../auth/authContext';
import useSubmitState from '../hooks/useSubmitState';
import { SUBMIT, idleSubmit } from '../lib/submitMachine';

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
  const [params] = useSearchParams();
  const oauthError = OAUTH_ERRORS[params.get('oauth')];
  const { busy, message, run } = useSubmitState(
    oauthError ? { status: SUBMIT.ERROR, message: oauthError } : idleSubmit,
  );
  const from = location.state?.from;
  const safeFrom = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/play';

  // Stays null when the demo account is off or the request fails; the page works without it.
  const [demo, setDemo] = useState(null);
  useEffect(() => {
    api('/auth/demo').then(setDemo, () => setDemo(null));
  }, []);

  const logIn = (credentials) =>
    run(async () => {
      setUser(await api('/auth/login', { method: 'POST', body: credentials }));
      // Back to where the player came from (e.g. /play), never an external URL.
      navigate(safeFrom, { replace: true });
    });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    logIn(form);
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
      <div className="demo-box">
        {demo && (
          <>
            <h2>Just looking?</h2>
            <p>
              Use the demo account: username <code>{demo.username}</code>, password <code>{demo.password}</code>. It
              saves progress and times your solve, but isn&apos;t ranked.
            </p>
            <button type="button" className="secondary-btn" onClick={() => logIn(demo)} disabled={busy}>
              Try the demo account
            </button>
          </>
        )}
      </div>
      <p className="auth-links">
        New here? GitHub or Google creates your account (no email is stored). Username login works once you set a
        password on your Account page; forgot it? Sign in with GitHub or Google and set a new one within 10 minutes.
      </p>
    </SectionWrapper>
  );
}
