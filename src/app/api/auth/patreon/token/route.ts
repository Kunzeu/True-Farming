import { NextRequest, NextResponse } from 'next/server';
import { getWorkerEnvSync } from '@/lib/cf-env';

export const runtime = 'edge';;

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Código de autorización requerido' },
        { status: 400 }
      );
    }

    const w = getWorkerEnvSync();
    const clientId = (
      w?.PATREON_CLIENT_ID ||
      process.env.PATREON_CLIENT_ID ||
      process.env.NEXT_PUBLIC_PATREON_CLIENT_ID ||
      ''
    ).trim();
    const clientSecret = (w?.PATREON_CLIENT_SECRET || process.env.PATREON_CLIENT_SECRET || '').trim();
    const redirectUri = (
      w?.PATREON_REDIRECT_URI ||
      process.env.PATREON_REDIRECT_URI ||
      process.env.NEXT_PUBLIC_PATREON_REDIRECT_URI ||
      'https://www.true-farming.com/auth/patreon/callback'
    ).trim();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Configuración de Patreon OAuth incompleta' },
        { status: 500 }
      );
    }

    const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Error de Patreon OAuth:', errorData);
      let errorMessage = 'Error al obtener token de Patreon';
      
      try {
        const parsedError = JSON.parse(errorData);
        errorMessage = parsedError.error_description || parsedError.error || errorMessage;
        console.error('Patreon OAuth Error Details:', {
          error: parsedError.error,
          error_description: parsedError.error_description,
          error_uri: parsedError.error_uri
        });
      } catch {
        console.error('Raw error response:', errorData);
      }
      
      return NextResponse.json(
        { error: errorMessage, details: errorData },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
    });

  } catch (error) {
    console.error('Error en Patreon token API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
