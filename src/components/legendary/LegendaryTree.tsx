'use client';

import { ChevronRight, Hammer, Lock, ShoppingCart, Store } from 'lucide-react';
import Image from 'next/image';
import type { GW2Item } from '@/types/gw2';
import {
  CURRENCY_META,
  VENDOR_SOURCES,
  gw2WikiUrl,
  itemMeta,
  type LegendaryData,
  type NodeMode,
  type PriceMode,
  type TreeNode,
} from '@/lib/legendary-tree';
import SalvageCurrency from '@/components/salvage/SalvageCurrency';
import { useI18n } from '@/contexts/I18nContext';

const RARITY_COLOR: Record<string, string> = {
  Legendary: 'text-fuchsia-400',
  Ascended: 'text-pink-400',
  Exotic: 'text-amber-400',
  Rare: 'text-yellow-300',
  Masterwork: 'text-emerald-400',
  Fine: 'text-sky-400',
  Basic: 'text-zinc-200',
  Junk: 'text-zinc-500',
};

const MODE_STYLE = {
  buy: { icon: ShoppingCart, className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' },
  craft: { icon: Hammer, className: 'border-violet-500/30 bg-violet-500/10 text-violet-300' },
  account: { icon: Lock, className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
} as const;

type Labels = {
  buy: string;
  craft: string;
  account: string;
  owned: string;
  buyTp: string;
  craftOpt: string;
  tpInstant: string;
  tpOrder: string;
  vendor: string;
};

type RowProps = {
  node: TreeNode;
  data: LegendaryData;
  items: Record<number, GW2Item>;
  expanded: Set<string>;
  onToggle: (key: string) => void;
  onDecide: (id: number, mode: 'buy' | 'craft') => void;
  onCurrencyDecide: (id: number, choice: string) => void;
  labels: Labels;
  priceMode: PriceMode;
};

function activeTpUnit(node: TreeNode, priceMode: PriceMode): number | null {
  if (priceMode === 'sell') return node.tpSell || node.tpBuy;
  return node.tpBuy || node.tpSell;
}

function ChoiceToggle({
  node,
  labels,
  onDecide,
  priceMode,
}: {
  node: TreeNode;
  labels: Labels;
  onDecide: (id: number, mode: 'buy' | 'craft') => void;
  priceMode: PriceMode;
}) {
  if (!node.canChoose || node.craftUnit === null) return null;
  const tpUnit = activeTpUnit(node, priceMode);
  if (tpUnit === null) return null;

  const tpLabel = priceMode === 'sell' ? labels.tpInstant : labels.tpOrder;
  const qty = Math.max(node.need, 1);

  return (
    <div className="inline-flex shrink-0 rounded-lg border border-slate-600/50 bg-slate-950/50 p-0.5">
      <button
        type="button"
        onClick={() => onDecide(node.id, 'buy')}
        title={tpLabel}
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition ${
          node.mode === 'buy' ? 'bg-cyan-500/20 text-cyan-200' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <ShoppingCart className="h-3 w-3" />
        <span className="hidden lg:inline">{tpLabel}</span>
        <SalvageCurrency
          copper={tpUnit * qty}
          size="sm"
          className={`!text-[11px] ${node.mode === 'buy' ? '' : 'opacity-60'}`}
        />
      </button>
      <button
        type="button"
        onClick={() => onDecide(node.id, 'craft')}
        title={labels.craftOpt}
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition ${
          node.mode === 'craft' ? 'bg-violet-500/20 text-violet-200' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Hammer className="h-3 w-3" />
        <span className="hidden lg:inline">{labels.craftOpt}</span>
        <SalvageCurrency
          copper={node.craftUnit * qty}
          size="sm"
          className={`!text-[11px] ${node.mode === 'craft' ? '' : 'opacity-60'}`}
        />
      </button>
    </div>
  );
}

function CurrencyChoice({
  node,
  onCurrencyDecide,
}: {
  node: TreeNode;
  onCurrencyDecide: (id: number, choice: string) => void;
}) {
  if (!node.currency || !node.currencyChoices || node.currencyChoices.length < 2) return null;

  return (
    <div className="inline-flex shrink-0 rounded-lg border border-slate-600/50 bg-slate-950/50 p-0.5">
      {node.currencyChoices.map((choice) => (
        <button
          key={choice.key}
          type="button"
          onClick={() => onCurrencyDecide(node.id, choice.key)}
          className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition ${
            node.currencyChoice === choice.key
              ? 'bg-sky-500/20 text-sky-200'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}

function TreeRow({
  node,
  data,
  items,
  expanded,
  onToggle,
  onDecide,
  onCurrencyDecide,
  labels,
  priceMode,
}: RowProps) {
  const { lang } = useI18n();
  const fallback = itemMeta(data, node.id);
  const localized = items[node.id];
  const name = localized?.name ?? fallback.name;
  const icon = localized?.icon ?? fallback.icon;
  const rarity = localized?.rarity ?? fallback.rarity ?? 'Basic';
  const isOpen = expanded.has(node.key);
  const hasChildren = node.children.length > 0;
  const mode = MODE_STYLE[node.mode as NodeMode];
  const ModeIcon = mode.icon;
  const total = Math.ceil(node.need + node.owned);
  const tpUnit = activeTpUnit(node, priceMode);
  const tpLabel = priceMode === 'sell' ? labels.tpInstant : labels.tpOrder;
  // de/fr: nombre localizado; en: nombre EN; es: EN vía englishName + chat link
  const wikiTitle = lang === 'de' || lang === 'fr' ? name : fallback.name;

  return (
    <>
      <div
        className="group flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg py-1.5 pr-2 transition-colors hover:bg-slate-700/30 sm:flex-nowrap"
        style={{ paddingLeft: `${Math.min(node.depth, 8) * 16}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.key)}
            aria-expanded={isOpen}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-600/60 text-zinc-400 transition hover:border-violet-400/50 hover:text-white"
          >
            <ChevronRight className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}

        {icon ? (
          <Image
            src={icon}
            alt=""
            width={26}
            height={26}
            className="shrink-0 rounded border border-slate-600/50"
          />
        ) : (
          <span className="h-[26px] w-[26px] shrink-0 rounded bg-slate-700" />
        )}

        <span className="shrink-0 font-mono text-sm text-zinc-400">{total} ×</span>

        <a
          href={gw2WikiUrl(wikiTitle, lang, {
            itemId: node.id > 0 ? node.id : undefined,
            englishName: fallback.name || undefined,
          })}
          target="_blank"
          rel="noopener noreferrer"
          className={`min-w-0 truncate text-sm font-medium hover:underline ${RARITY_COLOR[rarity] ?? 'text-zinc-200'}`}
          title={wikiTitle}
        >
          {name}
        </a>

        <CurrencyChoice node={node} onCurrencyDecide={onCurrencyDecide} />

        {(() => {
          const vendorName =
            VENDOR_SOURCES[node.id]?.vendor ??
            (node.source?.startsWith('Vendor: ') ? node.source.slice('Vendor: '.length) : null);
          const vendorGold =
            VENDOR_SOURCES[node.id]?.gold ??
            (vendorName && node.mode === 'buy' && node.buyUnit != null ? node.buyUnit : null);

          if (node.canChoose) {
            return <ChoiceToggle node={node} labels={labels} onDecide={onDecide} priceMode={priceMode} />;
          }
          if (vendorName) {
            return (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-200"
                title={`${labels.vendor}: ${vendorName}`}
              >
                <Store className="h-3 w-3" />
                <span className="hidden max-w-[10rem] truncate sm:inline">
                  {labels.vendor}: {vendorName}
                </span>
                {vendorGold != null && (
                  <SalvageCurrency
                    copper={vendorGold * Math.max(node.need, 1)}
                    size="sm"
                    className="!text-[11px]"
                  />
                )}
              </span>
            );
          }
          if (node.mode === 'buy' && tpUnit !== null) {
            return (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-cyan-300"
                title={tpLabel}
              >
                <ShoppingCart className="h-3 w-3" />
                <span className="hidden sm:inline">{tpLabel}</span>
                <SalvageCurrency copper={tpUnit * Math.max(node.need, 1)} size="sm" className="!text-[11px]" />
              </span>
            );
          }
          return (
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${mode.className}`}
              title={labels[node.mode]}
            >
              <ModeIcon className="h-3 w-3" />
              <span className="hidden sm:inline">{labels[node.mode]}</span>
            </span>
          );
        })()}

        {node.owned > 0 && (
          <span className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            {labels.owned} {Math.floor(node.owned)}
          </span>
        )}

        <span className="mx-1 hidden min-w-4 flex-1 border-b border-dotted border-slate-600/50 sm:block" />

        {node.need === 0 ? (
          <span className="shrink-0 font-mono text-sm text-emerald-400">—</span>
        ) : node.mode === 'account' && node.currency ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 font-mono text-xs font-semibold text-sky-300"
            title={CURRENCY_META[node.currency.id]?.name}
          >
            {CURRENCY_META[node.currency.id]?.icon && (
              <Image
                src={CURRENCY_META[node.currency.id].icon}
                alt=""
                width={14}
                height={14}
                className="rounded-sm"
              />
            )}
            {Math.ceil(node.currency.total).toLocaleString()}
          </span>
        ) : node.mode === 'account' ? (
          <span className="shrink-0 font-mono text-xs text-amber-300/80">{labels.account}</span>
        ) : (
          <SalvageCurrency copper={node.total} size="sm" className="shrink-0" />
        )}
      </div>

      {isOpen &&
        node.children.map((child) => (
          <TreeRow
            key={child.key}
            node={child}
            data={data}
            items={items}
            expanded={expanded}
            onToggle={onToggle}
            onDecide={onDecide}
            onCurrencyDecide={onCurrencyDecide}
            labels={labels}
            priceMode={priceMode}
          />
        ))}
    </>
  );
}

export default function LegendaryTree(props: RowProps) {
  return (
    <div className="space-y-0.5">
      <TreeRow {...props} />
    </div>
  );
}
