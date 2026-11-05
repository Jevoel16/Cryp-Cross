import { useState } from 'react';
import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import FormMessage from '../components/FormMessage';
import OAuthButtons from '../components/OAuthButtons';
import usePageMeta from '../usePageMeta';
import { api } from '../api';
import { useAuth } from '../auth/authContext';

export default function SignupPage() {
    usePageMeta({ title: 'Sign Up', description: 'Create a free Cryp-Cross account to save progress, submit solves and join the leaderboard.', noindex: true });
    const { setUser } = useAuth();
    const [form, setForm] = useState({ email: '', username: '', password: '' });
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const [done, setDone] = useState(false);

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage(null);
        try {
            const result = await api('/auth/signup', { method: 'POST', body: form });
            // No user comes back when the email was already registered (that address gets an email instead).
            if (result && result.username) setUser(result);
            setDone(true);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setBusy(false);
        }
    };

    if (done) {
        return (
            <SectionWrapper title="Check Your Email">
                <p>
                    We sent a link to <strong>{form.email}</strong>. Open it to verify your account, then come back to{' '}
                    <Link to="/play">today&apos;s puzzle</Link>.
                </p>
            </SectionWrapper>
        );
    }

    return (
        <SectionWrapper title="Sign Up" className="auth-section">
            <OAuthButtons from="/play" verb="Sign up" />
            <form className="auth-form" onSubmit={onSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={onChange} disabled={busy} />
                </div>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input id="username" name="username" autoComplete="username" required pattern="[A-Za-z0-9_]{3,20}" title="3-20 letters, numbers or underscores" value={form.username} onChange={onChange} disabled={busy} />
                    <small>Shown on the leaderboard. 3-20 letters, numbers or underscores.</small>
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={form.password} onChange={onChange} disabled={busy} />
                    <small>At least 10 characters.</small>
                </div>
                <button type="submit" className="submit-btn" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
                <FormMessage message={message} />
            </form>
            <p className="auth-links">Already have an account? <Link to="/login">Log in</Link></p>
        </SectionWrapper>
    );
}
