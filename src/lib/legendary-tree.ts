import rawLegendaryData from '@/data/legendary-recipes.json';

/**
 * Árbol de fabricación de legendarias: coste total, comprar vs fabricar y
 * descuento de lo que ya tienes en la cuenta.
 *
 * Los datos salen de src/data/legendary-recipes.json (ver
 * scripts/build-legendary-recipes.mjs): la API de GW2 no publica las recetas
 * de la Forja Mística.
 */

export type LegendaryKind = 'weapon' | 'armor' | 'backpack' | 'trinket';

export type LegendaryEntry = {
  id: number;
  name: string;
  type: string | null;
  kind?: LegendaryKind;
  set?: string | null;
  gen: number;
};

export type RecipeEntry = {
  name: string;
  source: string;
  output: number;
  ingredients: { id: number; count: number }[];
  /** Ingredientes sin item asociado (karma, monedas, colecciones). */
  extras?: { name: string; count: number }[];
};

export type ItemMeta = {
  name: string;
  icon: string | null;
  rarity: string | null;
  tradeable: boolean;
};

export type LegendaryData = {
  generatedAt: string;
  legendaries: LegendaryEntry[];
  recipes: Record<string, RecipeEntry>;
  items: Record<string, ItemMeta>;
};

export type PriceMap = Record<number, { buy: number; sell: number; sellQty?: number }>;

/** `sell` = comprar al instante; `buy` = poner orden de compra. */
export type PriceMode = 'sell' | 'buy';

export type NodeMode = 'buy' | 'craft' | 'account';

/** Forzar comprar o fabricar en un item concreto; sin entrada = más barato. */
export type DecisionOverride = Record<number, 'buy' | 'craft'>;
export type CurrencyOverride = Record<number, string>;

export type TreeNode = {
  key: string;
  id: number;
  /** Unidades que faltan (ya descontado lo que tienes). */
  need: number;
  /** Unidades cubiertas con lo que tienes en la cuenta. */
  owned: number;
  depth: number;
  mode: NodeMode;
  /** Hay precio TP y receta: el usuario puede elegir vía. */
  canChoose: boolean;
  source: string | null;
  /** Precio unitario TP según la opción activa (asks u órdenes). */
  buyUnit: number | null;
  /** Asks (sell listings) y bids (buy orders) por si la UI los necesita. */
  tpSell: number | null;
  tpBuy: number | null;
  craftUnit: number | null;
  /** Coste de las `need` unidades por la vía más barata. */
  total: number;
  /** Ítems de cuenta comprables con moneda (karma / esquirlas). */
  currency: { id: number; unit: number; total: number } | null;
  currencyChoice?: string;
  currencyChoices?: { key: string; label: string; total: number }[];
  children: TreeNode[];
  extras: { name: string; count: number }[];
};

export const MYSTIC_CLOVER_ID = 19675;
export const MYSTIC_RUNESTONE_ID = 79418;
export const GIFT_OF_GLORY_ID = 70528;
export const GIFT_OF_WAR_ID = 71008;
export const SHARD_OF_GLORY_ID = 70820;
export const MEMORY_OF_BATTLE_ID = 71581;

/** Monedas del wallet relevantes para legendarias. */
export const KARMA_ID = 2;
export const SPIRIT_SHARD_ID = 23;
export const FINE_RIFT_ESSENCE_ID = 78;
export const RARE_RIFT_ESSENCE_ID = 79;
export const MASTERWORK_RIFT_ESSENCE_ID = 80;
export const ANTIQUATED_DUCAT_ID = 81;
export const AETHER_RICH_SAP_ID = 83;
export const IMPERIAL_FAVOR_ID = 68;

export const GIFT_OF_SURVIVORS_ID = 106712;
export const GIFT_OF_PEOPLE_ID = 105804;
export const CONCENTRATED_CHROMATIC_SAP_ID = 105848;
export const PATRON_MAGICAL_ARTS_PLAQUE_ID = 105933;
export const SURVIVORS_ENCHANTED_COMPASS_ID = 106370;
export const GIFT_SHIPWRECK_EXPLORATION_ID = 106467;
export const GIFT_STARLIT_EXPLORATION_ID = 106672;
export const SEER_WREATH_OF_SERVICE_ID = 106627;

/**
 * Las monedas del wallet no son items de la API; usamos ids negativos en el
 * árbol para poder pintarlas como hijos de una receta de vendedor.
 */
export function currencyAsItemId(currencyId: number): number {
  return -currencyId;
}
export function itemAsCurrencyId(itemId: number): number | null {
  return itemId < 0 ? -itemId : null;
}

