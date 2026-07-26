'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb);
  return () => window.removeEventListener('popstate', cb);
}

function getSearch() {
  return typeof window !== 'undefined' ? window.location.search : '';
}

export function useNav() {
  const search = useSyncExternalStore(subscribe, getSearch, () => '');
  const params = useMemo(
    () => new URLSearchParams(search.startsWith('?') ? search.slice(1) : search),
    [search]
  );
  const push = useCallback((href: string) => {
    window.location.href = href;
  }, []);
  const replace = useCallback((href: string) => {
    window.location.replace(href);
  }, []);
  return {
    params,
    push,
    replace,
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
  };
}
