'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Minus, RefreshCw, Sparkles } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import SalvagePageShell from '@/components/salvage/SalvagePageShell';
import SalvageSectionNav from '@/components/salvage/SalvageSectionNav';
import SalvageInfoNote from '@/components/salvage/SalvageInfoNote';
import SalvageSummaryCards from '@/components/salvage/SalvageSummaryCards';
import SalvageMaterialsTable, {
  type SalvageTableResult,
} from '@/components/salvage/SalvageMaterialsTable';
import SalvageCurrency from '@/components/salvage/SalvageCurrency';
import {
  UNIDENTIFIED_GEAR_TIERS,
  getTierTheme,
  type UnidentifiedGearTier,
} from '@/components/salvage/salvage-config';
import type { LuckMode, SalvageRoi } from '@/lib/unidentified-salvage';

interface SalvageGearPageLayoutProps {
  tier: UnidentifiedGearTier;
  note: string;
  titleFallback: string;
  description: string;
  wikiUrl: string;
  wikiFallback: string;
  gearName: string | null;
  kitName: string | null;
  kitTitleFallback: string;
  kitDescription: string;
  profitabilityLabel: string;
  profitabilityClassName: string;
  quantityLabel: string;
  costGearLabel: string;
  kitCost: number;
  quantity: number;
  onQuantityChange: (value: number) => void;
  onRefreshPrices: () => void;
  lastUpdated: Date | null;
  totalMaterialsValue: number;
  totalCost: number;
  totalKitCost: number;
  totalProfit: number;
  unidentifiedGearPrice: number | null;
  gearCostFromSell?: boolean;
  results: SalvageTableResult[];
  refreshButtonClass?: string;
  rois?: SalvageRoi[];
  luckMode?: LuckMode;
  onLuckModeChange?: (mode: LuckMode) => void;
}

