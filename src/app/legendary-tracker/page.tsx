'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  ChevronsDownUp,
  ChevronsUpDown,
  Crown,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useGW2Items } from '@/hooks/useGW2ItemCache';
import { useGW2Inventory } from '@/hooks/useGW2Inventory';
import SalvageCurrency from '@/components/salvage/SalvageCurrency';
import LegendaryTree from '@/components/legendary/LegendaryTree';
import {
  buildTree,
  collectIds,
  CURRENCY_META,
  fetchPrices,
  flattenTree,
  gw2WikiUrl,
  itemMeta,
  legendaryData,
  type CurrencyOverride,
  type DecisionOverride,
  type LegendaryKind,
  type PriceMap,
  type PriceMode,
} from '@/lib/legendary-tree';

const DEFAULT_ID = 30704; // Twilight

const KIND_ORDER: (LegendaryKind | 'all')[] = ['all', 'weapon', 'armor', 'backpack', 'trinket'];

const card =
  'rounded-2xl border border-slate-600/40 bg-slate-800/40 p-5 shadow-lg shadow-black/10 backdrop-blur-sm';

export default function LegendaryTrackerPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  usePageTitle('legendary.title', 'Legendary Tracker');

  const data = legendaryData;
  const [selectedId, setSelectedId] = useState<number>(DEFAULT_ID);
  const [prices, setPrices] = useState<PriceMap>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceMode, setPriceMode] = useState<PriceMode>('sell');
  const [useOwned, setUseOwned] = useState(false);
  const [overrides, setOverrides] = useState<DecisionOverride>({});
  const [currencyOverrides, setCurrencyOverrides] = useState<CurrencyOverride>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['r']));
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<LegendaryKind | 'all'>('all');
  const [gen, setGen] = useState<number>(0);

  const {
    inventoryMap,
    walletMap,
    loading: loadingInventory,
    error: inventoryError,
    hasApiKey,
    refresh,
    lastUpdate,
  } = useGW2Inventory({ user });

  // ?id= permite compartir un enlace directo a una legendaria
  useEffect(() => {
    const fromUrl = Number(new URLSearchParams(window.location.search).get('id'));
    if (fromUrl) setSelectedId(fromUrl);
  }, []);

  const ids = useMemo(() => collectIds(data, selectedId), [data, selectedId]);

  useEffect(() => {
    if (!ids.length) return;
    let active = true;
    setLoadingPrices(true);
    fetchPrices(ids)
      .then((result) => active && setPrices(result))
      .finally(() => active && setLoadingPrices(false));
    return () => {
      active = false;
    };
  }, [ids]);

  useEffect(() => {
    if (useOwned && hasApiKey) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al activar el descuento
  }, [useOwned, hasApiKey]);

  const { localizedIds, tree, selected } = useMemo(() => {
    const entry = data.legendaries.find((l) => l.id === selectedId) ?? data.legendaries[0] ?? null;
    const result = buildTree(data, entry?.id ?? selectedId, prices, {
      mode: priceMode,
      owned: useOwned ? inventoryMap : undefined,
      wallet: useOwned ? walletMap : undefined,
      overrides,
      currencyOverrides,
    });
    const localizedIds = [...new Set([...ids, ...data.legendaries.map((l) => l.id)])];
    return { localizedIds, tree: result, selected: entry };
  }, [data, selectedId, prices, priceMode, useOwned, inventoryMap, walletMap, ids, overrides, currencyOverrides]);

  const { items } = useGW2Items(localizedIds, lang);

  const selectLegendary = useCallback((id: number) => {
    setSelectedId(id);
    setExpanded(new Set(['r']));
    setOverrides({});
    setCurrencyOverrides({});
    const url = new URL(window.location.href);
    url.searchParams.set('id', String(id));
    window.history.replaceState({}, '', url.toString());
  }, []);

  const toggleNode = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const decideNode = useCallback((id: number, mode: 'buy' | 'craft') => {
    setOverrides((prev) => ({ ...prev, [id]: mode }));
  }, []);

  const decideCurrency = useCallback((id: number, choice: string) => {
    setCurrencyOverrides((prev) => ({ ...prev, [id]: choice }));
  }, []);

  // tras forzar fabricar, abrir esa rama para ver ingredientes
  useEffect(() => {
    if (!tree) return;
    const craftIds = new Set(
      Object.entries(overrides)
        .filter(([, mode]) => mode === 'craft')
        .map(([id]) => Number(id))
    );
    if (!craftIds.size) return;
    setExpanded((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const node of flattenTree(tree.root)) {
        if (craftIds.has(node.id) && node.children.length && !next.has(node.key)) {
          next.add(node.key);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tree, overrides]);

  const expandAll = () => {
    if (!tree) return;
    setExpanded(new Set(flattenTree(tree.root).filter((n) => n.children.length).map((n) => n.key)));
  };

  const visibleLegendaries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.legendaries.filter((entry) => {
      const entryKind = entry.kind ?? 'weapon';
      if (kind !== 'all' && entryKind !== kind) return false;
      if (kind === 'weapon' && gen && entry.gen !== gen) return false;
      if (!needle) return true;
      const localized = items[entry.id]?.name ?? entry.name;
      const haystack = `${localized} ${entry.name} ${entry.set ?? ''} ${entryKind}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [data, query, gen, kind, items]);

  const kindLabel = (value: LegendaryKind | 'all') => {
    if (value === 'all') return t('legendary.kind.all', 'All');
    if (value === 'weapon') return t('legendary.kind.weapon', 'Weapons');
    if (value === 'armor') return t('legendary.kind.armor', 'Armor');
    if (value === 'backpack') return t('legendary.kind.backpack', 'Backpacks');
    return t('legendary.kind.trinket', 'Trinkets');
  };

  const labels = {
    buy: t('legendary.mode.buy', 'Buy'),
    craft: t('legendary.mode.craft', 'Craft'),
    account: t('legendary.mode.account', 'Account'),
    owned: t('legendary.owned', 'Have'),
    buyTp: t('legendary.mode.buyTp', 'TP'),
    craftOpt: t('legendary.mode.craftOpt', 'Craft'),
    tpInstant: t('legendary.tp.instant', 'Sell'),
    tpOrder: t('legendary.tp.order', 'Buy'),
    vendor: t('legendary.mode.vendor', 'Vendor'),
  };

  // Valor neto recibido al vender la legendaria: precio Sell menos 15% de comisión.
  const finishedSellNet = prices[selectedId]?.sell
    ? Math.floor(prices[selectedId].sell * 0.85)
    : null;
  const craftingProfit = finishedSellNet && tree ? finishedSellNet - tree.total : null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/20 to-violet-600/10">
            <Crown className="h-7 w-7 text-fuchsia-300" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t('legendary.title', 'Legendary Tracker')}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            {t(
              'legendary.subtitle',
              'Weapons, armor, backpacks and trinkets: full crafting tree with live Trading Post prices.'
            )}
          </p>
        </header>

        {/* Selector */}
        <div className={`${card} mb-6`}>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('legendary.searchPlaceholder', 'Search legendary…')}
                className="w-full rounded-xl border border-slate-600/50 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/25"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {KIND_ORDER.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setKind(value);
                    if (value !== 'weapon') setGen(0);
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    kind === value
                      ? 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200'
                      : 'border-slate-600/50 bg-slate-900/50 text-zinc-400 hover:text-white'
                  }`}
                >
                  {kindLabel(value)}
                </button>
              ))}
            </div>
            {(kind === 'all' || kind === 'weapon') && (
              <div className="flex flex-wrap gap-1.5">
                {[0, 1, 2, 3].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setGen(value);
                      if (value) setKind('weapon');
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
                      gen === value
                        ? 'border-violet-400/50 bg-violet-500/15 text-violet-200'
                        : 'border-slate-700/50 bg-slate-950/40 text-zinc-500 hover:text-white'
                    }`}
                  >
                    {value === 0 ? t('legendary.allGens', 'All gens') : `Gen ${value}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {visibleLegendaries.map((entry) => {
              const meta = items[entry.id] ?? itemMeta(data, entry.id);
              const active = entry.id === selectedId;
              const entryKind = entry.kind ?? 'weapon';
              const badge =
                entryKind === 'weapon'
                  ? `G${entry.gen}`
                  : entry.set
                    ? entry.set.split(' ')[0]
                    : entryKind.slice(0, 3).toUpperCase();
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => selectLegendary(entry.id)}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
                    active
                      ? 'border-fuchsia-400/50 bg-fuchsia-500/10'
                      : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-500/60 hover:bg-slate-800/60'
                  }`}
                >
                  {meta.icon && (
                    <Image src={meta.icon} alt="" width={24} height={24} className="rounded" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{meta.name}</span>
                  <span className="shrink-0 text-[10px] font-bold uppercase text-zinc-600">{badge}</span>
                </button>
              );
            })}
            {visibleLegendaries.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-zinc-500">
                {t('legendary.noResults', 'No legendaries match these filters.')}
              </p>
            )}
          </div>
        </div>

        {/* Coste total */}
        {tree && selected && (
          <div className={`${card} mb-4`}>
            {selected.gen === 3 && selected.kind === 'weapon' && (
              <div className="mb-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-amber-100">
                      {t('legendary.gen3PrecursorTitle', 'Gen 3 precursor')}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-amber-200/75">
                      {t(
                        'legendary.gen3PrecursorBody',
                        'Buy the precursor — do not craft it. Cheapest options, in order:'
                      )}
                    </p>
                    <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[11px] leading-relaxed text-amber-100/90">
                      <li>
                        <a
                          href="https://discord.com/invite/gw2overflow"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sky-300 underline decoration-sky-300/40 underline-offset-2 hover:text-sky-200"
                        >
                          {t('legendary.gen3PrecursorStepDiscord', 'Overflow Discord (~90%)')}
                        </a>
                        <span className="text-amber-200/65">
                          {' — '}
                          {t(
                            'legendary.gen3PrecursorStepDiscordHint',
                            'player trades around 90% of Trading Post price'
                          )}
                        </span>
                      </li>
                      <li>
                        <span className="font-semibold">{t('legendary.gen3PrecursorStepBuy', 'Buy')}</span>
                        <span className="text-amber-200/65">
                          {' — '}
                          {t('legendary.gen3PrecursorStepBuyHint', 'place a buy order on the Trading Post')}
                        </span>
                      </li>
                      <li>
                        <span className="font-semibold">{t('legendary.gen3PrecursorStepSell', 'Sell')}</span>
                        <span className="text-amber-200/65">
                          {' — '}
                          {t('legendary.gen3PrecursorStepSellHint', 'buy instantly from sell listings')}
                        </span>
                      </li>
                    </ol>
                    <p className="mt-2 text-[11px] font-medium text-rose-300/90">
                      {t(
                        'legendary.gen3PrecursorNever',
                        'Never craft the precursor — crafting it is always a gold loss.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                {t('legendary.totalCost', 'Total crafting cost')}
              </span>
              <span className="hidden min-w-8 flex-1 border-b border-dotted border-slate-600/60 sm:block" />
              {loadingPrices ? (
                <Loader2 className="h-5 w-5 animate-spin text-fuchsia-400" />
              ) : (
                <SalvageCurrency copper={tree.total} size="lg" />
              )}
            </div>

            <div className="mt-3 space-y-2 text-xs">
              {finishedSellNet && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5" />
                    {t('legendary.buyOutright', 'Finished Sell (85%)')}
                  </span>
                  <SalvageCurrency copper={finishedSellNet} size="sm" />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
              {craftingProfit !== null && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-semibold ${
                    craftingProfit > 0
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  }`}
                >
                  {craftingProfit > 0
                    ? t('legendary.craftingSaves', 'Crafting profit')
                    : t('legendary.buyingSaves', 'Crafting loss')}
                  <SalvageCurrency copper={Math.abs(craftingProfit)} size="sm" />
                </span>
              )}
              {useOwned && tree.totalFull > tree.total && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/50 bg-slate-900/50 px-2.5 py-1.5 text-zinc-400">
                  {t('legendary.withoutInventory', 'Without your materials')}
                  <SalvageCurrency copper={tree.totalFull} size="sm" />
                </span>
              )}
              </div>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-600/50 bg-slate-900/50 p-0.5">
            {(['sell', 'buy'] as PriceMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPriceMode(mode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  priceMode === mode ? 'bg-slate-700/80 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {mode === 'sell'
                  ? t('legendary.priceMode.sell', 'Sell')
                  : t('legendary.priceMode.buy', 'Buy')}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:text-white"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            {t('legendary.expandAll', 'Expand all')}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(new Set(['r']))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:text-white"
          >
            <ChevronsDownUp className="h-3.5 w-3.5" />
            {t('legendary.collapseAll', 'Collapse all')}
          </button>

          <button
            type="button"
            onClick={() => {
              if (useOwned) {
                void refresh();
                return;
              }
              setUseOwned(true);
            }}
            disabled={!hasApiKey || loadingInventory}
            title={
              hasApiKey
                ? useOwned
                  ? t('legendary.refreshInventory', 'Refresh inventory')
                  : undefined
                : t('legendary.needsApiKey', 'Add your GW2 API key in your profile to discount materials')
            }
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              useOwned
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-600/50 bg-slate-900/50 text-zinc-300 hover:text-white'
            }`}
          >
            {loadingInventory ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : hasApiKey ? (
              <RefreshCw className="h-3.5 w-3.5" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            {t('legendary.discountInventory', 'Discount my materials')}
          </button>
          {useOwned && (
            <button
              type="button"
              onClick={() => setUseOwned(false)}
              className="rounded-xl border border-slate-600/50 bg-slate-900/50 px-2.5 py-2 text-xs font-semibold text-zinc-400 transition hover:text-white"
            >
              {t('legendary.discountOff', 'Off')}
            </button>
          )}
        </div>
        {useOwned && (loadingInventory || inventoryError || lastUpdate) && (
          <p className="mb-4 text-xs text-zinc-500">
            {inventoryError
              ? inventoryError
              : loadingInventory
                ? t('legendary.loadingInventory', 'Reading your account inventories…')
                : lastUpdate
                  ? `${t('legendary.inventoryUpdated', 'Inventory updated')} ${lastUpdate.toLocaleTimeString()}`
                  : null}
          </p>
        )}

        {/* Árbol */}
        {tree && (
          <div className={`${card} overflow-x-auto`}>
            <LegendaryTree
              node={tree.root}
              data={data}
              items={items}
              expanded={expanded}
              onToggle={toggleNode}
              onDecide={decideNode}
              onCurrencyDecide={decideCurrency}
              labels={labels}
              priceMode={priceMode}
            />
          </div>
        )}

        {/* Monedas (karma / esquirlas) descontadas con el wallet */}
        {tree && tree.currencyRequirements.length > 0 && (
          <div className={`${card} mt-4`}>
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-sky-300" />
              {t('legendary.currencyTitle', 'Currencies needed')}
            </h2>
            <p className="mb-3 text-xs text-zinc-500">
              {useOwned
                ? t('legendary.currencySubtitleWallet', 'Discounted with your wallet balance.')
                : t('legendary.currencySubtitle', 'Enable "Discount my materials" to subtract your wallet.')}
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {tree.currencyRequirements.map((req) => {
                const meta = CURRENCY_META[req.id];
                const value = useOwned ? req.remaining : req.needed;
                return (
                  <div
                    key={req.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/40 px-2.5 py-1.5"
                  >
                    {meta?.icon && (
                      <Image src={meta.icon} alt="" width={20} height={20} className="rounded" />
                    )}
                    <a
                      href={gw2WikiUrl(meta?.name ?? String(req.id), lang, {
                        englishName: meta?.name,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate text-xs text-zinc-300 hover:underline"
                    >
                      {meta?.name ?? `#${req.id}`}
                    </a>
                    {useOwned && req.owned > 0 && (
                      <span className="shrink-0 text-[10px] text-emerald-400/80">
                        {labels.owned} {Math.floor(req.owned).toLocaleString()}
                      </span>
                    )}
                    <span
                      className={`shrink-0 font-mono text-xs font-semibold ${
                        value <= 0 ? 'text-emerald-400' : 'text-sky-300'
                      }`}
                    >
                      {value <= 0 ? '✓' : Math.ceil(value).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs leading-relaxed text-zinc-600">
          {t(
            'legendary.disclaimer',
            'Mystic Forge recipes come from the official wiki; prices are live from the Trading Post. Mystic Clovers are estimated at 31% success per attempt.'
          )}
        </p>
      </div>
    </div>
  );
}
