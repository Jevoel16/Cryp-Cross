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
    busy: 'Too many sign-in attempts from your network. Please wait a few minutes and try again.',
};

let cached = null;

// Keeps only providers this frontend knows how to show.
export function parseProviders(list) {
    return Array.isArray(list) ? list.filter((p) => Object.hasOwn(PROVIDER_LABELS, p)) : [];
}

// The enabled providers, fetched once per page load; status is 'loading', 'ready' or 'error'.
export function useOAuthProviderState() {
    const [state, setState] = useState(() => (cached ? { providers: cached, status: 'ready' } : { providers: [], status: 'loading' }));
    useEffect(() => {
        if (cached) return;
        api('/auth/providers').then(
            (list) => {
                cached = parseProviders(list);
                setState({ providers: cached, status: 'ready' });
            },
            () => setState({ providers: [], status: 'error' })
        );
    }, []);
    return state;
}

export function useOAuthProviders() {
    return useOAuthProviderState().providers;
}

export function oauthStartUrl(provider, { from, link } = {}) {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (link) query.set('link', '1');
    const qs = query.toString();
    return `${API_BASE_URL}/api/auth/oauth/${provider}${qs ? `?${qs}` : ''}`;
}
