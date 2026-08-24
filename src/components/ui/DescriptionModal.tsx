import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Map, Clock, Copy, Users, User, ZoomIn } from 'lucide-react';
import ExpansionIcon from './ExpansionIcon';
import GW2Icon from './GW2Icon';
import MarkdownText from './MarkdownText';
import { useI18n } from '@/contexts/I18nContext';

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: {
    id: string;
    name: string;
    description: string;
    waypoint?: string;
    estimatedTime: string;
    expansion: string | string[];
    isSolo?: boolean;
    requiresSquad?: boolean;
    estimatedRewards?: Record<string, string>;
    estimatedGold?: string;
    estimatedSpirit?: string;
    locationImageUrl?: string;
  } | null;
}

export default function DescriptionModal({ isOpen, onClose, route }: DescriptionModalProps) {
  const { t } = useI18n();
  const [copiedWaypoint, setCopiedWaypoint] = useState<string | null>(null);
  const [locationImageZoomOpen, setLocationImageZoomOpen] = useState(false);

  const closeLocationZoom = useCallback(() => {
    setLocationImageZoomOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setLocationImageZoomOpen(false);
    }
  }, [isOpen, route?.id]);

  useEffect(() => {
    if (!locationImageZoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLocationZoom();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [locationImageZoomOpen, closeLocationZoom]);

  if (!route) return null;

  const locationImg = route.locationImageUrl?.trim() || '';

  // Función para procesar la descripción y convertir patrones en saltos de línea
  const processDescription = (description: string): string => {
    if (!description) return '';
    
    // Por ahora, solo devolver el texto tal como está para debug
    return description;
    
    // Comentado temporalmente para debug
    /*
    return description
      // Convertir puntos seguidos de espacio en saltos de línea
      .replace(/\. /g, '.\n')
      // Convertir dos puntos seguidos de espacio en saltos de línea
      .replace(/: /g, ':\n')
      // Convertir guiones seguidos de espacio en saltos de línea
      .replace(/- /g, '-\n')
      // Convertir asteriscos seguidos de espacio en saltos de línea
      .replace(/\* /g, '*\n')
      // Convertir números seguidos de punto y espacio en saltos de línea
      .replace(/(\d+\.) /g, '$1\n')
      // Limpiar múltiples saltos de línea consecutivos
      .replace(/\n\s*\n/g, '\n\n')
      // Limpiar espacios al inicio de cada línea
      .split('\n')
      .map(line => line.trim())
      .join('\n');
    */
  };

  // Función para copiar waypoint al portapapeles
  const copyWaypointToClipboard = async (waypoint: string) => {
    try {
      await navigator.clipboard.writeText(waypoint);
      setCopiedWaypoint(waypoint);
      
      // Limpiar el mensaje después de 2 segundos
      setTimeout(() => {
        setCopiedWaypoint(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy waypoint: ', err);
    }
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

  // Mapeo de tipos de moneda a iconos y labels
  const currencyMap = {
    gold: { icon: 'gold' as const, labelKey: 'currency.gold', suffix: '/h' },
    spiritShards: { icon: 'spirit-shard' as const, labelKey: 'currency.spiritShards', suffix: '/h' },
    karma: { icon: 'karma' as const, labelKey: 'currency.karma', suffix: '' },
    fractalRelics: { icon: 'fractal-relic' as const, labelKey: 'currency.fractalRelics', suffix: '/h' },
    volatileMagic: { icon: 'volatile-magic' as const, labelKey: 'currency.volatileMagic', suffix: '/h' },
    unboundMagic: { icon: 'unbound-magic' as const, labelKey: 'currency.unboundMagic', suffix: '/h' },
    riftEssences: { icon: 'rift-essence' as const, labelKey: 'currency.riftEssences', suffix: '/h' },
    mysticClovers: { icon: 'mystic-clover' as const, labelKey: 'currency.mysticClovers', suffix: '/h' },
    imperialFavor: { icon: 'imperial-favor' as const, labelKey: 'currency.imperialFavor', suffix: '/h' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: título + miniatura "dónde jugar" + cerrar */}
              <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-700">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Map className="mt-0.5 h-6 w-6 shrink-0 text-blue-400" />
                  <h3 className="text-xl font-semibold leading-snug text-white">
                    {route.name}
                  </h3>
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  {locationImg ? (
                    <button
                      type="button"
                      onClick={() => setLocationImageZoomOpen(true)}
                      className="group relative overflow-hidden rounded-lg border border-gray-600 bg-gray-900/80 shadow-md ring-2 ring-transparent transition hover:border-emerald-500/60 hover:ring-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      title={t('modal.locationImageZoom', 'Ver imagen ampliada')}
                    >
                      {/* img: remote asset URL */}
                      <img
                        src={locationImg}
                        alt=""
                        className="h-20 w-36 object-cover sm:h-24 sm:w-40"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-90 transition group-hover:bg-black/45">
                        <ZoomIn className="h-8 w-8 text-white drop-shadow-md" aria-hidden />
                      </span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                    aria-label={t('modal.close', 'Close')}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Modalidad Badges */}
                <div className="flex gap-2">
                  {route.isSolo && (
                    <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {t('farmingRoutes.mode.solo', 'Solo')}
                    </span>
                  )}
                  {route.requiresSquad && (
                    <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t('farmingRoutes.mode.squad', 'Squad')}
                    </span>
                  )}
                </div>

                {/* Expansiones */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">{t('modal.requiredExpansions', 'Required expansions:')}</span>
                  <div className="flex gap-1">
                    {(Array.isArray(route.expansion) ? route.expansion : [route.expansion]).map((exp) => (
                      <ExpansionIcon 
                        key={exp} 
                        expansion={exp as 'core' | 'hot' | 'pof' | 'eod' | 'soto' | 'jw'} 
                        size="md" 
                        variant="compact" 
                      />
                    ))}
                  </div>
                </div>

                {/* Descripción completa */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">{t('modal.description', 'Description:')}</h4>
                  <div className="p-4">
                    <MarkdownText 
                      text={processDescription(route.description)}
                      className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap break-all"
                    />
                  </div>
                </div>

                {/* Waypoint */}
                {route.waypoint && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">{t('modal.waypoint', 'Waypoint:')}</span>
                    <div className="relative">
                      <button
                        onClick={() => copyWaypointToClipboard(route.waypoint!)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                          copiedWaypoint === route.waypoint
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-blue-400'
                        }`}
                        title={copiedWaypoint === route.waypoint ? t('modal.copied', 'Copied!') : t('modal.clickToCopy', 'Click to copy waypoint')}
                      >
                        <span className="font-mono text-sm">{route.waypoint}</span>
                        <Copy className="w-4 h-4" />
                      </button>
                      
                      {/* Notificación local al lado del botón */}
                      {copiedWaypoint === route.waypoint && (
                        <motion.div
                          initial={{ opacity: 0, x: -10, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -10, scale: 0.95 }}
                          className="absolute left-full ml-2 top-0 bg-green-600 text-white rounded-lg shadow-lg px-3 py-1 flex items-center gap-2 z-50 whitespace-nowrap">
                          <Copy className="w-3 h-3" />
                          <span className="text-xs font-medium">{t('modal.waypointCopied', 'Waypoint copied!')}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tiempo */}
                  <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-400" />
                    <div>
                      <p className="text-gray-400 text-sm">{t('modal.estimatedTime', 'Estimated time:')}</p>
                      <p className="text-blue-400 font-semibold text-lg">{route.estimatedTime}</p>
                    </div>
                  </div>

                  {/* Recompensas */}
                  {route.estimatedRewards && Object.entries(route.estimatedRewards).map(([currencyType, value]) => {
                    if (!value || !value.trim()) return null;
                    
                    const currency = currencyMap[currencyType as keyof typeof currencyMap];
                    if (!currency) return null;

                    return (
                      <div key={currencyType} className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg">
                        <div className="relative">
                          <GW2Icon 
                            type={currency.icon} 
                            size="md"
                          />
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">{t(currency.labelKey, currency.labelKey)}</p>
                          <p className="text-yellow-400 font-semibold text-lg">
                            {currencyType === 'gold' ? formatGoldDisplay(value) : `${value}${currency.suffix}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Compatibilidad hacia atrás */}
                  {(!route.estimatedRewards || Object.keys(route.estimatedRewards).length === 0) && (
                    <>
                      {/* Oro legacy */}
                      {route.estimatedGold && route.estimatedGold.trim() && (
                        <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg">
                          <GW2Icon type="gold" size="md" />
                          <div>
                            <p className="text-gray-400 text-sm">{t('modal.goldPerHour', 'Gold per hour:')}</p>
                            <p className="text-yellow-400 font-semibold text-lg">{formatGoldDisplay(route.estimatedGold)}</p>
                          </div>
                        </div>
                      )}

                      {/* Spirit Shards legacy */}
                      {route.estimatedSpirit && route.estimatedSpirit.trim() && (
                        <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg">
                          <GW2Icon type="spirit-shard" size="md" />
                          <div>
                            <p className="text-gray-400 text-sm">{t('modal.spiritShardsPerHour', 'Spirit Shards per hour:')}</p>
                            <p className="text-blue-400 font-semibold text-lg">{route.estimatedSpirit}/h</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-gray-700">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t('modal.close', 'Close')}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Vista ampliada de la ubicación (encima del modal de ruta) */}
          <AnimatePresence>
            {locationImageZoomOpen && locationImg ? (
              <motion.div
                key="route-location-zoom"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex h-screen w-screen items-center justify-center bg-black/90 p-2 backdrop-blur-sm sm:p-3"
                onClick={closeLocationZoom}
                role="presentation"
              >
                <motion.div
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.98, opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="relative flex h-full w-full items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={closeLocationZoom}
                    className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-2 text-white/95 transition hover:bg-black/80 hover:text-white sm:right-4 sm:top-4"
                    aria-label={t('modal.close', 'Close')}
                  >
                    <X className="h-8 w-8" />
                  </button>
                  {/* img: remote asset URL */}
                  <img
                    src={locationImg}
                    alt={t('modal.locationWhereToPlayAlt', 'Ubicación en el mapa')}
                    className="h-auto max-h-[96vh] w-auto max-w-[96vw] object-contain shadow-2xl"
                  />
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
