import { useEffect, useRef } from 'react';
import { GW2_CACHE_TTL, readSessionCache } from '@/lib/gw2-client-cache';

/** Muestra datos cacheados al montar y evita parpadeo en revisitas. */
export function useAccountPageCache<T>(
  cacheKey: string | null,
  onCached: (data: T) => void,
): void {
  const applied = useRef(false);

  useEffect(() => {
    if (!cacheKey || applied.current) return;
    const cached = readSessionCache<T>(cacheKey, GW2_CACHE_TTL.accountPage);
    if (cached) {
      applied.current = true;
      onCached(cached);
    }
  }, [cacheKey, onCached]);
}
