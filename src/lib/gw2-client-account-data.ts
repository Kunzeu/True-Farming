import {
  fetchGw2ByIds,
  fetchUserGw2ApiKey,
  gw2AuthedGet,
  gw2PublicGet,
} from '@/lib/gw2-client-api';
import { GW2_CACHE_TTL, readSessionCache, writeSessionCache } from '@/lib/gw2-client-cache';
import type { MaterialCategoryDef, StorageMaterial } from '@/lib/gw2-material-storage';

async function resolveApiKey(userId: string, apiKey?: string | null): Promise<string | null> {
  if (apiKey) return apiKey;
  return fetchUserGw2ApiKey(userId);
}

type MaterialCategoryRaw = { id: number; name: string; order: number; items: number[] };

async function fetchMaterialCategoryDefs(lang: string): Promise<MaterialCategoryRaw[]> {
  const cacheKey = `gw2_materials_categories_${lang}`;
  const cached = readSessionCache<MaterialCategoryRaw[]>(cacheKey, GW2_CACHE_TTL.materials);
  if (cached) return cached;

  const res = await gw2PublicGet(`/materials?ids=all&lang=${lang}`);
  if (!res.ok) {
    throw new Error(`GW2 material categories: ${res.status} ${res.statusText}`);
  }
  const data: MaterialCategoryRaw[] = await res.json();
  writeSessionCache(cacheKey, data, GW2_CACHE_TTL.materials);
  return data;
}

type WalletItem = { id: number; value: number };
type Currency = { id: number; name: string; description: string; order: number; icon: string };

export async function fetchWalletFromBrowser(
  userId: string,
  lang: string,
  currencyIds: number[],
  apiKey?: string | null,
) {
  const key = await resolveApiKey(userId, apiKey);
  if (!key) return null;

  const walletRes = await gw2AuthedGet('/account/wallet', key);
  if (!walletRes.ok) {
    throw new Error(`GW2 wallet: ${walletRes.status} ${walletRes.statusText}`);
  }

  const wallet: WalletItem[] = await walletRes.json();
  const filtered = wallet.filter((item) => currencyIds.includes(item.id));
  const currencies = await fetchGw2ByIds<Currency>('currencies', currencyIds, `&lang=${lang}`);
  return { wallet: filtered, currencies };
}

export type MaterialStorageData = {
  categories: MaterialCategoryDef[];
  materials: StorageMaterial[];
};

export async function fetchMaterialsFromBrowser(
  userId: string,
  lang: string,
  apiKey?: string | null,
  options?: { withPrices?: boolean },
): Promise<MaterialStorageData | null> {
  const key = await resolveApiKey(userId, apiKey);
  if (!key) return null;

  const withPrices = options?.withPrices !== false;

  const [accountRes, categoryDefs] = await Promise.all([
    gw2AuthedGet('/account/materials', key),
    fetchMaterialCategoryDefs(lang),
  ]);

  if (!accountRes.ok) {
    throw new Error(`GW2 materials: ${accountRes.status} ${accountRes.statusText}`);
  }

  const materialsData: Array<{ id: number; count: number; category?: number }> = await accountRes.json();

  const categories: MaterialCategoryDef[] = categoryDefs
    .map((cat) => ({ id: cat.id, name: cat.name, order: cat.order }))
    .sort((a, b) => a.order - b.order);

  const itemCategory = new Map<number, { categoryId: number; inGameOrder: number }>();
  for (const cat of categoryDefs) {
    cat.items.forEach((itemId, index) => {
      itemCategory.set(itemId, { categoryId: cat.id, inGameOrder: index });
    });
  }

  const held = materialsData.filter((m) => m?.id && m.count > 0);
  const itemIds = held.map((m) => m.id);

  const items = await fetchGw2ByIds<{ id: number; name: string; icon?: string; rarity?: string }>(
    'items',
    itemIds,
    `&lang=${lang}`,
  );
  const prices = withPrices
    ? await fetchGw2ByIds<{ id: number; sells?: { unit_price: number } }>('commerce/prices', itemIds)
    : [];

  const itemMap = new Map(items.map((item) => [item.id, item]));
  const priceMap = new Map(prices.map((price) => [price.id, price]));

  const materials: StorageMaterial[] = held.map((storageMaterial) => {
    const item = itemMap.get(storageMaterial.id);
    const meta =
      itemCategory.get(storageMaterial.id) ??
      (storageMaterial.category != null
        ? {
            categoryId: storageMaterial.category,
            inGameOrder: categoryDefs.find((c) => c.id === storageMaterial.category)?.items.indexOf(storageMaterial.id) ?? 9999,
          }
        : { categoryId: 0, inGameOrder: 9999 });

    return {
      id: storageMaterial.id,
      count: storageMaterial.count,
      categoryId: meta.categoryId,
      inGameOrder: meta.inGameOrder,
      name: item?.name || `Item ${storageMaterial.id}`,
      icon: item?.icon,
      rarity: item?.rarity,
      unitPrice: priceMap.get(storageMaterial.id)?.sells?.unit_price,
    };
  });

  return { categories, materials };
}

