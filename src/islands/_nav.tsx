'use client';

import Providers from '@/components/Providers';
import Navigation from '@/components/layout/Navigation';
import RoleChecker from '@/components/RoleChecker';
import ApiWarningBanner from '@/components/ui/ApiWarningBanner';
import PageUsageTracker from '@/components/PageUsageTracker';

type Lang = 'en' | 'de' | 'es' | 'fr';

export default function NavIsland({ lang }: { lang: Lang }) {
  return (
    <Providers lang={lang}>
      <PageUsageTracker />
      <RoleChecker />
      <Navigation />
      <ApiWarningBanner />
    </Providers>
  );
}
