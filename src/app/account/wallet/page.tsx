'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import ServiceUnavailableModal from '@/components/ui/ServiceUnavailableModal';
import { useApiStatus } from '@/hooks/useApiStatus';
import AccountLayout from '@/components/account/AccountLayout';
import AccountNoApiKeyBanner from '@/components/account/AccountNoApiKeyBanner';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import { fetchWalletFromBrowser } from '@/lib/gw2-client-account-data';

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
  const { hasApiKey, loading: gw2Loading } = useAccountGw2();
  const { hasApiIssues, isApiHealthy } = useApiStatus();
  usePageTitle('pageTitles.wallet', t('account.wallet', 'Wallet'));
  const [walletData, setWalletData] = useState<WalletItem[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchWalletData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setApiError(null);

      const result = await fetchWalletFromBrowser(user.id, lang, importantCurrencyIds);
      if (!result) {
        setIsLoading(false);
        return;
      }

      setWalletData(result.wallet);
      const onlyImportant = result.currencies.filter((c) => importantCurrencyIds.includes(c.id));
      setCurrencies(onlyImportant);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      const message = error instanceof Error ? error.message : 'Network error or service unavailable';
      setApiError(message.includes('429') ? t('profile.apiKey.rateLimited', 'GW2 rate limit — try again in a few seconds') : message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, importantCurrencyIds, t, lang]);

  useEffect(() => {
    if (user?.id && hasApiKey) {
      fetchWalletData();
    } else if (!gw2Loading) {
      setIsLoading(false);
    }
  }, [user?.id, hasApiKey, gw2Loading, fetchWalletData]);

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
                  <div key={currencyId} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {currency?.icon && (
                          <Image 
                            src={currency.icon} 
                            alt={currency.name}
                            width={32}
                            height={32}
                            className="mr-3"
                          />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold">
                            {currency?.name || `Moneda ${currencyId}`}
                          </h3>
                          {currency?.description && (
                            <p className="text-gray-400 text-sm">{currency.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-400">
                          {currencyId === 1 ? formatGold(walletItem.value) : walletItem.value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
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