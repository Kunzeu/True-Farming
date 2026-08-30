'use client';

import Link from 'next/link';
import { Key } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

type AccountNoApiKeyBannerProps = {
  messageKey?: string;
  messageFallback?: string;
};

export default function AccountNoApiKeyBanner({
  messageKey = 'account.noApiKeyDesc',
  messageFallback = 'Add your Guild Wars 2 API key to enable account features.',
}: AccountNoApiKeyBannerProps) {
  const { t } = useI18n();

  return (
    <div className="mb-6 rounded-xl border border-amber-700/50 bg-amber-900/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Key className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-medium text-amber-200">{t('account.noApiKeyTitle', 'No API key found')}</p>
            <p className="mt-1 text-sm text-amber-100/80">{t(messageKey, messageFallback)}</p>
          </div>
        </div>
        <Link
          href="/profile"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500">
          {t('account.addApiKey', 'Add API key')}
        </Link>
      </div>
    </div>
  );
}
