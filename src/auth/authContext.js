import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

// { status, user, error, loading, setUser, refresh, logout }; user is null unless status is signedIn.
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
