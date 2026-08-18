import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';
import { gw2Get } from '@/lib/gw2-ids';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let apiKey = searchParams.get('api_key') || request.headers.get('x-api-key') || undefined;
    const userId = searchParams.get('user_id');

    if (!apiKey && userId) {
      try {
        const result = await pool.query('SELECT gw2_api_key AS "gw2ApiKey" FROM users WHERE id = $1', [userId]);
        if (result.rows.length > 0) apiKey = result.rows[0].gw2ApiKey || undefined;
      } catch (error) {
        console.error('Error fetching API key:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    const auth = `access_token=${encodeURIComponent(apiKey)}`;
    const all = await gw2Get(`/characters?ids=all&${auth}`);
    if (all.ok) {
      return NextResponse.json(await all.json(), { headers: { 'Cache-Control': 'no-store' } });
    }

    const list = await gw2Get(`/characters?${auth}`);
    if (!list.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch characters from GW2 API' },
        { status: list.status },
      );
    }

    const names: string[] = await list.json();
    const characters = (
      await Promise.all(
        names.map(async (name) => {
          const res = await gw2Get(`/characters/${encodeURIComponent(name)}?${auth}`);
          return res.ok ? res.json() : null;
        }),
      )
    ).filter(Boolean);

    return NextResponse.json(characters, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error in GET /api/gw2/characters:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
