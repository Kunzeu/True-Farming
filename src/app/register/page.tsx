'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import RegisterForm from '@/components/auth/RegisterForm';
import { 
  Gift, 
  Zap, 
  Heart, 
  Award,
  ArrowLeft,
  Home
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

export default function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  usePageTitle('pageTitles.register', 'Register');

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // ponytail: don't gate on isLoading — Astro SSR left a permanent spinner
  if (isAuthenticated && !isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Botón para volver al inicio */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm text-white rounded-lg transition-all duration-200 hover:scale-105">
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">{t('auth.backToHome', 'Back to Home')}</span>
        <Home className="w-4 h-4 sm:hidden" />
      </Link>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <RegisterForm />
      </div>

      {/* Right Side - Benefits */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-md mx-auto flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              {t('auth.joinCommunity', 'Join the Community')}
            </h1>
            <p className="text-lg text-blue-200 leading-relaxed mb-6">
              {t('auth.allFeaturesFree', 'All features are available at no cost.')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Gift className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">
                  {t('auth.accessFree', 'Access Free')}
                </h3>
                <p className="text-blue-200 text-sm">
                  {t('auth.allFeaturesFree', 'All features are available at no cost.')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">
                  {t('auth.realTimeData', 'Real-time Data')}
                </h3>
                <p className="text-lg text-blue-200 leading-relaxed mb-6">
                  {t('auth.realTimeDataDesc', 'Information constantly updated from the official GW2 API.')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Heart className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">
                  {t('auth.personalization', 'Personalization')}
                </h3>
                <p className="text-blue-200 text-sm">
                  {t('auth.personalizationDesc', 'Save your favorite items and preferred routes for quick access.')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Award className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">
                  {t('auth.activeCommunity', 'Active Community')}
                </h3>
                <p className="text-blue-200 text-sm">
                  {t('auth.activeCommunityDesc', 'Connect with other players and share your farming strategies.')}
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
} 