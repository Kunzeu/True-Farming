'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { 
  BookOpen, 
  TrendingUp, 
  Package, 
  RefreshCw,
  Info,
  AlertCircle,
  BarChart3,
  Zap,
  Star,
  Loader2
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import WikiItemLink from '@/components/ui/WikiItemLink';
import {
  CORE_CONVERSIONS,
  CORE_CONVERSION_PRICE_IDS,
  coreConversionCost,
  coreLodestone90,
  coreLodestoneValue,
  coreProfitPerShard,
} from '@/lib/core-conversion';

interface Gw2Price {
  id: number;
  buys: { quantity: number; unit_price: number };
  sells: { quantity: number; unit_price: number };
}

interface Gw2Item {
  id: number;
  name: string;
  icon: string;
}

interface ConversionItem {
  id: number;
  name: string;
  icon: string;
  precio90: number; // en cobre
  precio85: number; // en cobre
  costeConv20: number; // en cobre
  profit90: number; // en cobre
  profit85: number; // en cobre
}

interface CachedItemData {
  names: Record<string, string>; // lang -> name
  icon: string;
  timestamp: number;
}

// Sistema de caché para items
class ItemCache {
  private static memoryCache: Map<number, CachedItemData> = new Map();
  private static CACHE_KEY = 'gw2_items_cache';
  private static CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

  static get(itemId: number): CachedItemData | null {
    const memCached = this.memoryCache.get(itemId);
    if (memCached && Date.now() - memCached.timestamp < this.CACHE_DURATION) {
      return memCached;
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${this.CACHE_KEY}_${itemId}`);
        if (stored) {
          const data: CachedItemData = JSON.parse(stored);
          if (Date.now() - data.timestamp < this.CACHE_DURATION) {
            this.memoryCache.set(itemId, data);
            return data;
          } else {
            localStorage.removeItem(`${this.CACHE_KEY}_${itemId}`);
          }
        }
      } catch (e) {
        console.warn('Error reading from cache:', e);
      }
    }
    return null;
  }

  static set(itemId: number, data: CachedItemData): void {
    this.memoryCache.set(itemId, data);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${this.CACHE_KEY}_${itemId}`, JSON.stringify(data));
      } catch (e) {
        console.warn('Error writing to cache:', e);
      }
    }
  }
}

