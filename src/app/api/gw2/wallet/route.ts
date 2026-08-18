import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';
import { fetchByIds, gw2Get } from '@/lib/gw2-ids';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const start = performance.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    let apiKey = searchParams.get('api_key') || request.headers.get('x-api-key') || undefined;
    const userId = searchParams.get('user_id');

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

    const response = await gw2Get(`/account/wallet?access_token=${encodeURIComponent(apiKey)}`);
    if (!response.ok) {
      throw new Error(`GW2 API error: ${response.status} ${response.statusText}`);
    }

    const walletData: Array<{ id: number; value: number }> = await response.json();
    const currencies = await fetchByIds<{ id: number; name: string; icon: string; description: string; order: number }>(
      'currencies',
      walletData.map((w) => w.id),
      `&lang=${lang}`,
    );

    console.log(`[API] /gw2/wallet ejecutado en ${(performance.now() - start).toFixed(2)}ms`);
    return NextResponse.json(
      { wallet: walletData, currencies },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error(`[API] /gw2/wallet Error después de ${(performance.now() - start).toFixed(2)}ms:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
