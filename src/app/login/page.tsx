'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  ArrowLeft,
  Home
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  usePageTitle('pageTitles.login', 'Login');

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // ponytail: show form while auth boots — gating on isLoading left a permanent spinner under Astro SSR
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
        <LoginForm />
      </div>

      {/* Right Side - Features */}
      <div className="hidden lg:flex flex-1 tf-site-bg p-8">
        <div className="max-w-md mx-auto flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12">
            <h1 className="text-3xl font-bold text-white mb-2">
              True Farming
            </h1>
            <p className="text-xl text-blue-200">
              {t('auth.loginSubtitle', 'Your information hub for Guild Wars 2')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">
                  {t('dashboard.tradingPost.title', 'Real-Time Prices')}
                </h3>
                <p className="text-blue-200 text-sm">
                  {t('dashboard.tradingPost.description', 'Access up-to-date Trading Post prices and market analysis.')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">
                  {t('dashboard.farms.title', 'Optimized Routes')}
                </h3>
                <p className="text-blue-200 text-sm">
                  {t('dashboard.farms.description', 'Discover the best farming routes to maximize your profits.')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">
                  {t('dashboard.community.title', 'Active Community')}
                </h3>
                <p className="text-blue-200 text-sm">
                  {t('dashboard.community.description', 'Connect with other players and share farming strategies.')}
                </p>
              </div>
            </div>

          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 text-center">
            <p className="text-gray-300 text-center">
              {t('auth.trustMessage', 'Join thousands of players who already trust True Farming')}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 