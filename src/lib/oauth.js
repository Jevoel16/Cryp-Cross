import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { api } from '../api';

export const PROVIDER_LABELS = { github: 'GitHub', google: 'Google' };

// Shown after the API redirects back with ?oauth=<code>.
export const OAUTH_ERRORS = {
    denied: 'Sign-in was cancelled.',
    state: 'That sign-in link expired or was opened in another browser. Please try again.',
    failed: "We couldn't complete that sign-in. Please try again.",
    linked: 'That account is already connected to a different Cryp-Cross user.',
};

let cached = null;

// The enabled providers, fetched once per page load.
export function useOAuthProviders() {
    const [providers, setProviders] = useState(cached || []);
    useEffect(() => {
        if (cached) return;
        api('/auth/providers').then(
            (list) => {
                cached = Array.isArray(list) ? list : [];
                setProviders(cached);
            },
            () => setProviders([])
        );
    }, []);
    return providers;
}

export function oauthStartUrl(provider, { from, link } = {}) {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (link) query.set('link', '1');
    const qs = query.toString();
    return `${API_BASE_URL}/api/auth/oauth/${provider}${qs ? `?${qs}` : ''}`;
}
