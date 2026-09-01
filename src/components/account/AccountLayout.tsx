'use client';

import Link from 'next/link';
import {
  Archive,
  Boxes,
  LayoutGrid,
  Search,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import AccountInvalidApiKeyBanner from '@/components/account/AccountInvalidApiKeyBanner';

export type AccountSection = 'overview' | 'wallet' | 'bank' | 'storage' | 'characters' | 'search' | 'settings';

type AccountLayoutProps = {
  section: AccountSection;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const NAV: Array<{
  section: AccountSection;
  href: string;
  icon: typeof Wallet;
  titleKey: string;
  fallback: string;
}> = [
  { section: 'overview', href: '/account', icon: LayoutGrid, titleKey: 'account.overview', fallback: 'Overview' },
  { section: 'wallet', href: '/account/wallet', icon: Wallet, titleKey: 'account.wallet', fallback: 'Wallet' },
  { section: 'bank', href: '/account/bank', icon: Boxes, titleKey: 'account.bank', fallback: 'Bank' },
  { section: 'storage', href: '/account/storage', icon: Archive, titleKey: 'account.storage', fallback: 'Storage' },
  { section: 'characters', href: '/account/characters', icon: Users, titleKey: 'account.characters', fallback: 'Characters' },
  { section: 'search', href: '/account/search', icon: Search, titleKey: 'account.search', fallback: 'Search' },
  { section: 'settings', href: '/profile', icon: Settings, titleKey: 'account.settings', fallback: 'Settings' },
];

function AccountLayoutInner({ section, title, subtitle, children }: AccountLayoutProps) {
  const { t } = useI18n();
  const { gw2AccountName, hasApiKey, loading } = useAccountGw2();

  return (
    <div className="tf-site-bg min-h-screen text-white">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-400">{t('account.title', 'Your Account')}</p>
            {!loading && hasApiKey && gw2AccountName && (
              <p className="mt-1 text-sm text-blue-300">
                {t('account.gw2Account', 'GW2 account')}: <span className="font-semibold text-white">{gw2AccountName}</span>
              </p>
            )}
          </div>
        </div>

        <nav className="mb-8 flex gap-2 overflow-x-auto pb-1" aria-label={t('account.title', 'Your Account')}>
          {NAV.map(({ section: navSection, href, icon: Icon, titleKey, fallback }) => {
            const isActive = navSection === section;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-500/60 bg-blue-500/15 text-blue-200'
                    : 'border-gray-700/60 bg-gray-800/50 text-gray-300 hover:border-gray-600 hover:text-white'
                }`}>
                <Icon className="h-4 w-4" />
                <span>{t(titleKey, fallback)}</span>
              </Link>
            );
          })}
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle ? <p className="mt-2 text-gray-400">{subtitle}</p> : null}
        </header>

        <AccountInvalidApiKeyBanner />

        {children}
      </main>
    </div>
  );
}

export default function AccountLayout(props: AccountLayoutProps) {
  return <AccountLayoutInner {...props} />;
}

/** @deprecated Usar `app/account/layout.tsx` + export directo de la página. */
export function withAccountPage<P extends object>(Page: React.ComponentType<P>) {
  return Page;
}
