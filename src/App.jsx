import './App.css';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import IdeaPage from './pages/IdeaPage';
import TeamPage from './pages/TeamPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';
import PlayPage from './pages/PlayPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ArchiveListPage from './pages/ArchiveListPage';
import ArchivePage from './pages/ArchivePage';
import AuthProvider from './auth/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { themeColor } from './lib/theme';

// public/theme.js sets data-theme before React loads (saved choice, else the system setting).
const readTheme = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

export default function App() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor(theme));
  }, [theme]);

  // Theme choice is a per-browser convenience, so localStorage is fine; guarded for blocked storage.
  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
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
        <NavBar isDark={theme === 'dark'} onToggleTheme={handleToggleTheme} />
        <main id="content" tabIndex={-1}>
          <ErrorBoundary>
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
          </ErrorBoundary>
        </main>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
