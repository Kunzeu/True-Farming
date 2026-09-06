'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Package, Database, Info, X, Download } from 'lucide-react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface SearchResult {
  id: number;
  name: string;
  icon?: string;
  count: number;
  location: string;
  rarity?: string;
  character?: string;
  slot?: number;
  bag?: number;
  category?: string;
}

type AggregatedSearchResult = {
  id: number;
  name: string;
  icon?: string;
  rarity?: string;
  totalCount: number;
  stacks: Array<{
    count: number;
    location: string;
    category?: string;
    character?: string;
    bag?: number;
    slot?: number;
  }>;
};

function aggregateSearchResults(items: SearchResult[]): AggregatedSearchResult[] {
  const map = new Map<number, AggregatedSearchResult>();

  for (const item of items) {
    let entry = map.get(item.id);
    if (!entry) {
      entry = {
        id: item.id,
        name: item.name,
        icon: item.icon,
        rarity: item.rarity,
        totalCount: 0,
        stacks: [],
      };
      map.set(item.id, entry);
    }
    entry.totalCount += item.count;
    entry.stacks.push({
      count: item.count,
      location: item.location,
      category: item.category,
      character: item.character,
      bag: item.bag,
      slot: item.slot,
    });
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function formatSearchLocation(
  location: string,
  t: (key: string, fallback?: string) => string,
): string {
  if (location.includes('search.bankSlot')) {
    return `${t('search.bankSlot', 'Bank Slot')} ${location.split(' ')[1] ?? ''}`.trim();
  }
  if (location.includes('search.characterBag')) {
    return location.replace('search.characterBag', t('search.characterBag', 'Bag'));
  }
  if (location.includes('search.materialStorage')) {
    return t('search.materialStorage', 'Material Storage');
  }
  return location;
}

function compactLocationStacks(
  stacks: AggregatedSearchResult['stacks'],
  t: (key: string, fallback?: string) => string,
) {
  const groups = new Map<string, { label: string; count: number; places: number }>();

  for (const stack of stacks) {
    const isBank = stack.category === 'bank' || stack.location.includes('search.bankSlot');
    const isStorage = stack.category === 'storage' || stack.location.includes('search.materialStorage');
    const isShared = stack.category === 'shared';
    const character =
      stack.character ||
      (stack.location.includes('search.characterBag') ? stack.location.split(' - ')[0] : '');
    const key = isBank
      ? 'bank'
      : isStorage
        ? 'storage'
        : isShared
          ? 'shared'
          : `char:${character || formatSearchLocation(stack.location, t)}`;
    const label = isBank
      ? t('account.bank', 'Bank')
      : isStorage
        ? t('search.materialStorage', 'Material Storage')
        : isShared
          ? t('search.sharedInventory', 'Shared inventory')
          : character || formatSearchLocation(stack.location, t);

    const prev = groups.get(key);
    if (prev) {
      prev.count += stack.count;
      prev.places += 1;
    } else {
      groups.set(key, { label, count: stack.count, places: 1 });
    }
  }

  return [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function LocationsPanel({
  itemId,
  itemName,
  totalCount,
  stacks,
  t,
}: {
  itemId: number;
  itemName: string;
  totalCount: number;
  stacks: AggregatedSearchResult['stacks'];
  t: (key: string, fallback?: string) => string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const groups = compactLocationStacks(stacks, t);

  if (groups.length === 1) {
    const only = groups[0];
    return (
      <p className="text-xs text-gray-500">
        <strong>{t('search.location', 'Location')}:</strong>{' '}
        {only.label} ({only.count.toLocaleString()})
      </p>
    );
  }

  const modal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              aria-label={t('common.close', 'Close')}
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`locations-title-${itemId}`}
              className="relative z-10 flex w-full max-w-lg max-h-[85vh] flex-col rounded-xl border border-gray-600 bg-gray-900 shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-gray-700 px-5 py-4">
                <div className="min-w-0">
                  <h4 id={`locations-title-${itemId}`} className="truncate font-semibold text-white">
                    {itemName}
                  </h4>
                  <p className="mt-1 text-sm text-gray-400">
                    {t('search.totalQuantity', 'Total quantity')}:{' '}
                    <span className="font-semibold text-blue-300">{totalCount.toLocaleString()}</span>
                    {' · '}
                    {t('search.locationCount', '{count} locations').replace('{count}', String(groups.length))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
                  aria-label={t('common.close', 'Close')}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ul className="grid grid-cols-1 gap-2 overflow-y-auto p-4">
                {groups.map((group) => (
                  <li
                    key={group.label}
                    className="flex items-center justify-between gap-2 rounded-lg bg-gray-800/80 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-gray-200">{group.label}</span>
                    <span className="shrink-0 font-semibold text-blue-300">
                      {group.count.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 bg-gray-700/60 px-2.5 py-1 text-xs font-medium text-gray-200 transition-colors hover:border-blue-500/60 hover:bg-gray-700 hover:text-blue-200"
        aria-expanded={open}
        onClick={() => setOpen(true)}>
        <Info className="h-3.5 w-3.5 shrink-0" />
        {t('search.locationCount', '{count} locations').replace('{count}', String(groups.length))}
      </button>
      {modal}
    </>
  );
}

import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import ServiceUnavailableModal from '@/components/ui/ServiceUnavailableModal';
import { useApiStatus } from '@/hooks/useApiStatus';
import AccountLayout from '@/components/account/AccountLayout';
import AccountNoApiKeyBanner from '@/components/account/AccountNoApiKeyBanner';
import AccountRefreshingIndicator from '@/components/account/AccountRefreshingIndicator';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import { fetchAccountSearchIndex } from '@/lib/gw2-client-account-data';
import { GW2_CACHE_TTL, readSessionCache, writeSessionCache } from '@/lib/gw2-client-cache';
import { hasExclusiveAccess } from '@/lib/patreon-benefits';

const SearchPage = () => {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { hasApiKey, apiKey, loading: gw2Loading } = useAccountGw2();
  const { hasApiIssues, isApiHealthy } = useApiStatus();
  usePageTitle('pageTitles.search', t('pageTitles.search', 'Account Search'));
  const [searchTerm, setSearchTerm] = useState('');
  const [index, setIndex] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchScope, setSearchScope] = useState<'all' | 'bank' | 'characters' | 'storage'>('all');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isModalClosed, setIsModalClosed] = useState(false);

  useEffect(() => {
    if (isApiHealthy) setIsModalClosed(false);
  }, [isApiHealthy]);

  useEffect(() => {
    if (!user?.id || gw2Loading) return;
    if (!apiKey) {
      setIsLoading(false);
      return;
    }

    const cacheKey = `gw2_search_${user.id}_${lang}`;
    const cached = readSessionCache<SearchResult[]>(cacheKey, GW2_CACHE_TTL.accountPage);
    if (cached?.length) {
      setIndex(cached);
      setIsLoading(false);
    }

    let cancelled = false;
    (async () => {
      if (!cached?.length) setIsLoading(true);
      else setIsRefreshing(true);
      setApiError(null);
      try {
        const data = await fetchAccountSearchIndex(user.id, lang, apiKey);
        if (cancelled) return;
        const next = Array.isArray(data) ? (data as unknown as SearchResult[]) : [];
        setIndex(next);
        writeSessionCache(cacheKey, next, GW2_CACHE_TTL.accountPage);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Network error or service unavailable';
          setApiError(message.includes('429') ? t('profile.apiKey.rateLimited', 'GW2 rate limit — try again in a few seconds') : message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, user?.id, apiKey, gw2Loading, t]);

  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return index.filter((item) => {
      if (
        searchScope !== 'all' &&
        item.category !== searchScope &&
        !(searchScope === 'bank' && item.category === 'shared') &&
        !(searchScope === 'characters' && item.category === 'character')
      ) {
        return false;
      }
      return item.name.toLowerCase().includes(q);
    });
  }, [index, searchTerm, searchScope]);

  const aggregatedResults = useMemo(
    () => aggregateSearchResults(searchResults),
    [searchResults],
  );

  return (
    <AccountLayout
      section="search"
      title={t('search.title', 'Search')}
      subtitle={t('search.subtitle', 'Search items in your account')}>
      {!gw2Loading && !hasApiKey && <AccountNoApiKeyBanner />}

      <AccountRefreshingIndicator visible={isRefreshing} />

      {/* Search Controls */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('search.searchPlaceholder', 'Search items...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSearchScope('all')}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  searchScope === 'all' 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {t('search.scopeAll', 'All')}
              </button>
              <button
                onClick={() => setSearchScope('bank')}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  searchScope === 'bank' 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
                title={t('search.scopeBank', 'Bank')}
              >
                <Package className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSearchScope('characters')}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  searchScope === 'characters' 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
                title={t('search.scopeCharacters', 'Characters')}
              >
                <Image 
                  src="/images/icons/character-slot.png" 
                  alt="Character"
                  width={200}
                  height={200}
                  className="w-6 h-6 object-cover"
                />
              </button>
              <button
                onClick={() => setSearchScope('storage')}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  searchScope === 'storage' 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
                title={t('search.scopeStorage', 'Storage')}
              >
                <Database className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                         <p className="text-gray-400">{t('search.loading', 'Loading account...')}</p>
          </div>
        )}

        {!isLoading && aggregatedResults.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aggregatedResults.map((item) => (
              <div
                key={item.id}
                className="overflow-visible rounded-lg border border-gray-700 bg-gray-800 p-4 sm:p-6">
                <div className="mb-4 flex min-w-0 items-center">
                  {item.icon && (
                    <Image
                      src={item.icon}
                      alt={item.name}
                      width={32}
                      height={32}
                      className="mr-3 shrink-0"
                    />
                  )}
                  <h3 className="min-w-0 truncate text-base font-semibold text-white sm:text-lg">{item.name}</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-400">
                  <p>
                    <strong>{t('search.totalQuantity', 'Total quantity')}:</strong>{' '}
                    <span className="text-lg font-semibold text-blue-300">
                      {item.totalCount.toLocaleString()}
                    </span>
                  </p>
                  <LocationsPanel itemId={item.id} itemName={item.name} totalCount={item.totalCount} stacks={item.stacks} t={t} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && searchTerm && aggregatedResults.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">{t('search.emptyTitle', 'No results found')}</h3>
            <p className="text-gray-400">{t('search.emptyDesc', 'Try with other search terms')}</p>
          </div>
        )}
        <ServiceUnavailableModal
          isOpen={hasApiIssues && !isApiHealthy && !isModalClosed}
          onClose={() => {
            setApiError(null);
            setIsModalClosed(true);
          }}
          description={apiError || undefined}
        />
    </AccountLayout>
  );
};

export default SearchPage;