/** Cloudflare Worker bindings. Undefined under Node / `astro dev`. */
export async function getWorkerEnv(): Promise<Env | undefined> {
  try {
    const { env } = await import('cloudflare:workers');
    return env as Env;
  } catch {
    return undefined;
  }
}
