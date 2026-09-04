'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import {
  UNIDENTIFIED_GEAR_TIERS,
  getTierTheme,
  type UnidentifiedGearTier,
} from '@/components/salvage/salvage-config';

interface SalvageSectionNavProps {
  activeTier?: UnidentifiedGearTier;
}

export default function SalvageSectionNav({ activeTier }: SalvageSectionNavProps) {
  const { t } = useI18n();

  return (
    <nav
      className="overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/50 p-1 backdrop-blur-sm"
      aria-label={t('salvage.nav.unidentifiedGear', 'Unidentified Gear')}
    >
      <div className="grid grid-cols-3 gap-1">
        {UNIDENTIFIED_GEAR_TIERS.map((tier) => {
          const isActive = activeTier === tier.id;
          const theme = getTierTheme(tier.id);

          return (
            <Link
              key={tier.id}
              href={tier.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-semibold leading-tight transition-all duration-200 sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm ${
                isActive ? theme.tabActive : theme.tabInactive
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Image
                src={tier.gearIcon}
                alt=""
                width={22}
                height={22}
                className={`h-5 w-5 shrink-0 transition-opacity sm:h-[22px] sm:w-[22px] ${isActive ? 'opacity-100' : 'opacity-60'}`}
              />
              <span className="max-w-full truncate text-center">
                {t(tier.labelKey, tier.defaultLabel)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
