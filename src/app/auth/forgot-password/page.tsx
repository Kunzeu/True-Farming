'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale: lang }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus('error');
        setMessage(
          data.error ||
            t('auth.resetEmailFailed', 'No se pudo procesar la solicitud, intenta de nuevo.')
        );
        return;
      }

      setStatus('success');
      setMessage(t('auth.resetEmailSent', 'Si el correo existe, te enviamos instrucciones para restablecer la contraseña.'));
    } catch {
      setStatus('error');
      setMessage(t('auth.resetEmailFailed', 'No se pudo procesar la solicitud, intenta de nuevo.'));
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
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              {t('auth.forgotPassword', '¿Olvidaste tu contraseña?')}
            </h1>
            <Link href="/login" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('auth.backToLogin', 'Volver a iniciar sesión')}
            </Link>
          </div>

          {status !== 'idle' && message && (
            <div className={`mb-4 p-3 rounded border flex items-center gap-2 ${
              status === 'success' ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-red-900/20 border-red-700 text-red-300'
            }`}>
              {status === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm">{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.email', 'Correo electrónico')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('auth.emailPlaceholder', 'tu@email.com')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              {isSubmitting ? t('auth.sending', 'Enviando...') : t('auth.sendResetLink', 'Enviar enlace de restablecimiento')}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}


