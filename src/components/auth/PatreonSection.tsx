'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { CheckCircle, AlertCircle, ExternalLink, Link, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PatreonSection() {
  const { user, unlinkPatreon } = useAuth();
  const [isUnlinking, setIsUnlinking] = useState(false);
  const { t } = useI18n();

  const hasPatreon = !!user?.patreonId;
  const isActivePatron = user?.patreonStatus === 'active_patron';


  const handleLinkPatreon = () => {
    // Detectar el entorno actual y usar la URL de redirección apropiada
    const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const baseUrl = isDevelopment 
      ? `${window.location.origin}` 
      : 'https://www.true-farming.com';
    
    const redirectUri = process.env.NEXT_PUBLIC_PATREON_REDIRECT_URI || `${baseUrl}/auth/patreon/callback`;
    const clientId = process.env.NEXT_PUBLIC_PATREON_CLIENT_ID;
    // Debug: comparar con el log del servidor (prefijo del clientId y redirect)
    try {
      console.log('Patreon auth config (client):', {
        clientIdPrefix: clientId ? `${clientId.substring(0, 10)}...` : 'Missing',
        redirectUri
      });
    } catch {}
    const state = 'link';
    const patreonAuthUrl = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identity identity[email] identity.memberships&state=${encodeURIComponent(state)}`;
    window.location.href = patreonAuthUrl;
  };

  const handleUnlinkPatreon = async () => {
    if (isUnlinking) return;
    try {
      setIsUnlinking(true);
      await unlinkPatreon();
    } finally {
      setIsUnlinking(false);
    }
  };

  const getPatreonStatusColor = () => {
    if (!hasPatreon) return 'gray';
    if (isActivePatron) return 'green';
    if (user?.patreonStatus === 'declined_patron') return 'red';
    if (user?.patreonStatus === 'former_patron') return 'yellow';
    return 'gray';
  };

  const getPatreonStatusText = () => {
    if (!hasPatreon) return t('profile.patreon.notConnected', 'No vinculado');
    if (isActivePatron) return t('profile.patreon.activePatron', 'Patreon Activo');
    if (user?.patreonStatus === 'declined_patron') return t('profile.patreon.declined', 'Pago Rechazado');
    if (user?.patreonStatus === 'former_patron') return t('profile.patreon.former', 'Ex-Patreon');
    return t('profile.patreon.connected', 'Vinculado');
  };

  const statusColor = getPatreonStatusColor();
  const statusText = getPatreonStatusText();

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[#FF424D] to-[#E03238] rounded-xl flex items-center justify-center">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white">{t('profile.patreon.title', 'Patreon')}</h3>
          <p className="text-gray-400 text-sm">{t('profile.patreon.subtitle', 'Apoya el proyecto y obtén beneficios exclusivos')}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Status Display */}
        {hasPatreon ? (
          <div className={`bg-gradient-to-r from-${statusColor}-900/20 to-${statusColor}-900/20 rounded-xl p-4 border border-${statusColor}-500/30`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                {t('profile.patreon.status', 'Estado de Patreon')}
              </span>
              <div className="flex items-center gap-2">
                {isActivePatron ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className={`w-4 h-4 text-${statusColor}-400`} />
                )}
                <span className={`text-xs text-${statusColor}-400 font-semibold`}>{statusText}</span>
              </div>
            </div>
            
            {hasPatreon && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">
                  {t('profile.patreon.subscription', 'Suscripción')}
                </span>
                <span className={`text-sm font-semibold ${
                  user?.patreonStatus === 'active_patron' ? 'text-green-400' :
                  user?.patreonStatus === 'declined_patron' ? 'text-red-400' :
                  user?.patreonStatus === 'former_patron' ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {user?.patreonStatus === 'active_patron' 
                    ? t('profile.patreon.activePatron', 'Patreon Activo')
                    : user?.patreonStatus === 'declined_patron'
                    ? t('profile.patreon.declined', 'Pago Rechazado')
                    : user?.patreonStatus === 'former_patron'
                    ? t('profile.patreon.former', 'Ex-Patreon')
                    : t('profile.patreon.noStatus', 'Sin estado')
                  }
                </span>
              </div>
            )}

            {/* Benefits - Solo mostrar si es patreon activo */}
            {isActivePatron && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-white mb-2">
                  {t('profile.patreon.benefits', 'Beneficios')}
                </h4>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span>{t('profile.patreon.benefit.noAds', 'Sin anuncios')}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-gray-700/40 to-gray-800/40 rounded-xl p-4 border border-gray-600/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                {t('profile.patreon.status', 'Estado de Patreon')}
              </span>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400 font-semibold">{statusText}</span>
              </div>
            </div>

            {/* Why Patreon section */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-semibold text-white mb-2">
                {t('profile.patreon.whyPatreon', '¿Por qué convertirte en Patreon?')}
              </h4>
              <ul className="space-y-1">
                <li className="flex items-start gap-2 text-xs text-gray-300">
                  <Crown className="w-3 h-3 text-[#FF424D] mt-0.5 flex-shrink-0" />
                  <span>{t('profile.patreon.reason1', 'Apoya el desarrollo continuo del proyecto')}</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-gray-300">
                  <Crown className="w-3 h-3 text-[#FF424D] mt-0.5 flex-shrink-0" />
                  <span>{t('profile.patreon.reason2', 'Obtén beneficios exclusivos')}</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-gray-300">
                  <Crown className="w-3 h-3 text-[#FF424D] mt-0.5 flex-shrink-0" />
                  <span>{t('profile.patreon.reason3', 'Sé parte de la comunidad de patrocinadores')}</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2">
          {!hasPatreon ? (
            <>
              <button
                onClick={handleLinkPatreon}
                className="group inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#FF424D] to-[#E03238] hover:from-[#E03238] hover:to-[#C02830] text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                <Link className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-sm">{t('profile.patreon.linkAccount', 'Vincular Cuenta de Patreon')}</span>
              </button>
              
              <a
                href="https://www.patreon.com/KunzeuLabs"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-sm">{t('profile.patreon.becomePatron', 'Become a Patreon')}</span>
              </a>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="https://www.patreon.com/KunzeuLabs"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#FF424D] to-[#E03238] hover:from-[#E03238] hover:to-[#C02830] text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-sm">{t('profile.patreon.managePatreon', 'Gestionar en Patreon')}</span>
              </a>
              <button
                onClick={handleUnlinkPatreon}
                disabled={isUnlinking}
                className="group inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Link className="w-4 h-4 rotate-45 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-sm">{t('profile.patreon.unlink', 'Desvincular')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Info text */}
        <p className="text-xs text-gray-500 text-center mt-2">
          {t('profile.patreon.infoText', 'Los beneficios se actualizan automáticamente cuando vinculas tu cuenta')}
        </p>
      </div>
    </motion.div>
  );
}
