'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { gw2WikiUrl } from '@/lib/gw2-wiki';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import ServiceUnavailableModal from '@/components/ui/ServiceUnavailableModal';
import { useApiStatus } from '@/hooks/useApiStatus';
import AccountLayout from '@/components/account/AccountLayout';
import AccountNoApiKeyBanner from '@/components/account/AccountNoApiKeyBanner';
import AccountRefreshingIndicator from '@/components/account/AccountRefreshingIndicator';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import { fetchWalletFromBrowser } from '@/lib/gw2-client-account-data';
import { GW2_CACHE_TTL, writeSessionCache, readSessionCache } from '@/lib/gw2-client-cache';
import { useAccountPageCache } from '@/hooks/useAccountPageCache';
import { hasExclusiveAccess } from '@/lib/patreon-benefits';
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WalletItem {
  id: number;
  value: number;
}

interface Currency {
  id: number;
  name: string;
  description: string;
  order: number;
  icon: string;
  wikiName?: string;
}

const CURRENCY_HREF: Record<number, string> = {
  3: '/opened/laurels',
  23: '/magic#conversions',
  24: '/fractals',
  32: '/magic#unbound-magic',
  45: '/magic#volatile-magic',
  50: '/festivals/four-winds#Box-Opening',
  59: '/fractals',
  61: '/salvage/research-notes',
  78: '/opened/essence',
  79: '/opened/essence',
  80: '/opened/essence',
};

