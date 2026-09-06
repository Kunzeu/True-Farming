'use client';

import Providers from '@/components/Providers';
import AccountShell from '@/components/account/AccountShell';
import Page from '@/app/account/search/page';

type Lang = 'en' | 'de' | 'es' | 'fr';

export default function Island({ lang }: { lang: Lang }) {
  return (
    <Providers lang={lang}>
      <AccountShell>
        <Page />
      </AccountShell>
    </Providers>
  );
}
