/** Ecto 19721 vs dust 24277 @ 90% — ¿merece reciclar? */

export const ECTO_ITEM_ID = 19721;
export const DUST_ITEM_ID = 24277;
export const DUST_PER_ECTO = 1.85;
export const PRICE_90 = 0.9;
/** Valor de suerte por ecto: 0.1043901765 × 704 */
export const LUCK_VALUE_PER_ECTO = 0.1043901765 * 704;

export type EctoRecycleCompare = {
  noRecycle: { price90: number; profit: number };
  recycle: { price90: number; profit: number };
  worthRecycling: boolean;
};

export function computeEctoRecycleCompare(
  ectoSell: number,
  dustSell: number
): EctoRecycleCompare | null {
  if (!ectoSell || !dustSell) return null;

  const noRecyclePrice90 = Math.floor(ectoSell * PRICE_90);
  const recyclePrice90 = Math.floor(dustSell * PRICE_90);
  // (polvo @ 90% × 1.85) + (0.1043901765 × 704)
  const recycleProfit = Math.floor(recyclePrice90 * DUST_PER_ECTO + LUCK_VALUE_PER_ECTO);

  return {
    noRecycle: { price90: noRecyclePrice90, profit: noRecyclePrice90 },
    recycle: { price90: recyclePrice90, profit: recycleProfit },
    worthRecycling: recycleProfit > noRecyclePrice90,
  };
}
