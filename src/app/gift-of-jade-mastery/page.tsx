'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Award, Star, Crown, Gem, Hammer, ExternalLink, Loader2, Info, Zap, X, ShoppingCart, Wrench, ArrowRight, MessageCircle, Lightbulb, ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useI18n } from '@/contexts/I18nContext'
import MaterialTracker from '@/components/MaterialTracker'
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
  runicStone: 79418,

  // Materiales específicos
  giftOfJadeMastery: 96033,
  gloryShards: 70820,
  battleMemories: 71581,
  stabilizingMatrices: 73248,
  adventureTale: 96151,
  lanternInsignia: 97790,
  supremePaper: 71148,
  deldrimorIngot: 46736,
  spiritualWood: 46738,
  thermocatalyticReagents: 46747,
  pureJadeFragments: 97102,
  jadeRunicStones: 96722,
  ancientGrayAmber: 96347,
  ancientInvocationStones: 96978,
  dragonMagnetiteStone: 92687,

  // Materiales T5
  t5Blood: 24294,
  t5Bone: 24341,
  t5Claw: 24350,
  t5Scale: 24356,
  t5Fang: 24288,
  t5Totem: 24299,
  t5Venom: 24282,
  t5Dust: 24276,

  // Materiales T4
  t4Blood: 24293,
  t4Bone: 24345,
  t4Claw: 24348,
  t4Dust: 24275,
  t4Fang: 24355,
  t4Scale: 24287,
  t4Totem: 24363,
  t4Venom: 24281,

  // Materiales T3
  t3Blood: 24292,
  t3Bone: 24344,
  t3Claw: 24349,
  t3Dust: 24274,
  t3Fang: 24354,
  t3Scale: 24286,
  t3Totem: 24298,
  t3Venom: 24280,

  // Materiales del vendedor
  giftOfCantha: 97096,
  jadeEmpressBlessing: 97829,
  exoticLuckEssence: 45178,
  hematiteShard: 20797,
  darkEnergyBall: 71994,
  researchNotes: 96052,
}

