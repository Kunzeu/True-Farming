'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchUserGw2ApiKey,
  readStoredGw2AccountName,
  storeGw2AccountInfo,
} from '@/lib/gw2-client-api';
import { fetchGw2AccountName } from '@/lib/gw2-client-account-data';

type AccountSummary = {
  hasApiKey: boolean;
  apiKeyValid: boolean;
};

type AccountGw2ContextValue = {
  userId?: string;
  summary: AccountSummary | null;
  hasApiKey: boolean;
  apiKeyValid: boolean;
  gw2AccountName: string | null;
  apiKey: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AccountGw2Context = createContext<AccountGw2ContextValue | null>(null);

export function AccountGw2Provider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [gw2AccountName, setGw2AccountName] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setSummary(null);
      setGw2AccountName(null);
      setApiKey(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [summaryResp, key] = await Promise.all([
        fetch(`/api/users/${user.id}/summary`, { cache: 'no-store' }),
        fetchUserGw2ApiKey(user.id),
      ]);

      if (!summaryResp.ok) {
        setSummary(null);
        setGw2AccountName(null);
        setApiKey(null);
        return;
      }

      const data = await summaryResp.json();
      const nextSummary: AccountSummary = {
        hasApiKey: !!data.hasApiKey,
        apiKeyValid: data.apiKeyValid !== false,
      };
      setSummary(nextSummary);
      setApiKey(nextSummary.hasApiKey ? key : null);

      if (!nextSummary.hasApiKey) {
        setGw2AccountName(null);
        return;
      }

      const storedName = readStoredGw2AccountName();
      if (storedName) {
        setGw2AccountName(storedName);
      } else if (key) {
        void fetchGw2AccountName(user.id, key).then((name) => {
          if (name) {
            setGw2AccountName(name);
            storeGw2AccountInfo(user.id, name);
          }
        });
      }
    } catch {
      setSummary(null);
      setGw2AccountName(null);
      setApiKey(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AccountGw2ContextValue>(
    () => ({
      userId: user?.id,
      summary,
      hasApiKey: summary?.hasApiKey ?? false,
      apiKeyValid: summary?.apiKeyValid ?? false,
      gw2AccountName,
      apiKey,
      loading,
      refresh,
    }),
    [user?.id, summary, gw2AccountName, apiKey, loading, refresh],
  );

  return <AccountGw2Context.Provider value={value}>{children}</AccountGw2Context.Provider>;
}

export function useAccountGw2() {
  const ctx = useContext(AccountGw2Context);
  if (!ctx) {
    throw new Error('useAccountGw2 must be used within AccountGw2Provider');
  }
  return ctx;
}
