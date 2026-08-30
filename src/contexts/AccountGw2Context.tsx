'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchUserGw2ApiKey,
  readStoredGw2AccountName,
  storeGw2AccountInfo,
} from '@/lib/gw2-client-api';
import { fetchGw2AccountName } from '@/lib/gw2-client-account-data';
import { GW2_CACHE_TTL, readSessionCache, writeSessionCache } from '@/lib/gw2-client-cache';

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
  refreshing: boolean;
  refresh: () => Promise<void>;
};

const AccountGw2Context = createContext<AccountGw2ContextValue | null>(null);

type SessionGw2State = {
  summary: AccountSummary;
  apiKey: string | null;
  gw2AccountName: string | null;
};

function sessionKey(userId: string) {
  return `gw2_ctx_${userId}`;
}

function readSessionGw2State(userId: string): SessionGw2State | null {
  return readSessionCache<SessionGw2State>(sessionKey(userId), GW2_CACHE_TTL.accountPage);
}

function writeSessionGw2State(userId: string, state: SessionGw2State) {
  writeSessionCache(sessionKey(userId), state, GW2_CACHE_TTL.accountPage);
}

// Singleton en memoria para remounts rápidos en la misma pestaña (Astro full-page nav).
let memoryState: { userId: string; state: SessionGw2State } | null = null;

function readMemoryGw2State(userId: string): SessionGw2State | null {
  if (memoryState?.userId === userId) return memoryState.state;
  return null;
}

export function AccountGw2Provider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const initial = useMemo(() => {
    if (!userId) return null;
    return readMemoryGw2State(userId) ?? readSessionGw2State(userId);
  }, [userId]);

  const [summary, setSummary] = useState<AccountSummary | null>(initial?.summary ?? null);
  const [gw2AccountName, setGw2AccountName] = useState<string | null>(
    initial?.gw2AccountName ?? readStoredGw2AccountName(),
  );
  const [apiKey, setApiKey] = useState<string | null>(initial?.apiKey ?? null);
  const [loading, setLoading] = useState(!initial);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applyState = useCallback(
    (next: SessionGw2State) => {
      setSummary(next.summary);
      setApiKey(next.apiKey);
      setGw2AccountName(next.gw2AccountName);
      if (userId) {
        memoryState = { userId, state: next };
        writeSessionGw2State(userId, next);
      }
    },
    [userId],
  );

  const refresh = useCallback(async () => {
    if (!userId) {
      setSummary(null);
      setGw2AccountName(null);
      setApiKey(null);
      setLoading(false);
      setRefreshing(false);
      memoryState = null;
      return;
    }

    const hasCached = !!(memoryState?.userId === userId || readSessionGw2State(userId));
    if (hasCached) {
      setLoading(false);
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [summaryResp, key] = await Promise.all([
        fetch(`/api/users/${userId}/summary`, { cache: 'no-store' }),
        fetchUserGw2ApiKey(userId),
      ]);

      if (!summaryResp.ok) {
        if (mountedRef.current) {
          setSummary(null);
          setGw2AccountName(null);
          setApiKey(null);
        }
        return;
      }

      const data = await summaryResp.json();
      const nextSummary: AccountSummary = {
        hasApiKey: !!data.hasApiKey,
        apiKeyValid: data.apiKeyValid !== false,
      };
      const nextKey = nextSummary.hasApiKey ? key : null;
      let nextName = readStoredGw2AccountName();

      if (!nextSummary.hasApiKey) {
        if (mountedRef.current) {
          applyState({ summary: nextSummary, apiKey: null, gw2AccountName: null });
        }
        return;
      }

      if (!nextName && nextKey) {
        void fetchGw2AccountName(userId, nextKey).then((name) => {
          if (!mountedRef.current || !name) return;
          setGw2AccountName(name);
          storeGw2AccountInfo(userId, name);
          const current = memoryState?.state;
          if (current && memoryState?.userId === userId) {
            writeSessionGw2State(userId, { ...current, gw2AccountName: name });
            memoryState = { userId, state: { ...current, gw2AccountName: name } };
          }
        });
      }

      if (mountedRef.current) {
        applyState({
          summary: nextSummary,
          apiKey: nextKey,
          gw2AccountName: nextName,
        });
      }
    } catch {
      if (mountedRef.current) {
        setSummary(null);
        setGw2AccountName(null);
        setApiKey(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [userId, applyState]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AccountGw2ContextValue>(
    () => ({
      userId,
      summary,
      hasApiKey: summary?.hasApiKey ?? false,
      apiKeyValid: summary?.apiKeyValid ?? false,
      gw2AccountName,
      apiKey,
      loading,
      refreshing,
      refresh,
    }),
    [userId, summary, gw2AccountName, apiKey, loading, refreshing, refresh],
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
