'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, Calculator, TrendingUp, ArrowLeft } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

const WintersdayPage = () => {
  const [selectedSection, setSelectedSection] = useState<'overview' | 'calculators' | 'strategies'>('overview');
  usePageTitle('pageTitles.wintersday', 'Wintersday');
  const { t } = useI18n();

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/images/backgrounds/wintersday.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay oscuro para mejorar la legibilidad */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Contenido principal */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="flex justify-start mb-4">
              <a href="/festivals" className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 hover:bg-gray-800/90 border border-cyan-500/30 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg">
                <ArrowLeft className="w-4 h-4" />
                {t('nav.backToFestivals')}
              </a>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{t('festival.wintersday')}</h1>
            <p className="text-base sm:text-xl text-gray-300">{t('festivals.page.subtitle').replace('{name}', t('festival.wintersday'))}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap justify-center gap-2 mb-8">
            {(() => {
              type Tab = { id: 'overview' | 'calculators' | 'strategies'; label: string; icon: typeof Info };
              const tabs: Tab[] = [
                { id: 'overview', label: t('festivals.tabs.overview'), icon: Info },
                { id: 'calculators', label: t('festivals.tabs.calculators'), icon: Calculator },
                { id: 'strategies', label: t('festivals.tabs.strategies'), icon: TrendingUp },
              ];
              return tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSection(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${selectedSection === tab.id ? 'bg-cyan-600/80 text-white border border-cyan-400/50 shadow-lg' : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800/90 border border-cyan-500/20 hover:border-cyan-500/40'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ));
            })()}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            {selectedSection === 'overview' && (
              <div className="space-y-8">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-6 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <Info className="w-6 h-6 mr-3 text-cyan-400" />
                    {t('festival.wintersday')}
                  </h2>
                  <p className="text-gray-300">{t('festivals.overview.blurb')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    <a href="/festivals/wintersday/Orphan" className="block group">
                      <div className="bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/20 hover:border-cyan-500/50 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                        <div className="h-48 overflow-hidden relative">
                          <img
                            src="/images/festivals/orphan.webp"
                            alt={t('wintersday.orphan.title')}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                            {t('wintersday.orphan.title')}
                          </h3>
                          <p className="text-gray-400 text-sm line-clamp-3">
                            {t('wintersday.orphan.intro')}
                          </p>
                          <div className="mt-4 flex items-center text-cyan-500 text-sm font-medium">
                            {t('common.viewGuide')} <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {selectedSection === 'calculators' && (
              <div className="space-y-8">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-6 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <Calculator className="w-6 h-6 mr-3 text-cyan-400" />
                    {t('festivals.tabs.calculators')}
                  </h2>
                  <p className="text-gray-300">{t('festivals.common.comingSoon')}</p>
                </div>
              </div>
            )}

            {selectedSection === 'strategies' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <a href="/festivals/wintersday/Orphan" className="block group">
                    <div className="bg-gray-800/50 hover:bg-gray-800/80 border border-cyan-500/20 hover:border-cyan-500/50 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                      <div className="h-48 overflow-hidden relative">
                        <img
                          src="/images/festivals/orphan.webp"
                          alt={t('wintersday.orphan.title')}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                          {t('wintersday.orphan.title')}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-3">
                          {t('wintersday.orphan.intro')}
                        </p>
                        <div className="mt-4 flex items-center text-cyan-500 text-sm font-medium">
                          {t('common.viewGuide')} <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div >
    </div >
  );
};

export default WintersdayPage;