function SortableCurrencyItem({ 
  currencyId, 
  walletItem, 
  currency, 
  href, 
  isInternal, 
  formatGold 
}: { 
  currencyId: number;
  walletItem: WalletItem;
  currency?: Currency;
  href: string;
  isInternal: boolean;
  formatGold: (c: number) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: currencyId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const name = currency?.name || `Moneda ${currencyId}`;

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-gray-700 bg-gray-800 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center">
          <button
            type="button"
            className="mr-2 cursor-grab touch-none p-1 text-gray-500 hover:text-gray-300 focus:outline-none"
            aria-label="Arrastrar para ordenar"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          {currency?.icon && (
            isInternal ? (
              <Link href={href} className="mr-3 shrink-0" draggable={false}>
                <Image src={currency.icon} alt="" width={32} height={32} draggable={false} />
              </Link>
            ) : (
              <a href={href} target="_blank" rel="noreferrer" className="mr-3 shrink-0" draggable={false}>
                <Image src={currency.icon} alt="" width={32} height={32} draggable={false} />
              </a>
            )
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold sm:text-lg">
              {isInternal ? (
                <Link href={href} className="hover:underline decoration-white/30 underline-offset-4" draggable={false}>
                  {name}
                </Link>
              ) : (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline decoration-white/30 underline-offset-4"
                  draggable={false}
                >
                  {name}
                </a>
              )}
            </h3>
            {currency?.description && (
              <p className="mt-0.5 hidden text-sm text-gray-400 sm:line-clamp-2 sm:block">{currency.description}</p>
            )}
          </div>
        </div>
        <p className="shrink-0 text-right text-lg font-bold text-blue-400 sm:text-2xl">
          {currencyId === 1 ? formatGold(walletItem.value) : walletItem.value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

const WalletPage = () => {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { hasApiKey, apiKey, loading: gw2Loading } = useAccountGw2();
  const { hasApiIssues, isApiHealthy } = useApiStatus();
  usePageTitle('pageTitles.wallet', t('account.wallet', 'Wallet'));
  const [walletData, setWalletData] = useState<WalletItem[]>([]);
  const walletDataRef = useRef(walletData);
  walletDataRef.current = walletData;
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isModalClosed, setIsModalClosed] = useState(false);
  const [coinDelta, setCoinDelta] = useState<number | null>(null);

  // Important currency IDs (ordered with Spirit Shards after Coin)
  const importantCurrencyIds = useMemo(() => [
    1, 23, 2, 3, 4, 7, 15, 19, 20, 22, 24, 26, 28, 29, 30, 32, 33, 45, 50, 59, 61, 62, 63, 66, 68, 69, 70, 72, 73, 75, 76, 77, 78, 79, 80
  ], []);

  const [customOrder, setCustomOrder] = useState<number[]>([]);
  const [orderLoaded, setOrderLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tf_wallet_custom_order');
      if (stored) {
        setCustomOrder(JSON.parse(stored));
      } else {
        const favs = localStorage.getItem('tf_wallet_favorites');
        if (favs) {
          const parsedFavs = JSON.parse(favs);
          const f = importantCurrencyIds.filter(id => parsedFavs.includes(id));
          const o = importantCurrencyIds.filter(id => !parsedFavs.includes(id));
          setCustomOrder([...f, ...o]);
        } else {
          setCustomOrder([...importantCurrencyIds]);
        }
      }
    } catch (e) {
      setCustomOrder([...importantCurrencyIds]);
    }
    setOrderLoaded(true);
  }, [importantCurrencyIds]);

  const saveOrder = (newOrder: number[]) => {
    setCustomOrder(newOrder);
    try {
      localStorage.setItem('tf_wallet_custom_order', JSON.stringify(newOrder));
    } catch (e) {}
  };

  const displayOrder = useMemo(() => {
    if (!orderLoaded) return importantCurrencyIds;
    const orderedIds = customOrder.filter(id => importantCurrencyIds.includes(id));
    const missingIds = importantCurrencyIds.filter(id => !customOrder.includes(id));
    return [...orderedIds, ...missingIds];
  }, [customOrder, importantCurrencyIds, orderLoaded]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = displayOrder.indexOf(active.id as number);
      const newIndex = displayOrder.indexOf(over.id as number);
      if (oldIndex !== -1 && newIndex !== -1) {
        saveOrder(arrayMove(displayOrder, oldIndex, newIndex));
      }
    }
  };

  

  const formatGold = (copper: number) => {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperRemaining = copper % 100;
    return `${gold}g ${silver}s ${copperRemaining}c`;
  };

  // Reset modal closed state when API becomes healthy
  useEffect(() => {
    if (isApiHealthy) {
      setIsModalClosed(false);
    }
  }, [isApiHealthy]);

  const handleCloseModal = () => {
    setApiError(null);
    setIsModalClosed(true);
  };

  const cacheKey = user?.id ? `gw2_wallet_${user.id}_${lang}` : null;

  const applyCachedWallet = useCallback(
    (cached: { wallet: WalletItem[]; currencies: Currency[] }) => {
      setWalletData(cached.wallet);
      setCurrencies(cached.currencies);
      setIsLoading(false);
    },
    [],
  );

  useAccountPageCache(cacheKey, applyCachedWallet);

  const fetchWalletData = useCallback(async (options?: { forceLoading?: boolean }) => {
    if (!user?.id || !apiKey) return;

    const cached = cacheKey ? readSessionCache(cacheKey, GW2_CACHE_TTL.accountPage) : null;
    const showSpinner = options?.forceLoading || (walletDataRef.current.length === 0 && !cached);

    try {
      if (showSpinner) setIsLoading(true);
      else setIsRefreshing(true);
      setApiError(null);

      const result = await fetchWalletFromBrowser(user.id, lang, importantCurrencyIds, apiKey);
      if (!result) {
        setIsLoading(false);
        return;
      }

      const onlyImportant = result.currencies.filter((c) => importantCurrencyIds.includes(c.id));
      setWalletData(result.wallet);
      setCurrencies(onlyImportant);
      if (cacheKey) {
        writeSessionCache(cacheKey, { wallet: result.wallet, currencies: onlyImportant }, GW2_CACHE_TTL.accountPage);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      const message = error instanceof Error ? error.message : 'Network error or service unavailable';
      setApiError(message.includes('429') ? t('profile.apiKey.rateLimited', 'GW2 rate limit — try again in a few seconds') : message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, apiKey, importantCurrencyIds, t, lang, cacheKey]);

  useEffect(() => {
    if (user?.id && apiKey) {
      void fetchWalletData();
    } else if (!gw2Loading) {
      setIsLoading(false);
    }
  }, [user?.id, apiKey, gw2Loading, fetchWalletData]);

  useEffect(() => {
    if (!user?.id || !hasExclusiveAccess(user) || !walletData.length) return;
    const coins = walletData.find((item) => item.id === 1)?.value;
    if (coins == null) return;
    const key = `tf_wallet_snap_${user.id}`;
    try {
      if (sessionStorage.getItem(`${key}:seen`)) return;
      const prevRaw = localStorage.getItem(key);
      const prev = prevRaw ? (JSON.parse(prevRaw) as { coins: number }) : null;
      if (prev && Number.isFinite(prev.coins)) setCoinDelta(coins - prev.coins);
      localStorage.setItem(key, JSON.stringify({ coins, at: Date.now() }));
      sessionStorage.setItem(`${key}:seen`, '1');
    } catch {
      /* ignore */
    }
  }, [user, walletData]);

  return (
    <AccountLayout
      section="wallet"
      title={t('account.wallet', 'Wallet')}
      subtitle={t('account.walletSubtitle', 'Your coins and resources')}>
      {!gw2Loading && !hasApiKey && (
        <AccountNoApiKeyBanner
          messageKey="account.noApiKeyWallet"
          messageFallback="Add your Guild Wars 2 API key in Settings to enable Wallet."
        />
      )}

      {coinDelta != null && coinDelta !== 0 && (
        <p className={`mb-3 text-sm ${coinDelta > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
          {t('account.walletSinceLastVisit', 'Since last visit')}: {coinDelta > 0 ? '+' : ''}
          {formatGold(Math.abs(coinDelta))}
        </p>
      )}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => void fetchWalletData({ forceLoading: true })}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          {t('common.refresh', 'Refresh')}
        </button>
      </div>

      <AccountRefreshingIndicator visible={isRefreshing} />

      {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">{t('account.loadingWallet', 'Loading wallet...')}</p>
          </div>
                 ) : (                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={displayOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {displayOrder.map((currencyId) => {
                    const walletItem = walletData.find(item => item.id === currencyId);
                    const currency = currencies.find(c => c.id === currencyId);
                    
                    if (!walletItem) return null;

                    const wikiName = currency?.wikiName || currency?.name || `Moneda ${currencyId}`;
                    const href = CURRENCY_HREF[currencyId] ?? gw2WikiUrl(wikiName, lang, { englishName: wikiName });
                    const isInternal = href.startsWith('/');
                    
                    return (
                      <SortableCurrencyItem
                        key={currencyId}
                        currencyId={currencyId}
                        walletItem={walletItem}
                        currency={currency}
                        href={href}
                        isInternal={isInternal}
                        formatGold={formatGold}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
         )}

      {!isLoading && walletData.length === 0 && hasApiKey && (
        <div className="text-center py-12 text-gray-400">
          <p>{t('account.walletEmpty', 'No wallet currencies found')}</p>
        </div>
      )}

      <ServiceUnavailableModal
        isOpen={hasApiIssues && !isApiHealthy && !isModalClosed}
        onClose={handleCloseModal}
        description={apiError || undefined}
      />
    </AccountLayout>
  );
};

export default WalletPage;