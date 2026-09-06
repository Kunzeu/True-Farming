'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import SalvagePageShell from '@/components/salvage/SalvagePageShell';
import SalvageInfoNote from '@/components/salvage/SalvageInfoNote';
import ResearchNotesTable from '@/components/salvage/research-notes/ResearchNotesTable';
import SalvageCurrency from '@/components/salvage/SalvageCurrency';
import WikiItemLink from '@/components/ui/WikiItemLink';
import {
  getPricePerNoteCopper,
  type ResearchNotesCraftingItem,
  type ResearchNotesItemMeta,
  type ResearchNotesSortField,
} from '@/components/salvage/research-notes/research-notes-utils';

interface ResearchNotesPageLayoutProps {
  items: ResearchNotesCraftingItem[];
  itemMeta: Record<number, ResearchNotesItemMeta>;
  loading: boolean;
  error: string | null;
  sortField: ResearchNotesSortField;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: ResearchNotesSortField) => void;
  craftingPriceSide: 'buy' | 'sell';
  onCraftingPriceSideChange: (side: 'buy' | 'sell') => void;
}

export default function ResearchNotesPageLayout({
  items,
  itemMeta,
  loading,
  error,
  sortField,
  sortOrder,
  onSortChange,
  craftingPriceSide,
  onCraftingPriceSideChange,
}: ResearchNotesPageLayoutProps) {
  const { t } = useI18n();

  const bestItem = items.reduce<{
    item: ResearchNotesCraftingItem;
    pricePerNote: number;
  } | null>((best, item) => {
    const pricePerNote = getPricePerNoteCopper(item);
    if (pricePerNote === null || pricePerNote <= 0) return best;
    if (!best || pricePerNote < best.pricePerNote) {
      return { item, pricePerNote };
    }
    return best;
  }, null);

  return (
    <>
      {error && (
        <div className="border-b border-amber-500/30 bg-amber-950/40 px-4 py-3">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="text-sm text-amber-200">
              <strong>{t('researchNotesPage.offlineMode', 'Offline mode')}:</strong>{' '}
              {t(
                'researchNotesPage.offlineDesc',
                'Showing fallback data. The GW2 API is temporarily unavailable.'
              )}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 text-sm text-amber-300 underline hover:text-amber-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t('researchNotesPage.retry', 'Retry')}
            </button>
          </div>
        </div>
      )}

      <SalvagePageShell>
        <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
          <Link
            href="/salvage"
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-800/50 px-3.5 py-2 text-sm text-gray-300 transition-colors hover:bg-slate-700/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('researchNotesPage.backToSalvaging')}
          </Link>

          <header className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
              <FileText className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {t('researchNotesPage.title')}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                {t('researchNotesPage.subtitle')}
              </p>
            </div>
          </header>

          <div className="mb-6">
            <SalvageInfoNote content={t('researchNotesPage.tip7')} />
          </div>

          <div className="mb-6 rounded-xl border border-slate-600/50 bg-slate-800/50 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
                  {t('researchNotesPage.craftingCostSource', 'Crafting cost source')}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {t(
                    'researchNotesPage.table.useBuyPrices',
                    'Use buy or sell prices for material costs'
                  )}
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[220px]">
                <button
                  type="button"
                  onClick={() => onCraftingPriceSideChange('buy')}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    craftingPriceSide === 'buy'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700 hover:text-gray-200'
                  }`}
                >
                  {t('researchNotesPage.table.buy')}
                </button>
                <button
                  type="button"
                  onClick={() => onCraftingPriceSideChange('sell')}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    craftingPriceSide === 'sell'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700 hover:text-gray-200'
                  }`}
                >
                  {t('researchNotesPage.table.sell')}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {bestItem && !loading && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-5 py-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-400/80">
                  {t('researchNotesPage.bestPricePerNote', 'Best price per note')}
                </p>
                <p className="mt-3 text-base font-medium leading-snug text-white">
                  <WikiItemLink
                    name={bestItem.item.name}
                    itemId={bestItem.item.id}
                    className="hover:underline"
                  >
                    {bestItem.item.name}
                  </WikiItemLink>
                </p>
                <div className="mt-3 border-t border-emerald-500/20 pt-3">
                  <SalvageCurrency copper={bestItem.pricePerNote} size="lg" />
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-slate-600/50 px-5 py-4">
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-300">
                  {t('researchNotesPage.craftingDisciplines')}
                </h2>
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                    {t('researchNotesPage.loading')}
                  </div>
                )}
              </div>

              <ResearchNotesTable
                items={items}
                itemMeta={itemMeta}
                sortField={sortField}
                sortOrder={sortOrder}
                onSortChange={onSortChange}
              />
            </div>
          </div>
        </div>
      </SalvagePageShell>
    </>
  );
}
