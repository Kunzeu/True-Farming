import { NextRequest, NextResponse } from 'next/server';
import { getWorkerEnvSync } from '@/lib/cf-env';
import { resolveServerOAuthRedirectUri } from '@/lib/oauth-redirect';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body?.code === 'string' ? body.code : '';
    const requestedRedirect =
      typeof body?.redirect_uri === 'string' ? body.redirect_uri : null;

    if (!code) {
      console.error('No authorization code provided');
      return NextResponse.json(
        { error: 'Código de autorización requerido' },
        { status: 400 }
      );
    }

    const w = getWorkerEnvSync();
    const clientId = (
      w?.DISCORD_CLIENT_ID ||
      process.env.DISCORD_CLIENT_ID ||
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ||
      '1399450681126944939'
    ).trim();
    const clientSecret = (w?.DISCORD_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET || '').trim();
    const redirectUri = resolveServerOAuthRedirectUri({
      requested: requestedRedirect,
      originHeader: request.headers.get('origin'),
      envFallback:
        w?.DISCORD_REDIRECT_URI ||
        process.env.DISCORD_REDIRECT_URI ||
        process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI,
      callbackPath: '/auth/discord/callback',
    });

    console.log('Discord OAuth Config:', {
      clientId: clientId ? `Set (${clientId.substring(0, 10)}...)` : 'Missing',
      clientSecret: clientSecret ? 'Set' : 'Missing',
      redirectUri: redirectUri || 'Missing',
    });

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Discord OAuth environment variables:', {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        redirectUri: !!redirectUri,
      });
      return NextResponse.json(
        { error: 'Configuración de Discord OAuth incompleta' },
        { status: 500 }
      );
    }

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Error de Discord OAuth:', errorData);
      return NextResponse.json(
        { error: 'Error al obtener token de Discord' },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error('Error en Discord token API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
