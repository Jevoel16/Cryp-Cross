import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import usePageMeta from '../usePageMeta';
import { api } from '../api';
import { useAuth } from '../auth/authContext';

const MESSAGES = {
    working: 'Verifying your email...',
    done: 'Your email is verified. You can now submit puzzles.',
    failed: 'This link is invalid or has expired. Log in and use "Resend email" to get a new one.',
    missing: 'This page needs the link from your verification email.',
};

export default function VerifyEmailPage() {
    usePageMeta({ title: 'Verify Email', description: 'Confirm your Cryp-Cross email address.', noindex: true });
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { refresh } = useAuth();
    const [token] = useState(() => params.get('token') || '');
    const [state, setState] = useState(token ? 'working' : 'missing');
    const sent = useRef(false);

    useEffect(() => {
        // Single-use token: guard against StrictMode's double effect run, and drop it from the address bar.
        if (!token || sent.current) return;
        sent.current = true;
        navigate('/verify-email', { replace: true });
        api('/auth/verify-email', { method: 'POST', body: { token } })
            .then(() => {
                setState('done');
                refresh();
            })
            .catch(() => setState('failed'));
    }, [token, navigate, refresh]);

    return (
        <SectionWrapper title="Verify Email">
            <p role="status">{MESSAGES[state]}</p>
            {state === 'done' && (
                <p>
                    <Link to="/play" className="primary-btn">Play today&apos;s puzzle</Link>
                </p>
            )}
        </SectionWrapper>
    );
}
