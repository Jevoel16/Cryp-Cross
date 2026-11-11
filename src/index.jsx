import React from 'react';
import ReactDOM from 'react-dom/client';
// Self-hosted fonts (bundled by Vite), so the CSP can keep font-src 'self'.
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import { Analytics } from '@vercel/analytics/react';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    {/* Cookieless page views; served from /_vercel/insights on the same origin, so CSP 'self' still holds. */}
    <Analytics />
  </React.StrictMode>,
);