export default function SalvageGearPageLayout({
  tier,
  note,
  titleFallback,
  description,
  wikiUrl,
  wikiFallback,
  gearName,
  kitName,
  kitTitleFallback,
  kitDescription,
  profitabilityLabel,
  quantityLabel,
  costGearLabel,
  kitCost,
  quantity,
  onQuantityChange,
  onRefreshPrices,
  lastUpdated,
  totalMaterialsValue,
  totalCost,
  totalKitCost,
  totalProfit,
  unidentifiedGearPrice,
  gearCostFromSell = false,
  results,
  rois,
  luckMode,
  onLuckModeChange,
}: SalvageGearPageLayoutProps) {
  const { t } = useI18n();
  const tierConfig = UNIDENTIFIED_GEAR_TIERS.find((item) => item.id === tier)!;
  const theme = getTierTheme(tier);

  return (
    <SalvagePageShell>
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <Link
            href="/salvage/unidentified-gear"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('salvageUnidentifiedGear.back', 'Back to Unidentified Gear')}
          </Link>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="hidden items-center gap-1.5 text-xs text-zinc-600 sm:inline-flex">
                <RefreshCw className="h-3 w-3" />
                {t('salvagePages.lastUpdated', 'Last updated: {time}').replace(
                  '{time}',
                  lastUpdated.toLocaleTimeString()
                )}
              </span>
            )}
            <a
              href={wikiUrl || wikiFallback}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <BookOpen className="h-4 w-4" />
              {t('salvagePages.viewWiki', 'View Wiki')}
            </a>
          </div>
        </div>

        <SalvageSectionNav activeTier={tier} />

        <div className="mt-5 space-y-4">
          <SalvageInfoNote content={note} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <header className="flex items-start gap-4">
                <a
                  href={wikiUrl || wikiFallback}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`relative shrink-0 rounded-2xl border p-3 transition-opacity hover:opacity-80 ${theme.border} bg-white/[0.03]`}
                  title={gearName || titleFallback}
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br opacity-20 ${theme.gradient}`} />
                  <Image
                    src={tierConfig.headerIcon}
                    alt=""
                    width={48}
                    height={48}
                    className="relative h-12 w-12"
                  />
                </a>
                <div className="min-w-0 pt-1">
                  <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${theme.accentMuted}`}>
                    {t('salvage.nav.unidentifiedGear', 'Unidentified Gear')}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    <a
                      href={wikiUrl || wikiFallback}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline decoration-white/30 underline-offset-4"
                    >
                      {gearName || titleFallback}
                    </a>
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                    {description}
                  </p>
                </div>
              </header>

              <SalvageSummaryCards
                tier={tier}
                totalMaterialsValue={totalMaterialsValue}
                totalCost={totalCost}
                totalKitCost={totalKitCost}
                totalProfit={totalProfit}
                quantity={quantity}
                costGearLabel={costGearLabel}
                unidentifiedGearPrice={unidentifiedGearPrice}
                gearCostFromSell={gearCostFromSell}
                rois={rois}
                luckMode={luckMode}
                onLuckModeChange={onLuckModeChange}
              />

              <SalvageMaterialsTable results={results} quantity={quantity} />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-xl border border-slate-600/50 bg-slate-800/50 p-5 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                  {t('salvage.controls.title', 'Calculator')}
                </p>

                <label className="mt-4 block">
                  <span className="mb-2 block text-xs font-medium text-zinc-400">
                    {quantityLabel}
                  </span>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => onQuantityChange(Number(e.target.value))}
                    className={`w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-lg font-bold text-white outline-none transition-shadow focus:ring-2 ${theme.ring}`}
                    min="1"
                    max="10000"
                  />
                </label>

                <button
                  type="button"
                  onClick={onRefreshPrices}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors ${theme.button} ${theme.buttonHover}`}
                >
                  <RefreshCw className="h-4 w-4" />
                  {t('salvagePages.updatePrices', 'Update Prices')}
                </button>

                {lastUpdated && (
                  <p className="mt-3 text-center text-xs text-zinc-600 sm:hidden">
                    {t('salvagePages.lastUpdated', 'Last updated: {time}').replace(
                      '{time}',
                      lastUpdated.toLocaleTimeString()
                    )}
                  </p>
                )}
              </div>

              <div className={`rounded-xl border p-5 ${theme.border} bg-slate-800/50 backdrop-blur-sm`}>
                <div className="flex items-center gap-3">
                  <Image
                    src={tierConfig.kitIcon}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {kitName || kitTitleFallback}
                    </p>
                    <p className="text-xs text-zinc-500">{kitDescription}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">{t('salvagePages.costPerUse', 'Cost per use')}</span>
                    <SalvageCurrency copper={kitCost} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">{t('salvagePages.dropRates', 'Drop rates')}</span>
                    <span className="font-medium text-zinc-300">{t('salvagePages.estimated', 'Estimated')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">{t('salvagePages.profitability', 'Profitability')}</span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${theme.accent}`}>
                      <Sparkles className="h-3.5 w-3.5" />
                      {profitabilityLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-600/50 bg-slate-800/40 p-4 backdrop-blur-sm">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
                  {t('salvage.summary.quickBreakdown', 'Quick breakdown')}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Minus className="h-3 w-3 text-emerald-500/60 rotate-90" />
                      {t('salvagePages.totalMaterialsValue', 'Materials')}
                    </span>
                    <SalvageCurrency copper={totalMaterialsValue} size="sm" className="!text-sm" />
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Minus className="h-3 w-3 text-rose-500/60" />
                      {t('salvage.summary.gear', 'Gear cost')}
                    </span>
                    {unidentifiedGearPrice != null ? (
                      <SalvageCurrency copper={totalCost} size="sm" className="!text-sm" />
                    ) : (
                      <span className="text-xs text-zinc-600">…</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Minus className="h-3 w-3 text-orange-500/60" />
                      {t('salvagePages.kitCost', 'Kit')}
                    </span>
                    <SalvageCurrency copper={totalKitCost} size="sm" className="!text-sm" />
                  </div>
                  <div className="border-t border-white/[0.06] pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-300">
                        {t('salvagePages.totalProfit', 'Beneficio')}
                      </span>
                      <SalvageCurrency
                        copper={totalProfit}
                        size="sm"
                        signed
                        className={totalProfit >= 0 ? theme.profitPositive : theme.profitNegative}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </SalvagePageShell>
  );
}
