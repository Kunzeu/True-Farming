const PROD_ORIGIN = 'https://www.true-farming.com';

const OAUTH_CALLBACK = {
  patreon: '/auth/patreon/callback',
  discord: '/auth/discord/callback',
} as const;

export type OAuthCallbackPath = (typeof OAUTH_CALLBACK)[keyof typeof OAUTH_CALLBACK];

const ALLOWED_OAUTH_ORIGINS = new Set([
  'https://www.true-farming.com',
  'https://true-farming.com',
  'https://qa.true-farming.com',
  'http://localhost:4321',
  'http://localhost:3000',
  'http://127.0.0.1:4321',
  'http://127.0.0.1:3000',
]);

/** Apex → www so Discord/Patreon get the registered prod URI. */
export function normalizeOAuthOrigin(origin: string): string {
  if (origin === 'https://true-farming.com') return PROD_ORIGIN;
  return origin.replace(/\/$/, '');
}

/**
 * Client redirect_uri for OAuth.
 * Prefer the current browser origin so QA/prod/local always match the host
 * you are on (baked NEXT_PUBLIC_* can be wrong on Workers Builds).
 */
export function getClientOAuthRedirectUri(
  _envRedirectUri: string | undefined,
  callbackPath: OAuthCallbackPath,
): string {
  if (typeof window !== 'undefined') {
    return `${normalizeOAuthOrigin(window.location.origin)}${callbackPath}`;
  }

  return `${PROD_ORIGIN}${callbackPath}`;
}

/** Server: only allow known origins (body/Origin), else env fallback. */
export function resolveServerOAuthRedirectUri(options: {
  requested?: string | null;
  originHeader?: string | null;
  envFallback?: string | null;
  callbackPath: OAuthCallbackPath;
}): string {
  const candidates = [options.requested, options.originHeader]
    .map((v) => v?.trim())
    .filter(Boolean) as string[];

  for (const raw of candidates) {
    try {
      const url = raw.includes('://') ? new URL(raw) : null;
      if (url) {
        const origin = normalizeOAuthOrigin(url.origin);
        if (ALLOWED_OAUTH_ORIGINS.has(origin) || ALLOWED_OAUTH_ORIGINS.has(url.origin)) {
          // Full callback URL or just origin
          if (url.pathname && url.pathname !== '/') {
            return `${origin}${url.pathname}`;
          }
          return `${origin}${options.callbackPath}`;
        }
      } else {
        const origin = normalizeOAuthOrigin(raw.replace(/\/$/, ''));
        if (ALLOWED_OAUTH_ORIGINS.has(origin)) {
          return `${origin}${options.callbackPath}`;
        }
      }
    } catch {
      /* ignore */
    }
  }

  const fromEnv = options.envFallback?.trim();
  if (fromEnv) return fromEnv;

  return `${PROD_ORIGIN}${options.callbackPath}`;
}

export { OAUTH_CALLBACK };
