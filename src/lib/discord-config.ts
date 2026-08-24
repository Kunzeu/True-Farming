import { getClientOAuthRedirectUri } from '@/lib/oauth-redirect';

/** Discord OAuth client config (browser). */
export const getDiscordConfig = () => {
  const clientId =
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID?.trim() ||
    '1399450681126944939';
  const redirectUri = getClientOAuthRedirectUri(
    process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI,
    '/auth/discord/callback',
  );

  return {
    clientId,
    redirectUri,
    authUrl: `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email+identify`,
  };
};
