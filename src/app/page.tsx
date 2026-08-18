'use client'

import { motion } from '@/lib/framer-motion-optimized'
import Link from 'next/link'
import Image from 'next/image'
import Head from 'next/head'
import {
  Package,
  Gift,
  Hammer,
  Route,
  Clock,
  BarChart3,
  Save,
  X,
  RotateCcw,
  Eye,
  EyeOff,
  GripVertical,
  BookOpen,
  Award,
  TreePine,
  Trophy,
  Box,
  Dice6,
  RefreshCw,
  Map,
  Sparkles,
  Crown,
  Home,
  Calendar,
  Zap
} from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useI18n } from '@/contexts/I18nContext'
import { useAuth } from '@/contexts/AuthContext'
import { canAccessAdventCalendar } from '@/lib/advent-access'
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences'
import { getActiveFestivalEvents } from '@/lib/festival-dates'
import OpportunityRadar from '@/components/home/OpportunityRadar'
import { getPageUsageStats, getUtilityOrder } from '@/lib/page-usage-tracker'
import { useState, useEffect, useRef, useMemo } from 'react'
import Modal from '@/components/ui/Modal'

interface DashboardCard {
  id: string
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: string
  delay: number
  visible: boolean
  order: number
}

// Configuración inicial de las tarjetas 
const initialCards: DashboardCard[] = [
  {
    id: "farms",
    title: "dashboard.farms.title",
    description: "dashboard.farms.description",
    href: "/farming-routes",
    icon: <Route className="w-8 h-8" />,
    color: "from-blue-500 to-blue-600",
    delay: 0.1,
    visible: true,
    order: 0
  },
  {
    id: "dailyRoutine",
    title: "dashboard.dailyRoutine.title",
    description: "dashboard.dailyRoutine.description",
    href: "/daily-routine",
    icon: <Clock className="w-8 h-8" />,
    color: "from-green-500 to-green-600",
    delay: 0.2,
    visible: true,
    order: 1
  },
  {
    id: "salvaging",
    title: "dashboard.salvaging.title",
    description: "dashboard.salvaging.description",
    href: "/salvage",
    icon: <Package className="w-8 h-8" />,
    color: "from-orange-500 to-orange-600",
    delay: 0.3,
    visible: true,
    order: 2
  },
  {
    id: "magic",
    title: "dashboard.magic.title",
    description: "dashboard.magic.description",
    href: "/magic",
    icon: <BarChart3 className="w-8 h-8" />,
    color: "from-purple-500 to-purple-600",
    delay: 0.4,
    visible: true,
    order: 3
  },
  {
    id: "festivals",
    title: "dashboard.festivals.title",
    description: "dashboard.festivals.description",
    href: "/festivals",
    icon: <Gift className="w-8 h-8" />,
    color: "from-pink-500 to-pink-600",
    delay: 0.5,
    visible: true,
    order: 4
  },
  {
    id: "farmingTracker",
    title: "dashboard.farmingTracker.title",
    description: "dashboard.farmingTracker.description",
    href: "/fractals",
    icon: <BarChart3 className="w-8 h-8" />,
    color: "from-indigo-500 to-indigo-600",
    delay: 0.6,
    visible: true,
    order: 5
  },
  {
    id: "giftOfMastery",
    title: "dashboard.giftOfMastery.title",
    description: "dashboard.giftOfMastery.description",
    href: "/gift-of-mastery",
    icon: <Award className="w-8 h-8" />,
    color: "from-amber-500 to-yellow-600",
    delay: 1.0,
    visible: true,
    order: 7
  },
  {
    id: "giftOfJadeMastery",
    title: "dashboard.giftOfJadeMastery.title",
    description: "dashboard.giftOfJadeMastery.description",
    href: "/gift-of-jade-mastery",
    icon: <Gift className="w-8 h-8" />,
    color: "from-cyan-500 to-teal-600",
    delay: 1.1,
    visible: true,
    order: 8
  },
  {
    id: "garden",
    title: "dashboard.garden.title",
    description: "dashboard.garden.description",
    href: "/garden",
    icon: <TreePine className="w-8 h-8" />,
    color: "from-emerald-500 to-green-600",
    delay: 1.2,
    visible: true,
    order: 9
  },
  {
    id: "giveaways",
    title: "dashboard.giveaways.title",
    description: "dashboard.giveaways.description",
    href: "/giveaways",
    icon: <Trophy className="w-8 h-8" />,
    color: "from-yellow-500 to-orange-600",
    delay: 1.3,
    visible: true,
    order: 10
  },
  {
    id: "opened",
    title: "dashboard.opened.title",
    description: "dashboard.opened.description",
    href: "/opened",
    icon: <Box className="w-8 h-8" />,
    color: "from-violet-500 to-purple-600",
    delay: 1.4,
    visible: true,
    order: 11
  },
  {
    id: "ectogambling",
    title: "dashboard.ectogambling.title",
    description: "dashboard.ectogambling.description",
    href: "/ectogambling",
    icon: <Dice6 className="w-8 h-8" />,
    color: "from-red-500 to-pink-600",
    delay: 1.5,
    visible: true,
    order: 12
  },
  {
    id: "conversionGuide",
    title: "dashboard.conversionGuide.title",
    description: "dashboard.conversionGuide.description",
    href: "/conversion-guide",
    icon: <RefreshCw className="w-8 h-8" />,
    color: "from-sky-500 to-blue-600",
    delay: 1.6,
    visible: true,
    order: 13
  },
  {
    id: "ectoplasm",
    title: "dashboard.ectoplasm.ctaTitle",
    description: "dashboard.ectoplasm.ctaSubtitle",
    href: "/ectoplasm",
    icon: <BarChart3 className="w-8 h-8" />,
    color: "from-purple-500 to-blue-600",
    delay: 1.65,
    visible: true,
    order: 14
  },
  {
    id: "altParking",
    title: "dashboard.altParking.title",
    description: "dashboard.altParking.description",
    href: "/alt-parking",
    icon: <Map className="w-8 h-8" />,
    color: "from-lime-500 to-green-600",
    delay: 1.7,
    visible: true,
    order: 15
  },
  {
    id: "orrianJewelry",
    title: "dashboard.orrianJewelry.title",
    description: "dashboard.orrianJewelry.description",
    href: "/orrian-jewelry-box",
    icon: <Gift className="w-8 h-8" />,
    color: "from-rose-500 to-rose-600",
    delay: 1.8,
    visible: true,
    order: 15
  },
  {
    id: "glossary",
    title: "dashboard.glossary.title",
    description: "dashboard.glossary.description",
    href: "/glossary",
    icon: <BookOpen className="w-8 h-8" />,
    color: "from-teal-500 to-teal-600",
    delay: 1.9,
    visible: true,
    order: 16
  },
  {
    id: "magicMirrors",
    title: "nav.magicMirrors",
    description: "magicMirrors.interactiveMap",
    href: "/castora/magic-mirrors",
    icon: <Sparkles className="w-8 h-8" />,
    color: "from-purple-500 to-indigo-600",
    delay: 2.0,
    visible: true,
    order: 17
  },
  {
    id: "homestead",
    title: "pageTitles.homestead",
    description: "homestead.description",
    href: "/homestead",
    icon: <Home className="w-8 h-8" />,
    color: "from-stone-500 to-amber-600",
    delay: 2.1,
    visible: true,
    order: 18
  },
  {
    id: "conversionGuideCore",
    title: "conversionGuideCorePage.title",
    description: "conversionGuideCorePage.subtitle",
    href: "/conversion-guide-core",
    icon: <RefreshCw className="w-8 h-8" />,
    color: "from-cyan-500 to-sky-600",
    delay: 2.2,
    visible: true,
    order: 19
  },
  {
    id: "holidayCalendar",
    title: "nav.holidayCalendar",
    description: "holidayCalendar.subtitle",
    href: "/holiday-calendar",
    icon: <Calendar className="w-8 h-8" />,
    color: "from-red-500 to-rose-600",
    delay: 2.3,
    visible: true,
    order: 20
  },
  {
    id: "expBuffs",
    title: "expBuffs.title",
    description: "expBuffs.subtitle",
    href: "/exp-buffs",
    icon: <Zap className="w-8 h-8" />,
    color: "from-yellow-500 to-amber-600",
    delay: 2.4,
    visible: true,
    order: 21
  },
  {
    id: "buyout",
    title: "dashboard.buyout.title",
    description: "dashboard.buyout.description",
    href: "/buyout",
    icon: <BarChart3 className="w-8 h-8" />,
    color: "from-cyan-500 to-teal-600",
    delay: 2.5,
    visible: true,
    order: 22
  },

];

