import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.argv.includes('dev');
const mode = isDev ? 'development' : 'production';
const env = loadEnv(mode, root, '');

/** Client has no Node `process` — bake NEXT_PUBLIC_* at build time. */
function envDef(...keys) {
  const out = {};
  for (const key of keys) {
    out[`process.env.${key}`] = JSON.stringify(env[key] ?? process.env[key] ?? '');
  }
  return out;
}

export default defineConfig({
  output: 'server',
  adapter: isDev
    ? node({ mode: 'standalone' })
    : cloudflare({
        platformProxy: { enabled: false },
      }),
  integrations: [react()],
  vite: {
    server: {
      // tunnelmole / ngrok / etc.
      allowedHosts: ['.tunnelmole.net', '.loca.lt', '.ngrok-free.app', '.ngrok.io'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      ...envDef(
        'NEXT_PUBLIC_PATREON_CAMPAIGN_ID',
        'PATREON_CAMPAIGN_ID',
        'NEXT_PUBLIC_PATREON_CLIENT_ID',
        'NEXT_PUBLIC_PATREON_REDIRECT_URI',
        'NEXT_PUBLIC_DISCORD_CLIENT_ID',
        'NEXT_PUBLIC_DISCORD_REDIRECT_URI',
        'NEXT_PUBLIC_BASE_URL'
      ),
    },
    ssr: {
      optimizeDeps: {
        include: ['astro > picomatch'],
      },
    },
    resolve: {
      alias: {
        '@': path.join(root, 'src'),
        // Node/`astro dev` has no CF vite plugin — shim the module.
        ...(isDev
          ? { 'cloudflare:workers': path.join(root, 'src/shims/cloudflare-workers.ts') }
          : {}),
        'next/link': path.join(root, 'src/shims/next-link.tsx'),
        'next/image': path.join(root, 'src/shims/next-image.tsx'),
        'next/navigation': path.join(root, 'src/shims/next-navigation.ts'),
        'next/server': path.join(root, 'src/shims/next-server.ts'),
        'next/headers': path.join(root, 'src/shims/next-headers.ts'),
        'next/script': path.join(root, 'src/shims/next-script.tsx'),
        'next/font/google': path.join(root, 'src/shims/next-font.ts'),
        'next/head': path.join(root, 'src/shims/next-head.tsx'),
        'next/cache': path.join(root, 'src/shims/next-cache.ts'),
        'next/dynamic': path.join(root, 'src/shims/next-dynamic.tsx'),
      },
    },
  },
});