export const CURRENCY_META: Record<number, { name: string; icon: string }> = {
  [KARMA_ID]: {
    name: 'Karma',
    icon: 'https://render.guildwars2.com/file/94953FA23D3E0D23559624015DFEA4CFAA07F0E5/155026.png',
  },
  [SPIRIT_SHARD_ID]: {
    name: 'Spirit Shard',
    icon: 'https://render.guildwars2.com/file/0AD608DE7FDEE0B909905C0AF9401321CF65CD94/1010701.png',
  },
  [ANTIQUATED_DUCAT_ID]: {
    name: 'Antiquated Ducat',
    icon: 'https://render.guildwars2.com/file/F891B355BC31BD7B4103FE5DF9ACB2FCF928F4CB/3710051.png',
  },
  [AETHER_RICH_SAP_ID]: {
    name: 'Aether-Rich Sap',
    icon: 'https://render.guildwars2.com/file/79F23C52AF0AA29A976877285FF904BCA2D122FE/3710050.png',
  },
  [FINE_RIFT_ESSENCE_ID]: {
    name: 'Fine Rift Essence',
    icon: 'https://render.guildwars2.com/file/41D633F8F0CCFAD7FDADEF7CE84BF7C312AA1B49/3630022.png',
  },
  [RARE_RIFT_ESSENCE_ID]: {
    name: 'Rare Rift Essence',
    icon: 'https://render.guildwars2.com/file/A6012206459C56680D1BD4D23E0B706F0B0AE40D/3630024.png',
  },
  [MASTERWORK_RIFT_ESSENCE_ID]: {
    name: 'Masterwork Rift Essence',
    icon: 'https://render.guildwars2.com/file/E0A96441F8405ABEF06114BE750154583CF3B1D2/3630023.png',
  },
  [IMPERIAL_FAVOR_ID]: {
    name: 'Imperial Favor',
    icon: '/images/expansions/Imperial_Favor.webp',
  },
};

/**
 * Ítems de cuenta que se compran con moneda (no cotizan en el Bazar).
 * Curado a partir del wiki; se descuenta con el wallet igual que el inventario.
 */
type CurrencySource = {
  currency: number;
  options: { key: string; label: string; output: number; price: number }[];
};

export const CURRENCY_SOURCES: Record<number, CurrencySource> = {
  19925: {
    currency: KARMA_ID,
    options: [{ key: 'single', label: '1 × 2,100', output: 1, price: 2100 }],
  },
  20797: {
    currency: SPIRIT_SHARD_ID,
    options: [{ key: 'single', label: '1 × 200', output: 1, price: 200 }],
  },
  19717: {
    currency: KARMA_ID,
    options: [
      { key: 'single', label: '1 × 21', output: 1, price: 21 },
      { key: 'bundle', label: '25 × 525', output: 25, price: 525 },
    ],
  },
  // Gen 3: Blessing of the Jade Empress @ Myung-Hee
  97829: {
    currency: IMPERIAL_FAVOR_ID,
    options: [{ key: 'single', label: '500 Favor', output: 1, price: 500 }],
  },
};

/**
 * Consumibles de cuenta que son la moneda del wallet (1:1).
 * El saldo del wallet se mete en el pool de inventario al construir el árbol.
 */
export const WALLET_AS_ITEM: Record<number, number> = {
  104747: FINE_RIFT_ESSENCE_ID,
  104773: MASTERWORK_RIFT_ESSENCE_ID,
  105009: RARE_RIFT_ESSENCE_ID,
};

/** Monedas que son el material (no se “compran” con otra moneda). */
const MATERIAL_CURRENCIES = new Set<number>([
  ...Object.values(WALLET_AS_ITEM),
  AETHER_RICH_SAP_ID,
  ANTIQUATED_DUCAT_ID,
]);

/** Compra directa a NPC por oro (el subárbol de materiales va en SYNTHETIC_RECIPES). */
export const VENDOR_SOURCES: Record<number, { vendor: string; gold: number }> = {
  [CONCENTRATED_CHROMATIC_SAP_ID]: {
    vendor: 'Tyrian Alliance Representative Sharpwhisker',
    gold: 2_500_000, // 250g
  },
  [PATRON_MAGICAL_ARTS_PLAQUE_ID]: {
    vendor: 'Huntmaster Arnorr',
    gold: 2_500_000, // 250g
  },
};

/** Probabilidad de que la Forja devuelva trébol (investigación de 40k intentos). */
const CLOVER_RATE = 0.31;

/** Precios fijos (cobre) para items que no cotizan o se compran a vendedor. */
const FIXED_PRICES: Record<number, number> = {
  [MYSTIC_RUNESTONE_ID]: 10000, // 1g cada una; 100 unidades = 100g
  ...Object.fromEntries(Object.entries(VENDOR_SOURCES).map(([id, v]) => [Number(id), v.gold])),
};

/**
 * La receta del trébol es azarosa, así que se modela con salida fraccionada:
 * 1/0.31 = 3.2 intentos por trébol.
 *
 * Don de Gloria / Guerra no vienen en el wiki como recetas normales: se
 * "fabrican" canjeando 250 shards/memorias del TP (Miyani / Forja).
 *
 * Dones de Castora: coste del NPC (wiki Sold by), no cotizan en el Bazar.
 */
