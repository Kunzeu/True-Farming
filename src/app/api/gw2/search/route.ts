import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';
import { fetchItemsByIds, gw2Get } from '@/lib/gw2-ids';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Slot = {
  id: number;
  count: number;
  location: string;
  category: 'bank' | 'character' | 'storage' | 'shared';
  character?: string;
  bag?: number;
  slot?: number;
};

async function resolveApiKey(request: NextRequest): Promise<string | undefined> {
  const fromQuery = request.nextUrl.searchParams.get('api_key') || request.headers.get('x-api-key') || undefined;
  if (fromQuery) return fromQuery;
  const userId = request.nextUrl.searchParams.get('user_id');
  if (!userId) return undefined;
  try {
    const result = await pool.query('SELECT gw2_api_key AS "gw2ApiKey" FROM users WHERE id = $1', [userId]);
    return result.rows[0]?.gw2ApiKey || undefined;
  } catch {
    return undefined;
  }
}

function json<T>(res: PromiseSettledResult<Response>): Promise<T | null> {
  if (res.status !== 'fulfilled' || !res.value.ok) return Promise.resolve(null);
  return res.value.json().catch(() => null);
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = await resolveApiKey(request);
    const lang = ['en', 'es', 'de', 'fr'].includes((request.nextUrl.searchParams.get('lang') || '').toLowerCase())
      ? request.nextUrl.searchParams.get('lang')!.toLowerCase()
      : 'en';
    const scope = request.nextUrl.searchParams.get('scope') || 'all';

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    const auth = `access_token=${encodeURIComponent(apiKey)}`;
    const slots: Slot[] = [];

    const [bankRes, matsRes, sharedRes, namesRes] = await Promise.allSettled([
      scope === 'all' || scope === 'bank' ? gw2Get(`/account/bank?${auth}`) : Promise.resolve(new Response(null, { status: 204 })),
      scope === 'all' || scope === 'storage' ? gw2Get(`/account/materials?${auth}`) : Promise.resolve(new Response(null, { status: 204 })),
      scope === 'all' || scope === 'bank' ? gw2Get(`/account/inventory?${auth}`) : Promise.resolve(new Response(null, { status: 204 })),
      scope === 'all' || scope === 'characters' ? gw2Get(`/characters?${auth}`) : Promise.resolve(new Response(null, { status: 204 })),
    ]);

    const bank = await json<Array<{ id: number; count: number } | null>>(bankRes);
    bank?.forEach((item, index) => {
      if (item?.id) {
        slots.push({ id: item.id, count: item.count, location: `search.bankSlot ${index + 1}`, category: 'bank', slot: index + 1 });
      }
    });

    const mats = await json<Array<{ id: number; count: number }>>(matsRes);
    mats?.forEach((item) => {
      if (item?.id && item.count > 0) {
        slots.push({ id: item.id, count: item.count, location: 'search.materialStorage', category: 'storage' });
      }
    });

    const shared = await json<Array<{ id: number; count: number } | null>>(sharedRes);
    shared?.forEach((item, index) => {
      if (item?.id) {
        slots.push({ id: item.id, count: item.count, location: 'Shared inventory', category: 'shared', slot: index + 1 });
      }
    });

    const names = await json<string[]>(namesRes);
    if (Array.isArray(names) && names.length) {
      const inventories = await Promise.all(
        names.map(async (name) => {
          const res = await gw2Get(`/characters/${encodeURIComponent(name)}/inventory?${auth}`);
          if (!res.ok) return { name, bags: [] as Array<{ inventory?: Array<{ id: number; count: number } | null> } | null> };
          const data = await res.json().catch(() => null);
          return { name, bags: data?.bags || [] };
        }),
      );
      for (const { name, bags } of inventories) {
        bags.forEach((bag, bagIndex) => {
          bag?.inventory?.forEach((item, slotIndex) => {
            if (item?.id) {
              slots.push({
                id: item.id,
                count: item.count,
                location: `${name} - search.characterBag ${bagIndex + 1}`,
                category: 'character',
                character: name,
                bag: bagIndex + 1,
                slot: slotIndex + 1,
              });
            }
          });
        });
      }
    }

    const details = await fetchItemsByIds(slots.map((s) => s.id), lang);
    const results = slots
      .map((slot) => {
        const item = details.get(slot.id);
        if (!item?.name) return null;
        return {
          id: slot.id,
          name: item.name,
          icon: item.icon,
          count: slot.count,
          location: slot.location,
          rarity: item.rarity,
          category: slot.category,
          character: slot.character,
          bag: slot.bag,
          slot: slot.slot,
        };
      })
      .filter(Boolean);

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
