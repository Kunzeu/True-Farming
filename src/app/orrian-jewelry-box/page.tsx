'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Info, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import { FALLBACK_ITEMS, isOfflineMode, setApiOffline, setApiOnline } from '@/data/fallback-data';

interface ItemData {
  id: number;
  name: string;
  description: string;
  type: string;
  level: number;
  rarity: string;
  vendor_value: number;
  icon: string;
  details?: Record<string, unknown>;
}

interface PriceData {
  id: number;
  buys: {
    unit_price: number;
    quantity: number;
  };
  sells: {
    unit_price: number;
    quantity: number;
  };
}

interface DropItem {
  id: number;
  name: string;
  icon: string;
  quantity: number;
  buyPrice?: number;
  sellPrice?: number;
}

// Datos estáticos movidos fuera del componente para evitar recreación
const DROP_ITEM_IDS = [
  36448, // Drop of Liquid Karma
  36451, // Taste of Liquid Karma
  36456, // Vial of Liquid Karma
  36457, // Swig of Liquid Karma
  39223, // Unidentifiable Object
  24305, // Charged Lodestone
  24330, // Crystal Lodestone
  24325, // Destroyer Lodestone
  24320, // Glacial Lodestone
  24340, // Corrupted Lodestone
  24315, // Molten Lodestone
  24310, // Onyx Lodestone
  24335, // Pile of Putrid Essence
  19925, // Obsidian Shard
  39090, // Mini Risen Priest of Balthazar
  35750, // Warm Potion
  35749, // Charged Potion
  35747,  // Cold Potion
  35748 // Hard Potion
] as const;

const ITEM_QUANTITIES: Record<number, number> = {
  36448: 13406, // Drop of Liquid Karma
  36451: 2986,  // Taste of Liquid Karma
  36456: 1224,  // Vial of Liquid Karma
  36457: 1332,  // Swig of Liquid Karma
  39223: 28494, // Unidentifiable Object
  24305: 44,    // Charged Lodestone
  24330: 48,    // Crystal Lodestone
  24325: 40,    // Destroyer Lodestone
  24320: 40,    // Glacial Lodestone
  24340: 43,    // Corrupted Lodestone
  24315: 35,    // Molten Lodestone
  24310: 37,    // Onyx Lodestone
  24335: 47,    // Pile of Putrid Essence
  19925: 1507,  // Obsidian Shard
  39090: 102,   // Mini Risen Priest of Balthazar
  35750: 3,     // Warm Potion (combinando las dos entradas)
  35749: 5,     // Charged Potion
  35747: 1,     // Cold Potion
  35748: 2      // Hard Potion    
};

const KARMA_VALUES: Record<number, number> = {
  36448: 600,    // Drop of Liquid Karma: 600 karma
  36451: 2500,   // Taste of Liquid Karma: 2,000 karma
  36456: 3750,   // Vial of Liquid Karma: 4,000 karma
  36457: 4500    // Swig of Liquid Karma: 6,000 karma
};

const FAVOR_VALUES: Record<number, number> = {
  39223: 50 // Unidentifiable Object: 50 Favor
};

function formatCoins(totalCopper: number): string {
  const gold = Math.floor(totalCopper / 10000);
  const silver = Math.floor((totalCopper % 10000) / 100);
  const copper = totalCopper % 100;
  const g = String(gold).padStart(2, '0');
  const s = String(silver).padStart(2, '0');
  const c = String(copper).padStart(2, '0');
  return `${g}g ${s}s ${c}c`;
}