const POPULAR_TOOLS_COUNT = 4;

/** Mismo estilo que los timers del navbar (bg-*-900/20, border-*-700/30) */
const ACCENT_CHIP_CLASSES: Record<string, string> = {
  blue: 'text-blue-300 bg-blue-900/20 border-blue-700/30 hover:bg-blue-800/30 hover:text-blue-200',
  green: 'text-green-300 bg-green-900/20 border-green-700/30 hover:bg-green-800/30 hover:text-green-200',
  purple: 'text-purple-300 bg-purple-900/20 border-purple-700/30 hover:bg-purple-800/30 hover:text-purple-200',
  amber: 'text-amber-300 bg-amber-900/20 border-amber-700/30 hover:bg-amber-800/30 hover:text-amber-200',
  orange: 'text-orange-300 bg-orange-900/20 border-orange-700/30 hover:bg-orange-800/30 hover:text-orange-200',
  pink: 'text-pink-300 bg-pink-900/20 border-pink-700/30 hover:bg-pink-800/30 hover:text-pink-200',
  indigo: 'text-indigo-300 bg-indigo-900/20 border-indigo-700/30 hover:bg-indigo-800/30 hover:text-indigo-200',
  cyan: 'text-cyan-300 bg-cyan-900/20 border-cyan-700/30 hover:bg-cyan-800/30 hover:text-cyan-200',
  emerald: 'text-emerald-300 bg-emerald-900/20 border-emerald-700/30 hover:bg-emerald-800/30 hover:text-emerald-200',
  yellow: 'text-amber-300 bg-amber-900/20 border-amber-700/30 hover:bg-amber-800/30 hover:text-amber-200',
  violet: 'text-violet-300 bg-violet-900/20 border-violet-700/30 hover:bg-violet-800/30 hover:text-violet-200',
  red: 'text-red-300 bg-red-900/20 border-red-700/30 hover:bg-red-800/30 hover:text-red-200',
  sky: 'text-sky-300 bg-sky-900/20 border-sky-700/30 hover:bg-sky-800/30 hover:text-sky-200',
  lime: 'text-lime-300 bg-lime-900/20 border-lime-700/30 hover:bg-lime-800/30 hover:text-lime-200',
  rose: 'text-rose-300 bg-rose-900/20 border-rose-700/30 hover:bg-rose-800/30 hover:text-rose-200',
  teal: 'text-teal-300 bg-teal-900/20 border-teal-700/30 hover:bg-teal-800/30 hover:text-teal-200',
  stone: 'text-stone-300 bg-stone-900/20 border-stone-700/30 hover:bg-stone-800/30 hover:text-stone-200',
  gray: 'text-gray-300 bg-gray-800/50 border-gray-600/30 hover:bg-gray-700/50 hover:text-white',
};

