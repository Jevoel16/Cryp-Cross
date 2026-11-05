import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
    { path: '/', label: 'Home' },
    { path: '/idea', label: 'Idea' },
    { path: '/team', label: 'Team' },
];

export default function NavBar({ isDark, onToggleTheme }) {
    const location = useLocation();
    // startsWith keeps a tab active on its sub-routes.
    const isActive = (path) =>
        location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

    return (
        <header>
            <nav id="navigator">
                <ul className="tabs">
                    {NAV_ITEMS.map((item) => (
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
