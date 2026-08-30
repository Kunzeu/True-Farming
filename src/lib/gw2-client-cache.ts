const memory = new Map<string, { data: unknown; expires: number }>();

export const GW2_CACHE_TTL = {
  items: 15 * 60 * 1000,
  prices: 5 * 60 * 1000,
  currencies: 60 * 60 * 1000,
  materials: 24 * 60 * 60 * 1000,
  accountPage: 3 * 60 * 1000,
} as const;

export function gw2CacheGet<T>(key: string): T | null {
  const entry = memory.get(key);
  if (!entry || entry.expires < Date.now()) {
    if (entry) memory.delete(key);
    return null;
  }
  return entry.data as T;
}

export function gw2CacheSet(key: string, data: unknown, ttlMs: number) {
  memory.set(key, { data, expires: Date.now() + ttlMs });
}

export function gw2CacheKey(endpoint: string, id: number, extra = '') {
  return `${endpoint}:${id}${extra}`;
}

export function readSessionCache<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { expires: number; data: T };
    if (!parsed?.expires || parsed.expires < Date.now()) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeSessionCache<T>(key: string, data: T, ttlMs: number) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ expires: Date.now() + ttlMs, data }),
    );
  } catch {
    /* quota / private mode */
  }
}
