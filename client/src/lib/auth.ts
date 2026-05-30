/**
 * auth.ts
 * ---------------------------------------------------------------------------
 * Tiny client-side auth helpers. The JWT and the matching user profile
 * are persisted to localStorage so a page refresh keeps the user logged in.
 * `subscribe` lets React components re-render when auth state changes.
 */

const TOKEN_KEY = 'pixstory.token';
const USER_KEY = 'pixstory.user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of listeners) l();
}

export const auth = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  setSession(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    emit();
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    emit();
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
