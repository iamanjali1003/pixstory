/**
 * jwt.ts
 * ---------------------------------------------------------------------------
 * Wraps `jsonwebtoken` so the rest of the app never imports it directly.
 * `signAuthToken` produces the token returned on signup/login.
 * `verifyAuthToken` decodes a token from the Authorization header and
 * returns the payload, or throws if invalid/expired.
 */

import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from './env';

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }
  return {
    userId: String(decoded.userId),
    email: String(decoded.email),
  };
}
