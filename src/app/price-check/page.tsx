'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Search, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import { searchItemsByName, getItemPrices } from '@/lib/gw2-api';
import type { GW2Item, GW2Price } from '@/types/gw2';

interface PriceCheckResult {
  item: GW2Item;
  prices: GW2Price | null;
}

export default function PriceCheckPage() {
  const { t, lang } = useI18n();
  usePageTitle('pageTitles.priceCheck', t('pageTitles.priceCheck', 'GW2 Price Check'));

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PriceCheckResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      // 1. Search items by name
      const items = await searchItemsByName(query, lang);
      if (items.length === 0) {
        setResults([]);
        return;
      }

      // 2. Fetch prices for found items
      const itemIds = items.map(i => i.id);
      
      let prices: GW2Price[] = [];
      try {
        prices = await getItemPrices(itemIds);
      } catch (priceError) {
        console.error('Error fetching prices:', priceError);
      }

      const pricesMap = new Map(prices.map(p => [p.id, p]));

      // 3. Combine results
      const combined: PriceCheckResult[] = items.map(item => ({
        item,
        prices: pricesMap.get(item.id) || null
      }));

      setResults(combined);
    } catch (error) {
      console.error('Error in price check search:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, lang]);

  const formatGoldParts = (copper: number) => {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperRemaining = copper % 100;
    return { gold, silver, copper: copperRemaining };
  };

  const renderPrice = (copper: number) => {
    if (copper === 0) return <span className="text-gray-500">-</span>;
    const { gold, silver, copper: c } = formatGoldParts(copper);
    return (
      <div className="flex items-center space-x-1 justify-end">
        {gold > 0 && (
          <>
            <span className="text-yellow-400 font-semibold">{gold}</span>
            <Image src="/images/expansions/Gold.webp" alt="Gold" width={16} height={16} />
          </>
        )}
        {silver > 0 && (
          <>
            <span className="text-gray-300 font-semibold">{silver}</span>
            <Image src="/images/expansions/Silver.webp" alt="Silver" width={16} height={16} />
          </>
        )}
        <>
          <span className="text-orange-400 font-semibold">{String(c).padStart(2, '0')}</span>
          <Image src="/images/expansions/Copper.webp" alt="Copper" width={16} height={16} />
        </>
      </div>
    );
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 'text-purple-500';
      case 'exotic': return 'text-orange-400';
      case 'rare': return 'text-yellow-300';
      case 'masterwork': return 'text-green-400';
      case 'fine': return 'text-blue-400';
      case 'ascended': return 'text-pink-400';
      case 'basic': return 'text-white';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {t('priceCheck.title', 'GW2 Price Check')}
          </h1>
          <p className="mt-3 text-sm text-zinc-400 sm:text-base">
            {t('priceCheck.subtitle', 'Check Trading Post prices for popular items')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mx-auto max-w-2xl mb-12">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('priceCheck.searchPlaceholder', 'Search items by name...')}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 py-4 pl-12 pr-24 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-700 disabled:text-gray-400"
            >
              {isSearching ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              ) : (
                'Search'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {hasSearched && !isSearching && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-gray-400">{t('priceCheck.noResults', 'No items found')}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 px-4">
              <div className="flex-1">Item</div>
              <div className="w-32 text-right hidden sm:block">{t('priceCheck.buyPrice', 'Buy Price')}</div>
              <div className="w-32 text-right hidden sm:block">{t('priceCheck.sellPrice', 'Sell Price')}</div>
              <div className="w-40 text-right">{t('priceCheck.profit', 'Profit (after 15% tax)')}</div>
            </div>

            <div className="grid gap-3">
              {results.map(({ item, prices }) => {
                const buyPrice = prices?.buys?.unit_price || 0;
                const sellPrice = prices?.sells?.unit_price || 0;
                
                const tpFee = Math.round(sellPrice * 0.15);
                const netProfit = sellPrice - tpFee - buyPrice;
                const roi = buyPrice > 0 ? (netProfit / buyPrice) * 100 : 0;
                
                const isProfitable = netProfit > 0;

                return (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-slate-700 bg-slate-800 p-4 transition-colors hover:bg-slate-750 gap-4">
                    
                    {/* Item Info */}
                    <div className="flex items-center flex-1 gap-3 min-w-0">
                      {item.icon ? (
                        <Image src={item.icon} alt={item.name} width={48} height={48} className="rounded-md bg-slate-900" />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-slate-700" />
                      )}
                      <div className="min-w-0">
                        <h3 className={`font-medium truncate ${getRarityColor(item.rarity)}`}>
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-500">ID: {item.id}</p>
                      </div>
                    </div>

                    {/* Prices */}
                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 sm:gap-4">
                      
                      {/* Mobile Labels */}
                      <div className="sm:hidden flex flex-col gap-1 text-xs text-gray-400">
                        <span>{t('priceCheck.buyPrice', 'Buy')}:</span>
                        <span>{t('priceCheck.sellPrice', 'Sell')}:</span>
                      </div>

                      <div className="flex flex-col gap-1 items-end">
                        <div className="sm:w-32 flex justify-end">
                          {renderPrice(buyPrice)}
                        </div>
                        <div className="sm:w-32 flex justify-end">
                          {renderPrice(sellPrice)}
                        </div>
                      </div>

                      {/* Profit */}
                      <div className="w-24 sm:w-40 flex flex-col items-end justify-center">
                        {renderPrice(Math.abs(netProfit))}
                        {netProfit !== 0 && (
                          <div className={`flex items-center gap-1 text-xs mt-1 font-medium ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                            {isProfitable ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            <span>{roi.toFixed(1)}% {t('priceCheck.profitMargin', 'ROI')}</span>
                          </div>
                        )}
                        {!isProfitable && netProfit === 0 && (
                          <span className="text-xs text-slate-500 mt-1">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500">
              <Info className="h-4 w-4" />
              <p>{t('priceCheck.taxWarning', 'Includes 15% Trading Post tax')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
