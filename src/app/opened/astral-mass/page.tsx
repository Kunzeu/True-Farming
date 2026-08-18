'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Calculator, Package } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import WikiItemLink from '@/components/ui/WikiItemLink';
import drops from '@/lib/astral-mass-drops.json';

type Gw2Item = { id: number; name: string; icon: string; vendor_value?: number };
type Gw2Price = { id: number; sells?: { unit_price: number } };

const CHUNK = 200;

async function fetchChunked<T extends { id: number }>(url: string, ids: number[]): Promise<T[]> {
  const out: T[] = [];
  async function go(batch: number[]) {
    if (!batch.length) return;
    const res = await fetch(`${url}${batch.join(',')}`);
    if (res.ok) {
      out.push(...(await res.json()));
      return;
    }
    if (batch.length === 1) return;
    const mid = Math.ceil(batch.length / 2);
    await go(batch.slice(0, mid));
    await go(batch.slice(mid));
  }
  for (let i = 0; i < ids.length; i += CHUNK) {
    await go(ids.slice(i, i + CHUNK));
  }
  return out;
}

function formatCopper(copper: number) {
  const n = Math.max(0, Math.round(copper));
  const g = Math.floor(n / 10000);
  const s = Math.floor((n % 10000) / 100);
  const c = n % 100;
  return `${String(g).padStart(2, '0')}G ${String(s).padStart(2, '0')}S ${String(c).padStart(2, '0')}C`;
}

function unitCopper(sell: number, vendor: number) {
  return sell > 0 ? Math.floor(sell * 0.85) : vendor;
}

export default function AstralMassPage() {
  const { lang, t } = useI18n();
  const [container, setContainer] = useState<{ name: string; icon: string } | null>({
    name: t('pageTitles.astralMass', 'Masa fluctuante astral'),
    icon: '',
  });
  const [items, setItems] = useState<Record<number, Gw2Item>>({});
  const [sell, setSell] = useState<Record<number, number>>({});

  usePageTitle('pageTitles.astralMass', container?.name || 'Astral Fluctuating Mass');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [self, info, prices] = await Promise.all([
        fetchChunked<Gw2Item>(`https://api.guildwars2.com/v2/items?lang=${lang}&ids=`, [drops.itemId]),
        fetchChunked<Gw2Item>(`https://api.guildwars2.com/v2/items?lang=${lang}&ids=`, drops.ids),
        fetchChunked<Gw2Price>('https://api.guildwars2.com/v2/commerce/prices?ids=', drops.ids),
      ]);
      if (cancelled) return;
      const byId: Record<number, Gw2Item> = {};
      [...self, ...info].forEach((it) => {
        byId[it.id] = it;
      });
      if (self[0]) setContainer({ name: self[0].name, icon: self[0].icon });
      setItems(byId);
      const sells: Record<number, number> = {};
      prices.forEach((p) => {
        sells[p.id] = p.sells?.unit_price || 0;
      });
      setSell(sells);
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const rows = useMemo(() => {
    return drops.ids.map((id, i) => {
      const qty = drops.counts[i];
      const unit = unitCopper(sell[id] || 0, items[id]?.vendor_value || 0);
      return { id, qty, unit, total: unit * qty, per: qty / drops.boxes };
    });
  }, [items, sell]);

  const valuePer = rows.reduce((s, r) => s + r.total, 0) / drops.boxes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <Link
          href="/opened"
          className="mb-4 inline-flex w-fit items-center gap-2 rounded-lg border border-indigo-500/30 bg-gray-900/80 px-4 py-2 text-white hover:bg-gray-800/90"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('riftEssenceCoffer.backToContainers', 'Volver a Contenedores')}
        </Link>

        <WikiItemLink
          name={container?.name || 'Masa fluctuante astral'}
          englishName="Astral Fluctuating Mass"
          itemId={drops.itemId}
          className="mb-6 flex flex-col items-center justify-center gap-4 no-underline hover:opacity-90 sm:flex-row"
        >
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
            {container?.icon ? (
              <Image src={container.icon} alt="" width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-8 w-8 text-white" />
            )}
          </div>
          <h1 className="text-center text-3xl font-bold text-white sm:text-4xl">
            {container?.name || t('pageTitles.astralMass', 'Masa fluctuante astral')}
          </h1>
        </WikiItemLink>
        <p className="mb-6 text-center text-sm text-gray-400">
          {t('opened.laurels.credits', 'Crédito de datos: kusanagi.1093')}
        </p>

        <div className="mx-auto mb-6 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-300" />
              <h3 className="font-bold text-white">{t('riftEssenceCoffer.openings', 'Aperturas')}</h3>
            </div>
            <p className="text-2xl font-bold text-indigo-300">{drops.boxes.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-300" />
              <h3 className="font-bold text-white">{t('riftEssenceCoffer.totalItems', 'Total de Items')}</h3>
            </div>
            <p className="text-2xl font-bold text-orange-300">{drops.ids.length.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-green-300" />
              <h3 className="font-bold text-white">{t('riftEssenceCoffer.bagValue', 'Valor por bolsa (85%)')}</h3>
            </div>
            <p className="text-2xl font-bold text-green-300">{formatCopper(valuePer)}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-600/50 bg-slate-900/70">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 text-gray-300">
              <tr>
                <th className="px-3 py-2 text-left">{t('common.item', 'Item')}</th>
                <th className="px-3 py-2 text-right">{t('opened.laurels.qty', 'Cant.')}</th>
                <th className="px-3 py-2 text-right">{t('halloween.boxOpening.perBox', 'Por caja')}</th>
                <th className="px-3 py-2 text-right">{t('lunarNewYear.boxOpening.priceTP', 'TP Price')}</th>
                <th className="px-3 py-2 text-right">{t('lunarNewYear.boxOpening.totalValue', 'Valor Total')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const it = items[r.id];
                return (
                  <tr key={r.id} className="border-t border-slate-700/60 hover:bg-slate-800/40">
                    <td className="px-3 py-2">
                      <WikiItemLink name={it?.name || String(r.id)} itemId={r.id} className="inline-flex items-center gap-2 text-gray-200 hover:text-white">
                        {it?.icon && <Image src={it.icon} alt="" width={24} height={24} className="h-6 w-6" />}
                        {it?.name || r.id}
                      </WikiItemLink>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-200">{r.qty.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-300">{r.per.toFixed(3)}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-200">{formatCopper(r.unit)}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-200">{formatCopper(r.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
