/**
 * MemoryCard.tsx
 * ---------------------------------------------------------------------------
 * One card in the gallery grid. Renders the image, metadata (caption,
 * location, activity), a like button (lucide Heart icon), and an inline
 * comment thread. All mutations (like, comment) go through react-query
 * and patch the cached feed in place so the UI stays in sync without a
 * refetch.
 */

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MapPin, Hash, MessageSquare, Send } from 'lucide-react';
import { api, type Memory } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { cn } from '../lib/utils';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface Props {
  memory: Memory;
}

export function MemoryCard({ memory }: Props) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  function patchFeed(updated: Memory) {
    queryClient.setQueriesData<{ memories: Memory[] }>({ queryKey: ['memories'] }, (old) => {
      if (!old) return old;
      return {
        memories: old.memories.map((m) => (m.id === updated.id ? updated : m)),
      };
    });
  }

  const likeMutation = useMutation({
    mutationFn: () => api.toggleLike(memory.id),
    onSuccess: ({ memory: updated }) => patchFeed(updated),
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => api.addComment(memory.id, text),
    onSuccess: ({ memory: updated }) => {
      patchFeed(updated);
      setCommentText('');
    },
  });

  function handleSubmitComment(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || commentMutation.isPending) return;
    commentMutation.mutate(commentText.trim());
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-muted overflow-hidden">
        <img
          src={memory.imageUrl}
          alt={memory.caption || 'A pixstory memory'}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      <CardContent className="p-4 pt-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{memory.userName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(memory.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => isAuthenticated && likeMutation.mutate()}
            disabled={!isAuthenticated || likeMutation.isPending}
            title={isAuthenticated ? 'Like' : 'Log in to like'}
            className={cn('gap-1.5 h-8', !isAuthenticated && 'opacity-60')}
          >
            <Heart className={cn('size-4', memory.likedByMe && 'fill-current')} />
            <span className="tabular-nums text-xs">{memory.likeCount}</span>
          </Button>
        </div>

        {memory.caption && (
          <p className="text-sm leading-snug break-words">{memory.caption}</p>
        )}

        {(memory.location || memory.activity) && (
          <div className="flex flex-wrap gap-1.5 min-w-0">
            {memory.location && (
              <Badge variant="secondary" className="max-w-full">
                <MapPin />
                <span className="truncate">{memory.location}</span>
              </Badge>
            )}
            {memory.activity && (
              <Badge variant="outline" className="max-w-full">
                <Hash />
                <span className="truncate">{memory.activity}</span>
              </Badge>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments((s) => !s)}
          className="gap-1.5 h-7 px-2 -mx-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <MessageSquare />
          {memory.comments.length === 0
            ? showComments
              ? 'Hide comments'
              : 'Add a comment'
            : showComments
              ? `Hide ${memory.comments.length} comment${memory.comments.length === 1 ? '' : 's'}`
              : `View ${memory.comments.length} comment${memory.comments.length === 1 ? '' : 's'}`}
        </Button>

        {showComments && (
          <div className="space-y-2 pt-1 border-t">
            {memory.comments.map((c) => (
              <div key={c.id} className="text-sm break-words">
                <span className="font-medium">{c.userName}</span>{' '}
                <span className="text-muted-foreground">{c.text}</span>
              </div>
            ))}
            {isAuthenticated ? (
              <form onSubmit={handleSubmitComment} className="flex gap-2 pt-1">
                <Input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment…"
                  maxLength={500}
                  className="h-9"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentText.trim() || commentMutation.isPending}
                >
                  <Send />
                </Button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Log in to leave a comment.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
