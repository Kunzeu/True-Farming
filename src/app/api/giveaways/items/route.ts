import { NextRequest, NextResponse } from 'next/server';
import { getGiveawayById, getGiveawayItemsInfo } from '../../../../config/giveaways';

export const runtime = 'edge';;

// GET /api/giveaways/items - Get items information for a specific giveaway
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const giveawayId = searchParams.get('giveawayId');
    const lang = searchParams.get('lang') || 'en';

    if (!giveawayId) {
      return NextResponse.json({ error: 'Giveaway ID is required' }, { status: 400 });
    }

    const giveaway = getGiveawayById(giveawayId);
    if (!giveaway) {
      return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
    }

    const itemsInfo = await getGiveawayItemsInfo(giveaway, lang);

    return NextResponse.json(
      { items: itemsInfo },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching giveaway items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch giveaway items' },
      { status: 500 }
    );
  }
}
