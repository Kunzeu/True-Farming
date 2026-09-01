'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, FileText, AlertTriangle, Shield, Gavel, Users } from 'lucide-react';
import Link from 'next/link';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

export default function TermsOfServicePage() {
  const { t, lang } = useI18n();
  usePageTitle('pageTitles.termsOfService', 'Términos de Servicio');

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
              <span>{t('auth.backToHome')}</span>
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <h1 className="text-3xl font-bold text-white mb-2">{t('termsOfService.title')}</h1>
            <p className="text-gray-300">{t('termsOfService.lastUpdated')}: {getLocaleDateString()}</p>
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
            
            {/* Introducción */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                {t('termsOfService.agreementToTerms')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsOfService.agreementDescription')}
              </p>
            </section>

            {/* Descripción del Servicio */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-purple-400" />
                {t('termsOfService.serviceDescription')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('termsOfService.serviceDescriptionText')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('termsOfService.serviceFeatures.realTimeAnalysis')}</li>
                <li>{t('termsOfService.serviceFeatures.routeOptimization')}</li>
                <li>{t('termsOfService.serviceFeatures.salvageCalculators')}</li>
                <li>{t('termsOfService.serviceFeatures.festivalInfo')}</li>
                <li>{t('termsOfService.serviceFeatures.communityFeatures')}</li>
                <li>{t('termsOfService.serviceFeatures.educationalResources')}</li>
              </ul>
            </section>

            {/* Uso Aceptable */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                {t('termsOfService.acceptableUse')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('termsOfService.acceptableUseDescription')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('termsOfService.acceptableUse.noViolateLaws')}</li>
                <li>{t('termsOfService.acceptableUse.noHarmfulContent')}</li>
                <li>{t('termsOfService.acceptableUse.noUnauthorizedAccess')}</li>
                <li>{t('termsOfService.acceptableUse.noImpersonation')}</li>
              </ul>
            </section>

            {/* Propiedad Intelectual */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Gavel className="w-6 h-6 text-green-400" />
                {t('termsOfService.intellectualProperty')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsOfService.intellectualProperty.gw2Content')}
              </p>
            </section>

            {/* Descargos de Responsabilidad */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">{t('termsOfService.disclaimers')}</h2>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <ul className="list-disc list-inside text-yellow-200 space-y-1 ml-4">
                  <li>{t('termsOfService.disclaimers.asIs')}</li>
                  <li>{t('termsOfService.disclaimers.noLiability')}</li>
                  <li>{t('termsOfService.disclaimers.noAffiliation')}</li>
                </ul>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
