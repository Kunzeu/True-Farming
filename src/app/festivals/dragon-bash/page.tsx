'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, Calculator, TrendingUp, ArrowLeft } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

const DragonBashPage = () => {
  const [selectedSection, setSelectedSection] = useState<'overview' | 'calculators' | 'strategies'>('overview');
  usePageTitle('pageTitles.dragonBash', 'Dragon Bash');
  const { t } = useI18n();

  return (
    <div 
      className="min-h-screen relative bg-gradient-to-br from-gray-900 via-emerald-900 to-teal-900"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/images/backgrounds/Dragonbash.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex justify-start mb-4">
            <a href="/festivals" className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 hover:bg-gray-800/90 border border-emerald-500/30 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <ArrowLeft className="w-4 h-4" />
              {t('nav.backToFestivals')}
            </a>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{t('festival.dragonBash')}</h1>
          <p className="text-base sm:text-xl text-gray-300">{t('festivals.page.subtitle').replace('{name}', t('festival.dragonBash'))}</p>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedSection === tab.id ? 'bg-emerald-600/80 text-white border border-emerald-400/50 shadow-lg' : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800/90 border border-emerald-500/20 hover:border-emerald-500/40'
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
              <div className="bg-gray-900/80 backdrop-blur-sm border border-emerald-500/30 rounded-lg p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Info className="w-6 h-6 mr-3 text-emerald-400" />
                  {t('festival.dragonBash')}
                </h2>
                <p className="text-gray-300">{t('festivals.overview.blurb')}</p>
              </div>
            </div>
          )}

          {selectedSection === 'calculators' && (
            <div className="space-y-8">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-emerald-500/30 rounded-lg p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Calculator className="w-6 h-6 mr-3 text-emerald-400" />
                  {t('festivals.tabs.calculators')}
                </h2>
                <p className="text-gray-300">{t('festivals.common.comingSoon')}</p>
              </div>
            </div>
          )}

          {selectedSection === 'strategies' && (
            <div className="space-y-8">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-emerald-500/30 rounded-lg p-6 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-3 text-emerald-400" />
                  {t('festivals.tabs.strategies')}
                </h2>
                <p className="text-gray-300">{t('festivals.common.comingSoon')}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DragonBashPage;


