export const CORE_CONVERSIONS = [
  { coreId: 24309, lodestoneId: 24310 }, // Onyx
  { coreId: 24314, lodestoneId: 24315 }, // Molten
  { coreId: 24319, lodestoneId: 24320 }, // Glacial
  { coreId: 24324, lodestoneId: 24325 }, // Destroyer
  { coreId: 24329, lodestoneId: 24330 }, // Crystal
  { coreId: 24339, lodestoneId: 24340 }, // Corrupted
  { coreId: 24304, lodestoneId: 24305 }, // Charged
] as const;

export const CORE_WINE_ID = 19663;
/** Bottle of Elonian Wine: precio fijo de vendedor, no TP. 25s 04c */
export const CORE_WINE_PRICE = 25 * 100 + 4;
export const CORE_DUST_ID = 24277;
export const CORE_ECTO_ID = 19721;
export const CORE_CRYSTAL_ID = 20799;

export const CORE_CONVERSION_PRICE_IDS: number[] = [
  ...CORE_CONVERSIONS.flatMap((c) => [c.coreId, c.lodestoneId]),
  CORE_DUST_ID,
  CORE_ECTO_ID,
];

type PriceBits = {
  buys?: { unit_price?: number };
  sells?: { unit_price?: number };
};

/** min(buy, sell 90%). 0 = missing listing. */
function cheapest(buy: number, sell: number): number {
  const left = buy || Infinity;
  const right = sell ? Math.ceil(sell * 0.9) : Infinity;
  const m = Math.min(left, right);
  return Number.isFinite(m) ? m : 0;
}

/** MIN(dust cheapest, ecto cheapest / 1.85) */
export function coreDustMin(prices: Record<number, PriceBits>): number {
  const dust = cheapest(
    prices[CORE_DUST_ID]?.buys?.unit_price || 0,
    prices[CORE_DUST_ID]?.sells?.unit_price || 0
  );
  const ecto = cheapest(
    prices[CORE_ECTO_ID]?.buys?.unit_price || 0,
    prices[CORE_ECTO_ID]?.sells?.unit_price || 0
  );
  return Math.min(dust, Math.ceil(ecto / 1.85));
}

export function coreUnitCost(prices: Record<number, PriceBits>, coreId: number): number {
  return cheapest(
    prices[coreId]?.buys?.unit_price || 0,
    prices[coreId]?.sells?.unit_price || 0
  );
}

/** (core cheapest × 2) + 2504 + dust/ecto min */
export function coreConversionCost(prices: Record<number, PriceBits>, coreId: number): number {
  return coreUnitCost(prices, coreId) * 2 + CORE_WINE_PRICE + coreDustMin(prices);
}

/** sell × 90% */
export function coreLodestone90(prices: Record<number, PriceBits>, lodestoneId: number): number {
  const sell = prices[lodestoneId]?.sells?.unit_price || 0;
  return sell ? Math.ceil(sell * 0.9) : 0;
}

/** min(buy, sell 90%, sell 100%, craft). 0 = missing. */
export function coreLodestoneValue(
  prices: Record<number, PriceBits>,
  lodestoneId: number,
  craft: number
): number {
  const buy = prices[lodestoneId]?.buys?.unit_price || 0;
  const sell = prices[lodestoneId]?.sells?.unit_price || 0;
  const m = Math.min(
    buy || Infinity,
    sell ? Math.ceil(sell * 0.9) : Infinity,
    sell || Infinity,
    craft || Infinity
  );
  return Number.isFinite(m) ? m : 0;
}

export function coreProfitPerShard(profit: number): number {
  return (profit * 5) / 3;
}

/** Cobre por 1 SS. Máximo de profit core → lodestone. */
export function maxProfitSS90Core(prices: Record<number, PriceBits>): number {
  let max = Number.NEGATIVE_INFINITY;
  for (const { coreId, lodestoneId } of CORE_CONVERSIONS) {
    const craft = coreConversionCost(prices, coreId);
    const best = coreLodestoneValue(prices, lodestoneId, craft);
    const profit = Math.round(coreProfitPerShard(coreLodestone90(prices, lodestoneId) - best));
    if (profit > max) max = profit;
  }
  return Number.isFinite(max) ? max : 0;
}
