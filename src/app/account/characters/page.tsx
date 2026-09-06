'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Search, AlertCircle, Package, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import ServiceUnavailableModal from '@/components/ui/ServiceUnavailableModal';
import { useApiStatus } from '@/hooks/useApiStatus';
import AccountLayout from '@/components/account/AccountLayout';
import AccountNoApiKeyBanner from '@/components/account/AccountNoApiKeyBanner';
import AccountRefreshingIndicator from '@/components/account/AccountRefreshingIndicator';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import { useAccountPageCache } from '@/hooks/useAccountPageCache';
import { fetchCharactersEnrichedFromBrowser, type EnrichedCharacter } from '@/lib/gw2-client-account-data';
import { GW2_CACHE_TTL, writeSessionCache } from '@/lib/gw2-client-cache';
import { formatProfessionLabel, getProfessionIconUrl } from '@/lib/gw2-profession-icons';
import { useAccountItemTooltip } from '@/hooks/useAccountItemTooltip';
import AccountItemTooltip from '@/components/account/AccountItemTooltip';

interface Character extends EnrichedCharacter {
  equipment?: unknown[];
}

const CharactersPage = () => {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { hasApiKey, apiKey, loading: gw2Loading } = useAccountGw2();
  const { hasApiIssues, isApiHealthy } = useApiStatus();
  usePageTitle('pageTitles.characters', t('pageTitles.characters', 'Characters'));
  const [characters, setCharacters] = useState<Character[]>([]);
  const charactersRef = useRef(characters);
  charactersRef.current = characters;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedInventories, setExpandedInventories] = useState<Set<string>>(new Set());
  const { hovered, position, handleHover, handleLeave } = useAccountItemTooltip(lang);
  const [specializations, setSpecializations] = useState<Record<string, unknown>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isModalClosed, setIsModalClosed] = useState(false);

  // Reset modal closed state when API becomes healthy
  useEffect(() => {
    if (isApiHealthy) {
      setIsModalClosed(false);
    }
  }, [isApiHealthy]);

  const cacheKey = user?.id ? `gw2_characters_${user.id}_${lang}` : null;

  const applyCachedCharacters = useCallback((cached: Character[]) => {
    setCharacters(cached);
    setIsLoading(false);
  }, []);

  useAccountPageCache(cacheKey, applyCachedCharacters);

  const fetchCharactersData = useCallback(async (options?: { forceLoading?: boolean }) => {
    if (!user?.id || !apiKey) return;

    const showSpinner = options?.forceLoading || charactersRef.current.length === 0;

    try {
      if (showSpinner) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);
      setApiError(null);

      const charactersData = await fetchCharactersEnrichedFromBrowser(user.id, lang, apiKey);

      if (!charactersData) {
        setIsLoading(false);
        return;
      }

      setCharacters(charactersData);
      setIsLoading(false);
      if (cacheKey) writeSessionCache(cacheKey, charactersData, GW2_CACHE_TTL.accountPage);

      const specializationNames = charactersData
        .map((char) => char.specialization)
        .filter((spec): spec is string => Boolean(spec))
        .filter((value, index, self) => self.indexOf(value) === index);

      if (specializationNames.length > 0) {
        try {
          const specializationsResponse = await fetch(`/api/gw2/specializations?lang=${lang}`);
          if (specializationsResponse.ok) {
            setSpecializations(await specializationsResponse.json());
          }
        } catch (fetchError) {
          console.error('Error fetching specializations:', fetchError);
        }
      }
    } catch (fetchError) {
      console.error('Error fetching characters:', fetchError);
      const message = fetchError instanceof Error ? fetchError.message : 'Network error or service unavailable';
      if (message.includes('401')) {
        setError('Invalid API key or insufficient permissions');
      } else if (message.includes('429')) {
        setApiError(t('profile.apiKey.rateLimited', 'GW2 rate limit — try again in a few seconds'));
      } else {
        setApiError(message);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, apiKey, lang, t, cacheKey]);

  useEffect(() => {
    if (user?.id && apiKey) {
      void fetchCharactersData();
    } else if (!gw2Loading) {
      setIsLoading(false);
    }
  }, [user?.id, apiKey, gw2Loading, fetchCharactersData]);


  const filteredCharacters = characters.filter(character => 
    character && character.name && character.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProfessionIcon = (profession: string) => {
    const iconUrl = getProfessionIconUrl(profession);
    if (!iconUrl) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-700 text-xs text-gray-400">
          ?
        </div>
      );
    }

    return (
      <Image
        src={iconUrl}
        alt={formatProfessionLabel(profession)}
        width={40}
        height={40}
        className="h-10 w-10 shrink-0"
        unoptimized
      />
    );
  };

  const getProfessionLabel = (profession: string) => {
    const id = profession.trim().toLowerCase();
    return t(`characters.profession.${id}`, formatProfessionLabel(profession));
  };

  const getSpecializationIcon = (character: Character) => {
    if (!character.specialization) return null;
    
    // Find specialization by name (case insensitive)
    const specializationData = Object.values(specializations).find((s: unknown) => 
      (s as { name?: string })?.name?.toLowerCase() === character.specialization?.toLowerCase()
    );
    
    if ((specializationData as { icon?: string })?.icon) {
      return (
        <Image 
          src={(specializationData as { icon: string }).icon} 
          alt={(specializationData as { name?: string }).name || character.specialization}
          width={16}
          height={16}
          className="w-4 h-4 ml-1"
        />
      );
    }
    
    return null;
  };

  const getRarityBorderColor = (rarity: string | undefined) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 'border-purple-500';
      case 'ascended': return 'border-fuchsia-400';
      case 'exotic': return 'border-amber-500';
      case 'rare': return 'border-yellow-500';
      case 'masterwork': return 'border-green-500';
      case 'fine': return 'border-slate-300';
      case 'basic': return 'border-slate-500';
      default: return 'border-gray-600';
    }
  };

  const toggleInventory = (characterName: string) => {
    const newExpanded = new Set(expandedInventories);
    if (newExpanded.has(characterName)) {
      newExpanded.delete(characterName);
    } else {
      newExpanded.add(characterName);
    }
    setExpandedInventories(newExpanded);
  };

  const renderInventory = (character: Character) => {
    const bags = character.inventory?.bags?.filter(
      (bag): bag is NonNullable<typeof bag> => bag != null && typeof bag.size === 'number',
    );

    if (!bags) {
      return (
        <div className="py-6 text-center text-gray-400">
          <Package className="mx-auto mb-2 h-8 w-8" />
          <p>{t('characters.noInventory', 'No inventory available')}</p>
        </div>
      );
    }

    if (bags.length === 0) {
      return (
        <div className="py-6 text-center text-gray-400">
          <Package className="mx-auto mb-2 h-8 w-8" />
          <p>{t('characters.emptyInventory', 'Empty inventory')}</p>
        </div>
      );
    }

    const slots = bags.flatMap((bag, bagIndex) =>
      Array.from({ length: bag.size || 0 }, (_, slotIndex) => ({
        item: bag.inventory?.[slotIndex] ?? null,
        key: `${character.name}-${bagIndex}-${slotIndex}`,
      })),
    );

    return (
      <div className="w-full overflow-hidden rounded border border-gray-700/80 bg-[#0d0d0d]">
        <div className="grid grid-cols-8 gap-px bg-gray-800/90 p-px sm:grid-cols-10 md:grid-cols-[repeat(16,minmax(0,1fr))]">
          {slots.map(({ item, key }) => (
            <div
              key={key}
              className={`
                relative aspect-square min-h-10 bg-[#141414]
                ${item
                  ? `border ${getRarityBorderColor(item.rarity)} cursor-pointer hover:brightness-110`
                  : 'border border-gray-800/90'
                }
              `}
              title={item?.name}
              onMouseEnter={(e) => item && handleHover(item, e)}
              onMouseLeave={handleLeave}
            >
              {item?.icon && (
                <Image
                  src={item.icon}
                  alt={item.name || `Item ${item.id}`}
                  fill
                  className="object-contain p-px"
                  unoptimized
                  sizes="80px"
                />
              )}
              {item && item.count > 1 && (
                <span
                  className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-bold text-black"
                  style={{ WebkitTextStroke: '1px white', paintOrder: 'stroke fill' }}
                >
                  {item.count}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AccountLayout
      section="characters"
      title={t('characters.title', 'Characters')}
      subtitle={t('characters.subtitle', 'Your characters and equipment')}>
      {!gw2Loading && !hasApiKey && (
        <AccountNoApiKeyBanner
          messageKey="account.noApiKeyCharacters"
          messageFallback="Add your Guild Wars 2 API key in Settings to enable Characters."
        />
      )}

      <AccountRefreshingIndicator visible={isRefreshing} />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <div>
                <h3 className="text-red-400 font-semibold mb-1">{t('common.error', 'Error')}</h3>
                <p className="text-red-300 text-sm mb-3">{error}</p>
                {error.includes('API key') && (
                                  <Link 
                  href="/profile" 
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  {t('characters.reviewConfiguration', 'Review Configuration')}
                </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        {hasApiKey && !error && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                                placeholder={t('characters.searchPlaceholder', 'Search characters...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">{t('characters.loading', 'Loading characters...')}</p>
          </div>
        ) : hasApiKey && !error && (
          <div className="space-y-6">
            {filteredCharacters.map((character) => (
              <div key={character.name} className="rounded-lg border border-gray-700 bg-gray-800 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    {getProfessionIcon(character.profession)}
                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-semibold text-white">{character.name}</h3>
                      <p className="text-sm text-gray-400">{getProfessionLabel(character.profession)}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleInventory(character.name)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 sm:self-center"
                  >
                    {expandedInventories.has(character.name) ? (
                      <>
                        <EyeOff className="h-4 w-4 shrink-0" />
                        {t('characters.hideInventory', 'Hide Inventory')}
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 shrink-0" />
                        {t('characters.viewInventory', 'View Inventory')}
                      </>
                    )}
                  </button>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-gray-700/60 pt-4 text-sm sm:grid-cols-3">
                  <div className="min-w-0">
                    <dt className="text-gray-500">{t('characters.level', 'Level')}</dt>
                    <dd className="mt-0.5 font-medium text-gray-200">{character.level}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-gray-500">{t('characters.race', 'Race')}</dt>
                    <dd className="mt-0.5 font-medium text-gray-200">{character.race}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-gray-500">{t('characters.specialization', 'Specialization')}</dt>
                    <dd className="mt-0.5 flex items-center gap-1 font-medium text-gray-200">
                      <span className="truncate">
                        {character.specialization || t('common.none', 'None')}
                      </span>
                      {getSpecializationIcon(character)}
                    </dd>
                  </div>
                </dl>

                {expandedInventories.has(character.name) && (
                  <div className="mt-4 border-t border-gray-700/60 pt-4">
                    {renderInventory(character)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No modal here when API key is missing; only the yellow banner above */}

        {!isLoading && hasApiKey && !error && filteredCharacters.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                         <h3 className="text-xl font-semibold text-gray-300 mb-2">{t('characters.emptyTitle', 'No characters')}</h3>
             <p className="text-gray-400">{t('characters.emptyDesc', 'No characters found')}</p>
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

export default CharactersPage; 