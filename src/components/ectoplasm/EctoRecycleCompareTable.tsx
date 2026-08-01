'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/contexts/I18nContext';
import { formatGW2Currency } from '@/utils/gw2-currency';
import {
  computeEctoRecycleCompare,
  DUST_ITEM_ID,
  ECTO_ITEM_ID,
  type EctoRecycleCompare,
} from '@/components/ectoplasm/ecto-recycle-compare';

type Props = {
  /** TP sell prices (copper). If omitted, fetches live. */
  ectoSell?: number;
  dustSell?: number;
  ectoIcon?: string;
  dustIcon?: string;
  /** Wrap table in Link (e.g. home radar → /ectoplasm). */
  href?: string;
  className?: string;
};

export default function EctoRecycleCompareTable({
  ectoSell: ectoSellProp,
  dustSell: dustSellProp,
  ectoIcon: ectoIconProp,
  dustIcon: dustIconProp,
  href,
  className = '',
}: Props) {
  const { t, lang } = useI18n();
  const [ectoSell, setEctoSell] = useState(ectoSellProp ?? 0);
  const [dustSell, setDustSell] = useState(dustSellProp ?? 0);
  const [ectoIcon, setEctoIcon] = useState(ectoIconProp ?? '');
  const [dustIcon, setDustIcon] = useState(dustIconProp ?? '');

  useEffect(() => {
    if (ectoSellProp != null) setEctoSell(ectoSellProp);
    if (dustSellProp != null) setDustSell(dustSellProp);
    if (ectoIconProp) setEctoIcon(ectoIconProp);
    if (dustIconProp) setDustIcon(dustIconProp);
  }, [ectoSellProp, dustSellProp, ectoIconProp, dustIconProp]);

  useEffect(() => {
    if (ectoSellProp != null && dustSellProp != null && ectoIconProp && dustIconProp) return;

    let cancelled = false;
    const apiLang = lang === 'es' || lang === 'de' || lang === 'fr' ? lang : 'en';
    const ids = `${ECTO_ITEM_ID},${DUST_ITEM_ID}`;

    (async () => {
      try {
        const [pricesRes, itemsRes] = await Promise.all([
          ectoSellProp == null || dustSellProp == null
            ? fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${ids}`)
            : null,
          !ectoIconProp || !dustIconProp
            ? fetch(`https://api.guildwars2.com/v2/items?ids=${ids}&lang=${apiLang}`)
            : null,
        ]);

        if (pricesRes?.ok) {
          const prices = await pricesRes.json();
          if (cancelled) return;
          for (const p of prices) {
            if (p.id === ECTO_ITEM_ID) setEctoSell(p.sells?.unit_price ?? 0);
            if (p.id === DUST_ITEM_ID) setDustSell(p.sells?.unit_price ?? 0);
          }
        }
        if (itemsRes?.ok) {
          const items = await itemsRes.json();
          if (cancelled) return;
          for (const item of items) {
            if (item.id === ECTO_ITEM_ID) setEctoIcon(item.icon);
            if (item.id === DUST_ITEM_ID) setDustIcon(item.icon);
          }
        }
      } catch {
        /* silent — table stays empty */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lang, ectoSellProp, dustSellProp, ectoIconProp, dustIconProp]);

  const compare: EctoRecycleCompare | null = computeEctoRecycleCompare(ectoSell, dustSell);
  if (!compare) return null;

  const table = (
    <div
      className={`overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm ${className}`}
    >
      <div className="bg-sky-700/90 px-4 py-2.5 text-center text-sm font-semibold text-white sm:text-base">
        {t(
          'ectoplasm.recycle.question',
          'Is it worth recycling ectos and selling dust + luck?'
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-600/50 bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <th className="px-4 py-2.5">{t('ectoplasm.recycle.col.name', 'Name')}</th>
              <th className="px-4 py-2.5 text-right">{t('ectoplasm.recycle.col.price90', 'Price 90%')}</th>
              <th className="px-4 py-2.5 text-right">{t('ectoplasm.recycle.col.profit', 'Profit?')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-700/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {ectoIcon && (
                    <Image src={ectoIcon} alt="" width={24} height={24} className="rounded" />
                  )}
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-sm font-semibold text-amber-200">
                    {t('ectoplasm.recycle.noRecycle', 'Do not recycle')}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm text-amber-100">
                {formatGW2Currency(compare.noRecycle.price90)}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`inline-block rounded px-2 py-1 font-mono text-sm font-semibold ${
                    compare.worthRecycling ? 'bg-rose-600/80 text-white' : 'bg-emerald-600/80 text-white'
                  }`}
                >
                  {formatGW2Currency(compare.noRecycle.profit)}
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {ectoIcon && (
                    <Image src={ectoIcon} alt="" width={24} height={24} className="rounded" />
                  )}                  
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-sm font-semibold text-amber-200">
                    {t('ectoplasm.recycle.recycle', 'Recycle')}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm text-amber-100">
                {formatGW2Currency(compare.recycle.price90)}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`inline-block rounded px-2 py-1 font-mono text-sm font-semibold ${
                    compare.worthRecycling ? 'bg-emerald-600/80 text-white' : 'bg-rose-600/80 text-white'
                  }`}
                >
                  {formatGW2Currency(compare.recycle.profit)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-95">
        {table}
      </Link>
    );
  }

  return table;
}
