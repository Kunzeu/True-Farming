/**
 * Replica de 2.xlsx (Low/Mid/High Tier + Proceso largo):
 * - Costo equipo: buy_price
 * - Materiales: sell * 0.85 (runes/ecto * 0.9)
 * - Exóticos: avg(sell*0.85) * dropRate
 * - Suerte: (luck/200) * (neto Relic of Fireworks / 5)  == luck * neto / 1000
 * - Suerte Rápida: (luck/200) * oro_por_bolsa_roja
 */
import model from '@/data/unidentified-salvage-from-excel.json';

export type SalvageTierKey = 'low' | 'mid' | 'high';
export type LuckMode = 'none' | 'luck' | 'fast';

export type SalvageMaterialRow = {
  id: number;
  name: string;
  icon: string;
  dropRate: number;
  sellPrice: number;
  processedPrice: number;
  category: 'common' | 'fine' | 'masterwork' | 'rare' | 'exotic';
};

export type SalvageRoi = {
  mode: LuckMode;
  income: number;
  profit: number;
  roi: number;
};

const EXOTIC_SYNTH_ID = -1;
const LUCK_SYNTH_ID = -3;
const LUCK_FAST_SYNTH_ID = -4;

/** Excel Low/Mid/High Tier C24 / Unids */
const LUCK_DROP: Record<SalvageTierKey, number> = {
  low: 12.1378,
  mid: 29.6494,
  high: 0,
};

/** Excel AI6 craft for Relic of Fireworks */
const LUCK_CRAFT = {
  outputId: 100947,
  motaId: 89140,
  motaQty: 480,
  skillId: 89216,
  skillQty: 3,
  ectoId: 19721,
  ectoQty: 15,
} as const;

/** Excel Calculos Bolsas Rojas sample */
const RED_BAG_SAMPLE = 1_041_467;
const RED_BAG: { id: number | null; num: number; fixedSell?: number }[] = [
  { id: null, num: 1_137_805, fixedSell: 88 },
  { id: 77699, num: 7990 },
  { id: 68636, num: 7996 },
  { id: 68632, num: 7912 },
  { id: 68635, num: 7653 },
  { id: 68633, num: 7766 },
  { id: 104158, num: 413 },
  { id: 104194, num: 10_523, fixedSell: 888 },
  { id: 68634, num: 4387 },
  { id: null, num: 3, fixedSell: 88_888 },
  { id: null, num: 54, fixedSell: 8888 },
  { id: null, num: 19_728, fixedSell: 888 },
];

export const SALVAGE_TIERS = model.tiers;
export const FEE_90_IDS = new Set(model.fee90Ids);

export function feeFor(id: number): number {
  return FEE_90_IDS.has(id) ? 0.9 : 0.85;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate, br' },
  });
  if (!res.ok) throw new Error(`GW2 ${res.status}`);
  return res.json();
}

type PriceRow = { id: number; buys?: { unit_price?: number }; sells?: { unit_price?: number } };

async function fetchPrices(ids: number[]): Promise<Map<number, PriceRow>> {
  const map = new Map<number, PriceRow>();
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const rows = await fetchJson<PriceRow[]>(
      `https://api.guildwars2.com/v2/commerce/prices?ids=${chunk.join(',')}`
    );
    for (const row of rows) map.set(row.id, row);
  }
  return map;
}

async function avgExoticSell85(exoticIds: number[]): Promise<{ avg85: number; avgSell: number; icon: string }> {
  let gold = 0;
  let n = 0;
  const prices = await fetchPrices(exoticIds);
  for (const p of prices.values()) {
    const sell = p.sells?.unit_price || 0;
    if (sell <= 0) continue;
    gold += sell * 0.85;
    n += 1;
  }
  let icon = '';
  if (exoticIds[0]) {
    const item = await fetchJson<{ icon?: string }>(
      `https://api.guildwars2.com/v2/items/${exoticIds[0]}`
    );
    icon = item.icon || '';
  }
  return {
    avg85: n > 0 ? gold / n : 0,
    avgSell: n > 0 ? gold / n / 0.85 : 0,
    icon,
  };
}

/** Excel: AI6 = sell85(relic) - buy(mota)*480 - buy(skill)*3 - sell90(ecto)*15 */
function copperPerLuck(prices: Map<number, PriceRow>): number {
  const relicSell = prices.get(LUCK_CRAFT.outputId)?.sells?.unit_price || 0;
  const motaBuy = prices.get(LUCK_CRAFT.motaId)?.buys?.unit_price || 0;
  const skillBuy = prices.get(LUCK_CRAFT.skillId)?.buys?.unit_price || 0;
  const ectoSell = prices.get(LUCK_CRAFT.ectoId)?.sells?.unit_price || 0;
  const net =
    relicSell * 0.85 -
    motaBuy * LUCK_CRAFT.motaQty -
    skillBuy * LUCK_CRAFT.skillQty -
    ectoSell * 0.9 * LUCK_CRAFT.ectoQty;
  return net / 1000;
}

/** Excel: F4 oro/bolsa → /200 por punto de suerte */
function copperPerLuckFast(prices: Map<number, PriceRow>): number {
  let goldPerBag = 0;
  for (const row of RED_BAG) {
    const rate = row.num / RED_BAG_SAMPLE;
    if (row.fixedSell != null) {
      goldPerBag += rate * row.fixedSell;
      continue;
    }
    if (row.id == null) continue;
    const sell = prices.get(row.id)?.sells?.unit_price || 0;
    goldPerBag += rate * sell * 0.85;
  }
  return goldPerBag / 200;
}

function categoryFor(id: number, kind: string): SalvageMaterialRow['category'] {
  if (kind === 'exotic' || id === 19721) return 'exotic';
  if (FEE_90_IDS.has(id) && id !== 19721) return 'rare';
  if ([19745, 19725, 19732, 19701].includes(id)) return 'fine';
  return 'common';
}