export default function OrrianJewelryBoxPage() {
  usePageTitle('orrianJewelryBoxPage.title', 'Orrian Jewelry Box');
  const { t, lang } = useI18n();
  const wikiUrl = useMemo(() => {
    // En español, usar la wiki en inglés
    if (lang === 'de') return 'https://wiki-de.guildwars2.com/wiki/Verlorene_orrianische_Juwelenkiste';
    if (lang === 'fr') return 'https://wiki-fr.guildwars2.com/wiki/Bo%C3%AEte_%C3%A0_bijoux_orrienne_perdue';
    return 'https://wiki.guildwars2.com/wiki/Orrian_Jewelry_Box';
  }, [lang]);
  const [itemData, setItemData] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropItems, setDropItems] = useState<DropItem[]>([]);
  const [dropWarning, setDropWarning] = useState<string | null>(null);
  const [nameSortOrder, setNameSortOrder] = useState<'asc' | 'desc'>('asc');
  const [quantitySortOrder, setQuantitySortOrder] = useState<'asc' | 'desc'>('desc');
  const [sellPriceSortOrder, setSellPriceSortOrder] = useState<'asc' | 'desc'>('desc');
  const [totalSortOrder, setTotalSortOrder] = useState<'asc' | 'desc'>('desc');
  const [lastSortType, setLastSortType] = useState<'name' | 'quantity' | 'sellPrice' | 'total'>('quantity');

  // Memoizar las funciones de ordenamiento para evitar recreaciones
  const handleNameSort = useCallback(() => {
    setNameSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setLastSortType('name');
  }, []);

  const handleQuantitySort = useCallback(() => {
    setQuantitySortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setLastSortType('quantity');
  }, []);

  const handleSellPriceSort = useCallback(() => {
    setSellPriceSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setLastSortType('sellPrice');
  }, []);

  const handleTotalSort = useCallback(() => {
    setTotalSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setLastSortType('total');
  }, []);

  // Fetch item data and price
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar si estamos en modo offline
        if (isOfflineMode()) {
          console.log('Using fallback data - API is offline')
          setItemData(FALLBACK_ITEMS.orrianJewelryBox)
          
          // Crear drop items de fallback
          const fallbackDropItems: DropItem[] = DROP_ITEM_IDS.map(id => {
            const fallbackItem = Object.values(FALLBACK_ITEMS).find(item => item.id === id)
            return {
              id,
              name: fallbackItem?.name || `Item ${id}`,
              icon: fallbackItem?.icon || 'https://wiki.guildwars2.com/images/8/8a/Unidentifiable_Object.png',
              quantity: ITEM_QUANTITIES[id] || 0,
              buyPrice: 0,
              sellPrice: 0
            }
          })
          setDropItems(fallbackDropItems)
          setLoading(false)
          return
        }

        // Intentar obtener el item principal
        try {
          const itemResponse = await fetch(`https://api.guildwars2.com/v2/items/39088?lang=${lang}`, {
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate, br'
            },
            signal: AbortSignal.timeout(10000) // 10 segundos timeout
          });
          
          if (!itemResponse.ok) {
            throw new Error('Failed to fetch item data')
          }
          
          const itemData: ItemData = await itemResponse.json()
          setItemData(itemData)
          setApiOnline() // Marcar API como online si funciona
          
        } catch (itemErr) {
          console.warn('Failed to fetch item, using fallback:', itemErr)
          setItemData(FALLBACK_ITEMS.orrianJewelryBox)
          setApiOffline() // Marcar API como offline
        }

        // Intentar obtener los drop items
        try {
          const dropItemsResponse = await fetch(`https://api.guildwars2.com/v2/items?ids=${DROP_ITEM_IDS.join(',')}&lang=${lang}`, {
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate, br'
            },
            signal: AbortSignal.timeout(15000) // 15 segundos timeout
          });
          
          if (dropItemsResponse.ok) {
            const dropItemsData: ItemData[] = await dropItemsResponse.json();
            
            // Intentar obtener precios
            try {
              const pricesResponse = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${DROP_ITEM_IDS.join(',')}`, {
                headers: {
                  'Accept': 'application/json',
                  'Accept-Encoding': 'gzip, deflate, br'
                },
                signal: AbortSignal.timeout(10000) // 10 segundos timeout
              });
              
              let pricesData: PriceData[] = [];
              if (pricesResponse.ok) {
                pricesData = await pricesResponse.json();
              }
              
              // Create price map for easy lookup
              const priceMap = new Map<number, PriceData>();
              pricesData.forEach(price => {
                priceMap.set(price.id, price);
              });
              
              const formattedDropItems: DropItem[] = dropItemsData.map(item => {
                const price = priceMap.get(item.id);
                return {
                  id: item.id,
                  name: item.name,
                  icon: item.icon,
                  quantity: ITEM_QUANTITIES[item.id] || 0,
                  buyPrice: price?.buys?.unit_price || 0,
                  sellPrice: price?.sells?.unit_price || 0
                };
              });
              setDropItems(formattedDropItems);
              setApiOnline() // Marcar API como online
              
            } catch (priceErr) {
              console.warn('Failed to fetch prices, using items without prices:', priceErr)
              const formattedDropItems: DropItem[] = dropItemsData.map(item => ({
                id: item.id,
                name: item.name,
                icon: item.icon,
                quantity: ITEM_QUANTITIES[item.id] || 0,
                buyPrice: 0,
                sellPrice: 0
              }));
              setDropItems(formattedDropItems);
              setApiOffline() // Marcar API como offline
            }
            
          } else {
            throw new Error('Failed to fetch drop items')
          }
          
        } catch (dropErr) {
          console.warn('Failed to fetch drop items, using fallback:', dropErr)
          // Crear drop items de fallback
          const fallbackDropItems: DropItem[] = DROP_ITEM_IDS.map(id => {
            const fallbackItem = Object.values(FALLBACK_ITEMS).find(item => item.id === id)
            return {
              id,
              name: fallbackItem?.name || `Item ${id}`,
              icon: fallbackItem?.icon || 'https://wiki.guildwars2.com/images/8/8a/Unidentifiable_Object.png',
              quantity: ITEM_QUANTITIES[id] || 0,
              buyPrice: 0,
              sellPrice: 0
            }
          })
          setDropItems(fallbackDropItems)
          setApiOffline() // Marcar API como offline
        }
        
      } catch (err) {
        console.error('Error fetching data:', err)
        // En caso de error total, usar datos de fallback
        setItemData(FALLBACK_ITEMS.orrianJewelryBox)
        
        // Crear drop items de fallback
        const fallbackDropItems: DropItem[] = DROP_ITEM_IDS.map(id => {
          const fallbackItem = Object.values(FALLBACK_ITEMS).find(item => item.id === id)
          return {
            id,
            name: fallbackItem?.name || `Item ${id}`,
            icon: fallbackItem?.icon || 'https://wiki.guildwars2.com/images/8/8a/Unidentifiable_Object.png',
            quantity: ITEM_QUANTITIES[id] || 0,
            buyPrice: 0,
            sellPrice: 0
          }
        })
        setDropItems(fallbackDropItems)
        setApiOffline()
        setError('API no disponible - mostrando datos de respaldo')
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lang]); // Solo depende de lang ahora

  // Sort drop items by quantity - memoizado
  const sortedDropItemsByQuantity = useMemo(() => {
    return [...dropItems].sort((a, b) => {
      if (quantitySortOrder === 'desc') {
        return b.quantity - a.quantity;
      } else {
        return a.quantity - b.quantity;
      }
    });
  }, [dropItems, quantitySortOrder]);

  // Sort drop items by name - memoizado
  const sortedDropItemsByName = useMemo(() => {
    return [...dropItems].sort((a, b) => {
      if (nameSortOrder === 'asc') {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return nameA.localeCompare(nameB);
      } else {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return nameB.localeCompare(nameA);
      }
    });
  }, [dropItems, nameSortOrder]);

  // Determine which sorted list to use based on last interaction
  const finalSortedItems = useMemo(() => {
    if (lastSortType === 'name') return sortedDropItemsByName;
    if (lastSortType === 'sellPrice') {
      return [...dropItems].sort((a, b) => {
        const priceA = a.sellPrice || 0;
        const priceB = b.sellPrice || 0;
        return sellPriceSortOrder === 'desc' ? priceB - priceA : priceA - priceB;
      });
    }
    if (lastSortType === 'total') {
      return [...dropItems].sort((a, b) => {
        const unitA = a.sellPrice ? a.sellPrice * a.quantity : (FAVOR_VALUES[a.id] ? FAVOR_VALUES[a.id] * a.quantity : (KARMA_VALUES[a.id] || 0));
        const unitB = b.sellPrice ? b.sellPrice * b.quantity : (FAVOR_VALUES[b.id] ? FAVOR_VALUES[b.id] * b.quantity : (KARMA_VALUES[b.id] || 0));
        return totalSortOrder === 'desc' ? unitB - unitA : unitA - unitB;
      });
    }
    return sortedDropItemsByQuantity;
  }, [lastSortType, sortedDropItemsByName, sortedDropItemsByQuantity, dropItems, sellPriceSortOrder, totalSortOrder]);

  // Calculate total karma recovered from drops - memoizado
  const totalKarmaRecovered = useMemo(() => {
    return dropItems.reduce((total, item) => {
      const karmaValue = KARMA_VALUES[item.id];
      if (karmaValue) {
        return total + (item.quantity * karmaValue);
      }
      return total;
    }, 0);
  }, [dropItems]);

  // Suma del 85% del precio de venta (después de tarifas TP) excluyendo id 39223, multiplicado por cantidad
  const totalSellPrice85Copper = useMemo(() => {
    return dropItems.reduce((sum, item) => {
      if (item.id === 39223) return sum; // excluir Unidentifiable Object (favor)
      if (!item.sellPrice) return sum;
      const priceAfterFee = Math.floor(item.sellPrice * 0.85);
      return sum + priceAfterFee * item.quantity;
    }, 0);
  }, [dropItems]);

  // Total de favor (sin 85%) multiplicado por cantidad
  const totalFavorCopper = useMemo(() => {
    return dropItems.reduce((sum, item) => {
      const favor = FAVOR_VALUES[item.id] || 0;
      return sum + favor * item.quantity;
    }, 0);
  }, [dropItems]);

  // Oro recuperado final: 85% del sell price + favor (sin 85%)
  const totalGoldRecovered85Copper = useMemo(() => {
    return totalSellPrice85Copper + totalFavorCopper;
  }, [totalSellPrice85Copper, totalFavorCopper]);

  // Memoizar el componente de loading para evitar re-renders
  const LoadingComponent = useMemo(() => (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-xl">{t('orrianJewelryBoxPage.loading', 'Cargando datos de la caja...')}</p>
          </div>
        </div>
      </div>
    </>
  ), [t]);

  // Memoizar el componente de error
  const ErrorComponent = useMemo(() => (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center">
            <p className="text-red-400 text-xl">{error || t('orrianJewelryBoxPage.errorLoadingData', 'Error al cargar los datos')}</p>
                          <Link href="/" className="mt-4 inline-block text-blue-300 hover:text-blue-200">
                {t('orrianJewelryBoxPage.backToHome', '← Volver al inicio')}
            </Link>
          </div>
        </div>
      </div>
    </>
  ), [error, t]);

  if (loading) {
    return LoadingComponent;
  }

  if (error && !itemData) {
    return ErrorComponent;
  }

  return (
    <>
      
      {/* Banner informativo cuando se usan datos de fallback */}
      {error && itemData && (
        <div className="bg-yellow-900/20 border-b border-yellow-500/30 px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <p className="text-yellow-200 text-sm">
                <strong>Modo offline:</strong> Mostrando datos de respaldo. La API de GW2 está temporalmente deshabilitada.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="text-yellow-300 hover:text-yellow-100 text-sm underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header con navegación */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link 
                href="/salvage" 
                className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 hover:bg-gray-800/90 border border-blue-500/30 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg">
                <ArrowLeft className="h-5 w-5" />
                <span>{t('orrianJewelryBoxPage.backToSalvaging', 'Volver al Reciclaje')}</span>
              </Link>
            </div>
          </div>

          {dropWarning && (
            <div className="mb-6 bg-yellow-900/30 border border-yellow-700 text-yellow-200 rounded-md p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 text-sm">{dropWarning}</div>
                <button onClick={() => setDropWarning(null)} className="text-yellow-300 hover:text-yellow-200 text-xs">{t('common.dismiss', 'Cerrar')}</button>
              </div>
            </div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold mb-4">{t('orrianJewelryBoxPage.title', 'Caja de Joyas Orrianas Perdidas')}</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('orrianJewelryBoxPage.subtitle', 'Analiza el valor y rentabilidad de esta caja misteriosa de Orr. Descubre si vale la pena abrirla o venderla en el mercado.')}
            </p>
          </motion.div>

          

          {/* Item Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-slate-600/50"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Item Icon */}
              <div className="flex-shrink-0">
                <Image 
                  src={itemData?.icon || 'https://wiki.guildwars2.com/images/8/8a/Orrian_Jewelry_Box.png'} 
                  alt={itemData?.name || 'Orrian Jewelry Box'}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-lg border-2 border-slate-600/50"
                />
              </div>

              {/* Item Details */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <h2 className="text-2xl font-bold mb-2 md:mb-0">{itemData?.name || 'Orrian Jewelry Box'}</h2>
                  {/* Botón desktop (inline con el título) */}
                  <a 
                    href={wikiUrl}
                    target="_blank"
                    className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors border border-slate-600/50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('salvagePages.viewWiki', 'Ver Wiki')}
                  </a>
                </div>
                <p className="text-gray-300 mb-4">{itemData?.description || 'A mysterious box found in the depths of Orr.'}</p>
                {/* Botón móvil (debajo del texto) */}
                <div className="flex justify-center md:hidden">
                  <a 
                    href={wikiUrl}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors border border-slate-600/50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('salvagePages.viewWiki', 'Ver Wiki')}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards - Combined Data */}
          <div className="mb-6 text-center text-base text-gray-400">
            {t('orrianJewelryBoxPage.credits', 'Crédito de datos: kusanagi.1093 y zirial.2698')}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400 mb-2">{t('orrianJewelryBoxPage.karmaInicial', 'Karma Inicial')}</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-3xl font-bold text-blue-300">45,500,000</p>
                <Image 
                  src="/images/expansions/karma.webp" 
                  alt="Karma"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400 mb-2">{t('orrianJewelryBoxPage.cofresTotales', 'Cofres Totales')}</p>
              <p className="text-3xl font-bold text-green-300">10,000</p>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400 mb-2">{t('orrianJewelryBoxPage.costoCofre', 'Costo Cofre')}</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-3xl font-bold text-orange-300">4,550</p>
                <Image 
                  src="/images/expansions/karma.webp" 
                  alt="Karma"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400 mb-2">{t('orrianJewelryBoxPage.karmaRecuperado', 'Karma Recuperado')}</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-3xl font-bold text-purple-300">{totalKarmaRecovered.toLocaleString()}</p>
                <Image 
                  src="/images/expansions/karma.webp" 
                  alt="Karma"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400 mb-2">{t('orrianJewelryBoxPage.oroRecuperado', 'Oro Recuperado')}</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-3xl font-bold text-yellow-300">{formatCoins(totalGoldRecovered85Copper)}</p>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400 mb-2">{t('orrianJewelryBoxPage.ratioOro', '1000 de Karma equivale')}</p>
              <p className="text-3xl font-bold text-blue-300">{formatCoins(Math.round((totalGoldRecovered85Copper * 1000) / 19407400))}</p>
            </div>
          </motion.div>

          {/* Possible Drops Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-slate-600/50"
          >
            <h3 className="text-2xl font-bold text-center mb-6">
              {t('orrianJewelryBoxPage.possibleDrops', 'Posibles Drops de la Caja')}
            </h3>
            
            {/* Table Header with Filter */}
            <div className="hidden sm:grid grid-cols-4 gap-5 py-3 px-5 bg-slate-700/50 rounded-t-lg border-b border-slate-600/50">
                              <div className="font-semibold text-gray-300 flex items-center">
                  <span className="min-w-0">{t('orrianJewelryBoxPage.drop', 'Objeto')}</span>
                  <button
                    onClick={handleNameSort}
                    className="ml-2 p-1 hover:bg-slate-600/50 rounded transition-colors"
                  >
                  {nameSortOrder === 'asc' ? (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="font-semibold text-gray-300 text-center">
                {t('orrianJewelryBoxPage.sellPrice', 'Precio Venta')}
                <button
                  onClick={handleSellPriceSort}
                  className="ml-2 p-1 hover:bg-slate-600/50 rounded transition-colors"
                >
                  {sellPriceSortOrder === 'desc' ? (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="font-semibold text-gray-300 flex items-center justify-center">
                <span>{t('orrianJewelryBoxPage.cantidad', 'Cantidad')}</span>
                <button
                  onClick={handleQuantitySort}
                  className="ml-2 p-1 hover:bg-slate-600/50 rounded transition-colors"
                >
                  {quantitySortOrder === 'desc' ? (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="font-semibold text-gray-300 text-center">
                {t('orrianJewelryBoxPage.totalGanado', 'Total Ganado')}
                <button
                  onClick={handleTotalSort}
                  className="ml-2 p-1 hover:bg-slate-600/50 rounded transition-colors"
                >
                  {totalSortOrder === 'desc' ? (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Mobile Scrollable Table */}
            <div className="sm:hidden overflow-x-auto">
            <div className="min-w-[650px]">
            {/* Mobile Header */}
            <div className="grid [grid-template-columns:2fr_1.2fr_0.8fr_1.2fr] gap-3 py-3 px-6 bg-slate-700/50 rounded-t-lg border-b border-slate-600/50">
              <div className="font-semibold text-gray-300 text-sm flex items-center">
                <span className="min-w-0">{t('orrianJewelryBoxPage.drop', 'Objeto')}</span>
                <button
                  onClick={handleNameSort}
                  className="ml-2 p-1 hover:bg-slate-600/50 rounded transition-colors"
                >
                  {nameSortOrder === 'asc' ? (
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="font-semibold text-gray-300 text-sm text-center">
                {t('orrianJewelryBoxPage.sellPrice', 'Precio Venta')}
                <button
                  onClick={handleSellPriceSort}
                  className="ml-2 p-1 hover:bg-slate-600/50 rounded transition-colors"
                >
                  {sellPriceSortOrder === 'desc' ? (
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="font-semibold text-gray-300 text-sm text-center">
                {t('orrianJewelryBoxPage.cantidad', 'Cantidad')}
                <button
                  onClick={handleQuantitySort}
                  className="ml-2 p-1 hover:bg-slate-600/50 rounded transition-colors"
                >
                  {quantitySortOrder === 'desc' ? (
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="font-semibold text-gray-300 text-sm text-center">
                {t('orrianJewelryBoxPage.totalGanado', 'Total Ganado')}
                <button
                  onClick={handleTotalSort}
                  className="ml-2 p-1 hover:bg-slate-600/50 rounded transition-colors"
                >
                  {totalSortOrder === 'desc' ? (
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Mobile Rows */}
            {finalSortedItems.map((item) => (
              <div key={item.id} className="sm:hidden grid [grid-template-columns:2fr_1.2fr_0.8fr_1.2fr] gap-3 items-center py-3 px-6 hover:bg-slate-700/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Image 
                    src={item.icon} 
                    alt={item.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded border border-slate-600/50 flex-shrink-0"
                  />
                  <span className="font-medium text-sm truncate">{item.name}</span>
                </div>
                <div className="text-center text-xs text-green-400">
                  {item.sellPrice
                    ? `${formatCoins(Math.floor(item.sellPrice * 0.85))}`
                    : (KARMA_VALUES[item.id]
                        ? `${KARMA_VALUES[item.id].toLocaleString()}`
                        : (FAVOR_VALUES[item.id]
                            ? `${formatCoins(FAVOR_VALUES[item.id])}`
                            : 'N/A'))}
                </div>
                <div className="text-center text-xs text-green-400 font-semibold">+{item.quantity.toLocaleString()}</div>
                <div className="text-center text-xs text-yellow-300">
                  {(() => {
                    if (item.sellPrice) return `${formatCoins(Math.floor(item.sellPrice * 0.85) * item.quantity)}`;
                    if (FAVOR_VALUES[item.id]) return `${formatCoins(FAVOR_VALUES[item.id] * item.quantity)}`;
                    if (KARMA_VALUES[item.id]) return `${KARMA_VALUES[item.id].toLocaleString()}`;
                    return 'N/A';
                  })()}
                </div>
              </div>
            ))}
            </div>
            </div>
            
            {/* Desktop Rows */}
            <div className="hidden sm:block space-y-0">
              {finalSortedItems.map((item) => (
                <div key={item.id}>
                  <div className="grid grid-cols-4 gap-5 py-3 px-5 hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Image 
                        src={item.icon} 
                        alt={item.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded border border-slate-600/50 flex-shrink-0"
                      />
                      <span className="font-medium text-sm sm:text-base truncate">{item.name}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-green-400 font-semibold text-sm sm:text-base">
                        {item.sellPrice
                          ? formatCoins(Math.floor(item.sellPrice * 0.85))
                          : (KARMA_VALUES[item.id]
                              ? `${KARMA_VALUES[item.id].toLocaleString()}`
                              : (FAVOR_VALUES[item.id]
                                  ? formatCoins(FAVOR_VALUES[item.id])
                                  : 'N/A'))}
                      </span>
                    </div>
                    <span className="text-green-400 font-semibold text-sm sm:text-base text-center">+{item.quantity.toLocaleString()}</span>
                    <div className="text-center">
                      <span className="text-yellow-300 font-semibold text-sm sm:text-base">
                        {(() => {
                          if (item.sellPrice) return formatCoins(Math.floor(item.sellPrice * 0.85) * item.quantity);
                          if (FAVOR_VALUES[item.id]) return formatCoins(FAVOR_VALUES[item.id] * item.quantity);
                          if (KARMA_VALUES[item.id]) return `${KARMA_VALUES[item.id].toLocaleString()}`;
                          return 'N/A';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