const SYNTHETIC_RECIPES: Record<number, RecipeEntry> = {
  [MYSTIC_CLOVER_ID]: {
    name: 'Mystic Clover',
    source: 'Mystic Forge 31%',
    output: CLOVER_RATE,
    ingredients: [
      { id: 19925, count: 1 }, // Obsidian Shard
      { id: 19976, count: 1 }, // Mystic Coin
      { id: 19721, count: 1 }, // Glob of Ectoplasm
      { id: 20796, count: 6 }, // Philosopher's Stone
    ],
  },
  [GIFT_OF_GLORY_ID]: {
    name: 'Gift of Glory',
    source: '250 Shard of Glory',
    output: 1,
    ingredients: [{ id: SHARD_OF_GLORY_ID, count: 250 }],
  },
  [GIFT_OF_WAR_ID]: {
    name: 'Gift of War',
    source: '250 Memory of Battle',
    output: 1,
    ingredients: [{ id: MEMORY_OF_BATTLE_ID, count: 250 }],
  },
  [GIFT_OF_SURVIVORS_ID]: {
    name: 'Gift of the Survivors',
    source: 'Vendor: Castaway Agnes',
    output: 1,
    ingredients: [
      { id: CONCENTRATED_CHROMATIC_SAP_ID, count: 1 },
      { id: GIFT_SHIPWRECK_EXPLORATION_ID, count: 1 },
      { id: SURVIVORS_ENCHANTED_COMPASS_ID, count: 1 },
      { id: currencyAsItemId(AETHER_RICH_SAP_ID), count: 500 },
    ],
  },
  [GIFT_OF_PEOPLE_ID]: {
    name: 'Gift of the People',
    source: 'Vendor: Canach',
    output: 1,
    ingredients: [
      { id: GIFT_STARLIT_EXPLORATION_ID, count: 1 },
      { id: PATRON_MAGICAL_ARTS_PLAQUE_ID, count: 1 },
      { id: SEER_WREATH_OF_SERVICE_ID, count: 1 },
      { id: currencyAsItemId(ANTIQUATED_DUCAT_ID), count: 500 },
    ],
  },
};

/** Klobjarne: logro la 1ª vez; recompra = remnant (amalgamadas + mapa + karma). */
export const STANDING_STONES_TIMEPIECE_ID = 103578;
export const VALKYRIE_BEARKIN_WAR_HELM_ID = 103257;
const CURIOUS_LOWLAND_HONEYCOMB_ID = 103038;
const CURIOUS_MURSAAT_CURRENCY_ID = 102494;
const AMALGAMATED_GEMSTONE_ID = 68063;

/** override `buy` = remnant vendor; sin override / `craft` = logro (account). */
export const REPURCHASE_RECIPES: Record<number, RecipeEntry> = {
  [STANDING_STONES_TIMEPIECE_ID]: {
    name: 'Standing Stones Timepiece Remnant',
    source: 'Vendor: Lowland Shore (after mastery)',
    output: 1,
    ingredients: [
      { id: CURIOUS_LOWLAND_HONEYCOMB_ID, count: 25 },
      { id: AMALGAMATED_GEMSTONE_ID, count: 25 },
      { id: currencyAsItemId(KARMA_ID), count: 10_050 },
    ],
  },
  [VALKYRIE_BEARKIN_WAR_HELM_ID]: {
    name: 'Bearkin War Helm Remnant',
    source: 'Vendor: Janthir Syntri (after mastery)',
    output: 1,
    ingredients: [
      { id: CURIOUS_MURSAAT_CURRENCY_ID, count: 25 },
      { id: AMALGAMATED_GEMSTONE_ID, count: 25 },
      { id: currencyAsItemId(KARMA_ID), count: 10_050 },
    ],
  },
};

export function isRepurchaseItem(id: number): boolean {
  return id in REPURCHASE_RECIPES;
}

