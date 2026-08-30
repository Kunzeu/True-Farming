'use client';

import Image from 'next/image';
import { useI18n } from '@/contexts/I18nContext';
import {
  formatGoldParts,
  formatGoldShort,
  getAccountItemRarityColor,
  type AccountTooltipData,
} from '@/lib/account-item-tooltip';

type AccountItemTooltipProps = {
  data: AccountTooltipData | null;
  position: { x: number; y: number };
};

function GoldCoins({ copper, coinSize = 10 }: { copper: number; coinSize?: number }) {
  const { gold, silver, copper: c } = formatGoldParts(copper);
  return (
    <span className="inline-flex items-center gap-0.5 tabular-nums">
      <span>{gold}</span>
      <Image src="/images/expansions/Gold.webp" alt="" width={coinSize} height={coinSize} />
      <span>{silver}</span>
      <Image src="/images/expansions/Silver.webp" alt="" width={coinSize} height={coinSize} />
      <span>{c}</span>
      <Image src="/images/expansions/Copper.webp" alt="" width={coinSize} height={coinSize} />
    </span>
  );
}

function PriceRow({
  label,
  unitCopper,
  stackCount,
}: {
  label: string;
  unitCopper: number;
  stackCount: number;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 text-[10px] text-gray-400">{label}</span>
      <div className="flex flex-wrap items-center justify-end gap-x-1 text-[10px] text-gray-200">
        <GoldCoins copper={unitCopper} />
        {stackCount > 1 && (
          <span className="text-gray-500">
            ({formatGoldShort(unitCopper * stackCount)} {t('bank.perCount', 'per')} {stackCount})
          </span>
        )}
      </div>
    </div>
  );
}

export default function AccountItemTooltip({ data, position }: AccountItemTooltipProps) {
  const { t } = useI18n();

  if (!data) return null;

  const { item, details, price } = data;
  const showPrices = price || (details.vendor_value != null && details.vendor_value > 0);

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxWidth: '240px',
        maxHeight: '50vh',
      }}
    >
      <div className="pointer-events-auto max-h-full w-full overflow-y-auto rounded-md border border-gray-700 bg-gray-800 shadow-xl">
        <div className="p-2.5">
          <div className="mb-2 flex items-start gap-2">
            {details.icon && (
              <Image
                src={details.icon}
                alt={details.name}
                width={24}
                height={24}
                className="mt-0.5 shrink-0 rounded"
                unoptimized
              />
            )}
            <div className="min-w-0">
              <h3 className={`text-xs font-bold leading-tight ${getAccountItemRarityColor(details.rarity)}`}>
                {item.count > 1 && `${item.count}x `}
                {details.name}
              </h3>
              <p className="text-[10px] leading-snug text-gray-400">
                {details.type}
                {details.level ? ` • ${t('characters.itemLevel', 'Level')} ${details.level}` : ''}
              </p>
            </div>
          </div>

          {details.description && (
            <p className="mb-2 text-[10px] leading-snug text-gray-300">{details.description}</p>
          )}

          {(item.binding || item.bound_to) && (
            <div className="mb-2 space-y-0.5 text-[10px]">
              {item.binding && (
                <p className="text-orange-400">
                  {t('characters.binding', 'Binding')}: {item.binding}
                </p>
              )}
              {item.bound_to && (
                <p className="text-orange-400">
                  {t('characters.boundTo', 'Bound to')}: {item.bound_to}
                </p>
              )}
            </div>
          )}

          {showPrices && (
            <div className="space-y-1 border-t border-gray-700/60 pt-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {t('bank.prices', 'Prices')}
              </h4>

              {details.vendor_value != null && details.vendor_value > 0 && (
                <PriceRow
                  label={t('bank.vendorPrice', 'Vendor Price:')}
                  unitCopper={details.vendor_value}
                  stackCount={item.count}
                />
              )}

              {price?.buys && price.buys.unit_price > 0 && (
                <PriceRow
                  label={t('bank.buyPrice', 'Buy Price:')}
                  unitCopper={price.buys.unit_price}
                  stackCount={item.count}
                />
              )}

              {price?.sells && price.sells.unit_price > 0 && (
                <PriceRow
                  label={t('bank.sellPrice', 'Sell Price:')}
                  unitCopper={price.sells.unit_price}
                  stackCount={item.count}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
