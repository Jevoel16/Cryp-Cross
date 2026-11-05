import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import FormMessage from '../components/FormMessage';
import usePageMeta from '../usePageMeta';
import { api } from '../api';

export default function ResetPasswordPage() {
    usePageMeta({ title: 'Reset Password', description: 'Choose a new Cryp-Cross password.', noindex: true });
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [token] = useState(() => params.get('token') || '');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const [done, setDone] = useState(false);

    // Keep the token in memory only, not in the address bar or history.
    useEffect(() => {
        if (params.get('token')) navigate('/reset-password', { replace: true });
    }, [params, navigate]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage(null);
        try {
            await api('/auth/reset-password', { method: 'POST', body: { token, password } });
            setDone(true);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setBusy(false);
        }
    };

    if (!token) {
        return (
            <SectionWrapper title="Reset Password">
                <p>This page needs the link from your reset email. <Link to="/forgot-password">Request a new one</Link>.</p>
            </SectionWrapper>
        );
    }
    if (done) {
        return (
            <SectionWrapper title="Password Updated">
                <p>Your password was changed and other sessions were signed out. <Link to="/login">Log in</Link> with the new one.</p>
            </SectionWrapper>
        );
    }
    return (
        <SectionWrapper title="Reset Password">
            <form className="auth-form" onSubmit={onSubmit}>
                <div className="form-group">
                    <label htmlFor="password">New password</label>
                    <input id="password" type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} />
                    <small>At least 10 characters.</small>
                </div>
                <button type="submit" className="submit-btn" disabled={busy}>{busy ? 'Saving...' : 'Set new password'}</button>
                <FormMessage message={message} />
            </form>
        </SectionWrapper>
    );
}
