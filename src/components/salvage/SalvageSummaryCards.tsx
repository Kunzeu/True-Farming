'use client';

import { ExternalLink, Minus, Package, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import SalvageCurrency from '@/components/salvage/SalvageCurrency';
import { getTierTheme, type UnidentifiedGearTier } from '@/components/salvage/salvage-config';
import { useAuth } from '@/contexts/AuthContext';
import { hasExclusiveAccess } from '@/lib/patreon-benefits';
import { useEffect, useState } from 'react';
import type { LuckMode, SalvageRoi } from '@/lib/unidentified-salvage';

interface SalvageSummaryCardsProps {
  tier: UnidentifiedGearTier;
  totalMaterialsValue: number;
  totalCost: number;
  totalKitCost: number;
  totalProfit: number;
  quantity: number;
  costGearLabel: string;
  unidentifiedGearPrice: number | null;
  gearCostFromSell?: boolean;
  rois?: SalvageRoi[];
  luckMode?: LuckMode;
  onLuckModeChange?: (mode: LuckMode) => void;
}

const MODE_LABEL: Record<LuckMode, { key: string; fallback: string }> = {
  none: { key: 'salvage.roi.none', fallback: 'Sin suerte' },
  bags: { key: 'salvage.roi.bags', fallback: 'Usando la suerte' },
};

const RED_BAGS_HREF = '/festivals/lunar-new-year#Box-Opening';

export default function SalvageSummaryCards({
  tier,
  totalMaterialsValue,
  totalCost,
  totalKitCost,
  totalProfit,
  quantity,
  costGearLabel,
  unidentifiedGearPrice,
  gearCostFromSell = false,
  rois = [],
  luckMode = 'none',
  onLuckModeChange,
}: SalvageSummaryCardsProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [profitAlert, setProfitAlert] = useState(false);
  const theme = getTierTheme(tier);

  useEffect(() => {
    if (!hasExclusiveAccess(user)) return;
    const key = `tf_salvage_profit_${tier}`;
    try {
      const prev = Number(localStorage.getItem(key));
      setProfitAlert(Number.isFinite(prev) && prev > 0 && totalProfit < 0);
      localStorage.setItem(key, String(totalProfit));
    } catch {
      /* ignore */
    }
  }, [user, tier, totalProfit]);
  const profitPositive = totalProfit >= 0;
  const ProfitIcon = profitPositive ? TrendingUp : TrendingDown;
  const activeRoi = rois.find((r) => r.mode === luckMode);

  const gearSub =
    unidentifiedGearPrice == null
      ? t('salvageCommon.loadingPrice', 'Loading price...')
      : unidentifiedGearPrice <= 0
        ? t('salvagePages.noBuyOrders', 'Sin buy en el TP')
        : gearCostFromSell
          ? t('salvagePages.eachSellTP', 'cada uno (sell TP)')
          : t('salvagePages.eachTP', 'each (TP)');

  const breakdown = [
    {
      label: t('salvagePages.totalMaterialsValue', 'Total Materials Value'),
      value: totalMaterialsValue,
      icon: Plus,
      tone: 'text-emerald-400/80',
    },
    {
      label: costGearLabel.replace('{quantity}', quantity.toString()),
      value: unidentifiedGearPrice != null ? totalCost : null,
      sub: gearSub,
      icon: Minus,
      tone: 'text-rose-400/80',
    },
    {
      label: t('salvagePages.kitCost', 'Kit Cost'),
      value: totalKitCost,
      icon: Minus,
      tone: 'text-orange-400/80',
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm">
      <div className="border-b border-slate-600/50 px-4 py-5 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              {t('salvagePages.totalProfit', 'Beneficio')}
              {activeRoi && (
                <span className="ml-2 font-semibold normal-case tracking-normal text-zinc-400">
                  · {t(MODE_LABEL[luckMode].key, MODE_LABEL[luckMode].fallback)}
                </span>
              )}
            </p>
            <div className={`mt-2 flex items-center gap-3 ${profitPositive ? theme.profitPositive : theme.profitNegative}`}>
              <ProfitIcon className="h-7 w-7 shrink-0 opacity-80" />
              <SalvageCurrency copper={totalProfit} size="xl" signed />
            </div>
            {activeRoi && (
              <p className="mt-2 font-mono text-sm tabular-nums text-zinc-400">
                ROI {(activeRoi.roi * 100).toFixed(1)}%
              </p>
            )}
            {profitAlert && (
              <p className="mt-2 text-sm text-amber-300">
                {t('salvage.profit.turnedNegative', 'This salvage is no longer profitable vs your last visit.')}
              </p>
            )}
          </div>
          <div className={`self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${theme.border} ${theme.accent} bg-white/[0.03]`}>
            {profitPositive
              ? t('salvage.profit.positive', 'Profitable')
              : t('salvage.profit.negative', 'Loss')}
          </div>
        </div>

        {rois.length > 1 && onLuckModeChange && (
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {rois.map((roi) => {
              const active = roi.mode === luckMode;
              const label = MODE_LABEL[roi.mode];
              return (
                <button
                  key={roi.mode}
                  type="button"
                  onClick={() => onLuckModeChange(roi.mode)}
                  className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                    active
                      ? `${theme.borderActive} bg-white/[0.06]`
                      : 'border-white/[0.06] bg-black/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${active ? theme.accent : 'text-zinc-500'}`}>
                    {roi.mode === 'bags' ? (
                      <Link
                        href={RED_BAGS_HREF}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 hover:underline"
                        title={t('salvage.roi.bagsWiki', 'Bolsas rojas')}
                      >
                        {t(label.key, label.fallback)}
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </Link>
                    ) : (
                      t(label.key, label.fallback)
                    )}
                  </p>
                  <div className="mt-1">
                    <SalvageCurrency
                      copper={roi.profit}
                      size="sm"
                      signed
                      className={roi.profit >= 0 ? theme.profitPositive : theme.profitNegative}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[11px] tabular-nums text-zinc-500">
                    ROI {(roi.roi * 100).toFixed(1)}%
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid divide-y divide-slate-600/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {breakdown.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="px-5 py-4">
              <div className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider ${item.tone}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="leading-tight">{item.label}</span>
              </div>
              {item.value !== null ? (
                <SalvageCurrency copper={item.value} size="lg" />
              ) : (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Package className="h-4 w-4 animate-pulse" />
                  {item.sub}
                </div>
              )}
              {item.value !== null && item.sub && (
                <p className="mt-1 text-xs text-zinc-600">{item.sub}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
