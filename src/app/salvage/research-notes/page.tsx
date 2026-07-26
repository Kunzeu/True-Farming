'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Gem } from 'lucide-react';
import ResearchNotesPageLayout from '@/components/salvage/research-notes/ResearchNotesPageLayout';
import {
  getCraftingLevel,
  getPricePerNoteCopper,
  parsePriceCopper,
  type ResearchNotesCraftingItem,
  type ResearchNotesItemMeta,
  type ResearchNotesSortField,
} from '@/components/salvage/research-notes/research-notes-utils';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { FALLBACK_ITEMS, setApiOffline, setApiOnline } from '@/data/fallback-data';
import { formatGW2Currency } from '@/utils/gw2-currency';

interface GW2Item {
  id: number;
  name: string;
  description?: string;
  type: string;
  rarity: string;
  level: number;
  vendor_value: number;
  icon?: string;
}

interface GW2Price {
  id: number;
  whitelisted: boolean;
  buys: {
    unit_price: number;
    quantity: number;
  };
  sells: {
    unit_price: number;
    quantity: number;
  };
}

interface CraftingItem extends ResearchNotesCraftingItem {}

interface CraftingDiscipline {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: CraftingItem[];
}

export default function ResearchNotesPage() {
  usePageTitle('pageTitles.researchNotes', 'Research Notes - Salvaging');
  const { t, lang } = useI18n();
  
     // Estados para items
   const [item8868, setItem8868] = useState<GW2Item | null>(null);
   const [item13436, setItem13436] = useState<GW2Item | null>(null);
   const [item13437, setItem13437] = useState<GW2Item | null>(null);
   const [item13435, setItem13435] = useState<GW2Item | null>(null);
   const [item104934, setItem104934] = useState<GW2Item | null>(null);
   const [item104934B, setItem104934B] = useState<GW2Item | null>(null);
   const [item13438, setItem13438] = useState<GW2Item | null>(null);
    
     // Estados para precios de items
   const [price8868, setPrice8868] = useState<GW2Price | null>(null);
   const [price13436, setPrice13436] = useState<GW2Price | null>(null);
   const [price13437, setPrice13437] = useState<GW2Price | null>(null);
   const [price13435, setPrice13435] = useState<GW2Price | null>(null);
   const [price104934, setPrice104934] = useState<GW2Price | null>(null);
   const [price104934B, setPrice104934B] = useState<GW2Price | null>(null);
   const [price13438, setPrice13438] = useState<GW2Price | null>(null);
  
     // Estados para precios de materiales
   const [price19700, setPrice19700] = useState<GW2Price | null>(null);
   const [price24473, setPrice24473] = useState<GW2Price | null>(null);
   const [price24519, setPrice24519] = useState<GW2Price | null>(null);
   const [price24511, setPrice24511] = useState<GW2Price | null>(null);
  
  
   const [price24276, setPrice24276] = useState<GW2Price | null>(null);
   const [price24350, setPrice24350] = useState<GW2Price | null>(null);
   const [price24299, setPrice24299] = useState<GW2Price | null>(null);
   const [price12156, setPrice12156] = useState<GW2Price | null>(null);
   const [price19722, setPrice19722] = useState<GW2Price | null>(null);
   const [price19729, setPrice19729] = useState<GW2Price | null>(null);
   const [price19748, setPrice19748] = useState<GW2Price | null>(null);
   const [price68063, setPrice68063] = useState<GW2Price | null>(null);
   const [price24475, setPrice24475] = useState<GW2Price | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
     const [sortField, setSortField] = useState<ResearchNotesSortField>('craftingLevel');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [craftingPriceSide, setCraftingPriceSide] = useState<'buy' | 'sell'>('sell');

   const formatGW2Price = (copperPrice: number): string => formatGW2Currency(copperPrice);

  // Función para ordenar items por cualquier campo
  const sortItemsByField = useCallback((items: CraftingItem[]): CraftingItem[] => {
    return [...items].sort((a, b) => {
      let valueA: number;
      let valueB: number;
      
      switch (sortField) {
        case 'craftingLevel':
          valueA = getCraftingLevel(a.id || 0);
          valueB = getCraftingLevel(b.id || 0);
          break;
        case 'level':
          valueA = typeof a.level === 'string' ? parseInt(a.level) || 0 : a.level;
          valueB = typeof b.level === 'string' ? parseInt(b.level) || 0 : b.level;
          break;
        case 'notes':
          valueA = a.notes;
          valueB = b.notes;
          break;
        case 'buyPrice':
          valueA = parsePriceCopper(a.buyPrice);
          valueB = parsePriceCopper(b.buyPrice);
          break;
        case 'sellPrice':
          valueA = parsePriceCopper(a.sellPrice);
          valueB = parsePriceCopper(b.sellPrice);
          break;
                 case 'craftingCost':
           valueA = parsePriceCopper(a.craftingCost);
           valueB = parsePriceCopper(b.craftingCost);
           break;
         case 'pricePerNote':
           valueA = getPricePerNoteCopper(a) ?? 0;
           valueB = getPricePerNoteCopper(b) ?? 0;
           break;
         default:
           valueA = 0;
           valueB = 0;
      }
      
      if (sortOrder === 'desc') {
        return valueB - valueA; // Mayor a menor
      } else {
        return valueA - valueB; // Menor a mayor
      }
    });
  }, [sortField, sortOrder]);

     // Función para manejar el cambio de campo de ordenamiento
     const handleSortChange = (field: ResearchNotesSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Función para calcular el costo de crafting
  const calculateCraftingCost = useCallback((itemId: number): string => {
    // Si es el item 8868, calcular dinámicamente con 24276, 24350, 24299, 12156 x1 cada uno
    if (itemId === 8868 && price24276 && price24350 && price24299 && price12156) {
      const buyTotal = (price24276.buys?.unit_price || 0) * 1 + (price24350.buys?.unit_price || 0) * 1 + (price24299.buys?.unit_price || 0) * 1 + (price12156.buys?.unit_price || 0) * 1;
      const sellTotal = (price24276.sells?.unit_price || 0) * 1 + (price24350.sells?.unit_price || 0) * 1 + (price24299.sells?.unit_price || 0) * 1 + (price12156.sells?.unit_price || 0) * 1;
      const selected = craftingPriceSide === 'buy' ? buyTotal : sellTotal;
      return formatGW2Price(selected);
    }

    // Si es el item 13436, calcular dinámicamente con 24473 x1 y 19700 x8
    if (itemId === 13436 && price24473 && price19700) {
      const buyTotal = (price24473.buys?.unit_price || 0) * 1 + (price19700.buys?.unit_price || 0) * 8;
      const sellTotal = (price24473.sells?.unit_price || 0) * 1 + (price19700.sells?.unit_price || 0) * 8;
      const selected = craftingPriceSide === 'buy' ? buyTotal : sellTotal;
      return formatGW2Price(selected);
    }

    // Si es el item 13437, calcular dinámicamente con 24519 x1 y 19700 x8
    if (itemId === 13437 && price24519 && price19700) {
      const buyTotal = (price24519.buys?.unit_price || 0) * 1 + (price19700.buys?.unit_price || 0) * 8;
      const sellTotal = (price24519.sells?.unit_price || 0) * 1 + (price19700.sells?.unit_price || 0) * 8;
      const selected = craftingPriceSide === 'buy' ? buyTotal : sellTotal;
      return formatGW2Price(selected);
    }

         // Si es el item 13435, calcular dinámicamente con 24511 x1 y 19700 x8
     if (itemId === 13435 && price24511 && price19700) {
       const buyTotal = (price24511.buys?.unit_price || 0) * 1 + (price19700.buys?.unit_price || 0) * 8;
       const sellTotal = (price24511.sells?.unit_price || 0) * 1 + (price19700.sells?.unit_price || 0) * 8;
       const selected = craftingPriceSide === 'buy' ? buyTotal : sellTotal;
       return formatGW2Price(selected);
     }

    // Si es el item 13438, calcular dinámicamente con 19700 x8 y 24475 x1
    if (itemId === 13438 && price19700 && price24475) {
      const buyTotal = (price19700.buys?.unit_price || 0) * 8 + (price24475.buys?.unit_price || 0) * 1;
      const sellTotal = (price19700.sells?.unit_price || 0) * 8 + (price24475.sells?.unit_price || 0) * 1;
      const selected = craftingPriceSide === 'buy' ? buyTotal : sellTotal;
      return formatGW2Price(selected);
    }

    // Si es el item 104934, calcular dinámicamente con 19722 x30, 19700 x20, 19748 x30, 68063 x1
      if (itemId === 104934 && price19722 && price19700 && price19748 && price68063) {
        const buyTotal = (price19722.buys?.unit_price || 0) * 30 + (price19700.buys?.unit_price || 0) * 20 + (price19748.buys?.unit_price || 0) * 30 + (price68063.buys?.unit_price || 0) * 1;
        const sellTotal = (price19722.sells?.unit_price || 0) * 30 + (price19700.sells?.unit_price || 0) * 20 + (price19748.sells?.unit_price || 0) * 30 + (price68063.sells?.unit_price || 0) * 1;
        const selected = craftingPriceSide === 'buy' ? buyTotal : sellTotal;
        return formatGW2Price(selected);
      }

    // Si es el item 104934-B, calcular dinámicamente con 19729 x40, 19700 x20, 19748 x30, 68063 x1
      if (itemId === 104934.1 && price19729 && price19700 && price19748 && price68063) {
        const buyTotal = (price19729.buys?.unit_price || 0) * 40 + (price19700.buys?.unit_price || 0) * 20 + (price19748.buys?.unit_price || 0) * 30 + (price68063.buys?.unit_price || 0) * 1;
        const sellTotal = (price19729.sells?.unit_price || 0) * 40 + (price19700.sells?.unit_price || 0) * 20 + (price19748.sells?.unit_price || 0) * 30 + (price68063.sells?.unit_price || 0) * 1;
        const selected = craftingPriceSide === 'buy' ? buyTotal : sellTotal;
        return formatGW2Price(selected);
      }

     // Costos estimados para otros items
     const craftingCosts: { [key: number]: number } = {};
     
     const cost = craftingCosts[itemId] || 0;
     return formatGW2Price(cost);
  }, [price24276, price24350, price24299, price12156, price24473, price19700, price24519, price24511, price24475, price19722, price19748, price68063, price19729, craftingPriceSide]);

  // Obtener información de los items desde la API de GW2
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Intentar siempre la ruta online; fallback solo en catch
        
          // Obtener información de todos los items
          // OPTIMIZADO: Una sola llamada batch en lugar de 7 llamadas individuales
          const itemIds = [8868, 13436, 13437, 13435, 104934, 13438];
          const itemsResponse = await fetch(`https://api.guildwars2.com/v2/items?ids=${itemIds.join(',')}&lang=${lang}`, {
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate, br'
            },
            signal: AbortSignal.timeout(15000) // 15 segundos timeout
          });
          
          if (!itemsResponse.ok) {
            throw new Error('Failed to fetch items from GW2 API');
          }
          
          const itemsData = await itemsResponse.json();
          
          // Mapear resultados por ID
          const itemsMap: Record<number, any> = {};
          itemsData.forEach((item: any) => {
            itemsMap[item.id] = { json: () => Promise.resolve(item) };
          });
          
          // Mantener compatibilidad con código existente
          const item8868Response = itemsMap[8868];
          const item13436Response = itemsMap[13436];
          const item13437Response = itemsMap[13437];
          const item13435Response = itemsMap[13435];
          const item104934Response = itemsMap[104934];
          const item104934BResponse = itemsMap[104934];
          const item13438Response = itemsMap[13438];

         const [item8868Data, item13436Data, item13437Data, item13435Data, item104934Data, item104934BData, item13438Data] = await Promise.all([
           item8868Response?.json() || Promise.resolve(null),
           item13436Response?.json() || Promise.resolve(null),
           item13437Response?.json() || Promise.resolve(null),
           item13435Response?.json() || Promise.resolve(null),
           item104934Response?.json() || Promise.resolve(null),
           item104934BResponse?.json() || Promise.resolve(null),
           item13438Response?.json() || Promise.resolve(null)
         ]);

         setItem8868(item8868Data as any);
         setItem13436(item13436Data as any);
         setItem13437(item13437Data as any);
         setItem13435(item13435Data as any);
         setItem104934(item104934Data as any);
         setItem104934B(item104934BData as any);
         setItem13438(item13438Data as any);
         setApiOnline(); // Marcar API como online

          // Obtener precios de todos los items
        // OPTIMIZADO: Una sola llamada de precios batch en lugar de 7 llamadas individuales
         const pricesResponse = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${itemIds.join(',')}&lang=${lang}`, {
           headers: {
             'Accept': 'application/json',
             'Accept-Encoding': 'gzip, deflate, br'
           }
         });
         const pricesData = await pricesResponse.json();
         
         // Mapear precios por ID para compatibilidad
         const pricesMap: Record<number, any> = {};
         pricesData.forEach((price: any) => {
           pricesMap[price.id] = { json: () => Promise.resolve(price) };
         });
         
         const price8868Response = pricesMap[8868];
         const price13436Response = pricesMap[13436];
         const price13437Response = pricesMap[13437];
         const price13435Response = pricesMap[13435];
         const price104934Response = pricesMap[104934];
         const price104934BResponse = pricesMap[104934]; // Same item, different variant
         const price13438Response = pricesMap[13438];

         const [price8868Data, price13436Data, price13437Data, price13435Data, price104934Data, price104934BData, price13438Data] = await Promise.all([
           price8868Response?.json() || Promise.resolve(null),
           price13436Response?.json() || Promise.resolve(null),
           price13437Response?.json() || Promise.resolve(null),
           price13435Response?.json() || Promise.resolve(null),
           price104934Response?.json() || Promise.resolve(null),
           price104934BResponse?.json() || Promise.resolve(null),
           price13438Response?.json() || Promise.resolve(null)
         ]);

         setPrice8868(price8868Data as any);
         setPrice13436(price13436Data as any);
         setPrice13437(price13437Data as any);
         setPrice13435(price13435Data as any);
         setPrice104934(price104934Data as any);
         setPrice104934B(price104934BData as any);
         setPrice13438(price13438Data as any);

                                                       // Obtener precios de todos los materiales de una sola vez
         const allMatsPricesResp = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=19700,24473,24475,24519,24511,24277,24351,24300,12156,19722,19729,19748,68063,24276,24350,24299&lang=${lang}`, {
           headers: {
             'Accept': 'application/json',
             'Accept-Encoding': 'gzip, deflate, br'
           }
         });
         const allMatsPricesData: GW2Price[] = await allMatsPricesResp.json();
         
         const allMatsMap = allMatsPricesData.reduce((acc: Record<number, GW2Price>, p: GW2Price) => {
           acc[p.id] = p;
           return acc;
         }, {} as Record<number, GW2Price>);
         
         setPrice19700(allMatsMap[19700] || null);
         setPrice24473(allMatsMap[24473] || null);
         setPrice24519(allMatsMap[24519] || null);
         setPrice24511(allMatsMap[24511] || null);
         
         setPrice24276(allMatsMap[24276] || null);
         setPrice24350(allMatsMap[24350] || null);
         setPrice24299(allMatsMap[24299] || null);
         setPrice12156(allMatsMap[12156] || null);
         setPrice19722(allMatsMap[19722] || null);
         setPrice19729(allMatsMap[19729] || null);
         setPrice19748(allMatsMap[19748] || null);
         setPrice68063(allMatsMap[68063] || null);
         setPrice24475(allMatsMap[24475] || null);
        
      } catch (error) {
        console.error('Error fetching items:', error);
        // En caso de error total, usar datos de fallback
        setItem8868(FALLBACK_ITEMS.item8868 as any);
        setItem13436(FALLBACK_ITEMS.item13436 as any);
        setItem13437(FALLBACK_ITEMS.item13437 as any);
        setItem13435(FALLBACK_ITEMS.item13435 as any);
        setItem104934(FALLBACK_ITEMS.item104934 as any);
        setItem104934B(FALLBACK_ITEMS.item104934B as any);
        setItem13438(FALLBACK_ITEMS.item13438 as any);
        
        const fallbackPrice = {
          id: 0,
          whitelisted: false,
          buys: { unit_price: 0, quantity: 0 },
          sells: { unit_price: 0, quantity: 0 }
        };
        
        setPrice8868(fallbackPrice as any);
        setPrice13436(fallbackPrice as any);
        setPrice13437(fallbackPrice as any);
        setPrice13435(fallbackPrice as any);
        setPrice104934(fallbackPrice as any);
        setPrice104934B(fallbackPrice as any);
        setPrice13438(fallbackPrice as any);
        
        setPrice19700(fallbackPrice as any);
        setPrice24473(fallbackPrice as any);
        setPrice24519(fallbackPrice as any);
        setPrice24511(fallbackPrice as any);
        
        setPrice24276(fallbackPrice as any);
        setPrice24350(fallbackPrice as any);
        setPrice24299(fallbackPrice as any);
        setPrice12156(fallbackPrice as any);
        setPrice19722(fallbackPrice as any);
        setPrice19729(fallbackPrice as any);
        setPrice19748(fallbackPrice as any);
        setPrice68063(fallbackPrice as any);
        setPrice24475(fallbackPrice as any);
        
        setApiOffline();
        setError('API no disponible - mostrando datos de respaldo');
      } finally {
        setLoading(false);
      }
    };

         fetchItems();
   }, [lang]);

           // Datos de crafting disciplines
    const craftingDisciplines: CraftingDiscipline[] = useMemo(() => {
      return [
       {
         name: t('researchNotesPage.discipline.jeweler'),
         icon: Gem,
         color: 'text-purple-400',
         items: sortItemsByField([
           { 
             id: 8868,
             name: item8868?.name || 'Loading...', 
             level: item8868?.level || 0, 
             notes: 1.1, 
             buyPrice: price8868?.buys?.unit_price ? formatGW2Price(price8868.buys.unit_price) : '00g 00s 00c',
             sellPrice: price8868?.sells?.unit_price ? formatGW2Price(price8868.sells.unit_price) : '00g 00s 00c',
             craftingCost: calculateCraftingCost(8868)
           },
           { 
             id: 13436,
             name: item13436?.name || 'Loading...', 
             level: item13436?.level || 0, 
             notes: 5.1, 
             buyPrice: price13436?.buys?.unit_price ? formatGW2Price(price13436.buys.unit_price) : '00g 00s 00c',
             sellPrice: price13436?.sells?.unit_price ? formatGW2Price(price13436.sells.unit_price) : '00g 00s 00c',
             craftingCost: calculateCraftingCost(13436)
           },
           { 
             id: 13437,
             name: item13437?.name || 'Loading...', 
             level: item13437?.level || 0, 
             notes: 5.1, 
             buyPrice: price13437?.buys?.unit_price ? formatGW2Price(price13437.buys.unit_price) : '00g 00s 00c',
             sellPrice: price13437?.sells?.unit_price ? formatGW2Price(price13437.sells.unit_price) : '00g 00s 00c',
             craftingCost: calculateCraftingCost(13437)
           },
           { 
             id: 13435,
             name: item13435?.name || 'Loading...', 
             level: item13435?.level || 0, 
             notes: 5.1, 
             buyPrice: price13435?.buys?.unit_price ? formatGW2Price(price13435.buys.unit_price) : '00g 00s 00c',
             sellPrice: price13435?.sells?.unit_price ? formatGW2Price(price13435.sells.unit_price) : '00g 00s 00c',
             craftingCost: calculateCraftingCost(13435)
           },
           { 
             id: 13438,
             name: item13438?.name || 'Loading...', 
             level: item13438?.level || 0, 
             notes: 5.1, 
             buyPrice: price13438?.buys?.unit_price ? formatGW2Price(price13438.buys.unit_price) : '00g 00s 00c',
             sellPrice: price13438?.sells?.unit_price ? formatGW2Price(price13438.sells.unit_price) : '00g 00s 00c',
             craftingCost: calculateCraftingCost(13438)
           },
                       { 
              id: 104934,
              name: (item104934?.name || 'Loading...') + ` (${t('researchNotesPage.suffixes.elder')})`, 
              level: item104934?.level || 0, 
              notes: 150, 
              buyPrice: price104934?.buys?.unit_price ? formatGW2Price(price104934.buys.unit_price) : '00g 00s 00c',
              sellPrice: price104934?.sells?.unit_price ? formatGW2Price(price104934.sells.unit_price) : '00g 00s 00c',
              craftingCost: calculateCraftingCost(104934)
            },
             { 
               id: 104934.1,
               name: (item104934B?.name || 'Loading...') + ` (${t('researchNotesPage.suffixes.thick')})`, 
               level: item104934B?.level || 0, 
               notes: 150, 
               buyPrice: price104934B?.buys?.unit_price ? formatGW2Price(price104934B.buys.unit_price) : '00g 00s 00c',
               sellPrice: price104934B?.sells?.unit_price ? formatGW2Price(price104934B.sells.unit_price) : '00g 00s 00c',
               craftingCost: calculateCraftingCost(104934.1)
             }
         ])
       }
     ];
   }, [t, item8868, price8868, item13436, price13436, item13437, price13437, item13435, price13435, item13438, price13438, item104934, price104934, item104934B, price104934B, calculateCraftingCost, sortItemsByField]);

  const tableItems = craftingDisciplines[0]?.items ?? [];

  const itemMeta = useMemo<Record<number, ResearchNotesItemMeta>>(
    () => ({
      8868: { icon: item8868?.icon, rarity: item8868?.rarity },
      13436: { icon: item13436?.icon, rarity: item13436?.rarity },
      13437: { icon: item13437?.icon, rarity: item13437?.rarity },
      13435: { icon: item13435?.icon, rarity: item13435?.rarity },
      13438: { icon: item13438?.icon, rarity: item13438?.rarity },
      104934: { icon: item104934?.icon, rarity: item104934?.rarity },
      104934.1: { icon: item104934B?.icon, rarity: item104934B?.rarity },
    }),
    [item8868, item13436, item13437, item13435, item13438, item104934, item104934B]
  );

  return (
    <>
      <ResearchNotesPageLayout
        items={tableItems}
        itemMeta={itemMeta}
        loading={loading}
        error={error}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        craftingPriceSide={craftingPriceSide}
        onCraftingPriceSideChange={setCraftingPriceSide}
      />
    </>
  );
}
