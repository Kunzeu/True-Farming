// Configuración completa de sorteos
// Modifica este archivo para cambiar cualquier aspecto de los sorteos

import { fetchGw2ByIds } from '@/lib/gw2-client-api';
export interface Giveaway {
  id: string;
  slug: string;
  title: string;
  description: string;
  startDate: string; // 
  endDate: string; // 
  status: 'upcoming' | 'active' | 'ended' | 'cancelled' | 'winners_announced';
  prizes: Array<{
    position: number;
    prize: string;
    icon: 'gem' | 'package' | 'gold' | 'materials';
    itemId?: number;
    quantity?: number;
    gemPrize?: boolean; // Indica si es un premio de gemas
  }>;
  requirements: string[];
  rules: string[];
  maxParticipants?: number;
}

// Configuración de todos los sorteos
// Template para sorteos mensuales estándar
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

const MONTHLY_GIVEAWAY_TEMPLATE = {
  prizes: [
    { position: 1, prize: '1200', icon: 'gem', quantity: 1200, gemPrize: true },
    { position: 2, prize: '800', icon: 'gem', quantity: 800, gemPrize: true },
    { position: 3, prize: '400', icon: 'gem', quantity: 400, gemPrize: true },
    { position: 4, prize: '400', icon: 'gem', quantity: 400, gemPrize: true },
    { position: 5, prize: '250', icon: 'package', itemId: 19721, quantity: 250 },
    { position: 6, prize: '250', icon: 'package', itemId: 19721, quantity: 250 },
    { position: 7, prize: '250', icon: 'package', itemId: 19721, quantity: 250 },
    { position: 8, prize: '250', icon: 'package', itemId: 19721, quantity: 250 },
    { position: 9, prize: '250', icon: 'package', itemId: 19721, quantity: 250 },
    { position: 10, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }
  ] as Giveaway['prizes'],
  requirements: [
    'Link your GW2 API key to your account',
    'Join our Discord server',
    'Follow us on social media'
  ],
  rules: [
    'One entry per person',
    'Must have valid GW2 account',
    'API key must be active during the entire giveaway period',
    'Winners will be selected randomly',
    'Prizes will be delivered within 48 hours'
  ]
};

/**
 * Genera un sorteo mensual basado en el mes y año
 */
export function generateMonthlyGiveaway(month: number, year: number): Giveaway {
  const monthIndex = month - 1;
  const monthStr = month.toString().padStart(2, '0');
  const id = `monthly-${year}-${monthStr}`;

  // Fecha de inicio: 1 del mes a las 00:00 UTC
  const startDate = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0)).toISOString();

  // Fecha de fin: 1 del siguiente mes a las 00:00 UTC
  const nextMonth = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
  const endDate = nextMonth.toISOString();

  // El estado se manejará dinámicamente, pero por defecto lo ponemos como 'upcoming'
  // A menos que sea pasado, en cuyo caso 'winners_announced' (simulado para histórico)
  const now = new Date();
  let status: Giveaway['status'] = 'upcoming';
  if (now >= nextMonth) {
    status = 'winners_announced';
  } else if (now >= new Date(startDate)) {
    status = 'active';
  }

  return {
    id,
    slug: `${id}-gems`,
    title: "giveaways.monthly.title",
    description: "giveaways.monthly.description",
    startDate,
    endDate,
    status,
    ...MONTHLY_GIVEAWAY_TEMPLATE
  };
}

/**
 * Obtiene una lista de sorteos mensuales en un rango
 */
export function getMonthlyGiveawaysRange(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): Giveaway[] {
  const giveaways: Giveaway[] = [];
  let currMonth = startMonth;
  let currYear = startYear;

  while (currYear < endYear || (currYear === endYear && currMonth <= endMonth)) {
    // Saltar diciembre de 2025 si se prefiere manejar exclusivamente por adviento.
    if (!(currMonth === 12 && currYear === 2025)) {
      giveaways.push(generateMonthlyGiveaway(currMonth, currYear));
    }

    currMonth++;
    if (currMonth > 12) {
      currMonth = 1;
      currYear++;
    }
  }

  return giveaways;
}

