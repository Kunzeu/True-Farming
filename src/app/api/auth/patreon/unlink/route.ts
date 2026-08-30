import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';

export const runtime = 'nodejs';

// Endpoint interno para desvincular cuenta de Patreon
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
    const { email } = body as { email?: string };

    if (!email) {
      return NextResponse.json({ error: 'email es requerido' }, { status: 400 });
    }

    // Limpiar campos de Patreon por email
    const result = await pool.query(
      `UPDATE users
       SET patreon_id = NULL,
           patreon_tier = NULL,
           patreon_status = NULL,
           patreon_active = FALSE,
           role = CASE WHEN role IN ('admin','moderator') THEN role ELSE 'user' END,
           updated_at = NOW()
       WHERE email = $1
       RETURNING id, email, username, role, is_active as "isActive",
                 created_at as "createdAt", updated_at as "updatedAt",
                 discord_id as "discordId", gw2_api_key as "gw2ApiKey",
                 patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus", patreon_active as "patreonActive", preferences`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  } catch (error) {
    console.error('Error unlinking Patreon:', error);
    return NextResponse.json({
      error: 'Error unlinking Patreon',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}