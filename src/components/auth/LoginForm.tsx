'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { LoginCredentials } from '@/types/auth';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { validateEmailForLogin } from '@/utils/emailValidation';
import { getClientOAuthRedirectUri } from '@/lib/oauth-redirect';

export default function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();
  const { t, lang } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [validation, setValidation] = useState({
    email: { isValid: false, message: '' },
  });
  const [resendMessage, setResendMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const emailNotVerified = error === 'EMAIL_NOT_VERIFIED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setResendMessage('');

    // Validar email
    const emailValidation = validateEmailForLogin(formData.email);
    setValidation({ email: emailValidation });

    if (emailValidation.isValid) {
      await login(formData);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) return;

    setIsResending(true);
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, locale: lang }),
      });
      const data = await response.json();

      if (!response.ok) {
        setResendMessage(data.error || t('auth.verificationResendFailed', 'No se pudo reenviar el email.'));
        return;
      }

      setResendMessage(t('auth.verificationResent', 'Si el correo existe y no está verificado, enviamos un nuevo enlace.'));
    } catch {
      setResendMessage(t('auth.verificationResendFailed', 'No se pudo reenviar el email.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validar email en tiempo real
    if (name === 'email') {
      const emailValidation = validateEmailForLogin(value);
      setValidation({ email: emailValidation });
    }
  };

  const handleDiscordLogin = () => {
    const redirectUri = getClientOAuthRedirectUri(
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI,
      '/auth/discord/callback',
    );

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email`;
    window.location.href = discordAuthUrl;
  };

  const handlePatreonLogin = () => {
    const redirectUri = getClientOAuthRedirectUri(
      process.env.NEXT_PUBLIC_PATREON_REDIRECT_URI,
      '/auth/patreon/callback',
    );

    const patreonAuthUrl = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_PATREON_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identity identity[email] identity.memberships`;
    window.location.href = patreonAuthUrl;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto">
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {t('auth.loginTitle', 'Log In')}
          </h2>
          <p className="text-gray-400">
            {t('auth.loginSubtitle', 'Access your account to customize your experience')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              {t('auth.email', 'Email Address')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validation.email.isValid
                    ? 'border-green-500'
                    : formData.email
                    ? 'border-red-500'
                    : 'border-gray-600'
                }`}
                placeholder={t('auth.emailPlaceholder', 'tu@email.com')}
              />
              {validation.email.isValid && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
              )}
              {formData.email && !validation.email.isValid && (
                <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 w-5 h-5" />
              )}
            </div>
            {formData.email && !validation.email.isValid && (
              <p className="text-red-400 text-xs mt-1">{validation.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              {t('auth.password', 'Password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('auth.passwordPlaceholder', '••••••••')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">
                  {emailNotVerified
                    ? t('auth.emailNotVerified', 'Confirma tu email antes de iniciar sesión.')
                    : error}
                </span>
              </div>
              {emailNotVerified && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="mt-3 text-sm text-blue-400 hover:text-blue-300 underline disabled:text-gray-500"
                >
                  {isResending
                    ? t('auth.sending', 'Enviando...')
                    : t('auth.resendVerification', 'Reenviar email de confirmación')}
                </button>
              )}
            </motion.div>
          )}

          {resendMessage && (
            <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-300 text-sm">
              {resendMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('auth.loggingIn', 'Logging in...')}
              </>
            ) : (
              t('auth.login', 'Log In')
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">{t('auth.orContinueWith', 'Or continue with')}</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          {/* Discord Login Button */}
          <button
            type="button"
            onClick={handleDiscordLogin}
            className="w-full py-3 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            {t('auth.continueWithDiscord', 'Continue with Discord')}
          </button>

          {/* Patreon Login Button */}
          <button
            type="button"
            onClick={handlePatreonLogin}
            className="w-full py-3 px-4 bg-[#FF424D] hover:bg-[#E03238] text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.386 2c-3.967 0-7.192 3.225-7.192 7.192 0 3.967 3.225 7.191 7.192 7.191 3.967 0 7.191-3.224 7.191-7.191C22.577 5.225 19.353 2 15.386 2zM1.423 2v20h5.735V2H1.423z"/>
            </svg>
            {t('auth.continueWithPatreon', 'Continue with Patreon')}
          </button>
        </div>

        {/* Links */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm mb-2">
            <a href="/auth/forgot-password" className="text-blue-400 hover:text-blue-300 font-medium">
              {t('auth.forgotPassword', '¿Olvidaste tu contraseña?')}
            </a>
          </p>
          <p className="text-gray-400 text-sm">
            {t('auth.noAccount', 'Don\'t have an account?')}{' '}
            <a href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              {t('auth.signUpHere', 'Sign up here')}
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
} 