import { defineMiddleware } from 'astro:middleware';
import { config as loadDotenv } from 'dotenv';
import { getConnectionString } from '@/lib/postgres-db';
import { getWorkerEnvSync } from '@/lib/cf-env';

loadDotenv();

const LANG_HOME = new Set(['/es', '/fr', '/de', '/es/', '/fr/', '/de/']);

/** Ensure DB URL is on process.env for legacy `pg` callers (Node + CF Hyperdrive). */
export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (LANG_HOME.has(path)) {
    return context.redirect('/', 301);
  }

  const workerEnv = getWorkerEnvSync();
  // Prefer Hyperdrive over any raw DATABASE_URL secret — raw TCP hangs on Workers.
  if (workerEnv?.HYPERDRIVE?.connectionString) {
    process.env.DATABASE_URL = workerEnv.HYPERDRIVE.connectionString;
  } else {
    const cs = getConnectionString(workerEnv);
    if (cs) process.env.DATABASE_URL = process.env.DATABASE_URL || cs;
  }
  // CF secrets live on worker env; hydrate process.env for Node-style callers.
  for (const key of [
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'APP_URL',
    'PATREON_CLIENT_ID',
    'PATREON_CLIENT_SECRET',
    'PATREON_REDIRECT_URI',
    'PATREON_CAMPAIGN_ID',
    'PATREON_CREATOR_ACCESS_TOKEN',
    'PATREON_CREATOR_REFRESH_TOKEN',
  ] as const) {
    const v = workerEnv?.[key];
    if (typeof v === 'string' && v && !process.env[key]) process.env[key] = v;
  }
  return next();
});
