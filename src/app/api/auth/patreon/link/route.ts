import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';
import { syncPatreonMembershipForUser } from '@/lib/server/patreon-sync';

export const runtime = 'nodejs';

// Endpoint interno para persistir vinculación de Patreon
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';

    const allowedOrigin = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('true-farming.com');
    const allowedReferer = referer.includes('/auth/patreon') || referer.includes('/profile') || referer.includes('localhost') || referer.includes('true-farming.com');

    if (!allowedOrigin && !allowedReferer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { email, userId, patreonId, patreonTier, patreonStatus } = body as {
      email?: string;
      userId?: string;
      patreonId?: string;
      patreonTier?: string | null;
      patreonStatus?: 'active_patron' | 'declined_patron' | 'former_patron' | null;
    };

    if (!patreonId || (!email && !userId)) {
      return NextResponse.json({ error: 'patreonId y email o userId son requeridos' }, { status: 400 });
    }

    const synced = await syncPatreonMembershipForUser({
      patreonId,
      userId,
      email,
      oauthFallback: { patreonTier, patreonStatus },
    });

    const result = await pool.query(
      `SELECT id, email, username, role, is_active as "isActive",
              created_at as "createdAt", updated_at as "updatedAt",
              discord_id as "discordId", gw2_api_key as "gw2ApiKey",
              patreon_id as "patreonId", patreon_tier as "patreonTier",
              patreon_status as "patreonStatus", patreon_active as "patreonActive", preferences
       FROM users
       WHERE patreon_id = $1
       LIMIT 1`,
      [patreonId],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const tierNormalized = (synced.patreonTier || '').trim().toLowerCase();

    // Auto-enroll en sorteos activos si es patreon activo con tier válido
    if (synced.isPaid && tierNormalized && tierNormalized !== 'free') {
      try {
        const { autoEnrollPatrons } = await import('@/lib/server/patreon-auto-enroll');
        const { updateGiveawayStatuses } = await import('@/config/giveaways');

        const activeGiveaways = updateGiveawayStatuses().filter((g) => g.status === 'active');
        const giveawayIds = activeGiveaways.map((g) => g.id);

        if (giveawayIds.length > 0) {
          const enrollResult = await autoEnrollPatrons({
            giveawayIds,
            userId: row.id,
          });

          console.log(`Auto-enrolled user ${row.id} in ${enrollResult.inserted.length} giveaways:`, enrollResult.inserted);
        }
      } catch (enrollError) {
        console.error('Error auto-enrolling patron in giveaways:', enrollError);
      }
    }

    return NextResponse.json({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  } catch (error) {
    console.error('Error linking Patreon:', error);
    return NextResponse.json({
      error: 'Error linking Patreon',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
