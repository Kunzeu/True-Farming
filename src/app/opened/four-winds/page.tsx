'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Gift, Package, Star, Coins, BarChart3, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

interface RewardItem {
  id: number;
  item: string;
  quantity?: string;
  count: number;
  chance?: string;
  icon?: string;
}

interface GW2Item {
  id: number;
  name: string;
  icon: string;
  type: string;
  rarity: string;
  level: number;
  vendor_value: number;
  game_types: string[];
  flags: string[];
  restrictions: string[];
  chat_link: string;
  description?: string;
}

interface GW2Price {
  id: number;
  sells?: {
    unit_price: number;
    quantity: number;
  };
  buys?: {
    unit_price: number;
    quantity: number;
  };
}

interface RewardSection {
  name: string;
  count: number;
  percentage: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  itemIcon?: string | null;
  tableData: RewardItem[];
}

// Interfaces para el caché
interface CachedItemsData {
  data: GW2Item[];
  timestamp: number;
  language: string;
}

interface CachedPricesData {
  data: GW2Price[];
  timestamp: number;
}

// Sistema de caché para items (por idioma)
class ItemsCache {
  private static memoryCache: Map<string, CachedItemsData> = new Map();
  private static CACHE_KEY = 'four_winds_items_cache';
  private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  static get(language: string): CachedItemsData | null {
    const cacheKey = `${this.CACHE_KEY}_${language}`;
    const memCached = this.memoryCache.get(cacheKey);
    
    if (memCached && Date.now() - memCached.timestamp < this.CACHE_DURATION) {
      return memCached;
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const data: CachedItemsData = JSON.parse(stored);
          if (Date.now() - data.timestamp < this.CACHE_DURATION && data.language === language) {
            this.memoryCache.set(cacheKey, data);
            return data;
          } else {
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (e) {
        console.warn('Error reading items cache:', e);
      }
    }
    return null;
  }

  static set(language: string, data: GW2Item[]): void {
    const cacheKey = `${this.CACHE_KEY}_${language}`;
    const cachedData: CachedItemsData = {
      data,
      timestamp: Date.now(),
      language
    };
    
    this.memoryCache.set(cacheKey, cachedData);
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      } catch (e) {
        console.warn('Error writing items cache:', e);
      }
    }
  }
}

// Sistema de caché para precios
class PricesCache {
  private static memoryCache: CachedPricesData | null = null;
  private static CACHE_KEY = 'four_winds_prices_cache';
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  static get(): CachedPricesData | null {
    if (this.memoryCache && Date.now() - this.memoryCache.timestamp < this.CACHE_DURATION) {
      return this.memoryCache;
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.CACHE_KEY);
        if (stored) {
          const data: CachedPricesData = JSON.parse(stored);
          if (Date.now() - data.timestamp < this.CACHE_DURATION) {
            this.memoryCache = data;
            return data;
          } else {
            localStorage.removeItem(this.CACHE_KEY);
          }
        }
      } catch (e) {
        console.warn('Error reading prices cache:', e);
      }
    }
    return null;
  }

  static set(data: GW2Price[]): void {
    const cachedData: CachedPricesData = {
      data,
      timestamp: Date.now()
    };
    
    this.memoryCache = cachedData;
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cachedData));
      } catch (e) {
        console.warn('Error writing prices cache:', e);
      }
    }
  }
}

