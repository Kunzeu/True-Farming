/** ponytail: radar v1 — precios live GW2; barones/historial cuando haya snapshots */

export type RadarPrice = {
  buy: number;
  sell: number;
  buyQty: number;
  sellQty: number;
};

export type RadarOpportunity = {
  id: string;
  category: 'salvage' | 'ecto';
  titleKey: string;
  titleFallback: string;
  href: string;
  /** Profit per unit in copper (can be negative). */
  profitCopper: number;
  marginPct: number;
  confidence: 'high' | 'medium' | 'low';
  volume: number;
  iconId: number;
};

const FEE_85 = 0.85;
const FEE_90_IDS = new Set([89182, 89141, 89098, 89103, 89258, 89216, 19721]);

type Drop = { id: number; dropRate: number };

const COMMON_DROPS: Drop[] = [
  { id: 19748, dropRate: 0.29826 },
  { id: 19745, dropRate: 0.01596 },
  { id: 19722, dropRate: 0.3687 },
  { id: 19725, dropRate: 0.03218 },
  { id: 19729, dropRate: 0.2394 },
  { id: 19732, dropRate: 0.01618 },
  { id: 19700, dropRate: 0.43076 },
  { id: 19701, dropRate: 0.03986 },
  { id: 89140, dropRate: 0.11108 },
  { id: 89182, dropRate: 0.00042 },
  { id: 89141, dropRate: 0.00036 },
  { id: 89098, dropRate: 0.00014 },
  { id: 89103, dropRate: 0.00046 },
  { id: 89258, dropRate: 0.00034 },
  { id: 89216, dropRate: 0.00032 },
  { id: 19721, dropRate: 0.009054 },
];

const MASTERWORK_DROPS: Drop[] = [
  { id: 19748, dropRate: 0.34174 },
  { id: 19745, dropRate: 0.01866 },
  { id: 19722, dropRate: 0.36104 },
  { id: 19725, dropRate: 0.02806 },
  { id: 19729, dropRate: 0.27492 },
  { id: 19732, dropRate: 0.0173 },
  { id: 19700, dropRate: 0.4564 },
  { id: 19701, dropRate: 0.03854 },
  { id: 89140, dropRate: 0.98114 },
  { id: 89182, dropRate: 0.00378 },
  { id: 89141, dropRate: 0.00464 },
  { id: 89098, dropRate: 0.00192 },
  { id: 89103, dropRate: 0.00438 },
  { id: 89258, dropRate: 0.00224 },
  { id: 89216, dropRate: 0.0027 },
  { id: 19721, dropRate: 0.030708 },
];

const RARE_DROPS: Drop[] = [
  { id: 19748, dropRate: 0.3201 },
  { id: 19745, dropRate: 0.016075 },
  { id: 19722, dropRate: 0.392925 },
  { id: 19725, dropRate: 0.030075 },
  { id: 19729, dropRate: 0.2546 },
  { id: 19732, dropRate: 0.013925 },
  { id: 19700, dropRate: 0.464475 },
  { id: 19701, dropRate: 0.0402 },
  { id: 89140, dropRate: 1.39165 },
  { id: 89182, dropRate: 0.0031 },
  { id: 89141, dropRate: 0.0064 },
  { id: 89098, dropRate: 0.0038 },
  { id: 89103, dropRate: 0.005675 },
  { id: 89258, dropRate: 0.002675 },
  { id: 89216, dropRate: 0.00335 },
  { id: 19721, dropRate: 0.88675 },
];

const GEAR = {
  common: { id: 85016, kit: 3, drops: COMMON_DROPS, href: '/salvage/common' },
  masterwork: { id: 84731, kit: 30, drops: MASTERWORK_DROPS, href: '/salvage/masterwork' },
  rare: { id: 83008, kit: 60, drops: RARE_DROPS, href: '/salvage/rare' },
} as const;

const ECTO_ID = 19721;
const DUST_ID = 24277;

export const RADAR_PRICE_IDS: number[] = Array.from(
  new Set([
    ...COMMON_DROPS.map((d) => d.id),
    GEAR.common.id,
    GEAR.masterwork.id,
    GEAR.rare.id,
    ECTO_ID,
    DUST_ID,
  ])
);

function fee(id: number) {
  return FEE_90_IDS.has(id) ? 0.9 : FEE_85;
}

function confidence(volume: number): RadarOpportunity['confidence'] {
  if (volume >= 10_000) return 'high';
  if (volume >= 1_000) return 'medium';
  return 'low';
}

function salvageEv(drops: Drop[], prices: Record<number, RadarPrice>): number {
  return drops.reduce((sum, d) => {
    const sell = prices[d.id]?.sell ?? 0;
    return sum + d.dropRate * sell * fee(d.id);
  }, 0);
}

function salvageOpp(
  key: keyof typeof GEAR,
  titleKey: string,
  titleFallback: string,
  prices: Record<number, RadarPrice>
): RadarOpportunity | null {
  const g = GEAR[key];
  const gear = prices[g.id];
  if (!gear?.buy) return null;
  const ev = salvageEv(g.drops, prices);
  const profit = Math.round(ev - gear.buy - g.kit);
  const cost = gear.buy + g.kit;
  const volume = gear.buyQty + gear.sellQty;
  return {
    id: `salvage-${key}`,
    category: 'salvage',
    titleKey,
    titleFallback,
    href: g.href,
    profitCopper: profit,
    marginPct: cost > 0 ? (profit / cost) * 100 : 0,
    confidence: confidence(volume),
    volume,
    iconId: g.id,
  };
}

/** Build ranked opportunities from a price map. */
export function buildRadarOpportunities(
  prices: Record<number, RadarPrice>
): RadarOpportunity[] {
  const list: RadarOpportunity[] = [
    salvageOpp('common', 'radar.salvage.common', 'Salvage: Common gear', prices),
    salvageOpp('masterwork', 'radar.salvage.masterwork', 'Salvage: Masterwork gear', prices),
    salvageOpp('rare', 'radar.salvage.rare', 'Salvage: Rare gear', prices),
  ].filter((o): o is RadarOpportunity => o != null);

  // Profitable first, then by profit desc; keep a few negatives so empty markets still show signal
  const profitable = list.filter((o) => o.profitCopper > 0).sort((a, b) => b.profitCopper - a.profitCopper);
  const rest = list.filter((o) => o.profitCopper <= 0).sort((a, b) => b.profitCopper - a.profitCopper);
  return [...profitable, ...rest].slice(0, 12);
}

export function parseCommercePrices(
  rows: Array<{
    id: number;
    buys?: { unit_price?: number; quantity?: number };
    sells?: { unit_price?: number; quantity?: number };
  }>
): Record<number, RadarPrice> {
  const map: Record<number, RadarPrice> = {};
  for (const row of rows) {
    map[row.id] = {
      buy: row.buys?.unit_price ?? 0,
      sell: row.sells?.unit_price ?? 0,
      buyQty: row.buys?.quantity ?? 0,
      sellQty: row.sells?.quantity ?? 0,
    };
  }
  return map;
}
