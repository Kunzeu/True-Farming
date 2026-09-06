'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Eye, Database, Lock, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

export default function PrivacyPolicyPage() {
  const { t, lang } = useI18n();
  usePageTitle('pageTitles.privacyPolicy', 'Privacy Policy');

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
            <h1 className="text-3xl font-bold text-white mb-2">{t('pageTitles.privacyPolicy', 'Privacy Policy')}</h1>
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
                <Shield className="w-6 h-6 text-blue-400" />
                {t('privacy.introduction', 'Introduction')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacy.introductionDesc', 'True Farming ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services related to Guild Wars 2 farming optimization.')}
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Database className="w-6 h-6 text-green-400" />
                {t('privacy.informationWeCollect', 'Information We Collect')}
              </h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">{t('privacy.personalInformation', 'Personal Information')}</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('privacy.emailAddress', 'Email address (for account creation and communication)')}</li>
                <li>{t('privacy.username', 'Username (for display purposes)')}</li>
                <li>{t('privacy.discordId', 'Discord ID (if you choose to link your Discord account)')}</li>
                <li>{t('privacy.accountPreferences', 'Account preferences (theme, language, notification settings)')}</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">{t('privacy.usageInformation', 'Usage Information')}</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('privacy.pagesVisited', 'Pages visited and time spent on our website')}</li>
                <li>{t('privacy.featuresUsed', 'Features used and interactions with our tools')}</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">{t('privacy.guildWars2Data', 'Guild Wars 2 Data')}</h3>
              <p className="text-gray-300 mb-3">
                {t('privacy.guildWars2DataDesc', 'If you provide your Guild Wars 2 API key, we collect game data to personalize your experience:')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('privacy.characterData', 'Character data (names, levels, professions)')}</li>
                <li>{t('privacy.inventoryData', 'Inventory and bank data')}</li>
                <li>{t('privacy.walletData', 'Wallet and currency data')}</li>
                <li>{t('privacy.achievementData', 'Achievement and progress data')}</li>
                <li>{t('privacy.characterInfo', 'Character information (only if you provide API keys)')}</li>
                <li>{t('privacy.tradingPostData', 'Trading Post data and market information')}</li>
                <li>{t('privacy.noPrivateData', 'No private or sensitive game data is stored')}</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Eye className="w-6 h-6 text-purple-400" />
                {t('privacy.howWeUseInfo', 'How We Use Your Information')}
              </h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('privacy.provideServices', 'Provide and maintain our services')}</li>
                <li>{t('privacy.personalizeExperience', 'Personalize your experience and preferences')}</li>
                <li>{t('privacy.improveTools', 'Improve our tools and add new features')}</li>
                <li>{t('privacy.ensureSecurity', 'Ensure security and prevent abuse')}</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Lock className="w-6 h-6 text-red-400" />
                {t('privacy.dataSharing', 'Data Sharing')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('privacy.dataSharingDesc', 'We do not sell, trade, or rent your personal information to third parties. We may share your information only with trusted service providers who help us operate our website.')}
              </p>
            </section>


            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-cyan-400" />
                {t('privacy.yourRights', 'Your Rights')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('privacy.yourRightsDesc', 'You have the right to access, correct, or delete your personal data. You can manage most of these rights directly through your account settings or by contacting us.')}
              </p>
            </section>



          </div>
        </motion.div>
      </div>
    </div>
  );
}
