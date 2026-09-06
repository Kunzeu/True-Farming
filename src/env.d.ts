/// <reference types="astro/client" />

type Env = {
  HYPERDRIVE?: { connectionString: string };
  ROUTES_IMAGES?: R2Bucket;
  DATABASE_URL?: string;
  POSTGRES_URL?: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
  ADMIN_USERNAMES?: string;
  ADMIN_EMAILS?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  NEXT_PUBLIC_APP_URL?: string;
  APP_URL?: string;
  PATREON_CLIENT_ID?: string;
  PATREON_CLIENT_SECRET?: string;
  PATREON_REDIRECT_URI?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  DISCORD_REDIRECT_URI?: string;
  PATREON_CAMPAIGN_ID?: string;
  PATREON_CREATOR_ACCESS_TOKEN?: string;
  PATREON_CREATOR_REFRESH_TOKEN?: string;
  SESSION?: KVNamespace;
  // Cloudflare Images / Assets — typed loosely; not used directly in app code yet
  IMAGES?: unknown;
  ASSETS?: unknown;
  PUBLIC_SITE_URL?: string;
};

declare module 'cloudflare:workers' {
  export const env: Env;
}
