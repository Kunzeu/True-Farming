const GW2 = 'https://api.guildwars2.com/v2';
const CHUNK = 200;

export async function gw2Get(path: string): Promise<Response> {
  let retries = 0;
  while (true) {
    const res = await fetch(`${GW2}${path}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.status !== 429 || retries >= 3) return res;
    const wait = Number(res.headers.get('retry-after') || 0) * 1000 || 2 ** retries * 400;
    await new Promise((r) => setTimeout(r, wait || 400));
    retries += 1;
  }
}

/** GW2 404s the whole batch if one id is missing; 400 if the list is too long. */
export async function fetchByIds<T extends { id: number }>(
  endpoint: 'items' | 'commerce/prices' | 'currencies',
  ids: number[],
  extra = '',
): Promise<T[]> {
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
  const out: T[] = [];

  async function go(batch: number[]) {
    if (!batch.length) return;
    const res = await gw2Get(`/${endpoint}?ids=${batch.join(',')}${extra}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) out.push(...data);
      return;
    }
    if (batch.length === 1) return;
    const mid = Math.ceil(batch.length / 2);
    await Promise.all([go(batch.slice(0, mid)), go(batch.slice(mid))]);
  }

  const jobs: Promise<void>[] = [];
  for (let i = 0; i < unique.length; i += CHUNK) {
    jobs.push(go(unique.slice(i, i + CHUNK)));
  }
  await Promise.all(jobs);
  return out;
}

export type Gw2ItemInfo = {
  id: number;
  name?: string;
  icon?: string;
  rarity?: string;
  type?: string;
};

export async function fetchItemsByIds(ids: number[], lang = 'en'): Promise<Map<number, Gw2ItemInfo>> {
  const items = await fetchByIds<Gw2ItemInfo>('items', ids, `&lang=${lang}`);
  return new Map(items.map((item) => [item.id, item]));
}
