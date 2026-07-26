import type { ReactNode } from 'react';
import { useEffect } from 'react';

/** Shim for next/head — applies title/meta on client. */
export default function Head({ children }: { children?: ReactNode }) {
  useEffect(() => {
    // ponytail: layout owns real <head>; ignore per-page next/head
  }, [children]);
  return null;
}
