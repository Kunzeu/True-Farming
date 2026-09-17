'use client';

import Providers from '@/components/Providers';
import Page from '@/app/opened/essence/page';
import { AccountGw2Provider } from '@/hooks/useAccountGw2';

type Lang = 'en' | 'de' | 'es' | 'fr';

export default function Island({ lang }: { lang: Lang }) {
  return (
    <Providers lang={lang}>
      <AccountGw2Provider>
        <Page />
      </AccountGw2Provider>
    </Providers>
  );
}
