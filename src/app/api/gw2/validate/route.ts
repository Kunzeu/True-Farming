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

function sanitizeApiKey(raw: string): string {
  return raw.replace(/\s+/g, '').trim();
}

async function readApiKey(request: NextRequest): Promise<string | null> {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get('api_key');
  if (fromQuery) return sanitizeApiKey(fromQuery);

  const headerKey = request.headers.get('x-api-key');
  if (headerKey) return sanitizeApiKey(headerKey);

  if (request.method === 'POST') {
    try {
      const body = (await request.json()) as { apiKey?: string; api_key?: string };
      const fromBody = body.apiKey || body.api_key;
      if (fromBody) return sanitizeApiKey(String(fromBody));
    } catch {
      /* ignore */
    }
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function parseGw2Body(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Fetch a GW2 auth endpoint with Bearer, query fallback, and 429 retries. */
async function gw2AuthGet(
  path: string,
  apiKey: string,
  retries = 3
): Promise<{ res: Response; body: unknown }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    // Preferido en servidor: Authorization Bearer.
    let res = await fetch(`${GW2_API_BASE}${path}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // Si Bearer no sirve (algunos edges), fallback a query.
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      res = await fetch(`${GW2_API_BASE}${path}?access_token=${apiKey}`, {
        headers: { Accept: 'application/json' },
      });
    }

    if (res.status === 429) {
      if (attempt === retries) {
        return { res, body: await parseGw2Body(res) };
      }
      const retryAfter = Number(res.headers.get('Retry-After') || '0');
      const delayMs = retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt;
      await sleep(delayMs);
      continue;
    }

    return { res, body: await parseGw2Body(res) };
  }

  // Unreachable, but TS-safe
  const res = await fetch(`${GW2_API_BASE}${path}?access_token=${apiKey}`);
  return { res, body: await parseGw2Body(res) };
}

async function validate(request: NextRequest) {
  try {
    const apiKey = await readApiKey(request);

    if (!apiKey) {
      return NextResponse.json({ valid: false, error: 'API key required' }, { status: 400 });
    }

    if (!/^[A-F0-9-]{20,200}$/i.test(apiKey)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid API key format', keyLength: apiKey.length },
        { status: 400 }
      );
    }

    const { res: tokenRes, body: tokenBody } = await gw2AuthGet('/tokeninfo', apiKey);

    if (tokenRes.status === 429) {
      return NextResponse.json(
        {
          valid: false,
          error: 'GW2 rate limit — try again in a few seconds',
          gw2Status: 429,
          gw2Error: tokenBody,
        },
        { status: 429 }
      );
    }

    if (!tokenRes.ok) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid API key',
          gw2Status: tokenRes.status,
          gw2Error: tokenBody,
        },
        { status: 401 }
      );
    }

    const tokenInfo = tokenBody as { name?: string; permissions?: string[] };
    const permissions = Array.isArray(tokenInfo.permissions) ? tokenInfo.permissions : [];
    const missing = REQUIRED_GW2_PERMISSIONS.filter((p) => !permissions.includes(p));

    if (missing.length > 0) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Missing required permissions',
          missingPermissions: missing,
          permissions,
        },
        { status: 401 }
      );
    }

    let accountInfo: { id?: string; name?: string } | null = null;
    try {
      const { res: accountRes, body: accountBody } = await gw2AuthGet('/account', apiKey, 2);
      if (accountRes.ok && accountBody && typeof accountBody === 'object') {
        const acct = accountBody as { id?: string; name?: string };
        accountInfo = { id: acct.id, name: acct.name };
      }
    } catch {
      /* ignore */
    }

    return NextResponse.json(
      {
        valid: true,
        permissions,
        accountInfo,
        tokenName: tokenInfo.name ?? null,
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
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

export async function GET(request: NextRequest) {
  return validate(request);
}

export async function POST(request: NextRequest) {
  return validate(request);
}
