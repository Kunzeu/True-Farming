'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
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
  const [showNoKey, setShowNoKey] = useState(false);

  useEffect(() => {
    try {
      const ls = typeof window !== 'undefined' ? window.localStorage : null;
      const ss = typeof window !== 'undefined' ? window.sessionStorage : null;
      const apiKey = ls ? ls.getItem('gw2_api_key') : null;
      const dismissed = ls ? ls.getItem('gw2_dismiss_no_api_key') === 'true' : false;
      const shownThisSession = ss ? ss.getItem('gw2_shown_no_api_key') === 'true' : false;
      if (dismissed) {
        setShowNoKey(false);
        return;
      }
      if ((!apiKey || apiKey.trim().length < 10) && !shownThisSession) {
        setShowNoKey(true);
        try { ss && ss.setItem('gw2_shown_no_api_key', 'true'); } catch {}
      }
    } catch {
      // Si localStorage falla, no forzar el modal
      setShowNoKey(false);
    }
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              {t('account.title', 'Your Account')}
            </h1>
            <p className="text-gray-300 mt-3">
              {t('account.subtitle', 'Access your Guild Wars 2 account tools')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map(({ href, icon: Icon, titleKey, fallback, descKey, fallbackDesc }) => (
              <Link key={href} href={href} className="group">
                <motion.div
                  whileHover={{ y: -4 }}
                  className="h-full p-6 rounded-2xl border border-gray-700/60 bg-gray-800/60 hover:border-blue-500/50 hover:bg-gray-800/80 transition-colors shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-white">{t(titleKey, fallback)}</h2>
                  </div>
                  <p className="text-gray-400 text-sm">{t(descKey, fallbackDesc)}</p>
                </motion.div>
              </Link>
            ))}
          </div>

          {showNoKey && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowNoKey(false)}></div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative max-w-md w-[90%] bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
              <button
                onClick={() => { try { localStorage.setItem('gw2_dismiss_no_api_key','true'); } catch {} ; setShowNoKey(false); }}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white"
                  aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-white mb-2">{t('account.noApiKeyTitle', 'No API key found')}
                </h3>
                <p className="text-gray-300 mb-5">{t('account.noApiKeyDesc', 'Add your Guild Wars 2 API key to enable account features.')}</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => { try { localStorage.setItem('gw2_dismiss_no_api_key','true'); } catch {} ; setShowNoKey(false); }}
                    className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800">
                    {t('common.later', 'Later')}
                  </button>
                  <Link
                    href="/profile"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                    {t('account.addApiKey', 'Add API key')}
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}


