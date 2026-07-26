'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  BookOpen,
  ArrowLeft,
  Zap,
  Star,
  Info,
  ShoppingCart,
  ArrowRight,
  X
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import Image from 'next/image';
import Link from 'next/link';

// IDs de los materiales T5 (constantes fuera del componente)
const T5_MATERIAL_IDS = {
  totem: 24299,
  fang: 24288,
  scale: 24356,
  blood: 24294,
  bone: 24341,
  claw: 24350,
  venom: 24282
};

// ID del polvo brillante
const T6_DUST_ID = 24277;

// ID de las piedras filosofales
const PHILOSOPHER_STONE_ID = 20796;

export default function ConversionGuidePage() {
  const { t, lang } = useI18n();
  usePageTitle(t('conversionGuidePage.title'), t('conversionGuidePage.title'));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [materialIcons, setMaterialIcons] = useState<Record<number, string>>({});
  const [materialNames, setMaterialNames] = useState<Record<number, string>>({});
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');


  // Función helper para obtener el nombre de un material
  const getMaterialName = (materialId: number, fallback: string) => {
    return materialNames[materialId] || fallback;
  };

  // Función para abrir el modal de imagen
  const openImageModal = (src: string, alt: string) => {
    setModalImageSrc(src);
    setModalImageAlt(alt);
    setImageModalOpen(true);
  };

  // Función para cerrar el modal de imagen
  const closeImageModal = () => {
    setImageModalOpen(false);
    setModalImageSrc('');
    setModalImageAlt('');
  };

  // Cargar iconos de materiales al montar el componente y cuando cambie el idioma
  useEffect(() => {
    const fetchMaterialIcons = async () => {
      try {
        const itemIds = [...Object.values(T5_MATERIAL_IDS), T6_DUST_ID, PHILOSOPHER_STONE_ID].join(',');
        const response = await fetch(`https://api.guildwars2.com/v2/items?ids=${itemIds}&lang=${lang}`, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        });

        if (response.ok) {
          const items = await response.json();
          const icons: Record<number, string> = {};
          const names: Record<number, string> = {};

          items.forEach((item: { id: number; icon?: string; name?: string }) => {
            if (item.icon) {
              icons[item.id] = item.icon;
            }
            if (item.name) {
              names[item.id] = item.name;
            }
          });

          console.log('Material names loaded:', names);
          setMaterialIcons(icons);
          setMaterialNames(names);
        }
      } catch (error) {
        console.error('Error fetching material icons:', error);
      }
    };

    fetchMaterialIcons();
  }, [lang]);

  // Manejar la tecla ESC para cerrar el modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && imageModalOpen) {
        closeImageModal();
      }
    };

    if (imageModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [imageModalOpen]);

  // Scrollspy effect
  useEffect(() => {
    const sections = [
      'introduccion-detallado',
      'como-hacer-conversion',
      'como-comprar-conversiones',
      'como-vender-conversiones'
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Llamar una vez al cargar

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      // Scroll suave con offset para el header
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col" style={{ scrollBehavior: 'smooth' }}>
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar sticky - Desktop Only */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-6">
                <BookOpen className="w-5 h-5 text-purple-400 mr-2" />
                <h3 className="text-white font-bold text-lg">{t('conversionGuidePage.sidebar.title')}</h3>
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => handleScrollTo('introduccion-detallado')}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${activeSection === 'introduccion-detallado'
                    ? 'text-blue-400 bg-blue-900/30 border-l-4 border-blue-400 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                    }`}
                >
                  <Info className={`w-4 h-4 mr-3 ${activeSection === 'introduccion-detallado' ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'
                    }`} />
                  <span className="font-medium">{t('conversionGuidePage.sidebar.introduction')}</span>
                  {activeSection === 'introduccion-detallado' && <ArrowRight className="w-3 h-3 ml-auto text-blue-400" />}
                </button>

                <button
                  onClick={() => handleScrollTo('como-hacer-conversion')}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${activeSection === 'como-hacer-conversion'
                    ? 'text-green-400 bg-green-900/30 border-l-4 border-green-400 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                    }`}
                >
                  <Zap className={`w-4 h-4 mr-3 ${activeSection === 'como-hacer-conversion' ? 'text-green-400' : 'text-gray-400 group-hover:text-green-400'
                    }`} />
                  <span className="font-medium">{t('conversionGuidePage.sidebar.conversionProcess')}</span>
                  {activeSection === 'como-hacer-conversion' && <ArrowRight className="w-3 h-3 ml-auto text-green-400" />}
                </button>

                <button
                  onClick={() => handleScrollTo('como-comprar-conversiones')}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${activeSection === 'como-comprar-conversiones'
                    ? 'text-purple-400 bg-purple-900/30 border-l-4 border-purple-400 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                    }`}
                >
                  <ShoppingCart className={`w-4 h-4 mr-3 ${activeSection === 'como-comprar-conversiones' ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'
                    }`} />
                  <span className="font-medium">{t('conversionGuidePage.sidebar.asBuyer')}</span>
                  {activeSection === 'como-comprar-conversiones' && <ArrowRight className="w-3 h-3 ml-auto text-purple-400" />}
                </button>

                <button
                  onClick={() => handleScrollTo('como-vender-conversiones')}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${activeSection === 'como-vender-conversiones'
                    ? 'text-yellow-400 bg-yellow-900/30 border-l-4 border-yellow-400 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                    }`}
                >
                  <Star className={`w-4 h-4 mr-3 ${activeSection === 'como-vender-conversiones' ? 'text-yellow-400' : 'text-gray-400 group-hover:text-yellow-400'
                    }`} />
                  <span className="font-medium">{t('conversionGuidePage.sidebar.asSeller')}</span>
                  {activeSection === 'como-vender-conversiones' && <ArrowRight className="w-3 h-3 ml-auto text-yellow-400" />}
                </button>

              </nav>
            </div>
          </aside>

          {/* FAB - Floating Action Button - Solo en móvil */}
          <div className="lg:hidden fixed bottom-1/2 right-6 transform -translate-y-1/2 z-50">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-14 h-14 bg-purple-900 hover:bg-purple-800 text-white rounded-full shadow-lg shadow-purple-900/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            >
              {mobileMenuOpen ? <X className="w-8 h-8" /> : <Image src="/images/icons/index.webp" alt={t('conversionGuidePage.images.menu')} width={32} height={32} className="w-8 h-8" />}
            </button>
          </div>

          {/* Mobile Menu Panel - Solo en móvil */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)}>
              <div className="absolute top-1/2 right-20 transform -translate-y-1/2 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl min-w-[200px] max-w-[250px] w-auto animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-white font-bold text-lg mb-3">{t('conversionGuidePage.sidebar.title')}</h3>
                <nav className="space-y-2">
                  <button
                    onClick={() => handleScrollTo('introduccion-detallado')}
                    className={`w-full text-left p-2 rounded-lg transition-all duration-200 ${activeSection === 'introduccion-detallado'
                      ? 'bg-blue-900/50 text-blue-300'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                      }`}
                  >
                    {t('conversionGuidePage.sections.introduction.title')}
                  </button>
                  <button
                    onClick={() => handleScrollTo('como-hacer-conversion')}
                    className={`w-full text-left p-2 rounded-lg transition-all duration-200 ${activeSection === 'como-hacer-conversion'
                      ? 'bg-green-900/50 text-green-300'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                      }`}
                  >
                    {t('conversionGuidePage.sections.conversionProcess.title')}
                  </button>
                  <button
                    onClick={() => handleScrollTo('como-comprar-conversiones')}
                    className={`w-full text-left p-2 rounded-lg transition-all duration-200 ${activeSection === 'como-comprar-conversiones'
                      ? 'bg-purple-900/50 text-purple-300'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                      }`}
                  >
                    {t('conversionGuidePage.sections.asBuyer.title')}
                  </button>
                  <button
                    onClick={() => handleScrollTo('como-vender-conversiones')}
                    className={`w-full text-left p-2 rounded-lg transition-all duration-200 ${activeSection === 'como-vender-conversiones'
                      ? 'bg-yellow-900/50 text-yellow-300'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                      }`}
                  >
                    {t('conversionGuidePage.sections.asSeller.title')}
                  </button>
                </nav>
              </div>
            </div>
          )}

          {/* Contenido Principal */}
          <div className="lg:col-span-9">
            {/* Botón Volver - Solo Desktop */}
            <div className="hidden lg:block mb-6">
              <Link
                href="/magic"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">{t('conversionGuidePage.sidebar.back')}</span>
              </Link>
            </div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center mb-4">
                <BookOpen className="w-12 h-12 text-purple-400 mr-4" />
                <h1 className="text-4xl font-bold text-white">
                  {t('conversionGuidePage.title')}
                </h1>
              </div>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                {t('conversionGuidePage.subtitle')}
              </p>
            </motion.div>

            {/* Índice de Navegación */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4 text-center">📋 {t('conversionGuidePage.sidebar.index')}</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2 justify-items-center">
                  <button
                    onClick={() => handleScrollTo('introduccion-detallado')}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 group ${activeSection === 'introduccion-detallado'
                      ? 'bg-blue-900/50'
                      : 'hover:bg-slate-700/40'
                      }`}
                  >
                    <Info className={`w-6 h-6 mb-2 ${activeSection === 'introduccion-detallado'
                      ? 'text-blue-400'
                      : 'text-gray-400 group-hover:text-blue-400'
                      }`} />
                    <span className={`font-semibold text-xs ${activeSection === 'introduccion-detallado'
                      ? 'text-blue-300'
                      : 'text-white'
                      }`}>{t('conversionGuidePage.sections.introduction.title')}</span>
                  </button>

                  <button
                    onClick={() => handleScrollTo('como-hacer-conversion')}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 group ${activeSection === 'como-hacer-conversion'
                      ? 'bg-green-900/50'
                      : 'hover:bg-slate-700/40'
                      }`}
                  >
                    <Zap className={`w-6 h-6 mb-2 ${activeSection === 'como-hacer-conversion'
                      ? 'text-green-400'
                      : 'text-gray-400 group-hover:text-green-400'
                      }`} />
                    <span className={`font-semibold text-xs ${activeSection === 'como-hacer-conversion'
                      ? 'text-green-300'
                      : 'text-white'
                      }`}>{t('conversionGuidePage.sections.conversionProcess.title')}</span>
                  </button>

                  <button
                    onClick={() => handleScrollTo('como-comprar-conversiones')}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 group ${activeSection === 'como-comprar-conversiones'
                      ? 'bg-purple-900/50'
                      : 'hover:bg-slate-700/40'
                      }`}
                  >
                    <ShoppingCart className={`w-6 h-6 mb-2 ${activeSection === 'como-comprar-conversiones'
                      ? 'text-purple-400'
                      : 'text-gray-400 group-hover:text-purple-400'
                      }`} />
                    <span className={`font-semibold text-xs ${activeSection === 'como-comprar-conversiones'
                      ? 'text-purple-300'
                      : 'text-white'
                      }`}>{t('conversionGuidePage.sections.asBuyer.title')}</span>
                  </button>

                  <button
                    onClick={() => handleScrollTo('como-vender-conversiones')}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 group ${activeSection === 'como-vender-conversiones'
                      ? 'bg-yellow-900/50'
                      : 'hover:bg-slate-700/40'
                      }`}
                  >
                    <Star className={`w-6 h-6 mb-2 ${activeSection === 'como-vender-conversiones'
                      ? 'text-yellow-400'
                      : 'text-gray-400 group-hover:text-yellow-400'
                      }`} />
                    <span className={`font-semibold text-xs ${activeSection === 'como-vender-conversiones'
                      ? 'text-yellow-300'
                      : 'text-white'
                      }`}>{t('conversionGuidePage.sections.asSeller.title')}</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Guía Detallada */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="space-y-8 mb-12"
            >
              {/* Introducción Detallada */}
              <div id="introduccion-detallado" className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                    <Info className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{t('conversionGuidePage.sections.introduction.title')}</h2>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('conversionGuidePage.sections.introduction.content1')}
                  </p>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('conversionGuidePage.sections.introduction.content2')}
                  </p>

                </div>
              </div>

              {/* Como se hace una conversión */}
              <div id="como-hacer-conversion" className="bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mr-4">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{t('conversionGuidePage.sections.conversionProcess.title')}</h2>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('conversionGuidePage.sections.conversionProcess.content1')}
                  </p>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('conversionGuidePage.sections.conversionProcess.content2')}
                  </p>

                  <div className="mb-6 flex justify-center">
                    <Image
                      src="/thumbnails/convertion.webp"
                      alt={t('conversionGuidePage.images.conversionRecipe')}
                      width={800}
                      height={600}
                      className="rounded-lg shadow-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageModal("/thumbnails/convertion.webp", t('conversionGuidePage.images.conversionRecipe'))}
                    />
                  </div>

                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {t('conversionGuidePage.sections.conversionProcess.content3')}
                  </p>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('conversionGuidePage.sections.conversionProcess.content4')}
                  </p>

                </div>
              </div>

              {/* Como comprar conversiones de T6 */}
              <div id="como-comprar-conversiones" className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{t('conversionGuidePage.sections.asBuyer.title')}</h2>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('conversionGuidePage.sections.asBuyer.content1')}
                  </p>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('conversionGuidePage.sections.asBuyer.content2')}
                  </p>

                  <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                    <ul className="text-gray-300 text-base space-y-1">
                      <li className="flex items-center gap-3 py-1">
                        <span className="text-base">{t('conversionGuidePage.sections.asBuyer.materialsList')}</span>
                      </li>
                      <li className="ml-4 flex items-center gap-3 py-1">
                        {materialIcons[T5_MATERIAL_IDS.blood] && (
                          <Image src={materialIcons[T5_MATERIAL_IDS.blood]} alt={getMaterialName(T5_MATERIAL_IDS.blood, "Sangre T5")} width={24} height={24} className="w-6 h-6 flex-shrink-0" />
                        )}
                        <span className="text-base">{getMaterialName(T5_MATERIAL_IDS.blood, "Sangre T5")}</span>
                      </li>
                      <li className="ml-4 flex items-center gap-3 py-1">
                        {materialIcons[T5_MATERIAL_IDS.bone] && (
                          <Image src={materialIcons[T5_MATERIAL_IDS.bone]} alt={getMaterialName(T5_MATERIAL_IDS.bone, "Hueso T5")} width={24} height={24} className="w-6 h-6 flex-shrink-0" />
                        )}
                        <span className="text-base">{getMaterialName(T5_MATERIAL_IDS.bone, "Hueso T5")}</span>
                      </li>
                      <li className="ml-4 flex items-center gap-3 py-1">
                        {materialIcons[T5_MATERIAL_IDS.claw] && (
                          <Image src={materialIcons[T5_MATERIAL_IDS.claw]} alt={getMaterialName(T5_MATERIAL_IDS.claw, "Garra T5")} width={24} height={24} className="w-6 h-6 flex-shrink-0" />
                        )}
                        <span className="text-base">{getMaterialName(T5_MATERIAL_IDS.claw, "Garra T5")}</span>
                      </li>
                      <li className="ml-4 flex items-center gap-3 py-1">
                        {materialIcons[T5_MATERIAL_IDS.fang] && (
                          <Image src={materialIcons[T5_MATERIAL_IDS.fang]} alt={getMaterialName(T5_MATERIAL_IDS.fang, "Colmillo T5")} width={24} height={24} className="w-6 h-6 flex-shrink-0" />
                        )}
                        <span className="text-base">{getMaterialName(T5_MATERIAL_IDS.fang, "Colmillo T5")}</span>
                      </li>
                      <li className="ml-4 flex items-center gap-3 py-1">
                        {materialIcons[T5_MATERIAL_IDS.scale] && (
                          <Image src={materialIcons[T5_MATERIAL_IDS.scale]} alt={getMaterialName(T5_MATERIAL_IDS.scale, "Escama T5")} width={24} height={24} className="w-6 h-6 flex-shrink-0" />
                        )}
                        <span className="text-base">{getMaterialName(T5_MATERIAL_IDS.scale, "Escama T5")}</span>
                      </li>
                      <li className="ml-4 flex items-center gap-3 py-1">
                        {materialIcons[T5_MATERIAL_IDS.totem] && (
                          <Image src={materialIcons[T5_MATERIAL_IDS.totem]} alt={getMaterialName(T5_MATERIAL_IDS.totem, "Tótem T5")} width={24} height={24} className="w-6 h-6 flex-shrink-0" />
                        )}
                        <span className="text-base">{getMaterialName(T5_MATERIAL_IDS.totem, "Tótem T5")}</span>
                      </li>
                      <li className="ml-4 flex items-center gap-3 py-1">
                        {materialIcons[T5_MATERIAL_IDS.venom] && (
                          <Image src={materialIcons[T5_MATERIAL_IDS.venom]} alt={getMaterialName(T5_MATERIAL_IDS.venom, "Veneno T5")} width={24} height={24} className="w-6 h-6 flex-shrink-0" />
                        )}
                        <span className="text-base">{getMaterialName(T5_MATERIAL_IDS.venom, "Veneno T5")}</span>
                      </li>
                      <li className="ml-4 flex items-center gap-3 py-1">
                        {materialIcons[T6_DUST_ID] && (
                          <Image src={materialIcons[T6_DUST_ID]} alt={getMaterialName(T6_DUST_ID, "Polvo brillante")} width={24} height={24} className="w-6 h-6 flex-shrink-0" />
                        )}
                        <span className="text-base"><strong>{t('conversionGuidePage.sections.asBuyer.dustAmount')}</strong></span>
                      </li>
                      <li className="ml-4 flex items-center gap-3 py-1">
                        <Image src="/images/expansions/Gold.webp" alt={t('conversionGuidePage.images.gold')} width={24} height={24} className="w-6 h-6 flex-shrink-0" />
                        <span className="text-base"><strong>{t('conversionGuidePage.sections.asBuyer.payment')}</strong></span>
                      </li>
                    </ul>
                  </div>


                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {t('conversionGuidePage.sections.asBuyer.content3')}
                  </p>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('conversionGuidePage.sections.asBuyer.content4')}
                  </p>
                  <div className="mb-6 flex justify-center">
                    <Image
                      src="/thumbnails/t5.webp"
                      alt={t('conversionGuidePage.images.t5Materials')}
                      width={800}
                      height={600}
                      className="rounded-lg shadow-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageModal("/thumbnails/t5.webp", t('conversionGuidePage.images.t5Materials'))}
                    />
                  </div>
                </div>

              </div>

              {/* Como vender conversiones de T6 */}
              <div id="como-vender-conversiones" className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mr-4">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{t('conversionGuidePage.sections.asSeller.title')}</h2>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('conversionGuidePage.sections.asSeller.content1')}
                  </p>
                  <div className="mb-6 flex justify-center">
                    <Image
                      src="/thumbnails/unknown-11.webp"
                      alt={t('conversionGuidePage.images.inventorySetup')}
                      width={800}
                      height={600}
                      className="rounded-lg shadow-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageModal("/thumbnails/unknown-11.webp", t('conversionGuidePage.images.inventorySetup'))}
                    />
                  </div>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('conversionGuidePage.sections.asSeller.content2')}
                  </p>
                  <div className="mb-6 flex justify-center">
                    <Image
                      src="/thumbnails/unknown-12.webp"
                      alt={t('conversionGuidePage.images.philosopherStones')}
                      width={800}
                      height={600}
                      className="rounded-lg shadow-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageModal("/thumbnails/unknown-12.webp", t('conversionGuidePage.images.philosopherStones'))}
                    />
                  </div>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('conversionGuidePage.sections.asSeller.content3')}
                  </p>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('conversionGuidePage.sections.asSeller.content4')}&nbsp;
                    <a
                      href="https://discord.gg/gw2overflow"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      {t('conversionGuidePage.sections.asSeller.discordLink')}
                    </a>.
                  </p>
                </div>
              </div>

            </motion.div>

            {/* Back to Calculator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-center"
            >
              <Link
                href="/magic#conversions"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <Zap className="w-5 h-5" />
                {t('conversionGuidePage.cta.button')}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modal de imagen */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={modalImageSrc}
              alt={modalImageAlt}
              width={1200}
              height={900}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
