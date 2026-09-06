'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  Clock, 
  CheckCircle, 
  Circle, 
  Search, 
  Filter, 
  Grid, 
  List,
  X,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useDatabase, FarmItem } from '@/hooks/useDatabase';
import ExpansionIcon from '@/components/ui/ExpansionIcon';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import MarkdownText from '@/components/ui/MarkdownText';
import { useDailyRoutinePrefs } from '@/hooks/useDailyRoutine';

// Mapeo de monedas a iconos (fuera del componente para evitar re-renders)
const currencyConfig = {
  gold: { icon: '/images/expansions/Gold.webp', labelKey: 'currency.gold', color: 'text-yellow-400' },
  spiritShards: { icon: '/images/expansions/Spirit_Shard.webp', labelKey: 'currency.spiritShards', color: 'text-blue-400' },
  karma: { icon: '/images/expansions/karma.webp', labelKey: 'currency.karma', color: 'text-green-400' },
  fractalRelics: { icon: '/images/expansions/fractal-relic.webp', labelKey: 'currency.fractalRelics', color: 'text-purple-400' },
  volatileMagic: { icon: '/images/expansions/volatile-magic.webp', labelKey: 'currency.volatileMagic', color: 'text-orange-400' },
  unboundMagic: { icon: '/images/expansions/unbound-magic.webp', labelKey: 'currency.unboundMagic', color: 'text-indigo-400' },
  riftEssences: { icon: '/images/expansions/rift-essence.webp', labelKey: 'currency.riftEssences', color: 'text-pink-400' },
  mysticClovers: { icon: '/images/expansions/mystic-clover.webp', labelKey: 'currency.mysticClovers', color: 'text-emerald-400' },
  imperialFavor: { icon: '/images/expansions/Imperial_Favor.webp', labelKey: 'currency.imperialFavor', color: 'text-purple-400' }
};

