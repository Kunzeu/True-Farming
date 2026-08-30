'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Search, Shield, Sword, Zap, AlertCircle, Package, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import ServiceUnavailableModal from '@/components/ui/ServiceUnavailableModal';
import { useApiStatus } from '@/hooks/useApiStatus';
import AccountLayout from '@/components/account/AccountLayout';
import AccountNoApiKeyBanner from '@/components/account/AccountNoApiKeyBanner';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import { fetchCharactersFromBrowser } from '@/lib/gw2-client-account-data';

interface Character {
  name: string;
  profession: string;
  level: number;
  race: string;
  specialization?: string;
  world: number;
  equipment?: unknown[];
  inventory?: {
    bags?: Array<{
      id: number;
      size: number;
      inventory: Array<{
        id: number;
        count: number;
        binding?: string;
        bound_to?: string;
        charges?: number;
        infusions?: number[];
        upgrades?: number[];
        upgrade_slot_indices?: number[];
        skin?: number;
        dyes?: number[];
        stats?: {
          id: number;
          attributes: Record<string, number>;
        };
        name?: string;
        icon?: string;
        rarity?: string;
        level?: number;
        vendor_value?: number;
        description?: string;
      } | null>;
    }>;
  } | null;
}

const CharactersPage = () => {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { hasApiKey, loading: gw2Loading } = useAccountGw2();
  const { hasApiIssues, isApiHealthy } = useApiStatus();
  usePageTitle('pageTitles.characters', t('pageTitles.characters', 'Characters'));
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedInventories, setExpandedInventories] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<{ id: number; name?: string; icon?: string; rarity?: string; count: number; vendor_value?: number; description?: string; level?: number; binding?: string; bound_to?: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [professions, setProfessions] = useState<Record<string, unknown>>({});
  const [specializations, setSpecializations] = useState<Record<string, unknown>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isModalClosed, setIsModalClosed] = useState(false);

  // Reset modal closed state when API becomes healthy
  useEffect(() => {
    if (isApiHealthy) {
      setIsModalClosed(false);
    }
  }, [isApiHealthy]);

  const fetchCharactersData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      setApiError(null);

      const charactersData = await fetchCharactersFromBrowser(user.id);
      if (!charactersData) {
        setIsLoading(false);
        return;
      }

      const [professionsResponse] = await Promise.all([
        fetch(`/api/gw2/professions?lang=${lang}`),
      ]);

      setCharacters(charactersData);

      if (professionsResponse.ok) {
        const professionsData = await professionsResponse.json();
        setProfessions(professionsData);
      } else if (professionsResponse.status >= 500 || professionsResponse.status === 0) {
        setApiError(`API Error: ${professionsResponse.status} ${professionsResponse.statusText}`);
      }

      if (Array.isArray(charactersData) && charactersData.length > 0) {
        const specializationNames = charactersData
          .map((char: Character) => char.specialization)
          .filter((spec): spec is string => Boolean(spec))
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);

        if (specializationNames.length > 0) {
          try {
            const specializationsResponse = await fetch(`/api/gw2/specializations?lang=${lang}`);
            if (specializationsResponse.ok) {
              const specializationsData = await specializationsResponse.json();
              setSpecializations(specializationsData);
            } else if (specializationsResponse.status >= 500 || specializationsResponse.status === 0) {
              setApiError(`API Error: ${specializationsResponse.status} ${specializationsResponse.statusText}`);
            }
          } catch (fetchError) {
            console.error('Error fetching specializations:', fetchError);
            setApiError('Network error or service unavailable');
          }
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
    }
  }, [user?.id, lang, t]);

  useEffect(() => {
    if (user?.id && hasApiKey) {
      void fetchCharactersData();
    } else if (!gw2Loading) {
      setIsLoading(false);
    }
  }, [user?.id, hasApiKey, gw2Loading, fetchCharactersData]);


  const filteredCharacters = characters.filter(character => 
    character && character.name && character.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProfessionIcon = (profession: string) => {
    // Find profession by name (case insensitive)
    const professionData = Object.values(professions).find((p: unknown) => 
      (p as { name?: string })?.name?.toLowerCase() === profession.toLowerCase()
    );
    
    if ((professionData as { icon?: string })?.icon) {
      return (
        <Image 
          src={(professionData as { icon: string }).icon} 
          alt={(professionData as { name?: string }).name || profession}
          width={20}
          height={20}
          className="w-5 h-5"
        />
      );
    }
    
    // Fallback to default icons
    switch (profession.toLowerCase()) {
      case 'guardian': return <Shield className="w-5 h-5 text-blue-500" />;
      case 'warrior': return <Sword className="w-5 h-5 text-red-500" />;
      case 'ranger': return <Zap className="w-5 h-5 text-green-500" />;
      case 'thief': return <Users className="w-5 h-5 text-purple-500" />;
      case 'engineer': return <Users className="w-5 h-5 text-orange-500" />;
      case 'mesmer': return <Users className="w-5 h-5 text-pink-500" />;
      case 'necromancer': return <Users className="w-5 h-5 text-green-600" />;
      case 'elementalist': return <Users className="w-5 h-5 text-red-400" />;
      case 'revenant': return <Users className="w-5 h-5 text-purple-400" />;
      default: return <Users className="w-5 h-5 text-gray-500" />;
    }
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
      case 'legendary': return 'border-yellow-400';
      case 'ascended': return 'border-purple-400';
      case 'exotic': return 'border-orange-400';
      case 'rare': return 'border-blue-400';
      case 'masterwork': return 'border-green-400';
      case 'fine': return 'border-blue-300';
      case 'basic': return 'border-gray-400';
      default: return 'border-gray-600';
    }
  };

  const getRarityTextColor = (rarity: string | undefined) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 'text-yellow-400';
      case 'ascended': return 'text-purple-400';
      case 'exotic': return 'text-orange-400';
      case 'rare': return 'text-blue-400';
      case 'masterwork': return 'text-green-400';
      case 'fine': return 'text-blue-300';
      case 'basic': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const formatGold = (copper: number) => {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperRemaining = copper % 100;
    
    let result = '';
    if (gold > 0) result += `${gold}g `;
    if (silver > 0) result += `${silver}s `;
    if (copperRemaining > 0 || result === '') result += `${copperRemaining}c`;
    
    return result.trim();
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

  const handleItemClick = (item: { id: number; name?: string; icon?: string; rarity?: string; count: number; vendor_value?: number; description?: string; level?: number; binding?: string; bound_to?: string } | null) => {
    if (item) {
      setSelectedItem(item);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };



  const renderInventory = (character: Character) => {
    if (!character.inventory?.bags) {
      return (
        <div className="text-center py-4 text-gray-400">
          <Package className="w-8 h-8 mx-auto mb-2" />
                     <p>{t('characters.noInventory', 'No inventory available')}</p>
        </div>
      );
    }

    if (character.inventory.bags.length === 0) {
      return (
        <div className="text-center py-4 text-gray-400">
          <Package className="w-8 h-8 mx-auto mb-2" />
                     <p>{t('characters.emptyInventory', 'Empty inventory')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {character.inventory.bags.map((bag, bagIndex) => (
          <div key={`${character.name}-bag-${bagIndex}`} className="bg-gray-800 rounded-lg p-4">
                         <div className="flex items-center justify-between mb-3">
               <div className="flex items-center">
                 <Package className="w-4 h-4 text-gray-400 mr-2" />
                                    <h5 className="text-sm font-semibold text-gray-300">
                    {t('characters.bag', 'Bag')} {bag.id || bagIndex + 1}
                   </h5>
               </div>
              <span className="text-xs text-gray-400">
               {bag.inventory?.filter(item => item !== null).length || 0}/{bag.size || 0} {t('characters.slots', 'slots')}
              </span>
            </div>
            
            <div className="grid grid-cols-10 gap-0.5">
              {Array.from({ length: bag.size || 0 }, (_, slotIndex) => {
                const item = bag.inventory?.[slotIndex];
                const uniqueKey = `${character.name}-bag-${bagIndex}-slot-${slotIndex}`;
                
                return (
                  <div 
                    key={uniqueKey} 
                    className={`
                      w-12 h-16 rounded border-2 flex flex-col items-center justify-center p-0.5 relative
                      ${item 
                        ? `${getRarityBorderColor(item.rarity)} bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer group` 
                        : 'border-dashed border-gray-600 bg-gray-800'
                      }
                    `}
                    title={item?.name || `Slot ${slotIndex + 1}`}
                    onClick={() => handleItemClick(item)}
                  >
                    {item && item.icon && (
                      <Image 
                        src={item.icon} 
                        alt={item.name || `Item ${item.id}`}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-contain mb-1"
                      />
                    )}

                    {/* Quantity display */}
                    {item && item.count > 1 && (
                      <span className="text-lg text-white font-bold absolute inset-0 flex items-center justify-center drop-shadow-lg">
                        {item.count}
                      </span>
                    )}

                    {/* Price display at bottom */}
                    {item && item.vendor_value !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black text-white text-xs py-0.5 flex items-center justify-center">
                        <div className="flex items-center">
                          {formatGold(item.vendor_value)}
                          <Image 
                            src="/images/expansions/Copper.webp" 
                            alt="Copper" 
                            width={8} 
                            height={8} 
                            className="ml-1" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
              <div key={character.name} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {getProfessionIcon(character.profession)}
                    <div className="ml-3">
                      <h3 className="text-xl font-semibold">{character.name}</h3>
                      <p className="text-gray-400 text-sm">{character.profession}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleInventory(character.name)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    {expandedInventories.has(character.name) ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                                                {t('characters.hideInventory', 'Hide Inventory')}
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                                                {t('characters.viewInventory', 'View Inventory')}
                      </>
                    )}
                  </button>
                </div>
                
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400 mb-4">
                                     <div>
                    <strong>{t('characters.level', 'Level')}:</strong> {character.level}
                   </div>
                   <div>
                     <strong>{t('characters.race', 'Race')}:</strong> {character.race}
                   </div>
                   <div className="flex items-center">
                     <strong>{t('characters.specialization', 'Specialization')}:</strong> 
                     <span className="ml-1">{character.specialization || t('common.none', 'None')}</span>
                     {getSpecializationIcon(character)}
                   </div>
                   <div>
                     <strong>{t('characters.world', 'World')}:</strong> {character.world}
                   </div>
                </div>

                {/* Inventario expandible */}
                {expandedInventories.has(character.name) && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                                         <h4 className="text-lg font-semibold mb-3 flex items-center">
                       <Package className="w-5 h-5 mr-2" />
                       {t('characters.inventory', 'Inventory')}
                     </h4>
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
                         <h3 className="text-xl font-semibold text-gray-300 mb-2">No characters</h3>
             <p className="text-gray-400">No characters found</p>
          </div>
                 )}

        {/* Item Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {selectedItem.icon && (
                    <Image 
                      src={selectedItem.icon} 
                      alt={selectedItem.name || `Item ${selectedItem.id}`}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain mr-4"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {selectedItem.name || `Item ${selectedItem.id}`}
                    </h3>
                    <p className={`text-sm ${getRarityTextColor(selectedItem.rarity)}`}>
                      {selectedItem.rarity ? selectedItem.rarity.charAt(0).toUpperCase() + selectedItem.rarity.slice(1) : 'Unknown'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 text-sm">
                {selectedItem.count > 1 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quantity:</span>
                    <span className="text-white font-semibold">{selectedItem.count}</span>
                  </div>
                )}

                {selectedItem.level && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level:</span>
                    <span className="text-white">{selectedItem.level}</span>
                  </div>
                )}

                {selectedItem.vendor_value !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vendor Value:</span>
                    <span className="text-white font-semibold">{formatGold(selectedItem.vendor_value)}</span>
                  </div>
                )}

                {selectedItem.description && (
                  <div>
                    <span className="text-gray-400 block mb-1">Description:</span>
                    <p className="text-white text-xs leading-relaxed">{selectedItem.description}</p>
                  </div>
                )}

                {selectedItem.binding && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Binding:</span>
                    <span className="text-orange-400">{selectedItem.binding}</span>
                  </div>
                )}

                {selectedItem.bound_to && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bound to:</span>
                    <span className="text-orange-400">{selectedItem.bound_to}</span>
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
    </AccountLayout>
   );
 };

export default CharactersPage; 