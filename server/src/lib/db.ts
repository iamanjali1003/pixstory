/**
 * db.ts
 * ---------------------------------------------------------------------------
 * Connects to MongoDB Atlas using Mongoose. Exported as a single async
 * function called once from `index.ts` at boot. Mongoose maintains its own
 * connection pool, so the rest of the app just imports models — there is
 * no per-request connect/disconnect.
 */

import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10_000,
  });
  console.log('[db] connected to MongoDB');
}
