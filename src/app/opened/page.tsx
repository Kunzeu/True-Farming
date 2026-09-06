'use client';

import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import Link from 'next/link'
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import { useState, useEffect, useCallback } from 'react';

interface GW2Item {
  id: number;
  name: string;
  icon: string;
  type: string;
  rarity: string;
  level: number;
  vendor_value: number;
  game_types: string[];
  flags: string[];
  restrictions: string[];
  chat_link: string;
  description?: string;
}

export default function OpenedPage() {
  usePageTitle('pageTitles.opened', 'Contenedores Abribles');
  const { t, lang } = useI18n();
  const defaultCofferIcon = 'https://wiki.guildwars2.com/images/thumb/2/2e/Unlocked_Rift_Essence_Coffer.png/40px-Unlocked_Rift_Essence_Coffer.png';
  const [riftEssenceCoffer, setRiftEssenceCoffer] = useState<{ name: string, icon: string } | null>({
    name: t('opened.essence.unlockedCoffer', 'Unlocked Rift Essence Coffer'),
    icon: defaultCofferIcon
  });
  const [astralMass, setAstralMass] = useState<{ name: string, icon: string } | null>(null);

  // Función para obtener los datos del Rift Essence Coffer según el idioma
  const fetchRiftEssenceCoffer = useCallback(async (language: string) => {
    const delaysMs = [250, 500, 1000];
    for (let attempt = 0; attempt < delaysMs.length; attempt++) {
      try {
        const response = await fetch(`https://api.guildwars2.com/v2/items?ids=101266,101727&lang=${language}`);
        if (!response.ok) {
          // Reintentar en 5xx o 429
          if (response.status >= 500 || response.status === 429) throw new Error(`HTTP ${response.status}`);
          // Para otros códigos, no reintentar y usar fallback traducido
          setRiftEssenceCoffer({
            name: t('opened.essence.unlockedCoffer', 'Unlocked Rift Essence Coffer'),
            icon: defaultCofferIcon
          });
          return;
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('non-JSON');
        }
        const data: GW2Item[] = await response.json();
        const cofferData = data.find((item) => item.id === 101266);
        const astralData = data.find((item) => item.id === 101727);
        if (cofferData) {
          setRiftEssenceCoffer({ name: cofferData.name, icon: cofferData.icon });
        }
        if (astralData) {
          setAstralMass({ name: astralData.name, icon: astralData.icon });
        }
        return;
      } catch (err) {
        // Esperar y reintentar salvo último intento
        if (attempt < delaysMs.length - 1) {
          await new Promise(r => setTimeout(r, delaysMs[attempt]));
          continue;
        }
        console.warn('GW2 API: usando fallback para Rift Essence Coffer', err);
      }
    }
    // Fallback traducido si todos los intentos fallan
    setRiftEssenceCoffer({
      name: t('opened.essence.unlockedCoffer', 'Unlocked Rift Essence Coffer'),
      icon: defaultCofferIcon
    });
  }, [t]);

  // Efecto para cargar los datos cuando cambie el idioma
  useEffect(() => {
    if (lang) {
      // Establecer inmediatamente el fallback traducido al cambiar idioma
      setRiftEssenceCoffer({
        name: t('opened.essence.unlockedCoffer', 'Unlocked Rift Essence Coffer'),
        icon: defaultCofferIcon
      });
      fetchRiftEssenceCoffer(lang);
    }
  }, [lang, fetchRiftEssenceCoffer, t]);

  return (
    <>
      <div className="min-h-screen tf-site-bg">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Hero Section */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold">
                <span
                  className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}
                >
                  {t('openedPage.title', 'Contenedores Abribles')}
                </span>
              </h1>
            </motion.div>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {t('openedPage.subtitle', 'Guía completa de contenedores en Guild Wars 2. Descubre qué recompensas puedes obtener al abrir diferentes tipos de contenedores.')}
            </p>
          </div>

          {/* Información General */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-600/50">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t('openedPage.generalInfo.title', '¿Qué son los Contenedores?')}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-justify">
              <div>
                <p className="text-gray-300 leading-relaxed mb-4">
                  {t('openedPage.generalInfo.description1', 'Los contenedores son items especiales que puedes abrir para obtener recompensas aleatorias. Cada tipo de contenedor tiene diferentes probabilidades de drop y recompensas únicas.')}
                </p>
                <p className="text-gray-300 leading-relaxed">
                  {t('openedPage.generalInfo.description2', 'Algunos contenedores son más valiosos que otros, y conocer qué contienen puede ayudarte a decidir si abrirlos o venderlos.')}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t('openedPage.generalInfo.tips', 'Consejos:')}
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{t('openedPage.generalInfo.tip1', 'Verifica los precios del mercado antes de abrir')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{t('openedPage.generalInfo.tip2', 'Algunos contenedores tienen restricciones de uso')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{t('openedPage.generalInfo.tip3', 'Los contenedores de eventos suelen tener recompensas limitadas')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Contenedores Disponibles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Four Winds Prize Bag */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="group">
              <Link href="/opened/four-winds">
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg flex items-center justify-center border border-purple-500/30 overflow-hidden">
                      <Image
                        src="https://render.guildwars2.com/file/556EDAB564D0341502AB1E129F0303C0F739A4AC/2718778.png"
                        alt={t('fourWindsPrizeBag.title', 'Four Winds Prize Bag')}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-purple-400 group-hover:text-white transition-colors">
                        {t('fourWindsPrizeBag.title', 'Four Winds Prize Bag')}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-400 group-hover:text-white transition-colors">
                      {t('salvagePage.explore', 'Explorar')}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Astral Fluctuating Mass */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="group">
              <Link href="/opened/astral-mass">
                <div className="bg-gradient-to-br from-indigo-500/20 to-violet-600/20 backdrop-blur-sm rounded-xl p-6 border border-indigo-500/30 hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-violet-600/20 rounded-lg flex items-center justify-center border border-indigo-500/30 overflow-hidden">
                      {astralMass?.icon ? (
                        <Image
                          src={astralMass.icon}
                          alt={astralMass.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-indigo-400 group-hover:text-white transition-colors">
                        {astralMass?.name || t('pageTitles.astralMass', 'Masa fluctuante astral')}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-400 group-hover:text-white transition-colors">
                      {t('salvagePage.explore', 'Explorar')}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Unlocked Rift Essence Coffer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="group">
              <Link href="/opened/essence">
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30 hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-cyan-500/30 overflow-hidden">
                      {riftEssenceCoffer ? (
                        <Image
                          src={riftEssenceCoffer.icon || 'https://wiki.guildwars2.com/images/thumb/2/2e/Unlocked_Rift_Essence_Coffer.png/40px-Unlocked_Rift_Essence_Coffer.png'}
                          alt={t('opened.essence.unlockedCoffer', 'Unlocked Rift Essence Coffer')}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-cyan-400 group-hover:text-white transition-colors">
                        {riftEssenceCoffer ? riftEssenceCoffer.name : 'Cargando...'}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-cyan-400 group-hover:text-white transition-colors">
                      {t('salvagePage.explore', 'Explorar')}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Laurels Conversion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="group">
              <Link href="/opened/laurels">
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30 hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-lg flex items-center justify-center border border-yellow-500/30 overflow-hidden">
                      <Image
                        src="https://wiki-es.guildwars2.com/images/5/56/Laurel.png"
                        alt={t('opened.laurels.title', 'Conversión de Laureles')}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-400 group-hover:text-white transition-colors">
                        {t('opened.laurels.title', 'Conversión de Laureles')}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-yellow-400 group-hover:text-white transition-colors">
                      {t('salvagePage.explore', 'Explorar')}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

        </div>
      </div>
    </>
  );
}
