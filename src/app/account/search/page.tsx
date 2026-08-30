'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Package, Database } from 'lucide-react';
import Image from 'next/image';

interface SearchResult {
  id: number;
  name: string;
  icon?: string;
  count: number;
  location: string;
  rarity?: string;
  character?: string;
  slot?: string;
  bag?: number;
  category?: string;
}

import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import ServiceUnavailableModal from '@/components/ui/ServiceUnavailableModal';
import { useApiStatus } from '@/hooks/useApiStatus';
import AccountLayout from '@/components/account/AccountLayout';
import AccountNoApiKeyBanner from '@/components/account/AccountNoApiKeyBanner';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import { fetchAccountSearchIndex } from '@/lib/gw2-client-account-data';

const SearchPage = () => {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { hasApiKey, loading: gw2Loading } = useAccountGw2();
  const { hasApiIssues, isApiHealthy } = useApiStatus();
  usePageTitle('pageTitles.search', t('pageTitles.search', 'Account Search'));
  const [searchTerm, setSearchTerm] = useState('');
  const [index, setIndex] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchScope, setSearchScope] = useState<'all' | 'bank' | 'characters' | 'storage'>('all');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isModalClosed, setIsModalClosed] = useState(false);

  useEffect(() => {
    if (isApiHealthy) setIsModalClosed(false);
  }, [isApiHealthy]);

  useEffect(() => {
    if (!user?.id || gw2Loading) return;
    if (!hasApiKey) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const data = await fetchAccountSearchIndex(user.id, lang);
        if (cancelled) return;
        setIndex(Array.isArray(data) ? (data as unknown as SearchResult[]) : []);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Network error or service unavailable';
          setApiError(message.includes('429') ? t('profile.apiKey.rateLimited', 'GW2 rate limit — try again in a few seconds') : message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, user?.id, hasApiKey, gw2Loading, t]);

  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return index.filter((item) => {
      if (searchScope !== 'all' && item.category !== searchScope && !(searchScope === 'bank' && item.category === 'shared')) {
        return false;
      }
      return item.name.toLowerCase().includes(q);
    });
  }, [index, searchTerm, searchScope]);

  return (
    <AccountLayout
      section="search"
      title={t('search.title', 'Search')}
      subtitle={t('search.subtitle', 'Search items in your account')}>
      {!gw2Loading && !hasApiKey && <AccountNoApiKeyBanner />}

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
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
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

        {!isLoading && searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((item, index) => (
              <div key={`${item.id}-${item.category}-${index}`} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                 <div className="flex items-center mb-4">
                   {item.icon && (
                     <Image 
                       src={item.icon} 
                       alt={item.name}
                       width={32}
                       height={32}
                       className="mr-3"
                     />
                   )}
                   {item.category === 'character' && (
                     <Image 
                       src="/images/icons/character-slot.png" 
                       alt="Character"
                       width={20}
                       height={20}
                       className="mr-2 opacity-70"
                     />
                   )}
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-400">
                                    <p><strong>{t('search.quantity', 'Quantity')}:</strong> {item.count}</p>
                  <p><strong>{t('search.location', 'Location')}:</strong> {
                    item.location.includes('search.bankSlot') 
                      ? `${t('search.bankSlot', 'Bank Slot')} ${item.location.split(' ')[1]}`
                      : item.location.includes('search.characterBag')
                      ? item.location.replace('search.characterBag', t('search.characterBag', 'Bag'))
                      : item.location.includes('search.materialStorage')
                      ? t('search.materialStorage', 'Material Storage')
                      : item.location
                  }</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && searchTerm && searchResults.length === 0 && (
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