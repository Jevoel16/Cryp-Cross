// API base URL. Set VITE_API_URL at build time when the API lives on another origin.
// Empty means same origin: in development Vite proxies /api to the Express API,
// which keeps the session cookie first-party.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Public site URL, used for canonical links. Falls back to the current origin.
export const SITE_URL = (
    import.meta.env.VITE_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')
).replace(/\/$/, '');
