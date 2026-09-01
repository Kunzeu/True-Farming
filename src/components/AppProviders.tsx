'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import RoleChecker from '@/components/RoleChecker';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/ui/ScrollToTop';
import CookieBanner from '@/components/ui/CookieBanner';
import ApiWarningBanner from '@/components/ui/ApiWarningBanner';
import PageUsageTracker from '@/components/PageUsageTracker';
import GoogleAdsLoader from '@/components/GoogleAdsLoader';
import AdBlocker from '@/components/AdBlocker';
import SupportNotice from '@/components/ui/SupportNotice';

type Lang = 'en' | 'de' | 'es' | 'fr';

export default function AppProviders({
  children,
  lang,
}: {
  children: ReactNode;
  lang: Lang;
}) {
  return (
    <CookieConsentProvider>
      <AuthProvider>
        <I18nProvider initialLang={lang}>
          <div className="tf-site-bg flex min-h-screen flex-col">
            <PageUsageTracker />
            <RoleChecker />
            <ApiWarningBanner />
            {/* pt-16: pages with fixed Navigation; login/auth tolerate the gap */}
            <div className="flex-1 pt-[4.25rem]">{children}</div>
            <div className="mt-auto">
              <Footer />
            </div>
            <ScrollToTop />
            <CookieBanner />
            <SupportNotice />
            <GoogleAdsLoader />
            <AdBlocker />
          </div>
        </I18nProvider>
      </AuthProvider>
    </CookieConsentProvider>
  );
}