function getToolChipClasses(color: string): string {
  const match = color.match(/from-([\w]+)-/);
  const accent = match?.[1] ?? 'gray';
  return ACCENT_CHIP_CLASSES[accent] ?? ACCENT_CHIP_CLASSES.gray;
}

export default function HomePage() {
  usePageTitle('pageTitles.home', 'Home');
  const { t } = useI18n();
  const { user } = useAuth();
  const { preferences, isLoading, toggleCardVisibility: toggleVisibility, updateCardOrder } = useDashboardPreferences();

  // Estados para personalización
  const [isEditMode, setIsEditMode] = useState(false);
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>([]);
  const [originalCards, setOriginalCards] = useState<DashboardCard[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Función para obtener el icono según el ID y tamaño
  const getIcon = (cardId: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    const iconSizeMap = {
      small: 'w-6 h-6',
      medium: 'w-8 h-8',
      large: 'w-10 h-10'
    };
    const iconClass = iconSizeMap[size];

    const iconMap: Record<string, React.ReactNode> = {
      "farms": <Route className={iconClass} />,
      "dailyRoutine": <Clock className={iconClass} />,
      "salvaging": <Package className={iconClass} />,
      "magic": <Hammer className={iconClass} />,
      "festivals": <Gift className={iconClass} />,
      "farmingTracker": <BarChart3 className={iconClass} />,
      "glossary": <BookOpen className={iconClass} />,
      "orrianJewelry": <Gift className={iconClass} />,
      "giftOfMastery": <Award className={iconClass} />,
      "giftOfJadeMastery": <Gift className={iconClass} />,
      "garden": <TreePine className={iconClass} />,
      "giveaways": <Trophy className={iconClass} />,
      "opened": <Box className={iconClass} />,
      "ectogambling": <Dice6 className={iconClass} />,
      "conversionGuide": <RefreshCw className={iconClass} />,
      "altParking": <Map className={iconClass} />,
      "magicMirrors": <Sparkles className={iconClass} />,
      "orphanRoute": <Map className={iconClass} />,
      "laurels": <Crown className={iconClass} />,
      "ectoplasm": <BarChart3 className={iconClass} />,
      "homestead": <Home className={iconClass} />,
      "conversionGuideCore": <img src="/images/assets/conversionlodestone.gif" alt="" className={iconClass} />,
      "holidayCalendar": <Calendar className={iconClass} />,
      "expBuffs": <Zap className={iconClass} />,
      "buyout": <BarChart3 className={iconClass} />,

    };

    return iconMap[cardId] || <Package className={iconClass} />;
  };

  // Función para reconstruir iconos y colores desde los datos guardados
  const reconstructCardWithIcon = (savedCard: Omit<DashboardCard, 'icon'>): DashboardCard => {
    const iconMap: Record<string, React.ReactNode> = {
      "farms": <Route className="w-8 h-8" />,
      "dailyRoutine": <Clock className="w-8 h-8" />,
      "salvaging": <Package className="w-8 h-8" />,
      "magic": <Hammer className="w-8 h-8" />,
      "festivals": <Gift className="w-8 h-8" />,
      "farmingTracker": <BarChart3 className="w-8 h-8" />,
      "glossary": <BookOpen className="w-8 h-8" />,
      "orrianJewelry": <Gift className="w-8 h-8" />,
      "giftOfMastery": <Award className="w-8 h-8" />,
      "giftOfJadeMastery": <Gift className="w-8 h-8" />,
      "garden": <TreePine className="w-8 h-8" />,
      "giveaways": <Trophy className="w-8 h-8" />,
      "opened": <Box className="w-8 h-8" />,
      "ectogambling": <Dice6 className="w-8 h-8" />,
      "conversionGuide": <RefreshCw className="w-8 h-8" />,
      "altParking": <Map className="w-8 h-8" />,
      "laurels": <Crown className="w-8 h-8" />,
      "magicMirrors": <Sparkles className="w-8 h-8" />,
      "orphanRoute": <Map className="w-8 h-8" />,
      "ectoplasm": <BarChart3 className="w-8 h-8" />,
      "homestead": <Home className="w-8 h-8" />,
      "conversionGuideCore": <img src="/images/assets/conversionlodestone.gif" alt="" className="w-8 h-8" />,
      "holidayCalendar": <Calendar className="w-8 h-8" />,
      "expBuffs": <Zap className="w-8 h-8" />,
      "buyout": <BarChart3 className="w-8 h-8" />,

    };

    const colorMap: Record<string, string> = {
      "farms": "from-blue-500 to-blue-600",
      "dailyRoutine": "from-green-500 to-green-600",
      "salvaging": "from-orange-500 to-orange-600",
      "magic": "from-purple-500 to-purple-600",
      "festivals": "from-pink-500 to-pink-600",
      "farmingTracker": "from-indigo-500 to-indigo-600",
      "glossary": "from-teal-500 to-teal-600",
      "orrianJewelry": "from-rose-500 to-rose-600",
      "giftOfMastery": "from-amber-500 to-yellow-600",
      "giftOfJadeMastery": "from-cyan-500 to-teal-600",
      "garden": "from-emerald-500 to-green-600",
      "giveaways": "from-yellow-500 to-orange-600",
      "opened": "from-violet-500 to-purple-600",
      "ectogambling": "from-red-500 to-pink-600",
      "conversionGuide": "from-sky-500 to-blue-600",
      "altParking": "from-lime-500 to-green-600",
      "magicMirrors": "from-purple-500 to-indigo-600",
      "orphanRoute": "from-cyan-500 to-blue-600",
      "laurels": "from-amber-500 to-yellow-600",
      "ectoplasm": "from-purple-500 to-blue-600",
      "homestead": "from-stone-500 to-amber-600",
      "conversionGuideCore": "from-cyan-500 to-sky-600",
      "holidayCalendar": "from-red-500 to-rose-600",
      "expBuffs": "from-yellow-500 to-amber-600",
      "buyout": "from-cyan-500 to-teal-600",

    };

    return {
      ...savedCard,
      icon: iconMap[savedCard.id] || <Package className="w-8 h-8" />,
      color: colorMap[savedCard.id] || "from-gray-500 to-gray-600"
    };
  };

  // Cargar configuración basada en preferencias del usuario y orden por utilidad
  useEffect(() => {
    if (isLoading) return;

    // Filtrar tarjetas basado en preferencias del usuario
    const filteredCards = initialCards.filter(card =>
      !preferences.hiddenCards.includes(card.id) &&
      (card.id !== 'holidayCalendar' || canAccessAdventCalendar(user))
    );

    // Reconstruir todas las tarjetas filtradas para asegurar colores correctos
    const reconstructedFilteredCards = filteredCards.map(card => reconstructCardWithIcon(card));

    // SIEMPRE usar orden por utilidad basado en las visitas (cookies/localStorage)
    // El orden se actualiza automáticamente cuando cambian las estadísticas de uso
    const cardHrefs: Record<string, string> = {};
    reconstructedFilteredCards.forEach(card => {
      cardHrefs[card.id] = card.href;
    });

    const utilityOrder = getUtilityOrder(
      reconstructedFilteredCards.map(card => card.id),
      cardHrefs
    );

    // Si el usuario ha personalizado el orden manualmente, combinar ambos:
    // Mantener las tarjetas ocultas según preferencias del usuario
    // Pero usar el orden por utilidad para las tarjetas visibles
    const finalOrder = utilityOrder;

    // Ordenar tarjetas según el orden final
    const orderedCards = finalOrder
      .map(cardId => {
        const foundCard = reconstructedFilteredCards.find(card => card.id === cardId);
        return foundCard || null;
      })
      .filter(Boolean) as DashboardCard[];

    // Agregar tarjetas que no están en el orden final
    const remainingCards = reconstructedFilteredCards.filter(card =>
      !finalOrder.includes(card.id)
    );

    const finalCards = [...orderedCards, ...remainingCards];
    setDashboardCards(finalCards);
    setOriginalCards(finalCards);
  }, [preferences.hiddenCards, isLoading, user]);

  // Función helper para actualizar el orden basado en utilidad
  const updateOrderByUtility = useRef(() => {
    if (isLoading) return;

    const filteredCards = initialCards.filter(card =>
      !preferences.hiddenCards.includes(card.id) &&
      (card.id !== 'holidayCalendar' || canAccessAdventCalendar(user))
    );
    const reconstructedFilteredCards = filteredCards.map(card => reconstructCardWithIcon(card));

    const cardHrefs: Record<string, string> = {};
    reconstructedFilteredCards.forEach(card => {
      cardHrefs[card.id] = card.href;
    });

    const utilityOrder = getUtilityOrder(
      reconstructedFilteredCards.map(card => card.id),
      cardHrefs
    );

    const orderedCards = utilityOrder
      .map(cardId => {
        const foundCard = reconstructedFilteredCards.find(card => card.id === cardId);
        return foundCard || null;
      })
      .filter(Boolean) as DashboardCard[];

    const remainingCards = reconstructedFilteredCards.filter(card =>
      !utilityOrder.includes(card.id)
    );

    const finalCards = [...orderedCards, ...remainingCards];
    setDashboardCards(finalCards);
    setOriginalCards(finalCards);
  });

  // Actualizar la referencia cuando cambien las dependencias
  useEffect(() => {
    updateOrderByUtility.current = () => {
      if (isLoading) return;

      const filteredCards = initialCards.filter(card =>
        !preferences.hiddenCards.includes(card.id) &&
        (card.id !== 'holidayCalendar' || canAccessAdventCalendar(user))
      );
      const reconstructedFilteredCards = filteredCards.map(card => reconstructCardWithIcon(card));

      const cardHrefs: Record<string, string> = {};
      reconstructedFilteredCards.forEach(card => {
        cardHrefs[card.id] = card.href;
      });

      const utilityOrder = getUtilityOrder(
        reconstructedFilteredCards.map(card => card.id),
        cardHrefs
      );

      const orderedCards = utilityOrder
        .map(cardId => {
          const foundCard = reconstructedFilteredCards.find(card => card.id === cardId);
          return foundCard || null;
        })
        .filter(Boolean) as DashboardCard[];

      const remainingCards = reconstructedFilteredCards.filter(card =>
        !utilityOrder.includes(card.id)
      );

      const finalCards = [...orderedCards, ...remainingCards];
      setDashboardCards(finalCards);
      setOriginalCards(finalCards);
    };
  }, [preferences.hiddenCards, isLoading]);

  // Actualizar el orden cuando cambien las estadísticas de uso
  useEffect(() => {
    if (isLoading) return;

    const handleUsageUpdate = () => {
      // Actualizar el orden cuando se actualicen las estadísticas de uso
      updateOrderByUtility.current();
    };

    // Escuchar el evento personalizado cuando se actualiza el tracking
    window.addEventListener('pageUsageUpdated', handleUsageUpdate);

    // También escuchar cambios en localStorage (para otros tabs)
    window.addEventListener('storage', handleUsageUpdate);

    return () => {
      window.removeEventListener('pageUsageUpdated', handleUsageUpdate);
      window.removeEventListener('storage', handleUsageUpdate);
    };
  }, [isLoading]);

  const visibleCards = useMemo(
    () => dashboardCards.filter((card) => isEditMode || card.visible),
    [dashboardCards, isEditMode]
  );

  const { popularCards, otherCards } = useMemo(() => {
    if (visibleCards.length === 0) {
      return { popularCards: [], otherCards: [] };
    }

    const cardHrefs: Record<string, string> = {};
    visibleCards.forEach((card) => {
      cardHrefs[card.id] = card.href;
    });

    const utilityOrder = getUtilityOrder(
      visibleCards.map((card) => card.id),
      cardHrefs
    );
    const stats = getPageUsageStats();

    const sortedCards = utilityOrder
      .map((cardId) => visibleCards.find((card) => card.id === cardId))
      .filter(Boolean) as DashboardCard[];

    const remainingCards = visibleCards.filter((card) => !utilityOrder.includes(card.id));
    const orderedCards = [...sortedCards, ...remainingCards];

    const cardsWithUsage = orderedCards.filter((card) => (stats[card.href]?.visits ?? 0) > 0);
    const popularSource =
      cardsWithUsage.length >= POPULAR_TOOLS_COUNT ? cardsWithUsage : orderedCards;
    const popular = popularSource.slice(0, POPULAR_TOOLS_COUNT);
    const popularIds = new Set(popular.map((card) => card.id));

    return {
      popularCards: popular,
      otherCards: orderedCards.filter((card) => !popularIds.has(card.id)),
    };
  }, [visibleCards]);

  // Funciones de personalización
  const toggleEditMode = () => {
    if (isEditMode) {
      // Al salir del modo edición, restaurar configuración original
      setDashboardCards(originalCards);
    }
    setIsEditMode(!isEditMode);
  };

  const saveChanges = () => {
    setOriginalCards(dashboardCards);
    // Las preferencias se guardan automáticamente en useDashboardPreferences
    setIsEditMode(false);
  };

  const resetDashboard = () => {
    setDashboardCards(initialCards);
    setOriginalCards(initialCards);
    // Las preferencias se guardan automáticamente en useDashboardPreferences
    setIsEditMode(false);
  };

  const toggleCardVisibility = (cardId: string) => {
    toggleVisibility(cardId);
    setDashboardCards(prev =>
      prev.map(card =>
        card.id === cardId
          ? { ...card, visible: !preferences.hiddenCards.includes(cardId) }
          : card
      )
    );
  };

  const reorderCards = (fromIndex: number, toIndex: number) => {
    const newCards = [...dashboardCards];
    const [movedCard] = newCards.splice(fromIndex, 1);
    newCards.splice(toIndex, 0, movedCard);

    // Actualizar el orden
    const updatedCards = newCards.map((card, index) => ({
      ...card,
      order: index
    }));

    // Actualizar el orden en las preferencias
    const newOrder = updatedCards.map(card => card.id);
    updateCardOrder(newOrder);

    setDashboardCards(updatedCards);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragStart = (e: any, index: number) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragOver = (e: any) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDrop = (e: any, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderCards(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Obtener eventos activos desde la configuración centralizada
  const activeFestivalEvents = getActiveFestivalEvents();
  const activeEvent = activeFestivalEvents[0]; // Mostrar el primer evento activo si hay múltiples


  return (
    <div className="home-page">
      <Head>
        <link
          rel="preload"
          href="/images/backgrounds/voe-background.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
      </Head>

      {/* Container principal */}
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-16">

        {/* Hero — Visions of Eternity */}
        <section className="relative mb-6 overflow-hidden rounded-3xl border border-slate-600/30 min-h-[240px] sm:min-h-[300px] md:min-h-[340px] lg:min-h-[380px]">
          <Image
            src="/images/backgrounds/voe-background.webp"
            alt="Guild Wars 2: Visions of Eternity"
            fill
            sizes="100vw"
            className="object-cover"
            priority
            fetchPriority="high"
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/70 to-slate-900/25" />
          <div className="relative flex h-full min-h-[inherit] items-center justify-between gap-6 px-6 py-8 sm:px-10 sm:py-10 md:px-12 md:py-12">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="min-w-0 max-w-2xl"
            >
              <span className="inline-block rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-amber-300 sm:text-sm">
                {t('home.hero.voeBadge', 'New expansion')}
              </span>
              <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-tight">
                {t('home.hero.voeTitle', 'Visions of Eternity')}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-300 sm:mt-4 sm:text-base md:text-lg">
                {t('home.hero.voeSubtitle', "Guild Wars 2's new expansion is here.")}
              </p>
              <a
                href="http://guildwars2.go2cloud.org/aff_c?offer_id=28&aff_id=757"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-blue-500 hover:to-violet-500 sm:mt-6 sm:px-8 sm:py-3 sm:text-base"
              >
                {t('cta.purchaseNow', 'Purchase Now')}
              </a>
            </motion.div>
            <Image
              src="/images/backgrounds/GuildWars2.webp"
              alt="Guild Wars 2"
              width={200}
              height={200}
              className="hidden h-auto w-32 shrink-0 drop-shadow-2xl sm:block md:w-44 lg:w-52 xl:w-56"
            />
          </div>
        </section>

        <OpportunityRadar />

        {/* Sección de herramientas */}
        <section className="mb-12 pb-8">
          {/* Evento Activo arriba del título (solo cuando hay evento activo) */}
          {activeEvent && (
            <div className="mb-6 flex justify-center">
              <Link href={activeEvent.path}>
                <span className={`inline-flex items-center rounded-lg border px-8 py-3 text-base font-bold transition-all duration-200 sm:px-10 sm:py-3.5 sm:text-lg ${getToolChipClasses(activeEvent.color)}`}>
                  {t('cta.activeEvent', `Active event: {name}`).replace('{name}', t(activeEvent.nameKey))}
                </span>
              </Link>
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                {isEditMode ? t('section.availableTools') : t('home.popularTools', 'Most used')}
              </h2>
              {!isEditMode && (
                <p className="mt-1 text-sm text-gray-500">
                  {t('home.hero.subtitle')}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {isEditMode ? (
                <>
                  <button
                    type="button"
                    onClick={saveChanges}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition hover:bg-green-700"
                  >
                    <Save className="h-4 w-4" />
                    {t('dashboard.saveChanges', 'Save')}
                  </button>
                  <button
                    type="button"
                    onClick={resetDashboard}
                    className="flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-1.5 text-sm text-white transition hover:bg-orange-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t('dashboard.reset', 'Reset')}
                  </button>
                  <button
                    type="button"
                    onClick={toggleEditMode}
                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-3 py-1.5 text-sm text-white transition hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                    {t('dashboard.cancel', 'Cancel')}
                  </button>
                </>
              ) : (
                user && (
                  <button
                    type="button"
                    onClick={toggleEditMode}
                    className="rounded-lg border border-slate-600/60 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-slate-700/50"
                  >
                    {t('dashboard.editMode', 'Edit mode')}
                  </button>
                )
              )}
            </div>
          </div>

          {isEditMode && (
            <div className="mb-6 rounded-lg border border-blue-700/30 bg-blue-900/20 p-3">
              <p className="text-center text-sm text-blue-300">
                {t('dashboard.dragToReorder', 'Drag to reorder')} • {t('dashboard.toggleVisibility', 'Show/Hide')}
              </p>
            </div>
          )}

          {isEditMode ? (
            <div className={preferences.layout === 'list' ? 'space-y-4' : 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'}>
              {visibleCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className="relative cursor-move"
                >
                  <div className="absolute right-2 top-2 z-10 flex gap-1">
                    <button
                      type="button"
                      onClick={() => toggleCardVisibility(card.id)}
                      className="rounded bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      {card.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <div className="rounded bg-black/50 p-1 text-white">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  </div>
                  <div className={`rounded-lg border p-4 transition-all duration-200 ${getToolChipClasses(card.color)} ${card.visible ? '' : 'border-dashed opacity-50'}`}>
                    <div>{getIcon(card.id, 'medium')}</div>
                    <h3 className="mt-3 text-sm font-bold">{t(card.title, card.title)}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <>
              <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {popularCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link
                      href={card.href}
                      className={`flex h-full items-start gap-3 rounded-lg border px-4 py-3 transition-all duration-200 ${getToolChipClasses(card.color)}`}
                    >
                      <span className="shrink-0">{getIcon(card.id, 'medium')}</span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold">{t(card.title, card.title)}</h3>
                        <p className="mt-1 line-clamp-2 text-xs opacity-80">
                          {t(card.description, card.description)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-gray-400">
                  {t('home.allTools', 'All tools')}
                </h3>
                <span className="text-xs text-gray-600">{otherCards.length}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {otherCards.map((card) => (
                  <Link
                    key={card.id}
                    href={card.href}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200 ${getToolChipClasses(card.color)}`}
                  >
                    <span className="shrink-0">{getIcon(card.id, 'small')}</span>
                    <span className="truncate text-xs font-bold sm:text-sm">
                      {t(card.title, card.title)}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

      </div>

      {/* Modal de login requerido */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        type="error"
        title={t('dashboard.loginRequired.title', 'Inicio de sesión requerido')}
        message={t('dashboard.loginRequired.message', 'Debes estar logueado para usar esta opción.')}
      />
    </div>
  )
} 