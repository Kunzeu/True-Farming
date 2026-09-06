import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/postgres-db';
import { getGiveawayById, getAllGiveawaysWithAdvent, getItemInfo } from '../../../../config/giveaways';
import { authorizeAdminRequest } from '@/lib/server/authorize-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y autorización (solo administradores)
    const authResult = await authorizeAdminRequest(request);

    // Logging detallado para diagnóstico
    console.log('=== AUTHORIZATION DEBUG ===');
    console.log('Is Authorized:', authResult.isAuthorized);
    console.log('User:', authResult.user);
    console.log('Error:', authResult.error);
    console.log('User Role:', authResult.user?.role);
    console.log('User Username:', authResult.user?.username);
    console.log('User Active:', authResult.user?.isActive);
    console.log('=========================');

    if (!authResult.isAuthorized) {
      console.log('Unauthorized giveaway winner selection:', authResult.error);
      return NextResponse.json({
        error: 'Unauthorized. Admin access required to select winners.',
        details: authResult.error,
        debug: {
          hasUser: !!authResult.user,
          userRole: authResult.user?.role,
          username: authResult.user?.username,
          isActive: authResult.user?.isActive
        }
      }, { status: 401 });
    }

    console.log(`Admin user ${authResult.user?.username} selecting giveaway winners`);

    const body = await request.json();
    const { giveawayId } = body;

    if (!giveawayId) {
      return NextResponse.json({ error: 'Giveaway ID is required' }, { status: 400 });
    }

    // Buscar en todos los sorteos incluyendo los de adviento
    let giveaway = getGiveawayById(giveawayId);
    if (!giveaway) {
      // Si no se encuentra, buscar en los sorteos de adviento
      const allGiveaways = getAllGiveawaysWithAdvent(2025);
      giveaway = allGiveaways.find(g => g.id === giveawayId);
    }

    if (!giveaway) {
      return NextResponse.json({ error: 'Giveaway not found in configuration' }, { status: 404 });
    }

    // Verificar que el sorteo tenga premios configurados
    if (!giveaway.prizes || giveaway.prizes.length === 0) {
      return NextResponse.json({
        error: 'Este sorteo no tiene premios configurados. Por favor configura los premios primero.',
        details: 'No prizes configured for this giveaway'
      }, { status: 400 });
    }

    // VERIFICACIÓN DE SEGURIDAD: Comprobar ganadores existentes y posiciones ocupadas
    const existingWinnersResult = await pool.query(
      'SELECT user_id, position FROM giveaway_winners WHERE giveaway_id = $1',
      [giveawayId]
    );

    const existingWinners = existingWinnersResult.rows;
    const existingPositions = new Set(existingWinners.map(w => w.position));
    // Inicializar el set de usuarios seleccionados con los que ya ganaron para evitar repetidos
    const selectedUserIds = new Set(existingWinners.map(w => w.user_id));

    // Si ya están todos los premios cubiertos, entonces sí detenemos el proceso
    const totalPrizes = giveaway.prizes.length;
    const allPositionsCovered = giveaway.prizes.every(p => existingPositions.has(p.position));

    if (existingWinners.length > 0 && allPositionsCovered) {
      return NextResponse.json({
        error: 'Winners already selected',
        message: 'Ya se han seleccionado todos los ganadores para este sorteo.',
        details: 'All prizes have been awarded.'
      }, { status: 400 });
    } else if (existingWinners.length > 0) {
      console.log(`Giveaway ${giveawayId}: Found ${existingWinners.length} existing winners. Proceeding to fill missing positions.`);
    }

    // 1. Get all participants with user info for weighting
    const participantsResult = await pool.query(
      `SELECT gp.user_id, gp.account_name, u.patreon_tier, u.patreon_status 
       FROM giveaway_participants gp
       LEFT JOIN users u ON gp.user_id = u.id 
       WHERE gp.giveaway_id = $1`,
      [giveawayId]
    );
    const participants = participantsResult.rows;

    if (participants.length === 0) {
      return NextResponse.json({
        message: 'No participants for this giveaway',
        error: 'No hay participantes en este sorteo'
      }, { status: 200 });
    }

    // 2. Create weighted pool based on Patreon tier
    const weightedPool: any[] = [];
    // Pesos por tier - Optimizado para dar ventaja real a Patreons
    const TIER_WEIGHTS: Record<string, number> = {
      'bronze': 2,    // 2x chance
      'silver': 3,    // 3x chance
      'gold': 4,      // 4x chance
      'legends': 5    // 5x chance
    };

    // Free users tienen weight base de 1
    const FREE_USER_WEIGHT = 1;

    participants.forEach(p => {
      let weight = FREE_USER_WEIGHT; // Probabilidad base para usuarios free
      
      // Verificar si es patreon activo con tier válido
      if (p.patreon_status === 'active_patron' && p.patreon_tier) {
        const tier = String(p.patreon_tier).trim().toLowerCase();
        if (TIER_WEIGHTS[tier]) {
          weight = TIER_WEIGHTS[tier];
        }
      }

      // Calcular número de "tickets" totales (mínimo 1)
      const totalEntries = Math.max(1, Math.round(weight));

      // Add participant to the pool multiple times según su peso
      for (let k = 0; k < totalEntries; k++) {
        weightedPool.push(p);
      }
    });

    // 3. Shuffle weighted pool (Fisher-Yates algorithm)
    for (let i = weightedPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [weightedPool[i], weightedPool[j]] = [weightedPool[j], weightedPool[i]];
    }

    // 4. Select unique winners based on prize count
    const winnersToInsert = [];
    // selectedUserIds ya fue inicializado y poblado anteriormente

    const prizeCount = giveaway.prizes.length;

    let poolIndex = 0;
    let prizeIndex = 0;

    while (prizeIndex < prizeCount && poolIndex < weightedPool.length) {
      const prize = giveaway.prizes[prizeIndex];

      // Si ya existe un ganador para esta posición, la saltamos
      if (existingPositions.has(prize.position)) {
        prizeIndex++;
        continue;
      }

      const participant = weightedPool[poolIndex];
      poolIndex++;

      // Skip if this user already won a prize in this giveaway
      if (selectedUserIds.has(participant.user_id)) {
        continue;
      }

      // Mark user as selected
      selectedUserIds.add(participant.user_id);

      // Obtener información del item si existe
      let itemIcon = null;
      let itemName = null;

      if (prize.itemId) {
        try {
          const itemInfo = await getItemInfo(prize.itemId);
          if (itemInfo) {
            itemIcon = itemInfo.icon;
            itemName = itemInfo.name;
          }
        } catch (error) {
          console.error(`Error fetching item info for ${prize.itemId}:`, error);
        }
      }

      // Fallback si no hay icono
      if (!itemIcon && prize.icon) {
        const FALLBACK_ICONS: Record<string, string> = {
          'gem': 'https://wiki.guildwars2.com/images/8/88/Gem_%28highres%29.png',
          'package': 'https://wiki.guildwars2.com/images/5/5e/Daily_Achievement_Chest.png',
          'materials': 'https://wiki.guildwars2.com/images/7/75/Trophy_case.png',
          'gold': '/images/expansions/Gold.webp'
        };
        itemIcon = FALLBACK_ICONS[prize.icon] || FALLBACK_ICONS['package'];
      }

      // Ultimate fallback
      if (!itemIcon) {
        itemIcon = 'https://wiki.guildwars2.com/images/5/5e/Daily_Achievement_Chest.png';
      }

      // Crear descripción completa del premio
      let prizeDescription = prize.prize;
      if (prize.gemPrize) {
        prizeDescription = `${prize.prize} Gems`;
      } else if (prize.quantity && prize.itemId) {
        prizeDescription = `${prize.quantity}x ${itemName || `Item ${prize.itemId}`}`;
      }

      winnersToInsert.push({
        giveaway_id: giveawayId,
        user_id: participant.user_id,
        account_name: participant.account_name,
        position: prize.position,
        prize_description: prizeDescription,
        prize_value: prize.prize,
        // Incluir información adicional del premio para el frontend
        item_id: prize.itemId || null,
        quantity: prize.quantity || null,
        gem_prize: prize.gemPrize || false,
        item_icon: itemIcon // URL real del icono
      });

      prizeIndex++;
    }

    if (winnersToInsert.length === 0) {
      return NextResponse.json({
        error: 'No se pudieron seleccionar ganadores',
        message: `No se pudieron seleccionar ganadores. El sorteo tiene ${participants.length} participantes pero ${prizeCount} premios configurados.`,
        details: `Participants: ${participants.length}, Prizes: ${prizeCount}`
      }, { status: 400 });
    }

    // 4. Insert winners into giveaway_winners table (simplified)
    for (const winner of winnersToInsert) {
      await pool.query(
        `INSERT INTO giveaway_winners (giveaway_id, user_id, account_name, position, prize_description, prize_value)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (giveaway_id, position) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           account_name = EXCLUDED.account_name,
           prize_description = EXCLUDED.prize_description,
           prize_value = EXCLUDED.prize_value,
           announced_at = NOW()`,
        [winner.giveaway_id, winner.user_id, winner.account_name, winner.position, winner.prize_description, winner.prize_value]
      );
    }

    return NextResponse.json({ message: 'Winners selected and announced', winners: winnersToInsert });
  } catch (error) {
    console.error('Error selecting winners:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Error al seleccionar ganadores',
        details: errorMessage,
        message: 'Ocurrió un error inesperado al seleccionar los ganadores. Por favor intenta de nuevo.'
      },
      { status: 500 }
    );
  }
}
