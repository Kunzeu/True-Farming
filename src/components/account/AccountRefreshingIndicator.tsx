'use client';

import { Loader2 } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

export default function AccountRefreshingIndicator({ visible }: { visible: boolean }) {
  const { t } = useI18n();
  if (!visible) return null;

  return (
    <div className="mb-4 flex items-center gap-2 text-sm text-blue-300/90">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      <span>{t('account.refreshing', 'Updating…')}</span>
    </div>
  );
}
