'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import { getItemPrices, searchItemsByName } from '@/lib/gw2-api';
import { GW2Price, GW2Item } from '@/types/gw2';
import { 
  HEAVY_LOOT_BAG_ID, 
  HEAVY_LOOT_BAG_DROPS, 
  HEAVY_LOOT_BAG_SAMPLE_SIZE, 
  HEAVY_LOOT_BAG_GOLD_COPPER 
} from '@/lib/heavy-loot-bag-data';
import { Loader2 } from 'lucide-react';

export default function HeavyLootBagPage() {
  const { t } = useI18n();
  usePageTitle('pageTitles.heavyLootBag', t('pageTitles.heavyLootBag', 'Heavy Loot Bag (WvW)'));

  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Map<number, GW2Price>>(new Map());
  const [items, setItems] = useState<Map<number, GW2Item>>(new Map());
  
  const [numBags, setNumBags] = useState<number>(10000); // Default to 10k bags like the usual benchmarks

  useEffect(() => {
    async function fetchData() {
      try {
        const ids = [HEAVY_LOOT_BAG_ID, ...HEAVY_LOOT_BAG_DROPS.map(d => d.id)];
        
        // Fetch prices
        const fetchedPrices = await getItemPrices(ids);
        const pMap = new Map<number, GW2Price>();
        fetchedPrices.forEach(p => pMap.set(p.id, p));
        setPrices(pMap);

        // Fetch basic item info (names/icons)
        // Usamos fetchItemsChunk internamente o llamamos a la api
        // Por simplicidad en este ejemplo usaremos fetch directo para obtener iconos:
        const response = await fetch(`https://api.guildwars2.com/v2/items?ids=${ids.join(',')}&lang=en`);
        if (response.ok) {
           const fetchedItems: GW2Item[] = await response.json();
           const iMap = new Map<number, GW2Item>();
           fetchedItems.forEach(i => iMap.set(i.id, i));
           setItems(iMap);
        }

      } catch (err) {
        console.error('Error fetching heavy loot bag data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatPrice = (copper: number) => {
    if (!copper) return '-';
    const isNeg = copper < 0;
    const abs = Math.abs(copper);
    const gold = Math.floor(abs / 10000);
    const silver = Math.floor((abs % 10000) / 100);
    const c = abs % 100;

    return (
      <div className="flex items-center space-x-1 justify-end">
        {isNeg && <span className="text-red-400">-</span>}
        {gold > 0 && (
          <>
            <span className="text-yellow-400 font-semibold">{gold}</span>
            <Image src="/images/expansions/Gold.webp" alt="Gold" width={16} height={16} />
          </>
        )}
        {(gold > 0 || silver > 0) && (
          <>
            <span className="text-gray-300 font-semibold">{silver}</span>
            <Image src="/images/expansions/Silver.webp" alt="Silver" width={16} height={16} />
          </>
        )}
        <>
          <span className="text-orange-400 font-semibold">{String(Math.round(c)).padStart(2, '0')}</span>
          <Image src="/images/expansions/Copper.webp" alt="Copper" width={16} height={16} />
        </>
      </div>
    );
  };

  const calc = useMemo(() => {
    if (prices.size === 0) return null;

    const bagPrice = prices.get(HEAVY_LOOT_BAG_ID)?.sells?.unit_price || 0;
    const bagBuyPrice = prices.get(HEAVY_LOOT_BAG_ID)?.buys?.unit_price || 0;
    
    // Gastos si compras las bolsas (usando buy orders como suele ser óptimo)
    const totalCost = numBags * bagBuyPrice;

    // Ingresos
    let totalLootedValue = 0; // bruto
    const dropDetails = [];

    // Añadir oro directo
    const directGoldPerBag = HEAVY_LOOT_BAG_GOLD_COPPER / HEAVY_LOOT_BAG_SAMPLE_SIZE;
    const totalDirectGold = directGoldPerBag * numBags;
    totalLootedValue += totalDirectGold;

    for (const drop of HEAVY_LOOT_BAG_DROPS) {
      const dropRate = drop.quantityInSample / HEAVY_LOOT_BAG_SAMPLE_SIZE;
      const expectedQuantity = dropRate * numBags;
      
      const itemPrice = prices.get(drop.id);
      // Asumimos venta al precio máximo de los Buy Orders (insta-sell) o a Sell Orders (Sell).
      // El Excel usa "Valor Max REC" y "Valor MAX Select", asumamos Sell orders para el máximo profit teórico.
      const sellValuePerUnit = itemPrice?.sells?.unit_price || 0;
      const totalItemValue = expectedQuantity * sellValuePerUnit;

      totalLootedValue += totalItemValue;

      dropDetails.push({
        ...drop,
        icon: items.get(drop.id)?.icon,
        expectedQuantity,
        sellValuePerUnit,
        totalItemValue
      });
    }

    // Profit tras vender los ítems en el TP (15% tasa de venta)
    // El oro directo no paga TP tax
    const totalTPValue = totalLootedValue - totalDirectGold;
    const netLootedValue = (totalTPValue * 0.85) + totalDirectGold;
    
    const profit85 = netLootedValue - totalCost;
    const roi = totalCost > 0 ? (profit85 / totalCost) * 100 : 0;

    return {
      bagBuyPrice,
      totalCost,
      totalLootedValue,
      netLootedValue,
      profit85,
      roi,
      dropDetails,
      totalDirectGold
    };
  }, [prices, items, numBags]);

  return (
    <div className="min-h-screen bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-center md:items-start gap-4">
          {items.get(HEAVY_LOOT_BAG_ID)?.icon && (
            <Image 
              src={items.get(HEAVY_LOOT_BAG_ID)!.icon} 
              alt="Heavy Loot Bag" 
              width={64} height={64} 
              className="rounded-lg"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl text-center md:text-left">
              Calculadora Heavy Loot Bag
            </h1>
            <p className="mt-3 text-sm text-zinc-400 sm:text-base max-w-2xl text-center md:text-left">
              Análisis de rentabilidad basado en una muestra de 1,000,000 bolsas en Mundo contra Mundo.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          </div>
        ) : !calc ? (
           <p className="text-center text-red-400">Error al cargar datos.</p>
        ) : (
          <div className="space-y-6">
            
            {/* Input y Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-2">
                  Número de Bolsas a Abrir
                </label>
                <input 
                  type="number" 
                  value={numBags}
                  onChange={(e) => setNumBags(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
                <div className="mt-2 text-xs text-slate-400">
                  Costo de Compra (Buy Order): {formatPrice(calc.bagBuyPrice)} c/u
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 flex flex-col justify-center">
                <span className="block text-xs uppercase text-slate-400 font-semibold mb-1">Gasto Total</span>
                <span className="text-lg">{formatPrice(calc.totalCost)}</span>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 flex flex-col justify-center">
                <span className="block text-xs uppercase text-slate-400 font-semibold mb-1">Valor Looteado (Bruto)</span>
                <span className="text-lg text-green-400">{formatPrice(calc.totalLootedValue)}</span>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 flex flex-col justify-center">
                <span className="block text-xs uppercase text-slate-400 font-semibold mb-1">Profit Neto (Tras Venta 85%)</span>
                <span className="text-lg font-bold">
                  {calc.profit85 > 0 ? (
                     <span className="text-green-400">+{formatPrice(calc.profit85)}</span>
                  ) : (
                     <span className="text-red-400">{formatPrice(calc.profit85)}</span>
                  )}
                </span>
                <span className={`text-xs ${calc.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ROI: {calc.roi.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Tabla de Drops */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-700 bg-slate-900/50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Ítem</th>
                    <th className="px-4 py-3 text-right">Cantidad Esperada</th>
                    <th className="px-4 py-3 text-right">Valor Unitario (Sell)</th>
                    <th className="px-4 py-3 text-right">Valor Total Esperado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  
                  {/* Oro directo */}
                  <tr className="hover:bg-slate-750/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                       <Image src="/images/expansions/Gold.webp" alt="Gold" width={24} height={24} />
                       Oro (Drops directo)
                    </td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-right text-green-400">{formatPrice(calc.totalDirectGold)}</td>
                  </tr>

                  {/* Materiales */}
                  {calc.dropDetails.sort((a,b) => b.totalItemValue - a.totalItemValue).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-750/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                        {d.icon ? (
                          <Image src={d.icon} alt={d.name} width={24} height={24} className="rounded" />
                        ) : (
                          <div className="w-6 h-6 bg-slate-700 rounded" />
                        )}
                        {d.name}
                      </td>
                      <td className="px-4 py-3 text-right">{d.expectedQuantity.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{formatPrice(d.sellValuePerUnit)}</td>
                      <td className="px-4 py-3 text-right text-green-400">{formatPrice(d.totalItemValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
