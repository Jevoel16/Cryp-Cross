import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/authContext';

const NAV_ITEMS = [
    { path: '/', label: 'Home' },
    { path: '/play', label: 'Play' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/idea', label: 'Idea' },
    { path: '/team', label: 'Team' },
];

export default function NavBar({ isDark, onToggleTheme }) {
    const location = useLocation();
    const { user, loading } = useAuth();
    // startsWith keeps a tab active on its sub-routes.
    const isActive = (path) =>
        location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

    const items = [
        ...NAV_ITEMS,
        // Hidden while the session check runs so the link doesn't flicker.
        ...(loading ? [] : [user ? { path: '/account', label: user.username } : { path: '/login', label: 'Log in' }]),
    ];

    return (
        <header>
            <nav id="navigator" aria-label="Main">
                <ul className="tabs">
                    {items.map((item) => (
                        <li key={item.path} className="tab-item">
                            <Link to={item.path} className={isActive(item.path) ? 'active' : ''}>
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <button id="themeToggle" onClick={onToggleTheme} aria-label="Toggle light and dark mode">
                {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
        </header>
    );
}
