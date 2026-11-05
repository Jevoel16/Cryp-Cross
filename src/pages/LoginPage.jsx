import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import FormMessage from '../components/FormMessage';
import OAuthButtons from '../components/OAuthButtons';
import { OAUTH_ERRORS } from '../lib/oauth';
import usePageMeta from '../usePageMeta';
import { api } from '../api';
import { useAuth } from '../auth/authContext';

export default function LoginPage() {
    usePageMeta({ title: 'Log In', description: 'Log in to Cryp-Cross to solve and submit the daily cipher crossword.', noindex: true });
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
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
            <OAuthButtons from={safeFrom} />
            <form className="auth-form" onSubmit={onSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={onChange} disabled={busy} />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input id="password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={onChange} disabled={busy} />
                </div>
                <button type="submit" className="submit-btn" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
                <FormMessage message={message} />
            </form>
            <p className="auth-links">
                <Link to="/forgot-password">Forgot your password?</Link> · New here? <Link to="/signup">Create an account</Link>
            </p>
        </SectionWrapper>
    );
}