export async function enrichMaterialPrices(materials: StorageMaterial[]): Promise<StorageMaterial[]> {
  const itemIds = materials.map((m) => m.id);
  const prices = await fetchGw2ByIds<{ id: number; sells?: { unit_price: number } }>(
    'commerce/prices',
    itemIds,
  );
  const priceMap = new Map(prices.map((price) => [price.id, price]));
  return materials.map((material) => ({
    ...material,
    unitPrice: priceMap.get(material.id)?.sells?.unit_price,
  }));
}

type BankItem = {
  id: number;
  count: number;
  name: string;
  icon?: string;
  rarity?: string;
  type?: string;
  slot: number;
  price?: { id: number; buys?: { unit_price: number }; sells?: { unit_price: number } };
};

export async function fetchBankFromBrowser(
  userId: string,
  lang: string,
  apiKey?: string | null,
  options?: { withPrices?: boolean },
): Promise<Array<BankItem | null> | null> {
  const key = await resolveApiKey(userId, apiKey);
  if (!key) return null;

  const withPrices = options?.withPrices !== false;

  const res = await gw2AuthedGet('/account/bank', key);
  if (!res.ok) {
    throw new Error(`GW2 bank: ${res.status} ${res.statusText}`);
  }

  const bankData: Array<{ id: number; count: number } | null> = await res.json();
  const itemIds = bankData.filter(Boolean).map((item) => item!.id);
  const items = await fetchGw2ByIds<{ id: number; name: string; icon?: string; rarity?: string; type?: string }>(
    'items',
    itemIds,
    `&lang=${lang}`,
  );
  const prices = withPrices
    ? await fetchGw2ByIds<{ id: number; buys?: { unit_price: number }; sells?: { unit_price: number } }>(
        'commerce/prices',
        itemIds,
      )
    : [];
  const itemsMap = new Map(items.map((item) => [item.id, item]));
  const priceMap = new Map(prices.map((price) => [price.id, price]));

  return bankData.map((bankItem, index) => {
    if (!bankItem) return null;
    const details = itemsMap.get(bankItem.id);
    return {
      ...bankItem,
      name: details?.name || `Item ${bankItem.id}`,
      icon: details?.icon,
      rarity: details?.rarity,
      type: details?.type,
      slot: index,
      price: priceMap.get(bankItem.id),
    };
  });
}

export async function enrichBankWithPrices(
  bankData: Array<BankItem | null>,
): Promise<Array<BankItem | null>> {
  const itemIds = bankData.filter(Boolean).map((item) => item!.id);
  const prices = await fetchGw2ByIds<{ id: number; buys?: { unit_price: number }; sells?: { unit_price: number } }>(
    'commerce/prices',
    itemIds,
  );
  const priceMap = new Map(prices.map((price) => [price.id, price]));
  return bankData.map((bankItem) => {
    if (!bankItem) return null;
    return { ...bankItem, price: priceMap.get(bankItem.id) };
  });
}

export async function fetchCharactersFromBrowser(userId: string, apiKey?: string | null) {
  const key = await resolveApiKey(userId, apiKey);
  if (!key) return null;

  const allRes = await gw2AuthedGet('/characters?ids=all', key);
  if (allRes.ok) {
    return allRes.json();
  }

  const listRes = await gw2AuthedGet('/characters', key);
  if (!listRes.ok) {
    throw new Error(`GW2 characters: ${listRes.status} ${listRes.statusText}`);
  }

  const names: string[] = await listRes.json();
  const characters = (
    await Promise.all(
      names.map(async (name) => {
        const res = await gw2AuthedGet(`/characters/${encodeURIComponent(name)}`, key);
        return res.ok ? res.json() : null;
      }),
    )
  ).filter(Boolean);

  return characters;
}

