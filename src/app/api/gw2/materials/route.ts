import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';
import { fetchItemsByIds, gw2Get } from '@/lib/gw2-ids';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    const response = await gw2Get(`/account/materials?access_token=${encodeURIComponent(apiKey)}`);
    if (!response.ok) {
      throw new Error(`GW2 API error: ${response.status} ${response.statusText}`);
    }

    const materialsData: Array<{ id: number; count: number; category?: number }> = await response.json();
    const held = materialsData.filter((m) => m && m.id && m.count > 0);
    const itemsMap = await fetchItemsByIds(held.map((m) => m.id), lang);

    const enriched = held.map((storageMaterial) => {
      const item = itemsMap.get(storageMaterial.id);
      return {
        ...storageMaterial,
        name: item?.name || `Item ${storageMaterial.id}`,
        icon: item?.icon,
        rarity: item?.rarity,
      };
    });

    console.log(`[API] /gw2/materials ejecutado en ${(performance.now() - start).toFixed(2)}ms`);
    return NextResponse.json(enriched, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error(`[API] /gw2/materials Error después de ${(performance.now() - start).toFixed(2)}ms:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch materials data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
