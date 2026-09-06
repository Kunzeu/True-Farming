'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import {
  ArrowLeft,
  Calendar,
  Bug,
  Plus,
  Zap,
  Settings,
  Package
} from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  changes: {
    type: 'feature' | 'bugfix' | 'improvement' | 'breaking';
    title: string;
    description: string;
  }[];
}

const ChangelogPage = () => {
  usePageTitle('pageTitles.changelog', 'Changelog');
  const { t } = useI18n();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const changelogData: ChangelogEntry[] = useMemo(() => [
    {
      version: '2.1.4',
      date: '2025-12-09',
      type: 'patch',
      changes: [
        {
          type: 'feature',
          title: t('changelog.orphan.created', 'Orphan Route - New Section'),
          description: t('changelog.orphan.created.desc', 'Complete guide for the orphan karma route. Includes interactive map, tips, and gift calculator with real-time prices.')
        }
      ]
    },
    {
      version: '2.1.3',
      date: '2025-11-22',
      type: 'minor',
      changes: [
        {
          type: 'feature',
          title: t('changelog.navigation.search', 'Navegación - Buscador global'),
          description: t('changelog.navigation.search.desc', 'Agregado buscador completo en escritorio y móvil con resultados en tiempo real')
        },
        {
          type: 'feature',
          title: t('changelog.magic.consumables', 'Análisis de Magia - Sección de consumibles LS3 y LS4'),
          description: t('changelog.magic.consumables.desc', 'Agregada sección de consumibles de Magia Liberada (LS3) y Magia Volátil (LS4) con cantidades')
        },
        {
          type: 'improvement',
          title: t('changelog.navigation.mobileOptimization', 'Navegación - Optimización del menú móvil'),
          description: t('changelog.navigation.mobileOptimization.desc', 'Menú móvil optimizado con scroll, espaciados compactos y scrollbar personalizada para mejor experiencia de usuario')
        },
        {
          type: 'improvement',
          title: t('changelog.contributions.socialIcons', 'Contribuciones - Iconos de redes sociales'),
          description: t('changelog.contributions.socialIcons.desc', 'Agregados iconos de Twitch y YouTube a la página de contribuciones')
        },
        {
          type: 'bugfix',
          title: t('changelog.magic.armoredScale', 'Análisis de Magia - Corrección de Profit Max para Escama blindada'),
          description: t('changelog.magic.armoredScale.desc', 'Corregido el cálculo de Profit Max para Escama blindada en Magia Volátil')
        }
      ]
    },
    {
      version: '2.1.2',
      date: '2025-11-07',
      type: 'minor',
      changes: [
        {
          type: 'feature',
          title: (() => {
            const mapName = t('magicMirrors.maps.shipwreckStrand', 'Shipwreck Strand');
            return t('changelog.garden.shipwreck', 'Jardín - Nuevo jardín de {map}').replace('{map}', mapName);
          })(),
          description: (() => {
            const mapName = t('magicMirrors.maps.shipwreckStrand', 'Shipwreck Strand');
            const waypointName = t('gardenPage.waypoints.pubCanach', 'Pub Canach Waypoint');
            return t('changelog.garden.shipwreck.desc', 'Agregado nuevo jardín de {map} ({waypoint}) a la Lista 3')
              .replace('{map}', mapName)
              .replace('{waypoint}', waypointName);
          })()
        },
        {
          type: 'feature',
          title: t('changelog.magicMirrors.interactiveMap', 'Espejos Mágicos - Mapa interactivo'),
          description: (() => {
            const map1 = t('magicMirrors.maps.starlitWeald', 'Starlit Weald');
            const map2 = t('magicMirrors.maps.shipwreckStrand', 'Shipwreck Strand');
            return t('changelog.magicMirrors.interactiveMap.desc', 'Nuevo mapa interactivo para rastrear el progreso de los espejos mágicos en {map1} y {map2}')
              .replace('{map1}', map1)
              .replace('{map2}', map2);
          })()
        },
        {
          type: 'improvement',
          title: t('changelog.dashboard.smartOrdering', 'Dashboard - Ordenamiento inteligente'),
          description: t('changelog.dashboard.smartOrdering.desc', 'El dashboard ahora se ordena automáticamente según la utilidad de las páginas (páginas más visitadas aparecen primero)')
        },
        {
          type: 'bugfix',
          title: t('changelog.conversionGuide.gif', 'Guía de conversiones T6 - Corrección de gif en móvil'),
          description: t('changelog.conversionGuide.gif.desc', 'Se corregió el gif de Guía de conversiones T6 en móvil (anteriormente no se mostraba)')
        }
      ]
    },
    {
      version: '2.1.1',
      date: '2025-10-30',
      type: 'minor',
      changes: [
        {
          type: 'feature',
          title: t('changelog.opened.essence', 'Opened - Sección Essence'),
          description: t('changelog.opened.essence.desc', 'Nueva sección de Essence dentro de Opened con guía y recompensas')
        },
        {
          type: 'feature',
          title: t('changelog.alt.parking', 'Alt Parking - Guía de ubicaciones'),
          description: t('changelog.alt.parking.desc', 'Nueva sección Alt Parking con ubicaciones y rutas recomendadas')
        },
        {
          type: 'feature',
          title: t('changelog.profile.username', 'Perfil - Cambio de nombre de usuario'),
          description: t('changelog.profile.username.desc', 'Nuevo panel para cambiar el nombre de usuario')
        },
        {
          type: 'feature',
          title: t('changelog.lny.opening', 'Año Nuevo Lunar - Cálculos de apertura'),
          description: t(
            'changelog.lny.opening.desc',
            'Cálculos de apertura de sobres y cajas del Año Nuevo Lunar'
          )
        }
      ]
    },
    {
      version: '2.1.0',
      date: '2025-10-22',
      type: 'major',
      changes: [
        {
          type: 'feature',
          title: t('changelog.halloween.tot', 'Halloween - Calculadora de ToT'),
          description: t('changelog.halloween.tot.desc', 'Calculadora completa para Trick-or-Treat Bags con análisis de recompensas y probabilidades')
        },
        {
          type: 'feature',
          title: t('changelog.fourwinds.supply', 'Four Winds Festival - Calculadora de Zephyrite Supply Box'),
          description: t('changelog.fourwinds.supply.desc', 'Calculadora de Zephyrite Supply Box con análisis de materiales y costos en tiempo real')
        },
        {
          type: 'feature',
          title: t('changelog.lunar.analysis', 'Lunar New Year - Sistema de Análisis'),
          description: t('changelog.lunar.analysis.desc', 'Sistema de análisis de Red Bags y Divine Envelopes con datos de más de 1.4 millones de cajas analizadas')
        },
        {
          type: 'feature',
          title: t('changelog.fractals.encryption', 'Análisis de Fractal Encryption'),
          description: t('changelog.fractals.encryption.desc', 'Análisis completo de Fractal Encryption con 2.1M de cajas analizadas')
        },
      ]
    }
  ], [t]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Plus className="w-4 h-4 text-green-400" />;
      case 'bugfix': return <Bug className="w-4 h-4 text-red-400" />;
      case 'improvement': return <Zap className="w-4 h-4 text-blue-400" />;
      case 'breaking': return <Settings className="w-4 h-4 text-orange-400" />;
      default: return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'border-green-500/30 bg-green-900/20';
      case 'bugfix': return 'border-red-500/30 bg-red-900/20';
      case 'improvement': return 'border-blue-500/30 bg-blue-900/20';
      case 'breaking': return 'border-orange-500/30 bg-orange-900/20';
      default: return 'border-gray-500/30 bg-gray-900/20';
    }
  };

  const getVersionTypeColor = (type: string) => {
    switch (type) {
      case 'major': return 'bg-red-600 text-white';
      case 'minor': return 'bg-blue-600 text-white';
      case 'patch': return 'bg-green-600 text-white';
      case 'hotfix': return 'bg-orange-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen tf-site-bg">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* Botón Volver */}
          <div className="flex justify-start mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 hover:bg-gray-800/90 border border-green-500/30 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('nav.backToHome', 'Volver al Inicio')}
            </Link>
          </div>

          <div className="flex items-center justify-center mb-4">
            <Package className="w-12 h-12 text-green-400 mr-3" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{t('pageTitles.changelog', 'Changelog')}</h1>
          </div>
          <p className="text-base sm:text-xl text-gray-300">
            {t('changelog.subtitle', 'Registro de actualizaciones, mejoras y correcciones')}
          </p>
        </motion.div>

        {/* Changelog Entries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {!isMounted ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
            </div>
          ) : (
            changelogData.map((entry, index) => (
              <div
                key={entry.version}
                className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 shadow-2xl"
              >
                {/* Version Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-gray-700/50">
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getVersionTypeColor(entry.type)}`}>
                      v{entry.version}
                    </span>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{entry.date}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedVersion(selectedVersion === entry.version ? null : entry.version)}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {selectedVersion === entry.version
                      ? t('changelog.toggle.hide', 'Hide details')
                      : t('changelog.toggle.show', 'View details')}
                  </button>
                </div>

                {/* Changes List */}
                <div className="space-y-3">
                  {entry.changes.map((change, changeIndex) => (
                    <motion.div
                      key={changeIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + changeIndex * 0.05 }}
                      className={`p-4 rounded-lg border ${getTypeColor(change.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getTypeIcon(change.type)}
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">{change.title}</h3>
                          <p className="text-gray-300 text-sm">{change.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Detailed Stats (when expanded) */}
                {selectedVersion === entry.version && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-700/50"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {entry.changes.filter(c => c.type === 'feature').length}
                        </div>
                        <div className="text-xs text-gray-400">{t('changelog.stats.features', 'New Features')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">
                          {entry.changes.filter(c => c.type === 'bugfix').length}
                        </div>
                        <div className="text-xs text-gray-400">{t('changelog.stats.bugfixes', 'Bug fixes')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {entry.changes.filter(c => c.type === 'improvement').length}
                        </div>
                        <div className="text-xs text-gray-400">{t('changelog.stats.improvements', 'Improvements')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">
                          {entry.changes.filter(c => c.type === 'breaking').length}
                        </div>
                        <div className="text-xs text-gray-400">{t('changelog.stats.breaking', 'Breaking changes')}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ))
          )}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/30 rounded-lg p-4">
            <p
              className="text-gray-400 text-sm"
              dangerouslySetInnerHTML={{
                __html: t('changelog.footer', 'Para reportar bugs o sugerir nuevas funciones, visita nuestro Discord.')
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChangelogPage;
