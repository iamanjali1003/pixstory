/**
 * Gallery.tsx
 * ---------------------------------------------------------------------------
 * The public feed. Renders a responsive grid of MemoryCard components and
 * a debounced search box that filters by caption / location / activity.
 * Uses react-query so the feed is cached, automatically deduped, and
 * patched in place by like/comment mutations.
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { MemoryCard } from '../components/MemoryCard';
import { useAuth } from '../lib/useAuth';
import { useSiteHead } from '../lib/useSiteHead';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function Gallery() {
  useSiteHead();
  const { isAuthenticated } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(searchInput.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const query = useQuery({
    queryKey: ['memories', debouncedQuery],
    queryFn: () => api.listMemories(debouncedQuery || undefined),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Gallery</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Photos from trips, workshops, and everything in between.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search…"
              className="pl-9"
            />
          </div>
          {isAuthenticated && (
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/upload">
                <Plus />
                New memory
              </Link>
            </Button>
          )}
        </div>
      </section>

      {query.isPending && <SkeletonGrid />}

      {query.isError && (
        <p className="text-destructive">Couldn't load memories. Try refreshing.</p>
      )}

      {query.data && query.data.memories.length === 0 && (
        <EmptyState authed={isAuthenticated} q={debouncedQuery} />
      )}

      {query.data && query.data.memories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {query.data.memories.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden animate-pulse">
          <div className="aspect-square bg-muted" />
          <CardContent className="p-4 space-y-2">
            <div className="h-3 w-1/3 bg-muted rounded" />
            <div className="h-3 w-2/3 bg-muted rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ authed, q }: { authed: boolean; q: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="text-center py-16">
        <p className="text-lg font-medium">
          {q ? `No memories matched "${q}"` : 'No memories yet'}
        </p>
        <p className="text-muted-foreground mt-1">
          {authed
            ? 'Be the first to upload something worth sharing.'
            : 'Sign up to add the first one.'}
        </p>
        <Button asChild className="mt-4">
          <Link to={authed ? '/upload' : '/signup'}>
            {authed ? 'Upload a memory' : 'Create account'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
