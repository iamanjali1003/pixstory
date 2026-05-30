/**
 * useAuth.ts
 * ---------------------------------------------------------------------------
 * React hook that subscribes to the auth store in `auth.ts` so a component
 * automatically re-renders when the user logs in or out. Returns the
 * current user (or null) and convenience login/logout helpers.
 */

import { useEffect, useState, useCallback } from 'react';
import { auth, type AuthUser } from './auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => auth.getUser());

  useEffect(() => {
    const unsubscribe = auth.subscribe(() => setUser(auth.getUser()));
    return () => {
      unsubscribe();
    };
  }, []);

  const login = useCallback((token: string, profile: AuthUser) => {
    auth.setSession(token, profile);
  }, []);

  const logout = useCallback(() => {
    auth.clear();
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    login,
    logout,
  };
}