export default function DailyRoutine() {
  usePageTitle('pageTitles.dailyRoutine', 'Daily Routine');
  
  const { dbService } = useDatabase();
  const { t } = useI18n();
  const { initialIds, useDebouncedSave } = useDailyRoutinePrefs();
  const [farms, setFarms] = useState<FarmItem[]>([]);
  const [selectedFarms, setSelectedFarms] = useState<Set<string>>(new Set());
  
  // Estados para filtros y vista
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpansions, setSelectedExpansions] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'time' | 'gold' | 'expansion' | 'spiritShards' | 'karma' | 'riftEssences' | 'imperialFavor'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // Cargar farms desde la base de datos
  useEffect(() => {
    const loadFarms = async () => {
      if (!dbService) return;
      try {
        const farms = await dbService.getAllFarms();
        setFarms(farms);
      } catch (error) {
        console.error('Error loading farms:', error);
        setFarms([]);
      }
    };
    loadFarms();
  }, [dbService]);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Verificar inicialmente
    checkMobile();
    
    // Agregar listener para cambios de tamaño
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Inicializar selección desde localStorage (hook)
  useEffect(() => {
    if (Array.isArray(initialIds)) {
      setSelectedFarms(new Set(initialIds));
    }
  }, [initialIds]);

  const toggleFarmSelection = (farmId: string) => {
    setSelectedFarms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(farmId)) {
        newSet.delete(farmId);
      } else {
        newSet.add(farmId);
      }
      return newSet;
    });
  };

  // Guardar cambios en localStorage con debounce
  const debouncedSave = useDebouncedSave();
  useEffect(() => {
    debouncedSave(Array.from(selectedFarms));
  }, [selectedFarms, debouncedSave]);

  // Función para convertir HH:MM:SS a minutos totales
  const parseTimeToMinutes = (timeStr: string): number => {
    // Formato esperado: "02:00:00" o "01:30:00"
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      const totalMinutes = hours * 60 + minutes + Math.round(seconds / 60);
      
      return totalMinutes;
    }
    return 0;
  };

  // Función para convertir minutos a formato legible
  const formatMinutesToReadable = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  // Función para convertir oro a cobre para ordenamiento
  const parseGoldToCopper = useCallback((goldValue: string | undefined): number => {
    if (!goldValue || !goldValue.trim()) return 0;
    
    if (goldValue.includes('g') || goldValue.includes('s') || goldValue.includes('c')) {
      const goldMatch = goldValue.match(/(\d+)g/);
      const silverMatch = goldValue.match(/(\d+)s/);
      const copperMatch = goldValue.match(/(\d+)c/);
      
      const gold = goldMatch ? parseInt(goldMatch[1]) : 0;
      const silver = silverMatch ? parseInt(silverMatch[1]) : 0;
      const copper = copperMatch ? parseInt(copperMatch[1]) : 0;
      
      return (gold * 10000) + (silver * 100) + copper;
    } else {
      const copperValue = parseInt(goldValue);
      return isNaN(copperValue) ? 0 : copperValue;
    }
  }, []);

  // Obtener todas las expansiones únicas
  const allExpansions = useMemo(() => {
    // Mostrar siempre las expansiones conocidas, aunque no existan farms aún
    const expansions = new Set<string>(['core','hot','pof','eod','soto','jw','voe']);
    farms.forEach(farm => {
      const farmExpansions = Array.isArray(farm.expansion) ? farm.expansion : [farm.expansion];
      farmExpansions.forEach(exp => expansions.add(exp));
    });
    return Array.from(expansions);
  }, [farms]);

  // Filtrar y ordenar farms
  const filteredAndSortedFarms = useMemo(() => {
    const filtered = farms.filter(farm => {
      // Filtro por término de búsqueda
      if (searchTerm && !farm.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !farm.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtro por expansiones
      if (selectedExpansions.size > 0) {
        const farmExpansions = Array.isArray(farm.expansion) ? farm.expansion : [farm.expansion];
        if (!farmExpansions.some(exp => selectedExpansions.has(exp))) {
          return false;
        }
      }
      
      return true;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'time':
          const timeA = parseTimeToMinutes(a.estimatedTime);
          const timeB = parseTimeToMinutes(b.estimatedTime);
          compareValue = timeA - timeB;
          break;
        case 'gold':
          const goldA = parseGoldToCopper(a.estimatedGold);
          const goldB = parseGoldToCopper(b.estimatedGold);
          compareValue = goldA - goldB;
          break;
        case 'expansion':
          const expA = Array.isArray(a.expansion) ? a.expansion[0] : a.expansion;
          const expB = Array.isArray(b.expansion) ? b.expansion[0] : b.expansion;
          compareValue = expA.localeCompare(expB);
          break;
        case 'spiritShards':
          // Solo ordenar farms que tienen esquirlas espirituales
          const spiritA = a.estimatedRewards?.spiritShards?.trim() || a.estimatedSpirit?.trim();
          const spiritB = b.estimatedRewards?.spiritShards?.trim() || b.estimatedSpirit?.trim();
          
          // Si uno tiene esquirlas y el otro no, el que tiene esquirlas va primero
          if (spiritA && !spiritB) return -1;
          if (!spiritA && spiritB) return 1;
          if (!spiritA && !spiritB) return 0;
          
          // Si ambos tienen esquirlas, comparar valores
          const spiritValueA = parseFloat(spiritA!.replace(/[^\d.]/g, '')) || 0;
          const spiritValueB = parseFloat(spiritB!.replace(/[^\d.]/g, '')) || 0;
          compareValue = spiritValueA - spiritValueB;
          break;
        case 'karma':
          // Solo ordenar farms que tienen karma
          const karmaA = a.estimatedRewards?.karma?.trim();
          const karmaB = b.estimatedRewards?.karma?.trim();
          
          // Si uno tiene karma y el otro no, el que tiene karma va primero
          if (karmaA && !karmaB) return -1;
          if (!karmaA && karmaB) return 1;
          if (!karmaA && !karmaB) return 0;
          
          // Si ambos tienen karma, comparar valores
          const karmaValueA = parseFloat(karmaA!.replace(/[^\d.]/g, '')) || 0;
          const karmaValueB = parseFloat(karmaB!.replace(/[^\d.]/g, '')) || 0;
          compareValue = karmaValueA - karmaValueB;
          break;
        case 'riftEssences':
          // Solo ordenar farms que tienen esencias de rift
          const riftA = a.estimatedRewards?.riftEssences?.trim();
          const riftB = b.estimatedRewards?.riftEssences?.trim();
          
          // Si uno tiene esencias y el otro no, el que tiene esencias va primero
          if (riftA && !riftB) return -1;
          if (!riftA && riftB) return 1;
          if (!riftA && !riftB) return 0;
          
          // Si ambos tienen esencias, comparar valores
          const riftValueA = parseFloat(riftA!.replace(/[^\d.]/g, '')) || 0;
          const riftValueB = parseFloat(riftB!.replace(/[^\d.]/g, '')) || 0;
          compareValue = riftValueA - riftValueB;
          break;
        case 'imperialFavor':
          // Solo ordenar farms que tienen favor imperial
          const favorA = a.estimatedRewards?.imperialFavor?.trim();
          const favorB = b.estimatedRewards?.imperialFavor?.trim();
          
          // Si uno tiene favor y el otro no, el que tiene favor va primero
          if (favorA && !favorB) return -1;
          if (!favorA && favorB) return 1;
          if (!favorA && !favorB) return 0;
          
          // Si ambos tienen favor, comparar valores
          const favorValueA = parseFloat(favorA!.replace(/[^\d.]/g, '')) || 0;
          const favorValueB = parseFloat(favorB!.replace(/[^\d.]/g, '')) || 0;
          compareValue = favorValueA - favorValueB;
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [farms, searchTerm, selectedExpansions, sortBy, sortOrder, parseGoldToCopper]);

  // Funciones de manejo de filtros
  const toggleExpansionFilter = (expansion: string) => {
    setSelectedExpansions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expansion)) {
        newSet.delete(expansion);
      } else {
        newSet.add(expansion);
      }
      return newSet;
    });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedExpansions(new Set());
  };

  const selectedFarmsCount = selectedFarms.size;
  
  // Función para obtener todas las monedas de un farm
  const getAllCurrencies = useCallback((farm: FarmItem): Array<{currency: string, value: string, config: typeof currencyConfig[keyof typeof currencyConfig]}> => {
    const currencies: Array<{currency: string, value: string, config: typeof currencyConfig[keyof typeof currencyConfig]}> = [];
    
    // Verificar campos en estimatedRewards PRIMERO (formato nuevo)
    if (farm.estimatedRewards) {
      Object.entries(farm.estimatedRewards).forEach(([currency, value]) => {
        if (value && value.trim() && currencyConfig[currency as keyof typeof currencyConfig]) {
          currencies.push({
            currency,
            value,
            config: currencyConfig[currency as keyof typeof currencyConfig]
          });
        }
      });
    }
    
    // Verificar campos legacy SOLO si no hay equivalentes en estimatedRewards
    if (farm.estimatedGold && farm.estimatedGold.trim() && !currencies.find(c => c.currency === 'gold')) {
      currencies.push({
        currency: 'gold',
        value: farm.estimatedGold,
        config: currencyConfig.gold
      });
    }
    if (farm.estimatedSpirit && farm.estimatedSpirit.trim() && !currencies.find(c => c.currency === 'spiritShards')) {
      currencies.push({
        currency: 'spiritShards',
        value: farm.estimatedSpirit,
        config: currencyConfig.spiritShards
      });
    }
    
    return currencies;
  }, []);

  // Debug: ver farms seleccionados
  const selectedFarmsData = Array.from(selectedFarms).map(id => farms.find(farm => farm.id === id)).filter(Boolean) as FarmItem[];
  const totalEstimatedTime = selectedFarmsData
    .reduce((total, farm) => {
      const timeInMinutes = parseTimeToMinutes(farm.estimatedTime);
      return total + timeInMinutes;
    }, 0);

  // Calcular totales de todas las monedas
  const currencyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    
    selectedFarmsData.forEach(farm => {
      const currencies = getAllCurrencies(farm);
      currencies.forEach(({ currency, value }) => {
        if (!totals[currency]) totals[currency] = 0;
        
        if (currency === 'gold') {
          // Convertir oro a cobre para sumar
          totals[currency] += parseGoldToCopper(value);
        } else {
          // Para otras monedas, sumar valor numérico
          const numericValue = parseInt(value.replace(/[^\d]/g, '')) || 0;
          totals[currency] += numericValue;
        }
      });
    });
    
    return totals;
  }, [selectedFarmsData, getAllCurrencies, parseGoldToCopper]);

  // Note: totalEstimatedGold and totalSpiritShards are now accessed through currencyTotals directly

  // Formatear oro total a formato legible
  const formatGoldTotal = (totalCopper: number): string => {
    const gold = Math.floor(totalCopper / 10000);
    const silver = Math.floor((totalCopper % 10000) / 100);
    const copper = totalCopper % 100;
    
    // Siempre mostrar formato completo con ceros a la izquierda
    const goldStr = gold.toString();
    const silverStr = silver.toString().padStart(2, '0');
    const copperStr = copper.toString().padStart(2, '0');
    
    return `${goldStr}g ${silverStr}s ${copperStr}c`;
  };

  return (
    <div className="min-h-screen tf-site-bg">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header mejorado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text mb-4" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('dailyRoutine.title', 'Daily Routine')}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 max-w-2xl mx-auto px-4">
            {t('dailyRoutine.subtitle', 'Select your favorite farms and create your perfect daily routine')}
          </p>
          
          {/* Botón para volver a Farms */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <Link
              href="/farming-routes"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg border border-blue-400/30"
            >
              <Star className="w-4 h-4" />
              {t('dailyRoutine.backToFarms', 'Back to Farms')}
            </Link>
          </motion.div>
        </motion.div>

        {/* Resumen de rutina seleccionada (siempre visible arriba) */}
        {selectedFarmsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30 shadow-2xl"
          >
            <h3 className="font-bold text-lg sm:text-xl mb-4 text-center text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('dailyRoutine.summary', 'Your Daily Routine Summary')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 text-center">
              {/* Farms count */}
              <div className="bg-gray-800/50 rounded-xl p-2 sm:p-3 border border-gray-600/50">
                <div className="text-lg sm:text-xl font-bold text-blue-400 mb-1">{selectedFarmsCount}</div>
                <div className="text-gray-400 text-xs">{t('dailyRoutine.farms', 'Farms')}</div>
              </div>
              
              {/* Time */}
              <div className="bg-gray-800/50 rounded-xl p-2 sm:p-3 border border-gray-600/50">
                <div className="text-lg sm:text-xl font-bold text-blue-400 mb-1">{formatMinutesToReadable(totalEstimatedTime)}</div>
                <div className="text-gray-400 text-xs">{t('dailyRoutine.time', 'Time')}</div>
              </div>
              
              {/* Dynamic currencies - show ALL currencies */}
              {Object.entries(currencyTotals)
                .filter(([, total]) => total > 0)
                .map(([currency, total]) => {
                  const config = currencyConfig[currency as keyof typeof currencyConfig];
                  if (!config) return null;
                  
                  return (
                    <div key={currency} className="bg-gray-800/50 rounded-xl p-2 sm:p-3 border border-gray-600/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Image 
                          src={config.icon} 
                          alt={t(config.labelKey, config.labelKey)}
                          width={16}
                          height={16}
                          className="w-3 h-3 sm:w-4 sm:h-4"
                        />
                        <div className={`text-sm sm:text-lg font-bold ${config.color} whitespace-nowrap`}>
                          {currency === 'gold' 
                            ? formatGoldTotal(Math.round(total))
                            : Math.round(total).toLocaleString()
                          }
                        </div>
                      </div>
                      <div className="text-gray-400 text-xs">{t(config.labelKey, config.labelKey)}</div>
                    </div>
                  );
                })}
              
              {/* Progress (always last) */}
              <div className="bg-gray-800/50 rounded-xl p-2 sm:p-3 border border-gray-600/50">
                <div className="text-lg sm:text-lg font-bold text-blue-400 mb-1">
                  {Math.round((selectedFarmsCount / farms.length) * 100)}%
                </div>
                <div className="text-gray-400 text-xs">{t('dailyRoutine.progress', 'Progress')}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Panel principal de farms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
        >
          {/* Header con controles */}
          <div className="p-4 sm:p-6 border-b border-gray-700/50">
            <div className="flex flex-col gap-4">
              {/* Título y contador */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{t('dailyRoutine.buildRoutine', 'Build Your Daily Routine')}</h2>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    {filteredAndSortedFarms.length} {t('dailyRoutine.farmsAvailable', 'farms available')} • {selectedFarmsCount} {t('dailyRoutine.selected', 'selected')}
                  </p>
                </div>
              </div>

              {/* Controles de vista y ordenamiento */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3">
                {/* Búsqueda */}
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('dailyRoutine.searchPlaceholder', 'Search farms...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-48"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
                  {/* Filtros */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      showFilters || selectedExpansions.size > 0
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="text-sm">{t('dailyRoutine.filters', 'Filters')}</span>
                    {selectedExpansions.size > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {selectedExpansions.size}
                      </span>
                    )}
                  </button>

                  {/* Ordenamiento - Solo visible en desktop */}
                  <div className="hidden sm:flex items-center gap-1">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'time' | 'gold' | 'expansion' | 'spiritShards' | 'karma' | 'riftEssences' | 'imperialFavor')}
                      className="bg-gray-700 border border-gray-600 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:border-blue-500"
                    >
                      <option value="name">{t('dailyRoutine.sortName', 'Name')}</option>
                      <option value="time">{t('dailyRoutine.sortTime', 'Time')}</option>
                      <option value="gold">{t('dailyRoutine.sortGold', 'Gold')}</option>
                      <option value="expansion">{t('dailyRoutine.sortExpansion', 'Expansion')}</option>
                      <option value="spiritShards">{t('currency.spiritShards', 'Esquirlas Espirituales')}</option>
                      <option value="karma">{t('currency.karma', 'Karma')}</option>
                      <option value="riftEssences">{t('currency.riftEssences', 'Esencias de Rift')}</option>
                      <option value="imperialFavor">{t('currency.imperialFavor', 'Favor Imperial')}</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors"
                    >
                      {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Cambiar vista - Solo visible en desktop */}
                  <div className="hidden sm:flex items-center bg-gray-700 rounded-lg border border-gray-600">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 transition-colors ${
                        viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${
                        viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de filtros expandible */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-700/50"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-gray-400 text-sm font-medium">{t('dailyRoutine.expansions', 'Expansions:')}</span>
                  {allExpansions.map((expansion) => (
                    <button
                      key={expansion}
                      onClick={() => toggleExpansionFilter(expansion)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                        selectedExpansions.has(expansion)
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                          : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <ExpansionIcon expansion={expansion as 'core' | 'hot' | 'pof' | 'eod' | 'soto' | 'jw' | 'voe'} size="sm" variant="compact" />
                      <span className="capitalize">{expansion}</span>
                    </button>
                  ))}
                  {(searchTerm || selectedExpansions.size > 0) && (
                    <button
                      onClick={clearAllFilters}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      {t('dailyRoutine.clearAll', 'Clear all')}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Lista/Grid de farms */}
          <div className="p-4 sm:p-6">
            {filteredAndSortedFarms.length === 0 ? (
              <div className="text-center py-8 sm:py-16">
                <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-6 sm:p-12 border border-gray-600/50">
                  <Search className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4 sm:mb-6" />
                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                    {t('dailyRoutine.noFarmsFound', 'No farms found')}
                  </h3>
                  <p className="text-gray-400 text-base sm:text-lg mb-4">
                    {t('dailyRoutine.adjustFilters', 'Try adjusting your search or filters.')}
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {t('dailyRoutine.clearFilters', 'Clear filters')}
                  </button>
                </div>
              </div>
            ) : (
              /* En móvil siempre vista lista, en desktop respeta viewMode */
              <div className={`${
                (viewMode === 'list' || isMobile) ? 
                'space-y-2' : 
                'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'
              }`}
              >
                {(viewMode === 'list' || isMobile) ? (
                  /* Vista de lista (más compacta para muchos items) */
                  filteredAndSortedFarms.map((farm, index) => (
                    <motion.div
                      key={farm.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className={`p-3 md:p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedFarms.has(farm.id)
                          ? 'bg-blue-500/10 border-blue-500/50 shadow-lg'
                          : 'bg-gray-800/30 border-gray-600/50 hover:bg-gray-700/30 hover:border-gray-500'
                      }`}
                      onClick={() => toggleFarmSelection(farm.id)}
                    >
                                            {/* Layout principal usando CSS Grid */}
                      <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto] gap-3 md:gap-4 items-center">
                        
                        {/* Columna 1: Checkbox */}
                        <div className="flex-shrink-0">
                          {selectedFarms.has(farm.id) ? (
                            <div className="bg-blue-500 rounded p-1">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* Columna 2: Información principal (Nombre, Expansiones, Descripción en móvil) */}
                        <div className="min-w-0 flex-1">
                          {/* Nombre y expansiones en una línea */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold text-sm md:text-base truncate flex-1">
                              {farm.name}
                            </h3>
                            <div className="flex gap-1 flex-shrink-0">
                              {(Array.isArray(farm.expansion) ? farm.expansion : [farm.expansion]).map((exp) => (
                                <ExpansionIcon key={exp} expansion={exp} size="sm" variant="compact" />
                              ))}
                            </div>
                          </div>
                          
                          {/* Descripción solo en móvil */}
                          <div className="block md:hidden">
                            <p className="text-gray-400 text-xs leading-tight line-clamp-1 mb-2">
                              {farm.description}
                            </p>
                          </div>

                          {/* Estadísticas en móvil - layout horizontal compacto */}
                          <div className="flex md:hidden flex-wrap items-center gap-2 max-w-none">
                            {/* Tiempo */}
                            <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-medium">{farm.estimatedTime}</span>
                            </div>
                            
                            {/* Monedas */}
                            {getAllCurrencies(farm).map(({ currency, value, config }) => (
                              <div key={currency} className={`flex items-center gap-1 ${config.color} bg-gray-700/50 px-2 py-1 rounded-md flex-shrink-0`}>
                                <Image 
                                  src={config.icon} 
                                  alt={t(config.labelKey, config.labelKey)}
                                  width={12}
                                  height={12}
                                  className="w-3 h-3"
                                />
                                <span className="text-xs font-medium whitespace-nowrap">
                                  {currency === 'gold' ? formatGoldDisplay(value) : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Columna 3: Estadísticas (solo desktop) */}
                        <div className="hidden md:flex items-center gap-3 lg:gap-4 justify-start">
                          {/* Tiempo */}
                          <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-md">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium whitespace-nowrap">{farm.estimatedTime}</span>
                          </div>
                          
                          {/* Monedas */}
                          <div className="flex items-center gap-2 lg:gap-3">
                            {getAllCurrencies(farm).map(({ currency, value, config }) => (
                              <div key={currency} className={`flex items-center gap-1.5 ${config.color} flex-shrink-0`}>
                                <Image 
                                  src={config.icon} 
                                  alt={t(config.labelKey, config.labelKey)}
                                  width={20}
                                  height={20}
                                  className="w-5 h-5"
                                />
                                <span className="text-sm font-medium whitespace-nowrap">
                                  {currency === 'gold' ? formatGoldDisplay(value) : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  /* Vista de grid (para pocos items o cuando se prefiere más detalle) */
                  filteredAndSortedFarms.map((farm, index) => (
                    <motion.div
                      key={farm.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden cursor-pointer transition-all duration-300 p-4 sm:p-6 border ${
                        selectedFarms.has(farm.id)
                          ? 'border-blue-400 ring-2 ring-blue-400/30 shadow-blue-500/25'
                          : 'border-gray-600 hover:border-blue-500/50 hover:shadow-2xl'
                      }`}
                      onClick={() => toggleFarmSelection(farm.id)}
                    >
                      {/* Checkbox */}
                      <div className={`absolute top-4 right-4 transition-all duration-300 ${
                        selectedFarms.has(farm.id) ? 'opacity-100 scale-110' : 'opacity-60 hover:opacity-100'
                      }`}>
                        {selectedFarms.has(farm.id) ? (
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-1.5 shadow-lg">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 hover:text-blue-400" />
                        )}
                      </div>

                      {/* Información principal */}
                      <div className="mb-2 sm:mb-3">
                        <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg mb-2 pr-12 leading-tight">{farm.name}</h3>
                        <div className="flex gap-1 flex-wrap">
                          {(Array.isArray(farm.expansion) ? farm.expansion : [farm.expansion]).map((exp) => (
                            <div key={exp} className="relative">
                              <ExpansionIcon expansion={exp} size="sm" variant="compact" />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-2 sm:mb-3">
                        <MarkdownText 
                          text={farm.description}
                          className="text-gray-300 text-xs leading-tight line-clamp-2 sm:line-clamp-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        {/* Time always first */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                          <span className="text-blue-300 font-medium text-xs sm:text-sm">{farm.estimatedTime}</span>
                        </div>
                        
                        {/* Dynamic currencies - limit to 3 to keep cards compact */}
                        {getAllCurrencies(farm).slice(0, 7).map(({ currency, value, config }) => {
                          const displayValue = currency === 'gold' ? formatGoldDisplay(value) : value;
                          const isLong = displayValue.length > 8;
                          
                          // Map currency to appropriate background classes
                          const getBgClasses = (currency: string) => {
                            switch (currency) {
                              case 'gold':
                                return 'bg-yellow-500/10 border-yellow-500/20';
                              case 'spiritShards':
                                return 'bg-blue-500/10 border-blue-500/20';
                              case 'imperialFavor':
                                return 'bg-purple-500/10 border-purple-500/20';
                              case 'experience':
                                return 'bg-green-500/10 border-green-500/20';
                              case 'laurels':
                                return 'bg-orange-500/10 border-orange-500/20';
                              default:
                                return 'bg-gray-500/10 border-gray-500/20';
                            }
                          };
                          
                          return (
                            <div 
                              key={currency}
                              className={`${getBgClasses(currency)} rounded-lg p-2 flex items-center gap-1.5 border ${
                                isLong ? 'col-span-2' : ''
                              }`}
                            >
                              <Image 
                                src={config.icon} 
                                alt={t(config.labelKey, config.labelKey)}
                                width={12}
                                height={12}
                                className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
                              />
                              <span className={`${config.color} font-medium truncate text-xs sm:text-sm`}>{displayValue}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}