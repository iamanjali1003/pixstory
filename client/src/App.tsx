/**
 * App.tsx
 * ---------------------------------------------------------------------------
 * Root component. Defines the route table for the SPA:
 *   /             Gallery (public)
 *   /upload       Upload   (requires auth via ProtectedRoute)
 *   /login        Login    (public)
 *   /signup       Signup   (public)
 *   *             404 fallback
 *
 * Mounts the persistent Navbar and the footer (which reads its label from
 * the central SITE config). Page-level <head> tags come from each page's
 * useSiteHead() call.
 */

import { Routes, Route, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SITE } from './lib/site.config';
import { Button } from './components/ui/button';
import Gallery from './pages/Gallery';
import Upload from './pages/Upload';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer
        className="py-6 px-4 text-center text-xs text-muted-foreground"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {SITE.name} · Built by <a href={SITE.author.url} target="_blank" rel="noopener noreferrer">{SITE.author.name}</a>
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <div className="text-center py-16 sm:py-20 px-4 space-y-4">
      <h1 className="text-2xl sm:text-3xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">That URL doesn't lead anywhere.</p>
      <Button asChild>
        <Link to="/">Back to the gallery</Link>
      </Button>
    </div>
  );
}
