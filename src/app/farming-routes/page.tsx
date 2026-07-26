'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, Map, Clock, RefreshCw, Star } from 'lucide-react';
import { useDatabase, FarmItem } from '@/hooks/useDatabase';
import ExpansionIcon from '@/components/ui/ExpansionIcon';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import DescriptionModal from '@/components/ui/DescriptionModal';
import FarmingRouteCard from '@/components/farming-routes/FarmingRouteCard';

export default function FarmingRoutes() {
  usePageTitle('pageTitles.farmingRoutes', 'Farming Routes');
  const { t } = useI18n();
  
  const { dbService } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpansions, setSelectedExpansions] = useState<string[]>([]);
  const [farmingRoutes, setFarmingRoutes] = useState<FarmItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedWaypoint, setCopiedWaypoint] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<FarmItem | null>(null);

  // Función para copiar waypoint al portapapeles
  const copyWaypointToClipboard = async (waypoint: string, farmId: string) => {
    try {
      await navigator.clipboard.writeText(waypoint);
      setCopiedWaypoint(`${farmId}-${waypoint}`);
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setCopiedWaypoint(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy waypoint: ', err);
    }
  };

  // Función para abrir el modal de descripción
  const openDescriptionModal = (route: FarmItem) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  // Función para cerrar el modal de descripción
  const closeDescriptionModal = () => {
    setIsModalOpen(false);
    setSelectedRoute(null);
  };

  // Función para truncar texto preservando links markdown completos
  const truncateDescription = (text: string, maxLength: number = 200): string => {
    if (text.length <= maxLength) return text;
    
    // Buscar todos los links markdown en el texto
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = Array.from(text.matchAll(markdownLinkRegex));
    
    if (links.length === 0) {
      // Si no hay links, truncar normalmente
      return text.substring(0, maxLength) + '...';
    }
    
    // Verificar si algún link estaría cortado
    for (const link of links) {
      const linkStart = link.index!;
      const linkEnd = linkStart + link[0].length;
      
      // Si cortaríamos un link, extender hasta después del link
      if (linkStart < maxLength && linkEnd > maxLength) {
        // Si el link termina en una posición razonable (< maxLength + 100), incluirlo completo
        if (linkEnd < maxLength + 100) {
          return text.substring(0, linkEnd) + '...';
        }
      }
    }
    
    // Si llegamos aquí, podemos truncar normalmente
    return text.substring(0, maxLength) + '...';
  };

  // Mapeo de tipos de moneda a iconos y labels
  const currencyMap = {
    gold: { icon: 'gold' as const, labelKey: 'currency.gold', suffix: '' },
    spiritShards: { icon: 'spirit-shard' as const, labelKey: 'currency.spiritShards', suffix: '' },
    karma: { icon: 'karma' as const, labelKey: 'currency.karma', suffix: '' },
    fractalRelics: { icon: 'fractal-relic' as const, labelKey: 'currency.fractalRelics', suffix: '' },
    volatileMagic: { icon: 'volatile-magic' as const, labelKey: 'currency.volatileMagic', suffix: '' },
    unboundMagic: { icon: 'unbound-magic' as const, labelKey: 'currency.unboundMagic', suffix: '' },
    riftEssences: { icon: 'rift-essence' as const, labelKey: 'currency.riftEssences', suffix: '' },
    mysticClovers: { icon: 'mystic-clover' as const, labelKey: 'currency.mysticClovers', suffix: '' },
    imperialFavor: { icon: 'imperial-favor' as const, labelKey: 'currency.imperialFavor', suffix: '' }
  };

  // Función para formatear oro correctamente
  const formatGoldDisplay = (goldValue: string | undefined): string => {
    if (!goldValue || !goldValue.trim()) return '';
    
    // Si ya está en formato GW2 (contiene g, s, c), devolverlo tal como está
    if (goldValue.includes('g') || goldValue.includes('s') || goldValue.includes('c')) {
      return goldValue;
    }
    
    // Si es solo números, convertirlo a formato GW2
    const copper = parseInt(goldValue);
    if (isNaN(copper)) return '';
    
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const remainingCopper = copper % 100;
    
    // Siempre mostrar formato completo con ceros a la izquierda
    const goldStr = gold.toString();
    const silverStr = silver.toString().padStart(2, '0');
    const copperStr = remainingCopper.toString().padStart(2, '0');
    
    return `${goldStr}g ${silverStr}s ${copperStr}c`;
  };

  // Cargar rutas desde la base de datos
  const loadRoutes = useCallback(async () => {
    if (!dbService) {
      console.log('dbService not available yet');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      
      // Cargar todos los farms y filtrar solo los aprobados
      const allRoutes = await dbService.getAllFarms();
      const approvedRoutes = allRoutes.filter((route: FarmItem) => route.status === 'approved');
      
      // Ordenar por el campo order (menor número = más arriba)
      const sortedRoutes = approvedRoutes.sort((a, b) => {
        const orderA = a.order ?? 999; // Si no tiene order, va al final
        const orderB = b.order ?? 999;
        return orderA - orderB;
      });
      
      setFarmingRoutes(sortedRoutes);
    } catch (error) {
      console.error('Error loading routes:', error);
      setError(t('farmingRoutes.errorLoading', 'Error loading routes from database'));
    } finally {
      setIsLoading(false);
    }
  }, [dbService, t]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // Filtrar rutas
  const filteredRoutes = farmingRoutes.filter(route => {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const qn = normalize(searchQuery.trim());

    // Búsqueda por nombre/descr. (normalizada)
    const textMatch =
      normalize(route.name).includes(qn) ||
      normalize(route.description).includes(qn);

    // Búsqueda por divisas (sin ordenar resultados)
    // Aliases multilenguaje (ES/EN/DE/FR simples) -> clave canónica de estimatedRewards
    const currencyAliases: Record<string, keyof typeof currencyMap> = {
      // Gold
      gold: 'gold', oro: 'gold', g: 'gold', münze: 'gold', munze: 'gold', goldmunzen: 'gold', or: 'gold',
      // Spirit Shards
      spirit: 'spiritShards', shards: 'spiritShards', 'spirit shards': 'spiritShards', espiritu: 'spiritShards', espiritul: 'spiritShards', esquirlas: 'spiritShards', geister: 'spiritShards', scherben: 'spiritShards', geisterscherben: 'spiritShards', 'eclats esprit': 'spiritShards', "eclats d esprit": 'spiritShards',
      // Karma
      karma: 'karma',
      // Fractal Relics
      relics: 'fractalRelics', fractal: 'fractalRelics', 'fractal relics': 'fractalRelics', 'reliquias fractales': 'fractalRelics', fraktalrelikte: 'fractalRelics', 'reliques fractales': 'fractalRelics',
      // Volatile Magic
      volatile: 'volatileMagic', 'volatile magic': 'volatileMagic', 'magia volatil': 'volatileMagic', 'fluchtige magie': 'volatileMagic', 'magie volatile': 'volatileMagic',
      // Unbound Magic
      unbound: 'unboundMagic', 'unbound magic': 'unboundMagic', 'magia desatada': 'unboundMagic', 'ungebundene magie': 'unboundMagic', 'magie deliee': 'unboundMagic', 'magie non liee': 'unboundMagic',
      // Rift Essences
      rift: 'riftEssences', essences: 'riftEssences', 'rift essences': 'riftEssences', 'esencias de fisura': 'riftEssences', 'riss essenzen': 'riftEssences', 'essences de faille': 'riftEssences',
      // Imperial Favor
      imperial: 'imperialFavor', favor: 'imperialFavor', 'imperial favor': 'imperialFavor', 'favor imperial': 'imperialFavor', 'kaiserliche gunst': 'imperialFavor', 'faveur imperiale': 'imperialFavor'
    };

    // Detectar si la query apunta a una divisa conocida (normalizada)
    let currencyMatch = false;
    if (qn.length > 0) {
      for (const alias in currencyAliases) {
        const an = normalize(alias);
        if (an.includes(qn) || qn.includes(an)) {
          const key = currencyAliases[alias];
          const rewards = route.estimatedRewards as Partial<Record<keyof typeof currencyMap, unknown>> | undefined;
          const value = rewards?.[key];
          const hasNew = typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
          const hasLegacyGold = key === 'gold' && Boolean(route.estimatedGold && route.estimatedGold.trim());
          const hasLegacySpirit = key === 'spiritShards' && Boolean(route.estimatedSpirit && route.estimatedSpirit.trim());
          if (hasNew || hasLegacyGold || hasLegacySpirit) {
            currencyMatch = true;
            break;
          }
        }
      }
    }

    const matchesSearch = textMatch || currencyMatch;
    
    // Si no hay expansiones seleccionadas, mostrar todas
    if (selectedExpansions.length === 0) {
      return matchesSearch;
    }
    
    // Obtener las expansiones de la ruta
    const routeExpansions = Array.isArray(route.expansion) ? route.expansion : [route.expansion];
    
    // Verificar que la ruta requiera TODAS las expansiones seleccionadas
    const matchesExpansions = selectedExpansions.every(selectedExp => 
      routeExpansions.includes(selectedExp as 'core' | 'hot' | 'pof' | 'eod' | 'soto' | 'jw' | 'voe')
    );
    
    return matchesSearch && matchesExpansions;
  });

  // Función para manejar la selección de expansiones
  const handleExpansionToggle = (expansion: string) => {
    setSelectedExpansions(prev => {
      if (prev.includes(expansion)) {
        return prev.filter(exp => exp !== expansion);
      } else {
        return [...prev, expansion];
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-[1600px] px-4 py-8 main-content sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                              <p className="text-white">{t('farmingRoutes.loading', 'Loading routes from database...')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      
      <main className="main-content mx-auto w-full max-w-[1600px] px-3 py-8 sm:px-5 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('farmingRoutes.title', 'Farming Routes')}
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            {t('farmingRoutes.subtitle', 'The best routes to make gold in Guild Wars 2')}
          </p>
          
          {/* Daily Routine Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center">
            <Link
              href="/daily-routine"
              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              <Clock className="w-5 h-5" />
              <span>{t('dashboard.dailyRoutine.title', 'Daily Routine')}</span>
              <Star className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}



        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('search.routes', 'Search routes...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Expansion Filter - Multiple Selection */}
            <div className="flex flex-wrap gap-2 justify-center">
              {(['core', 'hot', 'pof', 'eod', 'soto', 'jw', 'voe'] as const).map((expansion) => (
                <button
                  key={expansion}
                  onClick={() => handleExpansionToggle(expansion)}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                    selectedExpansions.includes(expansion)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ExpansionIcon expansion={expansion} size="sm" variant="compact" />
                  {expansion.toUpperCase()}
                </button>
              ))}
              
              {/* Clear Selection Button */}
              {selectedExpansions.length > 0 && (
                <button
                  onClick={() => setSelectedExpansions([])}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200">
                  {t('button.clear', 'Clear')}
                </button>
              )}
            </div>

            {/* Reload Button removed */}
          </div>
        </motion.div>

        {/* Routes Grid — 2×2 */}
        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {filteredRoutes.map((route, index) => (
            <FarmingRouteCard
              key={route.id}
              route={route}
              index={index}
              copiedWaypoint={copiedWaypoint}
              onCopyWaypoint={copyWaypointToClipboard}
              onOpenDescription={openDescriptionModal}
              truncateDescription={truncateDescription}
              formatGoldDisplay={formatGoldDisplay}
              t={t}
            />
          ))}
        </div>

        {/* Mensaje cuando no hay rutas */}
        {!isLoading && filteredRoutes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12">
            <div className="bg-gray-800 rounded-lg p-8">
              <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('empty.noFarms', 'No farms available')}
              </h3>
              <p className="text-gray-400 mb-4">
                {t('empty.noFarmsDesc', 'No farms created.')}
              </p>
            </div>
          </motion.div>
        )}

      </main>

      {/* Modal de descripción */}
      <DescriptionModal
        isOpen={isModalOpen}
        onClose={closeDescriptionModal}
        route={selectedRoute}
      />

    </div>
  );
} 