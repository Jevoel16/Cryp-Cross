import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import { MenuIcon, MoonIcon, SunIcon } from './Icons';

const NAV_ITEMS = [
  { path: '/play', label: 'Play' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/puzzles', label: 'Archive' },
  { path: '/idea', label: 'How it works' },
  { path: '/team', label: 'Team' },
];

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
