'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';

type Lang = 'en' | 'de' | 'es' | 'fr';

/** Thin context only — chrome/nav live in separate islands for less eager JS. */
export default function Providers({
  children,
  lang,
}: {
  children: ReactNode;
  lang: Lang;
}) {
  return (
    <CookieConsentProvider>
      <AuthProvider>
        <I18nProvider initialLang={lang}>{children}</I18nProvider>
      </AuthProvider>
    </CookieConsentProvider>
  );
}
