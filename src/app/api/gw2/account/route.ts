import { NextRequest, NextResponse } from 'next/server';
import { gw2Get } from '@/lib/gw2-ids';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.nextUrl.searchParams.get('api_key') || request.headers.get('x-api-key');
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
