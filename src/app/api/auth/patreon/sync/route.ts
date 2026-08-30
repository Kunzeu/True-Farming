import { NextRequest, NextResponse } from 'next/server';
import { syncPatreonMembershipForUser } from '@/lib/server/patreon-sync';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, patreonId } = body as {
      userId?: string;
      email?: string;
      patreonId?: string;
    };

    if (!patreonId || (!userId && !email)) {
      return NextResponse.json({ error: 'patreonId y userId o email son requeridos' }, { status: 400 });
    }

    const result = await syncPatreonMembershipForUser({ patreonId, userId, email });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Patreon sync error:', error);
    return NextResponse.json(
      { error: 'Error sincronizando Patreon', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
