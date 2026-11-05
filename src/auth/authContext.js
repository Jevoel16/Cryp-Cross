import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

// { user, loading, setUser, refresh, logout }; user is null when signed out.
export function useAuth() {
    const value = useContext(AuthContext);
    if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
    return value;
}
