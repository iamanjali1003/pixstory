/**
 * error.ts (middleware)
 * ---------------------------------------------------------------------------
 * Central error handler mounted last in the Express pipeline. Anything that
 * `throw`s inside a route or rejects an async handler ends up here. Zod
 * validation errors become 400s; everything else becomes 500. In dev we
 * log the stack; in production we keep the response body terse.
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../lib/env';

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid request',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  if (env.nodeEnv !== 'production') {
    console.error('[error]', err);
  }
  res.status(500).json({ error: message });
}
