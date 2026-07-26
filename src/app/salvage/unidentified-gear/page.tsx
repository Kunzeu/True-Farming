'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Wrench } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SalvagePageShell from '@/components/salvage/SalvagePageShell';
import {
  UNIDENTIFIED_GEAR_TIERS,
  getTierTheme,
} from '@/components/salvage/salvage-config';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

export default function UnidentifiedGearPage() {
  usePageTitle('salvagePage.unidentifiedGear', 'Unidentified Gear');
  const { t } = useI18n();

  return (
    <>
      <SalvagePageShell>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Link
            href="/salvage"
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-800/50 px-3.5 py-2 text-sm text-gray-300 transition-colors hover:bg-slate-700/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('salvageCommon.backToSalvaging', 'Back to Salvaging')}
          </Link>

          <header className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10">
              <Wrench className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {t('salvagePage.unidentifiedGear', 'Unidentified Gear')}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                {t(
                  'salvageUnidentifiedGear.subtitle',
                  'Choose a rarity to calculate profitability when opening and salvaging unidentified gear.'
                )}
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {UNIDENTIFIED_GEAR_TIERS.map((tier, index) => {
              const theme = getTierTheme(tier.id);
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Link href={tier.href} className="group block h-full">
                    <div
                      className={`h-full rounded-xl border bg-slate-800/50 p-5 backdrop-blur-sm transition-all duration-200 hover:bg-slate-700/50 ${theme.border}`}
                    >
                      <Image
                        src={tier.gearIcon}
                        alt=""
                        width={40}
                        height={40}
                        className="mb-4 h-10 w-10"
                      />
                      <h2 className="font-bold text-white">
                        {t(tier.labelKey, tier.defaultLabel)}
                      </h2>
                      <p className="mt-1 text-sm text-gray-400">
                        {t(`salvageUnidentifiedGear.${tier.id}Desc`, `${tier.defaultLabel} calculator`)}
                      </p>
                      <div
                        className={`mt-4 flex items-center gap-1 text-sm font-medium ${theme.accent} group-hover:gap-2 transition-all`}
                      >
                        {t('salvagePage.explore', 'Explore')}
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </SalvagePageShell>
    </>
  );
}
