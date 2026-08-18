import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';
import { fetchByIds, fetchItemsByIds, gw2Get } from '@/lib/gw2-ids';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Price = { id: number; buys?: { unit_price: number }; sells?: { unit_price: number } };
const inflight = new Map<string, Promise<unknown>>();

export async function GET(request: NextRequest) {
  const start = performance.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const apiKeyParam = searchParams.get('api_key') || request.headers.get('x-api-key');
    const userId = searchParams.get('user_id');
    let apiKey = apiKeyParam || undefined;
    if (!apiKey && userId) {
      try {
        const result = await pool.query('SELECT gw2_api_key AS "gw2ApiKey" FROM users WHERE id = $1', [userId]);
        if (result.rows.length > 0) apiKey = result.rows[0].gw2ApiKey || undefined;
      } catch {}
    }
    const rawLang = (searchParams.get('lang') || '').toLowerCase();
    const lang = ['en', 'es', 'de', 'fr'].includes(rawLang) ? rawLang : 'en';

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    const key = `${apiKey}:${lang}`;
    if (inflight.has(key)) {
      const data = await inflight.get(key)!;
      return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
    }

    const fetchPromise = (async () => {
      const response = await gw2Get(`/account/bank?access_token=${encodeURIComponent(apiKey)}`);
      if (!response.ok) {
        throw new Error(`GW2 API error: ${response.status} ${response.statusText}`);
      }
      const bankData: Array<{ id: number; count: number } | null> = await response.json();
      const itemIds = bankData.filter(Boolean).map((item) => item!.id);
      const [itemsMap, prices] = await Promise.all([
        fetchItemsByIds(itemIds, lang),
        fetchByIds<Price>('commerce/prices', itemIds),
      ]);
      const idToPrice = new Map(prices.map((p) => [p.id, p]));
      return bankData.map((bankItem, index) => {
        if (!bankItem) return null;
        const itemDetails = itemsMap.get(bankItem.id);
        return {
          ...bankItem,
          name: itemDetails?.name || `Item ${bankItem.id}`,
          icon: itemDetails?.icon,
          rarity: itemDetails?.rarity,
          type: itemDetails?.type,
          slot: index,
          price: idToPrice.get(bankItem.id),
        };
      });
    })();

    inflight.set(key, fetchPromise);
    try {
      const data = await fetchPromise;
      console.log(`[API] /gw2/bank ejecutado en ${(performance.now() - start).toFixed(2)}ms`);
      return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
    } finally {
      inflight.delete(key);
    }
  } catch (error) {
    console.error(`[API] /gw2/bank Error después de ${(performance.now() - start).toFixed(2)}ms:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch bank data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
