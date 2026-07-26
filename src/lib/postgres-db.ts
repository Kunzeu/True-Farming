import { config as loadDotenv } from 'dotenv';
import { Pool } from 'pg';

// ponytail: Astro/Vite SSR often lacks process.env from .env — load once
loadDotenv();

let _pool: Pool | null = null;

function metaEnv(key: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = (import.meta as any)?.env?.[key];
    return typeof v === 'string' ? v : '';
  } catch {
    return '';
  }
}

/** Resolve connection string: Hyperdrive binding (CF) or env (local). */
export function getConnectionString(env?: {
  HYPERDRIVE?: { connectionString: string };
  DATABASE_URL?: string;
  POSTGRES_URL?: string;
}): string {
  return (
    env?.HYPERDRIVE?.connectionString ||
    env?.DATABASE_URL ||
    env?.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    metaEnv('DATABASE_URL') ||
    metaEnv('POSTGRES_URL') ||
    ''
  );
}

export function getPool(env?: {
  HYPERDRIVE?: { connectionString: string };
  DATABASE_URL?: string;
  POSTGRES_URL?: string;
}): Pool {
  const connectionString = getConnectionString(env);
  if (!connectionString) {
    throw new Error('DATABASE_URL / Hyperdrive not configured');
  }
  if (!_pool) {
    // Workers/Hyperdrive: max 1. Remote DBs (Supabase) need SSL; local does not.
    const isLocal =
      /localhost|127\.0\.0\.1/i.test(connectionString) ||
      connectionString.includes('sslmode=disable');
    _pool = new Pool({
      connectionString,
      max: 1,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
    _pool.on('error', (err) => {
      console.error('PostgreSQL connection error:', err);
    });
  }
  return _pool;
}

// Back-compat for `import { pool }` / `import pool`
export const pool = new Proxy({} as Pool, {
  get(_t, prop) {
    const p = getPool();
    const value = (p as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as Function).bind(p) : value;
  },
});

export default pool;
