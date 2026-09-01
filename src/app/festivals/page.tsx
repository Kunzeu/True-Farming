'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  Star,
  Coins,
  Clock,
  TrendingUp,
  Info
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { festivalDates, getFestivalStatus, getFormattedDateRange } from '@/lib/festival-dates';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

const getFestivals = (t: (key: string) => string) => [
  {
    id: 'lunar',
    nameKey: 'festivals.names.lunar',
    descriptionKey: 'festivals.descriptions.lunar',
    icon: '/images/festivals/Lunar_New_Year.webp',
    background: '/images/backgrounds/Lunar%20New%20Year.webp',
    color: 'from-red-900 to-red-500',
    status: getFestivalStatus(festivalDates.lunarNewYear.startDate, festivalDates.lunarNewYear.endDate, festivalDates.lunarNewYear.startTime, festivalDates.lunarNewYear.endTime, festivalDates.lunarNewYear.timezone),
    startDate: getFormattedDateRange(festivalDates.lunarNewYear.startDate, festivalDates.lunarNewYear.endDate, t),
    endDate: '', // No se usa por separado, se usa el rango completo
    features: [
      'festivals.features.lunar.luckyEnvelopes',
      'festivals.features.lunar.essenceLuck',
      'festivals.features.lunar.dragonBall',
      'festivals.features.lunar.fireworks'
    ],
    estimatedGoldPerHour: 18,
    difficultyKey: 'festivals.difficulty.easy',
    timeRequiredKey: 'festivals.timeRequired.short',
    path: '/festivals/lunar-new-year'
  },
  {
    id: 'dragon-bash',
    nameKey: 'festivals.names.dragonBash',
    descriptionKey: 'festivals.descriptions.dragonBash',
    icon: '/images/festivals/Dragon_Bash.webp',
    background: '/images/backgrounds/Dragonbash.webp',
    color: 'from-purple-500 to-pink-600',
    status: getFestivalStatus(festivalDates.dragonBash.startDate, festivalDates.dragonBash.endDate, festivalDates.dragonBash.startTime, festivalDates.dragonBash.endTime, festivalDates.dragonBash.timezone),
    startDate: getFormattedDateRange(festivalDates.dragonBash.startDate, festivalDates.dragonBash.endDate, t),
    endDate: '', // No se usa por separado, se usa el rango completo
    features: [
      'festivals.features.dragonBash.holographic',
      'festivals.features.dragonBash.racing',
      'festivals.features.dragonBash.tokens',
      'festivals.features.dragonBash.rewards'
    ],
    estimatedGoldPerHour: 12,
    difficultyKey: 'festivals.difficulty.easy',
    timeRequiredKey: 'festivals.timeRequired.short',
    path: '/festivals/dragon-bash'
  },
  {
    id: 'four-winds',
    nameKey: 'festivals.names.fourWinds',
    descriptionKey: 'festivals.descriptions.fourWinds',
    icon: '/images/festivals/Four_Winds.webp',
    background: '/images/backgrounds/Fourwinds.webp',
    color: 'from-green-500 to-blue-600',
    status: getFestivalStatus(festivalDates.fourWinds.startDate, festivalDates.fourWinds.endDate, festivalDates.fourWinds.startTime, festivalDates.fourWinds.endTime, festivalDates.fourWinds.timezone),
    startDate: getFormattedDateRange(festivalDates.fourWinds.startDate, festivalDates.fourWinds.endDate, t),
    endDate: '', // No se usa por separado, se usa el rango completo
    features: [
      'festivals.features.fourWinds.mountRaces',
      'festivals.features.fourWinds.bossBlitz',
      'festivals.features.fourWinds.gauntlet',
      'festivals.features.fourWinds.scavenger'
    ],
    estimatedGoldPerHour: 10,
    difficultyKey: 'festivals.difficulty.medium',
    timeRequiredKey: 'festivals.timeRequired.medium',
    path: '/festivals/four-winds'
  },
  {
    id: 'halloween',
    nameKey: 'festivals.names.halloween',
    descriptionKey: 'festivals.descriptions.halloween',
    icon: '/images/festivals/Shadow_of_the_Mad_King.webp',
    background: '/images/backgrounds/Halloween.webp',
    color: 'from-orange-500 to-red-600',
    status: getFestivalStatus(festivalDates.halloween.startDate, festivalDates.halloween.endDate, festivalDates.halloween.startTime, festivalDates.halloween.endTime, festivalDates.halloween.timezone),
    startDate: getFormattedDateRange(festivalDates.halloween.startDate, festivalDates.halloween.endDate, t),
    endDate: '', // No se usa por separado, se usa el rango completo
    features: [
      'festivals.features.halloween.bags',
      'festivals.features.halloween.corn',
      'festivals.features.halloween.labyrinth',
      'festivals.features.halloween.tower'
    ],
    estimatedGoldPerHour: 15,
    difficultyKey: 'festivals.difficulty.easy',
    timeRequiredKey: 'festivals.timeRequired.short',
    path: '/festivals/halloween'
  },
  {
    id: 'wintersday',
    nameKey: 'festivals.names.wintersday',
    descriptionKey: 'festivals.descriptions.wintersday',
    icon: '/images/festivals/Wintersday.webp',
    background: '/images/backgrounds/wintersday.webp',
    color: 'from-blue-500 to-cyan-600',
    status: getFestivalStatus(festivalDates.wintersday.startDate, festivalDates.wintersday.endDate, festivalDates.wintersday.startTime, festivalDates.wintersday.endTime, festivalDates.wintersday.timezone),
    startDate: getFormattedDateRange(festivalDates.wintersday.startDate, festivalDates.wintersday.endDate, t),
    endDate: '', // No se usa por separado, se usa el rango completo
    features: [
      'festivals.features.wintersday.gifts',
      'festivals.features.wintersday.wonderland',
      'festivals.features.wintersday.choir',
      'festivals.features.wintersday.toypocalypse'
    ],
    estimatedGoldPerHour: 20,
    difficultyKey: 'festivals.difficulty.easy',
    timeRequiredKey: 'festivals.timeRequired.short',
    path: '/festivals/wintersday'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-600 text-white';
    case 'upcoming':
      return 'bg-blue-600 text-white';
    case 'ended':
      return 'bg-gray-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

export default function FestivalsPage() {
  usePageTitle('pageTitles.festivals', 'Festivals');
  const { t } = useI18n();
  const festivals = getFestivals(t);
  return (
    <>
      <div className="min-h-screen tf-site-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 mr-3 text-purple-400" />
              {t('festivals.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('festivals.description')}
            </p>
          </motion.div>

          {/* Festivals Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {festivals.map((festival, index) => (
              <motion.div
                key={festival.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="group">
                <Link href={festival.path}>
                  <div
                    className="relative overflow-hidden rounded-lg p-6 hover:border-purple-500 transition-all duration-300 hover:transform hover:scale-105 flex flex-col h-full shadow-2xl hover:shadow-purple-500/20 border border-gray-700"
                    style={{
                      backgroundImage: `url(${festival.background || festival.icon})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {/* Overlay para mejorar legibilidad */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${festival.color} rounded-lg flex items-center justify-center text-2xl overflow-hidden shadow-lg border border-white/20`}>
                          {festival.icon.startsWith('/') ? (
                            <Image
                              src={festival.icon}
                              alt={t(festival.nameKey)}
                              width={64}
                              height={64}
                              className="w-12 h-12 object-contain"
                            />
                          ) : (
                            festival.icon
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(festival.status)}`}>
                          {t(`status.${festival.status}`)}
                        </span>
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors">
                        {t(festival.nameKey)}
                      </h3>

                      {/* Dates */}
                      <div className="flex items-center gap-2 mb-6">
                        <Clock className="w-4 h-4 text-gray-300" />
                        <span className="text-gray-200 text-sm">
                          {festival.startDate}
                        </span>
                      </div>

                      {/* CTA */}
                      <div className="mt-auto">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-300 text-sm font-semibold">
                            {t('cta.viewCalculator')}
                          </span>
                          <TrendingUp className="w-4 h-4 text-purple-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Información General */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 space-y-6">
            {/* What are Festivals? */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg p-5">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Info className="w-6 h-6 mr-3 text-blue-400" />
                {t('festivals.info.title')}
              </h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {t('festivals.info.description')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <h3 className="text-white font-semibold mb-2">{t('festivals.info.activities.title')}</h3>
                  <p className="text-gray-300 text-sm">
                    {t('festivals.info.activities.description')}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <h3 className="text-white font-semibold mb-2">{t('festivals.info.exclusiveItems.title')}</h3>
                  <p className="text-gray-300 text-sm">
                    {t('festivals.info.exclusiveItems.description')}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <h3 className="text-white font-semibold mb-2">{t('festivals.info.tempRewards.title')}</h3>
                  <p className="text-gray-300 text-sm">
                    {t('festivals.info.tempRewards.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Estrategias de Farming */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg p-5">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-green-400" />
                {t('festivals.farming.title')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">{t('festivals.farming.during.title')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-white font-semibold">{t('festivals.farming.during.participate.title')}</h4>
                        <p className="text-gray-300 text-sm">{t('festivals.farming.during.participate.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-white font-semibold">{t('festivals.farming.during.intensive.title')}</h4>
                        <p className="text-gray-300 text-sm">{t('festivals.farming.during.intensive.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">{t('festivals.farming.after.title')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-white font-semibold">{t('festivals.farming.after.selling.title')}</h4>
                        <p className="text-gray-300 text-sm">{t('festivals.farming.after.selling.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-white font-semibold">{t('festivals.farming.after.analysis.title')}</h4>
                        <p className="text-gray-300 text-sm">{t('festivals.farming.after.analysis.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Earn Gold in Festivals */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg p-5">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Coins className="w-6 h-6 mr-3 text-yellow-400" />
                {t('festivals.goldEarning.title')}
              </h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {t('festivals.goldEarning.description')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">{t('festivals.goldEarning.main.title')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-white font-semibold">{t('festivals.goldEarning.main.activity.title')}</h4>
                        <p className="text-gray-300 text-sm">{t('festivals.goldEarning.main.activity.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-white font-semibold">{t('festivals.goldEarning.main.containers.title')}</h4>
                        <p className="text-gray-300 text-sm">{t('festivals.goldEarning.main.containers.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-white font-semibold">{t('festivals.goldEarning.main.materials.title')}</h4>
                        <p className="text-gray-300 text-sm">{t('festivals.goldEarning.main.materials.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">{t('festivals.goldEarning.advanced.title')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-white font-semibold">{t('festivals.goldEarning.advanced.storage.title')}</h4>
                        <p className="text-gray-300 text-sm">{t('festivals.goldEarning.advanced.storage.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-white font-semibold">{t('festivals.goldEarning.advanced.multiChar.title')}</h4>
                        <p className="text-gray-300 text-sm">{t('festivals.goldEarning.advanced.multiChar.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                <h4 className="text-yellow-300 font-semibold mb-2">{t('festivals.goldEarning.proTip.title')}</h4>
                <p className="text-gray-300 text-sm">
                  {t('festivals.goldEarning.proTip.description')}
                </p>
              </div>
            </div>

            {/* Consejos Generales */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-5 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Star className="w-6 h-6 mr-3 text-yellow-400" />
                {t('festivals.tips.title')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-semibold">{t('festivals.tips.planning.title')}</h4>
                      <p className="text-gray-300 text-sm">{t('festivals.tips.planning.description')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-semibold">{t('festivals.tips.diversification.title')}</h4>
                      <p className="text-gray-300 text-sm">{t('festivals.tips.diversification.description')}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-semibold">{t('festivals.tips.community.title')}</h4>
                      <p className="text-gray-300 text-sm">{t('festivals.tips.community.description')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-white font-semibold">{t('festivals.tips.enjoy.title')}</h4>
                      <p className="text-gray-300 text-sm">{t('festivals.tips.enjoy.description')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
} 