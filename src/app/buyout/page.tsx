'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Search,
  Calculator,
  BarChart3,
  Target,
  Percent,
  DollarSign,
  Package,
  X,
  Loader2,
} from 'lucide-react';
import { GW2Item, GW2Price, GW2Listing } from '@/types/gw2';
import {
  searchItemsByName,
  getItemPrices,
  getPopularFarmingItemsLocalized,
  getItemListings,
} from '@/lib/gw2-api';
import { formatGW2Currency } from '@/utils/gw2-currency';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

interface CalculatorData {
  buyTotalValue: number;
  buyToPrice: number;
  buyPercentSupply: number;
  buyQuantity: number;
}

interface MetricBlock {
  value: number;
  avgPrice: number;
  maxPrice: number;
  quantity: number;
  totalValue: number;
  percentage: number;
  breakEvenPrice: number;
}

interface CalculatorMetrics {
  buyTotalValue: MetricBlock;
  buyToPrice: MetricBlock;
  buyPercentSupply: MetricBlock;
  buyQuantity: MetricBlock;
}

function MetricRows({
  metrics,
  formatValue,
  t,
}: {
  metrics: MetricBlock;
  formatValue: (v: number) => string;
  t: (k: string, f: string) => string;
}) {
  const rows: [string, string, string][] = [
    ['buyout.metric.avgPrice', 'Avg price', formatGW2Currency(metrics.avgPrice)],
    ['buyout.metric.maxPrice', 'Max price', formatGW2Currency(metrics.maxPrice)],
    ['buyout.metric.quantity', 'Quantity', metrics.quantity.toLocaleString()],
    ['buyout.metric.value', 'Total cost', formatGW2Currency(metrics.totalValue)],
    ['buyout.metric.percentage', '% of supply', `${metrics.percentage.toFixed(2)}%`],
    ['buyout.metric.breakEven', 'Break-even (sell)', formatGW2Currency(metrics.breakEvenPrice)],
  ];
  return (
    <dl className="mt-4 space-y-2.5 border-t border-slate-600/40 pt-4">
      <div className="flex justify-between gap-3 text-sm">
        <dt className="text-zinc-500">{t('buyout.metric.input', 'Input')}</dt>
        <dd className="font-mono font-medium text-white">{formatValue(metrics.value)}</dd>
      </div>
      {rows.map(([key, fb, val]) => (
        <div key={key} className="flex justify-between gap-3 text-sm">
          <dt className="text-zinc-500">{t(key, fb)}</dt>
          <dd
            className={`font-mono ${
              key === 'buyout.metric.value' ? 'font-semibold text-emerald-300' : 'text-zinc-200'
            }`}
          >
            {val}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function BuyoutPage() {
  const { t, lang } = useI18n();
  usePageTitle('pageTitles.buyout', 'Buyout Calculator');
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GW2Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [popularItems, setPopularItems] = useState<GW2Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<GW2Item | null>(null);
  const [selectedItemPrice, setSelectedItemPrice] = useState<GW2Price | null>(null);
  const [selectedItemListing, setSelectedItemListing] = useState<GW2Listing | null>(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
    buyTotalValue: 1_000_000,
    buyToPrice: 1000,
    buyPercentSupply: 50,
    buyQuantity: 1000,
  });

  const selectItemForCalculation = useCallback(async (item: GW2Item) => {
    setLoadingItem(true);
    setShowDropdown(false);
    setSearchQuery('');
    try {
      const [priceData, listingData] = await Promise.all([
        getItemPrices([item.id]),
        getItemListings(item.id),
      ]);
      const price = priceData[0];
      if (price && price.sells.unit_price > 0) {
        setSelectedItem(item);
        setSelectedItemPrice(price);
        setSelectedItemListing(listingData);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('id', String(item.id));
          window.history.replaceState({}, '', url.toString());
        }
      }
    } catch (error) {
      console.error('Error selecting item:', error);
    } finally {
      setLoadingItem(false);
    }
  }, []);

  useEffect(() => {
    getPopularFarmingItemsLocalized(lang)
      .then(setPopularItems)
      .catch((e) => console.error(e));
  }, [lang]);

  useEffect(() => {
    const raw =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null;
    const id = raw ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(id) || id <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        const apiLang = lang === 'es' || lang === 'de' || lang === 'fr' ? lang : 'en';
        const res = await fetch(`https://api.guildwars2.com/v2/items/${id}?lang=${apiLang}`);
        if (!res.ok || cancelled) return;
        const item = await res.json();
        if (!cancelled) await selectItemForCalculation(item);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, selectItemForCalculation]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchItemsByName(searchQuery, lang);
        setSearchResults(results);
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, lang]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!searchWrapRef.current?.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const calculateMetrics = useCallback((): CalculatorMetrics | null => {
    if (!selectedItem || !selectedItemPrice || !selectedItemListing) return null;

    const currentPrice = selectedItemPrice.sells.unit_price;
    const availableSupply = selectedItemListing.sells.reduce((t, l) => t + l.quantity, 0);
    const { buyTotalValue, buyToPrice, buyPercentSupply, buyQuantity } = calculatorData;

    const calculateItemsForBudget = (budget: number) => {
      let totalCost = 0;
      let totalItems = 0;
      for (const listing of selectedItemListing.sells) {
        const costForThisListing = listing.quantity * listing.unit_price;
        if (totalCost + costForThisListing <= budget) {
          totalCost += costForThisListing;
          totalItems += listing.quantity;
        } else {
          const remainingBudget = budget - totalCost;
          const itemsFromThisListing = Math.floor(remainingBudget / listing.unit_price);
          totalCost += itemsFromThisListing * listing.unit_price;
          totalItems += itemsFromThisListing;
          break;
        }
      }
      return { totalItems, totalCost };
    };

    const calculateItemsUpToPrice = (maxPrice: number) => {
      let totalCost = 0;
      let totalItems = 0;
      for (const listing of selectedItemListing.sells) {
        if (listing.unit_price <= maxPrice) {
          totalCost += listing.quantity * listing.unit_price;
          totalItems += listing.quantity;
        } else break;
      }
      return { totalItems, totalCost };
    };

    const { totalItems: itemsForBudget, totalCost: actualCost } = calculateItemsForBudget(buyTotalValue);
    let maxPriceForBudget = currentPrice;
    let itemsBoughtSoFar = 0;
    for (const listing of selectedItemListing.sells) {
      if (itemsBoughtSoFar >= itemsForBudget) break;
      const n = Math.min(listing.quantity, itemsForBudget - itemsBoughtSoFar);
      if (n > 0) {
        maxPriceForBudget = listing.unit_price;
        itemsBoughtSoFar += n;
      }
    }

    const { totalItems: itemsUpToPrice, totalCost: costUpToPrice } = calculateItemsUpToPrice(buyToPrice);

    const targetQuantity = Math.floor(availableSupply * (buyPercentSupply / 100));
    let totalCostForPercentage = 0;
    let itemsBought = 0;
    let maxPriceForPercentage = currentPrice;
    for (const listing of selectedItemListing.sells) {
      if (itemsBought >= targetQuantity) break;
      const n = Math.min(listing.quantity, targetQuantity - itemsBought);
      if (n > 0) {
        totalCostForPercentage += n * listing.unit_price;
        maxPriceForPercentage = listing.unit_price;
        itemsBought += n;
      }
    }

    let totalCostForQuantity = 0;
    let itemsForQty = 0;
    let maxPriceForQuantity = currentPrice;
    for (const listing of selectedItemListing.sells) {
      if (itemsForQty >= buyQuantity) break;
      const n = Math.min(listing.quantity, buyQuantity - itemsForQty);
      if (n > 0) {
        totalCostForQuantity += n * listing.unit_price;
        maxPriceForQuantity = listing.unit_price;
        itemsForQty += n;
      }
    }

    return {
      buyTotalValue: {
        value: buyTotalValue,
        avgPrice: itemsForBudget > 0 ? Math.floor(actualCost / itemsForBudget) : currentPrice,
        maxPrice: maxPriceForBudget,
        quantity: itemsForBudget,
        totalValue: actualCost,
        percentage: availableSupply > 0 ? (itemsForBudget / availableSupply) * 100 : 0,
        breakEvenPrice: currentPrice,
      },
      buyToPrice: {
        value: buyToPrice,
        avgPrice: itemsUpToPrice > 0 ? Math.floor(costUpToPrice / itemsUpToPrice) : currentPrice,
        maxPrice: buyToPrice,
        quantity: itemsUpToPrice,
        totalValue: costUpToPrice,
        percentage: availableSupply > 0 ? (itemsUpToPrice / availableSupply) * 100 : 0,
        breakEvenPrice: currentPrice,
      },
      buyPercentSupply: {
        value: buyPercentSupply,
        avgPrice: itemsBought > 0 ? Math.floor(totalCostForPercentage / itemsBought) : currentPrice,
        maxPrice: maxPriceForPercentage,
        quantity: itemsBought,
        totalValue: totalCostForPercentage,
        percentage: availableSupply > 0 ? (itemsBought / availableSupply) * 100 : 0,
        breakEvenPrice: currentPrice,
      },
      buyQuantity: {
        value: buyQuantity,
        avgPrice: itemsForQty > 0 ? Math.floor(totalCostForQuantity / itemsForQty) : currentPrice,
        maxPrice: maxPriceForQuantity,
        quantity: itemsForQty,
        totalValue: totalCostForQuantity,
        percentage: availableSupply > 0 ? (itemsForQty / availableSupply) * 100 : 0,
        breakEvenPrice: currentPrice,
      },
    };
  }, [selectedItem, selectedItemPrice, selectedItemListing, calculatorData]);

  const updateCalculator = (field: keyof CalculatorData, value: number) => {
    setCalculatorData((prev) => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const clearSelection = () => {
    setSelectedItem(null);
    setSelectedItemPrice(null);
    setSelectedItemListing(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const metrics = calculateMetrics();
  const totalSupply =
    selectedItemListing?.sells.reduce((total, listing) => total + listing.quantity, 0) ?? 0;

  const card =
    'rounded-2xl border border-slate-600/40 bg-slate-800/40 p-5 shadow-lg shadow-black/10 backdrop-blur-sm';
  const inputCls =
    'w-full rounded-xl border border-slate-600/50 bg-slate-950/60 px-3 py-2.5 font-mono text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30';

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header */}
        <header className="mb-8 text-center sm:mb-10">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-teal-600/10">
            <Calculator className="h-7 w-7 text-cyan-300" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t('pageTitles.buyout', 'Buyout Calculator')}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {t(
              'buyout.subtitle',
              'Walk the sell orders: see what a real buyout costs, how much supply you take, and at what average price.'
            )}
          </p>
        </header>

        {/* Search — full width hero */}
        <div ref={searchWrapRef} className="relative mx-auto mb-8 max-w-2xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => searchQuery.trim() && setShowDropdown(true)}
              placeholder={t('buyout.searchPlaceholder', 'Search item by name…')}
              className="w-full rounded-2xl border border-slate-500/40 bg-slate-900/80 py-4 pl-12 pr-12 text-base text-white shadow-xl shadow-black/20 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
              autoComplete="off"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {isSearching && <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />}
              {searchQuery && !isSearching && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowDropdown(false);
                  }}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-slate-700 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {showDropdown && searchQuery.trim() && (
            <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-slate-600/50 bg-slate-900/95 py-2 shadow-2xl backdrop-blur-md">
              {isSearching && searchResults.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-zinc-500">
                  {t('buyout.searching', 'Searching…')}
                </p>
              ) : searchResults.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-zinc-500">
                  {t('buyout.noResults', 'No items found')}
                </p>
              ) : (
                searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectItemForCalculation(item)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-cyan-500/10"
                  >
                    {item.icon ? (
                      <Image
                        src={item.icon}
                        alt=""
                        width={36}
                        height={36}
                        className="rounded-md border border-slate-600/50"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-md bg-slate-700" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">{item.name}</p>
                      <p className="text-xs text-zinc-500">ID {item.id}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Popular chips */}
        {!selectedItem && popularItems.length > 0 && (
          <div className="mb-10">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              {t('buyout.popular', 'Popular')}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectItemForCalculation(item)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-600/50 bg-slate-800/60 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-cyan-500/40 hover:bg-slate-700/60 hover:text-white"
                >
                  {item.icon && (
                    <Image src={item.icon} alt="" width={20} height={20} className="rounded" />
                  )}
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {loadingItem && (
          <div className="mb-8 flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        )}

        {!selectedItem && !loadingItem && (
          <div className={`${card} mx-auto max-w-lg py-14 text-center`}>
            <Package className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            <p className="text-zinc-400">{t('buyout.selectPrompt', 'Select an item to calculate')}</p>
            <p className="mt-1 text-sm text-zinc-600">
              {t('buyout.selectHint', 'Type the item name in your language')}
            </p>
          </div>
        )}

        {selectedItem && !loadingItem && (
          <div className="space-y-5">
            {/* Selected item banner */}
            <div className={`${card} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
              <div className="flex min-w-0 items-center gap-4">
                {selectedItem.icon && (
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-xl bg-cyan-400/20 blur-md" />
                    <Image
                      src={selectedItem.icon}
                      alt=""
                      width={64}
                      height={64}
                      className="relative rounded-xl border border-slate-500/50"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-bold text-white">{selectedItem.name}</h2>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    ID {selectedItem.id}
                    {selectedItem.level > 0 &&
                      ` · ${t('buyout.level', 'Level')} ${selectedItem.level}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                {selectedItemPrice && (
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/80">
                      {t('buyout.currentSell', 'Current sell')}
                    </p>
                    <p className="font-mono text-lg font-semibold text-cyan-200">
                      {formatGW2Currency(selectedItemPrice.sells.unit_price)}
                    </p>
                  </div>
                )}
                <div className="rounded-xl border border-slate-600/40 bg-slate-900/40 px-4 py-2 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {t('buyout.totalSupply', 'Total supply')}
                  </p>
                  <p className="font-mono text-lg font-semibold text-white">
                    {totalSupply.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-xl border border-slate-600/50 p-2.5 text-zinc-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
                  aria-label={t('buyout.clear', 'Clear')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-zinc-500">
              {t(
                'buyout.instantNote',
                'Costs walk real sell listings from cheapest up — same as buying out on the TP.'
              )}
              {selectedItemListing && (
                <>
                  {' · '}
                  {selectedItemListing.sells.length} {t('buyout.sellOrders', 'Sell orders')}
                </>
              )}
            </p>

            {/* 4 calculators */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={card}>
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white">
                    {t('buyout.calc.budget', 'Buy by budget')}
                  </h3>
                </div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  {t('buyout.calc.budgetInput', 'Budget (copper)')}
                </label>
                <input
                  type="number"
                  value={calculatorData.buyTotalValue}
                  onChange={(e) => updateCalculator('buyTotalValue', parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
                <p className="mt-1.5 text-xs font-mono text-zinc-500">
                  ≈ {formatGW2Currency(calculatorData.buyTotalValue)}
                </p>
                {metrics && (
                  <MetricRows
                    metrics={metrics.buyTotalValue}
                    formatValue={(v) => formatGW2Currency(v)}
                    t={t}
                  />
                )}
              </div>

              <div className={card}>
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15">
                    <Target className="h-4 w-4 text-sky-400" />
                  </div>
                  <h3 className="font-semibold text-white">
                    {t('buyout.calc.toPrice', 'Buy up to price')}
                  </h3>
                </div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  {t('buyout.calc.toPriceInput', 'Max unit price (copper)')}
                </label>
                <input
                  type="number"
                  value={calculatorData.buyToPrice}
                  onChange={(e) => updateCalculator('buyToPrice', parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
                <p className="mt-1.5 text-xs font-mono text-zinc-500">
                  ≈ {formatGW2Currency(calculatorData.buyToPrice)}
                </p>
                {metrics && (
                  <MetricRows
                    metrics={metrics.buyToPrice}
                    formatValue={(v) => formatGW2Currency(v)}
                    t={t}
                  />
                )}
              </div>

              <div className={card}>
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15">
                    <Percent className="h-4 w-4 text-violet-400" />
                  </div>
                  <h3 className="font-semibold text-white">
                    {t('buyout.calc.percent', 'Buy % of supply')}
                  </h3>
                </div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  {t('buyout.calc.percentInput', '% of total supply')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={calculatorData.buyPercentSupply}
                  onChange={(e) =>
                    updateCalculator('buyPercentSupply', parseFloat(e.target.value) || 0)
                  }
                  className={inputCls}
                />
                {metrics && (
                  <MetricRows
                    metrics={metrics.buyPercentSupply}
                    formatValue={(v) => `${v.toFixed(2)}%`}
                    t={t}
                  />
                )}
              </div>

              <div className={card}>
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-white">
                    {t('buyout.calc.quantity', 'Buy quantity')}
                  </h3>
                </div>
                <label className="mb-1.5 block text-xs text-zinc-500">
                  {t('buyout.calc.quantityInput', 'Number of items')}
                </label>
                <input
                  type="number"
                  value={calculatorData.buyQuantity}
                  onChange={(e) => updateCalculator('buyQuantity', parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
                {metrics && (
                  <MetricRows
                    metrics={metrics.buyQuantity}
                    formatValue={(v) => v.toLocaleString()}
                    t={t}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