/** Meta mínima de mats que el dataset del wiki no incluye. */
const EXTRA_ITEMS: Record<string, ItemMeta> = {
  [String(SHARD_OF_GLORY_ID)]: {
    name: 'Shard of Glory',
    icon: 'https://render.guildwars2.com/file/6BBA010474B8CCE22392E71EF81E5FDB662BC32F/1206834.png',
    rarity: 'Rare',
    tradeable: true,
  },
  [String(MEMORY_OF_BATTLE_ID)]: {
    name: 'Memory of Battle',
    icon: 'https://render.guildwars2.com/file/E4D0455D2EFDB0DFC008F4564B38D6545901A05B/1206833.png',
    rarity: 'Rare',
    tradeable: true,
  },
  [String(CONCENTRATED_CHROMATIC_SAP_ID)]: {
    name: 'Concentrated Chromatic Sap',
    icon: 'https://render.guildwars2.com/file/62B6A3561704ED626FE46046F041A3B1DA7ADB51/3710069.png',
    rarity: 'Exotic',
    tradeable: false,
  },
  [String(PATRON_MAGICAL_ARTS_PLAQUE_ID)]: {
    name: 'Patron of the Magical Arts Plaque',
    icon: 'https://render.guildwars2.com/file/04BBDBF2746479F9F4DA2EE0ED5AE35CA602DEA8/3710055.png',
    rarity: 'Exotic',
    tradeable: false,
  },
  [String(SURVIVORS_ENCHANTED_COMPASS_ID)]: {
    name: "Survivor's Enchanted Compass",
    icon: 'https://render.guildwars2.com/file/3DF23197BD570150B071C7949BE9F5BBFE50D434/3710062.png',
    rarity: 'Exotic',
    tradeable: false,
  },
  [String(GIFT_SHIPWRECK_EXPLORATION_ID)]: {
    name: 'Gift of Shipwreck Strand Exploration',
    icon: 'https://render.guildwars2.com/file/69490A215111E1BA0A7C307AC590316E560D2DB4/3708957.png',
    rarity: 'Legendary',
    tradeable: false,
  },
  [String(GIFT_STARLIT_EXPLORATION_ID)]: {
    name: 'Gift of Starlit Weald Exploration',
    icon: 'https://render.guildwars2.com/file/7236FF7200ADFA3F973E51B40A582FF00316F2AD/3708958.png',
    rarity: 'Legendary',
    tradeable: false,
  },
  [String(SEER_WREATH_OF_SERVICE_ID)]: {
    name: 'Seer Wreath of Service',
    icon: 'https://render.guildwars2.com/file/0D36C238C4EB0337FA32D6D507D8F3C925BE10F6/3710056.png',
    rarity: 'Exotic',
    tradeable: false,
  },
  [String(currencyAsItemId(AETHER_RICH_SAP_ID))]: {
    name: 'Aether-Rich Sap',
    icon: CURRENCY_META[AETHER_RICH_SAP_ID].icon,
    rarity: 'Basic',
    tradeable: false,
  },
  [String(currencyAsItemId(ANTIQUATED_DUCAT_ID))]: {
    name: 'Antiquated Ducat',
    icon: CURRENCY_META[ANTIQUATED_DUCAT_ID].icon,
    rarity: 'Basic',
    tradeable: false,
  },
  [String(CURIOUS_LOWLAND_HONEYCOMB_ID)]: {
    name: 'Curious Lowland Honeycomb',
    icon: null,
    rarity: 'Basic',
    tradeable: false,
  },
  [String(CURIOUS_MURSAAT_CURRENCY_ID)]: {
    name: 'Curious Mursaat Currency',
    icon: null,
    rarity: 'Basic',
    tradeable: false,
  },
  [String(currencyAsItemId(KARMA_ID))]: {
    name: 'Karma',
    icon: CURRENCY_META[KARMA_ID].icon,
    rarity: 'Basic',
    tradeable: false,
  },
  [String(currencyAsItemId(IMPERIAL_FAVOR_ID))]: {
    name: 'Imperial Favor',
    icon: CURRENCY_META[IMPERIAL_FAVOR_ID].icon,
    rarity: 'Basic',
    tradeable: false,
  },
};

/** Dataset embebido: el SSR ya puede pintar el árbol sin esperar un fetch. */
export const legendaryData = rawLegendaryData as LegendaryData;

function recipeOf(data: LegendaryData, id: number, override?: 'buy' | 'craft'): RecipeEntry | null {
  // ponytail: buy on Klobjarne mats = remnant vendor path
  if (override === 'buy' && REPURCHASE_RECIPES[id]) return REPURCHASE_RECIPES[id];
  const recipe = SYNTHETIC_RECIPES[id] ?? data.recipes[String(id)] ?? null;
  // ponytail: demotions Forja (Dust←Brick, etc.) list the output as ingredient — never expand
  if (recipe?.ingredients.some((ing) => ing.id === id)) return null;
  return recipe;
}

export function itemMeta(data: LegendaryData, id: number): ItemMeta {
  const currencyId = itemAsCurrencyId(id);
  if (currencyId != null) {
    const meta = CURRENCY_META[currencyId];
    return (
      EXTRA_ITEMS[String(id)] ?? {
        name: meta?.name ?? `Currency #${currencyId}`,
        icon: meta?.icon ?? null,
        rarity: 'Basic',
        tradeable: false,
      }
    );
  }
  return (
    data.items[String(id)] ??
    EXTRA_ITEMS[String(id)] ?? { name: `#${id}`, icon: null, rarity: null, tradeable: false }
  );
}

function unitPrice(prices: PriceMap, id: number, mode: PriceMode): number | null {
  const fixed = FIXED_PRICES[id];
  if (fixed != null) return fixed;

  const entry = prices[id];
  if (!entry) return null;
  const preferred = mode === 'sell' ? entry.sell : entry.buy;
  const fallback = mode === 'sell' ? entry.buy : entry.sell;
  return preferred || fallback || null;
}

function tpSides(prices: PriceMap, id: number): { sell: number | null; buy: number | null } {
  const fixed = FIXED_PRICES[id];
  if (fixed != null) return { sell: fixed, buy: fixed };

  const entry = prices[id];
  if (!entry) return { sell: null, buy: null };
  return {
    sell: entry.sell || null,
    buy: entry.buy || null,
  };
}

