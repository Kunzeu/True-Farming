const PROD_ORIGIN = 'https://www.true-farming.com';

/** Client-side OAuth callback URL: env at build time, else current origin. */
export function getClientOAuthRedirectUri(
  envRedirectUri: string | undefined,
  callbackPath: '/auth/patreon/callback' | '/auth/discord/callback',
): string {
  const fromEnv = envRedirectUri?.trim();
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${callbackPath}`;
  }

  return `${PROD_ORIGIN}${callbackPath}`;
}
