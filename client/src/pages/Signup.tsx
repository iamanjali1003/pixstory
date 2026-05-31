/**
 * Signup.tsx
 * ---------------------------------------------------------------------------
 * Account creation page. Mirrors Login.tsx but adds a name field and calls
 * the /signup endpoint. After a successful signup the user is logged in
 * automatically and redirected to the gallery.
 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function Signup() {
  useSiteHead('Sign up');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.signup({ name, email, password }),
    onSuccess: (data) => {
      login(data.token, data.user);
      navigate('/', { replace: true });
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
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Start collecting moments worth remembering.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
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
              {mutation.isPending ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/login" className="font-medium underline text-foreground">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
