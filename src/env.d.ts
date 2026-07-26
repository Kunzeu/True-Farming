/// <reference types="astro/client" />

type Env = {
  HYPERDRIVE?: { connectionString: string };
  ROUTES_IMAGES?: R2Bucket;
  DATABASE_URL?: string;
  POSTGRES_URL?: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
};

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
