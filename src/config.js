// API base URL; empty means same origin (Vite proxies /api in development).
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Public site URL, used for canonical links. Falls back to the current origin.
export const SITE_URL = (
    import.meta.env.VITE_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')
).replace(/\/$/, '');
