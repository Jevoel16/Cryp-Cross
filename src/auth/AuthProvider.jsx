import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { AuthContext } from './authContext';

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // State is only set once the request settles, never synchronously inside the effect.
    const loadUser = () =>
        api('/auth/me')
            .then(setUser, () => setUser(null))
            .finally(() => setLoading(false));

    const refresh = useCallback(() => loadUser(), []);

    useEffect(() => {
        loadUser();
    }, []);

    const logout = useCallback(async () => {
        try {
            await api('/auth/logout', { method: 'POST' });
        } finally {
            setUser(null);
        }
    }, []);

    const value = useMemo(() => ({ user, loading, setUser, refresh, logout }), [user, loading, refresh, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
