'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
 
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Package, Search, Database } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import ServiceUnavailableModal from '@/components/ui/ServiceUnavailableModal';
import { useApiStatus } from '@/hooks/useApiStatus';

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

interface ItemPrice {
  id: number;
  whitelisted: boolean;
  buys: {
    unit_price: number;
    quantity: number;
  };
  sells: {
    unit_price: number;
    quantity: number;
  };
}

interface ItemDetails {
  id: number;
  name: string;
  description?: string;
  type?: string;
  level?: number;
  rarity?: string;
  icon?: string;
  vendor_value?: number;
}

const BankPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { t, lang } = useI18n();
  const { hasApiIssues, isApiHealthy } = useApiStatus();
  usePageTitle('pageTitles.bank', t('pageTitles.bank', 'Bank'));
  const [bankItems, setBankItems] = useState<(BankItem | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bankSummary, setBankSummary] = useState<BankSummary>({
    totalBuyPrice: 0,
    totalSellPrice: 0,
    totalValue: 0,
    usedSlots: 0,
    totalSlots: 30
  });
  const [selectedItem, setSelectedItem] = useState<{ item: BankItem; details: ItemDetails; price?: ItemPrice } | null>(null);
  const [isLoadingItemDetails, setIsLoadingItemDetails] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [itemCache, setItemCache] = useState<Map<number, { details: ItemDetails; price?: ItemPrice }>>(new Map());
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

  const formatGold = (copper: number) => {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperRemaining = copper % 100;
    return { gold, silver, copper: copperRemaining };
  };

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

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 'text-yellow-400';
      case 'exotic': return 'text-orange-400';
      case 'rare': return 'text-blue-400';
      case 'masterwork': return 'text-green-400';
      case 'fine': return 'text-blue-300';
      case 'ascended': return 'text-purple-400';
      default: return 'text-gray-300';
    }
  };

  const handleItemHover = async (item: BankItem, event: React.MouseEvent) => {
    // Set position immediately
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPosition({ x: rect.right + 10, y: rect.top });
    
    // Check if item is already cached
    const cached = itemCache.get(item.id);
    if (cached) {
      setSelectedItem({ item, details: cached.details, price: cached.price });
      return;
    }
    
    // Don't fetch if already loading or if same item is selected
    if (isLoadingItemDetails || (selectedItem && selectedItem.item.id === item.id)) {
      return;
    }

    setIsLoadingItemDetails(true);
    setSelectedItem(null);
    
    try {
      // Fetch item details
          const detailsResponse = await fetch(`https://api.guildwars2.com/v2/items/${item.id}?lang=${lang}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      const details: ItemDetails = await detailsResponse.json();
      
      // Fetch item price
      const priceResponse = await fetch(`https://api.guildwars2.com/v2/commerce/prices/${item.id}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      const price: ItemPrice = await priceResponse.json();
      
      // Cache the result
      setItemCache(prev => new Map(prev).set(item.id, { details, price }));
      
      setSelectedItem({ item, details, price });
    } catch {
      // If price fetch fails, still show item details
      try {
        const detailsResponse = await fetch(`https://api.guildwars2.com/v2/items/${item.id}?lang=${lang}`);
        const details: ItemDetails = await detailsResponse.json();
        
        // Cache the result (without price)
        setItemCache(prev => new Map(prev).set(item.id, { details }));
        
        setSelectedItem({ item, details });
      } catch {}
    } finally {
      setIsLoadingItemDetails(false);
    }
  };

  const handleItemLeave = () => {
    setSelectedItem(null);
  };



  const lastFetchedApiKeyRef = useRef<string | null>(null);

  const fetchBankData = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      // Verificar estado de API key vía resumen del usuario
      let apiKeyAllowed = true;
      if (user?.id) {
        try {
          const summaryResp = await fetch(`/api/users/${user.id}/summary`);
          if (summaryResp.ok) {
            const summary = await summaryResp.json();
            apiKeyAllowed = !!summary.hasApiKey && summary.apiKeyValid !== false;
          }
        } catch {}
      }

      if (!apiKeyAllowed) {
        try {
          const resp = user?.id ? await fetch(`/api/users/${user.id}/summary`) : null;
          const data = resp && resp.ok ? await resp.json() : null;
          if (data && data.apiKeyValid === false) {
            setApiError(t('profile.apiKey.invalid', 'Invalid API key. Check permissions.'));
          }
        } catch {}
        setIsLoading(false);
        return;
      }

      // Preferir user_id para resolver API key en servidor
      
      // Avoid re-fetching if the same user was already fetched in this session
      if (lastFetchedApiKeyRef.current === (user?.id || null)) {
        setIsLoading(false);
        return;
      }
      
      const response = user?.id
        ? await fetch(`/api/gw2/bank?user_id=${user.id}&lang=${lang}`, { cache: 'no-store' })
        : await (async () => {
            const apiKey = localStorage.getItem('gw2_api_key') || sessionStorage.getItem('gw2_api_key');
            if (!apiKey || apiKey.trim().length < 10) {
              return new Response(null, { status: 400 });
            }
            return fetch(`/api/gw2/bank?api_key=${apiKey}&lang=${lang}`);
          })();
      if (response.ok) {
        const data = await response.json();
        setBankItems(data);
        lastFetchedApiKeyRef.current = user?.id || null;
        // Calcular resumen usando precios incluidos por el servidor si están presentes
        await calculateBankSummary(data);
      } else {
        console.error('Bank API error:', response.status, response.statusText);
        if (response.status >= 500 || response.status === 0) {
          setApiError(`API Error: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error fetching bank data:', error);
      setApiError('Network error or service unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, lang, t]);


  useEffect(() => {
    if (isAuthenticated) {
      fetchBankData();
    }
  }, [isAuthenticated, fetchBankData]);

  const filteredItems = bankItems.filter((item): item is BankItem => 
    item !== null && 
    typeof item.name === 'string' && 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSearching = searchTerm.trim().length > 0;

  // Each bank tab has 30 slots
  const slotsPerTab = 30;
  const bankTabs = Math.max(1, Math.ceil((bankItems.length || slotsPerTab) / slotsPerTab));

  // Calculate bank summary with real prices
  const calculateBankSummary = async (items: (BankItem | null)[]) => {
    // Filter out null items (empty slots)
    const validItems = items.filter((item): item is BankItem => item !== null);
    
    if (validItems.length === 0) {
      console.log('No valid items, setting summary to 0');
      setBankSummary({
        totalBuyPrice: 0,
        totalSellPrice: 0,
        totalValue: 0,
        usedSlots: 0,
        totalSlots: items.length
      });
      return;
    }

    try {
      // Si el servidor ya incluyó 'price' por ítem, usarlo y evitar fetch
      const serverHasPrices = validItems.every((it) => it.price && it.price.sells);
      let totalBuyPrice = 0;
      let totalSellPrice = 0;
      if (serverHasPrices) {
        validItems.forEach((item) => {
          const price = item.price!;
          const buyPrice = price.buys.unit_price * item.count;
          const sellPrice = price.sells.unit_price * item.count;
          totalBuyPrice += buyPrice;
          totalSellPrice += sellPrice;
        });
      } else {
        // Fallback: obtener precios en cliente
        const itemIds = [...new Set(validItems.map(item => item.id))];
        const pricesResponse = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${itemIds.join(',')}`);
        if (pricesResponse.ok) {
          const prices: ItemPrice[] = await pricesResponse.json();
          validItems.forEach(item => {
            const price = prices.find(p => p.id === item.id);
            if (price) {
              const buyPrice = price.buys.unit_price * item.count;
              const sellPrice = price.sells.unit_price * item.count;
              totalBuyPrice += buyPrice;
              totalSellPrice += sellPrice;
            } else {
              const craftingValue = (item.value || 0) * item.count;
              totalBuyPrice += craftingValue;
              totalSellPrice += craftingValue;
            }
          });
        }
      }

      setBankSummary({
        totalBuyPrice,
        totalSellPrice,
        totalValue: totalSellPrice,
        usedSlots: validItems.length,
        totalSlots: items.length
      });
    } catch (error) {
      console.error('Error calculating bank summary:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">{t('auth.accessRequired', 'Access Required')}</h2>
          <Link href="/login" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            {t('auth.goToLogin', 'Go to Login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('account.back', 'Back to My Account')}
          </Link>
          <h1 className="text-3xl font-bold mb-2">{t('bank.title', 'Bank')}</h1>
          <p className="text-gray-400">{t('bank.subtitle', 'Your bank inventory')}</p>
        </div>

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
            onClick={fetchBankData}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
           >
            🔄 {t('common.refresh', 'Refresh')}
           </button>
         </div>

                 {isLoading ? (
          <div className="text-center py-12">
             <div className="animate-spin rounded-full h-15 w-15 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
                          onMouseEnter={(e) => handleItemHover(item, e)}
                          onMouseLeave={handleItemLeave}
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
                            <span className="text-xl text-white font-bold absolute inset-0 flex items-center justify-center drop-shadow-lg">
                              {item.count}
                            </span>
                          )}
                          {item.bound && (
                            <span className="text-xs text-gray-300 font-semibold absolute top-0 right-0 px-1">
                              {t('bank.bound')}
                            </span>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black text-white text-sm py-1 flex items-center justify-center">
                            <span className="font-bold">
                              {(() => {
                                const cached = itemCache.get(item.id);
                                if (cached) {
                                  let totalPrice = 0;
                                  if (cached.price && cached.price.sells && cached.price.sells.unit_price > 0) {
                                    totalPrice = cached.price.sells.unit_price * item.count;
                                  } else if (cached.details && cached.details.vendor_value) {
                                    totalPrice = cached.details.vendor_value * item.count;
                                  }
                                  if (totalPrice > 0) {
                                    const { gold, silver, copper } = formatGold(totalPrice);
                                    return gold > 0 ? `${gold}g` : silver > 0 ? `${silver}s` : `${copper}c`;
                                  }
                                }
                                return '';
                              })()}
                            </span>
                            {(() => {
                              const cached = itemCache.get(item.id);
                              if (cached) {
                                let totalPrice = 0;
                                if (cached.price && cached.price.sells && cached.price.sells.unit_price > 0) {
                                  totalPrice = cached.price.sells.unit_price * item.count;
                                } else if (cached.details && cached.details.vendor_value) {
                                  totalPrice = cached.details.vendor_value * item.count;
                                }
                                if (totalPrice > 0) {
                                  const { gold, silver } = formatGold(totalPrice);
                                  if (gold > 0) {
                                    return <Image src="/images/expansions/Gold.webp" alt="Gold" width={12} height={12} className="ml-1" />;
                                  } else if (silver > 0) {
                                    return <Image src="/images/expansions/Silver.webp" alt="Silver" width={12} height={12} className="ml-1" />;
                                  } else {
                                    return <Image src="/images/expansions/Copper.webp" alt="Copper" width={12} height={12} className="ml-1" />;
                                  }
                                }
                              }
                              return null;
                            })()}
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
                              onMouseEnter={(e) => item && handleItemHover(item, e)}
                              onMouseLeave={handleItemLeave}
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
                                                               <span className="text-xl text-white font-bold absolute inset-0 flex items-center justify-center drop-shadow-lg">
                                 {item.count}
                               </span>
                             )}
                             
                             {/* Bound indicator */}
                                      {item.bound && (
                                        <span className="text-xs text-gray-300 font-semibold absolute top-0 right-0 px-1">
                                          {t('bank.bound')}
                                        </span>
                                      )}
                             
                                                           {/* Price display at bottom (black background) */}
                                                             <div className="absolute bottom-0 left-0 right-0 bg-black text-white text-sm py-1 flex items-center justify-center">
                               <span className="font-bold">
                                 {(() => {
                                   // Get price from cache or calculate
                                   const cached = itemCache.get(item.id);
                                   if (cached) {
                                     let totalPrice = 0;
                                     
                                     // Prefer Trading Post sell price, fallback to vendor value
                                     if (cached.price && cached.price.sells && cached.price.sells.unit_price > 0) {
                                       totalPrice = cached.price.sells.unit_price * item.count;
                                     } else if (cached.details && cached.details.vendor_value) {
                                       totalPrice = cached.details.vendor_value * item.count;
                                     }
                                     
                                     if (totalPrice > 0) {
                                       const { gold, silver, copper } = formatGold(totalPrice);
                                       return gold > 0 ? `${gold}g` : silver > 0 ? `${silver}s` : `${copper}c`;
                                     }
                                   }
                                   return '';
                                 })()}
                               </span>
                                 {(() => {
                                  const cached = itemCache.get(item.id);
                                  if (cached) {
                                    let totalPrice = 0;
                                    
                                    if (cached.price && cached.price.sells && cached.price.sells.unit_price > 0) {
                                      totalPrice = cached.price.sells.unit_price * item.count;
                                    } else if (cached.details && cached.details.vendor_value) {
                                      totalPrice = cached.details.vendor_value * item.count;
                                    }
                                    
                                    if (totalPrice > 0) {
                                      const { gold, silver } = formatGold(totalPrice);
                                        if (gold > 0) {
                                        return <Image src="/images/expansions/Gold.webp" alt="Gold" width={12} height={12} className="ml-1" />;
                                       } else if (silver > 0) {
                                         return <Image src="/images/expansions/Silver.webp" alt="Silver" width={12} height={12} className="ml-1" />;
                                       } else {
                                         return <Image src="/images/expansions/Copper.webp" alt="Copper" width={12} height={12} className="ml-1" />;
                                      }
                                    }
                                  }
                                  return null;
                                })()}
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

        {!isLoading && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No items</h3>
            <p className="text-gray-400">There are no items in your bank</p>
          </div>
                 )}

         {/* Item Details Modal */}
         {selectedItem && (
           <div 
             className="fixed z-50 pointer-events-none"
             style={{ 
               left: `${hoverPosition.x}px`, 
               top: `${hoverPosition.y}px`,
                               maxWidth: '300px',
                maxHeight: '60vh'
             }}
           >
                           <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-h-full overflow-y-auto shadow-2xl pointer-events-auto">
                <div className="p-4">
                                   {/* Header */}
                                     <div className="flex items-center mb-3">
                     <div className="flex items-center space-x-2">
                       {selectedItem.details.icon && (
                         <Image 
                           src={selectedItem.details.icon} 
                           alt={selectedItem.details.name}
                           width={32}
                           height={32}
                           className="rounded"
                         />
                       )}
                       <div>
                         <h3 className={`text-sm font-bold ${getRarityColor(selectedItem.details.rarity)}`}>
                           {selectedItem.item.count > 1 && `${selectedItem.item.count}x `}
                           {selectedItem.details.name}
                         </h3>
                         <p className="text-xs text-gray-400">
                           {selectedItem.details.type} {selectedItem.details.level && `• Level ${selectedItem.details.level}`}
                         </p>
                       </div>
                     </div>
                   </div>

                                   {/* Description */}
                  {selectedItem.details.description && (
                    <div className="mb-3">
                      <p className="text-gray-300 text-xs leading-relaxed">
                        {selectedItem.details.description}
                      </p>
                    </div>
                  )}

                                   {/* Prices */}
                                     {(selectedItem.price || selectedItem.details.vendor_value) && (
                     <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-200">{t('bank.prices', 'Prices')}</h4>
                      
                      {/* Vendor Price - Always show if available */}
                      {selectedItem.details.vendor_value && (
                                                 <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">{t('bank.vendorPrice', 'Vendor Price:')}</span>
                           <div className="flex items-center space-x-1">
                            {(() => {
                              const { gold, silver, copper } = formatGold(selectedItem.details.vendor_value!);
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
                                                         <span className="text-gray-400 text-xs ml-2">
                               ({(() => {
                                 const { gold, silver, copper } = formatGold(selectedItem.details.vendor_value! * selectedItem.item.count);
                                   return `${gold}g ${silver}s ${copper}c ${t('bank.perCount', 'per')} ${selectedItem.item.count}`;
                               })()})
                             </span>
                          </div>
                        </div>
                      )}

                      {/* Trading Post Prices - Only show if available */}
                      {selectedItem.price && (
                        <>
                                                     {/* Buy Price - Only show if exists */}
                           {selectedItem.price.buys && selectedItem.price.buys.unit_price > 0 && (
                             <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-xs">{t('bank.buyPrice', 'Buy Price:')}</span>
                              <div className="flex items-center space-x-1">
                                {(() => {
                                  const { gold, silver, copper } = formatGold(selectedItem.price.buys.unit_price);
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
                                                                 <span className="text-gray-400 text-xs ml-2">
                                   ({(() => {
                                     const { gold, silver, copper } = formatGold(selectedItem.price.buys.unit_price * selectedItem.item.count);
                                     return `${gold}g ${silver}s ${copper}c ${t('bank.perCount', 'per')} ${selectedItem.item.count}`;
                                   })()})
                                 </span>
                              </div>
                            </div>
                          )}

                                                     {/* Sell Price - Only show if exists */}
                           {selectedItem.price.sells && selectedItem.price.sells.unit_price > 0 && (
                             <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-xs">{t('bank.sellPrice', 'Sell Price:')}</span>
                              <div className="flex items-center space-x-1">
                                {(() => {
                                  const { gold, silver, copper } = formatGold(selectedItem.price.sells.unit_price);
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
                                                                 <span className="text-gray-400 text-xs ml-2">
                                   ({(() => {
                                     const { gold, silver, copper } = formatGold(selectedItem.price.sells.unit_price * selectedItem.item.count);
                                     return `${gold}g ${silver}s ${copper}c ${t('bank.perCount', 'per')} ${selectedItem.item.count}`;
                                   })()})
                                 </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
               </div>
             </div>
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
       </div>
     </div>
   );
 };

export default BankPage; 