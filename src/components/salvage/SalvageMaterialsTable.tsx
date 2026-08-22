'use client';

import Image from 'next/image';
import { useI18n } from '@/contexts/I18nContext';
import SalvageCurrency from '@/components/salvage/SalvageCurrency';
import { getMaterialRowClass } from '@/components/salvage/salvage-config';
import { gw2WikiUrl } from '@/lib/gw2-wiki';

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
  [-3]: 'Fine Essence of Luck',
  [-4]: 'Fine Essence of Luck',
};

export default function SalvageMaterialsTable({
  results,
  quantity,
}: SalvageMaterialsTableProps) {
  const { t, lang } = useI18n();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-600/50 px-5 py-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-300">
          {t('salvage.table.materialsBreakdown', 'Materials breakdown')}
        </h2>
        <span className="rounded-full bg-slate-700/50 px-2.5 py-1 text-xs text-gray-400">
          ×{quantity}
        </span>
      </div>

      <p className="border-b border-slate-600/40 px-5 py-2 text-center text-xs text-gray-500 sm:hidden">
        {t('salvage.table.scrollHint', 'Swipe to see more columns →')}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
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
