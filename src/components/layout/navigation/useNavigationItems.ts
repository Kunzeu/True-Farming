'use client';

import { useMemo } from 'react';
import {
  Gift,
  Home,
  Map,
  Package,
  ShoppingCart,
  Star,
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import type { NavItem } from './types';

export function useNavigationItems() {
  const { t } = useI18n();

  const navItems: NavItem[] = useMemo(
    () => [
      {
        href: '/',
        label: t('nav.home', 'Home'),
        icon: Home,
        keywords: ['inicio', 'home', 'principal', 'dashboard'],
      },
      {
        href: '/farming-routes',
        label: t('nav.farms', 'Farms'),
        icon: Map,
        keywords: ['farms', 'rutas', 'routes', 'farmeo', 'oro', 'gold'],
      },
    ],
    [t],
  );

  const guidesItems: NavItem[] = useMemo(
    () => [
      {
        href: '/conversion-guide',
        label: t('conversionGuidePage.title', 'Guía de Conversión'),
        icon: 'conversion-guide',
        isImage: true,
        keywords: ['conversion', 'convertir', 'materiales', 'mystic forge'],
      },
      {
        href: '/conversion-guide-core',
        label: t('conversionGuideCorePage.title', 'Core Conversion Guide'),
        icon: 'conversionlodestone',
        isImage: true,
        keywords: ['core', 'lodestone', 'onyx', 'mystic forge'],
      },
      {
        href: '/garden',
        label: t('gardenPage.titleShort', 'Jardín'),
        icon: 'garden',
        isImage: true,
        keywords: ['garden', 'jardin', 'plantas', 'nodes'],
      },
      {
        href: '/legendary-tracker',
        label: t('legendary.title', 'Legendary Tracker'),
        icon: 'legendary-crafting',
        isImage: true,
        keywords: ['legendary', 'legendaria', 'crafting', 'precursor'],
      },
      {
        href: '/gift-of-mastery',
        label: t('nav.giftOfMastery', 'Gift of Mastery'),
        icon: 'GOM',
        isImage: true,
        keywords: ['gom', 'mastery', 'gift'],
      },
      {
        href: '/gift-of-jade-mastery',
        label: t('nav.giftOfJadeMastery', 'Gift of Jade Mastery'),
        icon: 'GOJM',
        isImage: true,
        keywords: ['gojm', 'jade', 'cantha'],
      },
      {
        href: '/castora/magic-mirrors',
        label: t('nav.magicMirrors', 'Magic Mirrors'),
        icon: 'magic-mirror',
        isImage: true,
        keywords: ['magic mirrors', 'espejos', 'castora'],
      },
      {
        href: '/glossary',
        label: t('nav.glossary', 'Glosario'),
        icon: 'Glosary',
        isImage: true,
        keywords: ['glossary', 'glosario', 'términos'],
      },
      {
        href: '/alt-parking',
        label: t('nav.altParking', 'Alt Parking'),
        icon: 'Explorer',
        isImage: true,
        keywords: ['alt parking', 'alts', 'draconis'],
      },
      {
        href: '/exp-buffs',
        label: t('expBuffs.title', 'EXP Buffs Guide'),
        icon: Star,
        keywords: ['exp buffs', 'experience', 'esquirlas', 'xp'],
      },
    ],
    [t],
  );

  const toolsItems: NavItem[] = useMemo(
    () => [
      {
        href: '/magic',
        label: t('dashboard.magic.title', 'Magic'),
        icon: 'volatile-magic',
        isImage: true,
        keywords: ['magic', 'volatile', 'karma', 'converter'],
      },
      {
        href: '/festivals',
        label: t('nav.festivals', 'Festivales'),
        icon: 'Festival_Collections',
        isImage: true,
        keywords: ['festivals', 'halloween', 'wintersday', 'four winds'],
      },
      {
        href: '/fractals',
        label: t('dashboard.farmingTracker.title', 'Fractales'),
        icon: 'fractal-relic',
        isImage: true,
        keywords: ['fractals', 'fractales', 'relics'],
      },
      {
        href: '/ectogambling',
        label: t('ectogamblingPage.title', 'Ectogambling'),
        icon: 'ecto',
        isImage: true,
        keywords: ['ecto', 'gambling', 'mystic forge'],
      },
      {
        href: '/ectoplasm',
        label: t('ectoplasm.title', 'Ectoplasm Analysis'),
        icon: 'ecto',
        isImage: true,
        keywords: ['ectoplasm', 'salvage', 'analysis'],
      },
      {
        href: '/opened',
        label: t('openedPage.title', 'Contenedores Abribles'),
        icon: 'Community',
        isImage: true,
        keywords: ['containers', 'bags', 'laurels', 'open'],
      },
      {
        href: '/salvage',
        label: t('nav.salvaging', 'Salvaging'),
        icon: Package,
        keywords: ['salvage', 'reciclaje', 'kits', 'luck'],
      },
      {
        href: '/homestead',
        label: t('pageTitles.homestead', 'Homesteading'),
        icon: Home,
        keywords: ['homestead', 'decoracion', 'crafting'],
      },
      {
        href: '/giveaways',
        label: t('nav.giveaways', 'Sorteos'),
        icon: Gift,
        keywords: ['giveaways', 'sorteos', 'premios'],
      },
      {
        href: '/orrian-jewelry-box',
        label: t('pageTitles.orrianJewelryBox', 'Orrian Jewelry Box'),
        icon: Gift,
        keywords: ['orrian', 'jewelry', 'karma box'],
      },
      {
        href: '/buyout',
        label: t('pageTitles.buyout', 'Buyout Calculator'),
        icon: ShoppingCart,
        keywords: ['buyout', 'trading post', 'tp'],
      },
    ],
    [t],
  );

  const allSearchableItems = useMemo(
    () => [...navItems, ...guidesItems, ...toolsItems],
    [navItems, guidesItems, toolsItems],
  );

  return { navItems, guidesItems, toolsItems, allSearchableItems };
}
