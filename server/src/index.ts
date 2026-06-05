/**
 * index.ts
 * ---------------------------------------------------------------------------
 * Entry point for the pixstory backend. Wires together:
 *   - JSON body parser + CORS
 *   - the built React app served as static files (single-origin hosting)
 *   - /health             liveness probe used by Elastic Beanstalk
 *   - /api/auth           signup / login
 *   - /api/memories       feed, upload-url, create, like, comment
 *   - SPA fallback so client-side routes resolve to index.html on refresh
 *   - 404 + central error handler (must be last)
 *
 * The compiled React bundle lives in `../public` relative to this file at
 * runtime (server is compiled to dist/, the client build sits in public/).
 * Serving the frontend and API from the same origin means no CORS and no
 * mixed-content issues in the browser.
 *
 * Connects to MongoDB before starting the HTTP listener so that failed DB
 * configuration crashes the process immediately instead of accepting
 * traffic and returning 500s.
 */

import path from 'path';
import express from 'express';
import cors from 'cors';
import { env } from './lib/env';
import { connectDatabase } from './lib/db';
import authRoutes from './routes/auth';
import memoryRoutes from './routes/memories';
import { notFound, errorHandler } from './middleware/error';

const clientDir = path.join(__dirname, '..', 'public');

async function main(): Promise<void> {
  await connectDatabase();

  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.use(express.static(clientDir));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, env: env.nodeEnv });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/memories', memoryRoutes);

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/health') {
      res.sendFile(path.join(clientDir, 'index.html'));
      return;
    }
    next();
  });

  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`[pixstory] server listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('[pixstory] failed to start:', err);
  process.exit(1);
});
