import { pool } from '@/lib/postgres-db';
import { mapRoleFromTier } from '@/lib/patreon-membership';
import { verifyMemberPaidByPatreonId } from '@/lib/server/patreon-creator';

export type PatreonSyncResult = {
  patreonStatus: 'active_patron' | 'declined_patron' | 'former_patron' | null;
  patreonTier: string | null;
  role: string;
  isPaid: boolean;
};

function pickHighestVerifiedTier(
  tiers: Array<{ title?: string; amount_cents?: number }>,
): string | null {
  if (!tiers.length) return null;
  const sorted = [...tiers].sort((a, b) => (b.amount_cents ?? 0) - (a.amount_cents ?? 0));
  return sorted[0]?.title ?? null;
}

export async function resolvePatreonMembership(
  patreonId: string,
  oauthFallback?: {
    patreonStatus?: 'active_patron' | 'declined_patron' | 'former_patron' | null;
    patreonTier?: string | null;
  },
): Promise<PatreonSyncResult> {
  try {
    const verified = await verifyMemberPaidByPatreonId(patreonId);

    if (verified.isPaid) {
      const tier = pickHighestVerifiedTier(verified.tiers);
      return {
        patreonStatus: 'active_patron',
        patreonTier: tier,
        role: tier ? mapRoleFromTier(tier) : 'user',
        isPaid: true,
      };
    }

    const status = verified.patron_status ?? 'former_patron';
    return {
      patreonStatus: status,
      patreonTier: null,
      role: 'user',
      isPaid: false,
    };
  } catch (error) {
    console.error('Patreon creator verify failed, using OAuth fallback:', error);
    const status = oauthFallback?.patreonStatus ?? 'former_patron';
    const tier = status === 'active_patron' ? (oauthFallback?.patreonTier ?? null) : null;
    const isPaid = status === 'active_patron' && !!tier;
    return {
      patreonStatus: isPaid ? 'active_patron' : status === 'declined_patron' ? 'declined_patron' : 'former_patron',
      patreonTier: tier,
      role: isPaid ? mapRoleFromTier(tier) : 'user',
      isPaid,
    };
  }
}

export async function syncPatreonMembershipForUser(opts: {
  patreonId: string;
  userId?: string;
  email?: string;
  oauthFallback?: {
    patreonStatus?: 'active_patron' | 'declined_patron' | 'former_patron' | null;
    patreonTier?: string | null;
  };
}): Promise<PatreonSyncResult & { userId?: string }> {
  const resolved = await resolvePatreonMembership(opts.patreonId, opts.oauthFallback);

  const result = await pool.query(
    `UPDATE users
     SET patreon_id = $1,
         patreon_tier = $2::text,
         patreon_status = $3::text,
         patreon_active = CASE WHEN $3::text = 'active_patron' THEN TRUE ELSE FALSE END,
         role = CASE WHEN role IN ('admin','moderator') THEN role ELSE $4 END,
         updated_at = NOW()
     WHERE ($5::text IS NOT NULL AND id::text = $5) OR ($6::text IS NOT NULL AND email = $6)
     RETURNING id`,
    [
      opts.patreonId,
      resolved.patreonTier,
      resolved.patreonStatus,
      resolved.role,
      opts.userId ?? null,
      opts.email ?? null,
    ],
  );

  return {
    ...resolved,
    userId: result.rows[0]?.id as string | undefined,
  };
}