// Configuración de todos los sorteos (Generada en cada request — no en module init).
// Empezamos desde Octubre 2025 hasta el mes actual + 1 (para ver el siguiente)
export function getMonthlyGiveawaysNow(now: Date = new Date()): Giveaway[] {
  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();
  let nMonth = currentMonth + 1;
  let nYear = currentYear;
  if (nMonth > 12) {
    nMonth = 1;
    nYear++;
  }
  return getMonthlyGiveawaysRange(10, 2025, nMonth, nYear);
}

/** @deprecated Prefer getMonthlyGiveawaysNow() — kept for call sites that read GIVEAWAYS. */
export const GIVEAWAYS: Giveaway[] = getMonthlyGiveawaysNow();

// Generar sorteos de adviento para diciembre 2025
export function generateAdventGiveaways(year: number = 2025): Giveaway[] {
  const adventGiveaways: Giveaway[] = [];

  for (let day = 1; day <= 32; day++) {
    const dayStr = day.toString().padStart(2, '0');

    // Cada sorteo inicia el día anterior a las 14:00
    // Día 1 inicia el 30 de noviembre, día 2 inicia el 1 de diciembre, etc.
    let startLocal: Date;
    if (day === 1) {
      // Día 1 inicia el 30 de noviembre a las 14:00
      startLocal = new Date(`${year}-11-30T14:00:00-05:00`);
    } else if (day === 32) {
      // Día 32 (admin-only) inicia el 1 de diciembre a las 14:00 para pruebas
      startLocal = new Date(`${year}-12-01T14:00:00-05:00`);
    } else {
      // Días 2-31 inician el día anterior de diciembre a las 14:00
      const prevDay = String(day - 1).padStart(2, '0');
      startLocal = new Date(`${year}-12-${prevDay}T14:00:00-05:00`);
    }

    // Cada sorteo termina el mismo día a las 13:10
    // Día 1 cierra el 1 de diciembre, día 2 cierra el 2 de diciembre, etc.
    let endLocal: Date;
    if (day === 31) {
      // El día 31 termina el 31 de diciembre a las 13:59
      endLocal = new Date(`${year}-12-31T13:59:00-05:00`);
    } else if (day === 32) {
      // Día 32 (admin-only) termina el 2 de diciembre a las 12:00 para pruebas (cerrado)
      endLocal = new Date(`${year}-12-02T12:00:00-05:00`);
    } else {
      // Días 1-30 terminan el mismo día de diciembre a las 13:59
      endLocal = new Date(`${year}-12-${dayStr}T13:59:00-05:00`);
    }

    const startDate = startLocal.toISOString()
    const endDate = endLocal.toISOString()

    // Configurar premios específicos para cada día
    let prizes: Array<{
      position: number;
      prize: string;
      icon: 'gem' | 'package' | 'gold' | 'materials';
      itemId?: number;
      quantity?: number;
      gemPrize?: boolean;
    }> = [];

    // Configuración de premios por día
    const dailyPrizes: Record<number, Array<{ position: number; prize: string; icon: 'gem' | 'package' | 'gold' | 'materials'; itemId?: number; quantity: number; gemPrize?: boolean }>> = {
      1: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '250', icon: 'package', itemId: 24295, quantity: 250 }, // Vial of Powerful Blood
        { position: 3, prize: '1', icon: 'materials', itemId: 95994, quantity: 1 }, // Dragon's Fang
      ],
      2: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 102013, quantity: 1 }, // Chromatic Assassin Spear Skin
        { position: 3, prize: '1', icon: 'package', itemId: 101340, quantity: 1 }, // Thundercrag Sword Skin
      ],
      3: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '100', icon: 'materials', itemId: 24340, quantity: 100 }, // Corrupted Lodestone
        { position: 3, prize: '1', icon: 'materials', itemId: 95920, quantity: 1 }, // Dragon's Weight
      ],
      4: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 88045, quantity: 1 }, // Glyph of Volatility (Unused)
        { position: 3, prize: '1', icon: 'materials', itemId: 68094, quantity: 1 }, // Orichalcum Mining Node
      ],
      5: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 102013, quantity: 1 }, // Chromatic Assassin Spear Skin
        { position: 3, prize: '1', icon: 'package', itemId: 96330, quantity: 1 }, // Dragon's Wing
        { position: 4, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
      ],
      6: [
        { position: 1, prize: '100', icon: 'materials', itemId: 24325, quantity: 100 }, // Destroyer Lodestone
        { position: 2, prize: '250', icon: 'package', itemId: 24283, quantity: 250 }, // Powerful Venom Sac
        { position: 3, prize: '1', icon: 'materials', itemId: 97449, quantity: 1 }, // Dragon's Rending
      ],
      7: [
        { position: 1, prize: '1', icon: 'package', itemId: 30703, quantity: 1 }, // Sunrise
        { position: 2, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
        { position: 3, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
        { position: 4, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
      ],
      8: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 102013, quantity: 1 }, // Chromatic Assassin Spear Skin
        { position: 3, prize: '1', icon: 'package', itemId: 95834, quantity: 1 }, // Dragon's Flight
      ],
      9: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '250', icon: 'materials', itemId: 24340, quantity: 250 }, // Corrupted Lodestone
        { position: 3, prize: '1', icon: 'package', itemId: 79085, quantity: 1 }, // Hard Wood Logging Node
      ],
      10: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 104209, quantity: 1 }, // Imperial Everbloom Greatsword Skin
        { position: 3, prize: '1', icon: 'package', itemId: 95814, quantity: 1 }, // Dragon's Flight
      ],
      11: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 102013, quantity: 1 }, // Chromatic Assassin Spear Skin
        { position: 3, prize: '1', icon: 'package', itemId: 95967, quantity: 1 }, // Dragon's Claw
      ],
      12: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 104228, quantity: 1 }, // Imperial Everbloom Spear
        { position: 3, prize: '1', icon: 'package', itemId: 96357, quantity: 1 }, // Dragon's Bite
        { position: 4, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
      ],
      13: [
        { position: 1, prize: '250', icon: 'materials', itemId: 24325, quantity: 250 }, // Destroyer Lodestone
        { position: 2, prize: '1', icon: 'materials', itemId: 102013, quantity: 1 }, // Chromatic Assassin Spear Skin
        { position: 3, prize: '1', icon: 'package', itemId: 96613, quantity: 1 }, // Jade Bot Core: Tier 10
      ],
      14: [
        { position: 1, prize: '1', icon: 'package', itemId: 30690, quantity: 1 }, // The Juggernaut
        { position: 2, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
        { position: 3, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
        { position: 4, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
      ],
      15: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 104221, quantity: 1 }, // Imperial Everbloom Sword
        { position: 3, prize: '1', icon: 'package', itemId: 96915, quantity: 1 }, // Dragon's Argument
      ],
      16: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '100', icon: 'materials', itemId: 24340, quantity: 100 }, // Corrupted Lodestone
        { position: 3, prize: '1', icon: 'package', itemId: 97691, quantity: 1 }, // Dragon's Scale
      ],
      17: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 104212, quantity: 1 }, // Imperial Everbloom Dagger
        { position: 3, prize: '50', icon: 'package', itemId: 19976, quantity: 50 }, // Mystic Coin
      ],
      18: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 102013, quantity: 1 }, // Chromatic Assassin Spear Skin
        { position: 3, prize: '1', icon: 'materials', itemId: 95994, quantity: 1 }, // Dragon's Fang
      ],
      19: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 104210, quantity: 1 }, // Imperial Everbloom Dagger
        { position: 3, prize: '1', icon: 'materials', itemId: 29170, quantity: 1 }, // The Colossus
        { position: 4, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
      ],
      20: [
        { position: 1, prize: '100', icon: 'materials', itemId: 24325, quantity: 100 }, // Destroyer Lodestone
        { position: 2, prize: '1', icon: 'materials', itemId: 102013, quantity: 1 }, // Chromatic Assassin Spear Skin
        { position: 3, prize: '1', icon: 'package', itemId: 95834, quantity: 1 }, // Dragon's Flight
      ],
      21: [
        { position: 1, prize: '1', icon: 'package', itemId: 96652, quantity: 1 }, // Aurene's Insight
        { position: 2, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
        { position: 3, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
        { position: 4, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
      ],
      22: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '100', icon: 'materials', itemId: 24340, quantity: 100 }, // Corrupted Lodestone
        { position: 3, prize: '1', icon: 'package', itemId: 97535, quantity: 1 }, // Scavenger Protocol: Magic Trophies
      ],
      23: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 102013, quantity: 1 }, // Chromatic Assassin Spear Skin
        { position: 3, prize: '1', icon: 'package', itemId: 96357, quantity: 1 }, // Dragon's Bite
      ],
      24: [
        { position: 1, prize: '100', icon: 'materials', itemId: 24325, quantity: 100 }, // Destroyer Lodestone
        { position: 2, prize: '1', icon: 'materials', itemId: 104207, quantity: 1 }, // Imperial Everbloom Mace Skin
        { position: 3, prize: '1', icon: 'materials', itemId: 29178, quantity: 1 }, // The Lover
        { position: 4, prize: '1200', icon: 'gem', quantity: 1200, gemPrize: true }, // Gems
      ],
      25: [
        { position: 1, prize: '1', icon: 'package', itemId: 81701, quantity: 1 }, // Queen Bee
        { position: 2, prize: '1', icon: 'materials', itemId: 105497, quantity: 1 }, // Aetheric Anchor
        { position: 3, prize: '1', icon: 'package', itemId: 103815, quantity: 1 }, // Klobjarne Geirr
        { position: 4, prize: '2000', icon: 'gem', quantity: 2000, gemPrize: true }, // Gems
      ],
      26: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 102013, quantity: 1 }, // Chromatic Assassin Spear Skin
        { position: 3, prize: '1', icon: 'materials', itemId: 96193, quantity: 1 }, // Dragon's Wisdom
      ],
      27: [
        { position: 1, prize: '100', icon: 'materials', itemId: 24325, quantity: 100 }, // Destroyer Lodestone
        { position: 2, prize: '1', icon: 'materials', itemId: 101365, quantity: 1 }, // Thundercrag Greatsword Skin
        { position: 3, prize: '250', icon: 'materials', itemId: 89098, quantity: 250 }, // Symbol of Control
      ],
      28: [
        { position: 1, prize: '1', icon: 'materials', itemId: 30694, quantity: 1 }, // The Predator
        { position: 2, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems
        { position: 3, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
      ],
      29: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '1', icon: 'materials', itemId: 102013, quantity: 1 }, // Chromatic Assassin Spear Skin
        { position: 3, prize: '1', icon: 'package', itemId: 96827, quantity: 1 }, // Dragon's Tail
      ],
      30: [
        { position: 1, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 2, prize: '100', icon: 'materials', itemId: 24325, quantity: 100 }, // Destroyer Lodestone
        { position: 3, prize: '1', icon: 'package', itemId: 89070, quantity: 1 }, // Polysaturating Reverberating Infusion (Purple)
      ],
      31: [
        { position: 1, prize: '1', icon: 'package', itemId: 81918, quantity: 1 }, // Liquid Aurillium Infusion
        { position: 2, prize: '250', icon: 'gold', quantity: 250, gemPrize: false }, // Gold
        { position: 3, prize: '250', icon: 'gold', quantity: 250, gemPrize: false }, // Gold
        { position: 4, prize: '1200', icon: 'gem', quantity: 1200, gemPrize: true }, // Gems
      ],
      32: [
        // Día 32 - Admin only test day
        { position: 1, prize: '800', icon: 'gem', quantity: 800, gemPrize: true },
        { position: 2, prize: '400', icon: 'gem', quantity: 400, gemPrize: true },
        { position: 3, prize: '250', icon: 'package', itemId: 19721, quantity: 250 }, // Glob of Ectoplasm
        { position: 4, prize: '400', icon: 'gem', quantity: 400, gemPrize: true }, // Gems

      ],
    };

    // Obtener premios del día (o array vacío si no hay configuración)
    prizes = dailyPrizes[day] || [];

    adventGiveaways.push({
      id: `advent-${year}-12-${dayStr}`,
      slug: `advent-${year}-12-${dayStr}`,
      title: `giveaways.advent.title`,
      description: `giveaways.advent.description`,
      startDate: startDate,
      endDate: endDate,
      status: 'upcoming', // Se actualizará automáticamente según la fecha
      prizes: prizes,
      requirements: [
        'Link your GW2 API key to your account',
        'Join our Discord server'
      ],
      rules: [
        'One entry per person',
        'Must have valid GW2 account',
        'API key must be active',
        'Winners will be selected randomly',
        'Prizes will be delivered within 48 hours'
      ],
      maxParticipants: undefined
    });
  }

  return adventGiveaways;
}

