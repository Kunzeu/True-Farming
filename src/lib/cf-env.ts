import { env } from 'cloudflare:workers';

/** Cloudflare Worker bindings. Under Node/`astro dev` the vite alias shims this. */
export async function getWorkerEnv(): Promise<Env | undefined> {
  try {
    return env as Env;
  } catch {
    return undefined;
  }
}

/** Sync access — preferred inside request handlers on Workers. */
export function getWorkerEnvSync(): Env | undefined {
  try {
    return env as Env;
  } catch {
    return undefined;
  }
}
