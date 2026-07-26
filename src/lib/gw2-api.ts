import axios from 'axios';
import { GW2Item, GW2Price, GW2World, GW2Event, GW2Build, GW2Recipe, GW2Listing } from '@/types/gw2';

const GW2_API_BASE = 'https://api.guildwars2.com/v2';

// Cliente axios configurado para GW2 API
const gw2Api = axios.create({
  baseURL: GW2_API_BASE,
  timeout: 10000,
});

// Funciones para obtener datos de items
export async function getItem(id: number): Promise<GW2Item> {
  try {
    const response = await gw2Api.get<GW2Item>(`/items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    throw error;
  }
}

export async function getItems(ids: number[]): Promise<GW2Item[]> {
  try {
    const response = await gw2Api.get<GW2Item[]>(`/items?ids=${ids.join(',')}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
}

// Funciones para obtener precios del Trading Post
export async function getItemPrice(id: number): Promise<GW2Price> {
  try {
    const response = await gw2Api.get<GW2Price>(`/commerce/prices/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching price for item ${id}:`, error);
    throw error;
  }
}

export async function getItemPrices(ids: number[]): Promise<GW2Price[]> {
  try {
    const response = await gw2Api.get<GW2Price[]>(`/commerce/prices?ids=${ids.join(',')}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching prices:', error);
    throw error;
  }
}

// Función para obtener listings (órdenes de venta) de un item
export async function getItemListings(id: number): Promise<GW2Listing> {
  try {
    const response = await gw2Api.get<GW2Listing>(`/commerce/listings/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching listings for item ${id}:`, error);
    throw error;
  }
}

// Funciones para obtener información de mundos
export async function getWorlds(): Promise<GW2World[]> {
  try {
    const response = await gw2Api.get<GW2World[]>('/worlds?ids=all');
    return response.data;
  } catch (error) {
    console.error('Error fetching worlds:', error);
    throw error;
  }
}

export async function getWorld(id: number): Promise<GW2World> {
  try {
    const response = await gw2Api.get<GW2World>(`/worlds/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching world ${id}:`, error);
    throw error;
  }
}

// Funciones para obtener eventos mundiales
export async function getWorldEvents(): Promise<GW2Event[]> {
  try {
    const response = await gw2Api.get<GW2Event[]>('/events?world=1001&map_id=15');
    return response.data;
  } catch (error) {
    console.error('Error fetching world events:', error);
    throw error;
  }
}

// Funciones para obtener builds
export async function getBuilds(): Promise<GW2Build[]> {
  try {
    const response = await gw2Api.get<GW2Build[]>(`/build`);
    return response.data;
  } catch (error) {
    console.error('Error fetching builds:', error);
    throw error;
  }
}

// Funciones para obtener recetas
export async function getRecipe(id: number): Promise<GW2Recipe> {
  try {
    const response = await gw2Api.get<GW2Recipe>(`/recipes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching recipe ${id}:`, error);
    throw error;
  }
}

export async function getRecipes(ids: number[]): Promise<GW2Recipe[]> {
  try {
    const response = await gw2Api.get<GW2Recipe[]>(`/recipes?ids=${ids.join(',')}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
}

// Función para buscar items por nombre
export async function searchItems(query: string): Promise<GW2Item[]> {
  return searchItemsByName(query, 'en');
}

type Gw2Lang = 'en' | 'es' | 'de' | 'fr';

const searchCatalogCache = new Map<string, GW2Item[]>();

async function fetchItemsChunk(ids: number[], lang: Gw2Lang): Promise<GW2Item[]> {
  if (ids.length === 0) return [];
  const response = await fetch(
    `https://api.guildwars2.com/v2/items?ids=${ids.join(',')}&lang=${lang}`
  );
  if (!response.ok) return [];
  return response.json();
}

/** Catálogo de materiales craftables + populares, nombres en el idioma pedido. */
async function getSearchCatalog(lang: Gw2Lang): Promise<GW2Item[]> {
  const cached = searchCatalogCache.get(lang);
  if (cached) return cached;

  const idSet = new Set<number>();

  try {
    const matList = await gw2Api.get<number[]>('/materials');
    const mats = await gw2Api.get<Array<{ items: number[] }>>(
      `/materials?ids=${matList.data.join(',')}`
    );
    for (const cat of mats.data) {
      for (const id of cat.items) idSet.add(id);
    }
  } catch (e) {
    console.warn('materials catalog failed, using popular only', e);
  }

  // Ampliar con IDs populares de farming/crafting
  for (const id of [
    19721, 19700, 19701, 19722, 19723, 19724, 19725, 19726, 19727, 19728, 19729, 19730,
    19731, 19732, 19733, 19734, 19735, 19745, 19748, 24277, 19976, 24295, 46736, 89140,
    85016, 84731, 83008,
  ]) {
    idSet.add(id);
  }

  const ids = Array.from(idSet);
  const items: GW2Item[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = await fetchItemsChunk(ids.slice(i, i + 200), lang);
    items.push(...chunk);
  }

  searchCatalogCache.set(lang, items);
  return items;
}

/** Busca por nombre (idioma) o por ID numérico. */
export async function searchItemsByName(
  query: string,
  lang: string = 'en'
): Promise<GW2Item[]> {
  const apiLang: Gw2Lang =
    lang === 'es' || lang === 'de' || lang === 'fr' ? lang : 'en';
  const q = query.trim().toLowerCase();
  if (!q) return [];

  try {
    if (/^\d+$/.test(q)) {
      const res = await fetch(
        `https://api.guildwars2.com/v2/items/${q}?lang=${apiLang}`
      );
      if (res.ok) return [await res.json()];
      return [];
    }

    const catalog = await getSearchCatalog(apiLang);
    return catalog
      .filter((item) => item.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name, apiLang);
      })
      .slice(0, 24);
  } catch (error) {
    console.error('Error searching items:', error);
    throw error;
  }
}

/** Items populares con nombre en el idioma activo. */
export async function getPopularFarmingItemsLocalized(lang: string = 'en'): Promise<GW2Item[]> {
  const apiLang: Gw2Lang =
    lang === 'es' || lang === 'de' || lang === 'fr' ? lang : 'en';
  const popularItemIds = [
    19721, 24277, 19976, 19701, 19725, 19700, 19748, 19732, 24295, 19729, 19722, 19745,
  ];
  return fetchItemsChunk(popularItemIds, apiLang);
}

// Función para obtener items populares para farming
export async function getPopularFarmingItems(): Promise<GW2Item[]> {
  // IDs de items populares para farming y crafting
  const popularItemIds = [
    // Materiales básicos
    19721, // Orichalcum Ore
    19724, // Ancient Wood Log
    19725, // Elder Wood Log
    19726, // Hard Wood Log
    19727, // Seasoned Wood Log
    19728, // Soft Wood Log
    19729, // Green Wood Log
    19730, // Iron Ore
    19731, // Platinum Ore
    19732, // Gold Ore
    19733, // Silver Ore
    19734, // Copper Ore
    19735, // Mithril Ore
    19736, // Orichalcum Ore
    19737, // Rich Platinum Ore
    19738, // Rich Iron Ore
    19739, // Rich Gold Ore
    19740, // Rich Silver Ore
    19741, // Rich Copper Ore
    19742, // Rich Mithril Ore
    
    // Materiales de crafting
    19723, // Ancient Sapling
    19722, // Orichalcum Mining Pick
    19743, // Ancient Sapling
    19744, // Orichalcum Mining Pick
    
    // Items de festival
    19925, // Candy Corn
    28433, // Plastic Fangs
    28435, // Nougat Center
    28431, // Chattering Skull
    28432, // Spooky Food
    
    // Materiales de expansión
    19745, // Branded Mass
    19746, // Ley Line Crystal
    19747, // Airship Oil
    19748, // Auric Dust
    19749, // Chak Egg
    19750, // Crystalline Ore
    19751, // Dragonite Ore
    19752, // Empyreal Fragment
    19753, // Obsidian Shard
    19754, // Pile of Bloodstone Dust
    19755, // Pile of Crystalline Dust
    19756, // Pile of Incandescent Dust
    19757, // Pile of Lucent Crystal
    19758, // Pile of Radiant Dust
    19759, // Pile of Silky Sand
    19760, // Pile of Vile Essence
  ];
  
  try {
    return await getItems(popularItemIds);
  } catch (error) {
    console.error('Error fetching popular farming items:', error);
    throw error;
  }
}

// Función para obtener items por categoría
export async function getItemsByCategory(category: string): Promise<GW2Item[]> {
  const categoryItemIds: Record<string, number[]> = {
    'materials': [19721, 19724, 19725, 19726, 19727, 19728, 19729, 19730, 19731, 19732, 19733, 19734, 19735],
    'ores': [19721, 19730, 19731, 19732, 19733, 19734, 19735, 19736, 19737, 19738, 19739, 19740, 19741, 19742],
    'wood': [19724, 19725, 19726, 19727, 19728, 19729],
    'festival': [19925, 28433, 28435, 28431, 28432],
    'expansion': [19745, 19746, 19747, 19748, 19749, 19750, 19751, 19752, 19753, 19754, 19755, 19756, 19757, 19758, 19759, 19760]
  };

  const ids = categoryItemIds[category.toLowerCase()] || [];
  if (ids.length === 0) return [];

  try {
    return await getItems(ids);
  } catch (error) {
    console.error(`Error fetching items for category ${category}:`, error);
    throw error;
  }
}

// Función para calcular el margen de ganancia
export function calculateProfitMargin(buyPrice: number, sellPrice: number): number {
  if (buyPrice === 0) return 0;
  return ((sellPrice - buyPrice) / buyPrice) * 100;
}

// Función para formatear precios en oro, plata y cobre
export function formatPrice(copper: number): string {
  const gold = Math.floor(copper / 10000);
  const silver = Math.floor((copper % 10000) / 100);
  const copperRemaining = copper % 100;
  
  let result = '';
  if (gold > 0) result += `${gold}g `;
  if (silver > 0) result += `${silver}s `;
  if (copperRemaining > 0) result += `${copperRemaining}c`;
  
  return result.trim();
} 