// Agregar sorteos de adviento a la lista de sorteos
export function getAllGiveawaysWithAdvent(year: number = 2025): Giveaway[] {
  const adventGiveaways = generateAdventGiveaways(year);
  return [...getMonthlyGiveawaysNow(), ...adventGiveaways];
}

export function getGiveawayById(id: string): Giveaway | undefined {
  if (!id) return undefined;

  // First try to find in regular pre-generated giveaways
  const regularGiveaway = getMonthlyGiveawaysNow().find(g => g.id === id);
  if (regularGiveaway) return regularGiveaway;

  // Check if it's a monthly giveaway (format: monthly-YYYY-MM or monthly-YYYY-M)
  const monthlyMatch = id.match(/^monthly-(\d{4})-(\d{1,2})$/);
  if (monthlyMatch) {
    const year = parseInt(monthlyMatch[1], 10);
    const month = parseInt(monthlyMatch[2], 10);
    if (month >= 1 && month <= 12) {
      return generateMonthlyGiveaway(month, year);
    }
  }

  // Check format: monthName-YYYY (e.g., february-2026)
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const reversedMonthMatch = id.match(/^([a-z]+)-(\d{4})$/i);
  if (reversedMonthMatch) {
    const monthName = reversedMonthMatch[1].toLowerCase();
    const year = parseInt(reversedMonthMatch[2], 10);
    const monthIndex = monthNames.indexOf(monthName);
    if (monthIndex !== -1) {
      return generateMonthlyGiveaway(monthIndex + 1, year);
    }
  }

  // Check if it's just a YYYY-MM format
  const dateMatch = id.match(/^(\d{4})-(\d{1,2})$/);
  if (dateMatch) {
    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    if (month >= 1 && month <= 12) {
      return generateMonthlyGiveaway(month, year);
    }
  }

  // If not found and it's an advent giveaway, generate and search
  if (id.startsWith('advent-')) {
    const adventMatch = id.match(/^advent-(\d{4})-12-(\d{2})$/);
    const year = adventMatch ? parseInt(adventMatch[1], 10) : 2025;
    const adventGiveaways = generateAdventGiveaways(year);
    return adventGiveaways.find(g => g.id === id);
  }

  return undefined;
}

