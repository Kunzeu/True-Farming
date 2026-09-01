'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Cookie, Settings, BarChart3, Target, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

export default function CookiePolicyPage() {
  const { t, lang } = useI18n();
  usePageTitle('pageTitles.cookiePolicy', 'Cookie Policy');

  // Formatear fecha según el idioma actual
  const getLocaleDateString = () => {
    const localeMap: Record<string, string> = {
      'en': 'en-US',
      'es': 'es-ES',
      'de': 'de-DE',
      'fr': 'fr-FR'
    };
    const locale = localeMap[lang] || 'en-US';
    return new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen tf-site-bg">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('auth.backToHome', 'Back to Home')}</span>
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <h1 className="text-3xl font-bold text-white mb-2">{t('pageTitles.cookiePolicy', 'Cookie Policy')}</h1>
            <p className="text-gray-300">{t('legal.lastUpdated', 'Last updated')}: {getLocaleDateString()}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert max-w-none"
        >
          <div className="bg-slate-800/50 rounded-lg p-8 space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Cookie className="w-6 h-6 text-orange-400" />
                {t('legal.whatAreCookies', 'What Are Cookies?')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('legal.cookiesDescription', 'Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.')}
              </p>
            </section>

            {/* Types of Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Settings className="w-6 h-6 text-blue-400" />
                {t('legal.typesOfCookies', 'Types of Cookies We Use')}
              </h2>
              
              {/* Essential Cookies */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-green-300 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {t('legal.essentialCookies', 'Essential Cookies (Always Active)')}
                </h3>
                <p className="text-gray-300 mb-3">
                  {t('legal.essentialCookiesDesc', 'These cookies are necessary for the website to function properly and cannot be disabled.')}
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                  <li><strong>{t('legal.authentication', 'Authentication')}:</strong> {t('legal.rememberLogin', 'Remember your login status')}</li>
                  <li><strong>{t('legal.preferences', 'Preferences')}:</strong> {t('legal.rememberSettings', 'Remember your language and theme settings')}</li>
                </ul>
              </div>

              {/* Analytics Cookies */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-blue-300 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {t('legal.analyticsCookies', 'Analytics Cookies (Optional)')}
                </h3>
                <p className="text-gray-300 mb-3">
                  {t('legal.analyticsCookiesDesc', 'These cookies help us understand how visitors use our website so we can improve it.')}
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                  <li><strong>{t('legal.googleAnalytics', 'Google Analytics')}:</strong> {t('legal.trackPageViews', 'Track page views and user interactions')}</li>
                  <li><strong>{t('legal.performance', 'Performance')}:</strong> {t('legal.monitorSpeed', 'Monitor website speed and functionality')}</li>
                </ul>
              </div>

              {/* Advertising Cookies */}
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-purple-300 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {t('legal.marketingCookies', 'Advertising Cookies (Optional)')}
                </h3>
                <p className="text-gray-300 mb-3">
                  {t('legal.marketingCookiesDesc', 'These cookies are used to display relevant advertisements and measure their effectiveness.')}
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                  <li><strong>{t('legal.googleAdSense', 'Google AdSense')}:</strong> {t('legal.displayRelevantAds', 'Display relevant ads based on your interests')}</li>
                </ul>
              </div>
            </section>


            {/* Managing Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">{t('legal.managingCookiePreferences', 'Managing Your Cookie Preferences')}</h2>
              
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('legal.cookieBannerDesc', 'When you first visit our website, you\'ll see a cookie banner where you can choose which types of cookies to accept. You can change your preferences at any time by clicking the "Cookie Settings" link in our footer.')}
              </p>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-200 font-semibold mb-2">{t('legal.pleaseNote', 'Please note:')}</p>
                <ul className="list-disc list-inside text-yellow-200 space-y-1 ml-4">
                  <li>{t('legal.disablingEssentialCookies', 'Disabling essential cookies may prevent the website from functioning properly')}</li>
                  <li>{t('legal.preferencesNotSaved', 'Your preferences may not be saved between visits')}</li>
                </ul>
              </div>
            </section>


            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">{t('legal.contactUs', 'Contact Us')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('legal.contactUsDesc', 'If you have any questions about our use of cookies or this Cookie Policy, please contact us:')}
              </p>
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-gray-300">
                  <strong>Website:</strong> <a href="https://truefarming.com" className="text-blue-400 hover:text-blue-300">https://truefarming.com</a>
                </p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}

