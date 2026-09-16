'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function DiscordCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithDiscord } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const processedRef = useRef(false);

  const processCallback = useCallback(async () => {
    if (processedRef.current) return;

    let code = searchParams.get('code');
    let error = searchParams.get('error');

    // Fallback lectura directa de window.location.search si searchParams aún no ha hidratado
    if (!code && !error && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      code = params.get('code');
      error = params.get('error');
    }

    console.log('Discord callback received:', { code: !!code, error });

    if (error) {
      processedRef.current = true;
      console.error('Discord OAuth error:', error);
      setStatus('error');
      setMessage(`Error en la autenticación de Discord: ${error}`);
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    if (!code) {
      // Si aún no hay parámetros en la URL y estamos en proceso de hidratación, esperar
      if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
        return; // Esperar al siguiente ciclo cuando los parámetros se lean correctamente
      }
      processedRef.current = true;
      console.error('No authorization code received');
      setStatus('error');
      setMessage('Código de autorización no encontrado');
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    processedRef.current = true;

    try {
      console.log('Starting Discord authentication...');
      await loginWithDiscord(code);
      setStatus('success');
      setMessage('¡Autenticación exitosa! Redirigiendo...');
      setTimeout(() => router.push('/'), 2000);
    } catch (error) {
      console.error('Error en Discord callback:', error);
      setStatus('error');
      setMessage(`Error al procesar la autenticación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setTimeout(() => router.push('/login'), 3000);
    }
  }, [searchParams, loginWithDiscord, router]);

  useEffect(() => {
    processCallback();
  }, [processCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Procesando autenticación...
              </h2>
              <p className="text-gray-400">
                Conectando con Discord
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                ¡Autenticación exitosa!
              </h2>
              <p className="text-gray-400">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Error de autenticación
              </h2>
              <p className="text-gray-400">
                {message}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiscordCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Cargando...
            </h2>
            <p className="text-gray-400">
              Preparando autenticación
            </p>
          </div>
        </div>
      </div>
    }>
      <DiscordCallbackContent />
    </Suspense>
  );
} 