// Función para obtener sorteo por slug
export function getGiveawayBySlug(slug: string): Giveaway | undefined {
  return GIVEAWAYS.find(g => g.slug === slug);
}

// Función para obtener sorteo activo
export function getActiveGiveaway(): Giveaway | undefined {
  const now = new Date();
  return GIVEAWAYS.find(g => {
    const start = new Date(g.startDate);
    const end = new Date(g.endDate);
    return g.status === 'active' && start <= now && end > now;
  });
}

// Función para obtener todos los sorteos
export function getAllGiveaways(): Giveaway[] {
  return getMonthlyGiveawaysNow();
}

// Función para actualizar estado de sorteos basado en fechas
export function updateGiveawayStatuses(): Giveaway[] {
  const now = new Date();
  const allGiveaways = getAllGiveawaysWithAdvent(2025);

  return allGiveaways.map(giveaway => {
    const start = new Date(giveaway.startDate);
    const end = new Date(giveaway.endDate);

    let newStatus = giveaway.status;

    if (giveaway.status === 'upcoming' && start <= now && end > now) {
      newStatus = 'active';
    } else if (giveaway.status === 'active' && end <= now) {
      newStatus = 'ended';
    }

    return {
      ...giveaway,
      status: newStatus
    };
  });
}

// Mapeo de iconos personalizados para items específicos
const customItemIcons: Record<number, string> = {
  95994: 'https://render.guildwars2.com/file/24F07065A51E4BE8F00F9573FF76B221BAAAA6D8/2596936.png', // Dragon's Fang
  19721: 'https://render.guildwars2.com/file/18CE5D78317265000CF3C23ED76AB3CEE86BA60E/65941.png', // Glob of Ectoplasm
  24295: 'https://render.guildwars2.com/file/1A930A6A7B5B01EAB4CB36E79014C12B500BF6B3/66950.png', // Vial of Powerful Blood
  // Advent Calendar Items
  102013: 'https://render.guildwars2.com/file/54241BE201CBEC07B0314AC1033AC30CA0714702/3321387.png', // Chromatic Assassin Spear Skin
  101340: 'https://render.guildwars2.com/file/F3229393303043609B10FFA99E92B35AD8E102A4/3214958.png', // Thundercrag Sword Skin
  24340: 'https://render.guildwars2.com/file/CCC31822DA0D7D930D067B17C958A5CB1F4A24A5/66986.png', // Corrupted Lodestone
  95920: 'https://render.guildwars2.com/file/7A9D0C591BD81B32B1605146AF0D28C2E14B5FE3/2595013.png', // Dragon's Weight
  88045: 'https://render.guildwars2.com/file/1A97067CB6B41D3E777CA805D271DF74F2F57943/1998930.png', // Glyph of Volatility (Unused)
  68094: 'https://render.guildwars2.com/file/C794670D0300082C1BA45921FBAD4EB63217722B/919376.png', // Orichalcum Mining Node
  96330: 'https://render.guildwars2.com/file/105CCB0A37522041CB3FCDC6F53EDF1F0C0A1254/2593875.png', // Dragon's Wing
  24325: 'https://render.guildwars2.com/file/77BE2565DD345ADFEF3850A5B647FE50C144AAF8/66976.png', // Destroyer Lodestone
  24283: 'https://render.guildwars2.com/file/543EC37900EA2A57E77FA891193A48D66AA224AB/66939.png', // Powerful Venom Sac
  97449: 'https://render.guildwars2.com/file/ADD63A12DB491D2A1B3BA33C5305B2D99462260D/2593579.png', // Dragon's Rending
  30703: 'https://render.guildwars2.com/file/EFF16C4F19792627355DC294E6D7093F544921E7/456030.png', // Sunrise
  95834: 'https://render.guildwars2.com/file/265301FE5D6AAA0CEE7DC29C351B7A6C91F2E5DD/2593874.png', // Dragon's Flight
  79085: 'https://render.guildwars2.com/file/4FF414CDA454586B499E04AE0F3908BCBEB5A46B/1465617.png', // Hard Wood Logging Node
  104209: 'https://render.guildwars2.com/file/610DF19E044462999F95050304AB3B1FF717F801/3584471.png', // Imperial Everbloom Greatsword Skin
  95814: 'https://render.guildwars2.com/file/72BC443D4FBE512332255B56214ED6DBD83A3804/2596890.png', // Dragon's Insight
  95967: 'https://render.guildwars2.com/file/4B139E1101030276540A21FEBBC30AE3B9BD80B8/2594360.png', // Dragon's Claw
  104228: 'https://render.guildwars2.com/file/EFEE77D97D00F4F00FD1287D77220CE81FE72C96/3584542.png', // Imperial Everbloom Spear
  96357: 'https://render.guildwars2.com/file/5DAE684E989D9446E304ABF4C06593499BBD37AE/2594852.png', // Dragon's Bite
  96613: 'https://render.guildwars2.com/file/E4F0CDDEAA0C0BCFF158A5A3042AD3C4A3021A22/2595067.png', // Jade Bot Core: Tier 10
};

