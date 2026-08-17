'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function PatreonCallbackContent() {
  const router = useRouter();
  const { user, loginWithPatreon, linkPatreon } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const state = params.get('state');

    if (error) {
      hasRunRef.current = true;
      setStatus('error');
      setMessage(`Error en la autenticación de Patreon: ${error}`);
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    if (!code) {
      hasRunRef.current = true;
      setStatus('error');
      setMessage('Código de autorización no encontrado');
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    hasRunRef.current = true;
    const hasValidSession =
      !!user ||
      (!!localStorage.getItem('gw2_user') && !!localStorage.getItem('gw2_token'));

    (async () => {
      try {
        if (state === 'link' && hasValidSession) {
          await linkPatreon(code);
        } else {
          await loginWithPatreon(code);
        }
        setStatus('success');
        setMessage('¡Autenticación exitosa! Redirigiendo...');
        setTimeout(() => router.push('/profile'), 2000);
      } catch (err) {
        setStatus('error');
        setMessage(
          `Error al procesar la autenticación: ${err instanceof Error ? err.message : 'Error desconocido'}`
        );
        setTimeout(() => router.push('/login'), 3000);
      }
    })();
  }, [user, loginWithPatreon, linkPatreon, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-[#FF424D] animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Procesando autenticación...
              </h2>
              <p className="text-gray-400">
                Conectando con Patreon
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

export default function PatreonCallbackPage() {
  return <PatreonCallbackContent />;
}
