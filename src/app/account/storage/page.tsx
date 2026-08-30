'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Database, Search } from 'lucide-react';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import ServiceUnavailableModal from '@/components/ui/ServiceUnavailableModal';
import { useApiStatus } from '@/hooks/useApiStatus';
import AccountLayout from '@/components/account/AccountLayout';
import AccountNoApiKeyBanner from '@/components/account/AccountNoApiKeyBanner';
import AccountRefreshingIndicator from '@/components/account/AccountRefreshingIndicator';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import { fetchMaterialsFromBrowser, enrichMaterialPrices } from '@/lib/gw2-client-account-data';
import type { MaterialStorageData } from '@/lib/gw2-client-account-data';
import { GW2_CACHE_TTL, writeSessionCache } from '@/lib/gw2-client-cache';
import { useAccountPageCache } from '@/hooks/useAccountPageCache';
import { useAccountItemTooltip } from '@/hooks/useAccountItemTooltip';
import AccountItemTooltip from '@/components/account/AccountItemTooltip';
import type { MaterialCategoryDef, MaterialSortKey, StorageMaterial } from '@/lib/gw2-material-storage';
import {
  getRarityBorderColor,
  groupMaterialsByCategory,
  sortMaterials,
} from '@/lib/gw2-material-storage';

const ALL_CATEGORIES = 'all';

