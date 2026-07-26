'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb);
  return () => window.removeEventListener('popstate', cb);
}

function getSearch() {
  return typeof window !== 'undefined' ? window.location.search : '';
}

function getPathname() {
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

export function useRouter() {
  return {
    push: (href: string) => {
      window.location.href = href;
    },
    replace: (href: string) => {
      window.location.replace(href);
    },
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => window.location.reload(),
    prefetch: (_href: string) => {},
  };
}

export function usePathname() {
  return useSyncExternalStore(subscribe, getPathname, () => '/');
}

export function useSearchParams() {
  const search = useSyncExternalStore(subscribe, getSearch, () => '');
  return useMemo(() => new URLSearchParams(search.startsWith('?') ? search.slice(1) : search), [search]);
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  // ponytail: pages that need params should read from URL; empty default
  return {} as T;
}

export function redirect(url: string): never {
  if (typeof window !== 'undefined') window.location.href = url;
  throw new Error(`redirect:${url}`);
}

export function notFound(): never {
  throw new Error('NEXT_NOT_FOUND');
}
