import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { pool } from '@/lib/postgres-db';

// GET - Obtener API key del usuario (solo el usuario puede ver su propia API key)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verificar que el usuario solo puede acceder a su propia API key
    if (userId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const query = `
      SELECT gw2_api_key as "gw2ApiKey"
      FROM users 
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];


    // Debug logs para producción
    console.log(`[API Key GET] User ${id}:`, {
      hasApiKey: !!user.gw2ApiKey,
      apiKeyLength: user.gw2ApiKey?.length || 0,
      apiKeyPreview: user.gw2ApiKey ? user.gw2ApiKey.substring(0, 8) + '...' : null
    });

    return NextResponse.json({
      hasApiKey: !!user.gw2ApiKey,
      apiKey: user.gw2ApiKey || null // Devolver la API key completa ya que el usuario está autenticado
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error fetching user API key:', error);
    return NextResponse.json({
      error: 'Error fetching API key',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// PUT - Actualizar API key del usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verificar que el usuario solo puede actualizar su propia API key
    if (userId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const trimmedKey = String(apiKey).replace(/\s+/g, '').trim();

    // Formato flexible: grupos hex separados por guiones (API keys de GW2).
    const apiKeyRegex = /^[A-F0-9]{4,20}(-[A-F0-9]{4,20}){3,10}$/i;
    if (!apiKeyRegex.test(trimmedKey)) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
    }

    const REQUIRED = ['account', 'inventories', 'characters', 'wallet'] as const;

    try {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let validationResponse: Response | null = null;
      let lastBody: unknown = null;

      for (let attempt = 0; attempt < 4; attempt++) {
        let res = await fetch('https://api.guildwars2.com/v2/tokeninfo', {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${trimmedKey}`,
          },
        });
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          res = await fetch(
            `https://api.guildwars2.com/v2/tokeninfo?access_token=${trimmedKey}`,
            { headers: { Accept: 'application/json' } }
          );
        }

        if (res.status === 429) {
          const retryAfter = Number(res.headers.get('Retry-After') || '0');
          await sleep(retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt);
          continue;
        }

        validationResponse = res;
        break;
      }

      if (!validationResponse) {
        return NextResponse.json(
          { error: 'GW2 rate limit — try again in a few seconds', gw2Status: 429 },
          { status: 429 }
        );
      }

      if (!validationResponse.ok) {
        const gw2Text = await validationResponse.text();
        try {
          lastBody = JSON.parse(gw2Text);
        } catch {
          lastBody = gw2Text;
        }
        return NextResponse.json(
          { error: 'Invalid API key', gw2Status: validationResponse.status, gw2Error: lastBody },
          { status: 400 }
        );
      }

      const tokenInfo = (await validationResponse.json()) as { permissions?: string[] };
      const permissions = Array.isArray(tokenInfo.permissions) ? tokenInfo.permissions : [];
      const missing = REQUIRED.filter((p) => !permissions.includes(p));
      if (missing.length > 0) {
        return NextResponse.json(
          {
            error: 'Missing required permissions',
            missingPermissions: missing,
            permissions,
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Failed to validate API key' }, { status: 400 });
    }

    const query = `
      UPDATE users 
      SET gw2_api_key = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, username, role, is_active as "isActive",
                created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId"
    `;

    const result = await pool.query(query, [trimmedKey, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];

    // Debug logs para producción
    console.log(`[API Key PUT] User ${id} updated:`, {
      success: true,
      apiKeyLength: trimmedKey.length,
      updatedAt: user.updatedAt
    });

    return NextResponse.json({
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error updating user API key:', error);
    return NextResponse.json({
      error: 'Error updating API key',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE - Eliminar API key del usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verificar que el usuario solo puede eliminar su propia API key
    if (userId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const query = `
      UPDATE users 
      SET gw2_api_key = NULL, updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, username, role, is_active as "isActive",
                created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId"
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];

    return NextResponse.json({
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error deleting user API key:', error);
    return NextResponse.json({
      error: 'Error deleting API key',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
