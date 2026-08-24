// Tipos para Guild Wars 2 API

export interface GW2Item {
  id: number;
  name: string;
  description?: string;
  type: string;
  rarity: string;
  level: number;
  vendor_value: number;
  icon?: string;
  chat_link?: string;
  details?: {
    type?: string;
    weight_class?: string;
    defense?: number;
    infix_upgrade?: {
      attributes: Array<{
        attribute: string;
        modifier: number;
      }>;
    };
  };
}

export interface GW2Price {
  id: number;
  whitelisted: boolean;
  buys: {
    quantity: number;
    unit_price: number;
  };
  sells: {
    quantity: number;
    unit_price: number;
  };
}

export interface GW2Listing {
  id: number;
  buys: Array<{
    listings: number;
    unit_price: number;
    quantity: number;
  }>;
  sells: Array<{
    listings: number;
    unit_price: number;
    quantity: number;
  }>;
}

export interface GW2World {
  id: number;
  name: string;
  population: string;
}

export interface GW2Event {
  id: string;
  name: string;
  level: number;
  map_id: number;
  location: {
    center: [number, number];
    radius: number;
  };
  state: 'active' | 'warmup' | 'success' | 'fail' | 'preparation';
}

export interface GW2Build {
  id: number;
  text: string;
}

export interface GW2Recipe {
  id: number;
  type: string;
  output_item_id: number;
  output_item_count: number;
  min_rating: number;
  time_to_craft_ms: number;
  disciplines: string[];
  flags: string[];
  ingredients: Array<{
    item_id: number;
    count: number;
  }>;
  guild_ingredients: Array<{
    item_id: number;
    count: number;
  }>;
  output_upgrade_id?: number;
  chat_link: string;
}

export interface FarmingRoute {
  id: string;
  name: string;
  description: string;
  map: string;
  waypoints: Array<{
    name: string;
    coordinates: [number, number];
    description: string;
  }>;
  estimatedGoldPerHour: number;
  difficulty: 'easy' | 'medium' | 'hard';
  requirements: string[];
  tags: string[];
}

export interface TradingPostItem {
  item: GW2Item;
  price: GW2Price;
  profitMargin?: number;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
} 