/**
 * Navbar.tsx
 * ---------------------------------------------------------------------------
 * Top navigation bar shown on every page. The brand mark is the
 * SITE.logoIcon (a lucide icon) plus SITE.name from site.config.ts —
 * rename the project there and this updates automatically. Auth-aware:
 * shows Upload + Log out when signed in, Log in + Sign up otherwise.
 */

import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { cn } from '../lib/utils';
import { SITE } from '../lib/site.config';
import { Button } from './ui/button';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const LogoIcon = SITE.logoIcon;

  function handleLogout() {
    logout();
    navigate('/');
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
    );

  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-background/80 border-b">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="inline-flex w-8 h-8 rounded-md bg-primary text-primary-foreground items-center justify-center">
            <LogoIcon className="w-4 h-4" />
          </span>
          <span className="hidden min-[420px]:inline text-lg font-semibold tracking-tight">
            {SITE.name}
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1 min-w-0">
          <NavLink to="/" end className={linkClass}>
            Gallery
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/upload" className={linkClass}>
              Upload
            </NavLink>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-1 sm:gap-2 pl-1.5 sm:pl-2 ml-0.5 sm:ml-1 border-l min-w-0">
              <span className="hidden md:inline text-sm text-muted-foreground truncate max-w-[8rem]">
                {user?.name.split(' ')[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="px-2 sm:px-3">
                Log out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 sm:gap-1 pl-1.5 sm:pl-2 ml-0.5 sm:ml-1 border-l">
              <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
                <NavLink to="/login">Log in</NavLink>
              </Button>
              <Button asChild size="sm" className="px-2 sm:px-3">
                <Link to="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
