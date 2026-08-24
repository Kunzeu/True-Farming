'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { RegisterCredentials } from '@/types/auth';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { validateEmailFormat, validateEmailUnique } from '@/utils/emailValidation';
import { validatePasswordStrength } from '@/lib/password-utils';
import Link from 'next/link';
import { getClientOAuthRedirectUri } from '@/lib/oauth-redirect';

export default function RegisterForm() {
  const { register, isLoading, error, clearError } = useAuth();
  const { t, lang } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterCredentials>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validation, setValidation] = useState({
    username: { isValid: false, message: '' },
    email: { isValid: false, message: '' },
    password: { isValid: false, message: '' },
    confirmPassword: { isValid: false, message: '' },
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
      notCommon: true
    }
  });

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return { isValid: false, message: t('validation.password.minLength') };
    }
    if (password.length > 50) {
      return { isValid: false, message: t('validation.password.maxLength') };
    }
    
    // Usar validación de fortaleza para análisis detallado
    const strengthResult = validatePasswordStrength(password, t);
    
    // Actualizar estado de fortaleza
    setPasswordStrength({
      score: strengthResult.score,
      requirements: {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        notCommon: true // Siempre true para no mostrar el mensaje de común
      }
    });
    
    // Para el formulario, solo requerir longitud mínima básica (6 caracteres)
    // La validación de fortaleza es solo informativa
    // Solo mostramos errores de fortaleza si la contraseña cumple los requisitos básicos
    let firstError = '';
    if (password.length >= 6) {
      // Solo mostrar errores de fortaleza si la contraseña es lo suficientemente larga
      firstError = strengthResult.errors[0] || '';
    }
    return { isValid: password.length >= 6, message: firstError };
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (confirmPassword !== password) {
      return { isValid: false, message: t('validation.password.noMatch') };
    }
    return { isValid: true, message: '' };
  };

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'username':
        if (value.length < 3) {
          return { isValid: false, message: t('validation.username.minLength') };
        }
        if (value.length > 20) {
          return { isValid: false, message: t('validation.username.maxLength') };
        }
        return { isValid: true, message: '' };

      case 'email':
        return validateEmailFormat(value, t);

      case 'password':
        return validatePassword(value);

      case 'confirmPassword':
        return validateConfirmPassword(value, formData.password);

      default:
        return { isValid: false, message: '' };
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validar campo en tiempo real
    const fieldValidation = validateField(name, value);
    setValidation({
      ...validation,
      [name]: fieldValidation,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validar todos los campos
    const usernameValidation = validateField('username', formData.username);
    const emailValidation = validateField('email', formData.email);
    const passwordValidation = validateField('password', formData.password);
    const confirmPasswordValidation = validateField('confirmPassword', formData.confirmPassword);

    // Validación adicional de email único
    let finalEmailValidation = emailValidation;
    if (emailValidation.isValid) {
      finalEmailValidation = await validateEmailUnique(formData.email, t);
    }

    setValidation({
      username: usernameValidation,
      email: finalEmailValidation,
      password: passwordValidation,
      confirmPassword: confirmPasswordValidation,
    });

    // Verificar si todos los campos son válidos
    if (usernameValidation.isValid && finalEmailValidation.isValid && 
        passwordValidation.isValid && confirmPasswordValidation.isValid) {
      
      // Validación adicional de fortaleza de contraseña antes de enviar
      const strengthResult = validatePasswordStrength(formData.password, t);
      if (!strengthResult.isValid) {
        // Mostrar el primer error de fortaleza
        setValidation(prev => ({
          ...prev,
          password: { isValid: false, message: strengthResult.errors[0] }
        }));
        return;
      }
      
      await register({ ...formData, locale: lang });
    }
  };

  const handleDiscordRegister = () => {
    const redirectUri = getClientOAuthRedirectUri(
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI,
      '/auth/discord/callback',
    );

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email`;
    window.location.href = discordAuthUrl;
  };

  // Verificar si será el primer usuario
  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const { getDbService } = await import('@/lib/database-switch');
        const dbService = await getDbService();
        const users = await dbService.getAllUsers();
        setIsFirstUser(users.length === 0);
      } catch (error) {
        console.error('Error checking first user:', error);
        // Si hay error, asumir que no es el primer usuario
        setIsFirstUser(false);
      }
    };

    checkFirstUser();
  }, []);

  const isFormValid = () => {
    return Object.values(validation).every(field => field.isValid);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto">
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {t('auth.registerTitle', 'Create Account')}
          </h2>
          <p className="text-gray-300 text-center">
            {t('auth.registerSubtitle', 'Join the True Farming community')}
          </p>
          
          {/* Indicador de primer usuario */}
          {isFirstUser && (
            <div className="mt-4 bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
              <p className="text-yellow-300 text-sm font-medium">
                🎉 {t('auth.firstAdmin', 'You will be the first administrator!')}
              </p>
              <p className="text-yellow-400 text-xs mt-1">
                {t('auth.firstAdminDesc', 'The first user registered will obtain administrator permissions')}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              {t('auth.username', 'Username')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-10 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validation.username.isValid 
                    ? 'border-green-600' 
                    : formData.username 
                    ? 'border-red-600' 
                    : 'border-gray-600'
                }`}
                placeholder={t('auth.usernamePlaceholder', 'Your username')}
              />
              {validation.username.isValid && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
              )}
            </div>
            {formData.username && !validation.username.isValid && (
              <p className="text-red-400 text-xs mt-1">{validation.username.message}</p>
            )}
          </div>

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
                className={`w-full pl-10 pr-10 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validation.email.isValid 
                    ? 'border-green-600' 
                    : formData.email 
                    ? 'border-red-600' 
                    : 'border-gray-600'
                }`}
                placeholder={t('auth.emailPlaceholder', 'your@email.com')}
              />
              {validation.email.isValid && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
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
                className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validation.password.isValid 
                    ? 'border-green-600' 
                    : formData.password 
                    ? 'border-red-600' 
                    : 'border-gray-600'
                }`}
                placeholder={t('auth.passwordPlaceholder', '••••••••')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.password && !validation.password.isValid && (
              <p className="text-red-400 text-xs mt-1">{validation.password.message}</p>
            )}
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-3 space-y-2">
                {/* Strength Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score === 0 ? 'w-0' :
                        passwordStrength.score === 1 ? 'w-1/4 bg-red-500' :
                        passwordStrength.score === 2 ? 'w-2/4 bg-orange-500' :
                        passwordStrength.score === 3 ? 'w-3/4 bg-yellow-500' :
                        'w-full bg-green-500'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength.score === 0 ? 'text-gray-400' :
                    passwordStrength.score === 1 ? 'text-red-400' :
                    passwordStrength.score === 2 ? 'text-orange-400' :
                    passwordStrength.score === 3 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {passwordStrength.score === 0 ? t('auth.passwordStrength.veryWeak', 'Very Weak') :
                     passwordStrength.score === 1 ? t('auth.passwordStrength.weak', 'Weak') :
                     passwordStrength.score === 2 ? t('auth.passwordStrength.fair', 'Fair') :
                     passwordStrength.score === 3 ? t('auth.passwordStrength.good', 'Good') :
                     t('auth.passwordStrength.strong', 'Strong')}
                  </span>
                </div>
                
                {/* Requirements Checklist */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 italic">
                    {t('auth.passwordStrength.recommended', 'Recomendado para mayor seguridad:')}
                  </p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className={`flex items-center gap-2 ${passwordStrength.requirements.length ? 'text-green-400' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3 h-3 ${passwordStrength.requirements.length ? 'text-green-400' : 'text-gray-600'}`} />
                      <span>{t('validation.password.strength.minLength')}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.requirements.uppercase ? 'text-green-400' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3 h-3 ${passwordStrength.requirements.uppercase ? 'text-green-400' : 'text-gray-600'}`} />
                      <span>{t('validation.password.strength.uppercase')}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.requirements.lowercase ? 'text-green-400' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3 h-3 ${passwordStrength.requirements.lowercase ? 'text-green-400' : 'text-gray-600'}`} />
                      <span>{t('validation.password.strength.lowercase')}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.requirements.number ? 'text-green-400' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3 h-3 ${passwordStrength.requirements.number ? 'text-green-400' : 'text-gray-600'}`} />
                      <span>{t('validation.password.strength.number')}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.requirements.special ? 'text-green-400' : 'text-gray-400'}`}>
                      <CheckCircle className={`w-3 h-3 ${passwordStrength.requirements.special ? 'text-green-400' : 'text-gray-600'}`} />
                      <span>{t('validation.password.strength.special')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              {t('auth.confirmPassword', 'Confirm Password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validation.confirmPassword.isValid 
                    ? 'border-green-600' 
                    : formData.confirmPassword 
                    ? 'border-red-600' 
                    : 'border-gray-600'
                }`}
                placeholder={t('auth.passwordPlaceholder', '••••••••')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300">
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirmPassword && !validation.confirmPassword.isValid && (
              <p className="text-red-400 text-xs mt-1">{validation.confirmPassword.message}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('auth.registering', 'Creating account...')}
              </>
            ) : (
              t('auth.createAccount', 'Create Account')
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

        {/* Discord Register Button */}
        <button
          type="button"
          onClick={handleDiscordRegister}
          className="w-full py-3 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          {t('auth.registerWithDiscord', 'Register with Discord')}
        </button>

        {/* Links */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {t('auth.haveAccount', 'Already have an account?')}{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 underline">
              {t('auth.logInHere', 'Log in here')}
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
} 