export default function FourWindsPrizeBagPage() {
  const {t, lang } = useI18n();
  usePageTitle('pageTitles.fourWindsPrizeBag', t('fourWindsPrizeBag.title'));
  const [festivalToken, setFestivalToken] = useState<{name: string, icon: string} | null>(null);
  const [fourWindsBag, setFourWindsBag] = useState<{name: string, icon: string} | null>(null);
  const [embroideredPurse, setEmbroideredPurse] = useState<{name: string, icon: string} | null>(null);
  const [embroideredSaddlebag, setEmbroideredSaddlebag] = useState<{name: string, icon: string} | null>(null);
  const [gildedCoffer, setGildedCoffer] = useState<{name: string, icon: string} | null>(null);
  const [elaborateLeatherSack, setElaborateLeatherSack] = useState<{name: string, icon: string} | null>(null);
  const [luxuryEquipmentBox, setLuxuryEquipmentBox] = useState<{name: string, icon: string} | null>(null);
  const [skinsIcon, setSkinsIcon] = useState<string | null>(null);
  const [activeRewardSection, setActiveRewardSection] = useState<string>('monederos');
  const [itemDetails, setItemDetails] = useState<{[key: number]: {name: string, icon: string, price: number}}>({});
  const [sortBy, setSortBy] = useState<string>('count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const pricesLoadedRef = useRef<boolean>(false);
  const currentLangRef = useRef<string>(lang || '');

  // Función para formatear precios siempre con formato completo
  const formatPriceComplete = (price: number) => {
    const gold = Math.floor(price / 10000);
    const silver = Math.floor((price % 10000) / 100);
    const copper = price % 100;
    return `${gold.toString().padStart(2, '0')}g ${silver.toString().padStart(2, '0')}s ${copper.toString().padStart(2, '0')}c`;
  };

  // Función para calcular el total de oro de una sección
  const calculateSectionTotalValue = (section: RewardSection) => {
    const baseTotal = section.tableData.reduce((total: number, row: RewardItem) => {
      const itemPrice = itemDetails[row.id]?.price || 0;
      return total + (itemPrice * row.count);
    }, 0);
    
    // Agregar valor adicional de 129g 65s 06c a la sección de monederos
    if (section.name === 'Monederos' || (embroideredPurse && section.name === embroideredPurse.name)) {
      const additionalValue = 1296506;
      return baseTotal + additionalValue;
    }
    
    // Agregar valor adicional de 64g 59s 02c a la sección de arcas
    if (section.name === 'Arcas Chapadas' || (gildedCoffer && section.name === gildedCoffer.name)) {
      const additionalValue = 645902;
      return baseTotal + additionalValue;
    }
    
    // Agregar valor adicional de 63g 77s 14c a la sección de morrales
    if (section.name === 'Morrales de cuero' || (elaborateLeatherSack && section.name === elaborateLeatherSack.name)) {
      const additionalValue = 637714;
      return baseTotal + additionalValue;
    }
    
    // Agregar valor adicional de 64g 16s 51c a la sección de alforjas
    if (section.name === 'Alforjas bordadas' || (embroideredSaddlebag && section.name === embroideredSaddlebag.name)) {
      const additionalValue = 641651;
      return baseTotal + additionalValue;
    }
    
    // Agregar valor adicional de 61g 72s 15c a la sección de equipo
    if (section.name === 'Caja de equipo de lujo' || (luxuryEquipmentBox && section.name === luxuryEquipmentBox.name)) {
      const additionalValue = 617215;
      return baseTotal + additionalValue;
    }
    
    
    return baseTotal;
  };


  // Función para ordenar los datos de la tabla
  const sortTableData = (data: RewardItem[]) => {
    return [...data].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = itemDetails[a.id]?.name || `Item ${a.id}`;
          bValue = itemDetails[b.id]?.name || `Item ${b.id}`;
          break;
        case 'count':
          aValue = a.count;
          bValue = b.count;
          break;
        case 'price':
          aValue = itemDetails[a.id]?.price || 0;
          bValue = itemDetails[b.id]?.price || 0;
          break;
        case 'totalValue':
          aValue = (itemDetails[a.id]?.price || 0) * a.count;
          bValue = (itemDetails[b.id]?.price || 0) * b.count;
          break;
        case 'percentage':
          aValue = (a.count / rewardSections[activeRewardSection as keyof typeof rewardSections].count) * 100;
          bValue = (b.count / rewardSections[activeRewardSection as keyof typeof rewardSections].count) * 100;
          break;
        case 'droprate':
          aValue = a.count / rewardSections[activeRewardSection as keyof typeof rewardSections].count;
          bValue = b.count / rewardSections[activeRewardSection as keyof typeof rewardSections].count;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      const aNum = typeof aValue === 'number' ? aValue : 0;
      const bNum = typeof bValue === 'number' ? bValue : 0;
      
      return sortDirection === 'asc' 
        ? aNum - bNum
        : bNum - aNum;
    });
  };

  // Función para manejar el clic en los headers
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };
  
  // Datos reales de las primeras 40k aperturas (suma de dos conjuntos de datos)
  const rewardSections: {[key: string]: RewardSection} = {
    monederos: {
      name: embroideredPurse ? `${embroideredPurse.name}` : t('fourWindsPrizeBag.purses'),
      count: 25150,
      percentage: 33.45,
      icon: Package,
      itemIcon: embroideredPurse?.icon,
      tableData: [
        { id: 46731, item: '', count: 92564, chance: '100%' },
        { id: 84731, item: '', count: 17516, chance: '100%' },
        { id: 83008, item: '', count: 618, chance: '100%' },
        { id: 24288, item: '', count: 2716, chance: '100%' },
        { id: 24356, item: '', count: 2551, chance: '100%' },
        { id: 44960, item: '', count: 25, chance: '100%' },
        { id: 24299, item: '', count: 2733, chance: '100%' },
        { id: 44976, item: '', count: 13, chance: '100%' },
        { id: 19748, item: '', count: 4771, chance: '100%' },
        { id: 24341, item: '', count: 2790, chance: '100%' },
        { id: 19700, item: '', count: 6358, chance: '100%' },
        { id: 24282, item: '', count: 2813, chance: '100%' },
        { id: 19701, item: '', count: 2332, chance: '100%' },
        { id: 19732, item: '', count: 775, chance: '100%' },
        { id: 19729, item: '', count: 2429, chance: '100%' },
        { id: 24329, item: '', count: 198, chance: '100%' },
        { id: 24320, item: '', count: 20, chance: '100%' },
        { id: 24357, item: '', count: 238, chance: '100%' },
        { id: 24300, item: '', count: 246, chance: '100%' },
        { id: 19745, item: '', count: 871, chance: '100%' },
        { id: 24309, item: '', count: 197, chance: '100%' },
        { id: 24350, item: '', count: 2799, chance: '100%' },
        { id: 24324, item: '', count: 232, chance: '100%' },
        { id: 24358, item: '', count: 235, chance: '100%' },
        { id: 24319, item: '', count: 193, chance: '100%' },
        { id: 24294, item: '', count: 2575, chance: '100%' },
        { id: 24295, item: '', count: 243, chance: '100%' },
        { id: 44966, item: '', count: 18, chance: '100%' },
        { id: 24283, item: '', count: 273, chance: '100%' },
        { id: 24314, item: '', count: 186, chance: '100%' },
        { id: 78886, item: '', count: 287, chance: '100%' },
        { id: 24334, item: '', count: 217, chance: '100%' },
        { id: 24277, item: '', count: 249, chance: '100%' },
        { id: 24351, item: '', count: 206, chance: '100%' },
        { id: 24276, item: '', count: 1955, chance: '100%' },
        { id: 24339, item: '', count: 205, chance: '100%' },
        { id: 24310, item: '', count: 28, chance: '100%' },
        { id: 24304, item: '', count: 188, chance: '100%' },
        { id: 24289, item: '', count: 269, chance: '100%' },
        { id: 38030, item: '', count: 116, chance: '100%' },
        { id: 24330, item: '', count: 16, chance: '100%' },
        { id: 24305, item: '', count: 34, chance: '100%' },
        { id: 24315, item: '', count: 26, chance: '100%' },
        { id: 24340, item: '', count: 17, chance: '100%' },
        { id: 24325, item: '', count: 26, chance: '100%' },
        { id: 24335, item: '', count: 23, chance: '100%' },
        { id: 44967, item: '', count: 17, chance: '100%' },
        { id: 44980, item: '', count: 15, chance: '100%' },
        { id: 99999, item: t('fourWindsPrizeBag.randomExotic'), count: 39, chance: '100%' },


      ]
    },
    alforjas: {
      name: embroideredSaddlebag ? embroideredSaddlebag.name : 'Alforjas bordadas',
      count: 6695,
      percentage: 16.73,
      icon: Package,
      itemIcon: embroideredSaddlebag?.icon,
      tableData: [
        { id: 46731, item: '', count: 16857, chance: '100%' },
        { id: 84731, item: '', count: 3226, chance: '100%' },
        { id: 83008, item: '', count: 115, chance: '100%' },
        { id: 24357, item: '', count: 57, chance: '100%' },
        { id: 24341, item: '', count: 492, chance: '100%' },
        { id: 24295, item: '', count: 43, chance: '100%'},
        { id: 24351, item: '', count: 36, chance: '100%'},
        { id: 24339, item: '', count: 30, chance: '100%'},
        { id: 24315, item: '', count: 6, chance: '100%' },
        { id: 24277, item: '', count: 40, chance: '100%'},
        { id: 24288, item: '', count: 483, chance: '100%' },
        { id: 24340, item: '', count: 5, chance: '100%' },
        { id: 24310, item: '', count: 4, chance: '100%' },
        { id: 24283, item: '', count: 58, chance: '100%' },
        { id: 24299, item: '', count: 519, chance: '100%' },
        { id: 24282, item: '', count: 465, chance: '100%' },
        { id: 24324, item: '', count: 40, chance: '100%' },
        { id: 38030, item: '', count: 25, chance: '100%' },
        { id: 24304, item: '', count: 33, chance: '100%' },
        { id: 24351, item: '', count: 45, chance: '100%' },
        { id: 19748, item: '', count: 941, chance: '100%' },
        { id: 24309, item: '', count: 36, chance: '100%' },
        { id: 19729, item: '', count: 454, chance: '100%' },
        { id: 24305, item: '', count: 4, chance: '100%' }, //Piedra imán cargada
        { id: 44971, item: '', count: 2, chance: '100%' },
        { id: 44980, item: '', count: 2, chance: '100%' },
        { id: 44978, item: '', count: 1, chance: '100%' },
        { id: 99999, item: t('fourWindsPrizeBag.randomExotic'), count: 8, chance: '100%' },
        { id: 19700, item: '', count: 1271, chance: '100%' },
        { id: 24358, item: '', count: 65, chance: '100%' },
        { id: 24350, item: '', count: 446, chance: '100%' },
        { id: 19701, item: '', count: 436, chance: '100%' },
        { id: 24335, item: '', count: 3, chance: '100%' },
        { id: 24356, item: '', count: 438, chance: '100%' },
        { id: 24294, item: '', count: 488, chance: '100%' },
        { id: 24325, item: '', count: 2, chance: '100%' },
        { id: 19732, item: '', count: 141, chance: '100%' },
        { id: 24276, item: '', count: 360, chance: '100%' },
        { id: 24329, item: '', count: 46, chance: '100%' },
        { id: 24334, item: '', count: 30, chance: '100%' },
        { id: 19745, item: '', count: 162, chance: '100%' },
        { id: 24319, item: '', count: 46, chance: '100%' },
        { id: 19748, item: '', count: 691, chance: '100%' },
        { id: 24289, item: '', count: 53, chance: '100%' },
        { id: 24320, item: '', count: 4, chance: '100%' },
        { id: 24300, item: '', count: 27, chance: '100%' },
       
      ]
    },
    arcas: {
      name: gildedCoffer ? gildedCoffer.name : 'Arcas Chapadas',
      count: 6573,
      percentage: 16.43,
      icon: Package,
      itemIcon: gildedCoffer?.icon,
      tableData: [
        { id: 46731, item: '', count: 16565, chance: '100%' },
        { id: 84731, item: '', count: 3214, chance: '100%' },
        { id: 83008, item: '', count: 85, chance: '100%' },
        { id: 24310, item: '', count: 3, chance: '100%' },
        { id: 24325, item: '', count: 5, chance: '100%' },
        { id: 24350, item: '', count: 509, chance: '100%' },
        { id: 24304, item: '', count: 33, chance: '100%' },
        { id: 44966, item: '', count: 2, chance: '100%' },
        { id: 24315, item: '', count: 3, chance: '100%' },
        { id: 24324, item: '', count: 50, chance: '100%' },
        { id: 24320, item: '', count: 3, chance: '100%' },
        { id: 24289, item: '', count: 35, chance: '100%' },
        { id: 24356, item: '', count: 400, chance: '100%' },
        { id: 38030, item: '', count: 20, chance: '100%' },
        { id: 24282, item: '', count: 519, chance: '100%' },
        { id: 19745, item: '', count: 142, chance: '100%' },
        { id: 24305, item: '', count: 5, chance: '100%' },
        { id: 99999, item: t('fourWindsPrizeBag.randomExotic'), count: 8, chance: '100%' },
        { id: 24319, item: '', count: 37, chance: '100%' },
        { id: 24341, item: '', count: 484, chance: '100%' },
        { id: 24288, item: '', count: 439, chance: '100%' },
        { id: 24294, item: '', count: 495, chance: '100%' },
        { id: 24299, item: '', count: 485, chance: '100%' },
        { id: 24329, item: '', count: 50, chance: '100%' },
        { id: 24335, item: '', count: 6, chance: '100%' },
        { id: 19701, item: '', count: 448, chance: '100%' },
        { id: 24334, item: '', count: 31, chance: '100%' },
        { id: 24276, item: '', count: 349, chance: '100%' },
        { id: 24309, item: '', count: 40, chance: '100%'},
        { id: 24314, item: '', count: 35, chance: '100%'},
        { id: 24358, item: '', count: 42, chance: '100%'},
        { id: 24330, item: '', count: 2, chance: '100%'},
        { id: 24277, item: '', count: 62, chance: '100%'},
        { id: 24283, item: '', count: 52, chance: '100%'},
        { id: 19732, item: '', count: 142, chance: '100%'},
        { id: 24351, item: '', count: 35, chance: '100%'},
        { id: 24339, item: '', count: 36, chance: '100%'},
        { id: 24357, item: '', count: 45, chance: '100%'},
        { id: 24295, item: '', count: 42, chance: '100%'},
        { id: 24340, item: '', count: 4, chance: '100%'},
        { id: 19729, item: '', count: 429, chance: '100%'},
        { id: 19700, item: '', count: 1292, chance: '100%'},
        { id: 19748, item: '', count: 848, chance: '100%'},
        { id: 44991, item: '', count: 1, chance: '100%' },
        { id: 44985, item: '', count: 2, chance: '100%' },
        { id: 44992, item: '', count: 1, chance: '100%' },
        { id: 44972, item: '', count: 3, chance: '100%' },
        { id: 44975, item: '', count: 1, chance: '100%' },
        { id: 44979, item: '', count: 2, chance: '100%' },

      ]
    },
    morrales: {
      name: elaborateLeatherSack ? elaborateLeatherSack.name : 'Morrales de cuero',
      count: 12650,
      percentage: 16.82,
      icon: Package,
      itemIcon: elaborateLeatherSack?.icon,
      tableData: [
        { id: 46731, item: '', count: 43783, chance: '100%' },
        { id: 84731, item: '', count: 8922, chance: '100%' },
        { id: 83008, item: '', count: 316, chance: '100%' },
        { id: 24299, item: '', count: 1411, chance: '100%' },
        { id: 19729, item: '', count: 1218, chance: '100%' },
        { id: 24294, item: '', count: 1388, chance: '100%' },
        { id: 24350, item: '', count: 1381, chance: '100%' },
        { id: 24277, item: '', count: 136, chance: '100%' },
        { id: 99999, item: t('fourWindsPrizeBag.randomExotic'), count: 72, chance: '100%' },
        { id: 44965, item: '', count: 12, chance: '100%' },
        { id: 24319, item: '', count: 123, chance: '100%' },
        { id: 19748, item: '', count: 2516, chance: '100%' },
        { id: 24320, item: '', count: 18, chance: '100%' },
        { id: 24315, item: '', count: 9, chance: '100%' },
        { id: 24324, item: '', count: 112, chance: '100%' },
        { id: 19700, item: '', count: 3361, chance: '100%' }, 
        { id: 24288, item: '', count: 1360, chance: '100%' },
        { id: 24334, item: '', count: 109, chance: '100%' },
        { id: 24329, item: '', count: 93, chance: '100%' },
        { id: 24282, item: '', count: 1469, chance: '100%' },
        { id: 24283, item: '', count: 116, chance: '100%' },
        { id: 24341, item: '', count: 1400, chance: '100%' },
        { id: 24358, item: '', count: 141, chance: '100%' },
        { id: 19701, item: '', count: 1281, chance: '100%' },
        { id: 24325, item: '', count: 10, chance: '100%' },
        { id: 24330, item: '', count: 14, chance: '100%' },
        { id: 24289, item: '', count: 107, chance: '100%' },
        { id: 24356, item: '', count: 1252, chance: '100%' },
        { id: 24335, item: '', count: 9, chance: '100%' },
        { id: 24305, item: '', count: 12, chance: '100%' },
        { id: 19745, item: '', count: 427, chance: '100%' },
        { id: 24314, item: '', count: 95, chance: '100%' },
        { id: 24339, item: '', count: 109, chance: '100%' },
        { id: 38030, item: '', count: 54, chance: '100%' },
        { id: 24309, item: '', count: 109, chance: '100%' },
        { id: 19732, item: '', count: 386, chance: '100%' },
        { id: 24351, item: '', count: 107, chance: '100%' },
        { id: 24295, item: '', count: 154, chance: '100%' },
        { id: 24304, item: '', count: 92, chance: '100%' },
        { id: 24310, item: '', count: 11, chance: '100%' },
        { id: 24276, item: '', count: 965, chance: '100%' },
        { id: 24357, item: '', count: 139, chance: '100%' },
        { id: 24340, item: '', count: 9, chance: '100%' },
        { id: 24300, item: '', count: 110, chance: '100%' },
      ]
    },
    equipo: {
      name: luxuryEquipmentBox ? luxuryEquipmentBox.name : t('fourWindsPrizeBag.luxuryEquipment'),
      count: 12328,
      percentage: 16.40,
      icon: Star,
      itemIcon: luxuryEquipmentBox?.icon,
      tableData: [
        { id: 46731, item: '', count: 45275, chance: '100%' },
        { id: 24324, item: '', count: 119, chance: '100%' },
        { id: 84731, item: '', count: 8675, chance: '100%' },
        { id: 83008, item: '', count: 296, chance: '100%' },
        { id: 24357, item: '', count: 109, chance: '100%' },
        { id: 24350, item: '', count: 1394, chance: '100%' },
        { id: 19701, item: '', count: 1268, chance: '100%' },
        { id: 19700, item: '', count: 3514, chance: '100%' },
        { id: 44970, item: '', count: 9, chance: '100%' },
        { id: 24339, item: '', count: 96, chance: '100%' },
        { id: 44980, item: '', count: 10, chance: '100%' },
        { id: 24300, item: '', count: 125, chance: '100%' },
        { id: 24295, item: '', count: 130, chance: '100%' },
        { id: 24341, item: '', count: 1230, chance: '100%' },
        { id: 24320, item: '', count: 7, chance: '100%' },
        { id: 19748, item: '', count: 2428, chance: '100%' },
        { id: 24319, item: '', count: 86, chance: '100%' },
        { id: 19732, item: '', count: 381, chance: '100%' },
        { id: 38030, item: '', count: 54, chance: '100%' },
        { id: 44988, item: '', count: 9, chance: '100%' },
        { id: 24314, item: '', count: 102, chance: '100%' },
        { id: 24299, item: '', count: 1298, chance: '100%' },
        { id: 24289, item: '', count: 101, chance: '100%' },
        { id: 24288, item: '', count: 1225, chance: '100%' },
        { id: 24282, item: '', count: 1373, chance: '100%' },
        { id: 19745, item: '', count: 432, chance: '100%' },
        { id: 24358, item: '', count: 118, chance: '100%' },
        { id: 24356, item: '', count: 1234, chance: '100%' },
        { id: 19729, item: '', count: 1243, chance: '100%' },
        { id: 24277, item: '', count: 126, chance: '100%' },
        { id: 24305, item: '', count: 10, chance: '100%' },
        { id: 24309, item: '', count: 92, chance: '100%' },
        { id: 24294, item: '', count: 1337, chance: '100%' },
        { id: 24310, item: '', count: 11, chance: '100%' },
        { id: 24276, item: '', count: 998, chance: '100%' },
        { id: 24340, item: '', count: 12, chance: '100%' },
        { id: 24304, item: '', count: 103, chance: '100%' },
        { id: 24351, item: '', count: 126, chance: '100%' },
        { id: 24329, item: '', count: 102, chance: '100%' },
        { id: 24315, item: '', count: 8, chance: '100%' },
        { id: 24283, item: '', count: 107, chance: '100%' },
        { id: 24325, item: '', count: 11, chance: '100%' },
        { id: 24330, item: '', count: 8, chance: '100%' },
        { id: 44973, item: '', count: 7, chance: '100%' },
        { id: 99999, item: t('fourWindsPrizeBag.randomExotic'), count: 15, chance: '100%' },
        { id: 24334, item: '', count: 108, chance: '100%' },
        { id: 24335, item: '', count: 6, chance: '100%' },
        
       
      ]
    },
    skins: {
      name: 'Skins',
      count: 184,
      percentage: 0.95,
      icon: Star,
      itemIcon: skinsIcon,
      tableData: [
        { id: 98755, item: '', count: 12, chance: '100%' },
        { id: 98775, item: '', count: 10, chance: '100%' },
        { id: 98569, item: '', count: 13, chance: '100%' },
        { id: 98445, item: '', count: 23, chance: '100%' },
        { id: 98632, item: '', count: 9, chance: '100%' },
        { id: 98843, item: '', count: 7, chance: '100%' },
        { id: 98452, item: '', count: 11, chance: '100%' },
        { id: 98427, item: '', count: 7, chance: '100%' },
        { id: 98521, item: '', count: 11, chance: '100%' },
        { id: 98506, item: '', count: 14, chance: '100%' },
        { id: 98826, item: '', count: 18, chance: '100%' },
        { id: 98809, item: '', count: 11, chance: '100%' },
        { id: 98492, item: '', count: 13, chance: '100%' }, 
        { id: 98578, item: '', count: 8, chance: '100%' }, 
        { id: 98784, item: '', count: 17, chance: '100%' }, 
      
      ]
    }
  };

  const totalOpened = 75176; // Total de bolsas abiertas
  
  // Calcular el total de items sumando los count de cada sección (cuántos contenedores de cada tipo salieron)
  const totalItems = Object.values(rewardSections).reduce((total, section) => {
    return total + section.count;
  }, 0);
  
  const eventCoins = 2068644 // Chapas del evento

  // Función para obtener los items según el idioma
  const fetchItems = async (language: string) => {
    try {
      // Verificar caché primero
      const cached = ItemsCache.get(language);
      if (cached && cached.language === language) {
        const data = cached.data;
        processItemsData(data);
        return;
      }

      // Obtener todos los items en una sola consulta
      const response = await fetch(`https://api.guildwars2.com/v2/items?ids=66224,98586,64531,44252,89815,79082,44471,98632,46731,84731,83008,24288,24356,44960,24299,44976,19748,24341,19700,24282,19701,19732,19729,24329,24320,24357,24300,19745,24309,24350,24324,24358,24319,24294,24295,44966,24283,24314,78886,24334,24277,24351,24276,24339,24310,24304,24289,38030,24330,24305,24315,24340,24325,24335,44967,45150,44980,44991,44985,44992,44972,44975,44979,44971,44978,44965,44970,44988,44973,98755,98775,98569,98445,98843,98452,98427,98521,98506,98826,98809,98492,98578,98784,26150,2397,28592,1366,26854,26872,27179,2703,2692&lang=${language}`, {
        // Headers optimizados para Desktop
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      const data: GW2Item[] = await response.json();
      
      // Guardar en caché
      ItemsCache.set(language, data);
      
      processItemsData(data);
    } catch {
      // Error fetching items
    }
  };

  // Función auxiliar para procesar los datos de items
  const processItemsData = (data: GW2Item[]) => {
      
      if (data && data.length >= 8) {
        // Festival Token (ID: 66224)
        const festivalTokenData = data.find((item: GW2Item) => item.id === 66224);
        if (festivalTokenData) {
          setFestivalToken({
            name: festivalTokenData.name,
            icon: festivalTokenData.icon
          });
        }
        
        // Four Winds Prize Bag (ID: 98586)
        const fourWindsData = data.find((item: GW2Item) => item.id === 98586);
        if (fourWindsData) {
          setFourWindsBag({
            name: fourWindsData.name,
            icon: fourWindsData.icon
          });
        }
        
        // Monedero bordado (ID: 64531)
        const embroideredPurseData = data.find((item: GW2Item) => item.id === 64531);
        if (embroideredPurseData) {
          setEmbroideredPurse({
            name: embroideredPurseData.name,
            icon: embroideredPurseData.icon
          });
        }
        
        // Alforja bordada (ID: 44252)
        const embroideredSaddlebagData = data.find((item: GW2Item) => item.id === 44252);
        if (embroideredSaddlebagData) {
          setEmbroideredSaddlebag({
            name: embroideredSaddlebagData.name,
            icon: embroideredSaddlebagData.icon
          });
        }
        
        // Arca chapada (ID: 89815)
        const gildedCofferData = data.find((item: GW2Item) => item.id === 89815);
        if (gildedCofferData) {
          setGildedCoffer({
            name: gildedCofferData.name,
            icon: gildedCofferData.icon
          });
        }
        
        // Morral de cuero elaborado (ID: 79082)
        const elaborateLeatherSackData = data.find((item: GW2Item) => item.id === 79082);
        if (elaborateLeatherSackData) {
          setElaborateLeatherSack({
            name: elaborateLeatherSackData.name,
            icon: elaborateLeatherSackData.icon
          });
        }
        
        // Caja de equipo de lujo (ID: 44471)
        const luxuryEquipmentBoxData = data.find((item: GW2Item) => item.id === 44471);
        if (luxuryEquipmentBoxData) {
          setLuxuryEquipmentBox({
            name: luxuryEquipmentBoxData.name,
            icon: luxuryEquipmentBoxData.icon
          });
        }
        
        // Mandoble mecánico (ID: 98632) - Solo para icono de Skins
        const skinsData = data.find((item: GW2Item) => item.id === 98632);
        if (skinsData) {
          setSkinsIcon(skinsData.icon);
        }
        
        // Silver coin (ID: 46731) - Para el primer item de Monederos
        const silverCoinData = data.find((item: GW2Item) => item.id === 46731);
        if (silverCoinData) {
          setItemDetails(prev => ({
            ...prev,
            46731: {
              name: silverCoinData.name,
              icon: silverCoinData.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 84731 - Para el segundo item de Monederos
        const item84731Data = data.find((item: GW2Item) => item.id === 84731);
        if (item84731Data) {
          setItemDetails(prev => ({
            ...prev,
            84731: {
              name: item84731Data.name,
              icon: item84731Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 83008 - Para el tercer item de Monederos
        const item83008Data = data.find((item: GW2Item) => item.id === 83008);
        if (item83008Data) {
          setItemDetails(prev => ({
            ...prev,
            83008: {
              name: item83008Data.name,
              icon: item83008Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24288 - Para el cuarto item de Monederos
        const item24288Data = data.find((item: GW2Item) => item.id === 24288);
        if (item24288Data) {
          setItemDetails(prev => ({
            ...prev,
            24288: {
              name: item24288Data.name,
              icon: item24288Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24356 - Para el quinto item de Monederos
        const item24356Data = data.find((item: GW2Item) => item.id === 24356);
        if (item24356Data) {
          setItemDetails(prev => ({
            ...prev,
            24356: {
              name: item24356Data.name,
              icon: item24356Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 44960 - Para el sexto item de Monederos
        const item44960Data = data.find((item: GW2Item) => item.id === 44960);
        if (item44960Data) {
          setItemDetails(prev => ({
            ...prev,
            44960: {
              name: item44960Data.name,
              icon: item44960Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24299 - Para el séptimo item de Monederos
        const item24299Data = data.find((item: GW2Item) => item.id === 24299);
        if (item24299Data) {
          setItemDetails(prev => ({
            ...prev,
            24299: {
              name: item24299Data.name,
              icon: item24299Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 44976 - Para el octavo item de Monederos
        const item44976Data = data.find((item: GW2Item) => item.id === 44976);
        if (item44976Data) {
          setItemDetails(prev => ({
            ...prev,
            44976: {
              name: item44976Data.name,
              icon: item44976Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 19748 - Para el noveno item de Monederos
        const item19748Data = data.find((item: GW2Item) => item.id === 19748);
        if (item19748Data) {
          setItemDetails(prev => ({
            ...prev,
            19748: {
              name: item19748Data.name,
              icon: item19748Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24341 - Para el décimo item de Monederos
        const item24341Data = data.find((item: GW2Item) => item.id === 24341);
        if (item24341Data) {
          setItemDetails(prev => ({
            ...prev,
            24341: {
              name: item24341Data.name,
              icon: item24341Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 19700 - Para el undécimo item de Monederos
        const item19700Data = data.find((item: GW2Item) => item.id === 19700);
        if (item19700Data) {
          setItemDetails(prev => ({
            ...prev,
            19700: {
              name: item19700Data.name,
              icon: item19700Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24282 - Para el duodécimo item de Monederos
        const item24282Data = data.find((item: GW2Item) => item.id === 24282);
        if (item24282Data) {
          setItemDetails(prev => ({
            ...prev,
            24282: {
              name: item24282Data.name,
              icon: item24282Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 19701 - Para el decimotercer item de Monederos
        const item19701Data = data.find((item: GW2Item) => item.id === 19701);
        if (item19701Data) {
          setItemDetails(prev => ({
            ...prev,
            19701: {
              name: item19701Data.name,
              icon: item19701Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 19732 - Para el decimocuarto item de Monederos
        const item19732Data = data.find((item: GW2Item) => item.id === 19732);
        if (item19732Data) {
          setItemDetails(prev => ({
            ...prev,
            19732: {
              name: item19732Data.name,
              icon: item19732Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 19729 - Para el decimoquinto item de Monederos
        const item19729Data = data.find((item: GW2Item) => item.id === 19729);
        if (item19729Data) {
          setItemDetails(prev => ({
            ...prev,
            19729: {
              name: item19729Data.name,
              icon: item19729Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24329 - Para el decimosexto item de Monederos
        const item24329Data = data.find((item: GW2Item) => item.id === 24329);
        if (item24329Data) {
          setItemDetails(prev => ({
            ...prev,
            24329: {
              name: item24329Data.name,
              icon: item24329Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24320 - Para el decimoséptimo item de Monederos
        const item24320Data = data.find((item: GW2Item) => item.id === 24320);
        if (item24320Data) {
          setItemDetails(prev => ({
            ...prev,
            24320: {
              name: item24320Data.name,
              icon: item24320Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24357 - Para el decimoctavo item de Monederos
        const item24357Data = data.find((item: GW2Item) => item.id === 24357);
        if (item24357Data) {
          setItemDetails(prev => ({
            ...prev,
            24357: {
              name: item24357Data.name,
              icon: item24357Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24300 - Para el decimonoveno item de Monederos
        const item24300Data = data.find((item: GW2Item) => item.id === 24300);
        if (item24300Data) {
          setItemDetails(prev => ({
            ...prev,
            24300: {
              name: item24300Data.name,
              icon: item24300Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 19745 - Para el vigésimo item de Monederos
        const item19745Data = data.find((item: GW2Item) => item.id === 19745);
        if (item19745Data) {
          setItemDetails(prev => ({
            ...prev,
            19745: {
              name: item19745Data.name,
              icon: item19745Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24309 - Para el vigésimo primer item de Monederos
        const item24309Data = data.find((item: GW2Item) => item.id === 24309);
        if (item24309Data) {
          setItemDetails(prev => ({
            ...prev,
            24309: {
              name: item24309Data.name,
              icon: item24309Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24350 - Para el vigésimo segundo item de Monederos
        const item24350Data = data.find((item: GW2Item) => item.id === 24350);
        if (item24350Data) {
          setItemDetails(prev => ({
            ...prev,
            24350: {
              name: item24350Data.name,
              icon: item24350Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24324 - Para el vigésimo tercer item de Monederos
        const item24324Data = data.find((item: GW2Item) => item.id === 24324);
        if (item24324Data) {
          setItemDetails(prev => ({
            ...prev,
            24324: {
              name: item24324Data.name,
              icon: item24324Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24358 - Para el vigésimo cuarto item de Monederos
        const item24358Data = data.find((item: GW2Item) => item.id === 24358);
        if (item24358Data) {
          setItemDetails(prev => ({
            ...prev,
            24358: {
              name: item24358Data.name,
              icon: item24358Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24319 - Para el vigésimo quinto item de Monederos
        const item24319Data = data.find((item: GW2Item) => item.id === 24319);
        if (item24319Data) {
          setItemDetails(prev => ({
            ...prev,
            24319: {
              name: item24319Data.name,
              icon: item24319Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24294 - Para el vigésimo sexto item de Monederos
        const item24294Data = data.find((item: GW2Item) => item.id === 24294);
        if (item24294Data) {
          setItemDetails(prev => ({
            ...prev,
            24294: {
              name: item24294Data.name,
              icon: item24294Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24295 - Para el vigésimo séptimo item de Monederos
        const item24295Data = data.find((item: GW2Item) => item.id === 24295);
        if (item24295Data) {
          setItemDetails(prev => ({
            ...prev,
            24295: {
              name: item24295Data.name,
              icon: item24295Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 44966 - Para el vigésimo octavo item de Monederos
        const item44966Data = data.find((item: GW2Item) => item.id === 44966);
        if (item44966Data) {
          setItemDetails(prev => ({
            ...prev,
            44966: {
              name: item44966Data.name,
              icon: item44966Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24283 - Para el vigésimo noveno item de Monederos
        const item24283Data = data.find((item: GW2Item) => item.id === 24283);
        if (item24283Data) {
          setItemDetails(prev => ({
            ...prev,
            24283: {
              name: item24283Data.name,
              icon: item24283Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24314 - Para el trigésimo item de Monederos
        const item24314Data = data.find((item: GW2Item) => item.id === 24314);
        if (item24314Data) {
          setItemDetails(prev => ({
            ...prev,
            24314: {
              name: item24314Data.name,
              icon: item24314Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 78886 - Para el trigésimo primer item de Monederos
        const item78886Data = data.find((item: GW2Item) => item.id === 78886);
        if (item78886Data) {
          setItemDetails(prev => ({
            ...prev,
            78886: {
              name: item78886Data.name,
              icon: item78886Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24334 - Para el trigésimo segundo item de Monederos
        const item24334Data = data.find((item: GW2Item) => item.id === 24334);
        if (item24334Data) {
          setItemDetails(prev => ({
            ...prev,
            24334: {
              name: item24334Data.name,
              icon: item24334Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24277 - Para el trigésimo tercer item de Monederos
        const item24277Data = data.find((item: GW2Item) => item.id === 24277);
        if (item24277Data) {
          setItemDetails(prev => ({
            ...prev,
            24277: {
              name: item24277Data.name,
              icon: item24277Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24351 - Para el trigésimo cuarto item de Monederos
        const item24351Data = data.find((item: GW2Item) => item.id === 24351);
        if (item24351Data) {
          setItemDetails(prev => ({
            ...prev,
            24351: {
              name: item24351Data.name,
              icon: item24351Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24276 - Para el trigésimo quinto item de Monederos
        const item24276Data = data.find((item: GW2Item) => item.id === 24276);
        if (item24276Data) {
          setItemDetails(prev => ({
            ...prev,
            24276: {
              name: item24276Data.name,
              icon: item24276Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24339 - Para el trigésimo sexto item de Monederos
        const item24339Data = data.find((item: GW2Item) => item.id === 24339);
        if (item24339Data) {
          setItemDetails(prev => ({
            ...prev,
            24339: {
              name: item24339Data.name,
              icon: item24339Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24310 - Para el trigésimo séptimo item de Monederos
        const item24310Data = data.find((item: GW2Item) => item.id === 24310);
        if (item24310Data) {
          setItemDetails(prev => ({
            ...prev,
            24310: {
              name: item24310Data.name,
              icon: item24310Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24304 - Para el trigésimo octavo item de Monederos
        const item24304Data = data.find((item: GW2Item) => item.id === 24304);
        if (item24304Data) {
          setItemDetails(prev => ({
            ...prev,
            24304: {
              name: item24304Data.name,
              icon: item24304Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24289 - Para el trigésimo noveno item de Monederos
        const item24289Data = data.find((item: GW2Item) => item.id === 24289);
        if (item24289Data) {
          setItemDetails(prev => ({
            ...prev,
            24289: {
              name: item24289Data.name,
              icon: item24289Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 38030 - Para el cuadragésimo item de Monederos
        const item38030Data = data.find((item: GW2Item) => item.id === 38030);
        if (item38030Data) {
          setItemDetails(prev => ({
            ...prev,
            38030: {
              name: item38030Data.name,
              icon: item38030Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24330 - Para el cuadragésimo primer item de Monederos
        const item24330Data = data.find((item: GW2Item) => item.id === 24330);
        if (item24330Data) {
          setItemDetails(prev => ({
            ...prev,
            24330: {
              name: item24330Data.name,
              icon: item24330Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24305 - Para el cuadragésimo segundo item de Monederos
        const item24305Data = data.find((item: GW2Item) => item.id === 24305);
        if (item24305Data) {
          setItemDetails(prev => ({
            ...prev,
            24305: {
              name: item24305Data.name,
              icon: item24305Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24315 - Para el cuadragésimo tercer item de Monederos
        const item24315Data = data.find((item: GW2Item) => item.id === 24315);
        if (item24315Data) {
          setItemDetails(prev => ({
            ...prev,
            24315: {
              name: item24315Data.name,
              icon: item24315Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24340 - Para el cuadragésimo cuarto item de Monederos
        const item24340Data = data.find((item: GW2Item) => item.id === 24340);
        if (item24340Data) {
          setItemDetails(prev => ({
            ...prev,
            24340: {
              name: item24340Data.name,
              icon: item24340Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24325 - Para el cuadragésimo quinto item de Monederos
        const item24325Data = data.find((item: GW2Item) => item.id === 24325);
        if (item24325Data) {
          setItemDetails(prev => ({
            ...prev,
            24325: {
              name: item24325Data.name,
              icon: item24325Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 24335 - Para el cuadragésimo sexto item de Monederos
        const item24335Data = data.find((item: GW2Item) => item.id === 24335);
        if (item24335Data) {
          setItemDetails(prev => ({
            ...prev,
            24335: {
              name: item24335Data.name,
              icon: item24335Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 44967 - Para el cuadragésimo séptimo item de Monederos
        const item44967Data = data.find((item: GW2Item) => item.id === 44967);
        if (item44967Data) {
          setItemDetails(prev => ({
            ...prev,
            44967: {
              name: item44967Data.name,
              icon: item44967Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 45150 - Para el cuadragésimo octavo item de Monederos
        const item45150Data = data.find((item: GW2Item) => item.id === 45150);
        if (item45150Data) {
          setItemDetails(prev => ({
            ...prev,
            45150: {
              name: item45150Data.name,
              icon: item45150Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 44980 - Para el cuadragésimo noveno item de Monederos
        const item44980Data = data.find((item: GW2Item) => item.id === 44980);
        if (item44980Data) {
          setItemDetails(prev => ({
            ...prev,
            44980: {
              name: item44980Data.name,
              icon: item44980Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 26150 - Para el quincuagésimo item de Monederos
        const item26150Data = data.find((item: GW2Item) => item.id === 26150);
        if (item26150Data) {
          setItemDetails(prev => ({
            ...prev,
            26150: {
              name: item26150Data.name,
              icon: item26150Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 2397 - Para el quincuagésimo primer item de Monederos
        const item2397Data = data.find((item: GW2Item) => item.id === 2397);
        if (item2397Data) {
          setItemDetails(prev => ({
            ...prev,
            2397: {
              name: item2397Data.name,
              icon: item2397Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 28592 - Para el quincuagésimo segundo item de Monederos
        const item28592Data = data.find((item: GW2Item) => item.id === 28592);
        if (item28592Data) {
          setItemDetails(prev => ({
            ...prev,
            28592: {
              name: item28592Data.name,
              icon: item28592Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 1366 - Para el quincuagésimo tercer item de Monederos
        const item1366Data = data.find((item: GW2Item) => item.id === 1366);
        if (item1366Data) {
          setItemDetails(prev => ({
            ...prev,
            1366: {
              name: item1366Data.name,
              icon: item1366Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 26854 - Para el quincuagésimo cuarto item de Monederos
        const item26854Data = data.find((item: GW2Item) => item.id === 26854);
        if (item26854Data) {
          setItemDetails(prev => ({
            ...prev,
            26854: {
              name: item26854Data.name,
              icon: item26854Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 26872 - Para el quincuagésimo quinto item de Monederos
        const item26872Data = data.find((item: GW2Item) => item.id === 26872);
        if (item26872Data) {
          setItemDetails(prev => ({
            ...prev,
            26872: {
              name: item26872Data.name,
              icon: item26872Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 27179 - Para el quincuagésimo sexto item de Monederos
        const item27179Data = data.find((item: GW2Item) => item.id === 27179);
        if (item27179Data) {
          setItemDetails(prev => ({
            ...prev,
            27179: {
              name: item27179Data.name,
              icon: item27179Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 2703 - Para el quincuagésimo séptimo item de Monederos
        const item2703Data = data.find((item: GW2Item) => item.id === 2703);
        if (item2703Data) {
          setItemDetails(prev => ({
            ...prev,
            2703: {
              name: item2703Data.name,
              icon: item2703Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 2692 - Para el quincuagésimo octavo item de Monederos
        const item2692Data = data.find((item: GW2Item) => item.id === 2692);
        if (item2692Data) {
          setItemDetails(prev => ({
            ...prev,
            2692: {
              name: item2692Data.name,
              icon: item2692Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }
        
        // Item ID 44991 - Combustion
        const item44991Data = data.find((item: GW2Item) => item.id === 44991);
        if (item44991Data) {
          setItemDetails(prev => ({
            ...prev,
            44991: {
              name: item44991Data.name,
              icon: item44991Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 44985 - Crystal Guardian
        const item44985Data = data.find((item: GW2Item) => item.id === 44985);
        if (item44985Data) {
          setItemDetails(prev => ({
            ...prev,
            44985: {
              name: item44985Data.name,
              icon: item44985Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 44992 - Monsoon
        const item44992Data = data.find((item: GW2Item) => item.id === 44992);
        if (item44992Data) {
          setItemDetails(prev => ({
            ...prev,
            44992: {
              name: item44992Data.name,
              icon: item44992Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 44972 - Scepter of the Highborn
        const item44972Data = data.find((item: GW2Item) => item.id === 44972);
        if (item44972Data) {
          setItemDetails(prev => ({
            ...prev,
            44972: {
              name: item44972Data.name,
              icon: item44972Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 44975 - Shiverstone
        const item44975Data = data.find((item: GW2Item) => item.id === 44975);
        if (item44975Data) {
          setItemDetails(prev => ({
            ...prev,
            44975: {
              name: item44975Data.name,
              icon: item44975Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 44979 - Stardust
        const item44979Data = data.find((item: GW2Item) => item.id === 44979);
        if (item44979Data) {
          setItemDetails(prev => ({
            ...prev,
            44979: {
              name: item44979Data.name,
              icon: item44979Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 44971 - Scepter of the Highborn
        const item44971Data = data.find((item: GW2Item) => item.id === 44971);
        if (item44971Data) {
          setItemDetails(prev => ({
            ...prev,
            44971: {
              name: item44971Data.name,
              icon: item44971Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }


        // Item ID 44978 - Stardust
        const item44978Data = data.find((item: GW2Item) => item.id === 44978);
        if (item44978Data) {
          setItemDetails(prev => ({
            ...prev,
            44978: {
              name: item44978Data.name,
              icon: item44978Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 44965
        const item44965Data = data.find((item: GW2Item) => item.id === 44965);
        if (item44965Data) {
          setItemDetails(prev => ({
            ...prev,
            44965: {
              name: item44965Data.name,
              icon: item44965Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 44970
        const item44970Data = data.find((item: GW2Item) => item.id === 44970);
        if (item44970Data) {
          setItemDetails(prev => ({
            ...prev,
            44970: {
              name: item44970Data.name,
              icon: item44970Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 44988
        const item44988Data = data.find((item: GW2Item) => item.id === 44988);
        if (item44988Data) {
          setItemDetails(prev => ({
            ...prev,
            44988: {
              name: item44988Data.name,
              icon: item44988Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 44973
        const item44973Data = data.find((item: GW2Item) => item.id === 44973);
        if (item44973Data) {
          setItemDetails(prev => ({
            ...prev,
            44973: {
              name: item44973Data.name,
              icon: item44973Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98755
        const item98755Data = data.find((item: GW2Item) => item.id === 98755);
        if (item98755Data) {
          setItemDetails(prev => ({
            ...prev,
            98755: {
              name: item98755Data.name,
              icon: item98755Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98775
        const item98775Data = data.find((item: GW2Item) => item.id === 98775);
        if (item98775Data) {
          setItemDetails(prev => ({
            ...prev,
            98775: {
              name: item98775Data.name,
              icon: item98775Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98569
        const item98569Data = data.find((item: GW2Item) => item.id === 98569);
        if (item98569Data) {
          setItemDetails(prev => ({
            ...prev,
            98569: {
              name: item98569Data.name,
              icon: item98569Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98445
        const item98445Data = data.find((item: GW2Item) => item.id === 98445);
        if (item98445Data) {
          setItemDetails(prev => ({
            ...prev,
            98445: {
              name: item98445Data.name,
              icon: item98445Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98843
        const item98843Data = data.find((item: GW2Item) => item.id === 98843);
        if (item98843Data) {
          setItemDetails(prev => ({
            ...prev,
            98843: {
              name: item98843Data.name,
              icon: item98843Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98452
        const item98452Data = data.find((item: GW2Item) => item.id === 98452);
        if (item98452Data) {
          setItemDetails(prev => ({
            ...prev,
            98452: {
              name: item98452Data.name,
              icon: item98452Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98427
        const item98427Data = data.find((item: GW2Item) => item.id === 98427);
        if (item98427Data) {
          setItemDetails(prev => ({
            ...prev,
            98427: {
              name: item98427Data.name,
              icon: item98427Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98521
        const item98521Data = data.find((item: GW2Item) => item.id === 98521);
        if (item98521Data) {
          setItemDetails(prev => ({
            ...prev,
            98521: {
              name: item98521Data.name,
              icon: item98521Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98506
        const item98506Data = data.find((item: GW2Item) => item.id === 98506);
        if (item98506Data) {
          setItemDetails(prev => ({
            ...prev,
            98506: {
              name: item98506Data.name,
              icon: item98506Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98826
        const item98826Data = data.find((item: GW2Item) => item.id === 98826);
        if (item98826Data) {
          setItemDetails(prev => ({
            ...prev,
            98826: {
              name: item98826Data.name,
              icon: item98826Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98809
        const item98809Data = data.find((item: GW2Item) => item.id === 98809);
        if (item98809Data) {
          setItemDetails(prev => ({
            ...prev,
            98809: {
              name: item98809Data.name,
              icon: item98809Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98492
        const item98492Data = data.find((item: GW2Item) => item.id === 98492);
        if (item98492Data) {
          setItemDetails(prev => ({
            ...prev,
            98492: {
              name: item98492Data.name,
              icon: item98492Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98578
        const item98578Data = data.find((item: GW2Item) => item.id === 98578);
        if (item98578Data) {
          setItemDetails(prev => ({
            ...prev,
            98578: {
              name: item98578Data.name,
              icon: item98578Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98784
        const item98784Data = data.find((item: GW2Item) => item.id === 98784);
        if (item98784Data) {
          setItemDetails(prev => ({
            ...prev,
            98784: {
              name: item98784Data.name,
              icon: item98784Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 98632
        const item98632Data = data.find((item: GW2Item) => item.id === 98632);
        if (item98632Data) {
          setItemDetails(prev => ({
            ...prev,
            98632: {
              name: item98632Data.name,
              icon: item98632Data.icon,
              price: 0 // Se actualizará con fetchItemPrices
            }
          }));
        }

        // Item ID 99999 - Random Exotic (agrupación de items exóticos)
        setItemDetails(prev => ({
          ...prev,
          99999: {
            name: t('fourWindsPrizeBag.randomExotic'),
            icon: 'https://wiki.guildwars2.com/images/6/6f/Mystic_Forge.png', // Icono de Mystic Forge (símbolo de aleatoriedad)
            price: 0 // Se actualizará con fetchItemPrices
          }
        }));
      }
  };

  // Función auxiliar para procesar los datos de precios
  const processPricesData = useCallback((prices: GW2Price[]) => {
    const priceData: {[key: number]: number} = {};
    const itemsWithoutPrice: number[] = [];
    
    prices.forEach((price: GW2Price) => {
      // Intentar obtener precio de venta primero, si no existe, usar precio de compra
      if (price.sells && price.sells.unit_price) {
        priceData[price.id] = price.sells.unit_price;
      } else if (price.buys && price.buys.unit_price) {
        priceData[price.id] = price.buys.unit_price;
      } else {
        itemsWithoutPrice.push(price.id);
      }
    });
    
    if (itemsWithoutPrice.length > 0) {
      // Items sin precio disponible
    }
    
    setItemDetails(prev => {
      const updated = {...prev};
      let hasChanges = false;
      
      Object.keys(priceData).forEach(id => {
        const itemId = parseInt(id);
        if (updated[itemId] && updated[itemId].price !== priceData[itemId]) {
          updated[itemId].price = priceData[itemId];
          hasChanges = true;
        }
      });
      
      // Solo actualizar si hay cambios reales
      return hasChanges ? updated : prev;
    });
    
    // Marcar que los precios se cargaron después de procesarlos
    pricesLoadedRef.current = true;
  }, []);

  // Función para obtener precios de los items
  const fetchItemPrices = useCallback(async () => {
    try {
      // Verificar caché primero
      const cached = PricesCache.get();
      if (cached) {
        processPricesData(cached.data);
        return;
      }

      const itemIds = [46731, 84731, 83008, 24288, 24356, 44960, 24299, 44976, 19748, 24341, 19700, 24282, 19701, 19732, 19729, 24329, 24320, 24357, 24300, 19745, 24309, 24350, 24324, 24358, 24319, 24294, 24295, 44966, 24283, 24314, 78886, 24334, 24277, 24351, 24276, 24339, 24310, 24304, 24289, 38030, 24330, 24305, 24315, 24340, 24325, 24335, 44967, 45150, 44980, 44991, 44985, 44992, 44972, 44975, 44979, 44971, 44978, 44965, 44970, 44988, 44973, 98755, 98775, 98569, 98445, 98843, 98452, 98427, 98521, 98506, 98826, 98809, 98492, 98578, 98784, 98632, 26150, 2397, 28592, 1366, 26854, 26872, 27179, 2703, 2692]; // Agregar más IDs según sea necesario
      const response = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${itemIds.join(',')}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      const prices: GW2Price[] = await response.json();
      
      // Guardar en caché
      PricesCache.set(prices);
      
      processPricesData(prices);
    } catch {
      // Error fetching item prices
    }
  }, [processPricesData]);

  // Efecto para cargar los items cuando cambie el idioma
  useEffect(() => {
    if (lang && lang !== currentLangRef.current) {
      currentLangRef.current = lang;
      pricesLoadedRef.current = false; // Resetear flag cuando cambia el idioma
      fetchItems(lang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Efecto para cargar precios después de cargar items (solo una vez)
  useEffect(() => {
    const itemDetailsKeys = Object.keys(itemDetails);
    if (itemDetailsKeys.length > 0 && !pricesLoadedRef.current) {
      // Verificar que al menos un item tenga precio 0 (sin cargar)
      const hasUnloadedPrices = itemDetailsKeys.some(key => {
        const item = itemDetails[parseInt(key)];
        return item && item.price === 0;
      });
      
      if (hasUnloadedPrices) {
        fetchItemPrices();
      }
    }
  }, [itemDetails, fetchItemPrices]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Hero Section */}
          <div className="mb-8">
            {/* Botón de regreso */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Link 
                href="/opened" 
                className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 hover:bg-gray-800/90 border border-purple-500/30 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('fourWindsPrizeBag.backButton')}
              </Link>
            </motion.div>

            {/* Título centrado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
            >
              <div className="w-20 h-20 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                {fourWindsBag ? (
                  <Image 
                    src={fourWindsBag.icon} 
                    alt={fourWindsBag.name} 
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                <Gift className="h-10 w-10 sm:h-8 sm:w-8 text-white" />
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-center">
                <span 
                  className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}
                >
                  {fourWindsBag ? fourWindsBag.name : t('fourWindsPrizeBag.title')}
                </span>
              </h1>
            </motion.div>

            {/* Subtítulo centrado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center px-4"
            >
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                {t('fourWindsPrizeBag.subtitle')}
              </p>
            </motion.div>

            {/* Nota de fuente de datos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-center px-4 mt-4"
            >
              <p className="text-sm text-gray-400 max-w-2xl mx-auto">
                {t('fourWindsPrizeBag.dataSource')}{' '}
                <a
                  href="https://www.twitch.tv/vortus43"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline transition-colors"
                >
                  Vortus43
                </a>
                {' '}
                {lang === 'es' && 'y'}
                {lang === 'en' && 'and'}
                {lang === 'de' && 'und'}
                {lang === 'fr' && 'et'}
                {' '}Giges.9632
              </p>
            </motion.div>
          </div>

          {/* {t('fourWindsPrizeBag.generalStats')} */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
          >
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center shadow-sm">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">Aperturas</h3>
              </div>
              <p className="text-2xl font-bold text-blue-400">{totalOpened.toLocaleString()}</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-lg p-4 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:scale-105 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-md flex items-center justify-center shadow-sm">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">{t('fourWindsPrizeBag.totalItems')}</h3>
              </div>
              <p className="text-2xl font-bold text-orange-400">{totalItems.toLocaleString()}</p>
            </div>
            
            
            
             <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 shadow-md">
               <div className="flex items-center gap-2 mb-2">
                 <div className="w-8 h-8 rounded-md flex items-center justify-center shadow-sm overflow-hidden">
                   {festivalToken ? (
                     <Image 
                       src={festivalToken.icon} 
                       alt={festivalToken.name} 
                       width={32}
                       height={32}
                       className="w-full h-full object-cover"
                     />
                   ) : (
                     <Coins className="w-4 h-4 text-white" />
                   )}
                 </div>
                 <h3 className="text-base font-bold text-white">
                   {festivalToken ? festivalToken.name : 'Cargando...'}
                 </h3>
              </div>
               <p className="text-2xl font-bold text-yellow-400">{eventCoins.toLocaleString()}</p>
            </div>
             
          </motion.div>

          {/* {t('fourWindsPrizeBag.rewardsAnalysis')} */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600/50"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              {t('fourWindsPrizeBag.rewardsAnalysis')}
            </h2>
            
            {/* Section Navigation */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 shadow-2xl w-full max-w-4xl">
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.entries(rewardSections).map(([key, section]) => (
                    <button
                      key={key}
                      onClick={() => setActiveRewardSection(key)}
                      className={`px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${
                        activeRewardSection === key
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {section.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content based on active section */}
            {Object.entries(rewardSections).map(([key, section]) => (
              activeRewardSection === key && (
                  <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Section Header */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center overflow-hidden">
                        {section.itemIcon ? (
                          <Image 
                            src={section.itemIcon} 
                            alt={section.name} 
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <section.icon className="w-8 h-8 text-white" />
                        )}
                        </div>
                        <div className="text-center">
                        <h3 className="text-2xl font-bold text-white">{section.name}</h3>
                        </div>
                      </div>
                      
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                       <div className="bg-purple-500/20 rounded-lg p-4">
                         <div className="text-3xl font-bold text-purple-400">{section.count.toLocaleString()}</div>
                         <div className="text-sm text-gray-300">{t('fourWindsPrizeBag.boxesOpened')}</div>
                       </div>
                       <div className="bg-pink-500/20 rounded-lg p-4">
                         <div className="text-3xl font-bold text-pink-400">{section.percentage.toFixed(2)}%</div>
                         <div className="text-sm text-gray-300">{t('fourWindsPrizeBag.probability')}</div>
                       </div>
                       <div className="bg-green-500/20 rounded-lg p-4">
                         <div className="text-3xl font-bold text-green-400">
                           {formatPriceComplete(calculateSectionTotalValue(section))}
                         </div>
                         <div className="text-sm text-gray-300">{t('fourWindsPrizeBag.totalValue')}</div>
                       </div>
                     </div>
                  </div>

                   {/* Tabla de Contenidos - Estilo Fractales */}
                   <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
                     <div className="p-6 border-b border-gray-700">
                       <h4 className="text-2xl font-bold text-white flex items-center">
                         <Package className="w-6 h-6 mr-3 text-green-400" />
                         {t('fourWindsPrizeBag.containerContent')}
                       </h4>
                     </div>
                     <div className="overflow-x-auto">
                       <table className="w-full text-sm">
                         <thead>
                           <tr className="border-b border-gray-700 bg-gray-800/60">
                             <th 
                               className="text-left p-3 text-gray-200 font-semibold cursor-pointer hover:bg-gray-700/60 transition-colors select-none"
                               onClick={() => handleSort('name')}
                             >
                               <div className="flex items-center gap-2">
                                 Item
                                 <div className="flex flex-col text-xs text-gray-500">
                                   <span className={sortBy === 'name' && sortDirection === 'asc' ? 'text-blue-400' : 'text-gray-500'}>↑</span>
                                 </div>
                               </div>
                             </th>
                             <th 
                               className="text-center p-3 text-gray-200 font-semibold cursor-pointer hover:bg-gray-700/60 transition-colors select-none"
                               onClick={() => handleSort('count')}
                             >
                               <div className="flex items-center justify-center gap-2">
                                 {t('fourWindsPrizeBag.quantityObtained')}
                                 <div className="flex flex-col text-xs text-gray-500">
                                   <span className={sortBy === 'count' && sortDirection === 'asc' ? 'text-blue-400' : 'text-gray-500'}>↑</span>
                                 </div>
                               </div>
                             </th>
                             <th 
                               className="text-center p-3 text-gray-200 font-semibold cursor-pointer hover:bg-gray-700/60 transition-colors select-none"
                               onClick={() => handleSort('price')}
                             >
                               <div className="flex items-center justify-center gap-2">
                                 {t('fourWindsPrizeBag.currentPrice')}
                                 <div className="flex flex-col text-xs text-gray-500">
                                   <span className={sortBy === 'price' && sortDirection === 'asc' ? 'text-blue-400' : 'text-gray-500'}>↑</span>
                                 </div>
                               </div>
                             </th>
                             <th 
                               className="text-center p-3 text-gray-200 font-semibold cursor-pointer hover:bg-gray-700/60 transition-colors select-none"
                               onClick={() => handleSort('totalValue')}
                             >
                               <div className="flex items-center justify-center gap-2">
                                 {t('fourWindsPrizeBag.totalValueEarned')}
                                 <div className="flex flex-col text-xs text-gray-500">
                                   <span className={sortBy === 'totalValue' && sortDirection === 'asc' ? 'text-blue-400' : 'text-gray-500'}>↑</span>
                                 </div>
                               </div>
                             </th>
                             <th 
                               className="text-center p-3 text-gray-200 font-semibold cursor-pointer hover:bg-gray-700/60 transition-colors select-none"
                               onClick={() => handleSort('percentage')}
                             >
                               <div className="flex items-center justify-center gap-2">
                                 Porcentaje de Caída
                                 <div className="flex flex-col text-xs text-gray-500">
                                   <span className={sortBy === 'percentage' && sortDirection === 'asc' ? 'text-blue-400' : 'text-gray-500'}>↑</span>
                                 </div>
                               </div>
                             </th>
                           </tr>
                         </thead>
                         <tbody>
                           {sortTableData(section.tableData).map((row, idx) => {

                             return (
                               <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                                 <td className="p-3 text-white">
                                   <div className="flex items-center gap-3">
                                     {itemDetails[row.id]?.icon ? (
                                       <Image
                                         src={itemDetails[row.id].icon}
                                         alt={itemDetails[row.id].name}
                                         width={32}
                                         height={32}
                                         className="rounded"
                                       />
                                     ) : (
                                       <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                                         <span className="text-xs text-gray-400">?</span>
                        </div>
                                     )}
                                     <div>
                                       <div className="font-medium">
                                         {itemDetails[row.id]?.name || row.item}
                        </div>
                      </div>
                    </div>
                                 </td>
                                 <td className="p-3 text-center">
                                   <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                                     row.count > 5000 
                                       ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                       : row.count > 1000
                                       ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                       : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                   }`}>
                                     {row.count.toLocaleString()}
                                   </span>
                                 </td>
                                   <td className="p-3 text-center text-gray-300">
                                    {itemDetails[row.id]?.price ? formatPriceComplete(itemDetails[row.id].price) : '-'}
                                   </td>
                                   <td className="p-3 text-center text-gray-300">
                                    {itemDetails[row.id]?.price ? formatPriceComplete(itemDetails[row.id].price * row.count) : '-'}
                                   </td>
                                 <td className="p-3 text-center">
                                   <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                                     (row.count / section.count * 100) > 20 
                                       ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                       : (row.count / section.count * 100) > 10
                                       ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                       : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                   }`}>
                                     {(row.count / section.count * 100).toFixed(2)}%
                                   </span>
                                 </td>
                               </tr>
                );
              })}
                         </tbody>
                       </table>
                     </div>
            </div>
                </motion.div>
              )
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
}
