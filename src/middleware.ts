import { defineMiddleware } from 'astro:middleware';
import { config as loadDotenv } from 'dotenv';
import { getConnectionString } from '@/lib/postgres-db';
import { getWorkerEnv } from '@/lib/cf-env';

loadDotenv();

/** Ensure DB URL is on process.env for legacy `pg` callers (Node + CF Hyperdrive). */
export const onRequest = defineMiddleware(async (_context, next) => {
  const workerEnv = await getWorkerEnv();
  const cs = getConnectionString(workerEnv);
  if (cs) {
    process.env.DATABASE_URL = process.env.DATABASE_URL || cs;
  }
  return next();
});
