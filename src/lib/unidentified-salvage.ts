/**
 * Replica de 2.xlsx Proceso largo — profit sin suerte = H6:
 * (E11+E13+E15+E17+E18+E19+E20+E21+E22+E23+E24+E25+E26+E28+P12+P13+P21+P20+P22+P14)
 *  - (D7+L14+L22+(kit*D6))
 */
import model from '@/data/unidentified-salvage-from-excel.json';

export type SalvageTierKey = 'low' | 'mid' | 'high';
export type LuckMode = 'none' | 'bags';

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
const PLACA_SYNTH_ID = -2;
const PLACA_ITEM_ID = 74356; // Reclaimed Metal Plate — vendor 198c
const PLACA_UNIT = 198; // 01s 98c — Excel E26 = G26 × 198


const PLACA_DROP: Record<SalvageTierKey, number> = {
  low: 0.00112,
  mid: 0.00174,
  high: 0,
};

/** Excel Low/Mid/High Tier C24 / Unids */
const LUCK_DROP: Record<SalvageTierKey, number> = {
  low: 12.1378,
  mid: 29.6494,
  high: 0,
};

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

/** Excel: F4 oro/bolsa → /200 por punto de suerte (bolsas rojas) */
function copperPerLuckBags(prices: Map<number, PriceRow>): number {
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

/** IDs consumed by Yelmos Medios / Escudo de Krait (Proceso largo Excel) */
const SILK_ID = 19748;
const LEATHER_T5_ID = 19729;
const WOOD_T5_ID = 19722;
const MITHRIL_ID = 19700;
const ECTO_ID = 19721;
const SILK_THREAD_ID = 19791; // Carrete de hilo de seda
const VESICLE_T5_ID = 24282; // Vesícula de veneno potente (Excel I28)

/**
 * Excel H6 income side — only these E-rows (NOT seda/maderaT5/cueroT5/mithril/suerte):
 * E11+E13+E15+E17+E18+E19+E20+E21+E22+E23+E24+E25+E26+E28
 */
const EXCEL_H6_MAT_IDS = new Set([
  19745, // E11 Gasa
  19725, // E13 Madera T6
  19732, // E15 Cuero T6
  19701, // E17 Oricalco
  89140, // E18 Mota
  89182, // E19 Pain
  89141, // E20 Mejora
  89098, // E21 Control
  89103, // E22 Brillantez
  89258, // E23 Potencia
  89216, // E24 Habilidad
  19721, // E25 Ectos
  PLACA_SYNTH_ID, // E26 Placas
  EXOTIC_SYNTH_ID, // E28 Exóticos
]);

export type ProcesoLargoCraft = {
  yelmos: number;
  escudos: number;
  ectosFromCraft: number;
  /** P12+P13+P14+P20+P21+P22 */
  outputValue: number;
  /** L14+L22 */
  remainingCost: number;
};

export type CraftBuyPrices = {
  leather: number;
  silk: number;
  thread: number;
  vesicle: number;
};

/**
 * Excel Proceso largo: craft Yelmos Medios + Escudo de Krait from salvage mats.
 * Returns P* output gold and L14+L22 remaining craft cost.
 */
export function computeProcesoLargo(
  quantity: number,
  materials: SalvageMaterialRow[],
  buy: CraftBuyPrices,
  tierKey: SalvageTierKey = 'mid'
): ProcesoLargoCraft {
  const mat = (id: number) => materials.find((m) => m.id === id);
  const qtyOf = (id: number) => (mat(id)?.dropRate || 0) * quantity;
  const sell = (id: number) => mat(id)?.sellPrice || 0;

  const silk = qtyOf(SILK_ID);
  const leather = qtyOf(LEATHER_T5_ID);
  const wood = qtyOf(WOOD_T5_ID);
  const mithril = qtyOf(MITHRIL_ID);

  const yelmosSeda = silk / 10.8;
  const yelmosCuero = leather / 20;
  const yelmos = Math.min(yelmosSeda, yelmosCuero);

  const escudosMadera = wood / 12;
  const escudosMithril = mithril / 20;
  const escudos = Math.min(escudosMadera, escudosMithril);

  const ectoSell = sell(ECTO_ID);
  const p12 = yelmos * 1.7692 * buy.leather * 0.9;
  const p13 = yelmos * 0.9 * ectoSell * 0.9;
  const p14 = Math.max(0, yelmosSeda - yelmosCuero) * 10.8 * buy.silk;
  // Low: (L17*0.874)+((L20-L21)*3) · Mid/High: L17*0.874
  const p20 =
    tierKey === 'low'
      ? (escudos * 0.874 + Math.max(0, escudosMadera - escudosMithril) * 3) * sell(WOOD_T5_ID)
      : escudos * 0.874 * sell(WOOD_T5_ID);
  const p21 = escudos * 0.9 * ectoSell;
  const p22 = escudos * 0.874 * sell(MITHRIL_ID);

  // L14 = (thread*11 + vesicle*15) * yelmos; L22 = vesicle*15 * escudos
  const remainingCost =
    yelmos * (buy.thread * 11 + buy.vesicle * 15) + escudos * (buy.vesicle * 15);

  return {
    yelmos,
    escudos,
    ectosFromCraft: yelmos * 0.9 + escudos * 0.9,
    outputValue: p12 + p13 + p14 + p20 + p21 + p22,
    remainingCost,
  };
}

/**
 * Beneficio neto = Excel H6 (ingresos − D7 − L14 − L22 − kit×qty).
 * ROI = beneficio / D7.
 * Modos: sin suerte | usando la suerte (bolsas rojas = E29).
 * La valoración mística (Relic of Fireworks) se queda solo en el Excel: no es realista.
 */
export function computeSalvageRois(
  materials: SalvageMaterialRow[],
  quantity: number,
  gearBuy: number,
  kitCost: number,
  craftBuy?: CraftBuyPrices | null,
  tierKey: SalvageTierKey = 'mid',
  redBagLuck?: { dropRate: number; copperPerLuck: number } | null
): {
  baseIncome: number;
  cost: number;
  rois: SalvageRoi[];
  defaultMode: LuckMode;
  craft: ProcesoLargoCraft | null;
} {
  // E11+E13+E15+E17+E18+E19+E20+E21+E22+E23+E24+E25+E26+E28
  const eSum = materials
    .filter((m) => EXCEL_H6_MAT_IDS.has(m.id))
    .reduce((s, m) => s + m.dropRate * quantity * m.processedPrice, 0);

  const craft = craftBuy ? computeProcesoLargo(quantity, materials, craftBuy, tierKey) : null;
  const pSum = craft?.outputValue || 0;
  const baseIncome = eSum + pSum;

  const bagsIncome =
    redBagLuck && redBagLuck.dropRate > 0
      ? redBagLuck.dropRate * quantity * redBagLuck.copperPerLuck
      : 0;

  // Excel kit in H6: Low 4*D6, Mid 30*D6, High 60*D6
  const excelKitPerUnit = tierKey === 'low' ? 4 : kitCost;
  const d7 = quantity * gearBuy;
  const kitTotal = quantity * excelKitPerUnit;
  const l14l22 = craft?.remainingCost || 0;
  const cost = d7 + l14l22 + kitTotal;

  const mk = (mode: LuckMode, income: number): SalvageRoi => {
    const profit = income - cost; // beneficio neto
    return { mode, income, profit, roi: d7 > 0 ? profit / d7 : 0 };
  };

  return {
    baseIncome,
    cost,
    rois: [
      mk('none', baseIncome),
      ...(bagsIncome > 0 ? [mk('bags', baseIncome + bagsIncome)] : []),
    ],
    defaultMode: 'none',
    craft,
  };
}

export async function loadSalvageTier(
  tierKey: SalvageTierKey,
  lang: string
): Promise<{
  gearId: number;
  gearName: string;
  gearBuy: number;
  /** true si el coste usa sell del TP porque buy = 0 */
  gearCostFromSell: boolean;
  kitCost: number;
  kitName: string;
  materials: SalvageMaterialRow[];
  luckDropRate: number;
  redBagCopperPerLuck: number;
  craftBuy: CraftBuyPrices;
}> {
  const tier = SALVAGE_TIERS[tierKey];
  const apiLang = lang === 'es' || lang === 'de' || lang === 'fr' ? lang : 'en';
  const matIds = tier.drops.filter((d) => d.kind === 'mat' && d.id != null).map((d) => d.id as number);
  const kitIds: Record<SalvageTierKey, number> = { low: 44602, mid: 89409, high: 67027 };
  const luckDropRate = LUCK_DROP[tierKey];
  const craftExtraIds = [SILK_THREAD_ID, VESICLE_T5_ID];

  const [items, prices, exoticAvg, kitItem] = await Promise.all([
    fetchJson<{ id: number; name: string; icon?: string }[]>(
      `https://api.guildwars2.com/v2/items?ids=${[...matIds, tier.gearId].join(',')}&lang=${apiLang}`
    ),
    fetchJson<PriceRow[]>(
      `https://api.guildwars2.com/v2/commerce/prices?ids=${[...matIds, tier.gearId, ...craftExtraIds].join(',')}`
    ),
    avgExoticSell85(tier.exoticIds),
    fetchJson<{ name: string; icon?: string }>(
      `https://api.guildwars2.com/v2/items/${kitIds[tierKey]}?lang=${apiLang}`
    ),
  ]);

  const priceMap = new Map(prices.map((p) => [p.id, p]));
  const gearItem = items.find((i) => i.id === tier.gearId);
  const gearRow = priceMap.get(tier.gearId);
  const gearBuyOrder = gearRow?.buys?.unit_price || 0;
  const gearSellOrder = gearRow?.sells?.unit_price || 0;
  // TP: buy (izq) si hay; si es 00g00s00 usar sell (derecha)
  const gearBuy = gearBuyOrder > 0 ? gearBuyOrder : gearSellOrder;
  const gearCostFromSell = gearBuyOrder <= 0 && gearSellOrder > 0;
  const buyOf = (id: number) => priceMap.get(id)?.buys?.unit_price || 0;

  const craftBuy: CraftBuyPrices = {
    leather: buyOf(LEATHER_T5_ID),
    silk: buyOf(SILK_ID),
    thread: buyOf(SILK_THREAD_ID),
    vesicle: buyOf(VESICLE_T5_ID),
  };

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

  // Excel E26 Placas = cantidad × 198c (01s 98c), no TP
  const placaRate = PLACA_DROP[tierKey];
  if (placaRate > 0) {
    let placaName = 'Placas';
    let placaIcon = '';
    try {
      const placaItem = await fetchJson<{ name?: string; icon?: string }>(
        `https://api.guildwars2.com/v2/items/${PLACA_ITEM_ID}?lang=${apiLang}`
      );
      placaName = placaItem.name || placaName;
      placaIcon = placaItem.icon || '';
    } catch {
      /* keep defaults */
    }
    materials.push({
      id: PLACA_SYNTH_ID,
      name: placaName,
      icon: placaIcon,
      dropRate: placaRate,
      sellPrice: PLACA_UNIT,
      processedPrice: PLACA_UNIT, // total = qty × 198c
      category: 'fine',
    });
  }

  // Bolsas rojas si hay coste de unids (buy o sell fallback). Mística = no UI.
  let redBagCopperPerLuck = 0;
  const applyBags = luckDropRate > 0 && gearBuy > 0;
  if (applyBags) {
    const bagIds = RED_BAG.map((r) => r.id).filter((id): id is number => id != null);
    const luckPrices = await fetchPrices(bagIds);
    redBagCopperPerLuck = copperPerLuckBags(luckPrices);
  }

  return {
    gearId: tier.gearId,
    gearName: gearItem?.name || tier.label,
    gearBuy,
    gearCostFromSell,
    kitCost: tier.kitCost,
    kitName: kitItem?.name || '',
    materials,
    luckDropRate: applyBags ? luckDropRate : 0,
    redBagCopperPerLuck: applyBags ? redBagCopperPerLuck : 0,
    craftBuy,
  };
}
