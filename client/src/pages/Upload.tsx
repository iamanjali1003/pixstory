/**
 * Upload.tsx
 * ---------------------------------------------------------------------------
 * Three-step upload flow that never sends image bytes through the backend:
 *
 *   1. Ask the backend for a presigned S3 PUT URL.
 *   2. PUT the file from the browser straight to S3.
 *   3. POST the metadata (caption / location / activity + s3Key) to /api/memories.
 *
 * On success the gallery cache is invalidated so the new memory appears
 * the next time the user visits the Gallery page.
 */

import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useSiteHead } from '../lib/useSiteHead';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 10 * 1024 * 1024;

export default function Upload() {
  useSiteHead('New memory');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [activity, setActivity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] || null;
    setError('');
    if (!picked) {
      setFile(null);
      setPreviewUrl('');
      return;
    }
    if (!ACCEPTED_TYPES.has(picked.type)) {
      setError('Please pick a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError('That image is larger than 10 MB.');
      return;
    }
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Pick an image first.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const ticket = await api.createUploadUrl({
        contentType: file.type,
        fileExtension: ext,
      });
      await api.uploadFileToS3(ticket.uploadUrl, file);
      await api.createMemory({
        s3Key: ticket.s3Key,
        caption,
        location,
        activity,
      });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl py-6 sm:py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>New memory</CardTitle>
          <CardDescription>
            Share something from a trip, workshop, or any other moment worth keeping.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Photo</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed rounded-xl p-3 sm:p-4 text-center hover:bg-secondary transition-colors"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="max-h-56 sm:max-h-72 mx-auto rounded-lg object-contain"
                  />
                ) : (
                  <div className="py-8 sm:py-10 text-muted-foreground">
                    <ImagePlus className="size-8 mx-auto mb-2 opacity-60" />
                    <p className="font-medium text-foreground">Click to pick an image</p>
                    <p className="text-xs mt-1 px-2">
                      JPEG, PNG, WebP, or GIF · up to 10 MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={280}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity">Activity</Label>
                <Input
                  id="activity"
                  type="text"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  maxLength={80}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="gap-3">
            <Button type="submit" disabled={submitting || !file}>
              {submitting ? 'Uploading…' : 'Share memory'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