const StoragePage = () => {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { hasApiKey, apiKey, loading: gw2Loading } = useAccountGw2();
  const { hasApiIssues, isApiHealthy } = useApiStatus();
  usePageTitle('pageTitles.storage', t('pageTitles.storage', 'Material Storage'));

  const [categories, setCategories] = useState<MaterialCategoryDef[]>([]);
  const [materials, setMaterials] = useState<StorageMaterial[]>([]);
  const materialsRef = useRef(materials);
  materialsRef.current = materials;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
  const [sortBy, setSortBy] = useState<MaterialSortKey>('in-game');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isModalClosed, setIsModalClosed] = useState(false);
  const { hovered, position, handleHover, handleLeave } = useAccountItemTooltip(lang);

  useEffect(() => {
    if (isApiHealthy) setIsModalClosed(false);
  }, [isApiHealthy]);

  const cacheKey = user?.id ? `gw2_storage_${user.id}_${lang}` : null;

  const applyCachedStorage = useCallback((cached: MaterialStorageData) => {
    setCategories(cached.categories);
    setMaterials(cached.materials);
    setIsLoading(false);
  }, []);

  useAccountPageCache(cacheKey, applyCachedStorage);

  const fetchMaterialsData = useCallback(async (options?: { forceLoading?: boolean }) => {
    if (!user?.id || !apiKey) return;

    const showSpinner = options?.forceLoading || materialsRef.current.length === 0;

    try {
      if (showSpinner) setIsLoading(true);
      else setIsRefreshing(true);
      setApiError(null);

      const data = await fetchMaterialsFromBrowser(user.id, lang, apiKey, { withPrices: false });
      if (!data) return;

      setCategories(data.categories);
      setMaterials(data.materials);
      setIsLoading(false);
      if (cacheKey) writeSessionCache(cacheKey, data, GW2_CACHE_TTL.accountPage);

      const enriched = await enrichMaterialPrices(data.materials);
      const withPrices = { categories: data.categories, materials: enriched };
      setMaterials(enriched);
      if (cacheKey) writeSessionCache(cacheKey, withPrices, GW2_CACHE_TTL.accountPage);
    } catch (error) {
      console.error('Error fetching materials:', error);
      const message = error instanceof Error ? error.message : 'Network error or service unavailable';
      setApiError(
        message.includes('429')
          ? t('profile.apiKey.rateLimited', 'GW2 rate limit — try again in a few seconds')
          : message,
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, apiKey, t, lang, cacheKey]);

  useEffect(() => {
    if (user?.id && apiKey) {
      void fetchMaterialsData();
    } else if (!gw2Loading) {
      setIsLoading(false);
    }
  }, [user?.id, apiKey, gw2Loading, fetchMaterialsData]);

  const formatGold = (copper: number) => ({
    gold: Math.floor(copper / 10000),
    silver: Math.floor((copper % 10000) / 100),
    copper: copper % 100,
  });

  const filteredMaterials = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = materials;
    if (categoryFilter !== ALL_CATEGORIES) {
      const categoryId = Number(categoryFilter);
      list = list.filter((m) => m.categoryId === categoryId);
    }
    if (term) {
      list = list.filter((m) => m.name.toLowerCase().includes(term));
    }
    return list;
  }, [materials, searchTerm, categoryFilter]);

  const sections = useMemo(() => {
    if (categoryFilter !== ALL_CATEGORIES) {
      const category = categories.find((c) => c.id === Number(categoryFilter));
      if (!category) return [];
      return [{ category, materials: sortMaterials(filteredMaterials, sortBy) }];
    }
    return groupMaterialsByCategory(filteredMaterials, categories).map((section) => ({
      ...section,
      materials: sortMaterials(section.materials, sortBy),
    }));
  }, [filteredMaterials, categories, categoryFilter, sortBy]);

  const visibleCount = useMemo(
    () => sections.reduce((sum, section) => sum + section.materials.length, 0),
    [sections],
  );

  const totalValue = useMemo(
    () => materials.reduce((sum, m) => sum + m.count * (m.unitPrice ?? 0), 0),
    [materials],
  );
  const totalValueParts = formatGold(totalValue);

  const sortOptions: { value: MaterialSortKey; label: string }[] = [
    { value: 'in-game', label: t('storage.sort.inGame', 'In-Game') },
    { value: 'name', label: t('storage.sort.name', 'Name') },
    { value: 'price', label: t('storage.sort.price', 'Price') },
    { value: 'unit-price', label: t('storage.sort.unitPrice', 'Individual Price') },
    { value: 'rarity', label: t('storage.sort.rarity', 'Rarity') },
    { value: 'count', label: t('storage.sort.count', 'Count') },
  ];

  return (
    <AccountLayout
      section="storage"
      title={t('storage.title', 'Material Storage')}
      subtitle={t('storage.subtitle', 'Your Material Storage')}
    >
      {!gw2Loading && !hasApiKey && (
        <AccountNoApiKeyBanner
          messageKey="account.noApiKeyStorage"
          messageFallback="Add your Guild Wars 2 API key in Settings to enable Material Storage."
        />
      )}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('storage.searchPlaceholder', 'Search materials...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-sm text-gray-400">
            {t('storage.filterCategory', 'Category')}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-w-[200px] px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value={ALL_CATEGORIES}>{t('storage.allCategories', 'All categories')}</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-gray-400">
            {t('storage.orderBy', 'Order By')}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as MaterialSortKey)}
              className="min-w-[180px] px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => void fetchMaterialsData({ forceLoading: true })}
            className="self-end rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            {t('common.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      <AccountRefreshingIndicator visible={isRefreshing} />

      {!isLoading && materials.length > 0 && (
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-300">
          <span className="text-gray-400">{t('storage.totalValue', 'Total Value')}</span>
          <span className="text-yellow-400 font-semibold">{totalValueParts.gold}</span>
          <Image src="/images/expansions/Gold.webp" alt="" width={16} height={16} />
          <span>{totalValueParts.silver}</span>
          <Image src="/images/expansions/Silver.webp" alt="" width={16} height={16} />
          <span>{String(totalValueParts.copper).padStart(2, '0')}</span>
          <Image src="/images/expansions/Copper.webp" alt="" width={16} height={16} />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">{t('storage.loading', 'Loading materials...')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map(({ category, materials: sectionMaterials }) => (
            <section key={category.id}>
              <h2 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">
                {category.name}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({sectionMaterials.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {sectionMaterials.map((material) => (
                  <div
                    key={material.id}
                    className={`relative cursor-pointer rounded-lg border-2 ${getRarityBorderColor(material.rarity)} bg-gray-800 p-2 transition-colors hover:bg-gray-700`}
                    onMouseEnter={(e) => handleHover({ id: material.id, count: material.count }, e)}
                    onMouseLeave={handleLeave}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {material.icon ? (
                        <Image
                          src={material.icon}
                          alt={material.name}
                          width={48}
                          height={48}
                          className="w-12 h-12"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-700 rounded" />
                      )}
                      <span className="text-xs text-center text-gray-300 line-clamp-2 leading-tight">
                        {material.name}
                      </span>
                      <span className="text-blue-400 font-semibold text-sm">
                        {material.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {!isLoading && visibleCount === 0 && (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            {t('storage.emptyTitle', 'No materials')}
          </h3>
          <p className="text-gray-400">
            {searchTerm || categoryFilter !== ALL_CATEGORIES
              ? t('storage.emptyFilter', 'No materials match your filters')
              : t('storage.emptyDesc', 'There are no materials in your storage')}
          </p>
        </div>
      )}

      <AccountItemTooltip data={hovered} position={position} />

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

export default StoragePage;
