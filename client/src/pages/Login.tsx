/**
 * Login.tsx
 * ---------------------------------------------------------------------------
 * Email + password sign-in page. On success it stores the JWT via the
 * auth helper and redirects either to the page the user was originally
 * trying to reach (passed through Location state) or to the gallery.
 */

import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/useAuth';
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

export default function Login() {
  useSiteHead('Log in');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.login({ email, password }),
    onSuccess: (data) => {
      login(data.token, data.user);
      const redirectTo = (location.state as { from?: string } | null)?.from || '/';
      navigate(redirectTo, { replace: true });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="mx-auto max-w-sm py-8 sm:py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Log in to share new memories.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {mutation.error && (
              <p className="text-sm text-destructive">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : 'Something went wrong'}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-3 items-stretch">
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? 'Logging in…' : 'Log in'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              New here?{' '}
              <Link to="/signup" className="font-medium underline text-foreground">
                Create an account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
