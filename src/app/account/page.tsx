'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import AccountLayout from '@/components/account/AccountLayout';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import { Wallet, Settings, Search, Archive, Users, Boxes, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const cards = [
  { href: '/profile', icon: Settings, titleKey: 'account.settings', fallback: 'Settings', descKey: 'account.settingsDesc', fallbackDesc: 'Manage your account preferences.' },
  { href: '/account/wallet', icon: Wallet, titleKey: 'account.wallet', fallback: 'Wallet', descKey: 'account.walletDesc', fallbackDesc: 'View your in-game currencies.' },
  { href: '/account/bank', icon: Boxes, titleKey: 'account.bank', fallback: 'Bank', descKey: 'account.bankDesc', fallbackDesc: 'Check bank items and materials.' },
  { href: '/account/storage', icon: Archive, titleKey: 'account.storage', fallback: 'Storage', descKey: 'account.storageDesc', fallbackDesc: 'Browse your material storage.' },
  { href: '/account/characters', icon: Users, titleKey: 'account.characters', fallback: 'Characters', descKey: 'account.charactersDesc', fallbackDesc: 'See your characters and details.' },
  { href: '/account/search', icon: Search, titleKey: 'account.search', fallback: 'Search', descKey: 'account.searchDesc', fallbackDesc: 'Search across your account data.' },
];

export default function AccountIndexPage() {
  const { t } = useI18n();
  usePageTitle('pageTitles.account', 'Account');
  const { hasApiKey, loading } = useAccountGw2();
  const [showNoKey, setShowNoKey] = useState(false);

  useEffect(() => {
    try {
      const ls = typeof window !== 'undefined' ? window.localStorage : null;
      const ss = typeof window !== 'undefined' ? window.sessionStorage : null;
      const dismissed = ls ? ls.getItem('gw2_dismiss_no_api_key') === 'true' : false;
      const shownThisSession = ss ? ss.getItem('gw2_shown_no_api_key') === 'true' : false;
      if (dismissed) {
        setShowNoKey(false);
        return;
      }
      if (!loading && !hasApiKey && !shownThisSession) {
        setShowNoKey(true);
        try {
          ss?.setItem('gw2_shown_no_api_key', 'true');
        } catch {
          /* ignore */
        }
      }
    } catch {
      setShowNoKey(false);
    }
  }, [hasApiKey, loading]);

  return (
    <AccountLayout
      section="overview"
      title={t('account.title', 'Your Account')}
      subtitle={t('account.subtitle', 'Access your Guild Wars 2 account tools')}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, icon: Icon, titleKey, fallback, descKey, fallbackDesc }) => (
          <Link key={href} href={href} className="group">
            <motion.div
              whileHover={{ y: -4 }}
              className="h-full rounded-2xl border border-gray-700/60 bg-gray-800/60 p-6 shadow-lg transition-colors hover:border-blue-500/50 hover:bg-gray-800/80">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/20 p-2 text-blue-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-white">{t(titleKey, fallback)}</h2>
              </div>
              <p className="text-sm text-gray-400">{t(descKey, fallbackDesc)}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      {showNoKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowNoKey(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-[90%] max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <button
              onClick={() => {
                try {
                  localStorage.setItem('gw2_dismiss_no_api_key', 'true');
                } catch {
                  /* ignore */
                }
                setShowNoKey(false);
              }}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
              aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-2 text-xl font-bold text-white">{t('account.noApiKeyTitle', 'No API key found')}</h3>
            <p className="mb-5 text-gray-300">
              {t('account.noApiKeyDesc', 'Add your Guild Wars 2 API key to enable account features.')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('gw2_dismiss_no_api_key', 'true');
                  } catch {
                    /* ignore */
                  }
                  setShowNoKey(false);
                }}
                className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800">
                {t('common.later', 'Later')}
              </button>
              <Link href="/profile" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                {t('account.addApiKey', 'Add API key')}
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AccountLayout>
  );
}
