'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type AccountSummary = {
  hasApiKey: boolean;
  apiKeyValid: boolean;
};

export function useAccountGw2() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [gw2AccountName, setGw2AccountName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setSummary(null);
      setGw2AccountName(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const summaryResp = await fetch(`/api/users/${user.id}/summary`, { cache: 'no-store' });
      if (!summaryResp.ok) {
        setSummary(null);
        setGw2AccountName(null);
        return;
      }

      const data = await summaryResp.json();
      const nextSummary: AccountSummary = {
        hasApiKey: !!data.hasApiKey,
        apiKeyValid: data.apiKeyValid !== false,
      };
      setSummary(nextSummary);

      if (nextSummary.hasApiKey) {
        const accountResp = await fetch(`/api/gw2/account?user_id=${user.id}`, { cache: 'no-store' });
        if (accountResp.ok) {
          const account = await accountResp.json();
          setGw2AccountName(typeof account.name === 'string' ? account.name : null);
        } else {
          setGw2AccountName(null);
        }
      } else {
        setGw2AccountName(null);
      }
    } catch {
      setSummary(null);
      setGw2AccountName(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    userId: user?.id,
    summary,
    hasApiKey: summary?.hasApiKey ?? false,
    apiKeyValid: summary?.apiKeyValid ?? false,
    gw2AccountName,
    loading,
    refresh,
  };
}
