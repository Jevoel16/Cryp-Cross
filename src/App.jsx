import './App.css';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import IdeaPage from './pages/IdeaPage';
import TeamPage from './pages/TeamPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AccountPage from './pages/AccountPage';
import PlayPage from './pages/PlayPage';
import AuthProvider from './auth/AuthProvider';
import VerifyBanner from './components/VerifyBanner';

// Theme choice is a per-browser convenience, so localStorage is fine; guarded for blocked storage.
function readTheme() {
    try {
        return localStorage.getItem('theme') === 'dark';
    } catch {
        return false;
    }
}

export default function App() {
    const [isDark, setIsDark] = useState(readTheme);

    useEffect(() => {
        document.body.classList.toggle('dark-mode', isDark);
    }, [isDark]);

    const handleToggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        try {
            localStorage.setItem('theme', next ? 'dark' : 'light');
        } catch {
            // Storage blocked: the choice just won't persist.
        }
    };

    return (
        <BrowserRouter>
            <AuthProvider>
                <NavBar isDark={isDark} onToggleTheme={handleToggleTheme} />
                <main>
                    <VerifyBanner />
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/play" element={<PlayPage />} />
                        <Route path="/idea" element={<IdeaPage />} />
                        <Route path="/team" element={<TeamPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/account" element={<AccountPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>
                <Footer />
            </AuthProvider>
        </BrowserRouter>
    );
}
