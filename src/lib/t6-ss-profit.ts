// ponytail: misma fórmula que magic/page (Profit SS 90% T6); max de la columna
export const T6_CONVERSION_PAIRS = [
  { t6: 24295, t5: 24294 },
  { t6: 24358, t5: 24341 },
  { t6: 24351, t5: 24350 },
  { t6: 24357, t5: 24356 },
  { t6: 24289, t5: 24288 },
  { t6: 24300, t5: 24299 },
  { t6: 24283, t5: 24282 },
] as const;

export const T6_ECTO_ID = 19721;
export const T6_DUST_ID = 24277;

export const T6_SS_PRICE_IDS: number[] = [
  ...T6_CONVERSION_PAIRS.flatMap((p) => [p.t6, p.t5]),
  T6_ECTO_ID,
  T6_DUST_ID,
];

type PriceBits = {
  buys?: { unit_price?: number };
  sells?: { unit_price?: number };
};

/** Cobre por 1 SS. Máximo de Profit SS 90% T6. */
export function maxProfitSS90T6(prices: Record<number, PriceBits>): number {
  const ectoSell = prices[T6_ECTO_ID]?.sells?.unit_price || 0;
  const dustBuy = prices[T6_DUST_ID]?.buys?.unit_price || 0;
  const dustSell = prices[T6_DUST_ID]?.sells?.unit_price || 0;
  const menorValor = Math.min(
    Math.ceil(dustSell * 0.9),
    dustBuy,
    Math.ceil(ectoSell * 0.9),
    Math.ceil((ectoSell * 0.9) / 1.85)
  );
  let max = Number.NEGATIVE_INFINITY;
  for (const { t6, t5 } of T6_CONVERSION_PAIRS) {
    const t5Buy = prices[t5]?.buys?.unit_price || 0;
    const t6Sell = prices[t6]?.sells?.unit_price || 0;
    const costeConv20 = menorValor * 200 + t5Buy * 2000;
    const profit90 = Math.round(((t6Sell * 0.9 * 242) - costeConv20) / 20);
    if (profit90 > max) max = profit90;
  }
  return Number.isFinite(max) ? max : 0;
}
