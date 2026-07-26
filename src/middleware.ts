import { defineMiddleware } from 'astro:middleware';
import { config as loadDotenv } from 'dotenv';
import { getConnectionString } from '@/lib/postgres-db';

loadDotenv();

/** Ensure DB URL is on process.env for legacy `pg` callers (Node + CF Hyperdrive). */
export const onRequest = defineMiddleware(async (context, next) => {
  const runtimeEnv = context.locals.runtime?.env;
  const cs = getConnectionString(runtimeEnv);
  if (cs) {
    process.env.DATABASE_URL = process.env.DATABASE_URL || cs;
  }
  return next();
});
