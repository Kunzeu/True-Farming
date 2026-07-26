'use client';

import Providers from '@/components/Providers';
import OrphanShell from '@/app/festivals/wintersday/Orphan/layout';
import Page from '@/app/festivals/wintersday/Orphan/preparation/page';

type Lang = 'en' | 'de' | 'es' | 'fr';

export default function Island({ lang }: { lang: Lang }) {
  return (
    <Providers lang={lang}>
      <OrphanShell>
        <Page />
      </OrphanShell>
    </Providers>
  );
}
