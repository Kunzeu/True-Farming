'use client';

import Providers from '@/components/Providers';
import Page from '@/app/terms-of-service/page';

type Lang = 'en' | 'de' | 'es' | 'fr';

export default function Island({ lang }: { lang: Lang }) {
  return (
    <Providers lang={lang}>
      <Page />
    </Providers>
  );
}
