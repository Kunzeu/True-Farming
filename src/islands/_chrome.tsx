'use client';

import Providers from '@/components/Providers';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/ui/ScrollToTop';
import CookieBanner from '@/components/ui/CookieBanner';
import SupportNotice from '@/components/ui/SupportNotice';
import GoogleAdsLoader from '@/components/GoogleAdsLoader';
import AdBlocker from '@/components/AdBlocker';

type Lang = 'en' | 'de' | 'es' | 'fr';

/** Deferred chrome — not needed for first paint. */
export default function ChromeIsland({ lang }: { lang: Lang }) {
  return (
    <Providers lang={lang}>
      <Footer />
      <ScrollToTop />
      <CookieBanner />
      <SupportNotice />
      <GoogleAdsLoader />
      <AdBlocker />
    </Providers>
  );
}
