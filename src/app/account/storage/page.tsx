'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Database, Search } from 'lucide-react';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import ServiceUnavailableModal from '@/components/ui/ServiceUnavailableModal';
import { useApiStatus } from '@/hooks/useApiStatus';
import AccountLayout from '@/components/account/AccountLayout';
import AccountNoApiKeyBanner from '@/components/account/AccountNoApiKeyBanner';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import { fetchMaterialsFromBrowser } from '@/lib/gw2-client-account-data';

interface Material {
  id: number;
  name: string;
  icon?: string;
  count: number;
  max_count: number;
  category?: string;
}

const StoragePage = () => {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { hasApiKey, loading: gw2Loading } = useAccountGw2();
  const { hasApiIssues, isApiHealthy } = useApiStatus();
  usePageTitle('pageTitles.storage', t('pageTitles.storage', 'Material Storage'));
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isModalClosed, setIsModalClosed] = useState(false);

  // Reset modal closed state when API becomes healthy
  useEffect(() => {
    if (isApiHealthy) {
      setIsModalClosed(false);
    }
  }, [isApiHealthy]);

  const fetchMaterialsData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setApiError(null);
      const data = await fetchMaterialsFromBrowser(user.id, lang);
      if (data) setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
      const message = error instanceof Error ? error.message : 'Network error or service unavailable';
      setApiError(message.includes('429') ? t('profile.apiKey.rateLimited', 'GW2 rate limit — try again in a few seconds') : message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, t, lang]);


  useEffect(() => {
    if (user?.id && hasApiKey) {
      fetchMaterialsData();
    } else if (!gw2Loading) {
      setIsLoading(false);
    }
  }, [user?.id, hasApiKey, gw2Loading, fetchMaterialsData]);

  const filteredMaterials = materials.filter(material => 
    material && material.name && material.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AccountLayout
      section="storage"
      title={t('storage.title', 'Material Storage')}
      subtitle={t('storage.subtitle', 'Your Material Storage')}>
      {!gw2Loading && !hasApiKey && (
        <AccountNoApiKeyBanner
          messageKey="account.noApiKeyStorage"
          messageFallback="Add your Guild Wars 2 API key in Settings to enable Material Storage."
        />
      )}

      {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('storage.searchPlaceholder', 'Search materials...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">{t('storage.loading', 'Loading materials...')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMaterials.map((material) => (
              <div key={material.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                 <div className="flex items-center mb-3">
                   {material.icon && (
                     <Image 
                       src={material.icon} 
                       alt={material.name}
                       width={32}
                       height={32}
                       className="mr-3"
                     />
                   )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{material.name}</h3>
                    <p className="text-gray-400 text-xs">ID: {material.id}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-400 font-semibold">
                    {material.count || 0}
                  </span>
                  <span className="text-gray-400 text-xs">
                    / {material.max_count || 250}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(((material.count || 0) / (material.max_count || 250)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">{t('storage.emptyTitle', 'No materials')}</h3>
            <p className="text-gray-400">{t('storage.emptyDesc', 'There are no materials in your storage')}</p>
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

export default StoragePage; 