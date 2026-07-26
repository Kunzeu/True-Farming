import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';

export const runtime = 'nodejs';

// GET /api/users/[id]/summary
// Solo lee la DB. No llama a api.guildwars2.com desde el Worker (CF → 429 de ArenaNet).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await pool.query(
      `SELECT
         gw2_api_key as "gw2ApiKey",
         role,
         is_active as "isActive"
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const gw2ApiKey: string | null = result.rows[0].gw2ApiKey || null;
    const role: string = result.rows[0].role;
    const isActive: boolean = Boolean(result.rows[0].isActive);
    const hasApiKey = Boolean(gw2ApiKey && gw2ApiKey.length > 0);

    return NextResponse.json(
      {
        hasApiKey,
        // Si está en DB, se consideró válida al guardar (validación en el browser).
        apiKeyValid: hasApiKey ? true : false,
        accountInfo: null,
        role,
        isActive,
        lastValidatedAt: null,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to build user summary' }, { status: 500 });
  }
}
