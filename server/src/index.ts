/**
 * index.ts
 * ---------------------------------------------------------------------------
 * Entry point for the pixstory backend. Wires together:
 *   - JSON body parser + CORS
 *   - /health             liveness probe used by Elastic Beanstalk
 *   - /api/auth           signup / login
 *   - /api/memories       feed, upload-url, create, like, comment
 *   - 404 + central error handler (must be last)
 *
 * Connects to MongoDB before starting the HTTP listener so that failed DB
 * configuration crashes the process immediately instead of accepting
 * traffic and returning 500s.
 */

import express from 'express';
import cors from 'cors';
import { env } from './lib/env';
import { connectDatabase } from './lib/db';
import authRoutes from './routes/auth';
import memoryRoutes from './routes/memories';
import { notFound, errorHandler } from './middleware/error';

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

  app.get('/health', (_req, res) => {
    res.json({ ok: true, env: env.nodeEnv });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/memories', memoryRoutes);

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
