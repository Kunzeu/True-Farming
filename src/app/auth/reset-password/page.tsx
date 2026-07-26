'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Lock } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

function ResetPasswordContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage(t('auth.passwordsDontMatch', 'Las contraseñas no coinciden'));
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || t('auth.resetFailed', 'No se pudo restablecer la contraseña.'));
        return;
      }

      setStatus('success');
      setMessage(t('auth.resetSuccess', 'Contraseña actualizada. Ya puedes iniciar sesión.'));
      setTimeout(() => router.push('/login'), 2500);
    } catch {
      setStatus('error');
      setMessage(t('auth.resetFailed', 'No se pudo restablecer la contraseña.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-white">
              {t('auth.resetPasswordTitle', 'Nueva contraseña')}
            </h1>
            <Link href="/login" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm shrink-0">
              <ArrowLeft className="w-4 h-4" />
              {t('auth.backToLogin', 'Volver a iniciar sesión')}
            </Link>
          </div>

          {status !== 'idle' && message && (
            <div className={`mb-4 p-3 rounded border flex items-center gap-2 ${
              status === 'success'
                ? 'bg-green-900/20 border-green-700 text-green-300'
                : 'bg-red-900/20 border-red-700 text-red-300'
            }`}>
              {status === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm">{message}</span>
            </div>
          )}

          {!token ? (
            <p className="text-sm text-red-300">
              {t('auth.resetInvalidLink', 'Enlace de restablecimiento inválido o incompleto.')}
            </p>
          ) : status === 'success' ? (
            <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm underline">
              {t('auth.goToLogin', 'Ir al Login')}
            </Link>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('auth.newPassword', 'Nueva contraseña')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    maxLength={50}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('auth.confirmPassword', 'Confirmar contraseña')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    maxLength={50}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                {isSubmitting
                  ? t('auth.saving', 'Guardando...')
                  : t('auth.resetPasswordSubmit', 'Cambiar contraseña')}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
