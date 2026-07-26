'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Award, Star, Crown, Gem, Hammer, ExternalLink, Loader2, Info, Zap, X, ShoppingCart, Wrench, ArrowRight, MessageCircle, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'
import { FALLBACK_ITEMS, isOfflineMode, setApiOffline, setApiOnline } from '@/data/fallback-data'
import { useGW2Item, useGW2Items } from '@/hooks/useGW2ItemCache'
import WikiItemLink from '@/components/ui/WikiItemLink'

interface GiftOfMasteryItem {
  id: number
  name: string
  description: string
  icon: string
  rarity: string
  type: string
  level: number
  vendor_value: number
  chat_link: string
  details?: {
    type: string
    flags: string[]
    game_types: string[]
    restrictions: string[]
  }
}

// IDs de los items mencionados en la guía
const ITEM_IDS = {
  // Materiales del comprador
  ectoplasm: 19721,
  t6Bone: 24358,
  t6Totem: 24300,
  t6Blood: 24295,
  t6Dust: 24277,
  t6Claw: 24351,
  t6Fang: 24357,
  t6Venom: 24283,
  t6Scale: 24289,
  mysticCoin: 19976,
  
  // Materiales del vendedor
  giftOfExploration: 19677,
  giftOfBattle: 19678,
  obsidianShard: 19925,
  spiritShard: 69910,
  mysticClover: 19675,
  
  // Materiales específicos
  runicStone: 19676,
  customIcon: 'https://render.guildwars2.com/file/37CCE672250A3170B71760949C4C9C9B186517B1/619327.png',
  
  // Materiales específicos
  giftOfMastery: 19674
}