type CostContext = {
  data: LegendaryData;
  prices: PriceMap;
  mode: PriceMode;
  overrides: DecisionOverride;
  currencyOverrides: CurrencyOverride;
  /** Coste unitario memoizado: el mismo material aparece en muchas ramas. */
  memo: Map<number, UnitCost>;
  stack: Set<number>;
};

type UnitCost = {
  buy: number | null;
  craft: number | null;
  best: number;
  mode: NodeMode;
  canChoose: boolean;
};

function pickMode(
  buy: number | null,
  craft: number | null,
  override?: 'buy' | 'craft'
): NodeMode {
  if (override === 'buy' && buy !== null) return 'buy';
  if (override === 'craft' && craft !== null) return 'craft';
  if (craft !== null && (buy === null || craft < buy)) return 'craft';
  if (buy !== null) return 'buy';
  return 'account';
}

function unitCost(ctx: CostContext, id: number): UnitCost {
  const cached = ctx.memo.get(id);
  if (cached) return cached;

  // moneda del wallet usada como ingrediente: no tiene precio en oro
  if (itemAsCurrencyId(id) != null) {
    const result: UnitCost = {
      buy: null,
      craft: null,
      best: 0,
      mode: 'account',
      canChoose: false,
    };
    ctx.memo.set(id, result);
    return result;
  }

  const buy = unitPrice(ctx.prices, id, ctx.mode);

  // receta circular: se resuelve como "solo comprar" y no se memoiza,
  // porque el valor depende de la rama desde la que se llega
  if (ctx.stack.has(id)) {
    return {
      buy,
      craft: null,
      best: buy ?? 0,
      mode: buy !== null ? 'buy' : 'account',
      canChoose: false,
    };
  }

  // Klobjarne: siempre costear remnant (buy); logro = account sin oro
  if (isRepurchaseItem(id)) {
    const rr = REPURCHASE_RECIPES[id];
    ctx.stack.add(id);
    let sum = 0;
    for (const ing of rr.ingredients) {
      sum += unitCost(ctx, ing.id).best * ing.count;
    }
    ctx.stack.delete(id);
    const remnant = sum / (rr.output || 1);
    const mode = ctx.overrides[id] === 'buy' ? 'buy' : 'account';
    const result: UnitCost = {
      buy: remnant,
      craft: 0,
      best: mode === 'buy' ? remnant : 0,
      mode,
      canChoose: true,
    };
    ctx.memo.set(id, result);
    return result;
  }

  let craft: number | null = null;
  const recipe = recipeOf(ctx.data, id, ctx.overrides[id]);
  if (recipe) {
    ctx.stack.add(id);
    let sum = 0;
    for (const ing of recipe.ingredients) {
      sum += unitCost(ctx, ing.id).best * ing.count;
    }
    ctx.stack.delete(id);
    craft = sum / (recipe.output || 1);
  }

  const mode = pickMode(buy, craft, ctx.overrides[id]);
  const best = mode === 'craft' ? (craft as number) : mode === 'buy' ? (buy as number) : 0;
  const result: UnitCost = {
    buy,
    craft,
    best,
    mode,
    canChoose: buy !== null && craft !== null,
  };

  ctx.memo.set(id, result);
  return result;
}

/** Materiales que no se compran (mazmorras, exploración, colecciones…). */
export type AccountRequirement = { id: number; count: number };

/** Moneda que hace falta, descontando lo que ya tienes en el wallet. */
export type CurrencyRequirement = {
  id: number;
  needed: number;
  owned: number;
  remaining: number;
};

export type TreeResult = {
  root: TreeNode;
  /** Coste en cobre de lo que falta. */
  total: number;
  /** Coste sin descontar el inventario. */
  totalFull: number;
  accountRequirements: AccountRequirement[];
  currencyRequirements: CurrencyRequirement[];
  extras: { name: string; count: number }[];
};

type BuildContext = CostContext & {
  /** Existencias disponibles, se consumen de arriba abajo. */
  pool: Record<number, number>;
  /** Saldo de monedas de compra (karma / esquirlas…), se gasta al cubrir ítems. */
  walletPool: Record<number, number>;
  accountReq: Map<number, number>;
  /** Moneda total que exige el árbol (sin descontar wallet todavía). */
  currencyReq: Map<number, number>;
  extras: Map<string, number>;
  /** Ancestros de la rama actual: evita expandir recetas circulares. */
  path: Set<number>;
};

function clonePool(pool: Record<number, number>): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [key, value] of Object.entries(pool)) {
    const id = Number(key);
    if (value > 0) out[id] = value;
  }
  return out;
}

/**
 * Descuenta inventario ANTES de decidir comprar vs fabricar.
 * Si ya tienes los mats, fabricar puede ganar aunque el craft “lleno” sea más caro.
 *
 * La legendaria raíz (depth 0) no se descuenta: el tracker responde “¿cuánto
 * cuesta fabricar una?”, no “¿ya la tengo?”.
 */
