import { NextRequest, NextResponse } from 'next/server';
import { getWorkerEnvSync } from '@/lib/cf-env';

export const runtime = 'edge';;

function patreonEnv(key: 'PATREON_CLIENT_ID' | 'PATREON_CLIENT_SECRET' | 'PATREON_REDIRECT_URI'): string {
  const worker = getWorkerEnvSync();
  const fromWorker = worker?.[key];
  if (typeof fromWorker === 'string' && fromWorker.trim()) return fromWorker.trim();
  const fromProcess = process.env[key];
  return typeof fromProcess === 'string' ? fromProcess.trim() : '';
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      console.error('No authorization code provided');
      return NextResponse.json(
        { error: 'Código de autorización requerido' },
        { status: 400 }
      );
    }

    const clientId = patreonEnv('PATREON_CLIENT_ID');
    const clientSecret = patreonEnv('PATREON_CLIENT_SECRET');
    const redirectUri =
      patreonEnv('PATREON_REDIRECT_URI') || 'https://www.true-farming.com/auth/patreon/callback';

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
