'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAccountGw2 } from '@/hooks/useAccountGw2';

export default function AccountInvalidApiKeyBanner() {
  const { t } = useI18n();
  const { hasApiKey, apiKeyValid, loading } = useAccountGw2();

  if (loading || !hasApiKey || apiKeyValid) return null;

  return (
    <div className="mb-6 rounded-xl border border-red-700/50 bg-red-900/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="font-medium text-red-200">
              {t('account.invalidApiKeyTitle', 'API key issue')}
            </p>
            <p className="mt-1 text-sm text-red-100/80">
              {t(
                'account.invalidApiKeyDesc',
                'Your API key may be invalid or missing required permissions. Update it in Settings.',
              )}
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
          {t('account.reviewApiKey', 'Review API key')}
        </Link>
      </div>
    </div>
  );
}
