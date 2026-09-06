'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccountGw2 } from '@/hooks/useAccountGw2';
import { GW2_CACHE_TTL, readSessionCache, writeSessionCache } from '@/lib/gw2-client-cache';

type UseAccountGw2DataOptions<T> = {
  cacheKey: string | null;
  fetcher: () => Promise<T | null>;
};

export function useAccountGw2Data<T>({ cacheKey, fetcher }: UseAccountGw2DataOptions<T>) {
  const { apiKey, loading: gw2Loading } = useAccountGw2();
  const [data, setData] = useState<T | null>(() =>
    cacheKey ? readSessionCache<T>(cacheKey, GW2_CACHE_TTL.accountPage) : null,
  );
  const [isLoading, setIsLoading] = useState(() => !data);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const load = useCallback(
    async (options?: { forceLoading?: boolean }) => {
      if (!apiKey) return;

      const showSpinner = options?.forceLoading || dataRef.current == null;
      try {
        if (showSpinner) setIsLoading(true);
        else setIsRefreshing(true);
        setError(null);

        const result = await fetcher();
        if (result != null) {
          setData(result);
          if (cacheKey) writeSessionCache(cacheKey, result, GW2_CACHE_TTL.accountPage);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [apiKey, cacheKey, fetcher],
  );

  useEffect(() => {
    if (apiKey) void load();
    else if (!gw2Loading) setIsLoading(false);
  }, [apiKey, gw2Loading, load]);

  return { data, setData, isLoading, isRefreshing, error, setError, reload: load };
}
