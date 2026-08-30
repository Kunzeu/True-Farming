/** GW2 desde el navegador (IP del usuario). Cloudflare Workers reciben 429 de ArenaNet. */

import { gw2CacheGet, gw2CacheKey, gw2CacheSet, GW2_CACHE_TTL } from '@/lib/gw2-client-cache';

const GW2 = 'https://api.guildwars2.com/v2';
const CHUNK = 200;

const ENDPOINT_TTL: Record<string, number> = {
  items: GW2_CACHE_TTL.items,
  'commerce/prices': GW2_CACHE_TTL.prices,
  currencies: GW2_CACHE_TTL.currencies,
};

type KeyCache = { userId: string; key: string };
let keyCache: KeyCache | null = null;
const keyInflight = new Map<string, Promise<string | null>>();

export function clearUserGw2ApiKeyCache(userId?: string) {
  if (!userId || keyCache?.userId === userId) keyCache = null;
}

export async function fetchUserGw2ApiKey(userId: string): Promise<string | null> {
  if (keyCache?.userId === userId && keyCache.key) return keyCache.key;

  let inflight = keyInflight.get(userId);
  if (!inflight) {
    inflight = (async () => {
      try {
        const res = await fetch(`/api/users/${userId}/api-key?user_id=${userId}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        const key = typeof data.apiKey === 'string' ? data.apiKey.trim() : '';
        if (key.length < 10) return null;
        keyCache = { userId, key };
        try {
          localStorage.setItem('gw2_api_key', key);
        } catch {
          /* ignore */
        }
        return key;
      } finally {
        keyInflight.delete(userId);
      }
    })();
    keyInflight.set(userId, inflight);
  }
  return inflight;
}

async function gw2Fetch(url: string): Promise<Response> {
  let retries = 0;
  while (true) {
    const res = await fetch(url);
    if (res.status !== 429 || retries >= 3) return res;
    const wait = Number(res.headers.get('retry-after') || 0) * 1000 || 2 ** retries * 400;
    await new Promise((r) => setTimeout(r, wait || 400));
    retries += 1;
  }
}

export async function gw2AuthedGet(path: string, apiKey: string): Promise<Response> {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const sep = clean.includes('?') ? '&' : '?';
  return gw2Fetch(`${GW2}${clean}${sep}access_token=${encodeURIComponent(apiKey)}`);
}

export async function gw2PublicGet(path: string): Promise<Response> {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return gw2Fetch(`${GW2}${clean}`);
}

export async function fetchGw2ByIds<T extends { id: number }>(
  endpoint: 'items' | 'currencies' | 'commerce/prices',
  ids: number[],
  extra = '',
): Promise<T[]> {
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
  const ttl = ENDPOINT_TTL[endpoint] ?? GW2_CACHE_TTL.items;
  const cached: T[] = [];
  const missing: number[] = [];

  for (const id of unique) {
    const hit = gw2CacheGet<T>(gw2CacheKey(endpoint, id, extra));
    if (hit) cached.push(hit);
    else missing.push(id);
  }

  if (!missing.length) return cached;

  const fetched: T[] = [];

  async function go(batch: number[]) {
    if (!batch.length) return;
    const res = await gw2PublicGet(`/${endpoint}?ids=${batch.join(',')}${extra}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const item of data as T[]) {
          gw2CacheSet(gw2CacheKey(endpoint, item.id, extra), item, ttl);
          fetched.push(item);
        }
      }
      return;
    }
    if (batch.length === 1) return;
    const mid = Math.ceil(batch.length / 2);
    await Promise.all([go(batch.slice(0, mid)), go(batch.slice(mid))]);
  }

  const jobs: Promise<void>[] = [];
  for (let i = 0; i < missing.length; i += CHUNK) {
    jobs.push(go(missing.slice(i, i + CHUNK)));
  }
  await Promise.all(jobs);
  return [...cached, ...fetched];
}

export function readStoredGw2AccountName(): string | null {
  try {
    const raw = sessionStorage.getItem('gw2_account_info');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { name?: string };
    return typeof parsed?.name === 'string' ? parsed.name : null;
  } catch {
    return null;
  }
}

export function storeGw2AccountInfo(id: string, name: string) {
  try {
    sessionStorage.setItem('gw2_account_info', JSON.stringify({ id, name }));
  } catch {
    /* ignore */
  }
}
