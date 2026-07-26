import { config as loadDotenv } from 'dotenv';
import { Client, Pool, type QueryResult, type QueryResultRow } from 'pg';
import { getWorkerEnvSync } from '@/lib/cf-env';

loadDotenv();

let _pool: Pool | null = null;
let _poolCs: string | null = null;

function metaEnv(key: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = (import.meta as any)?.env?.[key];
    return typeof v === 'string' ? v : '';
  } catch {
    return '';
  }
}

type DbEnv = {
  HYPERDRIVE?: { connectionString: string };
  DATABASE_URL?: string;
  POSTGRES_URL?: string;
};

export function getConnectionString(env?: DbEnv): string {
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

function isLocalCs(connectionString: string): boolean {
  return (
    /localhost|127\.0\.0\.1/i.test(connectionString) ||
    connectionString.includes('sslmode=disable')
  );
}

function resolveDb(): { cs: string; viaHyperdrive: boolean } {
  const workerEnv = getWorkerEnvSync();
  const viaHyperdrive = Boolean(workerEnv?.HYPERDRIVE?.connectionString);
  const cs = getConnectionString(workerEnv ?? undefined);
  return { cs, viaHyperdrive };
}

function poolConfig(connectionString: string, viaHyperdrive: boolean) {
  // Hyperdrive manages TLS — custom ssl hangs Workers connections.
  if (viaHyperdrive) {
    return {
      connectionString,
      max: 1,
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 10_000,
    };
  }
  return {
    connectionString,
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
    ssl: isLocalCs(connectionString) ? false : { rejectUnauthorized: false },
  };
}

export function getPool(env?: DbEnv): Pool {
  const workerEnv = env ?? getWorkerEnvSync();
  const viaHyperdrive = Boolean(workerEnv?.HYPERDRIVE?.connectionString);
  const connectionString = getConnectionString(workerEnv ?? undefined);
  if (!connectionString) {
    throw new Error('DATABASE_URL / Hyperdrive not configured');
  }
  if (!_pool || _poolCs !== connectionString) {
    void _pool?.end().catch(() => undefined);
    _pool = new Pool(poolConfig(connectionString, viaHyperdrive));
    _poolCs = connectionString;
    _pool.on('error', (err) => {
      console.error('PostgreSQL connection error:', err);
      _pool = null;
      _poolCs = null;
    });
  }
  return _pool;
}

async function queryWithClient<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const { cs, viaHyperdrive } = resolveDb();
  if (!cs) throw new Error('DATABASE_URL / Hyperdrive not configured');

  // Always Client-per-query on Hyperdrive (Cloudflare recommendation).
  if (viaHyperdrive) {
    const client = new Client({ connectionString: cs, connectionTimeoutMillis: 10_000 });
    await client.connect();
    try {
      return await client.query<T>(text, params);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  return getPool().query<T>(text, params);
}

async function connectClient() {
  const { cs, viaHyperdrive } = resolveDb();
  if (!cs) throw new Error('DATABASE_URL / Hyperdrive not configured');

  if (viaHyperdrive) {
    const client = new Client({ connectionString: cs, connectionTimeoutMillis: 10_000 });
    await client.connect();
    return client;
  }

  return getPool().connect();
}

export const pool = new Proxy({} as Pool, {
  get(_t, prop) {
    if (prop === 'query') {
      return (text: string, params?: unknown[]) => queryWithClient(text, params);
    }
    if (prop === 'connect') {
      return () => connectClient();
    }
    const p = getPool();
    const value = (p as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as Function).bind(p) : value;
  },
});

export default pool;
