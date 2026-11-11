import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { api } from '../api';
import { AuthContext } from './authContext';
import { AUTH_EVENT, AUTH_STATUS, authReducer, initialAuth } from './authMachine';

export default function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuth);

  useEffect(() => {
    api('/auth/me').then(
      (user) => dispatch({ type: AUTH_EVENT.LOADED, user }),
      (error) => dispatch({ type: AUTH_EVENT.FAILED, error: error.message }),
    );
  }, []);

  // Rejects when the session can't be read, so callers can keep what they show.
  const refresh = useCallback(async () => {
    const user = await api('/auth/me');
    dispatch({ type: AUTH_EVENT.REFRESHED, user });
  }, []);

  const setUser = useCallback((next) => dispatch({ type: AUTH_EVENT.SET_USER, next }), []);

  // Only signs out here once the server has ended the session.
  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' });
    dispatch({ type: AUTH_EVENT.LOGGED_OUT });
  }, []);

  const value = useMemo(
    () => ({ ...state, loading: state.status === AUTH_STATUS.LOADING, setUser, refresh, logout }),
    [state, setUser, refresh, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
