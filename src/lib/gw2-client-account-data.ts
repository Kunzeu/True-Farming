import {
  fetchGw2ByIds,
  fetchUserGw2ApiKey,
  gw2AuthedGet,
  gw2PublicGet,
} from '@/lib/gw2-client-api';

type WalletItem = { id: number; value: number };
type Currency = { id: number; name: string; description: string; order: number; icon: string };

export async function fetchWalletFromBrowser(userId: string, lang: string, currencyIds: number[]) {
  const apiKey = await fetchUserGw2ApiKey(userId);
  if (!apiKey) return null;

  const walletRes = await gw2AuthedGet('/account/wallet', apiKey);
  if (!walletRes.ok) {
    throw new Error(`GW2 wallet: ${walletRes.status} ${walletRes.statusText}`);
  }

  const wallet: WalletItem[] = await walletRes.json();
  const filtered = wallet.filter((item) => currencyIds.includes(item.id));
  const currencies = await fetchGw2ByIds<Currency>('currencies', currencyIds, `&lang=${lang}`);
  return { wallet: filtered, currencies };
}

export async function fetchMaterialsFromBrowser(userId: string, lang: string) {
  const apiKey = await fetchUserGw2ApiKey(userId);
  if (!apiKey) return null;

  const res = await gw2AuthedGet('/account/materials', apiKey);
  if (!res.ok) {
    throw new Error(`GW2 materials: ${res.status} ${res.statusText}`);
  }

  const materialsData: Array<{ id: number; count: number }> = await res.json();
  const held = materialsData.filter((m) => m?.id && m.count > 0);
  const items = await fetchGw2ByIds<{ id: number; name: string; icon?: string; rarity?: string }>(
    'items',
    held.map((m) => m.id),
    `&lang=${lang}`,
  );
  const itemMap = new Map(items.map((item) => [item.id, item]));

  return held.map((storageMaterial) => {
    const item = itemMap.get(storageMaterial.id);
    return {
      ...storageMaterial,
      name: item?.name || `Item ${storageMaterial.id}`,
      icon: item?.icon,
      rarity: item?.rarity,
      max_count: 250,
    };
  });
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

export async function fetchBankFromBrowser(userId: string, lang: string): Promise<Array<BankItem | null> | null> {
  const apiKey = await fetchUserGw2ApiKey(userId);
  if (!apiKey) return null;

  const res = await gw2AuthedGet('/account/bank', apiKey);
  if (!res.ok) {
    throw new Error(`GW2 bank: ${res.status} ${res.statusText}`);
  }

  const bankData: Array<{ id: number; count: number } | null> = await res.json();
  const itemIds = bankData.filter(Boolean).map((item) => item!.id);
  const [items, prices] = await Promise.all([
    fetchGw2ByIds<{ id: number; name: string; icon?: string; rarity?: string; type?: string }>(
      'items',
      itemIds,
      `&lang=${lang}`,
    ),
    fetchGw2ByIds<{ id: number; buys?: { unit_price: number }; sells?: { unit_price: number } }>(
      'commerce/prices',
      itemIds,
    ),
  ]);
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

export async function fetchCharactersFromBrowser(userId: string) {
  const apiKey = await fetchUserGw2ApiKey(userId);
  if (!apiKey) return null;

  const allRes = await gw2AuthedGet('/characters?ids=all', apiKey);
  if (allRes.ok) {
    return allRes.json();
  }

  const listRes = await gw2AuthedGet('/characters', apiKey);
  if (!listRes.ok) {
    throw new Error(`GW2 characters: ${listRes.status} ${listRes.statusText}`);
  }

  const names: string[] = await listRes.json();
  const characters = (
    await Promise.all(
      names.map(async (name) => {
        const res = await gw2AuthedGet(`/characters/${encodeURIComponent(name)}`, apiKey);
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

export async function fetchAccountSearchIndex(userId: string, lang: string) {
  const apiKey = await fetchUserGw2ApiKey(userId);
  if (!apiKey) return null;

  const slots: SearchSlot[] = [];

  const [bankRes, matsRes, sharedRes, namesRes] = await Promise.allSettled([
    gw2AuthedGet('/account/bank', apiKey),
    gw2AuthedGet('/account/materials', apiKey),
    gw2AuthedGet('/account/inventory', apiKey),
    gw2AuthedGet('/characters', apiKey),
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
        const res = await gw2AuthedGet(`/characters/${encodeURIComponent(name)}/inventory`, apiKey);
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

export async function fetchGw2AccountName(userId: string): Promise<string | null> {
  const apiKey = await fetchUserGw2ApiKey(userId);
  if (!apiKey) return null;
  const res = await gw2AuthedGet('/account', apiKey);
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return typeof data?.name === 'string' ? data.name : null;
}