export default function GiftOfMasteryPage() {
  usePageTitle('giftOfMasteryPage.title', 'Gift of Mastery')
  const { t, lang } = useI18n()
  
  const [item, setItem] = useState<GiftOfMasteryItem | null>(null)
  const [materials, setMaterials] = useState<Record<string, GiftOfMasteryItem>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Array de imágenes disponibles
  const images = [
    {
      src: "/thumbnails/weapons-table-1024x576.webp", 
      alt: "Tabla de armas legendarias con profesiones y mazmorras"
    },
    {
      src: "/thumbnails/legendariaw-1024x576.webp", 
      alt: "Arma Legendaria de Guild Wars 2"
    }
  ]

  // Funciones para navegar entre imágenes
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Mapear códigos de idioma de nuestra app a códigos de la API de GW2
  const getGW2LangCode = (lang: string) => {
    const langMap: Record<string, string> = {
      'es': 'es',
      'en': 'en',
      'de': 'de',
      'fr': 'fr'
    }
    return langMap[lang] || 'en'
  }

  // Mapear códigos de idioma a URLs de wiki
  const getWikiUrl = (lang: string, itemName: string) => {
    const wikiMap: Record<string, string> = {
      'es': 'wiki.guildwars2.com',
      'en': 'wiki.guildwars2.com',
      'de': 'wiki-de.guildwars2.com',
      'fr': 'wiki-fr.guildwars2.com'
    }
    const wikiDomain = wikiMap[lang] || 'wiki.guildwars2.com'
    
    // Para las wikis inglesas (es y en), usar siempre el nombre en inglés
    if (lang === 'es' || lang === 'en') {
      return `https://${wikiDomain}/wiki/Gift_of_Mastery`
    }
    
    return `https://${wikiDomain}/wiki/${itemName.replace(/\s+/g, '_')}`
  }


  // Obtener el item principal con caché
  const gw2Lang = getGW2LangCode(lang)
  const { item: mainItem, loading: itemLoading } = useGW2Item(
    19674,
    gw2Lang,
    {
      timeout: 10000,
      fallback: FALLBACK_ITEMS.giftOfMastery,
      onSuccess: (data) => {
        setItem(data as GiftOfMasteryItem)
        setApiOnline()
      },
      onError: () => {
        setItem(FALLBACK_ITEMS.giftOfMastery)
        setApiOffline()
      }
    }
  )

  // Obtener los materiales con caché
  const materialIds = Object.values(ITEM_IDS).filter((id): id is number => typeof id === 'number')
  const { items: materialsData, loading: materialsLoading } = useGW2Items(
    materialIds,
    gw2Lang,
    {
      timeout: 15000,
      fallback: FALLBACK_ITEMS,
      onSuccess: (data) => {
        const materialsMap: Record<string, GiftOfMasteryItem> = {}
        Object.values(data).forEach((item) => {
          const key = Object.keys(ITEM_IDS).find(k => ITEM_IDS[k as keyof typeof ITEM_IDS] === item.id)
          if (key) {
            materialsMap[key] = item as GiftOfMasteryItem
          }
        })
        setMaterials(materialsMap)
        setApiOnline()
      },
      onError: () => {
        setMaterials(FALLBACK_ITEMS)
        setApiOffline()
      }
    }
  )

  // Sincronizar el estado de loading
  useEffect(() => {
    setLoading(itemLoading || materialsLoading)
  }, [itemLoading, materialsLoading])

  // Manejar modo offline
  useEffect(() => {
    if (isOfflineMode() && !itemLoading && !materialsLoading) {
      if (!mainItem) {
        setItem(FALLBACK_ITEMS.giftOfMastery)
      }
      if (Object.keys(materialsData).length === 0) {
        setMaterials(FALLBACK_ITEMS)
      }
      setError('API no disponible - mostrando datos de respaldo')
    }
  }, [itemLoading, materialsLoading, mainItem, materialsData])

  // Scrollspy effect
  useEffect(() => {
    const sections = [
      'comprador-detallado',
      'vendedor-detallado', 
      'proceso-detallado',
      'discord-detallado',
      'consejos-detallado'
    ]

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100 // Offset para activar antes

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Llamar una vez al cargar

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle Escape key for image modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && imageModalOpen) {
        setImageModalOpen(false)
      }
    }

    if (imageModalOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [imageModalOpen])

  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      // Scroll suave con offset para el header
      const headerOffset = 80
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      
      setMobileMenuOpen(false) // Cerrar menú móvil al hacer clic
    }
  }


  // Componente para mostrar un material con su icono y nombre
  const MaterialItem = ({ materialKey, quantity, note }: { materialKey: string, quantity: number, note?: string }) => {
    const material = materials[materialKey]
    
    // Si es un icono personalizado (URL directa)
    if (materialKey === 'customIcon') {
      return (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 relative">
            <Image
              src="https://render.guildwars2.com/file/37CCE672250A3170B71760949C4C9C9B186517B1/619327.png"
              alt="Icono personalizado"
              fill
              sizes="24px"
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-white font-semibold">{quantity} Material personalizado</span>
            {note && <p className="text-gray-400 text-sm">({note})</p>}
          </div>
        </div>
      )
    }
    
    if (!material) {
      return (
        <div className="flex items-start space-x-3">
          <span className="text-yellow-400 font-bold text-lg">•</span>
          <div>
            <span className="text-white font-semibold">Cargando...</span>
            {note && <p className="text-gray-400 text-sm">({note})</p>}
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-6 h-6 relative">
          <Image
            src={material.icon}
            alt={material.name}
            fill
            sizes="24px"
            className="object-contain"
          />
        </div>
        <div>
          <span className="text-white font-semibold">
            {quantity}{' '}
            <WikiItemLink
              name={material.name}
              itemId={material.id}
              chatLink={material.chat_link}
              className="hover:underline"
            >
              {material.name}
            </WikiItemLink>
          </span>
          {note && <p className="text-gray-400 text-sm">({note})</p>}
        </div>
      </div>
    )
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-yellow-600 mx-auto mb-4" />
            <p className="text-lg text-gray-300">{t('giftOfMasteryPage.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 rounded mb-4">
              <p className="font-bold">{t('giftOfMasteryPage.error.title')}</p>
              <p>{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              {t('giftOfMasteryPage.error.retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col" style={{ scrollBehavior: 'smooth' }}>
        
        {/* Banner informativo cuando se usan datos de fallback */}
        {error && item && (
          <div className="bg-yellow-900/20 border-b border-yellow-500/30 px-4 py-3">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <p className="text-yellow-200 text-sm">
                  <strong>Modo offline:</strong> Mostrando datos de respaldo. La API de GW2 está temporalmente deshabilitada.
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="text-yellow-300 hover:text-yellow-100 text-sm underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}
        
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar sticky - Desktop Only */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-6">
                <Award className="w-5 h-5 text-yellow-400 mr-2" />
                <h3 className="text-white font-bold text-lg">Guía GOM</h3>
              </div>
              <nav className="space-y-1">
                <button 
                  onClick={() => handleScrollTo('comprador-detallado')} 
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${
                    activeSection === 'comprador-detallado' 
                      ? 'text-blue-400 bg-blue-900/30 border-l-4 border-blue-400 shadow-md' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                  }`}
                >
                  <ShoppingCart className={`w-4 h-4 mr-3 ${
                    activeSection === 'comprador-detallado' ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'
                  }`} />
                  <span className="font-medium">{t('giftOfMasteryPage.sections.buyer')}</span>
                  {activeSection === 'comprador-detallado' && <ArrowRight className="w-3 h-3 ml-auto text-blue-400" />}
                </button>
                
                <button 
                  onClick={() => handleScrollTo('vendedor-detallado')} 
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${
                    activeSection === 'vendedor-detallado' 
                      ? 'text-green-400 bg-green-900/30 border-l-4 border-green-400 shadow-md' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                  }`}
                >
                  <Wrench className={`w-4 h-4 mr-3 ${
                    activeSection === 'vendedor-detallado' ? 'text-green-400' : 'text-gray-400 group-hover:text-green-400'
                  }`} />
                  <span className="font-medium">{t('giftOfMasteryPage.sections.seller')}</span>
                  {activeSection === 'vendedor-detallado' && <ArrowRight className="w-3 h-3 ml-auto text-green-400" />}
                </button>
                
                <button 
                  onClick={() => handleScrollTo('proceso-detallado')} 
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${
                    activeSection === 'proceso-detallado' 
                      ? 'text-purple-400 bg-purple-900/30 border-l-4 border-purple-400 shadow-md' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                  }`}
                >
                  <Zap className={`w-4 h-4 mr-3 ${
                    activeSection === 'proceso-detallado' ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'
                  }`} />
                  <span className="font-medium">{t('giftOfMasteryPage.sections.process')}</span>
                  {activeSection === 'proceso-detallado' && <ArrowRight className="w-3 h-3 ml-auto text-purple-400" />}
                </button>
                
                <button 
                  onClick={() => handleScrollTo('discord-detallado')} 
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${
                    activeSection === 'discord-detallado' 
                      ? 'text-indigo-400 bg-indigo-900/30 border-l-4 border-indigo-400 shadow-md' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                  }`}
                >
                  <MessageCircle className={`w-4 h-4 mr-3 ${
                    activeSection === 'discord-detallado' ? 'text-indigo-400' : 'text-gray-400 group-hover:text-indigo-400'
                  }`} />
                  <span className="font-medium">{t('giftOfMasteryPage.sections.discord')}</span>
                  {activeSection === 'discord-detallado' && <ArrowRight className="w-3 h-3 ml-auto text-indigo-400" />}
                </button>
                
                <button 
                  onClick={() => handleScrollTo('consejos-detallado')} 
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${
                    activeSection === 'consejos-detallado' 
                      ? 'text-pink-400 bg-pink-900/30 border-l-4 border-pink-400 shadow-md' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                  }`}
                >
                  <Lightbulb className={`w-4 h-4 mr-3 ${
                    activeSection === 'consejos-detallado' ? 'text-pink-400' : 'text-gray-400 group-hover:text-pink-400'
                  }`} />
                  <span className="font-medium">{t('giftOfMasteryPage.sections.tips')}</span>
                  {activeSection === 'consejos-detallado' && <ArrowRight className="w-3 h-3 ml-auto text-pink-400" />}
                </button>
              </nav>
            </div>
          </aside>

          {/* FAB - Floating Action Button - Solo en móvil */}
          <div className="lg:hidden fixed bottom-1/2 right-6 transform -translate-y-1/2 z-50">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-14 h-14 bg-blue-900 hover:bg-blue-800 text-white rounded-full shadow-lg shadow-blue-900/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            >
              {mobileMenuOpen ? <X className="w-8 h-8" /> : <Image src="/images/icons/index.webp" alt="Menu" width={32} height={32} className="w-8 h-8" />}
            </button>
          </div>

          {/* Mobile Menu Panel - Solo en móvil */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)}>
              <div className="absolute top-1/2 right-20 transform -translate-y-1/2 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl min-w-[200px] max-w-[250px] w-auto animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-white font-bold text-lg mb-3">{t('giftOfMasteryPage.menu.title')}</h3>
                <nav className="space-y-2">
                  <button 
                    onClick={() => handleScrollTo('comprador-detallado')} 
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === 'comprador-detallado' 
                        ? 'text-blue-400 bg-blue-900/30 border-l-4 border-blue-400' 
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                    }`}
                  >
                    {t('giftOfMasteryPage.sections.buyer')}
                  </button>
                  <button 
                    onClick={() => handleScrollTo('vendedor-detallado')} 
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === 'vendedor-detallado' 
                        ? 'text-green-400 bg-green-900/30 border-l-4 border-green-400' 
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                    }`}
                  >
                    {t('giftOfMasteryPage.sections.seller')}
                  </button>
                  <button 
                    onClick={() => handleScrollTo('proceso-detallado')} 
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === 'proceso-detallado' 
                        ? 'text-purple-400 bg-purple-900/30 border-l-4 border-purple-400' 
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                    }`}
                  >
                    {t('giftOfMasteryPage.sections.process')}
                  </button>
                  <button 
                    onClick={() => handleScrollTo('discord-detallado')} 
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === 'discord-detallado' 
                        ? 'text-indigo-400 bg-indigo-900/30 border-l-4 border-indigo-400' 
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                    }`}
                  >
                    {t('giftOfMasteryPage.sections.discord')}
                  </button>
                  <button 
                    onClick={() => handleScrollTo('consejos-detallado')} 
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === 'consejos-detallado' 
                        ? 'text-pink-400 bg-pink-900/30 border-l-4 border-pink-400' 
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                    }`}
                  >
                    {t('giftOfMasteryPage.sections.tips')}
                  </button>
                </nav>
              </div>
            </div>
          )}

          {/* Main content - Responsive */}
          <div className="w-full lg:col-span-9">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full shadow-lg">
              <Award className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {item ? `${item.name}` : t('giftOfMasteryPage.title')}
          </h1>

        </motion.div>

        {/* Item Information */}
        {item && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-lg mb-12"
          >
            <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-8">
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <div className="relative w-32 h-32">
                  <Image
                    src={item.icon}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 128px, 128px"
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
                  <Award className="w-8 h-8 text-yellow-600" />
                  <h2 className="text-3xl font-bold text-white">
                    {item.name}
                  </h2>
                </div>
                <div className="flex justify-center lg:justify-start">
                  <a
                    href={getWikiUrl(lang, item.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t('giftOfMasteryPage.itemInfo.viewWiki')}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Features Grid */}
        {/* Content Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 text-center">📋 {t('giftOfMasteryPage.sections.guideIndex')}</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-2 justify-items-center">
              <button 
                onClick={() => handleScrollTo('comprador-detallado')}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors group ${
                  activeSection === 'comprador-detallado'
                    ? 'bg-blue-900/40 border-2 border-blue-400 shadow-lg shadow-blue-900/20'
                    : 'bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/40'
                }`}
              >
                <Info className={`w-4 h-4 mb-1 ${
                  activeSection === 'comprador-detallado' 
                    ? 'text-blue-300' 
                    : 'text-blue-400 group-hover:text-blue-300'
                }`} />
                <span className={`font-semibold text-xs ${
                  activeSection === 'comprador-detallado' 
                    ? 'text-blue-300' 
                    : 'text-white'
                }`}>{t('giftOfMasteryPage.sections.buyer')}</span>
              </button>

              <button 
                onClick={() => handleScrollTo('vendedor-detallado')}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors group ${
                  activeSection === 'vendedor-detallado'
                    ? 'bg-green-900/40 border-2 border-green-400 shadow-lg shadow-green-900/20'
                    : 'bg-green-900/20 border border-green-500/30 hover:bg-green-900/40'
                }`}
              >
                <Hammer className={`w-4 h-4 mb-1 ${
                  activeSection === 'vendedor-detallado' 
                    ? 'text-green-300' 
                    : 'text-green-400 group-hover:text-green-300'
                }`} />
                <span className={`font-semibold text-xs ${
                  activeSection === 'vendedor-detallado' 
                    ? 'text-green-300' 
                    : 'text-white'
                }`}>{t('giftOfMasteryPage.sections.seller')}</span>
              </button>

              <button 
                onClick={() => handleScrollTo('proceso-detallado')}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors group ${
                  activeSection === 'proceso-detallado'
                    ? 'bg-purple-900/40 border-2 border-purple-400 shadow-lg shadow-purple-900/20'
                    : 'bg-purple-900/20 border border-purple-500/30 hover:bg-purple-900/40'
                }`}
              >
                <Zap className={`w-4 h-4 mb-1 ${
                  activeSection === 'proceso-detallado' 
                    ? 'text-purple-300' 
                    : 'text-purple-400 group-hover:text-purple-300'
                }`} />
                <span className={`font-semibold text-xs ${
                  activeSection === 'proceso-detallado' 
                    ? 'text-purple-300' 
                    : 'text-white'
                }`}>{t('giftOfMasteryPage.sections.process')}</span>
              </button>

              <button 
                onClick={() => handleScrollTo('discord-detallado')}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors group ${
                  activeSection === 'discord-detallado'
                    ? 'bg-indigo-900/40 border-2 border-indigo-400 shadow-lg shadow-indigo-900/20'
                    : 'bg-indigo-900/20 border border-indigo-500/30 hover:bg-indigo-900/40'
                }`}
              >
                <Star className={`w-4 h-4 mb-1 ${
                  activeSection === 'discord-detallado' 
                    ? 'text-indigo-300' 
                    : 'text-indigo-400 group-hover:text-indigo-300'
                }`} />
                <span className={`font-semibold text-xs ${
                  activeSection === 'discord-detallado' 
                    ? 'text-indigo-300' 
                    : 'text-white'
                }`}>{t('giftOfMasteryPage.sections.discord')}</span>
              </button>

              <button 
                onClick={() => handleScrollTo('consejos-detallado')}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors group ${
                  activeSection === 'consejos-detallado'
                    ? 'bg-pink-900/40 border-2 border-pink-400 shadow-lg shadow-pink-900/20'
                    : 'bg-pink-900/20 border border-pink-500/30 hover:bg-pink-900/40'
                }`}
              >
                <Crown className={`w-4 h-4 mb-1 ${
                  activeSection === 'consejos-detallado' 
                    ? 'text-pink-300' 
                    : 'text-pink-400 group-hover:text-pink-300'
                }`} />
                <span className={`font-semibold text-xs ${
                  activeSection === 'consejos-detallado' 
                    ? 'text-pink-300' 
                    : 'text-white'
                }`}>{t('giftOfMasteryPage.sections.tips')}</span>
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
          {/* Comprador Detallado */}
          <div id="comprador-detallado" className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                <Info className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('giftOfMasteryPage.buyer.title')}</h2>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
              <p className="text-gray-300 mb-6 leading-relaxed">
                {t('giftOfMasteryPage.buyer.description').replace('{itemName}', item ? item.name : 'Don del Dominio')}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <MaterialItem 
                    materialKey="ectoplasm" 
                    quantity={481} 
                    note={t('giftOfMasteryPage.buyer.ectoplasmNote')} 
                  />
                  
                  <div className="space-y-2">
                    <span className="text-white font-semibold">{t('giftOfMasteryPage.buyer.t6Materials')}</span>
                    <div className="ml-4 space-y-1">
                      <MaterialItem materialKey="t6Totem" quantity={250} />
                      <MaterialItem materialKey="t6Bone" quantity={250} />
                      <MaterialItem materialKey="t6Blood" quantity={250} />
                      <MaterialItem materialKey="t6Dust" quantity={250} />
                      <MaterialItem materialKey="t6Claw" quantity={250} />
                      <MaterialItem materialKey="t6Fang" quantity={250} />
                      <MaterialItem materialKey="t6Scale" quantity={250} />
                      <MaterialItem materialKey="t6Venom" quantity={250} />
                    </div>
                  </div>
                  
                  <MaterialItem 
                    materialKey="mysticCoin" 
                    quantity={231} 
                    note={t('giftOfMasteryPage.notes.clovers')} 
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 relative">
                      <Image
                        src="/images/expansions/Gold.webp"
                        alt="Oro"
                        fill
                        sizes="24px"
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-white font-semibold">100g</span>
                      <p className="text-gray-400 text-sm">{t('giftOfMasteryPage.notes.runicStones')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 relative">
                      <Image
                        src="https://render.guildwars2.com/file/FADDF94DAD6721344F300405E725AC2624330339/455802.png"
                        alt="Materiales específicos"
                        fill
                        sizes="24px"
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-white font-semibold">{t('giftOfMasteryPage.buyer.requiredGifts')}</span>
                      <p className="text-gray-400 text-sm">{t('giftOfMasteryPage.buyer.requiredGiftsDesc')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 relative">
                        <Image
                          src="https://render.guildwars2.com/file/4B0EFF29FD064E5E93E4F8616BE309A451450AED/220661.png"
                          alt="Sello del arma"
                          fill
                          sizes="24px"
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-white font-semibold">{t('giftOfMasteryPage.buyer.weaponSeal')}</span>
                        <p className="text-gray-400 text-sm">{t('giftOfMasteryPage.buyer.weaponSealDesc')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 relative">
                        <Image
                          src="/images/icons/raw.webp"
                          alt="Precursora"
                          fill
                          sizes="24px"
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-white font-semibold">{t('giftOfMasteryPage.buyer.precursor')}</span>
                        <p className="text-gray-400 text-sm">{t('giftOfMasteryPage.buyer.precursorDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vendedor Detallado */}
          <div id="vendedor-detallado" className="bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mr-4">
                <Hammer className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('giftOfMasteryPage.seller.title')}</h2>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
              <p className="text-gray-300 mb-6 leading-relaxed">
                {t('giftOfMasteryPage.seller.description')}
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold text-lg">1.</span>
                      <div className="flex-1">
                        <MaterialItem 
                          materialKey="giftOfExploration" 
                          quantity={1} 
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold text-lg">2.</span>
                      <div className="flex-1">
                        <MaterialItem 
                          materialKey="giftOfBattle" 
                          quantity={1} 
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold text-lg">3.</span>
                      <div className="flex-1">
                        <MaterialItem 
                          materialKey="obsidianShard" 
                          quantity={481} 
                          note={t('giftOfMasteryPage.seller.obsidianNote')} 
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold text-lg">4.</span>
                      <div className="flex-1">
                        <MaterialItem 
                          materialKey="spiritShard" 
                          quantity={340} 
                          note={t('giftOfMasteryPage.seller.spiritShardNote')} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold text-lg">5.</span>
                      <div className="flex-1">
                        <MaterialItem 
                          materialKey="customIcon" 
                          quantity={500} 
                          note={t('giftOfMasteryPage.seller.dungeonCoins')} 
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold text-lg">6.</span>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 relative">
                          <Image
                            src="/images/icons/Crafting_icon.webp"
                            alt="Artesanías al 400"
                            fill
                            sizes="24px"
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <span className="text-white font-semibold">{t('giftOfMasteryPage.seller.crafting400')}</span>
                          <p className="text-gray-400 text-sm">{t('giftOfMasteryPage.seller.crafting400Desc')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold text-lg">7.</span>
                      <div>
                        <span className="text-white font-semibold">{t('giftOfMasteryPage.seller.giftRecipes')}</span>
                        <p className="text-gray-400 text-sm">{t('giftOfMasteryPage.seller.giftRecipesDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <span className="text-yellow-400 font-bold text-lg">{t('common.optional', 'OPCIONAL')}:</span>
                    <div className="flex-1">
                      <MaterialItem 
                        materialKey="mysticClover" 
                        quantity={77} 
                        note={t('giftOfMasteryPage.notes.extra')} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Proceso Detallado */}
          <div id="proceso-detallado" className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('giftOfMasteryPage.process.title')}</h2>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
              <p className="text-gray-300 mb-6 leading-relaxed">
                {t('giftOfMasteryPage.process.description')}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <span className="text-purple-400 font-bold text-lg">1.</span>
                  <p className="text-gray-300">{t('giftOfMasteryPage.process.step1')}</p>
                </div>
                
                <div className="flex items-start space-x-4">
                  <span className="text-purple-400 font-bold text-lg">2.</span>
                  <p className="text-gray-300">{t('giftOfMasteryPage.process.step2')}</p>
                </div>
                
                <div className="flex items-start space-x-4">
                  <span className="text-purple-400 font-bold text-lg">3.</span>
                  <p 
                    className="text-gray-300"
                    dangerouslySetInnerHTML={{
                      __html: t('giftOfMasteryPage.process.step3').replace('{wikiLink}', 
                        `<a href="${t('giftOfMasteryPage.wiki.url')}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">${t('giftOfMasteryPage.wiki.link')}</a>`
                      )
                    }}
                  />
                </div>
                
                <div className="flex items-start space-x-4">
                  <span className="text-purple-400 font-bold text-lg">4.</span>
                  <p className="text-gray-300">{t('giftOfMasteryPage.process.step4')}</p>
                </div>
                
                <div className="flex items-start space-x-4">
                  <span className="text-purple-400 font-bold text-lg">5.</span>
                  <p className="text-gray-300">{t('giftOfMasteryPage.process.step5')}</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  <strong>{t('giftOfMasteryPage.process.noteTitle')}</strong> {t('giftOfMasteryPage.process.note')}
                </p>
              </div>
            </div>
          </div>

          {/* Precio y Discord */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Precio */}
            <div id="precio-detallado" className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mr-4">
                  <Gem className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">{t('giftOfMasteryPage.price.title')}</h2>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50 text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">{t('giftOfMasteryPage.price.current')}</div>
                <p className="text-gray-300 text-sm">{t('giftOfMasteryPage.price.updateNote')}</p>
              </div>
            </div>

            {/* Discord */}
            <div id="discord-detallado" className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/20 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">{t('giftOfMasteryPage.discord.title')}</h2>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
                <p className="text-gray-300 mb-4">
                  {t('giftOfMasteryPage.discord.description')}
                </p>
                <p className="text-gray-400 text-sm">{t('giftOfMasteryPage.discord.subtitle')}</p>
                <div className="text-center">
                  <a
                    href="https://discord.gg/gw2overflow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xl font-bold text-indigo-400 mb-2 hover:text-indigo-300 transition-colors inline-block cursor-pointer"
                  >
                    {t('giftOfMasteryPage.discord.serverName')}
                  </a>
                  <p className="text-indigo-300 text-xs mt-2">{t('giftOfMasteryPage.discord.clickToJoin')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Consejos */}
          <div id="consejos-detallado" className="bg-gradient-to-br from-pink-900/30 to-pink-800/20 backdrop-blur-sm border border-pink-500/30 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center mr-4">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('giftOfMasteryPage.tips.title')}</h2>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
              <p className="text-gray-300 mb-6 leading-relaxed">
                {t('giftOfMasteryPage.tips.description')}
              </p>
              
              <div className="space-y-6">
                <div className="border-l-4 border-pink-500 pl-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{t('giftOfMasteryPage.tips.contract.title')}</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    {t('giftOfMasteryPage.tips.contract.description')}
                  </p>
                  <div className="bg-slate-700/50 p-3 rounded text-xs text-gray-300 font-mono">
                    {t('giftOfMasteryPage.tips.contract.example')}
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    {t('giftOfMasteryPage.tips.contract.response')}
                  </p>
                </div>
                
                <div className="border-l-4 border-pink-500 pl-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{t('giftOfMasteryPage.tips.screenshots.title')}</h3>
                  <p className="text-gray-300 text-sm">
                    {t('giftOfMasteryPage.tips.screenshots.description')}
                  </p>
                </div>
                
                <div className="border-l-4 border-pink-500 pl-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{t('giftOfMasteryPage.tips.paymentOrder.title')}</h3>
                  <p className="text-gray-300 text-sm">
                    {t('giftOfMasteryPage.tips.paymentOrder.description')}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-pink-400 font-semibold">{t('giftOfMasteryPage.tips.goodLuck')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        
        {/* Thumbnail Image with Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 flex justify-center"
        >
          <div className="relative w-full max-w-4xl">
            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={prevImage}
                className="flex items-center justify-center w-10 h-10 bg-black/80 hover:bg-black text-white rounded-full transition-all duration-300 hover:scale-110"
                disabled={images.length <= 1}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'bg-yellow-500 scale-125' 
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
              
              <button
                onClick={nextImage}
                className="flex items-center justify-center w-10 h-10 bg-black/80 hover:bg-black text-white rounded-full transition-all duration-300 hover:scale-110"
                disabled={images.length <= 1}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Image Container */}
            <div className="relative w-full cursor-pointer group" onClick={() => setImageModalOpen(true)}>
              <Image
                src={images[currentImageIndex].src}
                alt={images[currentImageIndex].alt}
                width={1024}
                height={576}
                className="rounded-lg shadow-2xl border border-gray-700/50 transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
                  <ExternalLink className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="relative">
              <Image
                src={images[currentImageIndex].src}
                alt={images[currentImageIndex].alt}
                width={1024}
                height={576}
                className="w-full h-auto rounded-lg shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
