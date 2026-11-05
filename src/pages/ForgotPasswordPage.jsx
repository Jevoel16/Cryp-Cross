import { useState } from 'react';
import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import FormMessage from '../components/FormMessage';
import usePageMeta from '../usePageMeta';
import { api } from '../api';

export default function ForgotPasswordPage() {
    usePageMeta({ title: 'Forgot Password', description: 'Get a link to reset your Cryp-Cross password.', noindex: true });
    const [email, setEmail] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    const onSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const res = await api('/auth/forgot-password', { method: 'POST', body: { email } });
            setMessage({ type: 'success', text: res.message });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setBusy(false);
        }
    };

    return (
        <SectionWrapper title="Forgot Password">
            <form className="auth-form" onSubmit={onSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
                </div>
                <button type="submit" className="submit-btn" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</button>
                <FormMessage message={message} />
            </form>
            <p className="auth-links"><Link to="/login">Back to log in</Link></p>
        </SectionWrapper>
    );
}