type SearchSlot = {
  id: number;
  count: number;
  location: string;
  category: 'bank' | 'character' | 'storage' | 'shared';
  character?: string;
  bag?: number;
  slot?: number;
};

export async function fetchAccountSearchIndex(userId: string, lang: string, apiKey?: string | null) {
  const key = await resolveApiKey(userId, apiKey);
  if (!key) return null;

  const slots: SearchSlot[] = [];

  const [bankRes, matsRes, sharedRes, namesRes] = await Promise.allSettled([
    gw2AuthedGet('/account/bank', key),
    gw2AuthedGet('/account/materials', key),
    gw2AuthedGet('/account/inventory', key),
    gw2AuthedGet('/characters', key),
  ]);

  const readJson = async <T>(result: PromiseSettledResult<Response>): Promise<T | null> => {
    if (result.status !== 'fulfilled' || !result.value.ok) return null;
    return result.value.json().catch(() => null);
  };

  const bank = await readJson<Array<{ id: number; count: number } | null>>(bankRes);
  bank?.forEach((item, index) => {
    if (item?.id) {
      slots.push({ id: item.id, count: item.count, location: `search.bankSlot ${index + 1}`, category: 'bank', slot: index + 1 });
    }
  });

  const mats = await readJson<Array<{ id: number; count: number }>>(matsRes);
  mats?.forEach((item) => {
    if (item?.id && item.count > 0) {
      slots.push({ id: item.id, count: item.count, location: 'search.materialStorage', category: 'storage' });
    }
  });

  const shared = await readJson<Array<{ id: number; count: number } | null>>(sharedRes);
  shared?.forEach((item, index) => {
    if (item?.id) {
      slots.push({ id: item.id, count: item.count, location: 'Shared inventory', category: 'shared', slot: index + 1 });
    }
  });

  const names = await readJson<string[]>(namesRes);
  if (Array.isArray(names) && names.length) {
    const inventories = await Promise.all(
      names.map(async (name) => {
        const res = await gw2AuthedGet(`/characters/${encodeURIComponent(name)}/inventory`, key);
        if (!res.ok) return { name, bags: [] as Array<{ inventory?: Array<{ id: number; count: number } | null> } | null> };
        const data = await res.json().catch(() => null);
        return { name, bags: data?.bags || [] };
      }),
    );
    for (const { name, bags } of inventories) {
      bags.forEach((bag, bagIndex) => {
        bag?.inventory?.forEach((item, slotIndex) => {
          if (item?.id) {
            slots.push({
              id: item.id,
              count: item.count,
              location: `${name} - search.characterBag ${bagIndex + 1}`,
              category: 'character',
              character: name,
              bag: bagIndex + 1,
              slot: slotIndex + 1,
            });
          }
        });
      });
    }
  }

  const items = await fetchGw2ByIds<{ id: number; name: string; icon?: string; rarity?: string }>(
    'items',
    slots.map((s) => s.id),
    `&lang=${lang}`,
  );
  const itemMap = new Map(items.map((item) => [item.id, item]));

  return slots
    .map((slot) => {
      const item = itemMap.get(slot.id);
      if (!item?.name) return null;
      return {
        id: slot.id,
        name: item.name,
        icon: item.icon,
        count: slot.count,
        location: slot.location,
        rarity: item.rarity,
        category: slot.category,
        character: slot.character,
        bag: slot.bag,
        slot: slot.slot,
      };
    })
    .filter(Boolean);
}

export async function fetchGw2AccountName(userId: string, apiKey?: string | null): Promise<string | null> {
  const key = await resolveApiKey(userId, apiKey);
  if (!key) return null;
  const res = await gw2AuthedGet('/account', key);
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return typeof data?.name === 'string' ? data.name : null;
}

export type Gw2AccountProfile = {
  id: string;
  name: string;
  age: number;
  access: string[];
  commander?: boolean;
  created: string;
  fractal_level?: number;
  daily_ap?: number;
  monthly_ap?: number;
  wvw_rank?: number;
  pvp_rank?: number;
  guild_leader?: string[];
  guilds?: string[];
};

