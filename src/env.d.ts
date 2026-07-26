/// <reference types="astro/client" />

type Env = {
  HYPERDRIVE?: { connectionString: string };
  ROUTES_IMAGES?: R2Bucket;
  DATABASE_URL?: string;
  POSTGRES_URL?: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
  SESSION?: KVNamespace;
  // Cloudflare Images / Assets — typed loosely; not used directly in app code yet
  IMAGES?: unknown;
  ASSETS?: unknown;
  PUBLIC_SITE_URL?: string;
};

declare module 'cloudflare:workers' {
  export const env: Env;
}
