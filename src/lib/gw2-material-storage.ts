export type MaterialSortKey = 'in-game' | 'name' | 'price' | 'unit-price' | 'rarity' | 'count';

export type MaterialCategoryDef = {
  id: number;
  name: string;
  order: number;
};

export type StorageMaterial = {
  id: number;
  count: number;
  categoryId: number;
  inGameOrder: number;
  name: string;
  icon?: string;
  rarity?: string;
  unitPrice?: number;
};

const RARITY_RANK: Record<string, number> = {
  junk: 0,
  basic: 1,
  fine: 2,
  masterwork: 3,
  rare: 4,
  exotic: 5,
  ascended: 6,
  legendary: 7,
};

export function sortMaterials(materials: StorageMaterial[], sortBy: MaterialSortKey): StorageMaterial[] {
  const sorted = [...materials];
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name) || a.inGameOrder - b.inGameOrder);
    case 'count':
      return sorted.sort((a, b) => b.count - a.count || a.inGameOrder - b.inGameOrder);
    case 'rarity':
      return sorted.sort(
        (a, b) =>
          (RARITY_RANK[b.rarity?.toLowerCase() ?? ''] ?? -1) -
            (RARITY_RANK[a.rarity?.toLowerCase() ?? ''] ?? -1) ||
          a.inGameOrder - b.inGameOrder,
      );
    case 'unit-price':
      return sorted.sort(
        (a, b) => (b.unitPrice ?? 0) - (a.unitPrice ?? 0) || a.inGameOrder - b.inGameOrder,
      );
    case 'price':
      return sorted.sort(
        (a, b) =>
          b.count * (b.unitPrice ?? 0) - a.count * (a.unitPrice ?? 0) ||
          a.inGameOrder - b.inGameOrder,
      );
    case 'in-game':
    default:
      return sorted.sort((a, b) => a.inGameOrder - b.inGameOrder);
  }
}

export function groupMaterialsByCategory(
  materials: StorageMaterial[],
  categories: MaterialCategoryDef[],
): Array<{ category: MaterialCategoryDef; materials: StorageMaterial[] }> {
  const byCategory = new Map<number, StorageMaterial[]>();
  for (const material of materials) {
    const list = byCategory.get(material.categoryId) ?? [];
    list.push(material);
    byCategory.set(material.categoryId, list);
  }

  return categories
    .filter((category) => byCategory.has(category.id))
    .map((category) => ({
      category,
      materials: byCategory.get(category.id) ?? [],
    }));
}

export function getRarityBorderColor(rarity?: string) {
  switch (rarity?.toLowerCase()) {
    case 'legendary':
      return 'border-yellow-400';
    case 'exotic':
      return 'border-orange-400';
    case 'rare':
      return 'border-blue-400';
    case 'masterwork':
      return 'border-green-400';
    case 'fine':
      return 'border-blue-300';
    case 'ascended':
      return 'border-purple-400';
    default:
      return 'border-gray-500';
  }
}