export async function fetchGw2AccountProfile(
  userId: string,
  apiKey?: string | null,
): Promise<Gw2AccountProfile | null> {
  const key = await resolveApiKey(userId, apiKey);
  if (!key) return null;
  const res = await gw2AuthedGet('/account', key);
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

type InventoryItemSlot = {
  id: number;
  count: number;
  name?: string;
  icon?: string;
  rarity?: string;
  vendor_value?: number;
};

export async function enrichCharactersWithItems<T extends {
  inventory?: { bags?: Array<{ inventory?: Array<InventoryItemSlot | null> }> } | null;
}>(characters: T[], lang: string): Promise<T[]> {
  const itemIds = new Set<number>();
  for (const char of characters) {
    char.inventory?.bags?.forEach((bag) => {
      if (!bag) return;
      bag.inventory?.forEach((item) => {
        if (item?.id) itemIds.add(item.id);
      });
    });
  }
  if (!itemIds.size) return characters;

  const items = await fetchGw2ByIds<{
    id: number;
    name: string;
    icon?: string;
    rarity?: string;
    vendor_value?: number;
  }>('items', [...itemIds], `&lang=${lang}`);

  const map = new Map(items.map((item) => [item.id, item]));

  return characters.map((char) => ({
    ...char,
    inventory: char.inventory
      ? {
          ...char.inventory,
          bags: char.inventory.bags?.map((bag) => {
            if (!bag) return bag;
            return {
              ...bag,
              inventory: bag.inventory?.map((slot) => {
                if (!slot?.id) return slot;
                const detail = map.get(slot.id);
                if (!detail) return slot;
                return {
                  ...slot,
                  name: detail.name,
                  icon: detail.icon,
                  rarity: detail.rarity,
                  vendor_value: detail.vendor_value,
                };
              }),
            };
          }),
        }
      : char.inventory,
  }));
}

async function fetchWorldNames(worldIds: number[], lang: string): Promise<Map<number, string>> {
  if (!worldIds.length) return new Map();
  const res = await gw2PublicGet(`/worlds?ids=${worldIds.join(',')}&lang=${lang}`);
  if (!res.ok) return new Map();
  const worlds: Array<{ id: number; name: string }> = await res.json();
  return new Map(worlds.map((world) => [world.id, world.name]));
}

export type EnrichedCharacter = {
  name: string;
  profession: string;
  level: number;
  race: string;
  specialization?: string;
  world: number;
  worldName?: string;
  inventory?: {
    bags?: Array<{
      id: number;
      size: number;
      inventory: Array<InventoryItemSlot | null>;
    } | null>;
  } | null;
};

async function fetchCharacterInventories(
  characters: Array<{ name: string }>,
  key: string,
): Promise<Map<string, EnrichedCharacter['inventory']>> {
  const entries = await Promise.all(
    characters.map(async (char) => {
      const res = await gw2AuthedGet(`/characters/${encodeURIComponent(char.name)}/inventory`, key);
      if (!res.ok) return [char.name, null] as const;
      const data = await res.json().catch(() => null);
      return [char.name, (data as EnrichedCharacter['inventory']) ?? null] as const;
    }),
  );
  return new Map(entries);
}

export async function fetchCharactersEnrichedFromBrowser(
  userId: string,
  lang: string,
  apiKey?: string | null,
): Promise<EnrichedCharacter[] | null> {
  const key = await resolveApiKey(userId, apiKey);
  const characters = await fetchCharactersFromBrowser(userId, apiKey);
  if (!characters || !Array.isArray(characters)) return null;

  const inventoryByName = key
    ? await fetchCharacterInventories(characters as Array<{ name: string }>, key)
    : new Map<string, EnrichedCharacter['inventory']>();

  const charactersWithInventory = (characters as EnrichedCharacter[]).map((char) => ({
    ...char,
    inventory: inventoryByName.get(char.name) ?? char.inventory ?? null,
  }));

  const worldIds = [
    ...new Set(
      charactersWithInventory
        .map((c) => c.world)
        .filter((id): id is number => typeof id === 'number' && id > 0),
    ),
  ];
  const worldNames = await fetchWorldNames(worldIds, lang);
  const enriched = await enrichCharactersWithItems(charactersWithInventory, lang);

  return enriched.map((char) => ({
    ...char,
    worldName: char.world != null ? worldNames.get(char.world) : undefined,
  }));
}
