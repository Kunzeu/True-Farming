'use client';

import Image from 'next/image';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import SalvageCurrency from '@/components/salvage/SalvageCurrency';
import WikiItemLink from '@/components/ui/WikiItemLink';
import {
  getCraftingDisciplineIcon,
  getCraftingLevelDisplay,
  getPricePerNoteCopper,
  getRarityColor,
  parsePriceCopper,
  type ResearchNotesCraftingItem,
  type ResearchNotesItemMeta,
  type ResearchNotesSortField,
} from '@/components/salvage/research-notes/research-notes-utils';

interface ResearchNotesTableProps {
  items: ResearchNotesCraftingItem[];
  itemMeta: Record<number, ResearchNotesItemMeta>;
  sortField: ResearchNotesSortField;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: ResearchNotesSortField) => void;
}

function SortIcon({
  active,
  order,
}: {
  active: boolean;
  order: 'asc' | 'desc';
}) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return order === 'desc' ? (
    <ArrowDown className="h-3 w-3 text-emerald-400" />
  ) : (
    <ArrowUp className="h-3 w-3 text-emerald-400" />
  );
}

export default function ResearchNotesTable({
  items,
  itemMeta,
  sortField,
  sortOrder,
  onSortChange,
}: ResearchNotesTableProps) {
  const { t } = useI18n();

  const columns: {
    field: ResearchNotesSortField;
    label: string;
    align?: 'center' | 'right';
  }[] = [
    { field: 'craftingLevel', label: t('researchNotesPage.table.craftingLevel'), align: 'center' },
    { field: 'notes', label: t('researchNotesPage.table.notes') },
    { field: 'pricePerNote', label: t('researchNotesPage.table.pricePerNote') },
    { field: 'craftingCost', label: t('researchNotesPage.table.craftingCost') },
    { field: 'buyPrice', label: t('researchNotesPage.table.buyPrice') },
    { field: 'sellPrice', label: t('researchNotesPage.table.sellPrice') },
    { field: 'level', label: t('researchNotesPage.table.level'), align: 'center' },
  ];

  const sortTitle = (field: ResearchNotesSortField, label: string) => {
    const direction =
      sortField === field
        ? sortOrder === 'desc'
          ? t('researchNotesPage.table.sortDescending')
          : t('researchNotesPage.table.sortAscending')
        : t('researchNotesPage.table.sortDefault');
    return `${t('researchNotesPage.table.sortBy')} ${label} (${direction})`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-sm">
        <thead>
          <tr className="border-b border-slate-600/50 bg-slate-800/80 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-gray-300">
            <th className="px-4 py-3">{t('researchNotesPage.table.item')}</th>
            {columns.map((col) => (
              <th
                key={col.field}
                className={`px-3 py-3 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => onSortChange(col.field)}
                  title={sortTitle(col.field, col.label)}
                  className={`inline-flex items-center gap-1.5 transition-colors hover:text-white ${
                    col.align === 'center' ? 'mx-auto' : ''
                  } ${sortField === col.field ? 'text-emerald-300' : ''}`}
                >
                  {col.label}
                  <SortIcon active={sortField === col.field} order={sortOrder} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const meta = item.id ? itemMeta[item.id] : undefined;
            const discipline = getCraftingDisciplineIcon(item.id);
            const pricePerNote = getPricePerNoteCopper(item);

            return (
              <tr
                key={`${item.id ?? index}-${item.name}`}
                className="border-b border-slate-600/30 transition-colors hover:bg-slate-700/40"
              >
                <td className="whitespace-nowrap px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    {meta?.icon ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/30 ring-1 ring-white/10">
                        <Image src={meta.icon} alt="" width={28} height={28} className="h-7 w-7" />
                      </div>
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-slate-700/50" />
                    )}
                    <WikiItemLink
                      name={item.name}
                      itemId={item.id}
                      className={`text-sm font-medium hover:underline ${getRarityColor(meta?.rarity || '')}`}
                    >
                      {item.name}
                    </WikiItemLink>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-center text-gray-300">
                  <div className="flex items-center justify-center gap-2">
                    {discipline === 'artificer' && (
                      <Image
                        src="https://wiki.guildwars2.com/images/b/b7/Artificer_tango_icon_20px.png"
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5"
                      />
                    )}
                    {discipline === 'jeweler' && (
                      <Image
                        src="/images/icons/jeweler-icon.webp"
                        alt=""
                        width={16}
                        height={16}
                        className="h-4 w-4"
                      />
                    )}
                    <span>{getCraftingLevelDisplay(item.id)}</span>
                  </div>
                </td>
                <td className="px-3 py-3.5 font-medium text-emerald-400">{item.notes}</td>
                <td className="px-3 py-3.5">
                  {pricePerNote !== null ? (
                    <SalvageCurrency copper={pricePerNote} size="sm" />
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-3 py-3.5">
                  {item.craftingCost ? (
                    <SalvageCurrency copper={parsePriceCopper(item.craftingCost)} size="sm" />
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-3 py-3.5">
                  {item.buyPrice ? (
                    <SalvageCurrency
                      copper={parsePriceCopper(item.buyPrice)}
                      size="sm"
                      className="!text-sky-300"
                    />
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-3 py-3.5">
                  {item.sellPrice ? (
                    <SalvageCurrency copper={parsePriceCopper(item.sellPrice)} size="sm" />
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-3 py-3.5 text-center text-gray-300">{item.level}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
