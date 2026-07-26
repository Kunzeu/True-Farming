/** Shim for next/headers — no-ops / empty outside Astro request context. */

export async function cookies() {
  return {
    get(name: string) {
      if (typeof document === 'undefined') return undefined;
      const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
      return m ? { name, value: decodeURIComponent(m[1]) } : undefined;
    },
    getAll() {
      return [];
    },
    has() {
      return false;
    },
    set() {},
    delete() {},
  };
}

export async function headers() {
  return new Headers();
}

export async function draftMode() {
  return { isEnabled: false, enable() {}, disable() {} };
}