export function computeSalvageRois(
  materials: SalvageMaterialRow[],
  quantity: number,
  gearBuy: number,
  kitCost: number
): { baseIncome: number; cost: number; rois: SalvageRoi[]; defaultMode: LuckMode } {
  const byId = new Map(materials.map((m) => [m.id, m]));
  const luck = byId.get(LUCK_SYNTH_ID);
  const fast = byId.get(LUCK_FAST_SYNTH_ID);
  const baseIncome = materials
    .filter((m) => m.id !== LUCK_SYNTH_ID && m.id !== LUCK_FAST_SYNTH_ID)
    .reduce((s, m) => s + m.dropRate * quantity * m.processedPrice, 0);
  const luckIncome = luck ? luck.dropRate * quantity * luck.processedPrice : 0;
  const fastIncome = fast ? fast.dropRate * quantity * fast.processedPrice : 0;
  const cost = quantity * gearBuy + quantity * kitCost;
  const mk = (mode: LuckMode, income: number): SalvageRoi => {
    const profit = income - cost;
    return { mode, income, profit, roi: cost > 0 ? profit / cost : 0 };
  };
  const hasLuck = (luck?.dropRate || 0) > 0;
  return {
    baseIncome,
    cost,
    rois: [
      mk('none', baseIncome),
      ...(hasLuck ? [mk('luck', baseIncome + luckIncome), mk('fast', baseIncome + fastIncome)] : []),
    ],
    defaultMode: hasLuck ? 'luck' : 'none',
  };
}

export async function loadSalvageTier(
  tierKey: SalvageTierKey,
  lang: string
): Promise<{
  gearId: number;
  gearName: string;
  gearBuy: number;
  kitCost: number;
  kitName: string;
  materials: SalvageMaterialRow[];
  luckDropRate: number;
}> {
  const tier = SALVAGE_TIERS[tierKey];
  const apiLang = lang === 'es' || lang === 'de' || lang === 'fr' ? lang : 'en';
  const matIds = tier.drops.filter((d) => d.kind === 'mat' && d.id != null).map((d) => d.id as number);
  const kitIds: Record<SalvageTierKey, number> = { low: 44602, mid: 89409, high: 67027 };
  const luckDropRate = LUCK_DROP[tierKey];
  const luckPriceIds = [
    LUCK_CRAFT.outputId,
    LUCK_CRAFT.motaId,
    LUCK_CRAFT.skillId,
    LUCK_CRAFT.ectoId,
    ...RED_BAG.map((r) => r.id).filter((id): id is number => id != null),
  ];

  const [items, prices, exoticAvg, kitItem, luckPrices] = await Promise.all([
    fetchJson<{ id: number; name: string; icon?: string }[]>(
      `https://api.guildwars2.com/v2/items?ids=${[...matIds, tier.gearId].join(',')}&lang=${apiLang}`
    ),
    fetchJson<PriceRow[]>(
      `https://api.guildwars2.com/v2/commerce/prices?ids=${[...matIds, tier.gearId].join(',')}`
    ),
    avgExoticSell85(tier.exoticIds),
    fetchJson<{ name: string; icon?: string }>(
      `https://api.guildwars2.com/v2/items/${kitIds[tierKey]}?lang=${apiLang}`
    ),
    fetchPrices(luckPriceIds),
  ]);

  const priceMap = new Map(prices.map((p) => [p.id, p]));
  const gearItem = items.find((i) => i.id === tier.gearId);
  const gearPrice = priceMap.get(tier.gearId);

  const materials: SalvageMaterialRow[] = tier.drops
    .filter((d) => d.dropRate > 0)
    .map((d) => {
      if (d.kind === 'exotic') {
        return {
          id: EXOTIC_SYNTH_ID,
          name: d.name,
          icon: exoticAvg.icon,
          dropRate: d.dropRate,
          sellPrice: Math.round(exoticAvg.avgSell),
          processedPrice: Math.round(exoticAvg.avg85),
          category: 'exotic' as const,
        };
      }
      const id = d.id as number;
      const item = items.find((i) => i.id === id);
      const price = priceMap.get(id);
      const sell = price?.sells?.unit_price || 0;
      return {
        id,
        name: item?.name || d.name,
        icon: item?.icon || '',
        dropRate: d.dropRate,
        sellPrice: sell,
        processedPrice: Math.round(sell * feeFor(id)),
        category: categoryFor(id, d.kind),
      };
    });

  if (luckDropRate > 0) {
    const perLuck = copperPerLuck(luckPrices);
    const perFast = copperPerLuckFast(luckPrices);
    const luckIcon =
      (
        await fetchJson<{ icon?: string }>(
          `https://api.guildwars2.com/v2/items/45175`
        ).catch(() => ({ icon: '' }))
      ).icon || '';

    materials.push(
      {
        id: LUCK_SYNTH_ID,
        name: 'Suerte',
        icon: luckIcon,
        dropRate: luckDropRate,
        sellPrice: Math.round(perLuck),
        processedPrice: Math.round(perLuck),
        category: 'fine',
      },
      {
        id: LUCK_FAST_SYNTH_ID,
        name: 'Suerte Rápida',
        icon: luckIcon,
        dropRate: luckDropRate,
        sellPrice: Math.round(perFast),
        processedPrice: Math.round(perFast),
        category: 'fine',
      }
    );
  }

  return {
    gearId: tier.gearId,
    gearName: gearItem?.name || tier.label,
    gearBuy: gearPrice?.buys?.unit_price || 0,
    kitCost: tier.kitCost,
    kitName: kitItem?.name || '',
    materials,
    luckDropRate,
  };
}
