import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GW2_API_BASE = 'https://api.guildwars2.com/v2';

/** Permisos que True Farming necesita para cuenta / banco / inventario / wallet. */
export const REQUIRED_GW2_PERMISSIONS = [
  'account',
  'inventories',
  'characters',
  'wallet',
] as const;

function readApiKey(request: NextRequest): string | null {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get('api_key')?.trim();
  if (fromQuery) return fromQuery;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = readApiKey(request);

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    let tokenRes: Response;
    let accountRes: Response;
    try {
      [tokenRes, accountRes] = await Promise.all([
        fetch(`${GW2_API_BASE}/tokeninfo?access_token=${encodeURIComponent(apiKey)}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        }),
        fetch(`${GW2_API_BASE}/account?access_token=${encodeURIComponent(apiKey)}`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }

    if (!tokenRes.ok || !accountRes.ok) {
      return NextResponse.json(
        { valid: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const [tokenInfo, accountInfo] = await Promise.all([
      tokenRes.json() as Promise<{ name?: string; permissions?: string[] }>,
      accountRes.json() as Promise<{ id?: string; name?: string }>,
    ]);

    const permissions = Array.isArray(tokenInfo.permissions) ? tokenInfo.permissions : [];
    const missing = REQUIRED_GW2_PERMISSIONS.filter((p) => !permissions.includes(p));

    if (missing.length > 0) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Missing required permissions',
          missingPermissions: missing,
          permissions,
          accountInfo: accountInfo?.name
            ? { id: accountInfo.id, name: accountInfo.name }
            : null,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        permissions,
        accountInfo: {
          id: accountInfo.id,
          name: accountInfo.name,
        },
        tokenName: tokenInfo.name ?? null,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch (error) {
    console.error('Error validating API key:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Failed to validate API key',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