// Función simple de traducción para usar en la API
function getItemTranslation(itemId: number, lang: string): string {
  const translations: Record<string, Record<number, string>> = {
    'en': {
      19721: 'Glob of Ectoplasm'
    },
    'es': {
      19721: 'Pegote de Ectoplasma'
    },
    'de': {
      19721: 'Ektoplasmakugel'
    },
    'fr': {
      19721: 'Boule d\'Ectoplasme'
    }
  };

  return translations[lang]?.[itemId] || translations['en']?.[itemId] || `Item ${itemId}`;
}

function resolveGiveawayItemName(itemId: number, lang: string, apiName?: string): string {
  if (apiName && !/^Item \d+$/.test(apiName)) {
    return apiName;
  }
  return getItemTranslation(itemId, lang);
}

function getGiveawayItemIcon(itemId: number, apiIcon?: string): string | undefined {
  return customItemIcons[itemId] ?? apiIcon;
}

// Función para obtener información de un item de GW2
export async function getItemInfo(itemId: number, lang: string = 'en'): Promise<{ name: string; icon: string } | null> {
  const gw2Lang = ['en', 'es', 'de', 'fr'].includes(lang) ? lang : 'en';

  try {
    const items = await fetchGw2ByIds<{ id: number; name: string; icon?: string }>(
      'items',
      [itemId],
      `&lang=${gw2Lang}`,
    );
    const item = items[0];
    if (item?.name) {
      const icon = getGiveawayItemIcon(itemId, item.icon);
      if (icon) {
        return {
          name: item.name,
          icon,
        };
      }
    }
  } catch (error) {
    console.error(`Error fetching item ${itemId} in ${lang}:`, error);
  }

  const icon = getGiveawayItemIcon(itemId);
  if (!icon) return null;

  return {
    name: resolveGiveawayItemName(itemId, lang),
    icon,
  };
}

