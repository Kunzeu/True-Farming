import { pool } from '@/lib/postgres-db';

let cachedAccessToken: string | null = null;
let cachedExpiresAt = 0;

export async function getAppSecret(key: string): Promise<string | null> {
  try {
    const res = await pool.query(
      'CREATE TABLE IF NOT EXISTS secrets (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz NOT NULL DEFAULT NOW())'
    );
    void res; // avoid lint unused
    const r = await pool.query('SELECT value FROM secrets WHERE key=$1', [key]);
    return r.rows[0]?.value ?? null;
  } catch (e) {
    console.error('secrets:get error', e);
    return null;
  }
}

async function setSecret(key: string, value: string): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO secrets(key, value, updated_at)
       VALUES($1, $2, NOW())
       ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`,
      [key, value]
    );
  } catch (e) {
    console.error('secrets:set error', e);
  }
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 3, delayMs = 500): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, init);
      return res;
    } catch (err) {
      lastErr = err;
      if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

export async function getCreatorAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && cachedExpiresAt > now + 15_000) {
    return cachedAccessToken;
  }

  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;
  const refreshToken = (await getAppSecret('patreon_creator_refresh_token')) || process.env.PATREON_CREATOR_REFRESH_TOKEN || null;
  const staticAccess = process.env.PATREON_CREATOR_ACCESS_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    // Si falta refresh/config, intenta usar un access token estático si se proporcionó
    if (staticAccess) {
      cachedAccessToken = staticAccess;
      cachedExpiresAt = now + 5 * 60 * 1000; // cache corto 5m
      return cachedAccessToken;
    }
    throw new Error('Patreon creator OAuth env vars missing');
  }

  const res = await fetchWithRetry('https://www.patreon.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken!,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    // Fallback a token estático si existe (p.ej. en desarrollo o si el refresh caducó)
    if (staticAccess) {
      cachedAccessToken = staticAccess;
      cachedExpiresAt = now + 5 * 60 * 1000;
      console.warn('Patreon refresh failed, using static access token fallback');
      return cachedAccessToken;
    }
    throw new Error(`Failed to refresh Patreon token: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedAccessToken = data.access_token as string;
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600;
  cachedExpiresAt = Date.now() + expiresIn * 1000;
  // Persistir refresh_token rotado
  if (typeof data.refresh_token === 'string' && data.refresh_token.length > 0) {
    await setSecret('patreon_creator_refresh_token', data.refresh_token);
  }
  return cachedAccessToken!;
}

export type VerifyMemberResult = {
  isPaid: boolean;
  tiers: Array<{ id: string; title?: string; amount_cents?: number }>;
  patron_status: 'active_patron' | 'declined_patron' | 'former_patron' | null;
};

export async function verifyMemberPaidByPatreonId(patreonId: string): Promise<VerifyMemberResult> {
  const campaignId = process.env.PATREON_CAMPAIGN_ID || '12496802';
  const token = await getCreatorAccessToken();

  const url = 'https://www.patreon.com/api/oauth2/v2/campaigns/' + campaignId + '/members?' + new URLSearchParams({
    include: 'currently_entitled_tiers,user',
    'fields[member]': 'patron_status,will_pay_amount_cents',
    'fields[tier]': 'amount_cents,title',
    'filter[user_id]': patreonId,
    page: 'count=50',
  }).toString();

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Patreon API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const included = (data.included || []) as Array<{ id: string; type: string; attributes?: Record<string, unknown> }>;
  const tiersMap = new Map(included.filter(i => i.type === 'tier').map(t => [t.id, t]));

  type MemberRes = {
    type: string;
    attributes?: Record<string, unknown>;
    relationships?: Record<string, { data?: Array<{ id: string }> }>;
  };
  const member = (data.data || []).find((m: MemberRes) => m.type === 'member') as MemberRes | undefined;
  if (!member) return { isPaid: false, tiers: [], patron_status: null };

  const rels = member.relationships?.currently_entitled_tiers?.data as Array<{ id: string }> | undefined;
  type TierRes = { id: string; type: string; attributes?: Record<string, unknown> };
  const memberTiers = (rels || [])
    .map(r => tiersMap.get(r.id) as TierRes | undefined)
    .filter((t): t is TierRes => Boolean(t))
    .map(tier => ({
      id: tier.id,
      title: tier.attributes?.title as string | undefined,
      amount_cents: tier.attributes?.amount_cents as number | undefined,
    }));

  const status = member?.attributes?.patron_status as
    | 'active_patron'
    | 'declined_patron'
    | 'former_patron'
    | null
    | undefined ?? null;
  const willPay = (member?.attributes?.will_pay_amount_cents as number | undefined) ?? 0;
  const hasPaid = memberTiers.some(t => (t.amount_cents ?? 0) > 0) || willPay > 0;

  return { isPaid: hasPaid && status === 'active_patron', tiers: memberTiers, patron_status: status };
}


