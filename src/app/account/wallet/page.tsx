'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import ServiceUnavailableModal from '@/components/ui/ServiceUnavailableModal';
import { useApiStatus } from '@/hooks/useApiStatus';
import AccountLayout from '@/components/account/AccountLayout';
import AccountNoApiKeyBanner from '@/components/account/AccountNoApiKeyBanner';
import AccountRefreshingIndicator from '@/components/account/AccountRefreshingIndicator';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import { fetchWalletFromBrowser } from '@/lib/gw2-client-account-data';
import { GW2_CACHE_TTL, writeSessionCache } from '@/lib/gw2-client-cache';
import { useAccountPageCache } from '@/hooks/useAccountPageCache';

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

  // Important currency IDs (ordered with Spirit Shards after Coin)
  const importantCurrencyIds = useMemo(() => [
    1, 23, 2, 3, 4, 7, 15, 19, 20, 22, 24, 26, 28, 29, 30, 32, 33, 45, 50, 59, 61, 62, 63, 66, 68, 69, 70, 72, 73, 75, 76, 77, 78, 79, 80
  ], []);

  

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

    const showSpinner = options?.forceLoading || walletDataRef.current.length === 0;

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
                 ) : (
                       <div className="space-y-4">
              {importantCurrencyIds.map((currencyId) => {
                const walletItem = walletData.find(item => item.id === currencyId);
                const currency = currencies.find(c => c.id === currencyId);
                
                if (!walletItem) return null;
                
                return (
                  <div key={currencyId} className="rounded-lg border border-gray-700 bg-gray-800 p-3 sm:p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center">
                        {currency?.icon && (
                          <Image 
                            src={currency.icon} 
                            alt={currency.name}
                            width={32}
                            height={32}
                            className="mr-3 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold sm:text-lg">
                            {currency?.name || `Moneda ${currencyId}`}
                          </h3>
                          {currency?.description && (
                            <p className="line-clamp-2 text-sm text-gray-400">{currency.description}</p>
                          )}
                        </div>
                      </div>
                      <p className="shrink-0 text-xl font-bold text-blue-400 sm:text-right sm:text-2xl">
                        {currencyId === 1 ? formatGold(walletItem.value) : walletItem.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
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