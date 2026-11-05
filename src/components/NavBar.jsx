import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/authContext';

const NAV_ITEMS = [
    { path: '/play', label: 'Play' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/puzzles', label: 'Archive' },
    { path: '/idea', label: 'How it works' },
    { path: '/team', label: 'Team' },
];

function SunIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
                d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
                d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function MenuIcon({ open }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
        </svg>
    );
}

export default function NavBar({ isDark, onToggleTheme }) {
    const location = useLocation();
    const { user, loading } = useAuth();
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);

    // Sub-routes (e.g. /puzzles/2026-11-01) keep their tab active.
    const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    return (
        <header className="site-header">
            <div className="header-inner">
                <Link to="/" className="brand" onClick={close} aria-label="Cryp-Cross home">
                    <img src="/img/logo-72.webp" width="25" height="36" alt="" />
                    <span className="brand-name" aria-hidden="true">
                        Cryp<span className="brand-dash">-</span>Cross
                    </span>
                </Link>
                <nav id="navigator" aria-label="Main" className={open ? 'open' : undefined}>
                    <ul className="tabs">
                        {NAV_ITEMS.map((item) => (
                            <li key={item.path} className="tab-item">
                                <Link
                                    to={item.path}
                                    className={isActive(item.path) ? 'active' : undefined}
                                    aria-current={isActive(item.path) ? 'page' : undefined}
                                    onClick={close}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="header-actions">
                    {/* Hidden while the session check runs so the link does not flicker. */}
                    {!loading &&
                        (user ? (
                            <Link to="/account" className="user-chip" onClick={close} title="Your account">
                                <span className="user-avatar" aria-hidden="true">
                                    {user.username.slice(0, 1).toUpperCase()}
                                </span>
                                <span className="user-name">{user.username}</span>
                            </Link>
                        ) : (
                            <Link to="/login" className="nav-login" onClick={close}>
                                Log in
                            </Link>
                        ))}
                    <button
                        id="themeToggle"
                        type="button"
                        className="icon-btn"
                        onClick={onToggleTheme}
                        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                        title={isDark ? 'Light theme' : 'Dark theme'}
                    >
                        {isDark ? <SunIcon /> : <MoonIcon />}
                    </button>
                    <button
                        type="button"
                        className="icon-btn menu-btn"
                        onClick={() => setOpen((o) => !o)}
                        aria-expanded={open}
                        aria-controls="navigator"
                        aria-label={open ? 'Close menu' : 'Open menu'}
                    >
                        <MenuIcon open={open} />
                    </button>
                </div>
            </div>
        </header>
    );
}
