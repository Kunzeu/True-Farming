'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Star, FileText, Wrench, Gift } from 'lucide-react';
import Link from 'next/link';
import GlossaryLink from '@/components/ui/GlossaryLink';
import SalvagePageShell from '@/components/salvage/SalvagePageShell';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';


type SalvageSection = 'salvageables' | 'luck-calculator' | 'research-notes' | 'unidentified-gear' | 'orrian-jewelry-box';

export default function SalvagePage() {
  usePageTitle('pageTitles.salvaging', 'Salvaging');
  const { t, lang } = useI18n();
  const [kitNames, setKitNames] = useState<{[key: string]: string}>({});

  // Función para obtener los nombres de los kits desde la API
  useEffect(() => {
    const fetchKitNames = async () => {
      try {
        const apiLang = lang === 'es' ? 'es' : lang === 'de' ? 'de' : lang === 'fr' ? 'fr' : 'en';
        
        // IDs de los kits: 44602 (Copper-Fed), 89409 (Runecrafter's), 67027 (Silver-Fed)
        const kitIds = ['44602', '89409', '67027'];
        const kitIdsString = kitIds.join(',');
        
        const response = await fetch(`https://api.guildwars2.com/v2/items?ids=${kitIdsString}&lang=${apiLang}`, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        });
        const itemsData = await response.json();
        
        const names: {[key: string]: string} = {};
        itemsData.forEach((item: { id: number; name: string }) => {
          if (item.id === 44602) {
            names.copperFed = item.name;
          }
          if (item.id === 89409) {
            names.runecrafters = item.name;
          }
          if (item.id === 67027) {
            names.silverFed = item.name;
          }
        });
        setKitNames(names);
      } catch (error) {
        console.error('Error fetching kit names:', error);
        // Fallback vacío si hay error
        setKitNames({});
      }
    };

    fetchKitNames();
  }, [lang]);

  // Salvage section configuration
  const salvageSections = [
    {
      id: 'unidentified-gear' as SalvageSection,
      name: t('salvagePage.unidentifiedGear', 'Unidentified Gear'),
      description: t('salvagePage.unidentifiedGearDesc', 'Unidentified Gear calculators'),
      icon: Wrench,
      color: 'purple',
      bgGradient: 'from-purple-500/20 to-purple-600/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-400',
      features: [t('salvagePage.features.commonMasterworkRates', 'Common, Masterwork, Rare'), t('salvagePage.features.specificDropRates', 'Specific drop rates'), t('salvagePage.features.profitabilityByType', 'Profitability by type')],
      href: '/salvage/unidentified-gear'
    },
    {
      id: 'research-notes' as SalvageSection,
      name: t('salvagePage.researchNotes', 'Research Notes'),
      description: t('salvagePage.researchNotesDesc', 'Research Note costs'),
      icon: FileText,
      color: 'green',
      bgGradient: 'from-green-500/20 to-green-600/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      features: [t('salvagePage.features.costPerNote', 'Cost per Research Note'), t('salvagePage.features.itemsGiveNotes', 'Items that give Research Notes'), t('salvagePage.features.salvagingEfficiency', 'Salvaging efficiency')],
      href: '/salvage/research-notes'
    },
    {
      id: 'orrian-jewelry-box' as SalvageSection,
      name: t('salvagePage.orrianJewelryBox', 'Orrian Jewelry Box'),
      description: t('salvagePage.orrianJewelryBoxDesc', 'Analyze box profitability'),
      icon: Gift,
      color: 'orange',
      bgGradient: 'from-orange-500/20 to-orange-600/20',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-400',
      features: [t('salvagePage.features.boxValue', 'Box value analysis'), t('salvagePage.features.marketPrices', 'Market price comparison'), t('salvagePage.features.openOrSell', 'Open or sell decision')],
      href: '/orrian-jewelry-box'
    },
    {
      id: 'salvageables' as SalvageSection,
      name: t('salvagePage.salvageables', 'Salvageables'),
      description: t('salvagePage.salveageablesDesc', 'Items that can be salvaged'),
      icon: Package,
      color: 'blue',
      bgGradient: 'from-blue-500/20 to-blue-600/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      features: [t('salvagePage.features.equipment', 'Equipment of different rarities'), t('salvagePage.features.weapons', 'Weapons and armor'), t('salvagePage.features.accessories', 'Accessories and trinkets')],
      href: '/salvage/salvageables'
    },
    {
      id: 'luck-calculator' as SalvageSection,
      name: t('salvagePage.luckCalculator', 'Luck Calculator'),
      description: t('salvagePage.luckCalculatorDesc', 'Luck cost calculator'),
      icon: Star,
      color: 'yellow',
      bgGradient: 'from-yellow-500/20 to-yellow-600/20',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      features: [t('salvagePage.features.costPer1000', 'Cost per 1000 luck'), t('salvagePage.features.efficiency', 'Efficiency of different kits'), t('salvagePage.features.profitability', 'Profitability comparison')],
      href: '/salvage/luck-calculator'
    }
  ];

  return (
    <>
      <SalvagePageShell>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <header className="mb-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex items-center justify-center gap-3"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
                <Package className="h-7 w-7 text-violet-300" />
              </div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                {t('salvagePage.title', 'Salvaging')}
              </h1>
            </motion.div>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
              {t('salvagePage.subtitle', 'Complete guide to salvaging in Guild Wars 2. Learn techniques, calculate profitability, and maximize your profits.')}
            </p>
          </header>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 rounded-xl border border-slate-600/50 bg-slate-800/50 p-6 backdrop-blur-sm"
          >
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-zinc-500">
              {t('salvagePage.whatIsSalvaging', 'What is Salvaging?')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {t('salvagePage.whatIsSalvagingDesc', 'Salvaging is the process of salvaging equipment to obtain materials. It is one of the most profitable ways to earn gold in Guild Wars 2, especially with certain types of items.')}
            </p>
            <div className="mt-4">
              <GlossaryLink />
            </div>
          </motion.div>

          <div className="mt-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.15em] text-zinc-500">
              {t('salvagePage.sections', 'Salvage Sections')}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {salvageSections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <Link href={section.href} className="group block h-full">
                      <div className={`h-full rounded-xl border ${section.borderColor} bg-slate-800/50 p-5 backdrop-blur-sm transition-all duration-200 hover:bg-slate-700/50`}>
                        <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${section.bgGradient}`}>
                          <IconComponent className={`h-5 w-5 ${section.textColor}`} />
                        </div>
                        <h3 className="font-bold text-white">{section.name}</h3>
                        <p className="mt-1 text-sm text-zinc-500">{section.description}</p>
                        <ul className="mt-3 space-y-1">
                          {section.features.slice(0, 2).map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-zinc-600">
                              <span className={`h-1 w-1 rounded-full ${section.textColor.replace('text-', 'bg-')}`} />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${section.textColor} group-hover:gap-2 transition-all`}>
                          {t('salvagePage.explore', 'Explore')}
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-8 rounded-xl border border-slate-600/50 bg-slate-800/50 p-6 backdrop-blur-sm"
          >
            <h2 className="mb-5 text-center text-sm font-bold uppercase tracking-[0.15em] text-zinc-500">
              {t('salvagePage.proTips', 'Pro Tips')}
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-sky-400">
                  {t('salvagePage.salvageKits', 'Salvage Kits')}
                </h3>
                <div className="space-y-2 text-sm text-zinc-400">
                  <p><strong className="text-sky-300">{kitNames.copperFed || '—'}</strong> · {t('salvagePage.copperFed', 'For Common Gear')}</p>
                  <p><strong className="text-emerald-300">{kitNames.runecrafters || '—'}</strong> · {t('salvagePage.runecrafters', 'For Masterwork')}</p>
                  <p><strong className="text-amber-300">{kitNames.silverFed || '—'}</strong> · {t('salvagePage.silverFed', 'For Rare Gear')}</p>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {t('salvagePage.strategies', 'Strategies')}
                </h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li>{t('salvagePage.checkPrices', 'Check prices before salvaging')}</li>
                  <li>{t('salvagePage.considerValue', 'Consider the value of the full item')}</li>
                  <li>{t('salvagePage.useAppropriateKit', 'Use the appropriate kit for each type')}</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-violet-400">
                  {t('salvagePage.resources', 'Resources')}
                </h3>
                <div className="space-y-2 text-sm">
                  <p><a href="https://wiki.guildwars2.com/wiki/Salvage_kit" target="_blank" rel="noreferrer" className="text-violet-300 hover:text-violet-200">GW2 Wiki — Salvage Kits</a></p>
                  <p><a href="https://wiki.guildwars2.com/wiki/Salvage" target="_blank" rel="noreferrer" className="text-violet-300 hover:text-violet-200">GW2 Wiki — Salvaging</a></p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </SalvagePageShell>
    </>
  );
}