function buildNode(ctx: BuildContext, id: number, requested: number, depth: number, key: string): TreeNode {
  const buyUnit = unitPrice(ctx.prices, id, ctx.mode);
  const sides = tpSides(ctx.prices, id);
  const override = ctx.overrides[id];
  const recipe = recipeOf(ctx.data, id, override);
  const reference = unitCost(ctx, id);
  const vendor = VENDOR_SOURCES[id];
  const source = vendor
    ? `Vendor: ${vendor.vendor}`
    : recipe?.source ?? null;

  const available = depth === 0 ? 0 : (ctx.pool[id] ?? 0);
  const owned = Math.min(requested, available);
  if (owned > 0) ctx.pool[id] = available - owned;
  const need = requested - owned;

  if (need <= 0) {
    return {
      key,
      id,
      need: 0,
      owned,
      depth,
      mode: 'account',
      canChoose: isRepurchaseItem(id),
      source,
      buyUnit,
      tpSell: sides.sell,
      tpBuy: sides.buy,
      craftUnit: reference.craft,
      total: 0,
      currency: null,
      children: [],
      extras: recipe?.extras ?? [],
    };
  }

  // Klobjarne: logro (account) vs remnant (buy → expand recipe)
  if (isRepurchaseItem(id)) {
    if (override === 'buy' && recipe) {
      const batches = need / (recipe.output || 1);
      ctx.path.add(id);
      const children = recipe.ingredients.map((ing, index) =>
        buildNode(ctx, ing.id, batches * ing.count, depth + 1, `${key}.${index}`)
      );
      ctx.path.delete(id);
      const total = children.reduce((sum, child) => sum + child.total, 0);
      return {
        key,
        id,
        need,
        owned,
        depth,
        mode: 'buy',
        canChoose: true,
        source: recipe.source,
        buyUnit: total / need,
        tpSell: null,
        tpBuy: null,
        craftUnit: 0,
        total,
        currency: null,
        children,
        extras: [],
      };
    }
    ctx.accountReq.set(id, (ctx.accountReq.get(id) ?? 0) + need);
    return {
      key,
      id,
      need,
      owned,
      depth,
      mode: 'account',
      canChoose: true,
      source: null,
      // ponytail: buyUnit = remnant unit so toggle can show cost while on logro
      buyUnit: reference.buy,
      tpSell: null,
      tpBuy: null,
      craftUnit: 0,
      total: 0,
      currency: null,
      children: [],
      extras: [],
    };
  }

  // moneda del wallet como hoja del árbol
  const currencyId = itemAsCurrencyId(id);
  if (currencyId != null) {
    ctx.currencyReq.set(currencyId, (ctx.currencyReq.get(currencyId) ?? 0) + need);
    return {
      key,
      id,
      need,
      owned,
      depth,
      mode: 'account',
      canChoose: false,
      source: null,
      buyUnit: null,
      tpSell: null,
      tpBuy: null,
      craftUnit: null,
      total: 0,
      currency: { id: currencyId, unit: 1, total: need },
      children: [],
      extras: [],
    };
  }

  const canCraft = !!recipe && depth < 12 && !ctx.path.has(id) && !ctx.stack.has(id);

  let craftChildren: TreeNode[] = [];
  let craftTotal: number | null = null;
  let craftUnitFromTree: number | null = null;

  const tryCraft = () => {
    if (!canCraft || !recipe) return;
    const batches = need / (recipe.output || 1);
    ctx.path.add(id);
    craftChildren = recipe.ingredients.map((ing, index) =>
      buildNode(ctx, ing.id, batches * ing.count, depth + 1, `${key}.${index}`)
    );
    ctx.path.delete(id);
    for (const extra of recipe.extras ?? []) {
      ctx.extras.set(extra.name, (ctx.extras.get(extra.name) ?? 0) + extra.count * batches);
    }
    craftTotal = craftChildren.reduce((sum, child) => sum + child.total, 0);
    craftUnitFromTree = craftTotal / need;
  };

  if (canCraft && recipe && override !== 'buy') {
    const poolBefore = clonePool(ctx.pool);
    const accountBefore = new Map(ctx.accountReq);
    const currencyBefore = new Map(ctx.currencyReq);
    const extrasBefore = new Map(ctx.extras);

    tryCraft();

    const buyTotal = buyUnit !== null ? buyUnit * need : null;
    const preferBuy =
      override !== 'craft' &&
      buyTotal !== null &&
      (craftTotal === null || buyTotal <= craftTotal);

    if (preferBuy) {
      // comprar gana: devolver mats/moneda consumidos por la rama craft
      ctx.pool = poolBefore;
      ctx.accountReq = accountBefore;
      ctx.currencyReq = currencyBefore;
      ctx.extras = extrasBefore;
      craftChildren = [];
      craftTotal = null;
    }
  } else if (canCraft && recipe && override === 'buy') {
    // aún calculamos craft (con inventario) para el toggle de la UI
    const poolBefore = clonePool(ctx.pool);
    const accountBefore = new Map(ctx.accountReq);
    const currencyBefore = new Map(ctx.currencyReq);
    const extrasBefore = new Map(ctx.extras);
    tryCraft();
    craftUnitFromTree = craftTotal !== null ? craftTotal / need : null;
    ctx.pool = poolBefore;
    ctx.accountReq = accountBefore;
    ctx.currencyReq = currencyBefore;
    ctx.extras = extrasBefore;
    craftChildren = [];
    craftTotal = null;
  }

  const buyTotal = buyUnit !== null ? buyUnit * need : null;
  let mode: NodeMode;
  let total: number;
  let children: TreeNode[] = [];
  let currency: TreeNode['currency'] = null;

  if (override === 'buy' && buyTotal !== null) {
    mode = 'buy';
    total = buyTotal;
  } else if (craftTotal !== null) {
    mode = 'craft';
    total = craftTotal;
    children = craftChildren;
  } else if (buyTotal !== null) {
    mode = 'buy';
    total = buyTotal;
  } else {
    mode = 'account';
    total = 0;
    const src = CURRENCY_SOURCES[id];
    const walletCurrency = WALLET_AS_ITEM[id];
    if (src) {
      const selected =
        src.options.find((option) => option.key === ctx.currencyOverrides[id]) ?? src.options[0];
      const currencyTotal = Math.ceil(need / selected.output) * selected.price;
      const have = ctx.walletPool[src.currency] ?? 0;
      const paid = Math.min(have, currencyTotal);
      if (paid > 0) ctx.walletPool[src.currency] = have - paid;
      const remaining = currencyTotal - paid;
      currency = {
        id: src.currency,
        unit: selected.price / selected.output,
        total: remaining,
      };
      if (remaining > 0) {
        ctx.currencyReq.set(
          src.currency,
          (ctx.currencyReq.get(src.currency) ?? 0) + remaining
        );
      }
    } else if (walletCurrency) {
      // Ya descontado del pool (wallet → ítem); lo que queda es lo que falta farmar
      currency = { id: walletCurrency, unit: 1, total: need };
      ctx.currencyReq.set(
        walletCurrency,
        (ctx.currencyReq.get(walletCurrency) ?? 0) + need
      );
    } else {
      ctx.accountReq.set(id, (ctx.accountReq.get(id) ?? 0) + need);
    }
  }

  return {
    key,
    id,
    need,
    owned,
    depth,
    mode,
    canChoose: buyUnit !== null && !!recipe && !vendor,
    source,
    buyUnit,
    tpSell: sides.sell,
    tpBuy: sides.buy,
    craftUnit: craftUnitFromTree ?? reference.craft,
    total,
    currency,
    currencyChoice: CURRENCY_SOURCES[id]
      ? (CURRENCY_SOURCES[id].options.find(
          (option) => option.key === ctx.currencyOverrides[id]
        )?.key ?? CURRENCY_SOURCES[id].options[0].key)
      : undefined,
    currencyChoices: CURRENCY_SOURCES[id]?.options.map((option) => ({
      key: option.key,
      label: option.label,
      total: Math.ceil(need / option.output) * option.price,
    })),
    children,
    extras: recipe?.extras ?? [],
  };
}

