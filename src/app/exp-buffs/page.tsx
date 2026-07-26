'use client'

import { motion } from 'framer-motion'
import { Zap, Sparkles, Info, Loader2 } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useI18n } from '@/contexts/I18nContext'
import Image from 'next/image'
import { useGW2Items } from '@/hooks/useGW2ItemCache'
import { useState, useEffect } from 'react'
import WikiTooltip from '@/components/ui/WikiTooltip'
import { gw2WikiUrl } from '@/lib/gw2-wiki'

interface GW2Item {
  id: number
  name: string
  icon: string
  description?: string
  type?: string
  rarity?: string
}

interface ExpBuffConfig {
  itemId: number | null // null para buffs que no son items (Resting, Enlightenment)
  boost: string
  notes?: string
  specialNote?: string // Flag para notas con renderizado especial
  fallbackName?: string
  fallbackIcon?: string
  fallbackWiki?: string
}

// Configuración de buffs con IDs de la API de GW2
const EXP_BUFFS_CONFIG: ExpBuffConfig[] = [
  {
    itemId: 82060, // Black Lion Booster
    boost: '+50% Exp',
  },
  {
    itemId: 67393, // Candy Corn Gobbler
    boost: '+50% Exp and +100% Exp from kills',
    notes: 'expBuffs.candyCorn.notes',
    specialNote: 'candyCorn' // Flag para mostrar nombre de Candy Corn desde ID 36041
  },
  {
    itemId: 45003, // Birthday Booster
    boost: '+100% Exp',
  },
  {
    itemId: 92585, // Snowflake Gobbler
    boost: '+25% Exp',
  },
  {
    itemId: 77656,
    boost: '+10% Exp',
  },
  {
    itemId: 89002, // Soul Pastry
    boost: '+15% Exp',
    notes: 'expBuffs.soulPastry.notes', // Tiene renderizado especial con item 42877 clickeable
    specialNote: 'itemEnhancement' // Flag para renderizado especial con ID 42877
  },
  {
    itemId: 93241, // Chatoyant Elixir
    boost: '+20% Exp',
    notes: 'expBuffs.chatoyant.notes', // Tiene renderizado especial con Utility Primer clickeable
    specialNote: 'utilityPrimer' //
  },
  {
    itemId: 77750, // Lucky Draketail
    boost: '+5% Exp',
    notes: 'expBuffs.luckyDraketail.notes',
    fallbackName: 'Lucky Draketail',
    fallbackIcon: 'https://render.guildwars2.com/file/6C4BE9B0B3E7C0C7F6F1F1F3D6B0E4E1E4C2F7CE/1234569.png',
  },
  {
    itemId: 39330, // Experienced Enrichment
    boost: '+20% Exp',
  },
  {
    itemId: null, // Guild XP Gain 
    boost: '+10% Exp',
    notes: 'expBuffs.guildXP.notes',
    fallbackName: 'expBuffs.guildXP.name',
    fallbackIcon: 'https://wiki.guildwars2.com/images/f/fe/Endless_Gift_Dolyak_Tonic.png',
    fallbackWiki: 'https://wiki.guildwars2.com/wiki/Guild_XP_Gain'
  },
  {
    itemId: null, // Guild Heroes Banner Boost
    boost: '+15% Exp',
    fallbackName: 'expBuffs.guildHeroesBanner.name',
    fallbackIcon: 'https://wiki.guildwars2.com/images/a/ae/Guild_Heroes_Banner.png',
    fallbackWiki: 'https://wiki.guildwars2.com/wiki/Guild_Heroes_Banner_Boost'
  },
  {
    itemId: null, // Resting
    boost: '+25% Exp',
    notes: 'expBuffs.resting.notes',
    fallbackName: 'expBuffs.resting.name',
    fallbackIcon: 'https://wiki.guildwars2.com/images/b/be/Resting.png',
    fallbackWiki: 'https://wiki.guildwars2.com/wiki/Resting'
  },
  {
    itemId: null, // Enlightenment
    boost: '+20% Exp',
    fallbackName: 'expBuffs.enlightenment.name',
    fallbackIcon: 'https://wiki.guildwars2.com/images/f/fa/Enlightenment.png',
    fallbackWiki: 'https://wiki.guildwars2.com/wiki/Enlightenment'
  },
  {
    itemId: null, // Ancient Canthan Secret
    boost: '+20% Exp',
    notes: 'expBuffs.ancientCanthan.notes',
    fallbackName: 'expBuffs.ancientCanthan.name',
    fallbackIcon: 'https://wiki.guildwars2.com/images/f/fa/Enlightenment.png',
    fallbackWiki: 'https://wiki.guildwars2.com/wiki/Ancient_Canthan_Secret_(effect)'
  }
]

