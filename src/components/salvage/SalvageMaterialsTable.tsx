'use client';

import Image from 'next/image';
import { useI18n } from '@/contexts/I18nContext';
import SalvageCurrency from '@/components/salvage/SalvageCurrency';
import { getMaterialRowClass } from '@/components/salvage/salvage-config';
import { gw2WikiUrl } from '@/lib/gw2-wiki';import { Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasExclusiveAccess } from '@/lib/patreon-benefits';

export interface SalvageTableMaterial {
  id: number;
  name: string;
  icon: string;
  dropRate: number;
  sellPrice: number;
  processedPrice: number;
}

export interface SalvageTableResult {
  material: SalvageTableMaterial;
  quantity: number;
  totalValue: number;
}

interface SalvageMaterialsTableProps {
  results: SalvageTableResult[];
  quantity: number;
}

const SYNTH_WIKI: Record<number, string> = {
  [-1]: 'Exotic',
  [-2]: 'Reclaimed Metal Plate',
};

export default function SalvageMaterialsTable({
  results,
  quantity,
}: SalvageMaterialsTableProps) {
  const { t, lang } = useI18n();
  const { user } = useAuth();

  const handleExportCsv = () => {
    const rows = [
      ['Material', 'Drop Rate', 'Sell Price', 'Processed Price', 'Quantity', 'Total Value'].join(','),
      ...results.map((r) =>
        [
          `"${r.material.name.replace(/"/g, '""')}"`,
          r.material.dropRate.toFixed(4),
          r.material.sellPrice,
          r.material.processedPrice,
          Math.round(r.quantity),
          r.totalValue,
        ].join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'salvage-materials.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-600/50 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-300">
            {t('salvage.table.materialsBreakdown', 'Materials breakdown')}
          </h2>
          {hasExclusiveAccess(user) && results.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 p-1 text-emerald-100 hover:bg-emerald-500/20 transition-colors"
              title={t('search.exportCsv', 'Export CSV')}
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
        <span className="rounded-full bg-slate-700/50 px-2.5 py-1 text-xs text-gray-400">
          ×{quantity}
        </span>
      </div>

      <div className="divide-y divide-slate-600/30 md:hidden">
        {results.map((result) => {
          const { id, name, icon } = result.material;
          const wikiName = id > 0 ? name : SYNTH_WIKI[id] || name;
          const href = gw2WikiUrl(wikiName, lang, {
            itemId: id > 0 ? id : undefined,
            englishName: id > 0 ? undefined : wikiName,
          });

          return (
            <div key={id} className={`border-l-2 px-4 py-3 ${getMaterialRowClass(id)}`}>
              <div className="flex items-center gap-3">
                {icon ? (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/30 ring-1 ring-white/[0.06]">
                    <Image src={icon} alt="" width={28} height={28} className="h-7 w-7" />
                  </div>
                ) : (
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-white/[0.04]" />
                )}
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-sm font-medium text-white"
                >
                  {name}
                </a>
                <SalvageCurrency copper={result.totalValue} size="sm" />
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-500">
                <div className="flex justify-between gap-2">
                  <dt>{t('salvage.table.quantity', 'Quantity')}</dt>
                  <dd className="font-mono text-zinc-300">{Math.round(result.quantity)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>{t('salvage.table.matPerUnit', 'Mat per Unit')}</dt>
                  <dd className="font-mono text-zinc-400">{result.material.dropRate.toFixed(4)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>{t('salvage.table.sellPrice', 'Sell Price')}</dt>
                  <dd><SalvageCurrency copper={result.material.sellPrice} size="sm" className="!text-xs !font-semibold !text-zinc-400" /></dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>{t('salvage.table.processedPrice', 'Processed')}</dt>
                  <dd><SalvageCurrency copper={result.material.processedPrice} size="sm" className="!text-xs !font-semibold" /></dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-600/50 bg-slate-800/80 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-gray-300">
              <th className="px-5 py-3">{t('salvage.table.material', 'Material')}</th>
              <th className="px-4 py-3">{t('salvage.table.matPerUnit', 'Mat per Unit')}</th>
              <th className="px-4 py-3">{t('salvage.table.sellPrice', 'Sell Price')}</th>
              <th className="px-4 py-3">{t('salvage.table.processedPrice', 'Processed Price')}</th>
              <th className="px-4 py-3">{t('salvage.table.quantity', 'Quantity')}</th>
              <th className="px-5 py-3 text-right">{t('salvage.table.totalValue', 'Total Value')}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const { id, name, icon } = result.material;
              const wikiName = id > 0 ? name : SYNTH_WIKI[id] || name;
              const href = gw2WikiUrl(wikiName, lang, {
                itemId: id > 0 ? id : undefined,
                englishName: id > 0 ? undefined : wikiName,
              });

              return (
              <tr
                key={id}
                className={`group border-b border-slate-600/30 border-l-2 transition-colors hover:bg-slate-700/40 ${getMaterialRowClass(id)}`}
              >
                <td className="whitespace-nowrap px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {icon ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/30 ring-1 ring-white/[0.06]">
                        <Image
                          src={icon}
                          alt=""
                          width={28}
                          height={28}
                          className="h-7 w-7"
                        />
                      </div>
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-white/[0.04]" />
                    )}
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-white underline-offset-2 transition-colors hover:text-sky-300 hover:underline"
                    >
                      {name}
                    </a>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="rounded-md bg-white/[0.04] px-2 py-1 font-mono text-xs tabular-nums text-zinc-400">
                    {result.material.dropRate.toFixed(5)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <SalvageCurrency copper={result.material.sellPrice} size="sm" className="!font-semibold !text-zinc-400" />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <SalvageCurrency copper={result.material.processedPrice} size="sm" className="!font-semibold" />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm tabular-nums text-zinc-300">
                  {Math.round(result.quantity)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-right">
                  <SalvageCurrency copper={result.totalValue} size="sm" />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
