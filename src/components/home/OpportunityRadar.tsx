'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Radar, RefreshCw, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { formatGW2Currency } from '@/utils/gw2-currency';
import EctoRecycleCompareTable from '@/components/ectoplasm/EctoRecycleCompareTable';
import {
  RADAR_PRICE_IDS,
  buildRadarOpportunities,
  parseCommercePrices,
  type RadarOpportunity,
} from '@/lib/opportunity-radar';

const confidenceLabel: Record<RadarOpportunity['confidence'], { key: string; fallback: string; className: string }> = {
  high: { key: 'radar.confidence.high', fallback: 'High liquidity', className: 'text-emerald-400' },
  medium: { key: 'radar.confidence.medium', fallback: 'Medium liquidity', className: 'text-amber-400' },
  low: { key: 'radar.confidence.low', fallback: 'Low liquidity', className: 'text-zinc-500' },
};

const categoryLabel: Record<RadarOpportunity['category'], { key: string; fallback: string }> = {
  salvage: { key: 'radar.category.salvage', fallback: 'Salvage' },
  ecto: { key: 'radar.category.ecto', fallback: 'Ecto' },
};

function ProfitBadge({ copper }: { copper: number }) {
  const positive = copper > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
      <Icon className="h-3.5 w-3.5" />
      {positive ? '+' : '−'}
      {formatGW2Currency(Math.abs(copper))}
    </span>
  );
}

export default function OpportunityRadar() {
  const { t, lang } = useI18n();
  const [ops, setOps] = useState<RadarOpportunity[]>([]);
  const [icons, setIcons] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(false);
      const ids = RADAR_PRICE_IDS.join(',');
      const apiLang = lang === 'es' || lang === 'de' || lang === 'fr' ? lang : 'en';

      const [pricesRes, itemsRes] = await Promise.all([
        fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${ids}`),
        fetch(`https://api.guildwars2.com/v2/items?ids=${ids}&lang=${apiLang}`),
      ]);

      if (!pricesRes.ok) throw new Error('prices');
      const pricesJson = await pricesRes.json();
      const prices = parseCommercePrices(pricesJson);
      setOps(buildRadarOpportunities(prices));

      if (itemsRes.ok) {
        const items = await itemsRes.json();
        const iconMap: Record<number, string> = {};
        for (const item of items) iconMap[item.id] = item.icon;
        setIcons(iconMap);
      }
      setUpdatedAt(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh on lang only
  }, [lang]);

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <Radar className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white sm:text-xl">
              {t('radar.title', "Today's opportunity radar")}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {t(
                'radar.subtitle',
                'Live Trading Post plays — salvage, ecto and flips ranked by profit per unit.'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:shrink-0">
          {updatedAt && (
            <span className="text-xs text-zinc-500" suppressHydrationWarning>
              {t('radar.updated', 'Updated')}{' '}
              {updatedAt.toLocaleTimeString(lang === 'es' ? 'es' : lang, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-800/50 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-slate-700/50 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('radar.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {t('radar.error', 'Could not load Trading Post prices. Try again.')}
        </p>
      )}

      <EctoRecycleCompareTable href="/ectoplasm" className="mb-4" />

      <Link
        href="/buyout"
        className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 transition-colors hover:bg-cyan-500/15"
      >
        <div className="flex items-center gap-3">
          <Calculator className="h-5 w-5 text-cyan-300" />
          <div>
            <p className="text-sm font-semibold text-white">
              {t('pageTitles.buyout', 'Buyout Calculator')}
            </p>
            <p className="text-xs text-zinc-400">
              {t('radar.buyout.cta', 'Walk real sell orders — budget, % supply, quantity')}
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-cyan-300">{t('radar.buyout.open', 'Open')} →</span>
      </Link>

      {loading && ops.length === 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-slate-600/40 bg-slate-800/40"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ops.map((op, index) => {
            const conf = confidenceLabel[op.confidence];
            const cat = categoryLabel[op.category];
            return (
              <Link
                key={op.id}
                href={op.href}
                className="group rounded-xl border border-slate-600/50 bg-slate-800/50 p-4 backdrop-blur-sm transition-colors hover:border-slate-500/60 hover:bg-slate-700/40"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900/60 text-xs font-bold text-zinc-500">
                      {index + 1}
                    </span>
                    {icons[op.iconId] ? (
                      <Image
                        src={icons[op.iconId]}
                        alt=""
                        width={36}
                        height={36}
                        className="rounded border border-slate-600/50"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded border border-slate-600/50 bg-slate-700/50" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white group-hover:text-emerald-100">
                        {t(op.titleKey, op.titleFallback)}
                      </p>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        {t(cat.key, cat.fallback)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {t('radar.profitPerUnit', 'Profit / unit')}
                    </p>
                    <ProfitBadge copper={op.profitCopper} />
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${conf.className}`}>
                      {t(conf.key, conf.fallback)}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {op.marginPct >= 0 ? '+' : ''}
                      {op.marginPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-xs text-zinc-600">
        {t(
          'radar.disclaimer',
          'Estimates from live TP prices (15% listing fee). Not financial advice — always check volume before buying.'
        )}
      </p>
    </section>
  );
}
