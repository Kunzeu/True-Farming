'use client';

import { useI18n } from '@/contexts/I18nContext';
import { gw2WikiUrl } from '@/lib/gw2-wiki';
import WikiItemLink from '@/components/ui/WikiItemLink';

interface WikiTooltipProps {
  itemId: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemData?: any | null;
  fallbackName?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Clic → wiki de GW2 según el idioma de la UI (español → inglés).
 * Mantiene el nombre WikiTooltip por compatibilidad con páginas existentes.
 */
export default function WikiTooltip({
  itemId,
  itemData,
  fallbackName,
  className,
  children,
}: WikiTooltipProps) {
  return (
    <WikiItemLink
      name={itemData?.name || fallbackName || ''}
      englishName={fallbackName || undefined}
      itemId={itemId}
      chatLink={itemData?.chat_link}
      className={`inline-flex cursor-pointer ${className || ''}`}
    >
      {children}
    </WikiItemLink>
  );
}

/** URL de wiki para el idioma actual (útil fuera de JSX). */
export function useGw2WikiUrl(
  name: string,
  options?: { itemId?: number; chatLink?: string }
): string {
  const { lang } = useI18n();
  return gw2WikiUrl(name, lang, options);
}
