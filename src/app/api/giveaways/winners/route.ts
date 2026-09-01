import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/postgres-db';
import { getAllGiveaways, getAllGiveawaysWithAdvent, getGiveawayById, getItemInfo } from '../../../../config/giveaways';
import { authorizeAdminRequest } from '@/lib/server/authorize-admin';

export const runtime = 'nodejs';
export const revalidate = 60; // Revalidar cada 1 minuto

// GET /api/giveaways/winners - Get winners
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const giveawayId = searchParams.get('giveawayId');
    const latest = searchParams.get('latest');

    // Obtener configuración de sorteos (incluyendo adviento)
    const configuredGiveaways = getAllGiveawaysWithAdvent(2025);

    let query = `
      SELECT 
        gw.giveaway_id,
        gw.position,
        gw.account_name,
        gw.prize_description,
        gw.prize_value,
        gw.announced_at
      FROM giveaway_winners gw
    `;

    const params: (string | number)[] = [];
    let paramCount = 0;

    if (giveawayId) {
      query += ` WHERE gw.giveaway_id = $${++paramCount}`;
      params.push(giveawayId);
    }

    query += ` ORDER BY gw.announced_at DESC, gw.position ASC`;

    if (latest === 'true') {
      query += ` LIMIT 10`;
    }

    const result = await pool.query(query, params);

    // Combinar datos de ganadores con configuración de sorteos y obtener iconos
    const winners = await Promise.all(result.rows.map(async (row) => {
      const cleanGiveawayId = String(row.giveaway_id).trim();
      // console.log('Looking for giveaway:', cleanGiveawayId);
      const giveaway = getGiveawayById(cleanGiveawayId);

      let itemIcon = null;
      let gemPrize = false;
      let prizeDescription = row.prize_description;
      let isGoldPrize = false;

      // Intentar encontrar el premio en la configuración para obtener el icono
      if (giveaway && giveaway.prizes) {
        const prizeConfig = giveaway.prizes.find(p => p.position == row.position);
        if (prizeConfig) {
          gemPrize = prizeConfig.gemPrize || false;
          isGoldPrize = prizeConfig.icon === 'gold';

          // Override description for gold prizes
          if (isGoldPrize) {
            prizeDescription = `${prizeConfig.quantity || prizeConfig.prize} Gold`;
          }

          if (prizeConfig.itemId) {
            try {
              // Bound time — Workers cancel hung outbound fetches
              const itemInfo = await Promise.race([
                getItemInfo(prizeConfig.itemId),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
              ]);
              if (itemInfo) {
                itemIcon = itemInfo.icon;
              }
            } catch (error) {
              console.error(`Error fetching item info for ${prizeConfig.itemId}:`, error);
            }
          }

          // Fallback si no hay icono
          if (!itemIcon && prizeConfig.icon) {
            const FALLBACK_ICONS: Record<string, string> = {
              'gem': 'https://wiki.guildwars2.com/images/8/88/Gem_%28highres%29.png',
              'package': 'https://wiki.guildwars2.com/images/5/5e/Daily_Achievement_Chest.png',
              'materials': 'https://wiki.guildwars2.com/images/7/75/Trophy_case.png',
              'gold': '/images/expansions/Gold.webp'
            };
            itemIcon = FALLBACK_ICONS[prizeConfig.icon] || FALLBACK_ICONS['package'];
          }
        }
      }

      // Ultimate fallback
      if (!itemIcon && !gemPrize) {
        itemIcon = 'https://wiki.guildwars2.com/images/5/5e/Daily_Achievement_Chest.png';
      }

      return {
        giveawayId: row.giveaway_id,
        giveawayTitle: giveaway?.title || 'Sorteo Desconocido',
        giveawaySlug: giveaway?.slug || 'unknown',
        winnersAnnouncedAt: row.announced_at,
        position: row.position,
        accountName: row.account_name,
        prizeDescription: prizeDescription,
        prizeValue: row.prize_value,
        announcedAt: row.announced_at,
        itemIcon,
        gemPrize
      };
    }));

    return NextResponse.json(
      { winners },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  }
}

// POST /api/giveaways/winners - Announce winners (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y autorización (solo administradores)
    const authResult = await authorizeAdminRequest(request);

    if (!authResult.isAuthorized) {
      console.log('Unauthorized giveaway winners announcement:', authResult.error);
      return NextResponse.json({
        error: 'Unauthorized. Admin access required to announce winners.',
        details: authResult.error
      }, { status: 401 });
    }

    console.log(`Admin user ${authResult.user?.username} announcing giveaway winners`);

    const body = await request.json();
    const { giveawayId, winnersData } = body;

    if (!giveawayId || !winnersData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert winners directly into giveaway_winners table
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const winner of winnersData) {
        await client.query(`
          INSERT INTO giveaway_winners (
            giveaway_id, user_id, account_name, position, 
            prize_description, prize_value, announced_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (giveaway_id, position) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            account_name = EXCLUDED.account_name,
            prize_description = EXCLUDED.prize_description,
            prize_value = EXCLUDED.prize_value,
            announced_at = NOW(),
            updated_at = NOW()
        `, [
          giveawayId,
          winner.user_id,
          winner.account_name,
          winner.position,
          winner.prize_description,
          winner.prize_value
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({
      message: 'Winners announced successfully'
    });
  } catch (error) {
    console.error('Error announcing winners:', error);
    return NextResponse.json(
      { error: 'Failed to announce winners' },
      { status: 500 }
    );
  }
}
