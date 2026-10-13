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
        keywords: ['farms', 'farm', 'rutas', 'routes', 'farmeo', 'oro', 'gold'],
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
        keywords: ['conversion', 'convertir', 'materiales', 'mystic forge', 't6', 'trofeos', 'trophies'],
      },
      {
        href: '/conversion-guide-core',
        label: t('conversionGuideCorePage.title', 'Core Conversion Guide'),
        icon: 'conversionlodestone',
        isImage: true,
        keywords: ['core', 'lodestone', 'lodestones', 'onyx', 'piedras', 'mystic forge'],
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
        keywords: ['legendary', 'legendaria', 'legendario', 'leggy', 'crafting', 'precursor'],
      },
      {
        href: '/gift-of-mastery',
        label: t('nav.giftOfMastery', 'Gift of Mastery'),
        icon: 'GOM',
        isImage: true,
        keywords: ['gom', 'mastery', 'gift', 'regalo', 'maestria'],
      },
      {
        href: '/gift-of-jade-mastery',
        label: t('nav.giftOfJadeMastery', 'Gift of Jade Mastery'),
        icon: 'GOJM',
        isImage: true,
        keywords: ['gojm', 'jade', 'cantha', 'eod'],
      },
      {
        href: '/castora/magic-mirrors',
        label: t('nav.magicMirrors', 'Magic Mirrors'),
        icon: 'magic-mirror',
        isImage: true,
        keywords: ['magic mirrors', 'espejos', 'espejo', 'castora', 'mm'],
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
        keywords: ['exp buffs', 'experience', 'esquirlas', 'xp', 'shards', 'spirit'],
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
        keywords: ['magic', 'magia', 'volatile', 'unbound', 'vm', 'um', 'karma', 'converter'],
      },
      {
        href: '/festivals',
        label: t('nav.festivals', 'Festivales'),
        icon: 'Festival_Collections',
        isImage: true,
        keywords: ['festivals', 'festivales', 'halloween', 'wintersday', 'four winds'],
      },
      {
        href: '/fractals',
        label: t('dashboard.farmingTracker.title', 'Fractales'),
        icon: 'fractal-relic',
        isImage: true,
        keywords: ['fractals', 'fractales', 'fracs', 'relics', 't4', 'cm'],
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
        keywords: ['containers', 'contenedores', 'bags', 'bolsas', 'cofres', 'open', 'abrir'],
      },
      {
        href: '/salvage',
        label: t('nav.salvaging', 'Salvaging'),
        icon: Package,
        keywords: ['salvage', 'reciclaje', 'reciclar', 'kits', 'luck', 'suerte'],
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
        keywords: ['orrian', 'oj', 'jewelry', 'joyas', 'karma box'],
      },
      {
        href: '/buyout',
        label: t('pageTitles.buyout', 'Buyout Calculator'),
        icon: ShoppingCart,
        keywords: ['buyout', 'trading post', 'tp', 'compra'],
      },
    ],
    [t],
  );

  const searchOnlyItems: NavItem[] = useMemo(
    () => [
      {
        href: '/opened/laurels',
        label: t('openedPage.laurels', 'Laureles'),
        icon: 'Laurel',
        isImage: true,
        keywords: ['laurels', 'laurel', 'laureles', 'karma', 'currencies'],
      },
      {
        href: '/opened/heavy-loot-bag',
        label: t('pageTitles.heavyLootBag', 'Heavy Loot Bag'),
        icon: Package,
        keywords: ['hlb', 'heavy', 'loot', 'bag', 'bolsa', 'wvw', 'mundo'],
      },
      {
        href: '/festivals/halloween/labyrinth-guide',
        label: t('pageTitles.halloweenLabyrinth', 'Laberinto'),
        icon: Map,
        keywords: ['lab', 'laberinto', 'labyrinth', 'maze', 'halloween'],
      },
      {
        href: '/festivals/halloween',
        label: t('pageTitles.halloween', 'Halloween'),
        icon: Gift,
        keywords: ['halloween', 'hallow', 'mad king', 'tot', 'trick'],
      },
      {
        href: '/festivals/wintersday',
        label: t('pageTitles.wintersday', 'Wintersday'),
        icon: Gift,
        keywords: ['wd', 'wintersday', 'winter', 'invierno', 'navidad'],
      },
      {
        href: '/festivals/wintersday/Orphan',
        label: t('wintersday.orphan.title', 'Huérfanos'),
        icon: Gift,
        keywords: ['orphan', 'orphans', 'huerfano', 'huérfano', 'huérfanos'],
      },
      {
        href: '/festivals/four-winds',
        label: t('festivals.names.fourWinds', 'Cuatro Vientos'),
        icon: Gift,
        keywords: ['4w', 'four winds', 'cuatro vientos', 'vientos', 'zephyrite'],
      },
      {
        href: '/festivals/lunar-new-year',
        label: t('festivals.names.lunar', 'Año Nuevo Lunar'),
        icon: Gift,
        keywords: ['lny', 'lunar', 'año nuevo', 'new year'],
      },
      {
        href: '/festivals/dragon-bash',
        label: t('festivals.names.dragonBash', 'Dragon Bash'),
        icon: Gift,
        keywords: ['db', 'dragon bash', 'dragonicidio', 'dragon'],
      },
      {
        href: '/price-check',
        label: t('pageTitles.priceCheck', 'Price Check'),
        icon: ShoppingCart,
        keywords: ['price', 'precio', 'precios', 'tp', 'trading post'],
      },
      {
        href: '/daily-routine',
        label: t('pageTitles.dailyRoutine', 'Rutina Diaria'),
        icon: Star,
        keywords: ['daily', 'dailies', 'rutina', 'diaria'],
      },
      {
        href: '/holiday-calendar',
        label: t('pageTitles.holidayCalendar', 'Calendario'),
        icon: Star,
        keywords: ['calendar', 'calendario', 'holiday', 'festivos'],
      },
      {
        href: '/salvage/research-notes',
        label: t('pageTitles.researchNotes', 'Research Notes'),
        icon: Package,
        keywords: ['rn', 'research', 'notas', 'notes'],
      },
      {
        href: '/salvage/unidentified-gear',
        label: t('salvagePage.unidentifiedGear', 'Unidentified Gear'),
        icon: Package,
        keywords: ['unid', 'unidentified', 'gear', 'equipo'],
      },
      {
        href: '/opened/essence',
        label: t('pageTitles.riftEssenceCoffer', 'Esencias'),
        icon: Package,
        keywords: ['essence', 'esencia', 'esencias', 'rift'],
      },
      {
        href: '/opened/astral-mass',
        label: t('pageTitles.astralMass', 'Astral Fluctuating Mass'),
        icon: Package,
        keywords: ['astral', 'mass', 'masa'],
      },
      {
        href: '/account/wallet',
        label: t('pageTitles.wallet', 'Billetera'),
        icon: ShoppingCart,
        keywords: ['wallet', 'billetera', 'cartera', 'monedas'],
      },
      {
        href: '/account/bank',
        label: t('pageTitles.bank', 'Banco'),
        icon: Package,
        keywords: ['bank', 'banco'],
      },
      {
        href: '/account/storage',
        label: t('pageTitles.storage', 'Almacén'),
        icon: Package,
        keywords: ['storage', 'almacen', 'almacén', 'materiales'],
      },
    ],
    [t],
  );

  const allSearchableItems = useMemo(
    () => [...navItems, ...guidesItems, ...toolsItems, ...searchOnlyItems],
    [navItems, guidesItems, toolsItems, searchOnlyItems],
  );

  return { navItems, guidesItems, toolsItems, allSearchableItems };
}
