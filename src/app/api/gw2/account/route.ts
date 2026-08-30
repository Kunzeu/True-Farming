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
      } catch {
        /* ignore */
      }
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    const response = await gw2Get(`/account?access_token=${encodeURIComponent(apiKey)}`);
    if (!response.ok) {
      return NextResponse.json(
        { error: `GW2 API error: ${response.status} ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(
      {
        id: data.id,
        account_id: data.account_id,
        name: data.name,
        world: data.world,
        guilds: data.guilds,
        access: data.access,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[API] /gw2/account', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
