/**
 * auth.ts (middleware)
 * ---------------------------------------------------------------------------
 * Reads the Authorization header, verifies the JWT, and attaches the user
 * payload to `req.user`. `requireAuth` blocks unauthenticated requests.
 * `optionalAuth` populates `req.user` if a valid token is present but
 * still allows the request through otherwise — used by the public feed
 * so logged-in users can see which memories they've already liked.
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, type AuthTokenPayload } from '../lib/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthTokenPayload;
  }
}

function extractToken(req: Request): string | null {
  const header = req.header('authorization') || req.header('Authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyAuthToken(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
}