// Función para obtener información de todos los items de un sorteo
export async function getGiveawayItemsInfo(giveaway: Giveaway, lang: string = 'en', t?: (key: string, fallback?: string) => string): Promise<Array<{
  position: number;
  prize: string;
  icon: 'gem' | 'package' | 'gold' | 'materials';
  itemId?: number;
  quantity?: number;
  itemName?: string;
  itemIcon?: string;
  gemPrize?: boolean;
}>> {
  const prizesWithItems = await Promise.all(
    giveaway.prizes.map(async (prize) => {
      // Verificar primero el icono 'gold' antes de gemPrize
      if (prize.icon === 'gold') {
        // Para premios de oro, usar el icono oficial de GW2
        return {
          ...prize,
          itemName: t ? t('currency.gold', 'Oro') : 'Gold',
          itemIcon: '/images/expansions/Gold.webp'
        };
      } else if (prize.gemPrize) {
        // Para premios de gemas, usar el icono oficial de GW2
        return {
          ...prize,
          itemName: t ? t('giveaways.gems', 'Gems') : 'Gems',
          itemIcon: 'https://render.guildwars2.com/file/65941.png'
        };
      } else if (prize.itemId) {
        const itemInfo = await getItemInfo(prize.itemId, lang);
        const itemName = t
          ? t(
              `giveaways.items.${prize.itemId}`,
              resolveGiveawayItemName(prize.itemId, lang, itemInfo?.name),
            )
          : resolveGiveawayItemName(prize.itemId, lang, itemInfo?.name);
        const itemIcon = getGiveawayItemIcon(prize.itemId, itemInfo?.icon);

        return {
          ...prize,
          itemName,
          itemIcon,
        };
      }
      return prize;
    })
  );

  return prizesWithItems;
}
