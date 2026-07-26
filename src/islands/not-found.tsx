'use client';

import Providers from '@/components/Providers';
import NotFound from '@/app/not-found';

type Lang = 'en' | 'de' | 'es' | 'fr';

export default function Island({ lang }: { lang: Lang }) {
  return (
    <Providers lang={lang}>
      <NotFound />
    </Providers>
  );
}
