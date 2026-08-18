'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Database, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import ServiceUnavailableModal from '@/components/ui/ServiceUnavailableModal';
import { useApiStatus } from '@/hooks/useApiStatus';

interface Material {
  id: number;
  name: string;
  icon?: string;
  count: number;
  max_count: number;
  category?: string;
}

const StoragePage = () => {
  const { isAuthenticated, user } = useAuth();
  const { t, lang } = useI18n();
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

      // Preferir user_id en servidor (evita exponer API key)
      const response = user?.id
        ? await fetch(`/api/gw2/materials?user_id=${user.id}&lang=${lang}`, { cache: 'no-store' })
        : await (async () => {
            const apiKey = localStorage.getItem('gw2_api_key');
            if (!apiKey || apiKey.trim().length < 10) {
              return new Response(null, { status: 400 });
            }
            return fetch(`/api/gw2/materials?api_key=${apiKey}&lang=${lang}`);
          })();
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
        } else {
          if (response.status >= 500 || response.status === 0) {
            setApiError(`API Error: ${response.status} ${response.statusText}`);
          }
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
        setApiError('Network error or service unavailable');
      } finally {
        setIsLoading(false);
      }
    }, [user?.id, t, lang]);


  useEffect(() => {
    if (isAuthenticated) {
      fetchMaterialsData();
    }
  }, [isAuthenticated, fetchMaterialsData]);

  const filteredMaterials = materials.filter(material => 
    material && material.name && material.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold mb-2">{t('storage.title', 'Material Storage')}</h1>
          <p className="text-gray-400">{t('storage.subtitle', 'Your Material Storage')}</p>
        </div>

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
      </div>
    </div>
  );
};

export default StoragePage; 