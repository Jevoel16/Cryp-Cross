import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/authContext';

// Reminds signed-in, unverified players to confirm their email before they can submit.
export default function VerifyBanner() {
    const { user } = useAuth();
    const [status, setStatus] = useState('');

    if (!user || user.emailVerified) return null;

    const resend = async () => {
        setStatus('Sending...');
        try {
            await api('/auth/resend-verification', { method: 'POST' });
            setStatus('Sent. Check your inbox.');
        } catch (error) {
            setStatus(error.message);
        }
    };

    return (
        <div className="notice" role="status">
            <span>Check your inbox to verify <strong>{user.email}</strong> so you can submit puzzles.</span>{' '}
            <button type="button" className="link-btn" onClick={resend}>Resend email</button>
            {status && <span className="notice-status"> {status}</span>}
        </div>
    );
}
