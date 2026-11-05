// API base URL. Set VITE_API_URL at build time for production.
// Without it, production builds call the API on the same origin as the site.
const API_BASE_URL = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? '' : 'http://localhost:5000')
).replace(/\/$/, '');

// Public site URL, used for canonical links. Falls back to the current origin.
export const SITE_URL = (
    import.meta.env.VITE_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')
).replace(/\/$/, '');

export const API_ENDPOINTS = {
    PROJECTS: `${API_BASE_URL}/api/projects`,
    PROJECT_BY_ID: (id) => `${API_BASE_URL}/api/projects/${encodeURIComponent(id)}`,
};

export default API_BASE_URL;