export function buildTree(
  data: LegendaryData,
  rootId: number,
  prices: PriceMap,
  options: {
    mode?: PriceMode;
    owned?: Record<number, number>;
    wallet?: Record<number, number>;
    quantity?: number;
    overrides?: DecisionOverride;
    currencyOverrides?: CurrencyOverride;
  } = {}
): TreeResult {
  const shared = {
    data,
    prices,
    mode: options.mode ?? 'sell',
    overrides: options.overrides ?? {},
    currencyOverrides: options.currencyOverrides ?? {},
    memo: new Map<number, UnitCost>(),
    stack: new Set<number>(),
  };

  const ownedPool = clonePool(options.owned ?? {});
  const wallet = options.wallet ?? {};

  // Monedas-material (Sap, Ducats, Rift Essence…): el wallet cuenta como tenerlas
  for (const currencyId of MATERIAL_CURRENCIES) {
    const bal = wallet[currencyId] ?? 0;
    if (bal > 0) {
      const pseudo = currencyAsItemId(currencyId);
      ownedPool[pseudo] = (ownedPool[pseudo] ?? 0) + bal;
    }
  }
  for (const [itemId, currencyId] of Object.entries(WALLET_AS_ITEM)) {
    const bal = wallet[currencyId] ?? 0;
    if (bal > 0) {
      const id = Number(itemId);
      ownedPool[id] = (ownedPool[id] ?? 0) + bal;
    }
  }

  // Karma / esquirlas: se gastan al cubrir ítems de vendedor (CURRENCY_SOURCES)
  const walletPool = clonePool(wallet);
  for (const currencyId of MATERIAL_CURRENCIES) {
    delete walletPool[currencyId];
  }

  const ctx: BuildContext = {
    ...shared,
    pool: clonePool(ownedPool),
    walletPool: clonePool(walletPool),
    accountReq: new Map(),
    currencyReq: new Map(),
    extras: new Map(),
    path: new Set(),
  };

  const quantity = options.quantity ?? 1;
  const root = buildNode(ctx, rootId, quantity, 0, 'r');

  // total sin inventario ni wallet
  const fullCtx: BuildContext = {
    ...shared,
    memo: new Map(),
    stack: new Set(),
    pool: {},
    walletPool: {},
    accountReq: new Map(),
    currencyReq: new Map(),
    extras: new Map(),
    path: new Set(),
  };
  const totalFull = buildNode(fullCtx, rootId, quantity, 0, 'r').total;

  // necesitas (bruto) vs faltan (tras inventario + wallet)
  const currencyIds = new Set([...ctx.currencyReq.keys(), ...fullCtx.currencyReq.keys()]);
  const currencyRequirements = [...currencyIds]
    .map((id) => {
      const needed = fullCtx.currencyReq.get(id) ?? 0;
      const remaining = ctx.currencyReq.get(id) ?? 0;
      return { id, needed, owned: Math.max(0, needed - remaining), remaining };
    })
    .filter((req) => req.needed > 0)
    .sort((a, b) => b.needed - a.needed);

  return {
    root,
    total: root.total,
    totalFull,
    accountRequirements: [...ctx.accountReq.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count),
    currencyRequirements,
    extras: [...ctx.extras.entries()].map(([name, count]) => ({ name, count })),
  };
}

