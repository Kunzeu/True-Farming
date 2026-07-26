/** Validación GW2 en el navegador (IP del usuario). Workers de Cloudflare suelen recibir 429 de ArenaNet. */

export const REQUIRED_GW2_PERMISSIONS = [
  'account',
  'inventories',
  'characters',
  'wallet',
] as const;

export type Gw2ClientValidateResult =
  | {
      ok: true;
      apiKey: string;
      permissions: string[];
      accountInfo: { id: string; name: string } | null;
      tokenName: string | null;
    }
  | {
      ok: false;
      error: string;
      missingPermissions?: string[];
      permissions?: string[];
      gw2Status?: number;
      gw2Error?: unknown;
    };

function sanitize(raw: string): string {
  return raw.replace(/\s+/g, '').trim();
}

export async function validateGw2ApiKeyInBrowser(rawKey: string): Promise<Gw2ClientValidateResult> {
  const apiKey = sanitize(rawKey);
  if (!apiKey) return { ok: false, error: 'empty' };

  if (!/^[A-F0-9]{4,20}(-[A-F0-9]{4,20}){3,10}$/i.test(apiKey)) {
    return { ok: false, error: 'Invalid API key format' };
  }

  // Query param (sin headers custom) → sin preflight CORS; ArenaNet lo permite desde el browser.
  let tokenRes: Response;
  try {
    tokenRes = await fetch(
      `https://api.guildwars2.com/v2/tokeninfo?access_token=${encodeURIComponent(apiKey)}`
    );
  } catch {
    return { ok: false, error: 'network' };
  }

  const tokenBody = await tokenRes.json().catch(() => null);

  if (!tokenRes.ok) {
    return {
      ok: false,
      error: tokenRes.status === 429 ? 'GW2 rate limit' : 'Invalid API key',
      gw2Status: tokenRes.status,
      gw2Error: tokenBody,
    };
  }

  const permissions = Array.isArray(tokenBody?.permissions) ? (tokenBody.permissions as string[]) : [];
  const missing = REQUIRED_GW2_PERMISSIONS.filter((p) => !permissions.includes(p));
  if (missing.length > 0) {
    return {
      ok: false,
      error: 'Missing required permissions',
      missingPermissions: [...missing],
      permissions,
    };
  }

  let accountInfo: { id: string; name: string } | null = null;
  try {
    const accountRes = await fetch(
      `https://api.guildwars2.com/v2/account?access_token=${encodeURIComponent(apiKey)}`
    );
    if (accountRes.ok) {
      const acct = await accountRes.json();
      if (acct?.id && acct?.name) {
        accountInfo = { id: String(acct.id), name: String(acct.name) };
      }
    }
  } catch {
    /* nombre opcional */
  }

  return {
    ok: true,
    apiKey,
    permissions,
    accountInfo,
    tokenName: typeof tokenBody?.name === 'string' ? tokenBody.name : null,
  };
}
