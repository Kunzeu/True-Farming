import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';

export const runtime = 'nodejs';

// Endpoint interno para persistir vinculación de Patreon
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';

    console.log('Patreon link request:', { origin, referer });

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

    // Determinar el rol objetivo basado en tier/status
    const tierNormalized = (patreonTier || '').trim().toLowerCase();
    const isPaid = patreonStatus === 'active_patron' && tierNormalized !== '' && tierNormalized !== 'free';
    // Mapeo a roles internos: Bronze, Silver, Gold, Legends
    const mapRoleFromTier = (tierName: string): string => {
      if (!tierName) return 'user';
      const name = tierName.toLowerCase();
      if (/(legend|legends)/.test(name)) return 'legends';
      if (/gold/.test(name)) return 'gold';
      if (/silver/.test(name)) return 'silver';
      if (/bronze/.test(name)) return 'bronze';
      // Si es de pago pero no coincide exactamente, asignar el mínimo de pago
      return 'bronze';
    };
    const nextRole = isPaid ? mapRoleFromTier(tierNormalized) : 'user';

    // Actualizar por email con role condicional (no degradar admins/moderators)
    const result = await pool.query(
      `UPDATE users
       SET patreon_id = $1,
           patreon_tier = $2::text,
           patreon_status = $3::text,
           patreon_active = CASE WHEN $3::text = 'active_patron' THEN TRUE ELSE FALSE END,
           is_active = CASE WHEN $3::text = 'active_patron' THEN TRUE ELSE is_active END,
           role = CASE WHEN role IN ('admin','moderator') THEN role ELSE $5 END,
           updated_at = NOW()
       WHERE ($6::text IS NOT NULL AND id::text = $6) OR ($4::text IS NOT NULL AND email = $4)
       RETURNING id, email, username, role, is_active as "isActive",
                 created_at as "createdAt", updated_at as "updatedAt",
                 discord_id as "discordId", gw2_api_key as "gw2ApiKey",
                 patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus", patreon_active as "patreonActive", preferences`,
      [patreonId, patreonTier ?? null, patreonStatus ?? null, email ?? null, nextRole, userId ?? null]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const row = result.rows[0];

    // Auto-enroll en sorteos activos si es patreon activo con tier válido
    if (patreonStatus === 'active_patron' && tierNormalized && tierNormalized !== 'free') {
      try {
        // Importar la función de auto-enrollment
        const { autoEnrollPatrons } = await import('@/lib/server/patreon-auto-enroll');
        const { updateGiveawayStatuses } = await import('@/config/giveaways');

        // Obtener sorteos activos
        const activeGiveaways = updateGiveawayStatuses().filter((g) => g.status === 'active');
        const giveawayIds = activeGiveaways.map(g => g.id);

        if (giveawayIds.length > 0) {
          // Inscribir al usuario en los sorteos activos
          const enrollResult = await autoEnrollPatrons({
            giveawayIds,
            userId: row.id
          });

          console.log(`Auto-enrolled user ${row.id} in ${enrollResult.inserted.length} giveaways:`, enrollResult.inserted);
        }
      } catch (enrollError) {
        // No fallar la vinculación si falla el auto-enrollment
        console.error('Error auto-enrolling patron in giveaways:', enrollError);
      }
    }

    return NextResponse.json({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  } catch (error) {
    console.error('Error linking Patreon:', error);
    return NextResponse.json({
      error: 'Error linking Patreon',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}


