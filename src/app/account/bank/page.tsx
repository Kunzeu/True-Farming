'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
 
import { useAuth } from '@/contexts/AuthContext';
import { Package, Search, Database } from 'lucide-react';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import ServiceUnavailableModal from '@/components/ui/ServiceUnavailableModal';
import { useApiStatus } from '@/hooks/useApiStatus';
import AccountRefreshingIndicator from '@/components/account/AccountRefreshingIndicator';
import AccountLayout from '@/components/account/AccountLayout';
import AccountNoApiKeyBanner from '@/components/account/AccountNoApiKeyBanner';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import { fetchBankFromBrowser, enrichBankWithPrices } from '@/lib/gw2-client-account-data';
import { GW2_CACHE_TTL, writeSessionCache } from '@/lib/gw2-client-cache';
import { useAccountPageCache } from '@/hooks/useAccountPageCache';
import { useAccountItemTooltip } from '@/hooks/useAccountItemTooltip';
import AccountItemTooltip from '@/components/account/AccountItemTooltip';
import { formatGoldParts, type AccountItemPrice } from '@/lib/account-item-tooltip';

type ItemPrice = AccountItemPrice;

interface BankItem {
  id: number;
  name: string;
  icon?: string;
  count: number;
  rarity?: string;
  type?: string;
  slot: number;
  bound?: boolean;
  value?: number;
  price?: ItemPrice;
}

interface BankSummary {
  totalBuyPrice: number;
  totalSellPrice: number;
  totalValue: number;
  usedSlots: number;
  totalSlots: number;
}

