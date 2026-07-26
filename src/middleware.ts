import { defineMiddleware } from 'astro:middleware';
import { config as loadDotenv } from 'dotenv';
import { getConnectionString } from '@/lib/postgres-db';
import { getWorkerEnv } from '@/lib/cf-env';

loadDotenv();

const LANG_HOME = new Set(['/es', '/fr', '/de', '/es/', '/fr/', '/de/']);

/** Ensure DB URL is on process.env for legacy `pg` callers (Node + CF Hyperdrive). */
export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (LANG_HOME.has(path)) {
    return context.redirect('/', 301);
  }

  const workerEnv = await getWorkerEnv();
  const cs = getConnectionString(workerEnv);
  if (cs) {
    process.env.DATABASE_URL = process.env.DATABASE_URL || cs;
  }
  return next();
});