/** Todos los ids del árbol, para pedir precios en lote. */
export function collectIds(data: LegendaryData, rootId: number): number[] {
  const ids = new Set<number>();
  const walk = (id: number, depth: number) => {
    if (ids.has(id) || depth > 12 || id < 0) return;
    ids.add(id);
    const recipe = recipeOf(data, id) ?? REPURCHASE_RECIPES[id];
    for (const ing of recipe?.ingredients ?? []) walk(ing.id, depth + 1);
  };
  walk(rootId, 0);
  return [...ids];
}

export function flattenTree(node: TreeNode, out: TreeNode[] = []): TreeNode[] {
  out.push(node);
  for (const child of node.children) flattenTree(child, out);
  return out;
}

/** Lista de compra TP + mats de remanente Klobjarne (mapa) cuando mode=buy. */
export function shoppingList(root: TreeNode): { id: number; need: number; total: number }[] {
  const map = new Map<number, { need: number; total: number }>();
  const add = (id: number, need: number, total: number) => {
    const cur = map.get(id) ?? { need: 0, total: 0 };
    cur.need += need;
    cur.total += total;
    map.set(id, cur);
  };
  const walk = (n: TreeNode, underRemnant = false) => {
    if (n.need <= 0) return;
    if (n.mode === 'buy' && !isRepurchaseItem(n.id) && n.id > 0) {
      add(n.id, n.need, n.total);
      return;
    }
    // honeycomb / mursaat bajo remnant: no cotizan, pero sí cuentan en materiales
    if (underRemnant && n.mode === 'account' && n.id > 0 && n.children.length === 0) {
      add(n.id, n.need, 0);
      return;
    }
    const next = underRemnant || isRepurchaseItem(n.id);
    for (const c of n.children) walk(c, next);
  };
  walk(root);
  return [...map.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.total - a.total || b.need - a.need);
}

export function armorWeight(entry: LegendaryEntry): 'light' | 'medium' | 'heavy' | null {
  if ((entry.kind ?? 'weapon') !== 'armor') return null;
  const n = entry.name;
  if (/\bLight\b/.test(n)) return 'light';
  if (/\bMedium\b/.test(n)) return 'medium';
  if (/\bHeavy\b/.test(n)) return 'heavy';
  if (/Breastplate|Gauntlets|Greaves|Helmet|Pauldrons|Tassets|Cuisses/.test(n)) return 'heavy';
  if (/Jerkin|Jacket|Shoulderpads|Mask/.test(n)) return 'medium';
  if (/Cowl|Mantle|Vestments|Crown|Regalia|Vambraces|Shoes|Pants/.test(n)) return 'light';
  if (/Boots|Gloves|Leggings/.test(n)) return 'medium';
  return null;
}

/**
 * Enlace a la wiki oficial. Español usa la wiki en inglés (wiki-es incompleta).
 * @deprecated Preferir import desde `@/lib/gw2-wiki`.
 */
export { gw2WikiUrl } from '@/lib/gw2-wiki';

export async function fetchPrices(ids: number[]): Promise<PriceMap> {
  const map: PriceMap = {};
  for (let i = 0; i < ids.length; i += 180) {
    const chunk = ids.slice(i, i + 180);
    try {
      const res = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${chunk.join(',')}`);
      if (!res.ok) continue;
      const rows = (await res.json()) as {
        id: number;
        buys?: { unit_price: number; quantity?: number };
        sells?: { unit_price: number; quantity?: number };
      }[];
      for (const row of rows) {
        map[row.id] = {
          buy: row.buys?.unit_price ?? 0,
          sell: row.sells?.unit_price ?? 0,
          sellQty: row.sells?.quantity ?? 0,
        };
      }
    } catch {
      // sin precios el nodo se muestra como no comprable
    }
  }
  return map;
}
