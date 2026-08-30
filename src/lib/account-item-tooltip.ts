export type AccountTooltipItem = {
  id: number;
  count: number;
  binding?: string;
  bound_to?: string;
};

export type AccountItemPrice = {
  id: number;
  whitelisted: boolean;
  buys: { unit_price: number; quantity: number };
  sells: { unit_price: number; quantity: number };
};

export type AccountItemDetails = {
  id: number;
  name: string;
  description?: string;
  type?: string;
  level?: number;
  rarity?: string;
  vendor_value?: number;
  icon?: string;
};

export type AccountTooltipData = {
  item: AccountTooltipItem;
  details: AccountItemDetails;
  price?: AccountItemPrice;
};

export function formatGoldParts(copper: number) {
  const gold = Math.floor(copper / 10000);
  const silver = Math.floor((copper % 10000) / 100);
  const copperRemaining = copper % 100;
  return { gold, silver, copper: copperRemaining };
}

export function formatGoldShort(copper: number) {
  const { gold, silver, copper: c } = formatGoldParts(copper);
  return `${gold}g ${silver}s ${c}c`;
}

export function getAccountItemRarityColor(rarity?: string) {
  switch (rarity?.toLowerCase()) {
    case 'legendary':
      return 'text-purple-400';
    case 'ascended':
      return 'text-fuchsia-400';
    case 'exotic':
      return 'text-amber-400';
    case 'rare':
      return 'text-yellow-400';
    case 'masterwork':
      return 'text-green-400';
    case 'fine':
      return 'text-slate-300';
    case 'basic':
      return 'text-slate-400';
    default:
      return 'text-gray-300';
  }
}