const BankPage = () => {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { hasApiKey, apiKey, loading: gw2Loading } = useAccountGw2();
  const { hasApiIssues, isApiHealthy } = useApiStatus();
  usePageTitle('pageTitles.bank', t('pageTitles.bank', 'Bank'));
  const [bankItems, setBankItems] = useState<(BankItem | null)[]>([]);
  const bankItemsRef = useRef(bankItems);
  bankItemsRef.current = bankItems;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { hovered, position, handleHover, handleLeave, itemCache } = useAccountItemTooltip(lang);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isModalClosed, setIsModalClosed] = useState(false);

  // Reset modal closed state when API becomes healthy
  useEffect(() => {
    if (isApiHealthy) {
      setIsModalClosed(false);
    }
  }, [isApiHealthy]);

  // Simple formatter for i18n strings with placeholders like {used}
  const format = (template: string, params: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_match, key) => String(params[key] ?? _match));

  const formatGold = formatGoldParts;

  const getRarityBorderColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 'border-yellow-400';
      case 'exotic': return 'border-orange-400';
      case 'rare': return 'border-blue-400';
      case 'masterwork': return 'border-green-400';
      case 'fine': return 'border-blue-300';
      case 'ascended': return 'border-purple-400';
      default: return 'border-gray-500';
    }
  };

  const getItemStackValueCopper = (item: BankItem): number => {
    const sellUnit = item.price?.sells?.unit_price;
    if (sellUnit && sellUnit > 0) {
      return sellUnit * item.count;
    }

    const cached = itemCache.get(item.id);
    if (cached?.price?.sells?.unit_price && cached.price.sells.unit_price > 0) {
      return cached.price.sells.unit_price * item.count;
    }
    if (cached?.details?.vendor_value) {
      return cached.details.vendor_value * item.count;
    }

    return 0;
  };

  const renderSlotPrice = (item: BankItem) => {
    const totalPrice = getItemStackValueCopper(item);
    if (totalPrice <= 0) return null;

    const { gold, silver, copper } = formatGold(totalPrice);
    const label = gold > 0 ? `${gold}g` : silver > 0 ? `${silver}s` : `${copper}c`;
    const coinSrc =
      gold > 0
        ? '/images/expansions/Gold.webp'
        : silver > 0
          ? '/images/expansions/Silver.webp'
          : '/images/expansions/Copper.webp';

    return (
      <>
        <span className="font-bold">{label}</span>
        <Image src={coinSrc} alt="" width={12} height={12} className="ml-1" />
      </>
    );
  };

  const cacheKey = user?.id ? `gw2_bank_${user.id}_${lang}` : null;

  const applyCachedBank = useCallback((cached: (BankItem | null)[]) => {
    setBankItems(cached);
    setIsLoading(false);
  }, []);

  useAccountPageCache(cacheKey, applyCachedBank);

  const fetchBankData = useCallback(async (options?: { forceLoading?: boolean }) => {
    if (!user?.id || !apiKey) return;

    const showSpinner = options?.forceLoading || bankItemsRef.current.length === 0;

    try {
      if (showSpinner) setIsLoading(true);
      else setIsRefreshing(true);
      setApiError(null);

      const data = await fetchBankFromBrowser(user.id, lang, apiKey, { withPrices: false });
      if (!data) return;

      setBankItems(data as (BankItem | null)[]);
      setIsLoading(false);
      if (cacheKey) writeSessionCache(cacheKey, data, GW2_CACHE_TTL.accountPage);

      const enriched = await enrichBankWithPrices(data);
      setBankItems(enriched as (BankItem | null)[]);
      if (cacheKey) writeSessionCache(cacheKey, enriched, GW2_CACHE_TTL.accountPage);
    } catch (error) {
      console.error('Error fetching bank data:', error);
      const message = error instanceof Error ? error.message : 'Network error or service unavailable';
      setApiError(message.includes('429') ? t('profile.apiKey.rateLimited', 'GW2 rate limit — try again in a few seconds') : message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, apiKey, lang, t, cacheKey]);


  useEffect(() => {
    if (user?.id && apiKey) {
      void fetchBankData();
    } else if (!gw2Loading) {
      setIsLoading(false);
    }
  }, [user?.id, apiKey, gw2Loading, fetchBankData]);

  const filteredItems = bankItems.filter((item): item is BankItem => 
    item !== null && 
    typeof item.name === 'string' && 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSearching = searchTerm.trim().length > 0;

  // Each bank tab has 30 slots
  const slotsPerTab = 30;
  const bankTabs = Math.max(1, Math.ceil((bankItems.length || slotsPerTab) / slotsPerTab));

  const bankSummary = useMemo<BankSummary>(() => {
    const validItems = bankItems.filter((item): item is BankItem => item !== null);
    let totalBuyPrice = 0;
    let totalSellPrice = 0;

    validItems.forEach((item) => {
      if (item.price?.sells) {
        totalBuyPrice += (item.price.buys?.unit_price ?? 0) * item.count;
        totalSellPrice += item.price.sells.unit_price * item.count;
      }
    });

    return {
      totalBuyPrice,
      totalSellPrice,
      totalValue: totalSellPrice,
      usedSlots: validItems.length,
      totalSlots: bankItems.length || 30,
    };
  }, [bankItems]);

  return (
    <AccountLayout
      section="bank"
      title={t('bank.title', 'Bank')}
      subtitle={t('bank.subtitle', 'Your bank inventory')}>
      {!gw2Loading && !hasApiKey && (
        <AccountNoApiKeyBanner
          messageKey="account.noApiKeyBank"
          messageFallback="Add your Guild Wars 2 API key in Settings to enable Bank."
        />
      )}

                 {/* Search and Refresh */}
         <div className="mb-6 flex gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
               type="text"
              placeholder={t('bank.searchPlaceholder')}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
             />
           </div>
          <button
            onClick={() => void fetchBankData({ forceLoading: true })}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
           >
            🔄 {t('common.refresh', 'Refresh')}
           </button>
         </div>

         <AccountRefreshingIndicator visible={isRefreshing} />

                 {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">{t('bank.loading', 'Loading bank...')}</p>
          </div>
         ) : (
           <div className="space-y-6">
                           {/* Financial Summary */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-w-2xl mx-auto">
                                                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <h3 className="text-base font-semibold mb-2">{t('bank.totalBuyPrice', 'Total Buy Price')}</h3>
                                           <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center space-x-1">
                        {(() => {
                          const { gold, silver, copper } = formatGold(Math.floor(bankSummary.totalBuyPrice * 0.85));
                          return (
                            <>
                              <span>{gold}</span>
                              <Image src="/images/expansions/Gold.webp" alt="Gold" width={20} height={20} />
                              <span>{silver}</span>
                              <Image src="/images/expansions/Silver.webp" alt="Silver" width={20} height={20} />
                              <span>{copper}</span>
                              <Image src="/images/expansions/Copper.webp" alt="Copper" width={20} height={20} />
                            </>
                          );
                        })()}
                      </div>
                      <div className="text-sm text-gray-400 flex items-center justify-center space-x-1">
                        {(() => {
                          const { gold, silver, copper } = formatGold(bankSummary.totalBuyPrice);
                          return (
                            <>
                              <span>{gold}</span>
                              <Image src="/images/expansions/Gold.webp" alt="Gold" width={16} height={16} />
                              <span>{silver}</span>
                              <Image src="/images/expansions/Silver.webp" alt="Silver" width={16} height={16} />
                              <span>{copper}</span>
                              <Image src="/images/expansions/Copper.webp" alt="Copper" width={16} height={16} />
                            </>
                          );
                        })()}
                        <span className="ml-1">{t('bank.excludingFees', 'excl. fees')}</span>
                      </div>
                                      </div>
                                      <div className="text-center">
                      <h3 className="text-base font-semibold mb-2">{t('bank.totalSellPrice', 'Total Sell Price')}</h3>
                                            <div className="text-2xl font-bold text-green-400 flex items-center justify-center space-x-1">
                         {(() => {
                           const { gold, silver, copper } = formatGold(Math.floor(bankSummary.totalSellPrice * 0.85));
                           return (
                             <>
                               <span>{gold}</span>
                               <Image src="/images/expansions/Gold.webp" alt="Gold" width={20} height={20} />
                               <span>{silver}</span>
                               <Image src="/images/expansions/Silver.webp" alt="Silver" width={20} height={20} />
                               <span>{copper}</span>
                               <Image src="/images/expansions/Copper.webp" alt="Copper" width={20} height={20} />
                             </>
                           );
                         })()}
                       </div>
                       <div className="text-sm text-gray-400 flex items-center justify-center space-x-1">
                         {(() => {
                           const { gold, silver, copper } = formatGold(bankSummary.totalSellPrice);
                           return (
                             <>
                               <span>{gold}</span>
                               <Image src="/images/expansions/Gold.webp" alt="Gold" width={12} height={12} />
                               <span>{silver}</span>
                               <Image src="/images/expansions/Silver.webp" alt="Silver" width={12} height={12} />
                               <span>{copper}</span>
                               <Image src="/images/expansions/Copper.webp" alt="Copper" width={12} height={12} />
                             </>
                           );
                         })()}
                         <span className="ml-1">{t('bank.excludingFees', 'excl. fees')}</span>
                       </div>
                    </div>
               </div>
               
               {/* Bank Usage */}
                <div className="text-center mb-4">
                  <p className="text-lg text-gray-300">
                    {format(
                      t('bank.usage', 'Estás usando {used} de {total} ({percent}%) espacios disponibles del banco.'),
                      {
                        used: bankSummary.usedSlots,
                        total: bankSummary.totalSlots,
                        percent: bankSummary.totalSlots > 0
                          ? ((bankSummary.usedSlots / bankSummary.totalSlots) * 100).toFixed(2)
                          : '0.00'
                      }
                    )}
                  </p>
                </div>
                
                                 {/* Current Slot Count & Currency */}
                 <div className="flex items-center justify-center space-x-4">
                  <span className="text-xl font-semibold">{bankSummary.usedSlots} / {bankSummary.totalSlots} {t('bank.slots')}</span>
                   <div className="flex items-center space-x-1">
                     <span className="text-yellow-400">{Math.floor(bankSummary.totalValue / 10000)}</span>
                     <Image src="/images/expansions/Gold.webp" alt="Gold" width={16} height={16} />
                                           <span className="text-gray-400">{Math.floor((bankSummary.totalValue % 10000) / 100)}</span>
                      <Image src="/images/expansions/Silver.webp" alt="Silver" width={16} height={16} />
                      <span className="text-orange-400">{bankSummary.totalValue % 100}</span>
                      <Image src="/images/expansions/Copper.webp" alt="Copper" width={16} height={16} />
                   </div>
                 </div>
             </div>

                                                       {/* Bank Grid */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-5xl mx-auto">
                {isSearching ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center">
                        <Package className="w-5 h-5 mr-2 text-blue-500" />
                        {t('bank.searchResults')}
                      </h2>
                      <div className="text-sm text-gray-400">
                        {filteredItems.length} {t('bank.items')}
                      </div>
                    </div>
                    <div className="grid grid-cols-10 gap-0.6 max-w-3xl mx-auto">
                      {filteredItems.map((item, idx) => (
                        <div 
                          key={`${item.id}-${idx}`}
                          className={`
                            w-16 h-24 rounded border-2 flex flex-col items-center justify-center p-0.6 relative
                            ${getRarityBorderColor(item.rarity)} bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group
                          `}
                          title={`${t('bank.slot')} ${bankItems.indexOf(item) + 1}`}
                          onMouseEnter={(e) => handleHover(item, e)}
                          onMouseLeave={handleLeave}
                        >
                          {item.icon && (
                            <Image 
                              src={item.icon} 
                              alt={item.name}
                              width={72}
                              height={72}
                              className="w-18 h-18 object-contain mb-1"
                            />
                          )}
                          {item.count > 1 && (
                            <span
                              className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl font-bold text-black"
                              style={{ WebkitTextStroke: '1px white', paintOrder: 'stroke fill' }}
                            >
                              {item.count}
                            </span>
                          )}
                          {item.bound && (
                            <span className="text-xs text-gray-300 font-semibold absolute top-0 right-0 px-1">
                              {t('bank.bound')}
                            </span>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black py-1 text-sm text-white">
                            {renderSlotPrice(item)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                <>
                {[...Array(bankTabs)].map((_, tabIndex) => {
                  const start = tabIndex * slotsPerTab;
                  const tabItems = bankItems.slice(start, start + slotsPerTab);
                  const usedInTab = tabItems.filter((it) => it !== null).length;
                      const baseTabLabel = t('bank.tabLabel').replace(/\s*\d+\s*$/, '');
                  return (
                    <div key={tabIndex} className="mb-6 last:mb-0">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold flex items-center">
                          <Package className="w-5 h-5 mr-2 text-blue-500" />
                          {baseTabLabel} {tabIndex + 1}
                        </h2>
                            <div className="text-sm text-gray-400">
                              {usedInTab} / 30 {t('bank.slots')}
                            </div>
                      </div>
                      <div className="grid grid-cols-10 gap-0.6 max-w-3xl mx-auto">
                        {Array.from({ length: slotsPerTab }, (_, slotIndex) => {
                          const globalIndex = start + slotIndex;
                          const item = bankItems[globalIndex];
                          return (
                            <div 
                              key={slotIndex} 
                                                                                               className={`
                           w-16 h-24 rounded border-2 flex flex-col items-center justify-center p-0.6 relative
                          ${item 
                            ? `${getRarityBorderColor(item.rarity)} bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group` 
                            : 'border-dashed border-gray-600 bg-gray-800'
                          }
                        `}
                              title={item ? `${t('bank.slot')} ${globalIndex + 1}` : `${t('bank.slot')} ${globalIndex + 1} ${t('bank.empty')}`}
                              onMouseEnter={(e) => item && handleHover(item, e)}
                              onMouseLeave={handleLeave}
                            >
                                                                                               {item ? (
                          <>
                                                         {/* Item icon as background */}
                             {item.icon && (
                               <Image 
                                 src={item.icon} 
                                 alt={item.name}
                                                                   width={72}
                                  height={72}
                                  className="w-18 h-18 object-contain mb-1"
                               />
                             )}
                             
                             {/* Quantity in center (large white number) */}
                             {item.count > 1 && (
                               <span
                                 className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl font-bold text-black"
                                 style={{ WebkitTextStroke: '1px white', paintOrder: 'stroke fill' }}
                               >
                                 {item.count}
                               </span>
                             )}
                             
                             {/* Bound indicator */}
                                      {item.bound && (
                                        <span className="text-xs text-gray-300 font-semibold absolute top-0 right-0 px-1">
                                          {t('bank.bound')}
                                        </span>
                                      )}
                             
                                                           <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black py-1 text-sm text-white">
                             {renderSlotPrice(item)}
                           </div>
                          </>
                        ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                </>
              )}
              </div>
          </div>
        )}

        {/* Sin modal aquí; se muestra solo en /account */}

        {!isLoading && bankItems.filter(Boolean).length === 0 && (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">{t('bank.emptyTitle', 'No items')}</h3>
            <p className="text-gray-400">{t('bank.emptyDesc', 'There are no items in your bank')}</p>
          </div>
        )}

        {!isLoading && bankItems.filter(Boolean).length > 0 && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">{t('bank.noSearchResults', 'No matches')}</h3>
            <p className="text-gray-400">{t('bank.noSearchResultsDesc', 'No items match your search')}</p>
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

export default BankPage; 