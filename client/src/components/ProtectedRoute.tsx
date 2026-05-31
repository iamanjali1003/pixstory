/**
 * ProtectedRoute.tsx
 * ---------------------------------------------------------------------------
 * Wrapper for routes that require an authenticated user. If no session
 * exists it redirects to /login and preserves the original destination
 * so the login page can send the user back after a successful sign-in.
 */

import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../lib/useAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
