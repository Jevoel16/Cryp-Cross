import './App.css';
import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import PlayPage from './pages/PlayPage';
import { RowsSkeleton } from './components/Skeleton';
import AuthProvider from './auth/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { parseTheme, resolveTheme, themeColor } from './lib/theme';

const IdeaPage = lazy(() => import('./pages/IdeaPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ArchiveListPage = lazy(() => import('./pages/ArchiveListPage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));

const pageFallback = (
  <section className="tab-content">
    <RowsSkeleton rows={4} label="Loading the page" />
  </section>
);

// public/theme.js already applied a saved choice before React loaded; this reads the same value.
const readTheme = () => {
  try {
    return parseTheme(localStorage.getItem('theme'));
  } catch {
    return 'system';
  }
};

const darkQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)');

export default function App() {
  const [theme, setTheme] = useState(readTheme);
  const [systemDark, setSystemDark] = useState(() => darkQuery()?.matches ?? false);

  useEffect(() => {
    const query = darkQuery();
    if (!query) return undefined;
    const onChange = (e) => setSystemDark(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeColor(resolveTheme(theme, systemDark)));
  }, [theme, systemDark]);

  // Theme choice is a per-browser convenience, so localStorage is fine; guarded for blocked storage.
  const handleThemeChange = (next) => {
    setTheme(next);
    try {
      if (next === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', next);
    } catch {
      // Storage blocked: the choice just won't persist.
    }
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <NavBar theme={theme} onThemeChange={handleThemeChange} />
        <main id="content" tabIndex={-1}>
          <ErrorBoundary>
            <Suspense fallback={pageFallback}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/play" element={<PlayPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/puzzles" element={<ArchiveListPage />} />
                <Route path="/puzzles/:date" element={<ArchivePage />} />
                <Route path="/idea" element={<IdeaPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/login" element={<LoginPage />} />
                {/* Accounts are created by GitHub/Google sign-in on the login page; old links land there. */}
                <Route path="/signup" element={<Navigate to="/login" replace />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