export default function GiftOfJadeMasteryPage() {
  usePageTitle('giftOfJadeMasteryPage.title', 'Gift of Jade Mastery')
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
      src: "/thumbnails/leg32.webp",
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
      return `https://${wikiDomain}/wiki/Gift_of_Jade_Mastery`
    }

    return `https://${wikiDomain}/wiki/${itemName.replace(/\s+/g, '_')}`
  }

  // Obtener el item principal con caché
  const gw2Lang = getGW2LangCode(lang)
  const { item: mainItem, loading: itemLoading } = useGW2Item(
    96033,
    gw2Lang,
    {
      timeout: 10000,
      fallback: FALLBACK_ITEMS.giftOfJadeMastery,
      onSuccess: (data) => {
        setItem(data as GiftOfMasteryItem)
        setApiOnline()
      },
      onError: () => {
        setItem(FALLBACK_ITEMS.giftOfJadeMastery)
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
        setItem(FALLBACK_ITEMS.giftOfJadeMastery)
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
      'consejos-detallado',
      'material-tracker'
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

      // Guardar posición de scroll en sessionStorage
      sessionStorage.setItem('gw2-gojm-scroll', window.scrollY.toString())
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Llamar una vez al cargar

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Restaurar posición de scroll al cargar la página
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('gw2-gojm-scroll')
    if (savedScroll && !loading) {
      // Esperar a que el contenido se cargue antes de hacer scroll
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll))
      }, 100)
    }
  }, [loading])

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

    // Si es runicStone, mostrar oro personalizado
    if (materialKey === 'runicStone') {
      return (
        <div className="flex items-start space-x-3" title={t('giftOfJadeMasteryPage.notes.runicStones')}>
          <div className="flex-shrink-0 w-6 h-6 relative">
            <Image
              src="/images/expansions/Gold.webp"
              alt="Gold"
              fill
              sizes="24px"
              className="object-contain"
              unoptimized
            />
          </div>
          <div>
            <span className="text-white font-semibold">100g</span>
            <p className="text-gray-400 text-sm">({t('giftOfJadeMasteryPage.notes.MysticRunicStones')})</p>
          </div>
        </div>
      )
    }

    // Si es un icono personalizado (URL directa)
    if (materialKey === 'customIcon') {
      return (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 relative">
            <Image
              src=""
              alt={t('giftOfJadeMasteryPage.materialItem.customIconAlt')}
              fill
              sizes="24px"
              className="object-contain"
              unoptimized
            />
          </div>
          <div>
            <span className="text-white font-semibold">{quantity} {t('giftOfJadeMasteryPage.materialItem.customMaterial')}</span>
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
            <span className="text-white font-semibold">{t('giftOfJadeMasteryPage.materialItem.loading')}</span>
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
            unoptimized
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
            <p className="text-lg text-gray-300">{t('giftOfJadeMasteryPage.loading')}</p>
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
              <p className="font-bold">{t('giftOfJadeMasteryPage.error.title')}</p>
              <p>{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              {t('giftOfJadeMasteryPage.error.retry')}
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
                <h3 className="text-white font-bold text-lg">{t('giftOfJadeMasteryPage.sidebar.title')}</h3>
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => handleScrollTo('comprador-detallado')}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${activeSection === 'comprador-detallado'
                    ? 'text-blue-400 bg-blue-900/30 border-l-4 border-blue-400 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                    }`}
                >
                  <ShoppingCart className={`w-4 h-4 mr-3 ${activeSection === 'comprador-detallado' ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'
                    }`} />
                  <span className="font-medium">{t('giftOfMasteryPage.sections.buyer')}</span>
                  {activeSection === 'comprador-detallado' && <ArrowRight className="w-3 h-3 ml-auto text-blue-400" />}
                </button>

                <button
                  onClick={() => handleScrollTo('vendedor-detallado')}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${activeSection === 'vendedor-detallado'
                    ? 'text-green-400 bg-green-900/30 border-l-4 border-green-400 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                    }`}
                >
                  <Wrench className={`w-4 h-4 mr-3 ${activeSection === 'vendedor-detallado' ? 'text-green-400' : 'text-gray-400 group-hover:text-green-400'
                    }`} />
                  <span className="font-medium">{t('giftOfMasteryPage.sections.seller')}</span>
                  {activeSection === 'vendedor-detallado' && <ArrowRight className="w-3 h-3 ml-auto text-green-400" />}
                </button>

                <button
                  onClick={() => handleScrollTo('proceso-detallado')}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${activeSection === 'proceso-detallado'
                    ? 'text-purple-400 bg-purple-900/30 border-l-4 border-purple-400 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                    }`}
                >
                  <Zap className={`w-4 h-4 mr-3 ${activeSection === 'proceso-detallado' ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'
                    }`} />
                  <span className="font-medium">{t('giftOfMasteryPage.sections.process')}</span>
                  {activeSection === 'proceso-detallado' && <ArrowRight className="w-3 h-3 ml-auto text-purple-400" />}
                </button>

                <button
                  onClick={() => handleScrollTo('discord-detallado')}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${activeSection === 'discord-detallado'
                    ? 'text-indigo-400 bg-indigo-900/30 border-l-4 border-indigo-400 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                    }`}
                >
                  <MessageCircle className={`w-4 h-4 mr-3 ${activeSection === 'discord-detallado' ? 'text-indigo-400' : 'text-gray-400 group-hover:text-indigo-400'
                    }`} />
                  <span className="font-medium">{t('giftOfMasteryPage.sections.discord')}</span>
                  {activeSection === 'discord-detallado' && <ArrowRight className="w-3 h-3 ml-auto text-indigo-400" />}
                </button>

                <button
                  onClick={() => handleScrollTo('consejos-detallado')}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${activeSection === 'consejos-detallado'
                    ? 'text-pink-400 bg-pink-900/30 border-l-4 border-pink-400 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/40 hover:translate-x-1'
                    }`}
                >
                  <Lightbulb className={`w-4 h-4 mr-3 ${activeSection === 'consejos-detallado' ? 'text-pink-400' : 'text-gray-400 group-hover:text-pink-400'
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
              {mobileMenuOpen ? <X className="w-8 h-8" /> : <Image src="/images/icons/index.webp" alt="Menu" width={32} height={32} className="w-8 h-8" unoptimized />}
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
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${activeSection === 'comprador-detallado'
                      ? 'text-blue-400 bg-blue-900/30 border-l-4 border-blue-400'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                      }`}
                  >
                    {t('giftOfMasteryPage.sections.buyer')}
                  </button>
                  <button
                    onClick={() => handleScrollTo('vendedor-detallado')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${activeSection === 'vendedor-detallado'
                      ? 'text-green-400 bg-green-900/30 border-l-4 border-green-400'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                      }`}
                  >
                    {t('giftOfMasteryPage.sections.seller')}
                  </button>
                  <button
                    onClick={() => handleScrollTo('proceso-detallado')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${activeSection === 'proceso-detallado'
                      ? 'text-purple-400 bg-purple-900/30 border-l-4 border-purple-400'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                      }`}
                  >
                    {t('giftOfMasteryPage.sections.process')}
                  </button>
                  <button
                    onClick={() => handleScrollTo('discord-detallado')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${activeSection === 'discord-detallado'
                      ? 'text-indigo-400 bg-indigo-900/30 border-l-4 border-indigo-400'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/40'
                      }`}
                  >
                    {t('giftOfMasteryPage.sections.discord')}
                  </button>
                  <button
                    onClick={() => handleScrollTo('consejos-detallado')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${activeSection === 'consejos-detallado'
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
                {item ? `${item.name}` : t('giftOfJadeMasteryPage.title')}
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
                        unoptimized
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
                        {t('giftOfJadeMasteryPage.itemInfo.viewWiki')}
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Material Tracker Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-12"
            >
              <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                      <Package className="w-6 h-6 text-yellow-400" />
                      {t('giftOfJadeMasteryPage.tracker.title', 'Material Tracker')}
                    </h3>
                    <p className="text-gray-300">
                      {t('giftOfJadeMasteryPage.tracker.description', 'Rastrea tu progreso en todos los materiales necesarios')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleScrollTo('material-tracker')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
                  >
                    <Package className="w-5 h-5" />
                    {t('giftOfJadeMasteryPage.tracker.goToTracker', 'Ir al Tracker')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Features Grid */}
            {/* Content Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-12"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4 text-center">📋 {t('giftOfJadeMasteryPage.sections.guideIndex')}</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-2 justify-items-center">
                  <button
                    onClick={() => handleScrollTo('comprador-detallado')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors group ${activeSection === 'comprador-detallado'
                      ? 'bg-blue-900/40 border-2 border-blue-400 shadow-lg shadow-blue-900/20'
                      : 'bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/40'
                      }`}
                  >
                    <Info className={`w-4 h-4 mb-1 ${activeSection === 'comprador-detallado'
                      ? 'text-blue-300'
                      : 'text-blue-400 group-hover:text-blue-300'
                      }`} />
                    <span className={`font-semibold text-xs ${activeSection === 'comprador-detallado'
                      ? 'text-blue-300'
                      : 'text-white'
                      }`}>{t('giftOfJadeMasteryPage.sections.buyer')}</span>
                  </button>

                  <button
                    onClick={() => handleScrollTo('vendedor-detallado')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors group ${activeSection === 'vendedor-detallado'
                      ? 'bg-green-900/40 border-2 border-green-400 shadow-lg shadow-green-900/20'
                      : 'bg-green-900/20 border border-green-500/30 hover:bg-green-900/40'
                      }`}
                  >
                    <Hammer className={`w-4 h-4 mb-1 ${activeSection === 'vendedor-detallado'
                      ? 'text-green-300'
                      : 'text-green-400 group-hover:text-green-300'
                      }`} />
                    <span className={`font-semibold text-xs ${activeSection === 'vendedor-detallado'
                      ? 'text-green-300'
                      : 'text-white'
                      }`}>{t('giftOfJadeMasteryPage.sections.seller')}</span>
                  </button>

                  <button
                    onClick={() => handleScrollTo('proceso-detallado')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors group ${activeSection === 'proceso-detallado'
                      ? 'bg-purple-900/40 border-2 border-purple-400 shadow-lg shadow-purple-900/20'
                      : 'bg-purple-900/20 border border-purple-500/30 hover:bg-purple-900/40'
                      }`}
                  >
                    <Zap className={`w-4 h-4 mb-1 ${activeSection === 'proceso-detallado'
                      ? 'text-purple-300'
                      : 'text-purple-400 group-hover:text-purple-300'
                      }`} />
                    <span className={`font-semibold text-xs ${activeSection === 'proceso-detallado'
                      ? 'text-purple-300'
                      : 'text-white'
                      }`}>{t('giftOfJadeMasteryPage.sections.process')}</span>
                  </button>

                  <button
                    onClick={() => handleScrollTo('discord-detallado')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors group ${activeSection === 'discord-detallado'
                      ? 'bg-indigo-900/40 border-2 border-indigo-400 shadow-lg shadow-indigo-900/20'
                      : 'bg-indigo-900/20 border border-indigo-500/30 hover:bg-indigo-900/40'
                      }`}
                  >
                    <Star className={`w-4 h-4 mb-1 ${activeSection === 'discord-detallado'
                      ? 'text-indigo-300'
                      : 'text-indigo-400 group-hover:text-indigo-300'
                      }`} />
                    <span className={`font-semibold text-xs ${activeSection === 'discord-detallado'
                      ? 'text-indigo-300'
                      : 'text-white'
                      }`}>{t('giftOfJadeMasteryPage.sections.discord')}</span>
                  </button>

                  <button
                    onClick={() => handleScrollTo('consejos-detallado')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors group ${activeSection === 'consejos-detallado'
                      ? 'bg-pink-900/40 border-2 border-pink-400 shadow-lg shadow-pink-900/20'
                      : 'bg-pink-900/20 border border-pink-500/30 hover:bg-pink-900/40'
                      }`}
                  >
                    <Crown className={`w-4 h-4 mb-1 ${activeSection === 'consejos-detallado'
                      ? 'text-pink-300'
                      : 'text-pink-400 group-hover:text-pink-300'
                      }`} />
                    <span className={`font-semibold text-xs ${activeSection === 'consejos-detallado'
                      ? 'text-pink-300'
                      : 'text-white'
                      }`}>{t('giftOfJadeMasteryPage.sections.tips')}</span>
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
                  <h2 className="text-2xl font-bold text-white">{t('giftOfJadeMasteryPage.buyer.title')}</h2>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('giftOfJadeMasteryPage.buyer.description').replace('{itemName}', item ? item.name : 'Don del Dominio de Jade')}
                  </p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 relative">
                            <Image
                              src="/images/icons/raw.webp"
                              alt={t('giftOfJadeMasteryPage.materialItem.precursorWeapon')}
                              fill
                              sizes="24px"
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                          <div>
                            <span className="text-white font-semibold">{t('giftOfJadeMasteryPage.buyer.precursorWeapon')}</span>
                            <p className="text-gray-400 text-sm">{t('giftOfJadeMasteryPage.buyer.precursorWeaponDesc')}</p>
                          </div>
                        </div>

                        <MaterialItem
                          materialKey="gloryShards"
                          quantity={250}
                        />

                        <MaterialItem
                          materialKey="battleMemories"
                          quantity={250}
                        />

                        <MaterialItem
                          materialKey="stabilizingMatrices"
                          quantity={75}
                        />
                      </div>

                      <div className="space-y-3">
                        <MaterialItem
                          materialKey="mysticCoin"
                          quantity={115}
                        />

                        <MaterialItem
                          materialKey="ectoplasm"
                          quantity={115}
                        />

                        <MaterialItem
                          materialKey="dragonMagnetiteStone"
                          quantity={5}
                        />

                        <MaterialItem
                          materialKey="lanternInsignia"
                          quantity={10}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <MaterialItem
                          materialKey="adventureTale"
                          quantity={10}
                        />

                        <MaterialItem
                          materialKey="supremePaper"
                          quantity={1}
                        />

                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 relative">
                              {materials.spiritualWood?.icon ? (
                                <Image
                                  src={materials.spiritualWood.icon}
                                  alt={t('giftOfJadeMasteryPage.materialItem.spiritualWood')}
                                  fill
                                  sizes="24px"
                                  className="object-contain"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-yellow-400 font-bold text-lg">•</span>
                              )}
                            </div>
                            <span className="text-white font-semibold">2 {materials.spiritualWood?.name || '46738'}</span>
                            <span className="text-gray-400 text-sm">{t('giftOfJadeMasteryPage.materialItem.or')}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 relative">
                              {materials.deldrimorIngot?.icon ? (
                                <Image
                                  src={materials.deldrimorIngot.icon}
                                  alt={t('giftOfJadeMasteryPage.materialItem.deldrimorIngot')}
                                  fill
                                  sizes="24px"
                                  className="object-contain"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-yellow-400 font-bold text-lg">•</span>
                              )}
                            </div>
                            <span className="text-white font-semibold">3 {materials.deldrimorIngot?.name || '46736'}</span>
                          </div>
                        </div>

                        <MaterialItem
                          materialKey="thermocatalyticReagents"
                          quantity={300}
                        />
                      </div>

                      <div className="space-y-3">
                        <MaterialItem
                          materialKey="pureJadeFragments"
                          quantity={200}
                        />

                        <MaterialItem
                          materialKey="jadeRunicStones"
                          quantity={100}
                        />

                        <MaterialItem
                          materialKey="ancientGrayAmber"
                          quantity={100}
                        />

                        <MaterialItem
                          materialKey="ancientInvocationStones"
                          quantity={100}
                        />
                        <MaterialItem
                          materialKey="runicStone"
                          quantity={100}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                        <h4 className="text-white font-semibold mb-4 flex items-center">
                          <span className="text-yellow-400 font-bold text-lg mr-2">•</span>
                          {t('giftOfJadeMasteryPage.materialItem.t6Materials')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <MaterialItem materialKey="t6Claw" quantity={100} />
                          <MaterialItem materialKey="t6Blood" quantity={100} />
                          <MaterialItem materialKey="t6Fang" quantity={100} />
                          <MaterialItem materialKey="t6Scale" quantity={100} />
                          <MaterialItem materialKey="t6Totem" quantity={100} />
                          <MaterialItem materialKey="t6Bone" quantity={100} />
                          <MaterialItem materialKey="t6Venom" quantity={100} />
                          <MaterialItem materialKey="t6Dust" quantity={105} note={t('giftOfJadeMasteryPage.materialItem.extraNote')} />
                        </div>
                      </div>

                      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                        <h4 className="text-white font-semibold mb-4 flex items-center">
                          <span className="text-yellow-400 font-bold text-lg mr-2">•</span>
                          {t('giftOfJadeMasteryPage.materialItem.t5Materials')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <MaterialItem materialKey="t5Claw" quantity={250} />
                          <MaterialItem materialKey="t5Blood" quantity={250} />
                          <MaterialItem materialKey="t5Fang" quantity={250} />
                          <MaterialItem materialKey="t5Scale" quantity={250} />
                          <MaterialItem materialKey="t5Totem" quantity={250} />
                          <MaterialItem materialKey="t5Bone" quantity={250} />
                          <MaterialItem materialKey="t5Venom" quantity={250} />
                          <MaterialItem materialKey="t5Dust" quantity={250} />
                        </div>
                      </div>

                      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                        <h4 className="text-white font-semibold mb-4 flex items-center">
                          <span className="text-yellow-400 font-bold text-lg mr-2">•</span>
                          {t('giftOfJadeMasteryPage.materialItem.t3Materials')} y {t('giftOfJadeMasteryPage.materialItem.t4Materials')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <MaterialItem materialKey="t4Blood" quantity={50} />
                          <MaterialItem materialKey="t3Blood" quantity={50} />
                          <MaterialItem materialKey="t4Bone" quantity={50} />
                          <MaterialItem materialKey="t3Bone" quantity={50} />
                          <MaterialItem materialKey="t3Claw" quantity={50} />
                          <MaterialItem materialKey="t4Claw" quantity={50} />
                          <MaterialItem materialKey="t4Dust" quantity={50} />
                          <MaterialItem materialKey="t3Dust" quantity={50} />
                          <MaterialItem materialKey="t4Fang" quantity={50} />
                          <MaterialItem materialKey="t3Fang" quantity={50} />
                          <MaterialItem materialKey="t4Scale" quantity={50} />
                          <MaterialItem materialKey="t3Scale" quantity={50} />
                          <MaterialItem materialKey="t4Totem" quantity={50} />
                          <MaterialItem materialKey="t3Totem" quantity={50} />
                          <MaterialItem materialKey="t4Venom" quantity={50} />
                          <MaterialItem materialKey="t3Venom" quantity={50} />
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
                  <h2 className="text-2xl font-bold text-white">{t('giftOfJadeMasteryPage.seller.title')}</h2>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('giftOfJadeMasteryPage.seller.description')}
                  </p>

                  <div className="space-y-6">
                    {/* Requisitos del Vendedor */}
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">


                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <span className="text-green-400 font-bold text-lg">1.</span>
                            <div className="flex-1">
                              <MaterialItem materialKey="giftOfCantha" quantity={1} />
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <span className="text-green-400 font-bold text-lg">2.</span>
                            <div className="flex-1">
                              <MaterialItem materialKey="jadeEmpressBlessing" quantity={5} />
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <span className="text-green-400 font-bold text-lg">3.</span>
                            <div className="flex-1">
                              <MaterialItem materialKey="exoticLuckEssence" quantity={250} />
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <span className="text-green-400 font-bold text-lg">4.</span>
                            <div className="flex-1">
                              <MaterialItem materialKey="hematiteShard" quantity={1} />
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <span className="text-green-400 font-bold text-lg">5.</span>
                            <div className="flex-1">
                              <MaterialItem materialKey="giftOfBattle" quantity={1} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <span className="text-green-400 font-bold text-lg">6.</span>
                            <div className="flex-1">
                              <MaterialItem materialKey="darkEnergyBall" quantity={1} />
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <span className="text-green-400 font-bold text-lg">7.</span>
                            <div className="flex-1">
                              <MaterialItem materialKey="spiritShard" quantity={70} />
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <span className="text-green-400 font-bold text-lg">8.</span>
                            <div className="flex-1">
                              <MaterialItem materialKey="obsidianShard" quantity={115} />
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <span className="text-green-400 font-bold text-lg">9.</span>
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <Image
                                  src="https://wiki.guildwars2.com/images/4/46/Weaponsmith_tango_icon_20px.png"
                                  alt={t('giftOfJadeMasteryPage.seller.weaponsmith')}
                                  width={20}
                                  height={20}
                                  className="w-5 h-5"
                                  unoptimized
                                />
                                <span className="text-white font-semibold">/</span>
                                <Image
                                  src="https://wiki.guildwars2.com/images/b/b7/Artificer_tango_icon_20px.png"
                                  alt={t('giftOfJadeMasteryPage.seller.artificer')}
                                  width={20}
                                  height={20}
                                  className="w-5 h-5"
                                  unoptimized
                                />
                                <span className="text-white font-semibold">/</span>
                                <Image
                                  src="https://wiki.guildwars2.com/images/f/f3/Huntsman_tango_icon_20px.png"
                                  alt={t('giftOfJadeMasteryPage.seller.huntsman')}
                                  width={20}
                                  height={20}
                                  className="w-5 h-5"
                                  unoptimized
                                />
                              </div>
                              <span className="text-white font-semibold">al 500</span>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <span className="text-green-400 font-bold text-lg">10.</span>
                            <div className="flex-1">
                              <MaterialItem materialKey="researchNotes" quantity={2500} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-green-500/30">
                        <div className="flex items-start space-x-3">
                          <span className="text-green-400 font-bold text-lg">11.</span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Image
                                src="https://wiki.guildwars2.com/images/b/b7/Mastery_point_%28Central_Tyria%29.png"
                                alt="Mastery Point"
                                width={20}
                                height={20}
                                className="w-5 h-5"
                                unoptimized
                              />
                              <span className="text-white font-semibold">{t('giftOfJadeMasteryPage.seller.masteryTitle')}</span>
                            </div>
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                              <p className="text-blue-200 text-sm mb-2">
                                <strong>{t('giftOfJadeMasteryPage.seller.masteryRequirements')}</strong>
                              </p>
                              <div className="space-y-1 text-xs text-blue-100">
                                <div className="flex justify-between">
                                  <span>• {t('giftOfJadeMasteryPage.seller.reveredAntiquarian')}</span>
                                  <span className="text-blue-300">1 {t('giftOfJadeMasteryPage.seller.masteryPoints')}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• {t('giftOfJadeMasteryPage.seller.magisterOfLegends')}</span>
                                  <span className="text-blue-300">3 {t('giftOfJadeMasteryPage.seller.masteryPoints')}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• {t('giftOfJadeMasteryPage.seller.historianOfArmaments')}</span>
                                  <span className="text-blue-300">6 {t('giftOfJadeMasteryPage.seller.masteryPoints')}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• {t('giftOfJadeMasteryPage.seller.scholarOfSecrets')}</span>
                                  <span className="text-blue-300">9 {t('giftOfJadeMasteryPage.seller.masteryPoints')}</span>
                                </div>
                                <div className="border-t border-blue-500/30 pt-1 mt-2">
                                  <div className="flex justify-between font-semibold">
                                    <span>{t('giftOfJadeMasteryPage.seller.totalMasteryPoints')}</span>
                                    <span className="text-blue-300">{t('giftOfJadeMasteryPage.seller.totalMasteryPointsValue')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <span className="text-yellow-400 font-bold text-lg">{t('giftOfJadeMasteryPage.seller.optional')}</span>
                          <div className="flex-1">
                            <MaterialItem materialKey="mysticClover" quantity={38} />
                            <p className="text-yellow-200 text-sm mt-1">{t('giftOfJadeMasteryPage.seller.optionalNote')}</p>
                          </div>
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
                  <h2 className="text-2xl font-bold text-white">{t('giftOfJadeMasteryPage.process.title')}</h2>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {t('giftOfJadeMasteryPage.process.description')}
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <span className="text-purple-400 font-bold text-lg">1.</span>
                      <p className="text-gray-300">{t('giftOfJadeMasteryPage.process.step1Text')}</p>
                    </div>

                    <div className="flex items-start space-x-4">
                      <span className="text-purple-400 font-bold text-lg">2.</span>
                      <p className="text-gray-300">{t('giftOfJadeMasteryPage.process.step2Text')}</p>
                    </div>

                    <div className="flex items-start space-x-4">
                      <span className="text-purple-400 font-bold text-lg">3.</span>
                      <p className="text-gray-300">
                        {t('giftOfJadeMasteryPage.process.step3Text')}
                        <a href="https://wiki.guildwars2.com/wiki/Legendary_weapon" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline"> {t('giftOfJadeMasteryPage.wiki.link')}</a>
                      </p>
                    </div>

                    <div className="flex items-start space-x-4">
                      <span className="text-purple-400 font-bold text-lg">4.</span>
                      <p className="text-gray-300">{t('giftOfJadeMasteryPage.process.step4Text')}</p>
                    </div>

                    <div className="flex items-start space-x-4">
                      <span className="text-purple-400 font-bold text-lg">5.</span>
                      <p className="text-gray-300">{t('giftOfJadeMasteryPage.process.step5Text')}</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-200 text-sm">
                      <strong>{t('giftOfJadeMasteryPage.process.noteTitle')}</strong> {t('giftOfJadeMasteryPage.process.noteText')}
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
                    <div className="text-4xl font-bold text-yellow-400 mb-2">{t('giftOfJadeMasteryPage.price.currentPrice')}</div>
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
                        {t('giftOfJadeMasteryPage.tips.contract.example')}
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
                    <p className="text-pink-400 font-semibold">{t('giftOfJadeMasteryPage.tips.goodLuck')}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Material Tracker - Sección completa */}
            <motion.div
              id="material-tracker"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-12"
            >
              <MaterialTracker
                title={t('giftOfJadeMasteryPage.tracker.title', 'Material Tracker')}
                description={t('giftOfJadeMasteryPage.tracker.description', 'Rastrea tu progreso en los materiales necesarios')}
                materials={{
                  // Materiales principales del comprador
                  gloryShards: { id: ITEM_IDS.gloryShards, name: materials.gloryShards?.name || 'Glory Shard', icon: materials.gloryShards?.icon, required: 250 },
                  battleMemories: { id: ITEM_IDS.battleMemories, name: materials.battleMemories?.name || 'Battle Memory', icon: materials.battleMemories?.icon, required: 250 },
                  stabilizingMatrices: { id: ITEM_IDS.stabilizingMatrices, name: materials.stabilizingMatrices?.name || 'Stabilizing Matrix', icon: materials.stabilizingMatrices?.icon, required: 75 },
                  mysticCoin: { id: ITEM_IDS.mysticCoin, name: materials.mysticCoin?.name || 'Mystic Coin', icon: materials.mysticCoin?.icon, required: 115 },
                  ectoplasm: { id: ITEM_IDS.ectoplasm, name: materials.ectoplasm?.name || 'Glob of Ectoplasm', icon: materials.ectoplasm?.icon, required: 115 },
                  dragonMagnetiteStone: { id: ITEM_IDS.dragonMagnetiteStone, name: materials.dragonMagnetiteStone?.name || 'Dragon Magnetite Stone', icon: materials.dragonMagnetiteStone?.icon, required: 5 },
                  lanternInsignia: { id: ITEM_IDS.lanternInsignia, name: materials.lanternInsignia?.name || 'Lantern Insignia', icon: materials.lanternInsignia?.icon, required: 10 },
                  adventureTale: { id: ITEM_IDS.adventureTale, name: materials.adventureTale?.name || 'Adventure Tale', icon: materials.adventureTale?.icon, required: 10 },
                  supremePaper: { id: ITEM_IDS.supremePaper, name: materials.supremePaper?.name || 'Supreme Paper', icon: materials.supremePaper?.icon, required: 1 },
                  thermocatalyticReagents: { id: ITEM_IDS.thermocatalyticReagents, name: materials.thermocatalyticReagents?.name || 'Thermocatalytic Reagent', icon: materials.thermocatalyticReagents?.icon, required: 300 },

                  // Materiales específicos de Cantha
                  pureJadeFragments: { id: ITEM_IDS.pureJadeFragments, name: materials.pureJadeFragments?.name || 'Pure Jade Fragment', icon: materials.pureJadeFragments?.icon, required: 200 },
                  jadeRunicStones: { id: ITEM_IDS.jadeRunicStones, name: materials.jadeRunicStones?.name || 'Jade Runic Stone', icon: materials.jadeRunicStones?.icon, required: 100 },
                  ancientGrayAmber: { id: ITEM_IDS.ancientGrayAmber, name: materials.ancientGrayAmber?.name || 'Ancient Gray Amber', icon: materials.ancientGrayAmber?.icon, required: 100 },
                  ancientInvocationStones: { id: ITEM_IDS.ancientInvocationStones, name: materials.ancientInvocationStones?.name || 'Ancient Invocation Stone', icon: materials.ancientInvocationStones?.icon, required: 100 },

                  // Materiales T6 (100 de cada uno, excepto Dust que son 105)
                  t6Claw: { id: ITEM_IDS.t6Claw, name: materials.t6Claw?.name || 'Vicious Claw', icon: materials.t6Claw?.icon, required: 100 },
                  t6Blood: { id: ITEM_IDS.t6Blood, name: materials.t6Blood?.name || 'Vial of Powerful Blood', icon: materials.t6Blood?.icon, required: 100 },
                  t6Fang: { id: ITEM_IDS.t6Fang, name: materials.t6Fang?.name || 'Vicious Fang', icon: materials.t6Fang?.icon, required: 100 },
                  t6Scale: { id: ITEM_IDS.t6Scale, name: materials.t6Scale?.name || 'Armored Scale', icon: materials.t6Scale?.icon, required: 100 },
                  t6Totem: { id: ITEM_IDS.t6Totem, name: materials.t6Totem?.name || 'Elaborate Totem', icon: materials.t6Totem?.icon, required: 100 },
                  t6Bone: { id: ITEM_IDS.t6Bone, name: materials.t6Bone?.name || 'Ancient Bone', icon: materials.t6Bone?.icon, required: 100 },
                  t6Venom: { id: ITEM_IDS.t6Venom, name: materials.t6Venom?.name || 'Vial of Potent Venom', icon: materials.t6Venom?.icon, required: 100 },
                  t6Dust: { id: ITEM_IDS.t6Dust, name: materials.t6Dust?.name || 'Pile of Crystalline Dust', icon: materials.t6Dust?.icon, required: 105 },

                  // Materiales T5 (250 de cada uno)
                  t5Claw: { id: ITEM_IDS.t5Claw, name: materials.t5Claw?.name || 'Large Claw', icon: materials.t5Claw?.icon, required: 250 },
                  t5Blood: { id: ITEM_IDS.t5Blood, name: materials.t5Blood?.name || 'Vial of Thick Blood', icon: materials.t5Blood?.icon, required: 250 },
                  t5Fang: { id: ITEM_IDS.t5Fang, name: materials.t5Fang?.name || 'Large Fang', icon: materials.t5Fang?.icon, required: 250 },
                  t5Scale: { id: ITEM_IDS.t5Scale, name: materials.t5Scale?.name || 'Large Scale', icon: materials.t5Scale?.icon, required: 250 },
                  t5Totem: { id: ITEM_IDS.t5Totem, name: materials.t5Totem?.name || 'Intricate Totem', icon: materials.t5Totem?.icon, required: 250 },
                  t5Bone: { id: ITEM_IDS.t5Bone, name: materials.t5Bone?.name || 'Heavy Bone', icon: materials.t5Bone?.icon, required: 250 },
                  t5Venom: { id: ITEM_IDS.t5Venom, name: materials.t5Venom?.name || 'Vial of Thick Venom', icon: materials.t5Venom?.icon, required: 250 },
                  t5Dust: { id: ITEM_IDS.t5Dust, name: materials.t5Dust?.name || 'Pile of Incandescent Dust', icon: materials.t5Dust?.icon, required: 250 },

                  // Materiales T4 (50 de cada uno)
                  t4Blood: { id: ITEM_IDS.t4Blood, name: materials.t4Blood?.name || 'Vial of Blood', icon: materials.t4Blood?.icon, required: 50 },
                  t4Bone: { id: ITEM_IDS.t4Bone, name: materials.t4Bone?.name || 'Bone', icon: materials.t4Bone?.icon, required: 50 },
                  t4Claw: { id: ITEM_IDS.t4Claw, name: materials.t4Claw?.name || 'Claw', icon: materials.t4Claw?.icon, required: 50 },
                  t4Dust: { id: ITEM_IDS.t4Dust, name: materials.t4Dust?.name || 'Pile of Luminous Dust', icon: materials.t4Dust?.icon, required: 50 },
                  t4Fang: { id: ITEM_IDS.t4Fang, name: materials.t4Fang?.name || 'Fang', icon: materials.t4Fang?.icon, required: 50 },
                  t4Scale: { id: ITEM_IDS.t4Scale, name: materials.t4Scale?.name || 'Scale', icon: materials.t4Scale?.icon, required: 50 },
                  t4Totem: { id: ITEM_IDS.t4Totem, name: materials.t4Totem?.name || 'Totem', icon: materials.t4Totem?.icon, required: 50 },
                  t4Venom: { id: ITEM_IDS.t4Venom, name: materials.t4Venom?.name || 'Vial of Venom', icon: materials.t4Venom?.icon, required: 50 },

                  // Materiales T3 (50 de cada uno)
                  t3Blood: { id: ITEM_IDS.t3Blood, name: materials.t3Blood?.name || 'Vial of Thin Blood', icon: materials.t3Blood?.icon, required: 50 },
                  t3Bone: { id: ITEM_IDS.t3Bone, name: materials.t3Bone?.name || 'Small Bone', icon: materials.t3Bone?.icon, required: 50 },
                  t3Claw: { id: ITEM_IDS.t3Claw, name: materials.t3Claw?.name || 'Small Claw', icon: materials.t3Claw?.icon, required: 50 },
                  t3Dust: { id: ITEM_IDS.t3Dust, name: materials.t3Dust?.name || 'Pile of Radiant Dust', icon: materials.t3Dust?.icon, required: 50 },
                  t3Fang: { id: ITEM_IDS.t3Fang, name: materials.t3Fang?.name || 'Small Fang', icon: materials.t3Fang?.icon, required: 50 },
                  t3Scale: { id: ITEM_IDS.t3Scale, name: materials.t3Scale?.name || 'Small Scale', icon: materials.t3Scale?.icon, required: 50 },
                  t3Totem: { id: ITEM_IDS.t3Totem, name: materials.t3Totem?.name || 'Small Totem', icon: materials.t3Totem?.icon, required: 50 },
                  t3Venom: { id: ITEM_IDS.t3Venom, name: materials.t3Venom?.name || 'Vial of Weak Venom', icon: materials.t3Venom?.icon, required: 50 },
                }}
              />
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
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentImageIndex
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
                    alt={images[currentImageIndex]?.alt || 'Gift of Jade Mastery'}
                    width={1024}
                    height={576}
                    className="rounded-lg shadow-2xl border border-gray-700/50 transition-transform duration-300 group-hover:scale-105"
                    unoptimized
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
                alt={images[currentImageIndex]?.alt || 'Gift of Jade Mastery'}
                width={1024}
                height={576}
                className="w-full h-auto rounded-lg shadow-2xl"
                unoptimized
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