// Clic → wiki (es → inglés). Mantiene el nombre del componente por compatibilidad.
function SimpleWikiTooltip({
  name,
  buffKey,
  children,
}: {
  name: string
  icon?: string
  boost?: string
  notes?: string
  buffKey?: string
  onlyEnglish?: boolean
  children: React.ReactNode
}) {
  const { lang } = useI18n()
  const buffNameMap: Record<string, string> = {
    'expBuffs.resting.name': 'Resting',
    'expBuffs.enlightenment.name': 'Enlightenment',
    'expBuffs.ancientCanthan.name': 'Ancient Canthan Secret (effect)',
    'expBuffs.guildXP.name': 'Guild XP Gain',
    'expBuffs.guildHeroesBanner.name': 'Guild Heroes Banner Boost',
  }
  const wikiName = (buffKey && buffNameMap[buffKey]) || name

  return (
    <a
      href={gw2WikiUrl(wikiName, lang)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  )
}

export default function ExpBuffsPage() {
  usePageTitle('expBuffs.pageTitle', 'Experience Buffs Guide')
  const { t, lang } = useI18n()
  const [itemsData, setItemsData] = useState<Record<number, GW2Item>>({})

  // Mapear código de idioma de la app al código de la API de GW2
  const getGW2LangCode = (lang: string) => {
    const langMap: Record<string, string> = {
      'es': 'es',
      'en': 'en',
      'de': 'de',
      'fr': 'fr'
    }
    return langMap[lang] || 'en'
  }

  // Generar URL de la wiki según el idioma
  const getWikiUrl = (itemName: string, lang: string) => {
    const wikiMap: Record<string, string> = {
      'es': 'wiki.guildwars2.com',
      'en': 'wiki.guildwars2.com',
      'de': 'wiki-de.guildwars2.com',
      'fr': 'wiki-fr.guildwars2.com'
    }
    const wikiDomain = wikiMap[lang] || 'wiki.guildwars2.com'
    const encodedName = encodeURIComponent(itemName.replace(/\s+/g, '_'))
    return `https://${wikiDomain}/wiki/${encodedName}`
  }

  // Obtener solo los IDs que no son null
  const itemIds = EXP_BUFFS_CONFIG
    .filter(buff => buff.itemId !== null)
    .map(buff => buff.itemId as number)

  // Agregar items adicionales a la lista de items a cargar
  const allItemIds = [...itemIds, 8469, 42877, 36041, 69910] // 8469 = Utility Primer, 42877 = Soul Pastry enhancement, 36041 = Candy Corn, 69910 = Spirit Shard

  const gw2Lang = getGW2LangCode(lang)
  const { items, loading } = useGW2Items(allItemIds, gw2Lang, {
    timeout: 15000,
  })

  // Actualizar estado cuando se cargan los items
  useEffect(() => {
    if (items && Object.keys(items).length > 0) {
      setItemsData(items as Record<number, GW2Item>)
    }
  }, [items])

  return (
    <div className="exp-buffs-page">
      
      <div className="container mx-auto px-4 pb-12 pt-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {t('expBuffs.title', 'Experience Buffs Guide')}
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
            {t('expBuffs.subtitle', 'Maximize your Spirit Shard farming with optimal experience buffs')}
          </p>
          
          {/* Introduction Card */}
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="text-lg font-bold text-white mb-2">{t('expBuffs.about.title', 'About This Preparation')}</h3>
                <p className="text-gray-300 leading-relaxed">
                  {t('expBuffs.about.description1', 'This standard preparation focuses on obtaining')}{' '}
                  {itemsData[69910] ? (
                    <WikiTooltip itemId={69910} itemData={itemsData[69910]}>
                      <span className="text-yellow-400 font-semibold hover:text-yellow-300 underline cursor-pointer">
                        {itemsData[69910].name}
                      </span>
                    </WikiTooltip>
                  ) : (
                    <span className="text-yellow-400 font-semibold">{t('expBuffs.about.spiritShards', 'Spirit Shards')}</span>
                  )}{' '}
                  {t('expBuffs.about.description2', 'since it\'s one of the most important currencies in the Guild Wars 2 economy.')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="ml-3 text-gray-300">Loading buffs data...</span>
          </div>
        )}

        {/* Buffs Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {EXP_BUFFS_CONFIG.map((buffConfig, index) => {
              // Obtener datos del item de la API o usar fallback
              const item = buffConfig.itemId ? itemsData[buffConfig.itemId] : null
              const name = item?.name || (buffConfig.fallbackName ? t(buffConfig.fallbackName, buffConfig.fallbackName) : 'Unknown')
              const icon = item?.icon || buffConfig.fallbackIcon || ''
              const wikiUrl = buffConfig.fallbackWiki || (item ? getWikiUrl(item.name, lang) : '#')
              const notes = buffConfig.notes ? t(buffConfig.notes, buffConfig.notes) : undefined
              
              // Solo mostrar wiki EN para estos buffs (no tienen páginas en otros idiomas)
              const onlyEnglishWiki = !!buffConfig.fallbackName && [
                'expBuffs.resting.name',
                'expBuffs.enlightenment.name', 
                'expBuffs.ancientCanthan.name'
              ].includes(buffConfig.fallbackName)

              return (
                <motion.div
                  key={`exp-buff-${index}-${buffConfig.itemId || buffConfig.fallbackName || 'unknown'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
                >
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4 mb-4">
                    {buffConfig.itemId ? (
                      <WikiTooltip
                        itemId={buffConfig.itemId}
                        itemData={item}
                        fallbackName={name}
                        className="flex-shrink-0"
                      >
                        <div className="w-16 h-16 bg-slate-700/50 rounded-lg flex items-center justify-center border border-slate-600/50 overflow-hidden hover:border-purple-500/50 transition-colors cursor-pointer">
                          {icon ? (
                            <Image
                              src={icon}
                              alt={name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-contain"
                            />
                          ) : (
                            <Zap className="w-8 h-8 text-yellow-400" />
                          )}
                        </div>
                      </WikiTooltip>
                    ) : (
                      <SimpleWikiTooltip
                        name={name}
                        icon={icon}
                        boost={buffConfig.boost}
                        notes={notes}
                        buffKey={buffConfig.fallbackName}
                        onlyEnglish={onlyEnglishWiki}
                      >
                        <div className="w-16 h-16 bg-slate-700/50 rounded-lg flex items-center justify-center border border-slate-600/50 overflow-hidden hover:border-purple-500/50 transition-colors cursor-pointer">
                          {icon ? (
                            <Image
                              src={icon}
                              alt={name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-contain"
                            />
                          ) : (
                            <Zap className="w-8 h-8 text-yellow-400" />
                          )}
                        </div>
                      </SimpleWikiTooltip>
                    )}
                    <div className="flex-1 min-w-0">
                      {buffConfig.itemId ? (
                        <WikiTooltip
                          itemId={buffConfig.itemId}
                          itemData={item}
                          fallbackName={name}
                        >
                          <h3 className="text-lg font-bold text-white mb-1 break-words hover:text-purple-400 transition-colors cursor-pointer">
                            {name}
                          </h3>
                        </WikiTooltip>
                      ) : (
                        <SimpleWikiTooltip
                          name={name}
                          icon={icon}
                          boost={buffConfig.boost}
                          notes={notes}
                          buffKey={buffConfig.fallbackName}
                          onlyEnglish={onlyEnglishWiki}
                        >
                          <h3 className="text-lg font-bold text-white mb-1 break-words hover:text-purple-400 transition-colors cursor-pointer">
                            {name}
                          </h3>
                        </SimpleWikiTooltip>
                      )}
                      <p className="text-2xl font-bold text-yellow-400">
                        {buffConfig.boost}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {notes && (
                    <div className="mb-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-sm text-blue-300">
                        <Info className="w-4 h-4 inline mr-1" />
                        {buffConfig.specialNote === 'utilityPrimer' && itemsData[8469] ? (
                          <>
                            {t('expBuffs.chatoyant.notePrefix', 'Usa')}{' '}
                            <WikiTooltip itemId={8469} itemData={itemsData[8469]}>
                              <span className="font-semibold text-yellow-300 hover:text-yellow-200 underline cursor-pointer">
                                {itemsData[8469].name}
                              </span>
                            </WikiTooltip>
                            {' '}{t('expBuffs.chatoyant.noteSuffix', 'para aumentar la duración')}
                          </>
                        ) : buffConfig.specialNote === 'itemEnhancement' && itemsData[42877] ? (
                          <>
                            {t('expBuffs.soulPastry.notePrefix', 'Usa')}{' '}
                            <WikiTooltip itemId={42877} itemData={itemsData[42877]}>
                              <span className="font-semibold text-yellow-300 hover:text-yellow-200 underline cursor-pointer">
                                {itemsData[42877].name}
                              </span>
                            </WikiTooltip>
                            {' '}{t('expBuffs.soulPastry.noteSuffix', 'para aumentar la duración')}
                          </>
                        ) : buffConfig.specialNote === 'candyCorn' && itemsData[36041] ? (
                          <>
                            {t('expBuffs.candyCorn.notePrefix', 'Se necesitan 4,850 usos (14,550')}{' '}
                            <span className="font-semibold text-blue-300">
                              {itemsData[36041].name}
                            </span>
                            {') '}{t('expBuffs.candyCorn.noteSuffix', 'para alcanzar el buff máximo de experiencia (7 días)')}
                          </>
                        ) : (
                          notes
                        )}
                      </p>
                    </div>
                  )}

                  {/* Hint para todos los items */}
                  <p className="text-xs text-gray-500 italic mt-2">
                    {t('expBuffs.clickForDetails', 'Click on name or icon for details')}
                  </p>
                </motion.div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