// Componente de imagen optimizada para móvil
const OptimizedImage = ({ src, alt, className, priority = false }: {
  src: string;
  alt: string;
  className: string;
  priority?: boolean;
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Reset states when src changes
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);

    // Si es una imagen local, usarla directamente
    if (src.startsWith('/images/')) {
      setImageSrc(src);
      setIsLoading(false);
      return;
    }

    // Si es una imagen externa, intentar cargarla con optimizaciones
    if (src.startsWith('http')) {
      setImageSrc(src);
      setIsLoading(false);
    }
  }, [src, priority]);

  const handleImageError = () => {
    if (retryCount < 2) {
      // Reintentar hasta 2 veces con un pequeño delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setHasError(false);
        setIsLoading(true);
        // Forzar recarga de la imagen
        const newSrc = `${src}?retry=${retryCount + 1}&t=${Date.now()}`;
        setImageSrc(newSrc);
        setIsLoading(false);
      }, 500 * (retryCount + 1));
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-700 animate-pulse rounded flex items-center justify-center`}>
        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`${className} bg-gray-600 flex items-center justify-center text-xs text-gray-400`}>
        ❌
      </div>
    );
  }

  // Para imágenes locales, usar next/image optimizado
  if (imageSrc.startsWith('/images/')) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        className={className}
        width={32}
        height={32}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        quality={85}
        onError={handleImageError}
      />
    );
  }

  // Para imágenes externas, usar Image de Next.js
  return (
    <Image
      src={imageSrc}
      alt={alt}
      className={className}
      width={32}
      height={32}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      quality={85}
      unoptimized={true}
      onError={handleImageError}
      style={{
        width: '32px',
        height: '32px',
        objectFit: 'contain'
      }}
    />
  );
};

const CraftingPage = () => {
  usePageTitle('dashboard.magic.title', 'Magia');
  const { t, lang } = useI18n();
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [hashSub, setHashSub] = useState('');
  const [conversionData, setConversionData] = useState<ConversionItem[]>([]);
  const [coreConversionData, setCoreConversionData] = useState<ConversionItem[]>([]);
  const [isLoadingConversions, setIsLoadingConversions] = useState(false);

  const [itemPrices, setItemPrices] = useState<Record<number, Gw2Price>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  
  // Estado para la calculadora de Magia Volátil
  const [userVolatileMagic, setUserVolatileMagic] = useState<string>('');
  
  // Estado para la calculadora de Magia Liberada
  const [userUnboundMagic, setUserUnboundMagic] = useState<string>('');
  
  // Estado para los nombres de los items de las tablas
  const [tableItemNames, setTableItemNames] = useState<Record<number, string>>({});
  
  // Estado para los iconos de los items de las tablas
  const [tableItemIcons, setTableItemIcons] = useState<Record<number, string>>({});
  
  // Caché para datos de la API
  const [apiCache, setApiCache] = useState<{
    prices: Record<number, Gw2Price>;
    items: Record<number, Gw2Item>;
    lastUpdate: Date | null;
    lang: string;
  }>({
    prices: {},
    items: {},
    lastUpdate: null,
    lang: ''
  });


  // T6 Materials from the image with their GW2 IDs
  const t6Materials = useMemo(() => [
    { id: 24295, name: '', t5Id: 24294 }, // Vial of Powerful Blood
    { id: 24358, name: '', t5Id: 24341 }, // Ancient Bone
    { id: 24351, name: '', t5Id: 24350 }, // Vicious Claw
    { id: 24357, name: '', t5Id: 24356 }, // Vicious Fang
    { id: 24289, name: '', t5Id: 24288 }, // Armored Scale
    { id: 24300, name: '', t5Id: 24299 }, // Elaborate Totem
    { id: 24283, name: '', t5Id: 24282 }, // Powerful Venom Sac
  ], []);

  // Materials for T5 to T6 conversion
  const conversionMaterials = useMemo(() => ({
    ectoplasm: 19721, // Glob of Ectoplasm (al 90%/1.85)
    crystallineDust: 24277, // Pile of Crystalline Dust
  }), []);

  const allConversionItemIds = useMemo(() => [
    ...t6Materials.map(m => m.id),
    ...t6Materials.map(m => m.t5Id),
    ...Object.values(conversionMaterials),
    ...CORE_CONVERSION_PRICE_IDS,
  ], [t6Materials, conversionMaterials]);

  // IDs de los items en las tablas
  const tableItemIds = useMemo(() => {
    const allIds = [
      // Trofeos Raros (T6)
      24295, 24358, 24351, 24357, 24289, 24300, 24283, 24277,
      // Trofeos Comunes (T5)
      24294, 24341, 24350, 24356, 24288, 24299, 24282, 24276,
      // Items para cálculos adicionales
      89271, 89103, 24591, 19701, 97102, 19721, 10804, 19745, 19790, 19732, 24868, 24315, 89182, 24609, 24320, 89216, 24839, 24325, 24800, 24330, 89258, 100527, 89098, 74326,
      // Items para research notes
      12156, 24473, 19700, 24519, 24511, 24475, 19722, 19729, 19748, 68063,
      // Items para cálculos finales
      97535, 95582, 19912, 24836, 24806, 48917, 7839, 48884, 46735, 24821,
      // Items para Magia Liberada
      79186,
      // Items adicionales para UM (según nueva imagen)
      24370, 76179, 70957, 19675, 37897,
      // Items para Freshwater Pearl (76179)
      99965,
      // Items para Maguuma Lily (70957)
      100693,
      // Items para nuevo item 24824
      89182, 24824, 89258, 74202, 74978,
      // Lodestones y otros items de UM
      24305, 24310, 24315, 24320, 24325, 24330, 70842, 68942, 24335, 72504, 76491, 75654, 72315, 74988, 24762, 100429, 24815,
      // Item para Trophy Shipment
      85725,
      // Items de Magia Liberada
      79280, 79469, 79899, 80332, 81127, 81706,
      // Items de Magia Volátil
      86069, 86977, 87645, 89537, 88955
    ];
    
    // Eliminar duplicados y filtrar IDs válidos
    return [...new Set(allIds)].filter(id => id && id > 0);
  }, []);

  // Función para calcular precio del item 24591 × 1 (buy)
  const calculateItem24591Price = useCallback(() => {
    if (!itemPrices || !itemPrices[24591]) return 0;
    
    const item = itemPrices[24591];
    const buyPrice = item.buys?.unit_price || 0;
    
    // Convertir de cobre a oro (10000 cobre = 1 oro)
    const priceInGold = buyPrice / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 19701 × 16 (buy)
  const calculateItem19701Price = useCallback(() => {
    if (!itemPrices || !itemPrices[19701]) return 0;
    
    const item = itemPrices[19701];
    const buyPrice = item.buys?.unit_price || 0;
    
    // Convertir de cobre a oro (10000 cobre = 1 oro) y multiplicar por 16
    const priceInGold = (buyPrice * 16) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 24295 × 1 (sell × 0.9)
  const calculateItem24295Price = useCallback(() => {
    if (!itemPrices || !itemPrices[24295]) return 0;
    
    const item = itemPrices[24295];
    const sellPrice = item.sells?.unit_price || 0;
    
    // Convertir de cobre a oro (10000 cobre = 1 oro) y multiplicar por 0.9
    const priceInGold = (sellPrice * 0.9) / 10000;
        
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 24358 × 1 (sell × 0.9)
  const calculateItem24358Price = useCallback(() => {
    if (!itemPrices || !itemPrices[24358]) return 0;
    
    const item = itemPrices[24358];
    const sellPrice = item.sells?.unit_price || 0;
    
    // Convertir de cobre a oro (10000 cobre = 1 oro) y multiplicar por 0.9
    const priceInGold = (sellPrice * 0.9) / 10000;
        
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 24351 × 5 (sell × 0.9)
  const calculateItem24351Price = useCallback(() => {
    if (!itemPrices || !itemPrices[24351]) return 0;
    
    const item = itemPrices[24351];
    const sellPrice = item.sells?.unit_price || 0;
    
    // Convertir de cobre a oro (10000 cobre = 1 oro) y multiplicar por 5 × 0.9
    const priceInGold = (sellPrice * 5 * 0.9) / 10000;
        
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 97102 × 4 (buy)
  const calculateItem97102Price = useCallback(() => {
    if (!itemPrices || !itemPrices[97102]) return 0;
    
    const item = itemPrices[97102];
    const buyPrice = item.buys?.unit_price || 0;
    
    // Convertir de cobre a oro (10000 cobre = 1 oro) y multiplicar por 4
    const priceInGold = (buyPrice * 8) / 10000;
        
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 19721 × 2 (sell × 0.9)
  const calculateItem19721Price = useCallback(() => {
    if (!itemPrices || !itemPrices[19721]) return 0;
    
    const item = itemPrices[19721];
    const sellPrice = item.sells?.unit_price || 0;
    
    // Convertir de cobre a oro (10000 cobre = 1 oro) y multiplicar por 2 × 0.9
    const priceInGold = (sellPrice * 4 * 0.9) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 19721 × 5 (sell × 0.9)
  const calculateItem19721x5Price = useCallback(() => {
    if (!itemPrices || !itemPrices[19721]) return 0;
    
    const item = itemPrices[19721];
    const sellPrice = item.sells?.unit_price || 0;
    
    // Convertir de cobre a oro (10000 cobre = 1 oro) y multiplicar por 5 × 0.9
    const priceInGold = (sellPrice * 5 * 0.9) / 10000;
    
    return priceInGold; 
  }, [itemPrices]);



                      // Función para calcular el precio completo del crafting de Gossamer Patch
        const calculateGossamerPatchCraftingPrice = useCallback(() => {
          if (!itemPrices) return 0;
          
          // Gossamer Patch se craftea con:
          // - 25 Spool of Gossamer Thread (ID 19790)
          // - 30 Hardened Leather Section (ID 19732) 
          // - 8 Gossamer Scrap (ID 19745)
          
          let precioCompleto = 0;
          
          // Spool of Gossamer Thread × 25
          if (itemPrices[19790]) {
            const gossamerThread = itemPrices[19790];
            const buyPrice = gossamerThread.buys?.unit_price || 0;
            precioCompleto += (buyPrice * 25) / 10000; // Convertir de cobre a oro
          }
    
    // Hardened Leather Section × 30
    if (itemPrices[19732]) {
      const hardenedLeather = itemPrices[19732];
      const buyPrice = hardenedLeather.buys?.unit_price || 0;
      precioCompleto += (buyPrice * 30) / 10000; // Convertir de cobre a oro
    }
    
    // Gossamer Scrap × 8
    if (itemPrices[19745]) {
      const gossamerScrap = itemPrices[19745];
      const buyPrice = gossamerScrap.buys?.unit_price || 0;
      precioCompleto += (buyPrice * 8) / 10000; // Convertir de cobre a oro
    }
    
    // Dividir entre 5 para obtener el precio por patch (ya que se craftean 5)
    const precioFinal = precioCompleto;
    
    return precioFinal;
  }, [itemPrices]);

  // Función para calcular precio del item 19701 × 10 (buy)
  const calculateItem19701x10Price = useCallback(() => {
    if (!itemPrices || !itemPrices[19701]) return 0;
    
    const item = itemPrices[19701];
    const buyPrice = item.buys?.unit_price || 0;
    
    // Convertir de cobre a oro (10000 cobre = 1 oro) y multiplicar por 10
    const priceInGold = (buyPrice * 20) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular el precio total para obtener 97487
  const calculateTotalPriceFor97487 = useCallback(() => {
    const precio97102 = calculateItem97102Price();
    const precio19721 = calculateItem19721Price();
    const precio19701x10 = calculateItem19701x10Price();
    
    // Sumar los 3 valores
    const precioTotal = precio97102 + precio19721 + precio19701x10;
    
    return precioTotal;
  }, [calculateItem97102Price, calculateItem19721Price, calculateItem19701x10Price]);

  // Función para obtener el precio por nota más bajo (calculado)
  const getLowestPricePerNote = useCallback(() => {
    // Calcular el precio por nota más bajo basándose en los items disponibles
    // Usar los mismos IDs que están en research-notes
    
    if (!itemPrices || Object.keys(itemPrices).length === 0) return 0;
    
    // IDs de los items de research-notes que necesitamos
    const researchNoteItems = [
      { id: 8883, notes: 1.1, materials: [24277, 24351, 24300, 12156] },
      { id: 13436, notes: 5.1, materials: [24473, 19700] },
      { id: 13437, notes: 5.1, materials: [24519, 19700] },
      { id: 13435, notes: 5.1, materials: [24511, 19700] },
      { id: 13438, notes: 5.1, materials: [19700, 24475] },
      { id: 104934, notes: 150, materials: [19722, 19700, 19748, 68063] },
      { id: 104934.1, notes: 150, materials: [19729, 19700, 19748, 68063] }
    ];
    
    let lowestPricePerNote = Infinity;
    
    researchNoteItems.forEach(item => {
      // Calcular el costo total de crafting para este item
      let totalCost = 0;
      
      if (item.id === 8883) {
        // 24277, 24351, 24300, 12156 x1 cada uno
        totalCost = (itemPrices[24277]?.buys?.unit_price || 0) * 1 + 
                   (itemPrices[24351]?.buys?.unit_price || 0) * 1 + 
                   (itemPrices[24300]?.buys?.unit_price || 0) * 1 + 
                   (itemPrices[12156]?.buys?.unit_price || 0) * 1;
      } else if (item.id === 13436) {
        // 24473 x1 y 19700 x8
        totalCost = (itemPrices[24473]?.buys?.unit_price || 0) * 1 + 
                   (itemPrices[19700]?.buys?.unit_price || 0) * 8;
      } else if (item.id === 13437) {
        // 24519 x1 y 19700 x8
        totalCost = (itemPrices[24519]?.buys?.unit_price || 0) * 1 + 
                   (itemPrices[19700]?.buys?.unit_price || 0) * 8;
      } else if (item.id === 13435) {
        // 24511 x1 y 19700 x8
        totalCost = (itemPrices[24511]?.buys?.unit_price || 0) * 1 + 
                   (itemPrices[19700]?.buys?.unit_price || 0) * 8;
      } else if (item.id === 13438) {
        // 19700 x8 y 24475 x1
        totalCost = (itemPrices[19700]?.buys?.unit_price || 0) * 8 + 
                   (itemPrices[24475]?.buys?.unit_price || 0) * 1;
      } else if (item.id === 104934) {
        // 19722 x30, 19700 x20, 19748 x30, 68063 x1
        totalCost = (itemPrices[19722]?.buys?.unit_price || 0) * 30 + 
                   (itemPrices[19700]?.buys?.unit_price || 0) * 20 + 
                   (itemPrices[19748]?.buys?.unit_price || 0) * 30 + 
                   (itemPrices[68063]?.buys?.unit_price || 0) * 1;
      } else if (item.id === 104934.1) {
        // 19729 x40, 19700 x20, 19748 x30, 68063 x1
        totalCost = (itemPrices[19729]?.buys?.unit_price || 0) * 40 + 
                   (itemPrices[19700]?.buys?.unit_price || 0) * 20 + 
                   (itemPrices[19748]?.buys?.unit_price || 0) * 30 + 
                   (itemPrices[68063]?.buys?.unit_price || 0) * 1;
      }
      
      // Calcular precio por nota
      const pricePerNote = totalCost / item.notes;
      
      // Convertir de cobre a oro
      const pricePerNoteInGold = pricePerNote / 10000;
      
      if (pricePerNoteInGold < lowestPricePerNote && pricePerNoteInGold > 0) {
        lowestPricePerNote = pricePerNoteInGold;
      }
    });
    
    return lowestPricePerNote === Infinity ? 0 : lowestPricePerNote;
  }, [itemPrices]);

  // Función para calcular el precio total × 30 notas
  const calculateTotalWithNotes = useCallback(() => {
    const precio97487 = calculateTotalPriceFor97487();
    const precioPorNota = getLowestPricePerNote();
    
    // Sumar: precio de 97487 + (precio por nota × 60)
    const precioTotal = precio97487 + (precioPorNota * 60);
    

    
    return precioTotal;
  }, [calculateTotalPriceFor97487, getLowestPricePerNote]);

  // Función para calcular el precio de 97535 (sell × 0.85)
  const calculateItem97535Price = useCallback(() => {
    if (!itemPrices || !itemPrices[97535]) return 0;
    const item = itemPrices[97535];
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 0.85) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular el precio de 95582 (sell × 0.85)
  const calculateItem95582Price = useCallback(() => {
    if (!itemPrices || !itemPrices[95582]) return 0;
    const item = itemPrices[95582];
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 0.85) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular el precio de 95582 (sell × 0.85)
  const calculateItem19912Price = useCallback(() => {
    if (!itemPrices || !itemPrices[19912]) return 0;
    const item = itemPrices[19912];
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 0.85) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 89271 × 8 (sell × 0.9)
  const calculateItem89271x8Price = useCallback(() => {
    if (!itemPrices || !itemPrices[89271]) return 0;
    
    const item = itemPrices[89271];
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 0.9 * 8) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 24300 × 5 (sell × 0.9)
  const calculateItem24300x5Price = useCallback(() => {
    if (!itemPrices || !itemPrices[24300]) return 0;
    
    const item = itemPrices[24300];
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 0.9 * 5) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 24283 × 5 (sell × 0.9)
  const calculateItem24283x5Price = useCallback(() => {
    if (!itemPrices || !itemPrices[24283]) return 0;
    
    const item = itemPrices[24283];
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 0.9 * 5) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 89103 × 2 (buy)
  const calculateItem89103x2Price = useCallback(() => {
    if (!itemPrices || !itemPrices[89103]) return 0;
    
    const item = itemPrices[89103];
    const buyPrice = item.buys?.unit_price || 0;
    const priceInGold = (buyPrice * 2) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular el precio de 24836 (sell × 0.85)
  const calculateItem24836Price = useCallback(() => {
    if (!itemPrices || !itemPrices[24836]) return 0;
    const item = itemPrices[24836];
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 0.85) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular el precio de 24806 (sell × 0.85)
  const calculateItem24806Price = useCallback(() => {
    if (!itemPrices || !itemPrices[24806]) return 0;
    const item = itemPrices[24806];
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 0.85) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Funciones para el crafting del item 24289 (Escama blindada)
  // Ingrediente 1: 89271 x4 (buy)
  const calculateItem89271x4Price24289 = useCallback(() => {
    if (!itemPrices || !itemPrices[89271]) return 0;
    const item = itemPrices[89271];
    const buyPrice = item.buys?.unit_price || 0;
    const priceInGold = (buyPrice * 4) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Ingrediente 2: 24289 x5 (buy) - Este es el item que estamos craftando, así que usamos el precio base
  const calculateItem24289x5Price = useCallback(() => {
    if (!itemPrices || !itemPrices[24289]) return 0;
    const item = itemPrices[24289];
    const buyPrice = item.buys?.unit_price || 0;
    const priceInGold = (buyPrice * 5) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Ingrediente 3: 89258 x3 (buy)
  const calculateItem89258x3Price24289 = useCallback(() => {
    if (!itemPrices || !itemPrices[89258]) return 0;
    const item = itemPrices[89258];
    const buyPrice = item.buys?.unit_price || 0;
    const priceInGold = (buyPrice * 3) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Ingrediente 4: 19721 x5 (sell × 0.9)
  const calculateItem19721x5Price24289 = useCallback(() => {
    if (!itemPrices || !itemPrices[19721]) return 0;
    const item = itemPrices[19721];
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 5 * 0.9) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Resultado: 24821 (sell × 0.85)
  const calculateItem24821Price = useCallback(() => {
    if (!itemPrices || !itemPrices[24821]) return 0;
    const item = itemPrices[24821];
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 0.85) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Suma total de ingredientes para 24289
  const calculateSumaTotalSeccion24289 = useCallback(() => {
    return calculateItem89271x4Price24289() + calculateItem24289x5Price() + calculateItem89258x3Price24289() + calculateItem19721x5Price24289();
  }, [calculateItem89271x4Price24289, calculateItem24289x5Price, calculateItem89258x3Price24289, calculateItem19721x5Price24289]);

  // Resultado final para 24289
  const calculateResultadoFinalSeccion24289 = useCallback(() => {
    const sumaTotal = calculateSumaTotalSeccion24289();
    const precio24821 = calculateItem24821Price();
    const resultadoFinal = precio24821 - sumaTotal;
    
    return resultadoFinal;
  }, [calculateSumaTotalSeccion24289, calculateItem24821Price]);

  // Función para calcular precio del item 24277 × 3 (Pile of Crystalline Dust - sell × 0.9)
  const calculateItem24277x3Price = useCallback(() => {
    if (!itemPrices || !itemPrices[24277]) return 0;
    const item = itemPrices[24277];
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 0.9 * 3) / 10000;
    
    return priceInGold;
  }, [itemPrices]);



  // Función para calcular precio del item 48917 (Toxic Tuning Crystal - sell × 0.85)
  const calculateItem48917Price = useCallback(() => {
    // Intentar primero con 48917, luego con 7839 como fallback
    let item = itemPrices?.[48917];
    
    if (!item) {
      item = itemPrices?.[7839];
    }
    
    if (!item) {
      return 0;
    }
    
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 0.85) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 48884 × 5 (Pristine Toxic Spore Sample - sell × 0.9)
  const calculateItem48884x5Price = useCallback(() => {
    if (!itemPrices || !itemPrices[48884]) return 0;
    const item = itemPrices[48884];
    const sellPrice = item.sells?.unit_price || 0;
    const priceInGold = (sellPrice * 0.9 * 5) / 10000;
    
    return priceInGold;
  }, [itemPrices]);

  // Función para calcular precio del item 46735 × 100 (Empyreal Fragment - precio 0)
  const calculateItem46735x100Price = useCallback(() => {
    // Empyreal Fragment tiene precio 0 según la información proporcionada
    return 0;
  }, []);

  // Función para calcular el RESULTADO FINAL para la quinta sección (24836 - SUMA COMPLETA)
  const calculateResultadoFinalQuintaSeccion = useCallback(() => {
    const sumaTotal = calculateItem19721x5Price() + calculateItem24300x5Price() + calculateItem89271x8Price() + calculateItem89103x2Price();
    const precio24836 = calculateItem24836Price();
    const resultadoFinal = precio24836 - sumaTotal;
    
    return resultadoFinal;
  }, [calculateItem19721x5Price, calculateItem24300x5Price, calculateItem89271x8Price, calculateItem89103x2Price, calculateItem24836Price]);

  // Función para calcular el RESULTADO FINAL CON DROPRATE para la quinta sección
  // Fórmula Excel: =SI('Crafting 2'!I36>=1,('Crafting 2'!I36/'Crafting 2'!D34)*G5,"0")
  const calculateResultadoFinalConDroprateQuintaSeccion = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalQuintaSeccion(); // Esto es I36
    const cantidadFija = 5; // Esto es D34 (número fijo x5)
    const droprate = 1.0078; // Esto es G5
    
    // Aplicar la fórmula condicional: SI(I36>=1, (I36/D34)*G5, "0")
    if (resultadoFinal >= 0) {
      const resultadoConDroprate = (resultadoFinal / cantidadFija) * droprate;
      return resultadoConDroprate;
    } else {
      return 0; // Si I36 < 1, retornar 0
    }
  }, [calculateResultadoFinalQuintaSeccion]);

  // Función para calcular el RESULTADO FINAL para la sexta sección (24806 - SUMA COMPLETA)
  const calculateResultadoFinalSextaSeccion = useCallback(() => {
    const sumaTotal = calculateItem19721x5Price() + calculateItem24283x5Price() + calculateItem89271x8Price() + calculateItem89103x2Price();
    const precio24806 = calculateItem24806Price();
    const resultadoFinal = precio24806 - sumaTotal;
    
    return resultadoFinal;
  }, [calculateItem19721x5Price, calculateItem24283x5Price, calculateItem89271x8Price, calculateItem89103x2Price, calculateItem24806Price]);

  // Función para calcular el RESULTADO FINAL CON DROPRATE para la sexta sección
  // Fórmula Excel: =SI('Crafting 2'!I43>=1,('Crafting 2'!I43/'Crafting 2'!D41)*H5,"0")
  const calculateResultadoFinalConDroprateSextaSeccion = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalSextaSeccion(); // Esto es I43
    const cantidadFija = 5; // Esto es D41 (número fijo x5)
    const droprate = 1.0078; // Esto es H5
    
    // Aplicar la fórmula condicional: SI(I43>=1, (I43/D41)*H5, "0")
    if (resultadoFinal >= 0) {
      const resultadoConDroprate = (resultadoFinal / cantidadFija) * droprate;
      return resultadoConDroprate;
    } else {
      return 0; // Si I43 < 1, retornar 0
    }
  }, [calculateResultadoFinalSextaSeccion]);

  // Función para calcular el RESULTADO FINAL para la séptima sección ((48917 × 5) - SUMA TOTAL ÷ 5)
  const calculateResultadoFinalSeptimaSeccion = useCallback(() => {
    const sumaTotal = calculateItem24277x3Price() + calculateItem48884x5Price() + calculateItem46735x100Price();
    const sumaTotalPorUnidad = sumaTotal / 5; // Dividir entre 5
    const precio48917x5 = calculateItem48917Price() * 5; // Precio unitario × 5
    const resultadoFinal = precio48917x5 - sumaTotalPorUnidad; // (48917 × 5) - (SUMA TOTAL ÷ 5)
    
    return resultadoFinal;
  }, [calculateItem24277x3Price, calculateItem48884x5Price, calculateItem46735x100Price, calculateItem48917Price]);

  // Función para calcular el RESULTADO FINAL CON DROPRATE para la séptima sección
  // Fórmula Excel: =SI('Crafting 1'!S64>=1,I5*('Crafting 1'!S64/3),"0")
  const calculateResultadoFinalConDroprateSeptimaSeccion = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalSeptimaSeccion(); // Esto es S64
    const cantidadFija = 3; // Esto es 3 (número fijo)
    const droprate = 1.0078; // Esto es I5
    
    // Aplicar la fórmula condicional: SI(S64>=1, I5*(S64/3), "0")
    if (resultadoFinal > 0) {
      const resultadoConDroprate = droprate * (resultadoFinal / cantidadFija);
      return resultadoConDroprate;
    } else {
      return 0; // Si S64 < 1, retornar 0
    }
  }, [calculateResultadoFinalSeptimaSeccion]);

  // Función para calcular la SUMA COMPLETA (Suma Total + TOTAL FINAL)
  const calculateSumaCompleta = useCallback(() => {
    const sumaTotal = calculateItem24591Price() + calculateItem19701Price() + calculateItem24295Price();
    const totalFinal = calculateTotalWithNotes();
    const sumaCompleta = sumaTotal + totalFinal;
    
    return sumaCompleta;
  }, [calculateItem24591Price, calculateItem19701Price, calculateItem24295Price, calculateTotalWithNotes]);

  // Función para calcular el RESULTADO FINAL (SUMA COMPLETA - 97535)
  const calculateResultadoFinal = useCallback(() => {
    const sumaCompleta = calculateSumaCompleta();
    const precio97535 = calculateItem97535Price();
    const resultadoFinal = precio97535 - sumaCompleta;
    
    return resultadoFinal;
  }, [calculateSumaCompleta, calculateItem97535Price]);

  // Función para calcular el RESULTADO FINAL para la tercera sección (SUMA COMPLETA - 95582)
  const calculateResultadoFinalTerceraSeccion = useCallback(() => {
    const sumaTotal = calculateItem24591Price() + calculateItem19701Price() + calculateItem24358Price();
    const totalFinal = calculateTotalWithNotes();
    const sumaCompleta = sumaTotal + totalFinal;
    const precio95582 = calculateItem95582Price();
    const resultadoFinal = precio95582 - sumaCompleta;
    
    return resultadoFinal;
  }, [calculateItem24591Price, calculateItem19701Price, calculateItem24358Price, calculateTotalWithNotes, calculateItem95582Price]);

  // Función para calcular el RESULTADO FINAL CON DROPRATE (fórmula de Excel)
  const calculateResultadoFinalConDroprate = useCallback(() => {
    const resultadoFinal = calculateResultadoFinal();
    const droprate = 1.0078; // VM-UM'!B5
    
    // Fórmula de Excel: =SI('Crafting 3'!S36>=1,('VM-UM'!B5*('Crafting 3'!S36)),"0")
    let resultadoConDroprate = 0;
    
    if (resultadoFinal >= 1) {
      resultadoConDroprate = droprate * resultadoFinal;
    } else {
    }
    
    return resultadoConDroprate;
  }, [calculateResultadoFinal]);

  // Función para calcular el RESULTADO FINAL CON DROPRATE para la tercera sección (fórmula específica)
  const calculateResultadoFinalConDroprateTerceraSeccion = useCallback(() => {
    // Calcular el resultado final de la tercera sección (con 24358)
    const sumaTotal = calculateItem24591Price() + calculateItem19701Price() + calculateItem24358Price();
    const totalFinal = calculateTotalWithNotes();
    const sumaCompleta = sumaTotal + totalFinal;
    const precio95582 = calculateItem95582Price();
    const resultadoFinal = precio95582 - sumaCompleta; // Esto es I50
    
    // D49 es la cantidad del item 24358, que es 1
    const cantidad24358 = 1;
    
    // VM-UM'!C5 (droprate específico para esta sección)
    const droprateC5 = 1.0078; // Ajustar este valor según corresponda
    
    // Fórmula: =SI(I50>=1,(I50/D49)*C5,"0")
    let resultadoConDroprate = 0;
    
    if (resultadoFinal >= 1) {
      resultadoConDroprate = (resultadoFinal / cantidad24358) * droprateC5;
    } else {
      resultadoConDroprate = 0;
    }
    
    return resultadoConDroprate;
  }, [calculateItem24591Price, calculateItem19701Price, calculateItem24358Price, calculateTotalWithNotes, calculateItem95582Price]);

  // Función para calcular el RESULTADO FINAL para la cuarta sección (SUMA COMPLETA - 19912)
  const calculateResultadoFinalCuartaSeccion = useCallback(() => {
    const sumaTotal = calculateItem19721x5Price() + calculateItem24351Price() + calculateGossamerPatchCraftingPrice();
    const precio19912 = calculateItem19912Price();
    const resultadoFinal = precio19912 - sumaTotal;
    
    return resultadoFinal;
  }, [calculateItem19721x5Price, calculateItem24351Price, calculateGossamerPatchCraftingPrice, calculateItem19912Price]);

  // Función para calcular el RESULTADO FINAL CON DROPRATE para la cuarta sección
  const calculateResultadoFinalConDroprateCuartaSeccion = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalCuartaSeccion(); // Esto es I92
    const cantidadFija = 5; // Esto es D90 (número fijo x5)
    const droprate = 1.0078;
    
    let resultadoConDroprate = 0;
    if (resultadoFinal >= 0) {
      resultadoConDroprate = (resultadoFinal / cantidadFija) * droprate;
    } else {
    }
    
    return resultadoConDroprate;
  }, [calculateResultadoFinalCuartaSeccion]);

  // IDs de items para Magia Liberada (LS3) - Solo raros por ahora
  const trofeosRarosUMIds = useMemo(() => [24295, 24358, 24351, 24357, 24289, 24300, 24283, 24277], []); // Mismos T6

  // Función para calcular la suma total de ProfitMax de todas las secciones
  const calculateTotalProfitMax = useCallback(() => {
    // ProfitMax de Raros (primera columna)
    const profitMaxRaros = calculateResultadoFinalConDroprate();
    
    // ProfitMax de Comunes (valores fijos de la tabla - por ahora 0 hasta que se implementen cálculos dinámicos)    
    // ProfitMax de la Tercera Sección (nuevo cálculo)
    const profitMaxTerceraSeccion = calculateResultadoFinalConDroprateTerceraSeccion();
    
    // ProfitMax de la Cuarta Sección (nuevo cálculo)
    const profitMaxCuartaSeccion = calculateResultadoFinalConDroprateCuartaSeccion();
    
    // ProfitMax de la Quinta Sección (nuevo cálculo)
    const profitMaxQuintaSeccion = calculateResultadoFinalConDroprateQuintaSeccion();
    
    // ProfitMax de la Sexta Sección (nuevo cálculo)
    const profitMaxSextaSeccion = calculateResultadoFinalConDroprateSextaSeccion();
    
    // ProfitMax de la Séptima Sección (nuevo cálculo)
    const profitMaxSeptimaSeccion = calculateResultadoFinalConDroprateSeptimaSeccion();
    
    // Valor de Total Caja (trofeos raros + comunes)
    const totalCaja = calculateTableTotal(trofeosRarosIds, 1.0078) + calculateTableTotal(trofeosComunesIds, 4.99, true);
    
    const totalProfitMax = profitMaxRaros  + profitMaxTerceraSeccion + profitMaxCuartaSeccion + profitMaxQuintaSeccion + profitMaxSextaSeccion + profitMaxSeptimaSeccion + totalCaja;
  
    return totalProfitMax;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculateResultadoFinalConDroprate, calculateResultadoFinalConDroprateTerceraSeccion, calculateResultadoFinalConDroprateCuartaSeccion, calculateResultadoFinalConDroprateQuintaSeccion, calculateResultadoFinalConDroprateSextaSeccion, calculateResultadoFinalConDroprateSeptimaSeccion]);

  // Función para obtener precios de los items de las tablas
  const fetchTableItemPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    try {
      // Dividir en lotes más pequeños para evitar errores de API
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < tableItemIds.length; i += batchSize) {
        batches.push(tableItemIds.slice(i, i + batchSize));
      }
      
      const allPrices: Record<number, Gw2Price> = {};
      
      for (const batch of batches) {
        try {
          const pricesResponse = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${batch.join(',')}`, {
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate, br'
            }
          });
          
          if (!pricesResponse.ok) {
            // Error fetching prices batch, skipping
            continue;
          }
          
          const prices = await pricesResponse.json();
          
          if (Array.isArray(prices)) {
            prices.forEach((price: Gw2Price) => {
              if (price && price.id) {
                allPrices[price.id] = price;
              }
            });
          }
        } catch {
          // Error fetching prices batch, skipping
          continue;
        }
      }
      
      setItemPrices(allPrices);
      setLastPriceUpdate(new Date());
      
    } catch {
      // Error fetching table item prices
    } finally {
      setIsLoadingPrices(false);
    }
    
  }, [tableItemIds]);

  // Función para obtener nombres de los items de las tablas con caché
  const fetchTableItemNames = useCallback(async () => {
    try {
      const allNames: Record<number, string> = {};
      const allIcons: Record<number, string> = {};
      const itemsToFetch: number[] = [];
      
      // Verificar caché primero
      tableItemIds.forEach(itemId => {
        const cached = ItemCache.get(itemId);
        if (cached && cached.names[lang]) {
          allNames[itemId] = cached.names[lang];
          allIcons[itemId] = cached.icon;
        } else {
          itemsToFetch.push(itemId);
        }
      });
      
      // Si no hay items que buscar, solo actualizar estados
      if (itemsToFetch.length === 0) {
        setTableItemNames(allNames);
        setTableItemIcons(allIcons);
        return;
      }
      
      // Fetch de items que no están en caché, con los 4 idiomas
      const languages = ['en', 'es', 'de', 'fr'];
      const batchSize = 25;
      const batches = [];
      for (let i = 0; i < itemsToFetch.length; i += batchSize) {
        batches.push(itemsToFetch.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        const langPromises = languages.map(async (language) => {
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              const itemsResponse = await fetch(`https://api.guildwars2.com/v2/items?ids=${batch.join(',')}&lang=${language}`, {
                headers: {
                  'Accept': 'application/json',
                  'Accept-Encoding': 'gzip, deflate, br'
                }
              });
              
              if (!itemsResponse.ok) {
                throw new Error(`HTTP ${itemsResponse.status}`);
              }
              
              const items = await itemsResponse.json();
              return { language, items };
            } catch (batchError) {
              retryCount++;
              if (retryCount >= maxRetries) {
                console.warn(`Error fetching batch after ${maxRetries} retries:`, batchError);
                return { language, items: [] };
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
          return { language, items: [] };
        });
        
        const results = await Promise.all(langPromises);
        
        // Organizar datos por itemId
        const itemDataMap: Record<number, { names: Record<string, string>; icon: string }> = {};
        
        results.forEach(({ language, items }) => {
          if (Array.isArray(items)) {
            items.forEach((item: Gw2Item) => {
              if (item && item.id && item.name) {
                if (!itemDataMap[item.id]) {
                  itemDataMap[item.id] = { names: {}, icon: item.icon || '' };
                }
                itemDataMap[item.id].names[language] = item.name;
                if (item.icon) {
                  itemDataMap[item.id].icon = item.icon;
                }
              }
            });
          }
        });
        
        // Guardar en caché y actualizar estados
        Object.entries(itemDataMap).forEach(([itemIdStr, data]) => {
          const itemId = parseInt(itemIdStr);
          ItemCache.set(itemId, {
            names: data.names,
            icon: data.icon,
            timestamp: Date.now()
          });
          
          if (data.names[lang]) {
            allNames[itemId] = data.names[lang];
            allIcons[itemId] = data.icon;
          }
        });
      }
      
      setTableItemNames(allNames);
      setTableItemIcons(allIcons);
    } catch (error) {
      console.error('Error fetching table item names:', error);
    }
  }, [tableItemIds, lang]);

  // Cargar precios y nombres de los items de las tablas al montar el componente y cada 5 minutosd
  useEffect(() => {
    // Cargar precios y nombres inmediatamente al montar
    fetchTableItemPrices();
    fetchTableItemNames();
    
    // Actualizar precios y nombres cada 5 minutos
    const interval = setInterval(() => {
      fetchTableItemPrices();
      fetchTableItemNames();
    }, 5 * 60 * 1000); // 5 minutos = 300,000 ms
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, [fetchTableItemPrices, fetchTableItemNames]);

  // IDs de items por tabla
  const trofeosRarosIds = useMemo(() => [24295, 24358, 24351, 24357, 24289, 24300, 24283, 24277], []);
  const trofeosComunesIds = useMemo(() => [24294, 24341, 24350, 24356, 24288, 24299, 24282, 24276], []);

  // Función para calcular precio base: sell * 0.9 * droprate (para trofeos raros)
  const calculateBasePrice = useCallback((itemId: number, droprate: number) => {
    const price = itemPrices[itemId];
    if (!price || !price.sells || !price.sells.unit_price) {
      // Para items que no tienen precio de mercado, usar precio fijo
      if (itemId === 19675) { // Mystic Clover
        return 2530 / 10000; // 00G 25S 30C convertido a oro
      }
      return 0;
    }
    
    // sell * 0.9 * droprate (convertir de cobre a oro)
    const basePrice = (price.sells.unit_price * 0.9 * droprate) / 10000; // 10000 cobre = 1 oro
    return basePrice;
  }, [itemPrices]);

  // Función para calcular precio base: sell * 0.9 * droprate (para trofeos comunes)
  const calculateBasePriceComunes = useCallback((itemId: number, droprate: number) => {
    const price = itemPrices[itemId];
    if (!price || !price.sells || !price.sells.unit_price) return 0;
    
    // sell * 0.9 * droprate (convertir de cobre a oro)
    const basePrice = (price.sells.unit_price * 0.9 * droprate) / 10000; // 10000 cobre = 1 oro
    return basePrice;
  }, [itemPrices]);


  // Función para obtener droprates específicos de Magia Liberada
  const getUMDroprate = useCallback((itemId: number) => {
    const droprates: Record<number, number> = {
      24295: 0.436,   // Vial of Powerful Blood
      24358: 0.436,   // Ancient Bone
      24351: 0.436,   // Vicious Claw
      24357: 0.436,   // Vicious Fang
      24289: 0.436,   // Armored Scale
      24300: 0.436,   // Elaborate Totem
      24283: 0.436,   // Powerful Venom Sac
      24277: 0.436,   // Pile of Crystalline Dust
      19721: 0.2375,  // Glob of Ectoplasm
      24370: 0.01625, // Giant Eye
      68063: 0.04125, // Amalgamated Gemstone
      76179: 0.01625, // Freshwater Pearl
      70957: 0.01625, // Maguuma Lily
      19675: 0.0375, // Mystic Clover
      37897: 0.6,     // Karka Shell
      48884: 0.5,     // Pristine Toxic Spore Sample
      74978: 0.063125, // Item 74978
      24305: 0.063125, // Charged Lodestone
      24310: 0.063125, // Onyx Lodestone
      24315: 0.063125, // Molten Lodestone
      24320: 0.063125, // Glacial Lodestone
      24325: 0.063125, // Destroyer Lodestone
      24330: 0.063125, // Crystal Lodestone
      70842: 0.063125, // Mordrem Lodestone
      68942: 0.063125, // Evergreen Lodestone
      24335: 0.1025,   // Pile of Putrid Essence
      72504: 0.01625,  // Moonstone Orb
      76491: 0.01625,  // Black Diamond
      75654: 0.01625,  // Ebony Orb
      72315: 0.01625,  // Maguuma Burl
      74988: 0.01625   // Flax Blossom
    };
    
    return droprates[itemId] || 0;
  }, []);

  // Funciones para calcular ProfitMax individuales de trofeos raros de Magia Liberada
  const calculateUMProfitMax24295 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinal();
    const droprate = 0.436;
    const cantidad = 1;
    return resultadoFinal >= 1 ? (resultadoFinal / cantidad) * droprate : 0;
  }, [calculateResultadoFinal]);

  const calculateUMProfitMax24358 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalTerceraSeccion();
    const droprate = 0.436;
    const cantidad = 1;
    return resultadoFinal >= 1 ? (resultadoFinal / cantidad) * droprate : 0;
  }, [calculateResultadoFinalTerceraSeccion]);

  const calculateUMProfitMax24351 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalCuartaSeccion();
    const droprate = 0.436;
    const cantidad = 5;
    return resultadoFinal >= 0 ? (resultadoFinal / cantidad) * droprate : 0;
  }, [calculateResultadoFinalCuartaSeccion]);

  const calculateUMProfitMax24357 = useCallback(() => {
    // Cálculo directo para evitar problemas de scope
    const price89271 = itemPrices[89271];
    const price24357 = itemPrices[24357];
    const price89216 = itemPrices[89216];
    const price19721 = itemPrices[19721];
    const price24815 = itemPrices[24815];
    
    if (!price89271 || !price24357 || !price89216 || !price19721 || !price24815) return 0;
    
    // Calcular ingredientes
    const item89271x12 = (price89271.buys.unit_price * 12) / 10000; // buy * 12
    const item24357x5 = (price24357.buys.unit_price * 5) / 10000; // buy * 5
    const item89216x1 = (price89216.buys.unit_price * 1) / 10000; // buy * 1
    const item19721x5 = (price19721.sells.unit_price * 5 * 0.9) / 10000; // sell * 5 * 0.9
    
    // Calcular suma total
    const sumaTotal = item89271x12 + item24357x5 + item89216x1 + item19721x5;
    
    // Calcular item resultado
    const item24815 = (price24815.sells.unit_price * 0.85) / 10000; // sell * 0.85
    
    // Calcular resultado final
    const resultadoFinal = item24815 - sumaTotal;
    
    // Aplicar nueva fórmula de droprate: SI(S57>=1, (S57/N55)*0.436, "0")
    // S57 = resultadoFinal, N55 = 5 (multiplicador)
    if (resultadoFinal >= 0) {
      return (resultadoFinal / 5) * 0.436;
    } else {
      return 0;
    }
  }, [itemPrices]);

  // Función para calcular el VMProfitMax del item 24357 (Colmillo feroz) para VM
  const calculateVMProfitMax24357 = useCallback(() => {
    // Cálculo directo para evitar problemas de scope (igual que UM pero con droprate VM)
    const price89271 = itemPrices[89271];
    const price24357 = itemPrices[24357];
    const price89216 = itemPrices[89216];
    const price19721 = itemPrices[19721];
    const price24815 = itemPrices[24815];
    
    if (!price89271 || !price24357 || !price89216 || !price19721 || !price24815) return 0;
    
    // Calcular ingredientes
    const item89271x12 = (price89271.buys.unit_price * 12) / 10000; // buy * 12
    const item24357x5 = (price24357.buys.unit_price * 5) / 10000; // buy * 5
    const item89216x1 = (price89216.buys.unit_price * 1) / 10000; // buy * 1
    const item19721x5 = (price19721.sells.unit_price * 5 * 0.9) / 10000; // sell * 5 * 0.9
    
    // Calcular suma total
    const sumaTotal = item89271x12 + item24357x5 + item89216x1 + item19721x5;
    
    // Calcular item resultado
    const item24815 = (price24815.sells.unit_price * 0.85) / 10000; // sell * 0.85
    
    // Calcular resultado final
    const resultadoFinal = item24815 - sumaTotal;
    
    // Aplicar fórmula de droprate para VM: SI(S57>=0, (S57/5)*1.0078, "0")
    // S57 = resultadoFinal, N55 = 5 (multiplicador), droprate VM = 1.0078
    if (resultadoFinal >= 1) {
      return (resultadoFinal / 5) * 1.0078;
    } else {
      return 0;
    }
  }, [itemPrices]);

  // Función para calcular ProfitMax específicos de VM (Volatile Magic)
  const calculateVMProfitMax24289 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalSeccion24289(); // I22
    const cantidadFija = 5; // D20
    const droprate = 1.0078; // F5 (droprate de VM)
    
    // Aplicar la fórmula condicional: SI(I22>=1, (I22/D20)*F5, "0")
    if (resultadoFinal >= 1) {
      const resultadoConDroprate = (resultadoFinal / cantidadFija) * droprate;
      return resultadoConDroprate;
    } else {
      return 0; // Si I22 < 1, retornar 0
    }
  }, [calculateResultadoFinalSeccion24289]);

  // Función no usada actualmente - comentada
  // const calculateVMProfitMax = useCallback((itemId: number) => {
  //   // Para el item 24357, usar el cálculo dinámico específico para VM
  //   if (itemId === 24357) {
  //     return calculateVMProfitMax24357();
  //   }
  //   
  //   // Para el item 24289, usar el cálculo dinámico específico para VM
  //   if (itemId === 24289) {
  //     return calculateVMProfitMax24289();
  //   }
  //   
  //   // Para otros items, usar el precio base con droprate de VM
  //   const droprate = 1.0078; // Droprate estándar de VM
  //   return calculateBasePrice(itemId, droprate);
  // }, [calculateVMProfitMax24357, calculateVMProfitMax24289, calculateBasePrice]);

  const calculateUMProfitMax24289 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalSeccion24289(); // I22
    const cantidadFija = 5; // D20
    const droprate = 0.436; // F5
    
    // Aplicar la fórmula condicional: SI(I22>=1, (I22/D20)*F5, "0")
    if (resultadoFinal >= 1) {
      const resultadoConDroprate = (resultadoFinal / cantidadFija) * droprate;
      return resultadoConDroprate;
    } else {
      return 0; // Si I22 < 1, retornar 0
    }
  }, [calculateResultadoFinalSeccion24289]);

  const calculateUMProfitMax24300 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalQuintaSeccion(); // Esto es I36
    const cantidadFija = 5 // Esto es D34 (número fijo x8)
    const droprate = 0.436; // Droprate para magia liberada
    
    // Aplicar la fórmula condicional: SI(I36>=1, (I36/D34)*0.496, "0")
    if (resultadoFinal >=0) {
      const resultadoConDroprate = (resultadoFinal / cantidadFija) * droprate;
      return resultadoConDroprate;
    } else {
      return 0; // Si I36 < 1, retornar 0
    }
  }, [calculateResultadoFinalQuintaSeccion]);

  const calculateUMProfitMax24283 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalSextaSeccion(); // Esto es I43
    const cantidadFija = 5; // Esto es D41 (número fijo x5)
    const droprate = 0.436; // Droprate para magia liberada
    
    // Aplicar la fórmula condicional: SI(I43>=1, (I43/D41)*0.436, "0")
    if (resultadoFinal >= 0) {
      const resultadoConDroprate = (resultadoFinal / cantidadFija) * droprate;
      return resultadoConDroprate;
    }
  }, [calculateResultadoFinalSextaSeccion]);

  const calculateUMProfitMax24277 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalSeptimaSeccion();
    const droprate = 0.436;
    const cantidad = 3;
    return resultadoFinal >= 0 ? (resultadoFinal / cantidad) * droprate : 0;
  }, [calculateResultadoFinalSeptimaSeccion]);

  // Función no usada actualmente - comentada
  // const calculateVMProfitMax76179 = useCallback(() => {
  //   const resultadoFinal = calculateResultadoFinalQuintaSeccion();
  //   const droprate = 0.01625;
  //   const cantidadFija = 5;
  //   
  //   if (resultadoFinal >= 1) {
  //     const resultadoConDroprate = (resultadoFinal / cantidadFija) * droprate;
  //     return resultadoConDroprate;
  //   } else {
  //     return 0;
  //   }
  // }, [calculateResultadoFinalQuintaSeccion]);

  // Funciones para calcular precios de items específicos para Freshwater Pearl (76179)
  const calculateItem89271x48Price = useCallback(() => {
    const price = itemPrices[89271];
    if (!price) return 0;
    return (price.buys.unit_price * 48) / 10000; // 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem76179x3Price = useCallback(() => {
    const price = itemPrices[76179];
    if (!price) return 0;
    return (price.buys.unit_price * 3) / 10000; // buy * 3, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem70957x3Price = useCallback(() => {
    const price = itemPrices[70957];
    if (!price) return 0;
    return (price.buys.unit_price * 3) / 10000; // buy * 3, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem89103x3Price = useCallback(() => {
    const price = itemPrices[89103];
    if (!price) return 0;
    return (price.buys.unit_price * 3) / 10000; // 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem19721x15Price = useCallback(() => {
    const price = itemPrices[19721];
    if (!price) return 0;
    return (price.sells.unit_price * 0.9 * 15) / 10000; // sell * 0.9, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem99965Price = useCallback(() => {
    const price = itemPrices[99965];
    if (!price) return 0;
    return (price.sells.unit_price * 0.85) / 10000; // sell * 0.85, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem100693Price = useCallback(() => {
    const price = itemPrices[100693];
    if (!price) return 0;
    return (price.sells.unit_price * 0.85) / 10000; // sell * 0.85, 10000 cobre = 1 oro
  }, [itemPrices]);

  // Funciones para el nuevo item 48911
  const calculateItem89271x15Price = useCallback(() => {
    const price = itemPrices[89271];
    if (!price) return 0;
    return (price.buys.unit_price * 15) / 10000; // buy * 15, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem48884x100Price = useCallback(() => {
    const price = itemPrices[48884];
    if (!price) return 0;
    return (price.buys.unit_price * 100) / 10000; // buy * 100, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem89182x1Price = useCallback(() => {
    const price = itemPrices[89182];
    if (!price) return 0;
    return (price.buys.unit_price * 1) / 10000; // buy * 1, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem19721x10Price = useCallback(() => {
    const price = itemPrices[19721];
    if (!price) return 0;
    return (price.sells.unit_price * 0.9 * 10) / 10000; // sell * 0.9 * 10, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem24824Price = useCallback(() => {
    const price = itemPrices[24824];
    if (!price) return 0;
    return (price.sells.unit_price * 0.85) / 10000; // sell * 0.85, 10000 cobre = 1 oro
  }, [itemPrices]);

  // Función para Runa de guardian y runa de cazadragones
  const calculateItem24305x1Price = useCallback(() => {
    const price = itemPrices[24305];
    if (!price) return 0;
    return (price.sells.unit_price * 0.9 * 1) / 10000; // sell * 0.9 * 1, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem89271x12Price = useCallback(() => {
    const price = itemPrices[89271];
    if (!price) return 0;
    return (price.buys.unit_price * 12) / 10000; // buy * 12, 10000 cobre = 1 oro
  }, [itemPrices]);

  // Funciones para Nueva Sección 24357 - no usadas actualmente
  // const calculateItem24357x5Price = useCallback(() => {
  //   const price = itemPrices[24357];
  //   if (!price) return 0;
  //   return (price.buys.unit_price * 5) / 10000;
  // }, [itemPrices]);

  // const calculateItem89216x1Price24357 = useCallback(() => {
  //   const price = itemPrices[89216];
  //   if (!price) return 0;
  //   return (price.buys.unit_price * 1) / 10000;
  // }, [itemPrices]);

  // const calculateItem19721x5Price24357 = useCallback(() => {
  //   const price = itemPrices[19721];
  //   if (!price) return 0;
  //   return (price.sells.unit_price * 5 * 0.9) / 10000;
  // }, [itemPrices]);

  // Funciones no usadas actualmente - comentadas
  // const calculateItem24815Price = useCallback(() => {
  //   const price = itemPrices[24815];
  //   if (!price) return 0;
  //   return (price.sells.unit_price * 0.85) / 10000;
  // }, [itemPrices]);

  // const calculateSumaTotalSeccion24357 = useCallback(() => {
  //   return calculateItem89271x12Price() + calculateItem24357x5Price() + calculateItem89216x1Price24357() + calculateItem19721x5Price24357();
  // }, [calculateItem89271x12Price, calculateItem24357x5Price, calculateItem89216x1Price24357, calculateItem19721x5Price24357]);

  // const calculateResultadoFinalSeccion24357 = useCallback(() => {
  //   return calculateItem24815Price() - calculateSumaTotalSeccion24357();
  // }, [calculateItem24815Price, calculateSumaTotalSeccion24357]);

  // Función no usada actualmente - comentada
  // const calculateResultadoFinalConDroprateSeccion24357 = useCallback(() => {
  //   const resultadoFinal = calculateResultadoFinalSeccion24357();
  //   const droprate = 0.436;
  //   
  //   if (resultadoFinal >= 1) {
  //     return droprate * resultadoFinal;
  //   } else {
  //     return 0;
  //   }
  // }, [calculateResultadoFinalSeccion24357]);


  const calculateItem89258x1Price = useCallback(() => {
    const price = itemPrices[89258];
    if (!price) return 0;
    return (price.sells.unit_price * 0.9 * 1) / 10000; // sell * 0.9 * 1, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem68942x1Price = useCallback(() => {
    const price = itemPrices[68942];
    if (!price) return 0;
    return (price.buys.unit_price * 1) / 10000; // buy * 1, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem89271x5Price = useCallback(() => {
    const price = itemPrices[89271];
    if (!price) return 0;
    return (price.buys.unit_price * 5) / 10000; // buy * 5, 10000 cobre = 1 oro
  }, [itemPrices]);

  // Función para calcular precio del item 89271 × 10 (buy)
  const calculateItem89271x10Price = useCallback(() => {
    const price = itemPrices[89271];
    if (!price) return 0;
    return (price.buys.unit_price * 10) / 10000; // buy * 10, 10000 cobre = 1 oro
  }, [itemPrices]);

  // Función para calcular precio del item 24315 × 1 (buy)
  const calculateItem24315x1Price = useCallback(() => {
    const price = itemPrices[24315];
    if (!price) return 0;
    return (price.buys.unit_price * 1) / 10000; // buy * 1, 10000 cobre = 1 oro
  }, [itemPrices]);

  // Función para calcular precio del item 89182 × 2 (buy)
  const calculateItem89182x2Price = useCallback(() => {
    const price = itemPrices[89182];
    if (!price) return 0;
    return (price.buys.unit_price * 2) / 10000; // buy * 2, 10000 cobre = 1 oro
  }, [itemPrices]);

  // Función para calcular suma total de ingredientes de la nueva sección
  const calculateSumaTotalNuevaSeccion = useCallback(() => {
    return calculateItem89271x10Price() + calculateItem24315x1Price() + calculateItem89182x2Price() + calculateItem19721x10Price();
  }, [calculateItem89271x10Price, calculateItem24315x1Price, calculateItem89182x2Price, calculateItem19721x10Price]);

  // Función para calcular precio del item 24609 (sell × 0.85)
  const calculateItem24609Price = useCallback(() => {
    const price = itemPrices[24609];
    if (!price) return 0;
    return (price.sells.unit_price * 0.85) / 10000; // sell * 0.85, 10000 cobre = 1 oro
  }, [itemPrices]);

  // Función para calcular resultado final de la nueva sección
  const calculateResultadoFinalNuevaSeccion = useCallback(() => {
    return calculateItem24609Price() - calculateSumaTotalNuevaSeccion();
  }, [calculateItem24609Price, calculateSumaTotalNuevaSeccion]);



  // Función no usada actualmente - comentada
  // const calculateItem74202x10Price = useCallback(() => {
  //   const price = itemPrices[74202];
  //   if (!price) return 0;
  //   return (price.sells.unit_price * 10) / 10000;
  // }, [itemPrices]);

  const calculateItem24310x1Price = useCallback(() => {
    const price = itemPrices[24310];
    if (!price) return 0;
    return (price.sells.unit_price * 0.9 * 1) / 10000; // sell * 0.9 * 1, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem89182x3Price = useCallback(() => {
    const price = itemPrices[89182];
    if (!price) return 0;
    return (price.buys.unit_price * 3) / 10000; // buy * 3, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem74978Price = useCallback(() => {
    const price = itemPrices[74978];
    if (!price) return 0;
    return (price.sells.unit_price * 0.85) / 10000; // sell * 0.85, 10000 cobre = 1 oro
  }, [itemPrices]);

  const calculateItem24868Price = useCallback(() => {
    const price = itemPrices[24868];
    if (!price) return 0;
    return (price.sells.unit_price * 0.85) / 10000; // sell * 0.85, 10000 cobre = 1 oro
  }, [itemPrices]);

  // Función para calcular el RESULTADO FINAL CON DROPRATE para el item 24868
  const calculateResultadoFinalConDroprate24868 = useCallback(() => {
    const resultadoFinal = calculateItem24868Price() - (calculateItem89271x5Price() + calculateItem24310x1Price() + calculateItem89182x3Price() + calculateItem19721x10Price());
    const droprate = 0.063125; // C36 = 0.063125

    // Aplicar la fórmula condicional: SI(I15>=1, (C36*I15), "0")
    if (resultadoFinal >= 1) {
      const resultadoConDroprate = droprate * resultadoFinal;
      return resultadoConDroprate;
    } else {
      return 0; // Si I15 < 1, retornar 0
    }
  }, [calculateItem24868Price, calculateItem89271x5Price, calculateItem24310x1Price, calculateItem89182x3Price, calculateItem19721x10Price]);

  // Función para calcular el RESULTADO FINAL CON DROPRATE para el item 74978
  const calculateResultadoFinalConDroprate74978 = useCallback(() => {
    const resultadoFinal = calculateItem74978Price() - (calculateItem68942x1Price() + calculateItem24310x1Price() + calculateItem89271x5Price() + calculateItem89182x3Price() + calculateItem24305x1Price() + calculateItem89258x1Price() + calculateItem19721x5Price());
    const droprate = 0.063125; // 0.063125

    // Aplicar la fórmula condicional: SI(S64>=1, S64*0.063125, "0")
    if (resultadoFinal >= 0) {
      const resultadoConDroprate = resultadoFinal * droprate;
      return resultadoConDroprate;
    } else {
      return 0; // Si S64 < 1, retornar 0
    }
  }, [calculateItem74978Price, calculateItem68942x1Price, calculateItem24310x1Price, calculateItem89271x5Price, calculateItem89182x3Price, calculateItem24305x1Price, calculateItem89258x1Price, calculateItem19721x5Price]);


  // Función para calcular el RESULTADO FINAL de Freshwater Pearl (76179)
  const calculateResultadoFinal76179 = useCallback(() => {
    const sumaTotal = calculateItem89271x48Price() + calculateItem76179x3Price() + calculateItem89103x3Price() + calculateItem19721x15Price();
    const precio99965 = calculateItem99965Price();
    return precio99965 - sumaTotal;
  }, [calculateItem89271x48Price, calculateItem76179x3Price, calculateItem89103x3Price, calculateItem19721x15Price, calculateItem99965Price]);

  // Función para calcular el RESULTADO FINAL de Maguuma Lily (70957)
  const calculateResultadoFinal70957 = useCallback(() => {
    const sumaTotal = calculateItem89271x48Price() + calculateItem70957x3Price() + calculateItem89103x3Price() + calculateItem19721x15Price();
    const precio100693 = calculateItem100693Price();
    return precio100693 - sumaTotal;
  }, [calculateItem89271x48Price, calculateItem70957x3Price, calculateItem89103x3Price, calculateItem19721x15Price, calculateItem100693Price]);

  // Función para calcular el RESULTADO FINAL del nuevo item 24824
  const calculateResultadoFinal24824 = useCallback(() => {
    const sumaTotal = calculateItem89271x12Price() + calculateItem24305x1Price() + calculateItem89258x1Price() + calculateItem19721x5Price();
    const precio24824 = calculateItem24824Price();
    return precio24824 - sumaTotal;
  }, [calculateItem89271x12Price, calculateItem24305x1Price, calculateItem89258x1Price, calculateItem19721x5Price, calculateItem24824Price]);

  // Función para calcular el RESULTADO FINAL CON DROPRATE para Freshwater Pearl (76179)
  const calculateResultadoFinalConDroprate76179 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinal76179(); // S29
    const cantidadFija = 3; // N27
    const droprate = 0.01625; // E30

    // Aplicar la fórmula condicional: SI(S29>=1, (S29/N27)*E30, "0")
    if (resultadoFinal >= 1) {
      const resultadoConDroprate = (resultadoFinal / cantidadFija) * droprate;
      return resultadoConDroprate;
    } else {
      return 0; // Si S29 < 1, retornar 0
    }
  }, [calculateResultadoFinal76179]);

  // Función para calcular el RESULTADO FINAL CON DROPRATE para Maguuma Lily (70957)
  const calculateResultadoFinalConDroprate70957 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinal70957(); // I22
    const cantidadFija = 3; // D20
    const droprate = 0.01625; // F30

    // Aplicar la fórmula condicional: SI(I22>=1, (I22/D20)*F30, "0")
    if (resultadoFinal >= 1) {
      const resultadoConDroprate = (resultadoFinal / cantidadFija) * droprate;
      return resultadoConDroprate;
    } else {
      return 0; // Si I22 < 1, retornar 0
    }
  }, [calculateResultadoFinal70957]);

  // Función para calcular el RESULTADO FINAL CON DROPRATE para el nuevo item 24824
  const calculateResultadoFinalConDroprate24824 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinal24824(); // S8 = RESULTADO FINAL
    const droprate = 0.5; // I30 = 0.5

    // Aplicar la fórmula condicional: SI(S8>=1, I30*(S8/100), "0")
    if (resultadoFinal >= 0) {
      const resultadoConDroprate = droprate * (resultadoFinal / 100);
      return resultadoConDroprate;
    } else {
      return 0; // Si S8 < 1, retornar 0
    }
  }, [calculateResultadoFinal24824]);

     // Función para calcular resultado final con droprate de la nueva sección
     const calculateResultadoFinalConDroprateNuevaSeccion = useCallback(() => {
       const resultadoFinal = calculateResultadoFinalNuevaSeccion(); // S15
       const droprate = 0.063125; // D36 = 0.063125
       
       // Aplicar la fórmula condicional: SI(S15>=1, (S15*D36), "0")
       if (resultadoFinal >= 0) {
         return resultadoFinal * droprate;
       } else {
         return 0;
       }
     }, [calculateResultadoFinalNuevaSeccion]);

  // Funciones para la Sección Rápida
  const calculateItem89271x4Price = useCallback(() => {
    const price = itemPrices[89271];
    if (!price) return 0;
    return (price.buys.unit_price * 4) / 10000; // buy * 4
  }, [itemPrices]);

  const calculateItem24320x1Price = useCallback(() => {
    const price = itemPrices[24320];
    if (!price) return 0;
    return (price.buys.unit_price * 1) / 10000; // buy * 1
  }, [itemPrices]);

  const calculateItem89216x3Price = useCallback(() => {
    const price = itemPrices[89216];
    if (!price) return 0;
    return (price.buys.unit_price * 3) / 10000; // buy * 3
  }, [itemPrices]);

  const calculateItem24839Price = useCallback(() => {
    const price = itemPrices[24839];
    if (!price) return 0;
    return (price.sells.unit_price * 0.85) / 10000; // sell * 0.85
  }, [itemPrices]);

  const calculateSumaTotalSeccionRapida = useCallback(() => {
    return calculateItem89271x4Price() + calculateItem24320x1Price() + calculateItem89216x3Price() + calculateItem19721x5Price();
  }, [calculateItem89271x4Price, calculateItem24320x1Price, calculateItem89216x3Price, calculateItem19721x5Price]);

  const calculateResultadoFinalSeccionRapida = useCallback(() => {
    return calculateItem24839Price() - calculateSumaTotalSeccionRapida();
  }, [calculateItem24839Price, calculateSumaTotalSeccionRapida]);

  const calculateResultadoFinalConDroprateSeccionRapida = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalSeccionRapida(); // I64
    const droprate = 0.063125; // Droprate fijo
    
    // Aplicar la fórmula condicional: SI(I64>=1, I64*0.063125, "0")
    if (resultadoFinal >= 1) {
      return resultadoFinal * droprate;
    } else {
      return 0;
    }
  }, [calculateResultadoFinalSeccionRapida]);

  // Funciones para la Nueva Sección 2
  const calculateItem24325x1Price = useCallback(() => {
    const price = itemPrices[24325];
    if (!price) return 0;
    return (price.buys.unit_price * 1) / 10000; // buy * 1
  }, [itemPrices]);

  const calculateItem89103x1Price = useCallback(() => {
    const price = itemPrices[89103];
    if (!price) return 0;
    return (price.buys.unit_price * 1) / 10000; // buy * 1
  }, [itemPrices]);

  const calculateItem19721x5Price2 = useCallback(() => {
    const price = itemPrices[19721];
    if (!price) return 0;
    return (price.sells.unit_price * 0.9 * 5) / 10000; // sell * 0.9 * 5
  }, [itemPrices]);

  const calculateItem24800Price = useCallback(() => {
    const price = itemPrices[24800];
    if (!price) return 0;
    return (price.sells.unit_price * 0.85) / 10000; // sell * 0.85
  }, [itemPrices]);

  const calculateSumaTotalNuevaSeccion2 = useCallback(() => {
    return calculateItem89271x12Price() + calculateItem24325x1Price() + calculateItem89103x1Price() + calculateItem19721x5Price2();
  }, [calculateItem89271x12Price, calculateItem24325x1Price, calculateItem89103x1Price, calculateItem19721x5Price2]);

  const calculateResultadoFinalNuevaSeccion2 = useCallback(() => {
    return calculateItem24800Price() - calculateSumaTotalNuevaSeccion2();
  }, [calculateItem24800Price, calculateSumaTotalNuevaSeccion2]);

  const calculateResultadoFinalConDroprateNuevaSeccion2 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalNuevaSeccion2(); // I29
    const droprate = 0.063125; // Droprate fijo
    
    // Aplicar la fórmula condicional: SI(I29>=1, I29*0.063125, "0")
    if (resultadoFinal >= 1) {
      return resultadoFinal * droprate;
    } else {
      return 0;
    }
  }, [calculateResultadoFinalNuevaSeccion2]);

  // Funciones para la Nueva Sección 3
  const calculateItem24330x3Price = useCallback(() => {
    const price = itemPrices[24330];
    if (!price) return 0;
    return (price.buys.unit_price * 3) / 10000; // buy * 3
  }, [itemPrices]);

  const calculateItem89258x3Price = useCallback(() => {
    const price = itemPrices[89258];
    if (!price) return 0;
    return (price.buys.unit_price * 3) / 10000; // buy * 3
  }, [itemPrices]);

  const calculateItem100527Price = useCallback(() => {
    const price = itemPrices[100527];
    if (!price) return 0;
    return (price.sells.unit_price * 0.85) / 10000; // sell * 0.85
  }, [itemPrices]);

  const calculateSumaTotalNuevaSeccion3 = useCallback(() => {
    return calculateItem89271x48Price() + calculateItem24330x3Price() + calculateItem89258x3Price() + calculateItem19721x15Price();
  }, [calculateItem89271x48Price, calculateItem24330x3Price, calculateItem89258x3Price, calculateItem19721x15Price]);

  const calculateResultadoFinalNuevaSeccion3 = useCallback(() => {
    return calculateItem100527Price() - calculateSumaTotalNuevaSeccion3();
  }, [calculateItem100527Price, calculateSumaTotalNuevaSeccion3]);

  const calculateResultadoFinalConDroprateNuevaSeccion3 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalNuevaSeccion3(); // I71
    const divisor = 1; // D69 = 1 (asumiendo que es 1, ajusta si es diferente)
    const droprate = 0.063125; // Droprate fijo
    
    // Aplicar la fórmula condicional: SI(I71>=1, (I71/D69)*0.063125, "0")
    if (resultadoFinal >= 1) {
      return (resultadoFinal / divisor) * droprate;
    } else {
      return 0;
    }
  }, [calculateResultadoFinalNuevaSeccion3]);

  // Funciones para la Nueva Sección 4
  const calculateItem89098x1Price = useCallback(() => {
    const price = itemPrices[89098];
    if (!price) return 0;
    return (price.buys.unit_price * 1) / 10000; // buy * 1
  }, [itemPrices]);

  const calculateItem74326Price = useCallback(() => {
    const price = itemPrices[74326];
    if (!price) return 0;
    return (price.sells.unit_price * 0.85) / 10000; // sell * 0.85
  }, [itemPrices]);

  const calculateSumaTotalNuevaSeccion4 = useCallback(() => {
    return calculateItem89271x15Price() + calculateItem68942x1Price() + calculateItem89098x1Price() + calculateItem19721x10Price();
  }, [calculateItem89271x15Price, calculateItem68942x1Price, calculateItem89098x1Price, calculateItem19721x10Price]);

  const calculateResultadoFinalNuevaSeccion4 = useCallback(() => {
    return calculateItem74326Price() - calculateSumaTotalNuevaSeccion4();
  }, [calculateItem74326Price, calculateSumaTotalNuevaSeccion4]);

  const calculateResultadoFinalConDroprateNuevaSeccion4 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalNuevaSeccion4(); // I8
    const droprate = 0.063125; // Droprate fijo
    
    // Aplicar la fórmula condicional: SI(I8>=1, (0.063125*I8), "0")
    if (resultadoFinal >= 1) {
      return droprate * resultadoFinal;
    } else {
      return 0;
    }
  }, [calculateResultadoFinalNuevaSeccion4]);

  // Funciones para Nueva Sección 5
  const calculateItem24335x1Price = useCallback(() => {
    const price = itemPrices[24335];
    if (!price) return 0;
    return (price.buys.unit_price * 1) / 10000; // buy * 1
  }, [itemPrices]);

  const calculateItem24762Price = useCallback(() => {
    const price = itemPrices[24762];
    if (!price) return 0;
    return (price.sells.unit_price * 0.85) / 10000; // sell * 0.85
  }, [itemPrices]);

  const calculateSumaTotalNuevaSeccion5 = useCallback(() => {
    return calculateItem89271x12Price() + calculateItem24335x1Price() + calculateItem89103x1Price() + calculateItem19721x5Price();
  }, [calculateItem89271x12Price, calculateItem24335x1Price, calculateItem89103x1Price, calculateItem19721x5Price]);

  const calculateResultadoFinalNuevaSeccion5 = useCallback(() => {
    return calculateItem24762Price() - calculateSumaTotalNuevaSeccion5();
  }, [calculateItem24762Price, calculateSumaTotalNuevaSeccion5]);

  const calculateResultadoFinalConDroprateNuevaSeccion5 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalNuevaSeccion5();
    const droprate = 0.1025; // Droprate fijo
    
    // Aplicar la fórmula condicional: SI(resultadoFinal>0, (0.1025*resultadoFinal), "0")
    if (resultadoFinal > 0) {
      return droprate * resultadoFinal;
    } else {
      return 0;
    }
  }, [calculateResultadoFinalNuevaSeccion5]);

  // Funciones para Nueva Sección 6
  const calculateItem72504x15Price = useCallback(() => {
    const price = itemPrices[72504];
    if (!price) return 0;
    return (price.buys.unit_price * 15) / 10000; // buy * 15
  }, [itemPrices]);

  const calculateItem100429Price = useCallback(() => {
    const price = itemPrices[100429];
    if (!price) return 0;
    return (price.sells.unit_price * 0.85) / 10000; // sell * 0.85
  }, [itemPrices]);

  const calculateSumaTotalNuevaSeccion6 = useCallback(() => {
    return calculateItem89271x48Price() + calculateItem72504x15Price() + calculateItem89103x3Price() + calculateItem19721x15Price();
  }, [calculateItem89271x48Price, calculateItem72504x15Price, calculateItem89103x3Price, calculateItem19721x15Price]);

  const calculateResultadoFinalNuevaSeccion6 = useCallback(() => {
    return calculateItem100429Price() - calculateSumaTotalNuevaSeccion6();
  }, [calculateItem100429Price, calculateSumaTotalNuevaSeccion6]);

  const calculateResultadoFinalConDroprateNuevaSeccion6 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalNuevaSeccion6();
    const droprate = 0.01625; // Droprate fijo (C42)
    
    // Aplicar la fórmula condicional: SI(resultadoFinal>=1, (resultadoFinal*0.063125), "0")
    if (resultadoFinal >= 1) {
      return droprate * resultadoFinal;
    } else {
      return 0;
    }
  }, [calculateResultadoFinalNuevaSeccion6]);

  // Función para calcular ProfitMax de 19721 usando Nueva Sección 4
  const calculateResultadoFinalConDroprate19721 = useCallback(() => {
    const resultadoFinal = calculateResultadoFinalNuevaSeccion4(); // Q3
    const droprate = 0.2375; // Droprate fijo
    
    // Aplicar la fórmula condicional: SI(Q3>=1, Q3*0.2375, "0")
    if (resultadoFinal >= 1) {
      return droprate * resultadoFinal;
    } else {
      return 0;
    }
  }, [calculateResultadoFinalNuevaSeccion4]);


  // Funciones para calcular ProfitMax específicos de Magia Liberada (basados en la nueva imagen)
  const calculateUMProfitMax = useCallback((itemId: number) => {
    // Para el item 76179, usar el cálculo dinámico con droprate
    if (itemId === 76179) {
      return calculateResultadoFinalConDroprate76179();
    }
    if (itemId === 70957) {
      return calculateResultadoFinalConDroprate70957();
    }
    if (itemId === 48884) {
      return calculateResultadoFinalConDroprate24824();
    }
    if (itemId === 24305) {
      return calculateResultadoFinalConDroprate74978();
    }
    if (itemId === 24310) {
      return calculateResultadoFinalConDroprate24868();
    }
    if (itemId === 24315) {
      return calculateResultadoFinalConDroprateNuevaSeccion();
    }
    if (itemId === 24320) {
      return calculateResultadoFinalConDroprateSeccionRapida();
    }
    if (itemId === 24325) {
      return calculateResultadoFinalConDroprateNuevaSeccion2();
    }
    if (itemId === 24330) {
      return calculateResultadoFinalConDroprateNuevaSeccion3();
    }
    if (itemId === 68942) {
      return calculateResultadoFinalConDroprateNuevaSeccion4();
    }
    if (itemId === 24335) {
      return calculateResultadoFinalConDroprateNuevaSeccion5();
    }
    if (itemId === 72504) {
      return calculateResultadoFinalConDroprateNuevaSeccion6();
    }
    if (itemId === 19721) {
      return calculateResultadoFinalConDroprate19721();
    }
    if (itemId === 24357) {
      return calculateUMProfitMax24357();
    }

      
    // Valores fijos de ProfitMax según la imagen para otros items
    const profitMaxValues: Record<number, number> = {
      24370: 0,     // 0
      68063: 0,     // 0
      37897: 0,     // 0
      70842: 0,     // 0
      76491: 0,     // 0
      75654: 0,     // 0
      72315: 0,     // 0
      74988: 0      // 0
    };
    
    // Convertir de cobre a oro (dividir por 10000)
    const valueInCopper = profitMaxValues[itemId] || 0;
    return valueInCopper / 10000;
  }, [calculateResultadoFinalConDroprate76179, calculateResultadoFinalConDroprate70957, calculateResultadoFinalConDroprate24824, calculateResultadoFinalConDroprate74978, calculateResultadoFinalConDroprate24868, calculateResultadoFinalConDroprateNuevaSeccion, calculateResultadoFinalConDroprateSeccionRapida, calculateResultadoFinalConDroprateNuevaSeccion2, calculateResultadoFinalConDroprateNuevaSeccion3, calculateResultadoFinalConDroprateNuevaSeccion4, calculateResultadoFinalConDroprateNuevaSeccion5, calculateResultadoFinalConDroprateNuevaSeccion6, calculateResultadoFinalConDroprate19721, calculateUMProfitMax24357]);

  // Función para calcular el RESULTADO FINAL CON DROPRATE para Magia Liberada (similar a VM)
  const calculateResultadoFinalConDroprateUM = useCallback(() => {
    const resultadoFinal = calculateResultadoFinal();
    const droprate = 0.436; // Droprate específico para UM
    
    // Fórmula: SI(resultadoFinal >= 1, droprate * resultadoFinal, 0)
    let resultadoConDroprate = 1;
    
    if (resultadoFinal >= 1) {
      resultadoConDroprate = droprate * resultadoFinal;
    } else {
      resultadoConDroprate = 1;
    }
    
    return resultadoConDroprate;
  }, [calculateResultadoFinal]);

  // Funciones separadas para cada componente de UM
  const calculateRarosUM = useCallback(() => {
    return calculateResultadoFinalConDroprateUM();
  }, [calculateResultadoFinalConDroprateUM]);

  const calculateTrofeosRarosUM = useCallback(() => {
    return calculateTableTotal(trofeosRarosUMIds, 0.436);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trofeosRarosUMIds]);

  const calculateItemsIndividualesUM = useCallback(() => {
    const allUMItemIds = [
      // Otros items de UM
      19721, 24370, 68063, 76179, 70957, 19675, 37897, 48884,
      // Lodestones y otros items de UM
      24305, 24310, 24315, 24320, 24325, 24330, 70842, 68942, 24335, 72504, 76491, 75654, 72315, 74988
    ];
    
    return allUMItemIds.reduce((total, itemId) => {
      return total + calculateUMProfitMax(itemId);
    }, 0);
  }, [calculateUMProfitMax]);

  const calculateCajaUM = useCallback(() => {
    const allUMItemIds = [
      // Otros items de UM
      19721, 24370, 68063, 76179, 70957, 19675, 37897, 48884,
      // Lodestones y otros items de UM
      24305, 24310, 24315, 24320, 24325, 24330, 70842, 68942, 24335, 72504, 76491, 75654, 72315, 74988
    ];
    
    return allUMItemIds.reduce((total, itemId) => {
      const droprate = getUMDroprate(itemId);
      return total + calculateBasePrice(itemId, droprate);
    }, 0);
  }, [getUMDroprate, calculateBasePrice]);

  // Función para calcular el total de PrecioBASE de todos los items de UM
  const calculateTotalUMBasePrice = useCallback(() => {
    const allUMItemIds = [
      // Trofeos raros (T6)
      24295, 24358, 24351, 24357, 24289, 24300, 24283, 24277,
      // Otros items de UM
      19721, 24370, 68063, 76179, 70957, 19675, 37897, 48884,
      // Lodestones y otros items de UM
      24305, 24310, 24315, 24320, 24325, 24330, 70842, 68942, 24335, 72504, 76491, 75654, 72315, 74988
    ];
    
    return allUMItemIds.reduce((total, itemId) => {
      const droprate = getUMDroprate(itemId);
      return total + calculateBasePrice(itemId, droprate);
    }, 0);
  }, [getUMDroprate, calculateBasePrice]);

  // Función para calcular la suma total de ProfitMax para Magia Liberada
  const calculateTotalProfitMaxUM = useCallback(() => {
    return calculateRarosUM() + calculateTrofeosRarosUM() + calculateItemsIndividualesUM() + calculateCajaUM() + calculateTotalUMBasePrice();
  }, [calculateRarosUM, calculateTrofeosRarosUM, calculateItemsIndividualesUM, calculateCajaUM, calculateTotalUMBasePrice]);

  // Función para formatear precio en formato GW2
  const formatGW2Price = useCallback((priceInGold: number) => {
    if (priceInGold === 0) return '00G 00S 00C';
    
    // Manejar valores negativos
    const isNegative = priceInGold < 0;
    const absPrice = Math.abs(priceInGold);
    
    if (absPrice < 0.0001) return '00G 00S 00C';
    
    const gold = Math.floor(absPrice);
    const silver = Math.floor((absPrice - gold) * 100);
    const copper = Math.floor(((absPrice - gold) * 100 - silver) * 100);
    
    // Siempre mostrar formato completo con ceros
    const formattedGold = gold.toString().padStart(2, '0');
    const formattedSilver = silver.toString().padStart(2, '0');
    const formattedCopper = copper.toString().padStart(2, '0');
    
    const sign = isNegative ? '-' : '';
    return `${sign}${formattedGold}G ${formattedSilver}S ${formattedCopper}C`;
  }, []);

  // Función para truncar el precio como lo hace formatGW2Price
  const truncateGW2Price = useCallback((priceInGold: number) => {
    if (priceInGold === 0 || Math.abs(priceInGold) < 0.0001) return 0;
    
    const isNegative = priceInGold < 0;
    const absPrice = Math.abs(priceInGold);
    
    const gold = Math.floor(absPrice);
    const silver = Math.floor((absPrice - gold) * 100);
    const copper = Math.floor(((absPrice - gold) * 100 - silver) * 100);
    
    // Convertir de vuelta a gold con los valores truncados
    const truncatedPrice = gold + (silver / 100) + (copper / 10000);
    
    return isNegative ? -truncatedPrice : truncatedPrice;
  }, []);

  // Función para calcular el total de PrecioBASE de una tabla
  const calculateTableTotal = useCallback((itemIds: number[], droprate: number, isComunes: boolean = false) => {
    let total = 0;
    itemIds.forEach(itemId => {
      if (isComunes) {
        total += calculateBasePriceComunes(itemId, droprate);
      } else {
        // Para el item 24357, usar la función específica de VM si el droprate es 1.0078
        if (itemId === 24357 && droprate === 1.0078) {
          total += calculateVMProfitMax24357();
      } else {
        total += calculateBasePrice(itemId, droprate);
        }
      }
    });
    return total;
  }, [calculateBasePrice, calculateBasePriceComunes, calculateVMProfitMax24357]);

  // Función para calcular el Profit VM visual (mínimo) - truncado
  const calculateProfitVMMin = useCallback(() => {
    return ((calculateTableTotal(trofeosRarosIds, 1.0078) + calculateTableTotal(trofeosComunesIds, 4.99, true)) - 1) / 250;
  }, [calculateTableTotal, trofeosRarosIds, trofeosComunesIds]);

  // Función para calcular el Profit UM visual (mínimo) - truncado
  const calculateProfitUMMin = useCallback(() => {
    return (calculateTotalUMBasePrice() - 1) / 500;
  }, [calculateTotalUMBasePrice]);

  const fetchConversionCalculations = useCallback(async (forceRefresh = false) => {
    setIsLoadingConversions(true);
    try {
      // Verificar si tenemos datos en caché y si son recientes (menos de 5 minutos)
      // También verificar que el caché sea para el idioma actual
      const now = new Date();
      const cacheAge = apiCache.lastUpdate ? now.getTime() - apiCache.lastUpdate.getTime() : Infinity;
      const isCacheValid = cacheAge < 5 * 60 * 1000 && apiCache.lang === lang; // 5 minutos y mismo idioma
      
      // Cache validation
      
      let prices: Gw2Price[] = [];
      let items: Gw2Item[] = [];
      
      if (!forceRefresh && isCacheValid && Object.keys(apiCache.prices).length > 0 && Object.keys(apiCache.items).length > 0) {
        // Usar datos del caché
        prices = Object.values(apiCache.prices);
        items = Object.values(apiCache.items);
      } else {
        // Realizar llamadas a la API
        const [pricesResponse, itemsResponse] = await Promise.all([
          fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${allConversionItemIds.join(',')}`, {
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate, br'
            }
          }),
          fetch(`https://api.guildwars2.com/v2/items?ids=${allConversionItemIds.join(',')}&lang=${lang}`, {
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate, br'
            }
          })
        ]);

        // Verificar que ambas respuestas sean exitosas
        if (!pricesResponse.ok) {
          throw new Error(`Error al obtener precios: ${pricesResponse.status} ${pricesResponse.statusText}`);
        }
        if (!itemsResponse.ok) {
          throw new Error(`Error al obtener items: ${itemsResponse.status} ${itemsResponse.statusText}`);
        }

        [prices, items] = await Promise.all([
          pricesResponse.json(),
          itemsResponse.json()
        ]);
        
        // Actualizar el caché
        const pricesMap = prices.reduce((acc: Record<number, Gw2Price>, price: Gw2Price) => {
          acc[price.id] = price;
          return acc;
        }, {} as Record<number, Gw2Price>);
        
        // Precios obtenidos de la API

        const itemsMap = items.reduce((acc: Record<number, Gw2Item>, item: Gw2Item) => {
          acc[item.id] = item;
          return acc;
        }, {} as Record<number, Gw2Item>);

        setApiCache({
          prices: pricesMap,
          items: itemsMap,
          lastUpdate: now,
          lang: lang
        });
      }

      // Create price and item maps
      const pricesMap = prices.reduce((acc: Record<number, Gw2Price>, price: Gw2Price) => {
        acc[price.id] = price;
        return acc;
      }, {} as Record<number, Gw2Price>);

      const itemsMap = items.reduce((acc: Record<number, Gw2Item>, item: Gw2Item) => {
        acc[item.id] = item;
        return acc;
      }, {} as Record<number, Gw2Item>);

      // Actualizar los nombres de los materiales T6 con los datos de la API
      const updatedT6Materials = t6Materials.map(material => ({
        ...material,
        name: itemsMap[material.id]?.name || material.name || `Item ${material.id}`
      }));

      // Get prices for comparison
      const ectoplasmPrice = pricesMap[conversionMaterials.ectoplasm]?.sells?.unit_price || 0;
      const crystallineDustBuyPrice = pricesMap[conversionMaterials.crystallineDust]?.buys?.unit_price || 0;
      const crystallineDustSellPrice = pricesMap[conversionMaterials.crystallineDust]?.sells?.unit_price || 0;
      

      
      // Calculate the 4 values for comparison
      const valor1 = Math.ceil(crystallineDustSellPrice * 0.90); // Precio Sell al 90%
      const valor2 = crystallineDustBuyPrice; // Precio Buy
      const valor3 = Math.ceil(ectoplasmPrice * 0.90); // Ecto al precio de derecha al 90%
      const valor4 = Math.ceil(ectoplasmPrice * 0.90 / 1.85); // Ecto al 90%/1.85
      
      // Find the minimum value
      const menorValor = Math.min(valor1, valor2, valor3, valor4);
      
      const calculatedConversions: ConversionItem[] = updatedT6Materials.map(t6 => {
        const t5BuyPrice = pricesMap[t6.t5Id]?.buys?.unit_price || 0; // Precio de compra del T5
        const t6SellPrice = pricesMap[t6.id]?.sells?.unit_price || 0;

        const ectoplasmCost = menorValor * 200; // Usar el menor valor encontrado * 200
        const t5Cost = t5BuyPrice * 2000; 
        const costeConv20 = ectoplasmCost + t5Cost;

        // Cálculos de ganancia según la fórmula correcta
        // Profit SS 90% T6 = ((Precio 90% del T6 * 242) - CostConv20) / 20
        const precio90T6 = t6SellPrice * 0.90;
        const profit90 = ((precio90T6 * 242) - costeConv20)/20;
        const profit85 = ((t6SellPrice * 0.85 * 242) - costeConv20) / 20;

        const itemInfo = itemsMap[t6.id];

        return {
          id: t6.id,
          name: itemInfo?.name || `Item ${t6.id}`,
          icon: itemInfo?.icon || '',
          precio90: Math.ceil(t6SellPrice * 0.90),
          precio85: Math.ceil(t6SellPrice * 0.85),
          costeConv20: Math.round(costeConv20),
          profit90: Math.round(profit90),
          profit85: Math.round(profit85),
        };
      });

      setConversionData(calculatedConversions);

      const pricesForCores = pricesMap as Record<number, { buys?: { unit_price?: number }; sells?: { unit_price?: number } }>;
      setCoreConversionData(CORE_CONVERSIONS.map((pair) => {
        const cost = coreConversionCost(pricesForCores, pair.coreId);
        const best = coreLodestoneValue(pricesForCores, pair.lodestoneId, cost);
        const value90 = coreLodestone90(pricesForCores, pair.lodestoneId);
        const itemInfo = itemsMap[pair.lodestoneId];
        return {
          id: pair.lodestoneId,
          name: itemInfo?.name || `Item ${pair.lodestoneId}`,
          icon: itemInfo?.icon || '',
          precio90: Math.round(value90),
          precio85: 0,
          costeConv20: Math.round(best),
          profit90: Math.round(coreProfitPerShard(value90 - best)),
          profit85: 0,
        };
      }));
    } catch {
      // Error fetching conversion data
      // Aquí podrías agregar un toast o notificación de error
      // toast.error('Error al cargar datos de conversión');
      
      // En caso de error, mantener los datos anteriores si existen
      // No limpiar el estado para que el usuario no pierda la información
    } finally {
      setIsLoadingConversions(false);
    }
  }, [allConversionItemIds, conversionMaterials.ectoplasm, conversionMaterials.crystallineDust, t6Materials, lang, apiCache]);

  useEffect(() => {
    if (selectedSection === 'conversions') {
      fetchConversionCalculations(false); // No forzar actualización en carga automática
    }
  }, [selectedSection, fetchConversionCalculations]);

  // Limpiar caché cuando cambie el idioma
  useEffect(() => {
    setApiCache({
      prices: {},
      items: {},
      lastUpdate: null,
      lang: ''
    });
  }, [lang]);

  // Manejar hash de la URL para navegación directa a secciones (/magic#conversions#Lodestone)
  useEffect(() => {
    const handleHashChange = () => {
      const [section, sub] = window.location.hash.substring(1).split('#');
      if (section && ['overview', 'conversions', 'volatile-magic', 'unbound-magic', 'strategies'].includes(section)) {
        setSelectedSection(section);
      }
      setHashSub(sub || '');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (selectedSection !== 'conversions' || !hashSub) return;
    document.getElementById(hashSub)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hashSub, selectedSection, isLoadingConversions]);

  // Función para color de ganancia con gradación progresiva - OPTIMIZADA
  const getProfitColor = useCallback((profit: number) => {
    if (profit <= 0) return 'bg-red-600';                    // Pérdida
    
    // Calcular el 50% del profit máximo para gradación
    const maxProfit = Math.max(...conversionData.map(item => Math.max(item.profit90, item.profit85)));
    const fiftyPercent = maxProfit * 0.5;
    
    if (profit >= fiftyPercent) return 'bg-green-500';        // Top 50%
    if (profit >= fiftyPercent * 0.5) return 'bg-yellow-500'; // 25-50%
    return 'bg-orange-500';                                   // 0-25%
  }, [conversionData]);

  // Memoizar los datos de conversión para evitar re-renders
  const memoizedConversionData = useMemo(() => conversionData, [conversionData]);
  const memoizedCoreConversionData = useMemo(() => coreConversionData, [coreConversionData]);

  // Memoizar las funciones de cálculo para evitar re-renders
  const memoizedFormatGoldSilverCopperJSX = useCallback((copper: number) => {
    const sign = copper < 0 ? '-' : '';
    const absCopper = Math.abs(copper);
    const gold = Math.floor(absCopper / 10000);
    const silver = Math.floor((absCopper % 10000) / 100);
    const copperRemainder = absCopper % 100;
    
    const goldStr = gold.toString().padStart(2, '0');
    const silverStr = silver.toString().padStart(2, '0');
    const copperStr = copperRemainder.toString().padStart(2, '0');
    
    return (
      <span style={{ 
        display: 'inline-flex', 
        whiteSpace: 'nowrap', 
        wordBreak: 'keep-all',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: '2px'
      }}>
        {sign}{goldStr}G {silverStr}S {copperStr}C
      </span>
    );
  }, []);



  // Array no usado actualmente - comentado
  // const craftingTips = [
  //   {
  //     title: 'Efficient Leveling',
  //     description: 'Craft items you can sell to recover costs while leveling up',
  //     icon: TrendingUp,
  //     color: 'text-green-400'
  //   },
  //   {
  //     title: 'Cheap Materials',
  //     description: 'Buy materials during low demand periods to save gold',
  //     icon: Coins,
  //     color: 'text-yellow-400'
  //   },
  //   {
  //     title: 'Profitable Recipes',
  //     description: 'Focus on recipes that have good demand on the Trading Post',
  //     icon: BarChart3,
  //     color: 'text-blue-400'
  //   },
  //   {
  //     title: 'Conversions',
  //     description: 'Convert lower tier materials to higher tier when profitable',
  //     icon: Zap,
  //     color: 'text-purple-400'
  //   }
  // ];

  return (
    <>
      <style>{`
        .font-display {
          font-display: swap;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-weight: 900;
          text-rendering: optimizeSpeed;
          letter-spacing: -0.025em;
        }
        
        /* Optimizaciones para mejorar LCP */
        .text-white.font-black {
          text-rendering: optimizeSpeed;
          font-display: swap;
        }
        
        /* Optimizar renderizado de tablas */
        table {
          contain: layout style paint;
        }
        
        /* Optimizar animaciones */
        .motion-div {
          will-change: transform, opacity;
        }
      `}</style>
      <div className="min-h-screen tf-site-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('craftingPage.t6Analysis', 'Análisis de Materiales T6')}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('craftingPage.t6AnalysisSubtitle', 'Calculadora avanzada para maximizar el profit de conversiones de materiales y análisis de magia')}
            </p>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {[
              { id: 'overview', label: t('craftingPage.overview', 'Overview'), icon: Info },
              { id: 'conversions', label: t('craftingPage.conversions', 'Conversions'), icon: RefreshCw },
              { id: 'volatile-magic', label: t('craftingPage.volatileMagic', 'Magia Volatil'), icon: Package },
              { id: 'unbound-magic', label: t('craftingPage.unboundMagic', 'Magia Liberada'), icon: Package },
              { id: 'strategies', label: t('craftingPage.strategies', 'Strategies'), icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedSection(tab.id);
                  window.location.hash = tab.id;
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  selectedSection === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Content Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Overview Section */}
            {selectedSection === 'overview' && (
              <div className="space-y-8">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <Info className="w-8 h-8 mr-3 text-blue-400" />
                    {t('craftingPage.t6Analysis', 'Análisis de Materiales T6')}
                  </h2>
                                      <p className="text-gray-300 mb-4">
                    {t('craftingPage.t6AnalysisDesc', 'Esta calculadora analiza la rentabilidad de convertir materiales de Nivel 5 a Nivel 6, así como el valor de la Magia Volátil y Magia Liberada. Los datos se basan en análisis de 500k {trophyBoxes} y 400k {magicBoxes} abiertos.').replace('{trophyBoxes}', tableItemNames[85725] || 'Trophy Shipment').replace('{magicBoxes}', tableItemNames[79186] || 'Magic-Warped Bundle')}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-green-800/30 to-green-700/30 rounded-lg p-4 border border-green-600/30">
                      <h3 className="text-green-300 font-semibold mb-2 flex items-center">
                        <Package className="w-5 h-5 mr-2" />
                        {t('craftingPage.t6Conversions', 'Conversiones T6')}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {t('craftingPage.t6ConversionsDesc', 'Conversiones rentables de materiales T5 a T6 usando la Forja Mística con análisis de droprate preciso')}
                      </p>
                  </div>
                    <div className="bg-gradient-to-r from-blue-800/30 to-blue-700/30 rounded-lg p-4 border border-blue-600/30">
                      <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
                        <Zap className="w-5 h-5 mr-2" />
                        {t('craftingPage.volatileMagic', 'Magia Volátil')}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {t('craftingPage.volatileMagicAnalysis', 'Análisis de valor de la Magia Volátil basado en 500k de {trophyBoxes} abiertos').replace('{trophyBoxes}', tableItemNames[85725] || 'Trophy Shipment')}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-800/30 to-purple-700/30 rounded-lg p-4 border border-purple-600/30">
                      <h3 className="text-purple-300 font-semibold mb-2 flex items-center">
                        <Star className="w-5 h-5 mr-2" />
                        {t('craftingPage.unboundMagic', 'Magia Liberada')}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {t('craftingPage.unboundMagicAnalysis', 'Análisis de valor de la Magia Liberada basado en 400k de {magicBoxes} abiertos').replace('{magicBoxes}', tableItemNames[79186] || 'Magic-Warped Bundle')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-700/30 rounded-lg p-4">
                    <h3 className="text-blue-300 font-semibold mb-3 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      {t('craftingPage.analysisData', 'Datos de Análisis')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-300 mb-2">
                          <span className="text-blue-200 font-semibold">{t('craftingPage.analysisDataDesc', '500k {trophyBoxes} analizados').replace('{trophyBoxes}', tableItemNames[85725] || 'Trophy Shipment')}</span>
                        </p>
                        <p className="text-gray-300 mb-2">
                          <span className="text-purple-200 font-semibold">{t('craftingPage.analysisDataDesc2', '400k {magicBoxes} analizados').replace('{magicBoxes}', tableItemNames[79186] || 'Magic-Warped Bundle')}</span>
                        </p>
                        <p className="text-gray-400 text-xs" dangerouslySetInnerHTML={{ __html: t('craftingPage.dataProvided', 'Datos proporcionados por Vortus43') }}>
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-300 mb-2">
                          <span className="text-blue-200 font-semibold">{t('craftingPage.realTimePrices', 'Precios en tiempo real')}</span> {t('craftingPage.fromGW2API', 'desde la API de GW2')}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {t('craftingPage.autoUpdate', 'Actualización automática cada 5 minutos')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Materials Section */}
            {selectedSection === 'volatile-magic' && (
              <div className="space-y-8">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <OptimizedImage 
                      src="/images/expansions/volatile-magic.webp" 
                      alt={t('craftingPage.volatileMagic', 'Magia Volatil')} 
                      className="mr-3"
                      priority
                    />
                    {t('craftingPage.volatileMagic', 'Magia Volatil')}
                  </h2>
                  
                  {/* Descripción principal */}
                  <div className="bg-gray-700/50 rounded-lg p-6 mb-6 border border-gray-600">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <OptimizedImage 
                        src="/images/expansions/volatile-magic.webp" 
                        alt={t('craftingPage.volatileMagic', 'Magia Volatil')} 
                        className="mr-3"
                        priority
                      />
                      {t('craftingPage.whatIsVolatileMagic', '¿Qué es la Magia Volatil?')}
                    </h3>
                    <p className="text-gray-300 mb-4">
                      {t('craftingPage.volatileMagicDesc', 'La Magia Volatil es una divisa almacenada en la cartera y es la divisa principal de la 4.ª temporada del Mundo Viviente.')}</p>
                  </div>

                  {/* Sección de Consumibles de Magia Volátil */}
                  <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-lg p-6 mb-6 border border-orange-500/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <OptimizedImage 
                        src="/images/expansions/volatile-magic.webp" 
                        alt={t('craftingPage.volatileMagic', 'Magia Volatil')} 
                        className="mr-1"
                        priority
                      />
                      {t('craftingPage.volatileMagicConsumables', 'Consumibles de Magia Volátil')}
                    </h3>
                    <p className="text-gray-300 mb-4 text-sm">
                      {t('craftingPage.volatileMagicConsumablesDesc', 'Estos consumibles dan esta cantidad de Magia Volátil')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { id: 86069, quantity: 5 },
                        { id: 86977, quantity: 20 },
                        { id: 87645, quantity: 20 },
                        { id: 89537, quantity: 20 },
                        { id: 88955, quantity: 20 }
                      ].map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 hover:border-orange-500/50 transition-all">
                          {tableItemIcons[item.id] ? (
                            <OptimizedImage
                              src={tableItemIcons[item.id]}
                              alt={tableItemNames[item.id] || `Item ${item.id}`}
                              className="w-12 h-12 rounded flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-700 rounded animate-pulse flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm truncate">
                              {tableItemNames[item.id] || t('craftingPage.loading', 'Cargando...')}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {t('craftingPage.quantity', 'Cantidad')}: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 text-center">
                    {t('craftingPage.howToGet', '¿Cómo lo obtengo?')}
                  </h3>
                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <Link href="/ls4-meta" className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base text-center">
                      {t('craftingPage.ls4Meta', 'LS4 Meta')}
                    </Link>
                    <Link href="/garden" className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base text-center">
                      {t('craftingPage.gardens', 'Jardines')}
                    </Link>
                    <Link href="/others" className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base text-center">
                      {t('craftingPage.others', 'Otros')}
                    </Link>
                  </div>
                   
                   <h3 className="text-xl font-bold text-white mb-6 text-center">
                     {t('craftingPage.whatToSpend', '¿En qué gastar la magia volátil?')}
                   </h3>
                   
                   <div className="text-center mb-6">
                     <div className="flex items-center justify-center gap-3">
                       <OptimizedImage 
                         src={tableItemIcons[85725] || "https://render.guildwars2.com/file/12280A76B8BF2B15ADFE092A0B9FF6EE442851EE/1894768.png"} 
                         alt={tableItemNames[85725] || 'Trophy Shipment'} 
                         className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
                         priority={true}
                       />
                       <h4 className="text-lg font-semibold text-white">
                         {tableItemNames[85725] || 'Trophy Shipment'}
                       </h4>
                     </div>
                   </div>
                   
                   {/* Resumen de ganancias */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                     <div className="bg-gray-700 rounded p-2 sm:p-3 border border-gray-600">
                       <h6 className="text-xs font-bold text-gray-300 mb-2 text-center">{t('craftingPage.table.totalBox', 'Total Caja')}</h6>
                       <div className="text-center">
                         <p className="text-green-400 font-bold text-sm sm:text-lg">
                           {t('craftingPage.table.min', 'Min')}: {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price                          
                          (calculateTableTotal(trofeosRarosIds, 1.0078) + 
                          calculateTableTotal(trofeosComunesIds, 4.99, true)
                           )}
                         </p>
                         <p className="text-green-400 font-bold text-sm sm:text-lg">
                           {t('craftingPage.table.max', 'Max')}: {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateTotalProfitMax())}
                         </p>
                       </div>
                     </div>
                     <div className="bg-gray-700 rounded p-2 sm:p-3 border border-gray-600">
                       <h6 className="text-xs font-bold text-gray-300 mb-2 text-center">{t('craftingPage.table.profitBox', 'Profit Caja')}</h6>
                       <div className="text-center">
                         <p className="text-yellow-400 font-bold text-sm sm:text-lg">
                           {t('craftingPage.table.min', 'Min')}: {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(
                             (calculateTableTotal(trofeosRarosIds, 1.0078) + calculateTableTotal(trofeosComunesIds, 4.99, true)) - 1
                           )}
                         </p>
                         <p className="text-yellow-400 font-bold text-sm sm:text-lg">
                           {t('craftingPage.table.max', 'Max')}: {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateTotalProfitMax() - 1)} {/* -1 = -10000 cobre */}
                         </p>
                       </div>
                     </div>
                    <div className="bg-gray-700 rounded p-2 sm:p-3 border border-gray-600 sm:col-span-2 lg:col-span-1">
                      <h6 className="text-xs font-bold text-gray-300 mb-2 text-center">{t('craftingPage.table.profitVM', 'Profit VM')}</h6>
                      <div className="text-center">
                        <p className="text-blue-400 font-bold text-sm sm:text-lg">
                          {t('craftingPage.table.min', 'Min')}: {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(
                            calculateProfitVMMin()
                          )}
                        </p>
                        <p className="text-blue-400 font-bold text-sm sm:text-lg">
                          {t('craftingPage.table.max', 'Max')}: {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price((calculateTotalProfitMax() - 1)/250)} {/* -1 = -10000 cobre */}
                        </p>
                      </div>
                    </div>
                   </div>
                   
                  {/* Calculadora de Magia Volátil */}
                  <div className="bg-purple-900/20 backdrop-blur-sm border border-purple-700/30 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <OptimizedImage 
                        src="/images/expansions/volatile-magic.webp" 
                        alt="Magia Volátil" 
                        className="w-8 h-8"
                      />
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        {t('craftingPage.volatileMagicCalculator', 'Calculadora de Magia Volátil')}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Input de cantidad */}
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-600/30">
                        <label className="block text-purple-300 text-sm font-semibold mb-2">
                          {t('craftingPage.yourVolatileMagic', 'Tu Magia Volátil')}:
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={userVolatileMagic}
                          onChange={(e) => setUserVolatileMagic(e.target.value)}
                          placeholder="0"
                          className="w-full bg-gray-700 border border-purple-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50"
                        />
                      </div>
                      
                      {/* Resultado */}
                      <div className="bg-gradient-to-r from-purple-800/30 to-purple-700/30 rounded-lg p-4 border border-purple-600/30">
                        <h4 className="text-purple-300 text-sm font-semibold mb-2">
                          {t('craftingPage.estimatedProfit', 'Profit Estimado')} ({t('craftingPage.table.min', 'Min')}):
                        </h4>
                        <p className="text-2xl sm:text-3xl font-bold text-purple-300">
                          {isLoadingPrices ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : userVolatileMagic && parseFloat(userVolatileMagic) > 0 ? (
                            formatGW2Price(
                              truncateGW2Price(calculateProfitVMMin()) * parseFloat(userVolatileMagic)
                            )
                          ) : (
                            formatGW2Price(0)
                          )}
                        </p>
                        <p className="text-xs text-purple-400 mt-2">
                          {t('craftingPage.basedOnProfitVM', 'Basado en Profit VM mínimo')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Data Source Info */}
                  <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-700/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 md:mb-8">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="text-blue-300 text-xs md:text-base">
                        <strong>{t('craftingPage.table.dataSource', 'Fuente de Datos')}:</strong> {t('craftingPage.table.basedOn', 'Análisis basado en')}{' '}
                        <span className="text-blue-200 font-bold">500k {tableItemNames[85725] || 'Trophy Shipment'}</span> {t('craftingPage.table.opened', 'abiertos')}
                        <br />
                        <span className="text-blue-400 text-xs" dangerouslySetInnerHTML={{ __html: t('craftingPage.table.dataCredit', 'Datacredit: Vortus43') }}></span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Precios actualizados */}
                   <div className="bg-green-900/20 backdrop-blur-sm border border-green-700/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 md:mb-8">
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                       <div className="flex items-center gap-2 sm:gap-3">
                         <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                         <div className="text-green-300 text-xs md:text-base">
                           <strong>Precios actualizados:</strong> {lastPriceUpdate ? lastPriceUpdate.toLocaleTimeString('es-ES') : 'Cargando...'}
                         </div>
                       </div>
                       <button
                         onClick={fetchTableItemPrices}
                         disabled={isLoadingPrices}
                         className="flex items-center justify-center gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors duration-200 w-full sm:w-auto"
                       >
                         <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoadingPrices ? 'animate-spin' : ''}`} />
                         {isLoadingPrices ? 'Actualizando...' : 'Actualizar'}
                      </button>
                    </div>
                    
                    
                    
                    {/* Sección de cálculos - OCULTA */}
                    <div className="hidden">
                       <div className="bg-gradient-to-r from-green-800/50 to-green-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-green-600/50">
                         <div className="flex items-center gap-3 mb-4">
                           <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                           <h3 className="text-lg font-semibold text-white">🕵️ Sistema Completo de Cálculos - ProfiMax de Raros</h3>
                         </div>
                                                  {/* ===== PRIMERA PARTE: ITEMS INDIVIDUALES ===== */}
                           <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-600/30">
                             <h4 className="text-blue-300 font-semibold mb-3 text-sm">📊 PRIMERA PARTE: Items Individuales</h4>
                             
                             {/* Item 24591 Price */}
                             <div className="flex items-center gap-3 mb-2">
                               <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                               <div className="text-blue-300 text-sm">
                                 <strong>Item 24591 × 1 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24591Price())}
                               </div>
                             </div>
                             
                             {/* Item 19701 Price */}
                             <div className="flex items-center gap-3 mb-2">
                               <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                               <div className="text-cyan-300 text-sm">
                                 <strong>Item 19701 × 16 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19701Price())}
                               </div>
                             </div>
                             
                             {/* Item 24295 Price */}
                             <div className="flex items-center gap-3 mb-2">
                               <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                               <div className="text-green-300 text-sm">
                                 <strong>Item 24295 × 1 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24295Price())}
                               </div>
                             </div>
                             
                             {/* Suma Total */}
                             <div className="flex items-center gap-3 mt-3 pt-3 border-t border-blue-600/30">
                               <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                               <div className="text-yellow-300 text-sm font-bold">
                                 <strong>🏆 SUMA TOTAL (24591 + 19701 + 24295):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24591Price() + calculateItem19701Price() + calculateItem24295Price())}
                               </div>
                             </div>
                           </div>
                       
                       {/* Cálculos para 97487 */}
                       <div className="mt-3 pt-3 border-t border-green-700/30">
                         <div className="text-green-300 text-sm mb-3 font-semibold">
                           <strong>🔮 SEGUNDA PARTE: Cálculos para 97487</strong>
                         </div>
                         
                             {/* 97102 × 8 (buy) */}
                             <div className="flex items-center gap-3 mb-2">
                               <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                               <div className="text-red-300 text-sm">
                                 <strong>97102 × 8 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem97102Price())}
                               </div>
                             </div>
                         
                             {/* 19721 × 4 (sell × 0.9) */}
                             <div className="flex items-center gap-3 mb-2">
                               <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                               <div className="text-pink-300 text-sm">
                                 <strong>19721 × 4 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721Price())}
                               </div>
                             </div>
                         
                             {/* 19701 × 20 (buy) */}
                             <div className="flex items-center gap-3 mb-2">
                               <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                               <div className="text-indigo-300 text-sm">
                                 <strong>19701 × 20 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19701x10Price())}
                               </div>
                             </div>
                         
                         {/* Precio total para 97487 */}
                         <div className="flex items-center gap-3 mt-2 pt-2 border-t border-green-700/20">
                           <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                           <div className="text-orange-300 text-xs">
                             <strong>💰 Precio total para 97487 (suma):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateTotalPriceFor97487())}
                           </div>
                         </div>
                         
                         {/* Precio por nota más bajo */}
                         <div className="flex items-center gap-3 mt-2 pt-2 border-t border-green-700/20">
                           <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                           <div className="text-purple-300 text-xs">
                             <strong>📊 {t('craftingPage.lowestPricePerNote', 'Precio por nota más bajo')}:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(getLowestPricePerNote())}
                           </div>
                         </div>
                         
                         {/* Total final con 30 notas */}
                         <div className="flex items-center gap-3 mt-3 pt-3 border-t border-green-700/30">
                                                          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                           <div className="text-yellow-300 text-xs">
                             <strong>🎯 TOTAL FINAL (97487 + 60 notas):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateTotalWithNotes())}
                           </div>
                         </div>
                         
                         {/* SUMA COMPLETA */}
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                           <div className="text-green-300 text-xs">
                             <strong>🏆 {t('craftingPage.completeSum', 'SUMA COMPLETA (Suma Total + TOTAL FINAL)')}:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateSumaCompleta())}
                           </div>
                         </div>
                         
                         {/* Item 97535 (sell × 0.85) */}
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                           <div className="text-red-300 text-xs">
                             <strong>🔴 Item 97535 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem97535Price())}
                           </div>
                         </div>
                         
                         {/* RESULTADO FINAL */}
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                           <div className="text-purple-300 text-xs">
                             <strong>💎 RESULTADO FINAL (SUMA COMPLETA - 97535):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinal())}
                           </div>
                         </div>
                         
                         {/* RESULTADO FINAL CON DROPRATE */}
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                           <div className="text-blue-300 text-xs">
                             <strong>🚀 {t('craftingPage.finalResultWithDroprateFormat', 'RESULTADO FINAL CON DROPRATE (≥1 × 1.0078)')}:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprate())}
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* RESULTADO FINAL CON DROPRATE - OCULTO */}
                 <div className="hidden">
                   <div className="bg-gradient-to-r from-blue-800/50 to-blue-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-blue-600/50">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                       <h3 className="text-lg font-semibold text-white">🚀 {t('craftingPage.finalResultWithDroprate', 'RESULTADO FINAL CON DROPRATE')}</h3>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
                       <div className="text-blue-300 text-lg font-bold">
                         <strong>🚀 RESULTADO FINAL CON DROPRATE (≥1 × 1.0078):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprate())}
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Tercera sección de cálculos - OCULTA */}
                 <div className="hidden">
                   <div className="bg-gradient-to-r from-orange-800/50 to-orange-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-orange-600/50">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                       <h3 className="text-lg font-semibold text-white">🕵️ Sistema Completo de Cálculos - ProfiMax de Raros (TERCERA COPIA)</h3>
                     </div>
                     
                     {/* Primera parte: Items Individuales */}
                     <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-600/30">
                       <h4 className="text-blue-300 font-semibold mb-3 text-sm">📊 PRIMERA PARTE: Items Individuales</h4>
                       
                       {/* Item 24591 Price */}
                       <div className="flex items-center gap-3 mb-2">
                         <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                         <div className="text-blue-300 text-sm">
                           <strong>Item 24591 × 1 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24591Price())}
                         </div>
                       </div>
                       
                       {/* Item 19701 Price */}
                       <div className="flex items-center gap-3 mb-2">
                         <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                         <div className="text-cyan-300 text-sm">
                           <strong>Item 19701 × 16 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19701Price())}
                         </div>
                       </div>
                       
                       {/* Item 24358 Price */}
                       <div className="flex items-center gap-3 mb-2">
                         <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                         <div className="text-green-300 text-sm">
                           <strong>Item 24358 × 1 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24358Price())}
                         </div>
                       </div>
                       
                       {/* Suma Total */}
                       <div className="flex items-center gap-3 mt-3 pt-3 border-t border-blue-600/30">
                         <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                         <div className="text-yellow-300 text-sm font-bold">
                           <strong>🏆 SUMA TOTAL (24591 + 19701 + 24358):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24591Price() + calculateItem19701Price() + calculateItem24358Price())}
                         </div>
                       </div>
                     </div>
                     
                     {/* Segunda parte: Cálculos para 97487 */}
                     <div className="mt-3 pt-3 border-t border-orange-700/30">
                       <div className="text-orange-300 text-sm mb-3 font-semibold">
                         <strong>🔮 SEGUNDA PARTE: Cálculos para 97487</strong>
                       </div>
                       
                       {/* 97102 × 8 (buy) */}
                       <div className="flex items-center gap-3 mb-2">
                         <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                         <div className="text-red-300 text-sm">
                           <strong>97102 × 8 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem97102Price())}
                         </div>
                       </div>
                       
                       {/* 19721 × 4 (sell × 0.9) */}
                       <div className="flex items-center gap-3 mb-2">
                         <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                         <div className="text-pink-300 text-sm">
                           <strong>19721 × 4 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721Price())}
                         </div>
                       </div>
                       
                       {/* 19701 × 20 (buy) */}
                       <div className="flex items-center gap-3 mb-2">
                         <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                         <div className="text-indigo-300 text-sm">
                           <strong>19701 × 20 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19701x10Price())}
                         </div>
                       </div>
                       
                       {/* Precio total para 97487 */}
                       <div className="flex items-center gap-3 mt-2 pt-2 border-t border-orange-700/20">
                         <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                         <div className="text-orange-300 text-xs">
                           <strong>💰 Precio total para 97487 (suma):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateTotalPriceFor97487())}
                         </div>
                       </div>
                       
                       {/* Precio por nota más bajo */}
                       <div className="flex items-center gap-3 mt-2 pt-2 border-t border-orange-700/20">
                         <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                         <div className="text-purple-300 text-xs">
                           <strong>📊 Precio por nota más bajo:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(getLowestPricePerNote())}
                         </div>
                       </div>
                       
                       {/* Total final con 60 notas */}
                       <div className="flex items-center gap-3 mt-3 pt-3 border-t border-orange-700/30">
                         <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                         <div className="text-yellow-300 text-xs">
                           <strong>🎯 TOTAL FINAL (97487 + 60 notas):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateTotalWithNotes())}
                         </div>
                       </div>
                       
                       {/* SUMA COMPLETA */}
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                         <div className="text-green-300 text-xs">
                           <strong>🏆 SUMA COMPLETA (Suma Total + TOTAL FINAL):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateSumaCompleta())}
                         </div>
                       </div>
                       
                       {/* Item 95582 (sell × 0.85) */}
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                         <div className="text-red-300 text-xs">
                           <strong>🔴 Item 95582 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem95582Price())}
                         </div>
                       </div>
                       
                       {/* RESULTADO FINAL */}
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                         <div className="text-purple-300 text-xs">
                           <strong>💎 RESULTADO FINAL (SUMA COMPLETA - 95582):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalTerceraSeccion())}
                         </div>
                       </div>
                       
                       {/* RESULTADO FINAL CON DROPRATE */}
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                         <div className="text-blue-300 text-xs">
                           <strong>🚀 {t('craftingPage.finalResultWithDroprateFormat', 'RESULTADO FINAL CON DROPRATE (≥1 × 1.0078)')}:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateTerceraSeccion())}
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                                   {/* Cuarta sección de cálculos - OCULTA */}
                  <div className="hidden">
                   <div className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-600/50">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                       <h3 className="text-lg font-semibold text-white">🕵️ Sistema Completo de Cálculos - ProfiMax de Raros (CUARTA COPIA)</h3>
                     </div>
                     
                     {/* Primera parte: Items Individuales */}
                     <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-600/30">
                       <h4 className="text-blue-300 font-semibold mb-3 text-sm">📊 PRIMERA PARTE: Items Individuales</h4>
                       
                       {/* Item 19721 Price */}
                       <div className="flex items-center gap-3 mb-2">
                         <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                         <div className="text-cyan-300 text-sm">
                           <strong>Item 19721 × 5 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x5Price())}
                         </div>
                       </div>
                       
                       {/* Item 24351 Price */}
                       <div className="flex items-center gap-3 mb-2">
                         <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                         <div className="text-blue-300 text-sm">
                           <strong>Item 24351 × 5 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24351Price())}
                         </div>
                       </div>
                       
                        {/* Item 10804 Price (Gossamer Patch) */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                          <div className="text-purple-300 text-sm">
                            <strong>Item 10804 × 1 (Gossamer Patch - crafting):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateGossamerPatchCraftingPrice())}
                            </div>
                          </div>
                       
                       {/* Suma Total */}
                       <div className="flex items-center gap-3 mt-3 pt-3 border-t border-blue-600/30">
                         <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                            <div className="text-yellow-300 text-sm font-bold">
                          <strong>🏆 SUMA TOTAL (19721 + 24351 + 10804):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x5Price() + calculateItem24351Price() + calculateGossamerPatchCraftingPrice())}
                        </div>
                       </div>

                        {/* Item 95582 (sell × 0.85) */}
                        <div className="flex items-center gap-2 mb-2">
                         <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                         <div className="text-red-300 text-xs">
                           <strong>🔴 Item 19912 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19912Price())}
                         </div>
                       </div>
                        {/* RESULTADO FINAL */}
                                                <div className="flex items-center gap-2 mb-2">
                           <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                           <div className="text-purple-300 text-xs">
                             <strong>💎 RESULTADO FINAL (SUMA COMPLETA - 19912):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalCuartaSeccion())}
                           </div>
                         </div>
                         
                         {/* RESULTADO FINAL CON DROPRATE para la cuarta sección */}
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                           <div className="text-indigo-300 text-xs">
                             <strong>🚀 RESULTADO FINAL CON DROPRATE (I92/D90 × 1.0078):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateCuartaSeccion())}
                           </div>
                         </div>
                     </div>
                     

                   </div>
                 </div>
                  {/* Quinta sección de cálculos - OCULTA (REPLICA 2) */}
                  <div className="hidden">
                   <div className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-600/50">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                               <h3 className="text-lg font-semibold text-white">🕵️ Sistema Completo de Cálculos - ProfiMax de Raros (QUINTA COPIA 2)</h3>
                      </div>
                      
                      {/* Primera parte: Items Individuales */}
                      <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-600/30">
                        <h4 className="text-blue-300 font-semibold mb-3 text-sm">📊 PRIMERA PARTE: Items Individuales</h4>
                        
                        {/* Item 19721 Price */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                          <div className="text-cyan-300 text-sm">
                            <strong>Item 19721 × 5 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x5Price())}
                          </div>
                        </div>
                        
                        {/* Item 24300 Price */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <div className="text-blue-300 text-sm">
                            <strong>Item 24300 × 5 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24300x5Price())}
                          </div>
                        </div>
                        
                        {/* Item 89271 Price */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                          <div className="text-purple-300 text-sm">
                            <strong>Item 89271 × 8 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x8Price())}
                            </div>
                          </div>
                        
                        {/* Item 89103 Price */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                          <div className="text-orange-300 text-sm">
                            <strong>Item 89103 × 2 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89103x2Price())}
                            </div>
                          </div>
                       
                       {/* Suma Total */}
                       <div className="flex items-center gap-3 mt-3 pt-3 border-t border-blue-600/30">
                         <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                            <div className="text-yellow-300 text-sm font-bold">
                          <strong>🏆 SUMA TOTAL (19721 + 24300 + 89271 + 89103):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x5Price() + calculateItem24300x5Price() + calculateItem89271x8Price() + calculateItem89103x2Price())}
                        </div>
                       </div>

                        {/* Item 24836 (sell × 0.85) */}
                        <div className="flex items-center gap-2 mb-2">
                         <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                         <div className="text-red-300 text-xs">
                           <strong>🔴 Item 24836 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24836Price())}
                         </div>
                       </div>

                         {/* RESULTADO FINAL */}
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                           <div className="text-purple-300 text-xs">
                             <strong>💎 RESULTADO FINAL (SUMA COMPLETA - 24836):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalQuintaSeccion())}
                           </div>
                         </div>
                         
                         {/* RESULTADO FINAL CON DROPRATE para la quinta sección */}
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                           <div className="text-indigo-300 text-xs">
                             <strong>🚀 RESULTADO FINAL CON DROPRATE (SI I36&gt;=1, (I36/D34)×G5, &quot;0&quot;):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateQuintaSeccion())}
                           </div>
                         </div>
                     </div>
                     

                   </div>
                 </div>
                  
                  {/* Séptima sección de cálculos - OCULTA (REPLICA 4) */}
                  <div className="hidden">
                   <div className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-600/50">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                                 <h3 className="text-lg font-semibold text-white">🕵️ Sistema Completo de Cálculos - ProfiMax de Raros (SÉPTIMA COPIA 4)</h3>
                        </div>
                        
                        {/* Primera parte: Items Individuales - Toxic Tuning Crystal */}
                        <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-600/30">
                          <h4 className="text-blue-300 font-semibold mb-3 text-sm">📊 PRIMERA PARTE: Ingredientes Toxic Tuning Crystal</h4>
                          
                          {/* Item 24277 Price (Pile of Crystalline Dust) */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                            <div className="text-cyan-300 text-sm">
                              <strong>Pile of Crystalline Dust (24277) × 3 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24277x3Price())}
                            </div>
                          </div>
                          
                          {/* Item 48884 Price (Pristine Toxic Spore Sample) */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <div className="text-green-300 text-sm">
                              <strong>Pristine Toxic Spore Sample (48884) × 5 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem48884x5Price())}
                            </div>
                          </div>
                        
                        {/* Item 46735 Price (Empyreal Fragment) */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                          <div className="text-purple-300 text-sm">
                            <strong>Empyreal Fragment (46735) × 100 (precio 0):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem46735x100Price())}
                            </div>
                          </div>
                       
                       {/* Suma Total */}
                       <div className="flex items-center gap-3 mt-3 pt-3 border-t border-blue-600/30">
                         <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                            <div className="text-yellow-300 text-sm font-bold">
                          <strong>🏆 SUMA TOTAL (24277×3 + 48884×5 + 46735×100) ÷ 5:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price((calculateItem24277x3Price() + calculateItem48884x5Price() + calculateItem46735x100Price()) / 5)}
                        </div>
                       </div>

                        {/* Item 48917 (Toxic Tuning Crystal - sell × 0.85) */}
                        <div className="flex items-center gap-2 mb-2">
                         <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                         <div className="text-red-300 text-xs">
                           <strong>🔴 Toxic Tuning Crystal (48917) (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem48917Price())}
                         </div>
                       </div>

                         {/* RESULTADO FINAL */}
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                           <div className="text-purple-300 text-xs">
                             <strong>💎 RESULTADO FINAL (48917 × 5):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalSeptimaSeccion())}
                           </div>
                         </div>
                         
                         {/* RESULTADO FINAL CON DROPRATE para la séptima sección */}
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                           <div className="text-indigo-300 text-xs">
                             <strong>🚀 RESULTADO FINAL CON DROPRATE (SI S64&gt;=1, I5×(S64/3), &quot;0&quot;):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateSeptimaSeccion())}
                           </div>
                         </div>
                     </div>
                   </div>
                 </div>
                   
                  {/* Tabla de datos de trofeos unificada */}
                  <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-4 md:p-6 shadow-2xl mb-4 sm:mb-6 md:mb-8">
                    <h5 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-3 sm:mb-4 text-center">📊 {t('craftingPage.analysisRewards', 'Análisis de Recompensas por')} {tableItemNames[85725] || 'Item 85725'}</h5>
                    
                    {/* Tabla unificada de trofeos */}
                    <div className="mb-6 sm:mb-8">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[400px] sm:min-w-[500px] md:min-w-[600px]">
                           <thead>
                             <tr className="border-b border-gray-700 bg-gray-800/60">
                               <th className="text-left p-2 sm:p-3 text-gray-200 font-semibold text-xs">{t('craftingPage.table.item', 'Item')}</th>
                               <th className="p-1 sm:p-2 md:p-3 text-center text-gray-200 font-semibold text-xs">{t('craftingPage.table.droprate', 'Droprate')}</th>
                               <th className="p-1 sm:p-2 md:p-3 text-center text-gray-200 font-semibold text-xs">{t('craftingPage.table.basePrice', 'Precio BASE')}</th>
                               <th className="p-1 sm:p-2 md:p-3 text-center text-gray-200 font-semibold text-xs">{t('craftingPage.table.profitMax', 'Profit Max')}</th>
                             </tr>
                           </thead>
                           <tbody>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/1A930A6A7B5B01EAB4CB36E79014C12B500BF6B3/66950.png" 
                                     alt="Vial de sangre poderosa" 
                                     className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24295] || 'Vial de sangre poderosa'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">1.0078</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24295, 1.0078))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprate())}
                               </td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/0EE45FBB1E1A004600E9BAA7097830B2DE08587D/66828.png" 
                                     alt="Hueso antiguo" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24358] || 'Hueso antiguo'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">1.0078</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24358, 1.0078))}
                               </td>
                                  <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                  {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateTerceraSeccion())}
                                </td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/043E2BBA270F381870F1B45E7C09C098CAFE3D14/66996.png" 
                                     alt="Garra despiadada" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24351] || 'Garra despiadada'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">1.0078</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24351, 1.0078))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">{isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateCuartaSeccion())}</td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/F2050EE1A7A43EDCDCB1E971FDA608AD0566E4DA/66998.png" 
                                     alt="Colmillo feroz" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24357] || 'Colmillo feroz'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">1.0078</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24357, 1.0078))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">{isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateVMProfitMax24357())}</td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/7061C82F4F9D0C585742F545C40A0F06BE0154DC/66527.png" 
                                     alt="Escama blindada" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24289] || 'Escama blindada'}</span>
                                 </div>
                               </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">1.0078</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24289, 1.0078))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateVMProfitMax24289())}
                              </td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/C1ABF9082901FC3CEABC3138CBCCA1DAD5D41812/66955.png" 
                                     alt="Tótem elaborado" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24300] || 'Tótem elaborado'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">1.0078</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24300, 1.0078))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateResultadoFinalConDroprateQuintaSeccion())}
                               </td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/543EC37900EA2A57E77FA891193A48D66AA224AB/66939.png" 
                                     alt="Vesícula de veneno poderoso" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24283] || 'Vesícula de veneno poderoso'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">1.0078</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24283, 1.0078))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateResultadoFinalConDroprateSextaSeccion())}
                               </td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/080D00670558CD9E580D5662030394B2206E92A6/434537.png" 
                                     alt="Montón de polvo cristalino" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24277] || 'Montón de polvo cristalino'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">1.0078</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24277, 1.0078))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateResultadoFinalConDroprateSeptimaSeccion())}
                               </td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/99AAE49EABF9A2415940FDB83CA1CE5E6E256020/66949.png" 
                                     alt="Vial de sangre potente" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24294] || 'Vial de sangre potente'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">4.99</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePriceComunes(24294, 4.99))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-gray-400 font-semibold text-xs whitespace-nowrap">00G 00S 00C</td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/13F077BA5D5C6324CFCB0A2E39050F24A441190B/66987.png" 
                                     alt="Hueso grande" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24341] || 'Hueso grande'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">4.99</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePriceComunes(24341, 4.99))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-gray-400 font-semibold text-xs whitespace-nowrap">00G 00S 00C</td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/3A4D64F4CE2951F358DE0AFCEA6551050FB4B4A7/66420.png" 
                                     alt="Garra grande" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24350] || 'Garra grande'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">4.99</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePriceComunes(24350, 4.99))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-gray-400 font-semibold text-xs whitespace-nowrap">00G 00S 00C</td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/DED4F23E44430C2BE1C0D491145A4946FC7D7C6F/223793.png" 
                                     alt="Colmillo grande" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24356] || 'Colmillo grande'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">4.99</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePriceComunes(24356, 4.99))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-gray-400 font-semibold text-xs whitespace-nowrap">00G 00S 00C</td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/F94ECFFF0FA9C321C108DA34E777B27B0AC9D5F8/66944.png" 
                                     alt="Escama grande" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24288] || 'Escama grande'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">4.99</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePriceComunes(24288, 4.99))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-gray-400 font-semibold text-xs whitespace-nowrap">00G 00S 00C</td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/4DBC299E4B036A0DD3119A0F06BACA147C03B5C7/66954.png" 
                                     alt="Tótem intrincado" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24299] || 'Tótem intrincado'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">4.99</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePriceComunes(24299, 4.99))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-gray-400 font-semibold text-xs whitespace-nowrap">00G 00S 00C</td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/EA6A4C91F561EC5667947AEFE4CA436D0631CBE3/66938.png" 
                                     alt="Vesícula de veneno potente" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24282] || 'Vesícula de veneno potente'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">4.99</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePriceComunes(24282, 4.99))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-gray-400 font-semibold text-xs whitespace-nowrap">00G 00S 00C</td>
                             </tr>
                             <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                               <td className="p-2 sm:p-2 text-gray-300">
                                 <div className="flex items-center gap-1 sm:gap-2">
                                   <OptimizedImage 
                                     src="https://render.guildwars2.com/file/3501C2BBADF95BE5F14E31484850E851EFCA33CB/434536.png" 
                                     alt="Montón de polvo incandescente" 
                                     className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                     priority
                                   />
                                   <span className="text-xs truncate">{tableItemNames[24276] || 'Montón de polvo incandescente'}</span>
                                 </div>
                               </td>
                               <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">4.99</td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                 {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePriceComunes(24276, 4.99))}
                               </td>
                               <td className="p-1 sm:p-2 md:p-3 text-center text-gray-400 font-semibold text-xs whitespace-nowrap">00G 00S 00C</td>
                             </tr>
                           </tbody>
                         </table>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             )}

            {/* Strategies Section */}
            {selectedSection === 'strategies' && (
              <div className="space-y-8">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <TrendingUp className="w-8 h-8 mr-3 text-green-400" />
                    {t('craftingPage.profitabilityStrategies', 'Estrategias de Rentabilidad')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-green-800/30 to-green-700/30 rounded-lg p-4 border border-green-600/30">
                        <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-green-300" />
                          </div>
                        <h3 className="text-white font-semibold">{t('craftingPage.profitableConversions', 'Conversiones Rentables')}</h3>
                        </div>
                      <p className="text-gray-300 text-sm">{t('craftingPage.profitableConversionsDesc', 'Convierte materiales T5 a T6 cuando la diferencia de precio sea favorable. Usa la tabla de conversiones para identificar oportunidades.')}</p>
                      </div>
                    
                    <div className="bg-gradient-to-r from-blue-800/30 to-blue-700/30 rounded-lg p-4 border border-blue-600/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-blue-300" />
                  </div>
                        <h3 className="text-white font-semibold">{t('craftingPage.volatileMagic', 'Magia Volátil')}</h3>
                      </div>
                      <p className="text-gray-300 text-sm">{t('craftingPage.volatileMagicStrategy', 'Gasta tu Magia Liberada en {trophyBoxes}, esto te ayudará a maximizar ganancias.').replace('{trophyBoxes}', tableItemNames[85725] || 'Trophy Shipment')}</p>
                </div>

                    <div className="bg-gradient-to-r from-purple-800/30 to-purple-700/30 rounded-lg p-4 border border-purple-600/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <Star className="w-5 h-5 text-purple-300" />
                        </div>
                        <h3 className="text-white font-semibold">{t('craftingPage.unboundMagic', 'Magia Liberada')}</h3>
                      </div>
                      <p className="text-gray-300 text-sm">{t('craftingPage.unboundMagicStrategy', 'Gasta tu Magia Liberada en {magicBoxes}, esto te ayudará a maximizar ganancias.').replace('{magicBoxes}', tableItemNames[79186] || 'Magic-Warped Bundle')}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-yellow-800/30 to-yellow-700/30 rounded-lg p-4 border border-yellow-600/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-yellow-300" />
                        </div>
                        <h3 className="text-white font-semibold">{t('craftingPage.dataAnalysis', 'Análisis de Datos')}</h3>
                      </div>
                      <p className="text-gray-300 text-sm">{t('craftingPage.dataAnalysisDesc', 'Los datos se actualizan en tiempo real. Monitorea los cambios de precios para tomar decisiones informadas.')}</p>
                    </div>
                  </div>
                </div>

                {/* Consejos Avanzados */}
                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-3 text-yellow-400" />
                    {t('craftingPage.advancedTips', 'Consejos Avanzados')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('craftingPage.droprateAnalysis', 'Análisis de Droprates')}</h4>
                          <p className="text-gray-300 text-sm">{t('craftingPage.droprateAnalysisDesc', 'Los droprates están calculados con precisión basados en 500k {trophyBoxes} y 400k {magicBoxes} analizados. Confía en los datos para tomar decisiones.').replace('{trophyBoxes}', tableItemNames[85725] || 'Trophy Shipment').replace('{magicBoxes}', tableItemNames[79186] || 'Magic-Warped Bundle')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('craftingPage.conversionTiming', 'Timing de Conversiones')}</h4>
                          <p className="text-gray-300 text-sm">{t('craftingPage.conversionTimingDesc', 'Convierte materiales cuando los precios T6 estén altos y los T5 bajos para maximizar ganancias.')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('craftingPage.currencyOptimization', 'Optimización de Divisas')}</h4>
                          <p className="text-gray-300 text-sm">{t('craftingPage.currencyOptimizationDesc', 'Prioriza conversiones T6 con mayor Profit Max. Usa {trophyBoxes} para Magia Volátil y {magicBoxes} para Magia Liberada.').replace('{trophyBoxes}', tableItemNames[85725] || 'Trophy Shipment').replace('{magicBoxes}', tableItemNames[79186] || 'Magic-Warped Bundle')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('craftingPage.continuousMonitoring', 'Monitoreo Continuo')}</h4>
                          <p className="text-gray-300 text-sm">{t('craftingPage.continuousMonitoringDesc', 'Los precios cambian constantemente. Revisa regularmente las tablas para identificar nuevas oportunidades.')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversions Section */}
            {selectedSection === 'conversions' && (
              <div className="space-y-8">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <RefreshCw className="w-8 h-8 mr-3 text-yellow-400" />
                      <h2 className="text-2xl font-bold text-white">
                        {t('craftingPage.t6Conversions', 'T6 Material Conversions')}
                      </h2>
                    </div>
                    <button
                      onClick={() => fetchConversionCalculations(true)}
                      disabled={isLoadingConversions}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingConversions ? 'animate-spin' : ''}`} />
                      {isLoadingConversions 
                        ? t('craftingPage.updating', 'Updating...')
                        : t('craftingPage.refreshData', 'Refresh Data')
                      }
                    </button>
                  </div>
                  <p className="text-gray-400 mb-6">
                    {t('craftingPage.conversionsDesc', 'Calculate the profitability of converting Tier 5 to Tier 6 materials through the Mystic Forge. Prices are updated in real-time from the Guild Wars 2 API.')}
                  </p>
                  
                  {/* Botón de guía de conversiones */}
                  <div className="mb-6 flex justify-center">
                    <Link
                      href="/conversion-guide"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-5 h-5" />
                      {t('magicPage.t6ConversionButton', 'COMO HACER CONVERSIONES DE T6 + VENTA DE ESQUIRLAS ESPIRITUALES')}
                    </Link>
                  </div>
                  
                  {/* Precios actualizados */}
                  {apiCache.lastUpdate && (
                    <div className="bg-green-900/20 backdrop-blur-sm border border-green-700/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                        <div className="text-green-300 text-xs md:text-base">
                          <strong>{t('craftingPage.pricesUpdated', 'Precios actualizados:')}</strong> {apiCache.lastUpdate.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}                  

                  {isLoadingConversions ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="animate-spin text-blue-400" size={48} />
                      <p className="ml-4 text-white text-lg">{t('craftingPage.loadingConversionData', 'Loading conversion data...')}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden text-sm">
                        <thead className="bg-gray-600">
                          <tr>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200 whitespace-nowrap">{t('craftingPage.table.material', 'Material')}</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200 whitespace-nowrap">{t('craftingPage.table.price90', 'Price 90%')}</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200 whitespace-nowrap">{t('craftingPage.table.price85', 'Price 85%')}</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200 whitespace-nowrap">{t('craftingPage.table.convCost20', 'Conv Cost 20')}</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200 whitespace-nowrap">{t('craftingPage.table.profitSS90', 'Profit SS 90% T6')}</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200 whitespace-nowrap">{t('craftingPage.table.profitSS85', 'Profit SS 85% T6')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memoizedConversionData.map((item, index) => (
                            <motion.tr 
                              key={item.id} 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="border-b border-gray-600 last:border-b-0 hover:bg-gray-600"
                            >
                              <td className="py-3 px-4 text-white">
                                <WikiItemLink name={item.name} itemId={item.id} className="flex items-center gap-2 hover:text-cyan-300">
                                {item.icon && (
                                  <OptimizedImage 
                                    src={item.icon} 
                                    alt={item.name} 
                                    className="w-8 h-8 rounded"
                                    priority
                                  />
                                )}
                                {item.name}
                                </WikiItemLink>
                              </td>
                              <td 
                                className="py-3 px-4 text-white whitespace-nowrap min-w-[100px]"
                                style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', overflow: 'hidden' }}
                              >
                                <span style={{ 
                                  display: 'flex', 
                                  whiteSpace: 'nowrap', 
                                  wordBreak: 'keep-all',
                                  overflow: 'hidden',
                                  flexWrap: 'nowrap',
                                  alignItems: 'center'
                                }}>
                                  {memoizedFormatGoldSilverCopperJSX(item.precio90)}
                                </span>
                              </td>
                              <td 
                                className="py-3 px-4 text-white whitespace-nowrap min-w-[100px]"
                                style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', overflow: 'hidden' }}
                              >
                                <span style={{ 
                                  display: 'flex', 
                                  whiteSpace: 'nowrap', 
                                  wordBreak: 'keep-all',
                                  overflow: 'hidden',
                                  flexWrap: 'nowrap',
                                  alignItems: 'center'
                                }}>
                                  {memoizedFormatGoldSilverCopperJSX(item.precio85)}
                                </span>
                              </td>
                              <td 
                                className="py-3 px-4 text-white whitespace-nowrap min-w-[120px]"
                                style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', overflow: 'hidden' }}
                              >
                                <span style={{ 
                                  display: 'flex', 
                                  whiteSpace: 'nowrap', 
                                  wordBreak: 'keep-all',
                                  overflow: 'hidden',
                                  flexWrap: 'nowrap',
                                  alignItems: 'center'
                                }}>
                                  {memoizedFormatGoldSilverCopperJSX(item.costeConv20)}
                                </span>
                              </td>
                              <td 
                                className={`py-3 px-4 text-white font-semibold whitespace-nowrap min-w-[120px] ${getProfitColor(item.profit90)}`}
                                style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', overflow: 'hidden' }}
                              >
                                <span style={{ 
                                  display: 'flex', 
                                  whiteSpace: 'nowrap', 
                                  wordBreak: 'keep-all',
                                  overflow: 'hidden',
                                  flexWrap: 'nowrap',
                                  alignItems: 'center'
                                }}>
                                  {memoizedFormatGoldSilverCopperJSX(item.profit90)}
                                </span>
                              </td>
                              <td 
                                className={`py-3 px-4 text-white font-semibold whitespace-nowrap min-w-[120px] ${getProfitColor(item.profit85)}`}
                                style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', overflow: 'hidden' }}
                              >
                                <span style={{ 
                                  display: 'flex', 
                                  whiteSpace: 'nowrap', 
                                  wordBreak: 'keep-all',
                                  overflow: 'hidden',
                                  flexWrap: 'nowrap',
                                  alignItems: 'center'
                                }}>
                                  {memoizedFormatGoldSilverCopperJSX(item.profit85)}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div id="Lodestone" className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 scroll-mt-24">
                  <div className="flex items-center mb-6">
                    <RefreshCw className="w-8 h-8 mr-3 text-yellow-400" />
                    <a href="#conversions#Lodestone" className="text-2xl font-bold text-white hover:text-cyan-300">
                      {t('craftingPage.coreConversions', 'Core → Lodestone conversions')}
                    </a>
                  </div>
                  <div className="mb-6 flex justify-center">
                    <Link
                      href="/conversion-guide-core"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-5 h-5" />
                      {t('magicPage.coreConversionButton', 'HOW TO CONVERT CORES TO LODESTONES')}
                    </Link>
                  </div>
                  {isLoadingConversions ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="animate-spin text-blue-400" size={48} />
                      <p className="ml-4 text-white text-lg">{t('craftingPage.loadingConversionData', 'Loading conversion data...')}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden text-sm">
                        <thead className="bg-gray-600">
                          <tr>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200 whitespace-nowrap">{t('craftingPage.table.material', 'Material')}</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200 whitespace-nowrap">{t('craftingPage.table.price90', 'Price 90%')}</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200 whitespace-nowrap">{t('conversionGuideCorePage.totalCost', 'Best price')}</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-200 whitespace-nowrap">{t('craftingPage.table.profitSS90', 'Profit SS 90%')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memoizedCoreConversionData.map((item, index) => (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="border-b border-gray-600 last:border-b-0 hover:bg-gray-600"
                            >
                              <td className="py-3 px-4 text-white">
                                <WikiItemLink name={item.name} itemId={item.id} className="flex items-center gap-2 hover:text-cyan-300">
                                {item.icon && (
                                  <OptimizedImage
                                    src={item.icon}
                                    alt={item.name}
                                    className="w-8 h-8 rounded"
                                    priority
                                  />
                                )}
                                {item.name}
                                </WikiItemLink>
                              </td>
                              <td
                                className="py-3 px-4 text-white whitespace-nowrap min-w-[100px]"
                                style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', overflow: 'hidden' }}
                              >
                                <span style={{
                                  display: 'flex',
                                  whiteSpace: 'nowrap',
                                  wordBreak: 'keep-all',
                                  overflow: 'hidden',
                                  flexWrap: 'nowrap',
                                  alignItems: 'center'
                                }}>
                                  {memoizedFormatGoldSilverCopperJSX(item.precio90)}
                                </span>
                              </td>
                              <td
                                className="py-3 px-4 text-white whitespace-nowrap min-w-[120px]"
                                style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', overflow: 'hidden' }}
                              >
                                <span style={{
                                  display: 'flex',
                                  whiteSpace: 'nowrap',
                                  wordBreak: 'keep-all',
                                  overflow: 'hidden',
                                  flexWrap: 'nowrap',
                                  alignItems: 'center'
                                }}>
                                  {memoizedFormatGoldSilverCopperJSX(item.costeConv20)}
                                </span>
                              </td>
                              <td
                                className={`py-3 px-4 text-white font-semibold whitespace-nowrap min-w-[120px] ${getProfitColor(item.profit90)}`}
                                style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', overflow: 'hidden' }}
                              >
                                <span style={{
                                  display: 'flex',
                                  whiteSpace: 'nowrap',
                                  wordBreak: 'keep-all',
                                  overflow: 'hidden',
                                  flexWrap: 'nowrap',
                                  alignItems: 'center'
                                }}>
                                  {memoizedFormatGoldSilverCopperJSX(item.profit90)}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Unbound Magic Section */}
            {selectedSection === 'unbound-magic' && (
              <div className="space-y-8">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <OptimizedImage 
                      src="/images/expansions/unbound-magic.webp" 
                      alt={t('craftingPage.unboundMagic', 'Magia Liberada')} 
                      className="mr-3"
                      priority
                    />
                    {t('craftingPage.unboundMagic', 'Magia Liberada')}
                  </h2>
                  
                  {/* Descripción principal */}
                  <div className="bg-gray-700/50 rounded-lg p-6 mb-6 border border-gray-600">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <OptimizedImage 
                        src="/images/expansions/unbound-magic.webp" 
                        alt={t('craftingPage.unboundMagic', 'Magia Liberada')} 
                        className="mr-3"
                        priority
                      />
                      {t('craftingPage.whatIsUnboundMagic', '¿Qué es la Magia Liberada?')}
                    </h3>
                    <p className="text-gray-300 mb-4">
                      {t('craftingPage.unboundMagicDesc', 'La Magia Liberada es una divisa almacenada en la cartera y es la divisa principal de la 3.ª temporada del Mundo Viviente.')}
                    </p>
                  </div>

                  {/* Sección de Consumibles de Magia Liberada */}
                  <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-6 mb-6 border border-purple-500/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <OptimizedImage 
                        src="/images/expansions/unbound-magic.webp" 
                        alt={t('craftingPage.unboundMagic', 'Magia Liberada')} 
                        className="mr-1"
                        priority
                      />
                      {t('craftingPage.unboundMagicConsumables', 'Consumibles de Magia Liberada')}
                    </h3>
                    <p className="text-gray-300 mb-4 text-sm">
                      {t('craftingPage.unboundMagicConsumablesDesc', 'Estos consumibles dan esta cantidad de Magia Liberada')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { id: 79280, quantity: 36 },
                        { id: 79469, quantity: 36 },
                        { id: 79899, quantity: 22 },
                        { id: 80332, quantity: 36 },
                        { id: 81127, quantity: 36 },
                        { id: 81706, quantity: 22 }
                      ].map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 hover:border-purple-500/50 transition-all">
                          {tableItemIcons[item.id] ? (
                            <OptimizedImage
                              src={tableItemIcons[item.id]}
                              alt={tableItemNames[item.id] || `Item ${item.id}`}
                              className="w-12 h-12 rounded flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-700 rounded animate-pulse flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm truncate">
                              {tableItemNames[item.id] || t('craftingPage.loading', 'Cargando...')}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {t('craftingPage.quantity', 'Cantidad')}: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sección de cálculos para UM - OCULTA */}
                  <div className="hidden">
                    <div className="bg-gradient-to-r from-green-800/50 to-green-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-green-600/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">🕵️ Sistema Completo de Cálculos - ProfiMax de UM (MAGIA LIBERADA)</h3>
                    </div>
                    
                    {/* Primera parte: Ingredientes para Freshwater Pearl */}
                    <div className="mb-4 p-3 bg-green-900/30 rounded-lg border border-green-600/30">
                      <h4 className="text-green-300 font-semibold mb-3 text-sm">📊 PRIMERA PARTE: Ingredientes Freshwater Pearl (76179)</h4>
                      
                      {/* Item 89271 × 48 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                        <div className="text-cyan-300 text-sm">
                          <strong>Item 89271 × 48 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x48Price())}
                        </div>
                      </div>
                      
                      {/* Item 76179 × 3 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="text-green-300 text-sm">
                          <strong>Item 76179 × 3 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem76179x3Price())}
                        </div>
                      </div>
                      
                      {/* Item 89103 × 3 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>Item 89103 × 3 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89103x3Price())}
                        </div>
                      </div>
                      
                      {/* Item 19721 × 15 (sell × 0.9) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <div className="text-purple-300 text-sm">
                          <strong>Item 19721 × 15 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x15Price())}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-green-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🏆 SUMA TOTAL (89271×48 + 76179×3 + 89103×3 + 19721×15):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x48Price() + calculateItem76179x3Price() + calculateItem89103x3Price() + calculateItem19721x15Price())}
                        </div>
                      </div>
                      
                      {/* Item 99965 (sell × 0.85) */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <div className="text-red-300 text-sm font-bold">
                          <strong>🔴 Item 99965 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem99965Price())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-green-600/30">
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                        <div className="text-purple-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL (99965 - SUMA TOTAL):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinal76179())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                        <div className="text-indigo-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE (SI S29&gt;=1, (S29/N27)*E30, &quot;0&quot;):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprate76179())}
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Nueva sección de cálculos para UM - OCULTA */}
                  <div className="hidden bg-gradient-to-r from-blue-800/50 to-blue-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-blue-600/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">🚀 Sistema de Cálculos Maguuma Lily (70957)</h3>
                    </div>
                    
                    {/* Primera parte: Ingredientes para Maguuma Lily */}
                    <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-600/30">
                      <h4 className="text-blue-300 font-semibold mb-3 text-sm">📊 PRIMERA PARTE: Ingredientes Maguuma Lily (70957)</h4>
                      
                      {/* Item 89271 × 48 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                        <div className="text-cyan-300 text-sm">
                          <strong>Item 89271 × 48 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x48Price())}
                        </div>
                      </div>
                      
                      {/* Item 70957 × 3 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="text-green-300 text-sm">
                          <strong>Item 70957 × 3 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem70957x3Price())}
                        </div>
                      </div>
                      
                      {/* Item 89103 × 3 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>Item 89103 × 3 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89103x3Price())}
                        </div>
                      </div>
                      
                      {/* Item 19721 × 15 (sell × 0.9) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <div className="text-purple-300 text-sm">
                          <strong>Item 19721 × 15 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x15Price())}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-blue-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🏆 SUMA TOTAL (89271×48 + 70957×3 + 89103×3 + 19721×15):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x48Price() + calculateItem70957x3Price() + calculateItem89103x3Price() + calculateItem19721x15Price())}
                        </div>
                      </div>
                      
                      {/* Item 100693 (sell × 0.85) */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <div className="text-red-300 text-sm font-bold">
                          <strong>🔴 Item 100693 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem100693Price())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-blue-600/30">
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                        <div className="text-purple-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL (100693 - SUMA TOTAL):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinal70957())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                        <div className="text-indigo-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE (SI I22&gt;=1, (I22/D20)*F30, &quot;0&quot;):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprate70957())}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tercera sección de cálculos para UM - OCULTA */}
                  <div className="hidden bg-gradient-to-r from-purple-800/50 to-purple-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-600/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">⚡ Sistema de Cálculos Item 48911</h3>
                    </div>

                    
                    {/* Primera parte: Ingredientes para nuevo item */}
                    <div className="mb-4 p-3 bg-purple-900/30 rounded-lg border border-purple-600/30">
                      <h4 className="text-purple-300 font-semibold mb-3 text-sm">📊 PRIMERA PARTE: Ingredientes Nuevo Item</h4>
                      
                      {/* Item 89271 × 15 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                        <div className="text-cyan-300 text-sm">
                          <strong>Item 89271 × 15 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x15Price())}
                        </div>
                      </div>
                      
                      {/* Item 48884 × 100 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="text-green-300 text-sm">
                          <strong>Item 48884 × 100 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem48884x100Price())}
                        </div>
                      </div>
                      
                      {/* Item 89182 × 1 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>Item 89182 × 1 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89182x1Price())}
                        </div>
                      </div>
                      
                      {/* Item 19721 × 10 (sell × 0.9) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <div className="text-purple-300 text-sm">
                          <strong>Item 19721 × 10 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x10Price())}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-purple-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🏆 SUMA TOTAL (89271×12 + 24305×1 + 89258×1 + 19721×5):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x12Price() + calculateItem24305x1Price() + calculateItem89258x1Price() + calculateItem19721x5Price())}
                        </div>
                      </div>
                      
                      {/* Item 48911 (sell × 0.85) */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <div className="text-red-300 text-sm font-bold">
                          <strong>🔴 Item 24824 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24824Price())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-purple-600/30">
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                        <div className="text-purple-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL (24824 - SUMA TOTAL):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinal24824())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                        <div className="text-indigo-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE (SI S8&gt;=1, I30*(S8/100), &quot;0&quot;):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprate24824())}
                        </div>
                      </div>
                    </div>
                  </div>
                    
                  <h3 className="text-xl font-bold text-white mb-6 text-center">
                    {t('craftingPage.whatToSpendUnbound', '¿En qué gastar la magia liberada?')}
                  </h3>
                  
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-3">
                      <OptimizedImage 
                        src={tableItemIcons[79186] || "https://wiki.guildwars2.com/images/f/ff/Magic-Warped_Bundle.png"} 
                        alt={tableItemNames[79186] || 'Magic-Warped Bundle'} 
                        className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
                      />
                      <h4 className="text-lg font-semibold text-white">
                        {tableItemNames[79186] || 'Magic-Warped Bundle'}
                      </h4>
                    </div>
                  </div>
                  
                  {/* Resumen de ganancias */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-gray-700 rounded p-2 sm:p-3 border border-gray-600">
                      <h6 className="text-xs font-bold text-gray-300 mb-2 text-center">{t('craftingPage.table.totalBox', 'Total Caja')}</h6>
                      <div className="text-center">
                        <p className="text-green-400 font-bold text-sm sm:text-lg">
                          {t('craftingPage.table.min', 'Min')}: {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateTotalUMBasePrice())}
                        </p>
                        <p className="text-green-400 font-bold text-sm sm:text-lg">
                          {t('craftingPage.table.max', 'Max')}: {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateTotalProfitMaxUM())}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded p-2 sm:p-3 border border-gray-600">
                      <h6 className="text-xs font-bold text-gray-300 mb-2 text-center">{t('craftingPage.table.profitBox', 'Profit Caja')}</h6>
                      <div className="text-center">
                        <p className="text-yellow-400 font-bold text-sm sm:text-lg">
                          {t('craftingPage.table.min', 'Min')}: {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateTotalUMBasePrice() - 1)}
                        </p>
                        <p className="text-yellow-400 font-bold text-sm sm:text-lg">
                          {t('craftingPage.table.max', 'Max')}: {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateTotalProfitMaxUM() - 1)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded p-2 sm:p-3 border border-gray-600 sm:col-span-2 lg:col-span-1">
                      <h6 className="text-xs font-bold text-gray-300 mb-2 text-center">{t('craftingPage.table.profitUM', 'Profit UM')}</h6>
                      <div className="text-center">
                        <p className="text-blue-400 font-bold text-sm sm:text-lg">
                          {t('craftingPage.table.min', 'Min')}: {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateProfitUMMin())}
                        </p>
                        <p className="text-blue-400 font-bold text-sm sm:text-lg">
                          {t('craftingPage.table.max', 'Max')}: {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price((calculateTotalProfitMaxUM() - 1) / 500)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Calculadora de Magia Liberada */}
                  <div className="bg-cyan-900/20 backdrop-blur-sm border border-cyan-700/30 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <OptimizedImage 
                        src="/images/expansions/unbound-magic.webp" 
                        alt="Magia Liberada" 
                        className="w-8 h-8"
                      />
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        {t('craftingPage.unboundMagicCalculator', 'Calculadora de Magia Liberada')}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Input de cantidad */}
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-cyan-600/30">
                        <label className="block text-cyan-300 text-sm font-semibold mb-2">
                          {t('craftingPage.yourUnboundMagic', 'Tu Magia Liberada')}:
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={userUnboundMagic}
                          onChange={(e) => setUserUnboundMagic(e.target.value)}
                          placeholder="0"
                          className="w-full bg-gray-700 border border-cyan-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50"
                        />
                      </div>
                      
                      {/* Resultado */}
                      <div className="bg-gradient-to-r from-cyan-800/30 to-cyan-700/30 rounded-lg p-4 border border-cyan-600/30">
                        <h4 className="text-cyan-300 text-sm font-semibold mb-2">
                          {t('craftingPage.estimatedProfit', 'Profit Estimado')} ({t('craftingPage.table.min', 'Min')}):
                        </h4>
                        <p className="text-2xl sm:text-3xl font-bold text-cyan-300">
                          {isLoadingPrices ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : userUnboundMagic && parseFloat(userUnboundMagic) > 0 ? (
                            formatGW2Price(
                              truncateGW2Price(calculateProfitUMMin()) * parseFloat(userUnboundMagic)
                            )
                          ) : (
                            formatGW2Price(0)
                          )}
                        </p>
                        <p className="text-xs text-cyan-400 mt-2">
                          {t('craftingPage.basedOnProfitUM', 'Basado en Profit UM mínimo')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Nueva Sección Visible - OCULTA */}
                  <div className="bg-gradient-to-r from-green-800/50 to-blue-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-green-600/50 hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">🆕 Nueva Sección de Análisis</h3>
                    </div>
                    
                    <div className="mb-4 p-3 bg-green-900/30 rounded-lg border border-green-600/30">
                      <h4 className="text-green-300 font-semibold mb-3 text-sm">📊 INGREDIENTES DEL ITEM</h4>
                      
                      {/* Item 89271 × 10 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="text-green-300 text-sm">
                          <strong>Item 89271 × 10 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x10Price())}
                        </div>
                      </div>
                      
                      {/* Item 24315 × 1 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="text-green-300 text-sm">
                          <strong>Item 24315 × 1 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24315x1Price())}
                        </div>
                      </div>
                      
                      {/* Item 89182 × 2 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="text-green-300 text-sm">
                          <strong>Item 89182 × 2 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89182x2Price())}
                        </div>
                      </div>
                      
                      {/* Item 19721 × 10 (sell × 0.9) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="text-green-300 text-sm">
                          <strong>Item 19721 × 10 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x10Price())}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>SUMA TOTAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateSumaTotalNuevaSeccion())}
                        </div>
                      </div>
                      
                      {/* Item Resultado */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="text-red-300 text-sm">
                          <strong>Item 24609 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24609Price())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-green-600/30">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <div className="text-green-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalNuevaSeccion())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-green-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateNuevaSeccion())}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nueva Sección Rápida - OCULTA */}
                  <div className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-600/50 hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">⚡ Sección Rápida</h3>
                    </div>
                    
                    <div className="mb-4 p-3 bg-purple-900/30 rounded-lg border border-purple-600/30">
                      <h4 className="text-purple-300 font-semibold mb-3 text-sm">📊 INGREDIENTES</h4>
                      
                      {/* Item 89271 × 4 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <div className="text-purple-300 text-sm">
                          <strong>Item 89271 × 4 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x4Price())}
                        </div>
                      </div>
                      
                      {/* Item 24320 × 1 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <div className="text-purple-300 text-sm">
                          <strong>Item 24320 × 1 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24320x1Price())}
                        </div>
                      </div>
                      
                      {/* Item 89216 × 3 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <div className="text-purple-300 text-sm">
                          <strong>Item 89216 × 3 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89216x3Price())}
                        </div>
                      </div>
                      
                      {/* Item 19721 × 5 (sell × 0.9) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <div className="text-purple-300 text-sm">
                          <strong>Item 19721 × 5 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x5Price())}
                        </div>
                      </div>                    
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>SUMA TOTAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateSumaTotalSeccionRapida())}
                        </div>
                      </div>
                      
                      {/* Item Resultado */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="text-red-300 text-sm">
                          <strong>Item 24839 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24839Price())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-purple-600/30">
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                        <div className="text-purple-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalSeccionRapida())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-purple-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateSeccionRapida())}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nueva Sección 2 - OCULTA */}
                  <div className="bg-gradient-to-r from-orange-800/50 to-orange-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-orange-600/50 hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">🔥 Nueva Sección 2</h3>
                    </div>
                    
                    <div className="mb-4 p-3 bg-orange-900/30 rounded-lg border border-orange-600/30">
                      <h4 className="text-orange-300 font-semibold mb-3 text-sm">📊 INGREDIENTES</h4>
                      
                      {/* Item 89271 × 12 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                        <div className="text-orange-300 text-sm">
                          <strong>Item 89271 × 12 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x12Price())}
                        </div>
                      </div>
                      
                      {/* Item 24325 × 1 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                        <div className="text-orange-300 text-sm">
                          <strong>Item 24325 × 1 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24325x1Price())}
                        </div>
                      </div>
                      
                      {/* Item 89103 × 1 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                        <div className="text-orange-300 text-sm">
                          <strong>Item 89103 × 1 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89103x1Price())}
                        </div>
                      </div>
                      
                      {/* Item 19721 × 5 (sell × 0.9) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                        <div className="text-orange-300 text-sm">
                          <strong>Item 19721 × 5 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x5Price2())}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>SUMA TOTAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateSumaTotalNuevaSeccion2())}
                        </div>
                      </div>
                      
                      {/* Item Resultado */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="text-red-300 text-sm">
                          <strong>Item 24800 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24800Price())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-orange-600/30">
                        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        <div className="text-orange-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalNuevaSeccion2())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-orange-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateNuevaSeccion2())}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nueva Sección 3 - OCULTA */}
                  <div className="bg-gradient-to-r from-pink-800/50 to-pink-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-pink-600/50 hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">💖 Nueva Sección 3</h3>
                    </div>
                    
                    <div className="mb-4 p-3 bg-pink-900/30 rounded-lg border border-pink-600/30">
                      <h4 className="text-pink-300 font-semibold mb-3 text-sm">📊 INGREDIENTES</h4>
                      
                      {/* Item 89271 × 48 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                        <div className="text-pink-300 text-sm">
                          <strong>Item 89271 × 48 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x48Price())}
                        </div>
                      </div>
                      
                      {/* Item 24330 × 3 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                        <div className="text-pink-300 text-sm">
                          <strong>Item 24330 × 3 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24330x3Price())}
                        </div>
                      </div>
                      
                      {/* Item 89258 × 3 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                        <div className="text-pink-300 text-sm">
                          <strong>Item 89258 × 3 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89258x3Price())}
                        </div>
                      </div>
                      
                      {/* Item 19721 × 15 (sell × 0.9) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                        <div className="text-pink-300 text-sm">
                          <strong>Item 19721 × 15 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x15Price())}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>SUMA TOTAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateSumaTotalNuevaSeccion3())}
                        </div>
                      </div>
                      
                      {/* Item Resultado */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="text-red-300 text-sm">
                          <strong>Item 100527 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem100527Price())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-pink-600/30">
                        <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                        <div className="text-pink-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalNuevaSeccion3())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-pink-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateNuevaSeccion3())}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nueva Sección 4 - OCULTA */}
                  <div className="bg-gradient-to-r from-indigo-800/50 to-indigo-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-indigo-600/50 hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">💙 Nueva Sección 4</h3>
                    </div>
                    
                    <div className="mb-4 p-3 bg-indigo-900/30 rounded-lg border border-indigo-600/30">
                      <h4 className="text-indigo-300 font-semibold mb-3 text-sm">📊 INGREDIENTES</h4>
                      
                      {/* Item 89271 × 15 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                        <div className="text-indigo-300 text-sm">
                          <strong>Item 89271 × 15 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x15Price())}
                        </div>
                      </div>
                      
                      {/* Item 68942 × 1 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                        <div className="text-indigo-300 text-sm">
                          <strong>Item 68942 × 1 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem68942x1Price())}
                        </div>
                      </div>
                      
                      {/* Item 89098 × 1 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                        <div className="text-indigo-300 text-sm">
                          <strong>Item 89098 × 1 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89098x1Price())}
                        </div>
                      </div>
                      
                      {/* Item 19721 × 10 (sell × 0.9) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                        <div className="text-indigo-300 text-sm">
                          <strong>Item 19721 × 10 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x10Price())}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>SUMA TOTAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateSumaTotalNuevaSeccion4())}
                        </div>
                      </div>
                      
                      {/* Item Resultado */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="text-red-300 text-sm">
                          <strong>Item 74326 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem74326Price())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-indigo-600/30">
                        <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                        <div className="text-indigo-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalNuevaSeccion4())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-indigo-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateNuevaSeccion4())}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nueva Sección 5 - OCULTA */}
                  <div className="bg-gradient-to-r from-teal-800/50 to-teal-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-teal-600/50 hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">🌊 Nueva Sección 5</h3>
                    </div>
                    
                    <div className="mb-4 p-3 bg-teal-900/30 rounded-lg border border-teal-600/30">
                      <h4 className="text-teal-300 font-semibold mb-3 text-sm">📊 INGREDIENTES</h4>
                      
                      {/* Ingrediente 1: 89271 x12 buy */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                        <div className="text-teal-300 text-sm">
                          <strong>89271 x12 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x12Price())}
                        </div>
                      </div>
                      
                      {/* Ingrediente 2: 24335 x1 buy */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                        <div className="text-teal-300 text-sm">
                          <strong>24335 x1 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24335x1Price())}
                        </div>
                      </div>
                      
                      {/* Ingrediente 3: 89103 x1 buy */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                        <div className="text-teal-300 text-sm">
                          <strong>89103 x1 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89103x1Price())}
                        </div>
                      </div>
                      
                      {/* Ingrediente 4: 19721 x5 sell *0.9 */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                        <div className="text-teal-300 text-sm">
                          <strong>19721 x5 (sell *0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x5Price())}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>SUMA TOTAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateSumaTotalNuevaSeccion5())}
                        </div>
                      </div>
                      
                      {/* Item Resultado: 24762 sell *0.85 */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="text-red-300 text-sm">
                          <strong>24762 (sell *0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24762Price())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-teal-600/30">
                        <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
                        <div className="text-teal-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalNuevaSeccion5())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-teal-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateNuevaSeccion5())}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nueva Sección 6 - OCULTA */}
                  <div className="bg-gradient-to-r from-rose-800/50 to-rose-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-rose-600/50 hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">🌹 Nueva Sección 6</h3>
                    </div>
                    
                    <div className="mb-4 p-3 bg-rose-900/30 rounded-lg border border-rose-600/30">
                      <h4 className="text-rose-300 font-semibold mb-3 text-sm">📊 INGREDIENTES</h4>
                      
                      {/* Ingrediente 1: 89271 x48 buy */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                        <div className="text-rose-300 text-sm">
                          <strong>89271 x48 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x48Price())}
                        </div>
                      </div>
                      
                      {/* Ingrediente 2: 72504 x15 buy */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                        <div className="text-rose-300 text-sm">
                          <strong>72504 x15 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem72504x15Price())}
                        </div>
                      </div>
                      
                      {/* Ingrediente 3: 89103 x3 buy */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                        <div className="text-rose-300 text-sm">
                          <strong>89103 x3 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89103x3Price())}
                        </div>
                      </div>
                      
                      {/* Ingrediente 4: 19721 x15 sell *0.9 */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                        <div className="text-rose-300 text-sm">
                          <strong>19721 x15 (sell *0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x15Price())}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>SUMA TOTAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateSumaTotalNuevaSeccion6())}
                        </div>
                      </div>
                      
                      {/* Item Resultado: 100429 sell *0.85 */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="text-red-300 text-sm">
                          <strong>100429 (sell *0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem100429Price())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-rose-600/30">
                        <div className="w-4 h-4 bg-rose-500 rounded-full"></div>
                        <div className="text-rose-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalNuevaSeccion6())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-rose-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprateNuevaSeccion6())}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección Crafting Item 24289 (Escama blindada) - OCULTA */}
                  <div className="bg-gradient-to-r from-cyan-800/50 to-cyan-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-cyan-600/50 hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">🛡️ Crafting Item 24289 (Escama blindada)</h3>
                    </div>
                    
                    <div className="mb-4 p-3 bg-cyan-900/30 rounded-lg border border-cyan-600/30">
                      <h4 className="text-cyan-300 font-semibold mb-3 text-sm">📊 INGREDIENTES</h4>
                      
                      {/* Ingrediente 1: 89271 x4 buy */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                        <div className="text-cyan-300 text-sm">
                          <strong>89271 x4 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x4Price24289())}
                        </div>
                      </div>
                      
                      {/* Ingrediente 2: 24289 x5 buy */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                        <div className="text-cyan-300 text-sm">
                          <strong>24289 x5 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24289x5Price())}
                        </div>
                      </div>
                      
                      {/* Ingrediente 3: 89258 x3 buy */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                        <div className="text-cyan-300 text-sm">
                          <strong>89258 x3 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89258x3Price24289())}
                        </div>
                      </div>
                      
                      {/* Ingrediente 4: 19721 x5 sell *0.9 */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                        <div className="text-cyan-300 text-sm">
                          <strong>19721 x5 (sell *0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x5Price24289())}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>SUMA TOTAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateSumaTotalSeccion24289())}
                        </div>
                      </div>
                      
                      {/* Item Resultado: 24821 sell *0.85 */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="text-red-300 text-sm">
                          <strong>24821 (sell *0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24821Price())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-cyan-600/30">
                        <div className="w-4 h-4 bg-cyan-500 rounded-full"></div>
                        <div className="text-cyan-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalSeccion24289())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE UM */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-cyan-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE UM:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax24289())}
                        </div>
                      </div>
                      <div className="text-cyan-400 text-xs ml-6 mb-2">
                        Fórmula: SI(I22{'>'}=1, (I22/D20)*F5, &quot;0&quot;) donde I22=Resultado Final, D20=5, F5=0.436
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE VM */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-cyan-600/30">
                        <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                        <div className="text-green-300 text-sm font-bold">
                          <strong>🌟 RESULTADO FINAL CON DROPRATE VM:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateVMProfitMax24289())}
                        </div>
                      </div>
                      <div className="text-cyan-400 text-xs ml-6 mb-2">
                        Fórmula: SI(I22{'>'}=1, (I22/D20)*F5, &quot;0&quot;) donde I22=Resultado Final, D20=5, F5=1.0078
                      </div>
                    </div>
                  </div>

                  {/* Nueva Sección 7 - OCULTA */}
                  <div className="bg-gradient-to-r from-emerald-800/50 to-emerald-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-emerald-600/50 hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">💚 Nueva Sección 7</h3>
                    </div>
                    
                    <div className="mb-4 p-3 bg-emerald-900/30 rounded-lg border border-emerald-600/30">
                      <h4 className="text-emerald-300 font-semibold mb-3 text-sm">📊 INGREDIENTES</h4>
                      
                      {/* Placeholder para ingredientes */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                        <div className="text-emerald-300 text-sm">
                          <strong>Ingrediente 1:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : '0.00 G'}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>SUMA TOTAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : '0.00 G'}
                        </div>
                      </div>
                      
                      {/* Item Resultado */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="text-red-300 text-sm">
                          <strong>Item Resultado:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : '0.00 G'}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-emerald-600/30">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                        <div className="text-emerald-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : '0.00 G'}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-emerald-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : '0.00 G'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección Crafting Item 24357 - OCULTA */}
                  <div className="bg-gradient-to-r from-amber-800/50 to-amber-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-amber-600/50 hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">⚔️ Crafting Item 24357 (Colmillo feroz)</h3>
                    </div>
                    
                    <div className="mb-4 p-3 bg-amber-900/30 rounded-lg border border-amber-600/30">
                      <h4 className="text-amber-300 font-semibold mb-3 text-sm">📊 INGREDIENTES</h4>
                      
                      {/* Ingrediente 1: 89271 x12 buy */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                        <div className="text-amber-300 text-sm">
                          <strong>89271 x12 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price((itemPrices[89271]?.buys?.unit_price || 0) * 12 / 10000)}
                        </div>
                      </div>
                      
                      {/* Ingrediente 2: 24357 x5 buy */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                        <div className="text-amber-300 text-sm">
                          <strong>24357 x5 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price((itemPrices[24357]?.buys?.unit_price || 0) * 5 / 10000)}
                        </div>
                      </div>
                      
                      {/* Ingrediente 3: 89216 x1 buy */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                        <div className="text-amber-300 text-sm">
                          <strong>89216 x1 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price((itemPrices[89216]?.buys?.unit_price || 0) * 1 / 10000)}
                        </div>
                      </div>
                      
                      {/* Ingrediente 4: 19721 x5 sell *0.9 */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                        <div className="text-amber-300 text-sm">
                          <strong>19721 x5 (sell *0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price((itemPrices[19721]?.sells?.unit_price || 0) * 5 * 0.9 / 10000)}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>SUMA TOTAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(
                            ((itemPrices[89271]?.buys?.unit_price || 0) * 12 / 10000) +
                            ((itemPrices[24357]?.buys?.unit_price || 0) * 5 / 10000) +
                            ((itemPrices[89216]?.buys?.unit_price || 0) * 1 / 10000) +
                            ((itemPrices[19721]?.sells?.unit_price || 0) * 5 * 0.9 / 10000)
                          )}
                        </div>
                      </div>
                      
                      {/* Item Resultado: 24815 sell *0.85 */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="text-red-300 text-sm">
                          <strong>24815 (sell *0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price((itemPrices[24815]?.sells?.unit_price || 0) * 0.85 / 10000)}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-amber-600/30">
                        <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                        <div className="text-amber-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(
                            ((itemPrices[24815]?.sells?.unit_price || 0) * 0.85 / 10000) - 
                            (((itemPrices[89271]?.buys?.unit_price || 0) * 12 / 10000) +
                             ((itemPrices[24357]?.buys?.unit_price || 0) * 5 / 10000) +
                             ((itemPrices[89216]?.buys?.unit_price || 0) * 1 / 10000) +
                             ((itemPrices[19721]?.sells?.unit_price || 0) * 5 * 0.9 / 10000))
                          )}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-amber-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE:</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax24357())}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nueva Sección de Cálculos Item s - OCULTA */}
                  <div className="bg-gradient-to-r from-cyan-800/50 to-cyan-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-cyan-600/50 hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">🔬 Análisis Destallado Item 48911</h3>
                    </div>
                    
                    {/* Nueva calculadora: Ingredientes del item */}
                    <div className="mb-4 p-3 bg-purple-900/30 rounded-lg border border-purple-600/30">
                      <h4 className="text-purple-300 font-semibold mb-3 text-sm">📊 INGREDIENTES DEL ITEM</h4>
                      
                      {/* Item 89271 × 5 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <div className="text-purple-300 text-sm">
                          <strong>Item 89271 × 5 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x5Price())}
                        </div>
                      </div>
                      
                      {/* Item 24310 × 1 (sell × 0.9) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="text-green-300 text-sm">
                          <strong>Item 24310 × 1 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24310x1Price())}
                        </div>
                      </div>
                      
                      {/* Item 89182 × 3 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <div className="text-purple-300 text-sm">
                          <strong>Item 89182 × 3 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89182x3Price())}
                        </div>
                      </div>

                       {/* Item 19721 × 10 (sell × 0.9) */}
                       <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <div className="text-purple-300 text-sm">
                          <strong>Item 19721 × 10 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x10Price())}
                        </div>
                      </div>
                      
                      {/* SUMA TOTAL (89271×12 + 24305×1 + 89258×1 + 19721×5) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>SUMA (89271x5 + 24310×1 + 89182×3 + 19721×5):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x5Price() + calculateItem24310x1Price() + calculateItem89182x3Price() + calculateItem19721x10Price())}
                        </div>
                      </div>
                      
                      {/* Item 74978 (sell × 0.85) */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="text-red-300 text-sm">
                          <strong>Item 24868 (sell × 0.85):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24868Price())}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL (74978 - SUMA TOTAL) */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-purple-600/30">
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                        <div className="text-purple-300 text-sm font-bold">
                          <strong>💎 RESULTADO FINAL (24868 - SUMA TOTAL):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24868Price() - (calculateItem89271x5Price() + calculateItem24310x1Price() + calculateItem89182x3Price() + calculateItem19721x10Price()))}
                        </div>
                      </div>
                      
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-purple-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE (SI I15&gt;=1, C36*I15, &quot;0&quot;):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprate24868())}
                        </div>
                      </div>
                    </div>
                    
                    
                    
                    {/* Primera parte: Ingredientes para nuevo item */}
                    <div className="hidden">
                    <div className="mb-4 p-3 bg-cyan-900/30 rounded-lg border border-cyan-600/30">
                      <h4 className="text-cyan-300 font-semibold mb-3 text-sm">📊 INGREDIENTES DEL ITEM</h4>
                      
                      {/* Item 89271 × 12 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                        <div className="text-cyan-300 text-sm">
                          <strong>Item 89271 × 12 (buy):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x12Price())}
                        </div>
                      </div>
                      
                      {/* Item 48884 × 100 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div className="text-green-300 text-sm">
                          <strong>Item 24305 × 1 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem24305x1Price())}
                        </div>
                      </div>
                      
                      {/* Item 89182 × 1 (buy) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="text-blue-300 text-sm">
                          <strong>Item 89258 × 1 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89258x1Price())}
                        </div>
                      </div>
                      
                      {/* Item 19721 × 10 (sell × 0.9) */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <div className="text-purple-300 text-sm">
                            <strong>Item 19721 × 5 (sell × 0.9):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem19721x5Price())}
                        </div>
                      </div>
                      
                      {/* Suma Total */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-cyan-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🏆 SUMA TOTAL (89271×12 + 24305×1 + 89258×1 + 19721×5):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItem89271x12Price() + calculateItem24305x1Price() + calculateItem89258x1Price() + calculateItem19721x5Price())}
                        </div>
                      </div>
                    </div>

                    {/* Tercera parte: Resultado final */}
                    <div className="mb-4 p-3 bg-cyan-900/30 rounded-lg border border-cyan-600/30">
                      <h4 className="text-cyan-300 font-semibold mb-3 text-sm">⚡ RESULTADO FINAL</h4>
                                            
                      {/* RESULTADO FINAL CON DROPRATE */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-cyan-600/30">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="text-yellow-300 text-sm font-bold">
                          <strong>🚀 RESULTADO FINAL CON DROPRATE (SI S8&gt;=1, I30*(S8/100), &quot;0&quot;):</strong> {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateResultadoFinalConDroprate24824())}
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>

                  {/* Sección de Valores Separados de UM - OCULTA */}
                  <div className="bg-gradient-to-r from-green-800/50 to-green-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-green-600/50 hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">📊 Desglose de ProfitMax UM</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Raros UM */}
                      <div className="bg-green-900/30 rounded-lg p-3 border border-green-600/30">
                        <h4 className="text-green-300 font-semibold mb-2 text-sm">🔮 Raros UM</h4>
                        <div className="text-center">
                          <p className="text-green-400 font-bold text-lg">
                            {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateRarosUM())}
                          </p>
                        </div>
                      </div>

                      {/* Trofeos Raros UM */}
                      <div className="bg-green-900/30 rounded-lg p-3 border border-green-600/30">
                        <h4 className="text-green-300 font-semibold mb-2 text-sm">🏆 Trofeos Raros UM</h4>
                        <div className="text-center">
                          <p className="text-green-400 font-bold text-lg">
                            {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateTrofeosRarosUM())}
                          </p>
                        </div>
                      </div>

                      {/* Items Individuales UM */}
                      <div className="bg-green-900/30 rounded-lg p-3 border border-green-600/30">
                        <h4 className="text-green-300 font-semibold mb-2 text-sm">⚡ Items Individuales UM</h4>
                        <div className="text-center">
                          <p className="text-green-400 font-bold text-lg">
                            {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateItemsIndividualesUM())}
                          </p>
                        </div>
                      </div>

                      {/* Caja UM */}
                      <div className="bg-green-900/30 rounded-lg p-3 border border-green-600/30">
                        <h4 className="text-green-300 font-semibold mb-2 text-sm">📦 Caja UM</h4>
                        <div className="text-center">
                          <p className="text-green-400 font-bold text-lg">
                            {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateCajaUM())}
                          </p>
                        </div>
                      </div>

                      {/* Min TotalCaja UM */}
                      <div className="bg-green-900/30 rounded-lg p-3 border border-green-600/30">
                        <h4 className="text-green-300 font-semibold mb-2 text-sm">📊 Min TotalCaja UM</h4>
                        <div className="text-center">
                          <p className="text-green-400 font-bold text-lg">
                            {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateTotalUMBasePrice())}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="mt-4 pt-4 border-t border-green-600/30">
                      <div className="text-center">
                        <h4 className="text-yellow-300 font-semibold mb-2 text-sm">💰 TOTAL UM</h4>
                        <p className="text-yellow-400 font-bold text-xl">
                          {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateTotalProfitMaxUM())}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Data Source Info */}
                  <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-700/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 md:mb-8">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="text-blue-300 text-xs md:text-base">
                        <strong>{t('craftingPage.table.dataSource', 'Fuente de Datos')}:</strong> {t('craftingPage.table.basedOn', 'Análisis basado en')}{' '}
                        <span className="text-blue-200 font-bold">400k {tableItemNames[79186] || 'Magic-Warped Bundle'}</span> {t('craftingPage.table.opened', 'abiertos')}
                        <br />
                        <span className="text-blue-400 text-xs" dangerouslySetInnerHTML={{ __html: t('craftingPage.table.dataCredit', 'Datacredit: Vortus43') }}></span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Precios actualizados */}
                  <div className="bg-green-900/20 backdrop-blur-sm border border-green-700/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 md:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                        <div className="text-green-300 text-xs md:text-base">
                          <strong>{t('craftingPage.pricesUpdated', 'Precios actualizados:')}</strong> {lastPriceUpdate ? lastPriceUpdate.toLocaleTimeString('es-ES') : t('craftingPage.loading', 'Cargando...')}
                        </div>
                      </div>
                      <button
                        onClick={fetchTableItemPrices}
                        disabled={isLoadingPrices}
                        className="flex items-center justify-center gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors duration-200 w-full sm:w-auto"
                      >
                        <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoadingPrices ? 'animate-spin' : ''}`} />
                        {isLoadingPrices ? t('craftingPage.updating', 'Actualizando...') : t('craftingPage.refresh', 'Actualizar')}
                      </button>
                    </div>
                  </div>
                  
                  {/* Tabla de datos de trofeos para Magia Liberada */}
                  <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-4 md:p-6 shadow-2xl mb-4 sm:mb-6 md:mb-8">
                    <h5 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-3 sm:mb-4 text-center">📊 {t('craftingPage.analysisRewards', 'Análisis de Recompensas por')} {tableItemNames[79186] || 'Item 79186'}</h5>
                    
                    {/* Tabla de Trofeos Raros (Droprate 1.0078) */}
                    <div className="mb-6 sm:mb-8">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[400px] sm:min-w-[500px] md:min-w-[600px]">
                          <thead>
                            <tr className="border-b border-gray-700 bg-gray-800/60">
                              <th className="text-left p-2 sm:p-3 text-gray-200 font-semibold text-xs">{t('craftingPage.table.item', 'Item')}</th>
                              <th className="p-1 sm:p-2 md:p-3 text-center text-gray-200 font-semibold text-xs">{t('craftingPage.table.droprate', 'Droprate')}</th>
                              <th className="p-1 sm:p-2 md:p-3 text-center text-gray-200 font-semibold text-xs">{t('craftingPage.table.basePrice', 'Precio BASE')}</th>
                              <th className="p-1 sm:p-2 md:p-3 text-center text-gray-200 font-semibold text-xs">{t('craftingPage.table.profitMax', 'Profit Max')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src="https://render.guildwars2.com/file/1A930A6A7B5B01EAB4CB36E79014C12B500BF6B3/66950.png" 
                                    alt="Vial de sangre poderosa" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24295] || 'Vial de sangre poderosa'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24295)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24295, getUMDroprate(24295)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax24295())}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src="https://render.guildwars2.com/file/0EE45FBB1E1A004600E9BAA7097830B2DE08587D/66828.png" 
                                    alt="Hueso antiguo" 
                                    className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24358] || 'Hueso antiguo'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24358)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24358, getUMDroprate(24358)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax24358())}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src="https://render.guildwars2.com/file/043E2BBA270F381870F1B45E7C09C098CAFE3D14/66996.png" 
                                    alt="Garra despiadada" 
                                    className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24351] || 'Garra despiadada'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24351)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24351, getUMDroprate(24351)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">{isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax24351())}</td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src="https://render.guildwars2.com/file/F2050EE1A7A43EDCDCB1E971FDA608AD0566E4DA/66998.png" 
                                    alt="Colmillo feroz" 
                                    className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24357] || 'Colmillo feroz'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24357)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24357, getUMDroprate(24357)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">{isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax24357())}</td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src="https://render.guildwars2.com/file/7061C82F4F9D0C585742F545C40A0F06BE0154DC/66527.png" 
                                    alt="Escama blindada" 
                                    className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24289] || 'Escama blindada'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24289)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24289, getUMDroprate(24289)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">{isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax24289())}</td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src="https://render.guildwars2.com/file/C1ABF9082901FC3CEABC3138CBCCA1DAD5D41812/66955.png" 
                                    alt="Tótem elaborado" 
                                    className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24300] || 'Tótem elaborado'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24300)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24300, getUMDroprate(24300)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateUMProfitMax24300())}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src="https://render.guildwars2.com/file/543EC37900EA2A57E77FA891193A48D66AA224AB/66939.png" 
                                    alt="Vesícula de veneno poderoso" 
                                    className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24283] || 'Vesícula de veneno poderoso'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24283)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24283, getUMDroprate(24283)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateUMProfitMax24283() || 0)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src="https://render.guildwars2.com/file/080D00670558CD9E580D5662030394B2206E92A6/434537.png" 
                                    alt="Montón de polvo cristalino" 
                                    className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24277] || 'Montón de polvo cristalino'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24277)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24277, getUMDroprate(24277)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateUMProfitMax24277())}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[19721] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Glob of Ectoplasm" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[19721] || 'Glob of Ectoplasm'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(19721)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(19721, getUMDroprate(19721)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(19721))}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[24370] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Giant Eye" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24370] || 'Giant Eye'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24370)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24370, getUMDroprate(24370)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(24370))}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[68063] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Amalgamated Gemstone" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[68063] || 'Amalgamated Gemstone'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(68063)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(68063, getUMDroprate(68063)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(68063))}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[76179] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Freshwater Pearl" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[76179] || 'Freshwater Pearl'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(76179)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(76179, getUMDroprate(76179)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(76179))}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[70957] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Maguuma Lily" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[70957] || 'Maguuma Lily'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(70957)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(70957, getUMDroprate(70957)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(70957))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[19675] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Mystic Clover" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[19675] || 'Mystic Clover'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(19675)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(19675, getUMDroprate(19675)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(19675))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[37897] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Karka Shell" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[37897] || 'Karka Shell'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(37897)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(37897, getUMDroprate(37897)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(37897))}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[48884] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Pristine Toxic Spore Sample" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[48884] || 'Pristine Toxic Spore Sample'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(48884)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(48884, getUMDroprate(48884)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(48884))}
                              </td>
                            </tr>
                            
                            {/* Lodestones - Fila 3 */}
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[24305] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Charged Lodestone" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24305] || 'Charged Lodestone'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24305)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24305, getUMDroprate(24305)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(24305))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[24310] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Onyx Lodestone" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24310] || 'Onyx Lodestone'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24310)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24310, getUMDroprate(24310)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(24310))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[24315] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Molten Lodestone" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24315] || 'Molten Lodestone'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24315)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24315, getUMDroprate(24315)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(24315))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[24320] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Glacial Lodestone" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24320] || 'Glacial Lodestone'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24320)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24320, getUMDroprate(24320)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(24320))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[24325] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Destroyer Lodestone" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24325] || 'Destroyer Lodestone'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24325)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24325, getUMDroprate(24325)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(24325))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[24330] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Crystal Lodestone" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24330] || 'Crystal Lodestone'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24330)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24330, getUMDroprate(24330)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(24330))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[70842] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Mordrem Lodestone" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[70842] || 'Mordrem Lodestone'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(70842)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(70842, getUMDroprate(70842)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(70842))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[68942] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Evergreen Lodestone" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[68942] || 'Evergreen Lodestone'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(68942)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(68942, getUMDroprate(68942)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(68942))}
                              </td>
                            </tr>
                            
                            {/* Fila 4 - Items adicionales */}
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[24335] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Pile of Putrid Essence" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[24335] || 'Pile of Putrid Essence'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(24335)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(24335, getUMDroprate(24335)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(24335))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[72504] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Moonstone Orb" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[72504] || 'Moonstone Orb'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(72504)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(72504, getUMDroprate(72504)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(72504))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[76491] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Black Diamond" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[76491] || 'Black Diamond'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(76491)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(76491, getUMDroprate(76491)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(76491))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[75654] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Ebony Orb" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[75654] || 'Ebony Orb'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(75654)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(75654, getUMDroprate(75654)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(75654))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[72315] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Maguuma Burl" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[72315] || 'Maguuma Burl'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(72315)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(72315, getUMDroprate(72315)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(72315))}
                              </td>
                            </tr>
                            
                            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="p-2 sm:p-2 text-gray-300">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <OptimizedImage 
                                    src={tableItemIcons[74988] || "https://render.guildwars2.com/file/6B604A6F7A5A4A4A4A4A4A4A4A4A4A4A4A4A4A4A/66950.png"} 
                                    alt="Flax Blossom" 
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0"
                                    priority
                                  />
                                  <span className="text-xs truncate">{tableItemNames[74988] || 'Flax Blossom'}</span>
                                </div>
                              </td>
                              <td className="p-1 sm:p-1 md:p-2 text-center text-blue-400 font-semibold text-xs">{getUMDroprate(74988)}</td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-green-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : formatGW2Price(calculateBasePrice(74988, getUMDroprate(74988)))}
                              </td>
                              <td className="p-1 sm:p-2 md:p-3 text-center text-yellow-400 font-semibold text-xs whitespace-nowrap">
                                {isLoadingPrices ? t('craftingPage.calculating', 'Calculando...') : formatGW2Price(calculateUMProfitMax(74988))}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Separador visual */}
                    <div className="my-6 sm:my-8 border-t-2 border-gray-600/50"></div>
                    
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 text-center"
          >
            {/* Call to Action content can be added here */}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CraftingPage; 