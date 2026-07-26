'use client';

import type { ReactNode } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { gw2WikiUrl } from '@/lib/gw2-wiki';

type Props = {
  /** Nombre visible (puede estar localizado). */
  name: string;
  /** Título EN de la wiki; en UI español evita búsquedas rotas. */
  englishName?: string;
  itemId?: number;
  chatLink?: string;
  className?: string;
  title?: string;
  children: ReactNode;
};

/** Enlace a la wiki de GW2 según el idioma de la UI (es → inglés). */
export default function WikiItemLink({
  name,
  englishName,
  itemId,
  chatLink,
  className,
  title,
  children,
}: Props) {
  const { lang } = useI18n();
  return (
    <a
      href={gw2WikiUrl(name, lang, { itemId, chatLink, englishName })}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={title ?? name}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  );
}
