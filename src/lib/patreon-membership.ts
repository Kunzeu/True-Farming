/** KunzeuLabs — campaña Patreon de True Farming */
export const KUNZEU_PATREON_CAMPAIGN_ID = '12496802';

export type PatreonPatronStatus = 'active_patron' | 'declined_patron' | 'former_patron';

export type PatreonResource = {
  type: string;
  id: string;
  attributes?: {
    patron_status?: PatreonPatronStatus | null;
    title?: string;
    amount_cents?: number;
  };
  relationships?: {
    currently_entitled_tiers?: {
      data?: Array<{ type: string; id: string }>;
    };
    campaign?: {
      data?: { type: string; id: string };
    };
    currently_entitled_campaign?: {
      data?: { type: string; id: string };
    };
  };
};

export function getPatreonCampaignId(): string {
  if (typeof process !== 'undefined') {
    const fromEnv =
      process.env.NEXT_PUBLIC_PATREON_CAMPAIGN_ID || process.env.PATREON_CAMPAIGN_ID;
    if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  }
  return KUNZEU_PATREON_CAMPAIGN_ID;
}

export function mapRoleFromTier(tierName: string | null | undefined): string {
  if (!tierName) return 'user';
  const name = tierName.toLowerCase();
  if (/(legend|legends)/.test(name)) return 'legends';
  if (/gold/.test(name)) return 'gold';
  if (/silver/.test(name)) return 'silver';
  if (/bronze/.test(name)) return 'bronze';
  return 'bronze';
}

function pickHighestTierTitle(
  included: PatreonResource[],
  tierRefs: Array<{ id: string }>,
): string | undefined {
  const tiers = tierRefs
    .map((ref) => included.find((r) => r.type === 'tier' && r.id === ref.id))
    .filter((t): t is PatreonResource => Boolean(t));

  if (!tiers.length) return undefined;

  tiers.sort(
    (a, b) => (b.attributes?.amount_cents ?? 0) - (a.attributes?.amount_cents ?? 0),
  );
  return tiers[0]?.attributes?.title;
}

/** Extrae membresía solo de la campaña KunzeuLabs (nunca de otro creador). */
export function extractPatreonMembership(patreonData: { included?: PatreonResource[] }) {
  const campaignId = getPatreonCampaignId();
  const included = patreonData.included || [];
  const memberships = included.filter((item) => item.type === 'member');

  const membership = memberships.find((member) => {
    const memberCampaignId =
      member.relationships?.campaign?.data?.id ||
      member.relationships?.currently_entitled_campaign?.data?.id ||
      null;
    return memberCampaignId === campaignId;
  });

  if (!membership?.attributes) {
    return { patreonStatus: null as PatreonPatronStatus | null, patreonTier: undefined as string | undefined };
  }

  const rawStatus = membership.attributes.patron_status;
  const patreonStatus: PatreonPatronStatus | null =
    rawStatus === 'active_patron' || rawStatus === 'declined_patron' || rawStatus === 'former_patron'
      ? rawStatus
      : null;

  let patreonTier: string | undefined;
  if (patreonStatus === 'active_patron') {
    const tierRefs = membership.relationships?.currently_entitled_tiers?.data || [];
    patreonTier = pickHighestTierTitle(included, tierRefs);
  }

  return { patreonStatus, patreonTier };
}
