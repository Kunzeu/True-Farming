'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Package } from 'lucide-react';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';

interface EctoGamblingItem {
  id: number;
  name: string;
  beforeCount: number;
  afterCount: number;
  difference: number;
  valueEach?: number;
  valueTotal?: number;
  category: string;
  percentage?: number;
  dropRate?: number;
  icon?: string;
  currentPrice?: number;
  tier: number;
  cost: number;
  probability: number;
  rarity: string;
}


export default function EctoGamblingPage() {
  usePageTitle('ectogamblingPage.title', 'Ectoplasma Gamble');
  const { t } = useI18n();
  
  const [activeSection, setActiveSection] = useState<'rolls' | 'sandstorm'>('rolls');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [ectoUnitPrice, setEctoUnitPrice] = useState<number | null>(null);
  const [showRollStats, setShowRollStats] = useState(false);

  // Mostrar estadísticas abiertas en escritorio y colapsadas en móvil
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches;
      setShowRollStats(isDesktop);
    }
  }, []);

  // Números específicos para Amount Ectoplasma
  const ectoplasmaData = useMemo(() => [
    450, 300, 300, 300, 400, 300, 300, 50, 300, 50, 500, 300, 50, 300, 50, 50, 50, 300, 300, 50, 300, 300, 400, 450, 50, 300, 50, 50, 300, 400, 50, 50, 50, 300, 450, 50, 300, 300, 50, 50, 50, 400, 300, 400, 400, 400, 50, 50, 500, 400, 50, 300, 300, 400, 50, 300, 300, 50, 400, 400, 300, 450, 400, 400, 300, 450, 300, 300, 300, 50, 300, 300, 300, 300, 50, 50, 400, 50, 300, 300, 50, 450, 300, 300, 50, 50, 300, 300, 450, 50, 300, 50, 400, 400, 300, 50, 300, 300, 400, 450, 50, 500, 50, 400, 500, 50, 50, 300, 50, 50, 400, 50, 50, 50, 50, 50, 300, 400, 300, 300, 300, 300, 300, 50, 300, 50, 300, 300, 50, 50, 50, 50, 50, 300, 50, 50, 400, 400, 50, 300, 300, 50, 50, 450, 50, 450, 450, 50, 300, 300, 50, 400, 50, 300, 300, 50, 50, 300, 300, 400, 50, 300, 300, 400, 300, 450, 50, 400, 50, 500, 450, 300, 300, 300, 400, 300, 300, 50, 50, 300, 50, 50, 300, 300, 50, 450, 400, 50, 300, 300, 50, 300, 450, 450, 50, 50, 300, 50, 400, 300, 300, 50, 50, 450, 50, 300, 50, 300, 450, 50, 450, 50, 50, 300, 300, 300, 50, 400, 400, 300, 300, 300, 50, 50, 300, 50, 50, 50, 400, 300, 300, 50, 50, 400, 400, 50, 300, 300, 300, 50, 50, 300, 300, 300, 400, 300, 400, 300, 50, 300, 300, 450, 300, 300, 300, 50, 300, 400, 300, 300, 50, 300, 50, 50, 300, 300, 300, 300, 300, 50, 300, 400, 400, 50, 50, 300, 300, 300, 400, 50, 50, 400, 400, 300, 300, 50, 300, 300, 300, 500, 300, 300, 300, 300, 450, 300, 450, 50, 300, 300, 50, 300, 50, 300, 450, 50, 400, 400, 400, 400, 50, 300, 300, 50, 50, 50, 300, 50, 50, 300, 500, 50, 300, 300, 450, 300, 400, 300, 300, 450, 50, 50, 300, 500, 400, 300, 300, 50, 50, 50, 50, 300, 300, 300, 50, 300, 300, 300, 50, 450, 300, 300, 50, 400, 450, 50, 450, 300, 300, 300, 50, 400, 300, 50, 300, 300, 50, 300, 300, 400, 50, 300, 400, 300, 400, 50, 300, 300, 50, 300, 300, 450, 50, 50, 400, 450, 400, 300, 400, 300, 50, 300, 300, 400, 300, 300, 300, 50, 400, 300, 300, 50, 300, 300, 300, 50, 300, 300, 400, 300, 300, 50, 300, 300, 300, 50, 400, 450, 300, 300, 300, 300, 300, 50, 50, 50, 50, 300, 300, 300, 300, 50, 300, 50, 300, 400, 300, 450, 300, 50, 50, 400, 300, 300, 300, 400, 50, 500, 50, 300, 450, 450, 300, 300, 450, 300, 300, 450, 50, 450, 300, 300, 300, 50, 400, 50, 50, 50, 300, 300, 450, 50, 400, 300, 400, 300, 50, 50, 400, 300, 300, 300, 300, 50, 400, 300, 50, 300, 300, 300, 50, 300, 500, 400, 300, 50, 300, 500, 400, 50, 400, 300, 300, 450, 300, 50, 300, 300, 300, 50, 300, 400, 50, 300, 300, 300, 300, 50, 400, 300, 400, 450, 300, 300, 50, 450, 400, 300, 50, 300, 50, 50, 450, 50, 450, 300, 300, 300, 50, 50, 300, 300, 50, 400, 450, 500, 50, 300, 300, 50, 300, 300, 400, 300, 400, 50, 50, 50, 300, 300, 450, 500, 300, 300, 50, 50, 300, 50, 300, 450, 50, 300, 400, 300, 300, 300, 300, 50, 300, 300, 400, 450, 450, 400, 50, 300, 450, 300, 400, 300, 300, 300, 300, 300, 50, 50, 50, 400, 300, 300, 300, 300, 300, 50, 450, 300, 50, 300, 300, 450, 300, 50, 300, 400, 300, 400, 500, 300, 50, 400, 300, 50, 300, 400, 50, 50, 300, 50, 300, 450, 300, 50, 300, 400, 50, 50, 300, 400, 300, 400, 50, 50, 450, 300, 300, 300, 300, 300, 50, 450, 50, 300, 450, 300, 300, 50, 50, 50, 300, 300, 400, 300, 50, 50, 50, 450, 300, 300, 50, 400, 300, 50, 50, 50, 450, 50, 300, 50, 50, 50, 300, 50, 300, 50, 300, 450, 300, 300, 300, 50, 300, 300, 50, 300, 500, 50, 50, 50, 400, 450, 50, 50, 50, 400, 300, 50, 300, 300, 300, 50, 300, 400, 450, 300, 50, 300, 50, 50, 300, 400, 50, 50, 300, 50, 300, 300, 50, 300, 50, 450, 300, 300, 300, 50, 300, 400, 50, 300, 300, 300, 300, 450, 50, 300, 300, 300, 50, 450, 50, 50, 300, 300, 300, 50, 300, 450, 300, 50, 300, 50, 300, 300, 400, 50, 300, 300, 300, 300, 300, 50, 300, 300, 300, 400, 450, 300, 450, 50, 50, 300, 300, 400, 50, 300, 50, 300, 450, 50, 300, 300, 300, 50, 400, 50, 50, 50, 400, 300, 300, 500, 300, 50, 300, 50, 300, 50, 50, 50, 500, 300, 50, 300, 300, 300, 400, 50, 300, 50, 400, 300, 400, 50, 300, 300, 500, 400, 50, 300, 450, 450, 50, 50, 50, 300, 50, 50, 50, 50, 50, 500, 400, 50, 50, 50, 400, 50, 50, 300, 300, 50, 300, 50, 300, 300, 450, 50, 300, 300, 400, 50, 300, 300, 50, 300, 50, 300, 300, 50, 400, 300, 300, 50, 300, 300, 50, 300, 50, 300, 400, 450, 300, 50, 300, 300, 50, 300, 300, 50, 450, 300, 300, 50, 50, 50, 50, 300, 400, 400, 50, 300, 450, 300, 300, 300, 300, 300, 300, 50, 300, 300, 300, 300, 300, 300, 300, 50, 50, 450, 50, 50, 300, 300, 300, 400, 300, 50, 50, 50, 300, 50, 300, 300, 450, 300, 300, 300, 400, 300, 300, 300, 50, 300, 50, 400, 300, 400, 300, 300, 300, 300, 400, 300, 300, 50, 300, 300, 50, 400, 300, 300, 50, 400, 300, 300, 50, 300, 300, 450, 50, 450, 50, 50, 300, 300, 50, 300, 400, 300, 50, 50, 300, 300, 400, 50, 300, 300, 400, 300, 450, 50, 400, 50, 500, 450, 300, 300, 300, 400, 300, 300, 50, 50, 300, 50, 50, 300, 300, 50, 450, 400, 50, 300, 300, 50, 300, 450, 450, 50, 50, 300, 50, 400, 300, 300, 50, 50, 450, 50, 300, 50, 300, 450, 50, 450, 50, 50, 300, 300, 300, 50, 400, 400, 300, 300, 300, 50, 50, 300, 50, 50, 50, 400, 300, 300, 50, 50, 400, 400, 50, 300, 300, 300, 50, 50, 300, 300, 300, 400, 300, 400, 300, 50, 300, 300, 450, 300, 300, 300, 50, 300, 400, 300, 300, 50, 300, 50, 50, 300, 300, 300, 300, 300, 50, 300, 400, 400, 50, 50, 300, 300, 300, 400, 50, 50, 400, 400, 300, 300, 50, 300, 300, 300, 500, 300, 300, 300, 300, 450, 300, 450, 50, 300, 300, 50, 300, 50, 300, 450, 50, 400, 400, 400, 400, 50, 300, 300, 50, 50, 50, 300, 50, 50, 300, 500, 50, 300, 300, 450, 300, 400, 300, 300, 450, 50, 50, 300, 500, 400, 300, 300, 50, 50, 50, 50, 300, 300, 300, 50, 300, 300, 300, 50, 450, 300, 300, 50, 400, 450, 50, 450, 300, 300, 300, 50, 400, 300, 50, 300, 300, 50, 300, 300, 400, 50, 300, 400, 300, 400, 50, 300, 300, 50, 300, 300, 450, 50, 50, 400, 450, 400, 300, 400, 300, 50, 300, 300, 400, 300, 300, 300, 50, 400, 300, 300, 50, 300, 300, 300, 50, 300, 300, 400, 300, 300, 50, 300, 300, 300, 50, 400, 450, 300, 300, 300, 300, 300, 50, 50, 50, 50, 300, 300, 300, 300, 50, 300, 50, 300, 400, 300, 450, 300, 50, 50, 400, 300, 300, 300, 400, 50, 500, 50, 300, 450, 450, 300, 300, 450, 300, 300, 450, 50, 450, 300, 300, 300, 50, 400, 50, 50, 50, 300, 300, 450, 50, 400, 300, 400, 300, 50, 50, 400, 300, 300, 300, 300, 50, 400, 300, 50, 300, 300, 300, 50, 300, 500, 400, 300, 50, 300, 500, 400, 50, 400, 300, 300, 450, 300, 50, 300, 300, 300, 50, 300, 400, 50, 300, 300, 300, 300, 50, 400, 300, 400, 450, 300, 300, 50, 450, 400, 300, 50, 300, 50, 50, 450, 50, 450, 300, 300, 300, 50, 50, 300, 300, 50, 400, 450, 500, 50, 300, 300, 50, 300, 300, 400, 300, 400, 50, 50, 50, 300, 300, 450, 500, 300, 300, 50, 50, 300, 50, 300, 450, 50, 300, 400, 300, 300, 300, 300, 50, 300, 300, 400, 450, 450, 400, 50, 300, 450, 300, 400, 300, 300, 300, 300, 300, 50, 50, 50, 400, 300, 300, 300, 300, 300, 50, 450, 300, 50, 300, 300, 450, 300, 50, 300, 400, 300, 400, 500, 300, 50, 400, 300, 50, 300, 400, 50, 50, 300, 50, 300, 450, 300, 50, 300, 400, 50, 50, 300, 400, 300, 400, 50, 50, 450, 300, 300, 300, 300, 300, 50, 450, 50, 300, 450, 300, 300, 50, 50, 50, 300, 300
  ], []);

  // Números específicos para rolls 19-1483
  const rollsData = useMemo(() => [
    150, 250, 150, 25, 150, 25, 25, 150, 200, 150, 25, 25, 25, 25, 25, 25, 150, 150, 25, 25, 25, 25, 25, 150, 25, 25, 250, 25, 25, 150, 25, 25, 150, 25, 25, 25, 250, 25, 25, 25, 25, 250, 25, 25, 25, 25, 25, 150, 150, 25, 25, 25, 250, 250, 200, 150, 25, 150, 25, 25, 150, 25, 25, 150, 25, 150, 150, 25, 200, 25, 150, 200, 25, 150, 500, 25, 25, 25, 25, 25, 25, 25, 150, 25, 25, 25, 25, 150, 25, 25, 25, 25, 25, 25, 150, 25, 25, 25, 150, 25, 25, 200, 25, 25, 150, 25, 500, 150, 250, 25, 150, 150, 25, 25, 25, 150, 25, 150, 150, 150, 25, 25, 150, 25, 25, 25, 150, 150, 250, 25, 25, 25, 250, 200, 25, 25, 200, 150, 200, 25, 150, 150, 150, 25, 200, 250, 150, 150, 150, 25, 25, 150, 200, 25, 150, 25, 25, 25, 150, 150, 500, 150, 25, 200, 25, 25, 25, 200, 250, 25, 25, 150, 150, 150, 25, 25, 250, 150, 150, 150, 25, 200, 25, 25, 150, 25, 250, 25, 250, 25, 25, 25, 150, 25, 150, 25, 150, 25, 25, 200, 25, 150, 250, 150, 25, 25, 25, 150, 150, 25, 25, 25, 150, 25, 25, 150, 150, 25, 25, 150, 25, 150, 150, 25, 25, 150, 200, 150, 25, 150, 25, 25, 250, 200, 25, 200, 150, 25, 25, 25, 25, 25, 150, 200, 200, 25, 25, 150, 25, 150, 25, 25, 25, 150, 25, 250, 25, 25, 25, 25, 25, 25, 25, 25, 150, 25, 25, 25, 150, 25, 150, 25, 25, 25, 150, 25, 150, 25, 25, 25, 25, 25, 25, 150, 150, 150, 200, 25, 200, 25, 25, 25, 25, 25, 25, 150, 150, 25, 25, 25, 200, 25, 25, 150, 250, 150, 200, 25, 150, 150, 25, 150, 25, 150, 25, 25, 150, 25, 250, 25, 25, 25, 200, 25, 200, 200, 25, 25, 25, 25, 150, 150, 25, 25, 200, 25, 25, 25, 200, 25, 25, 200, 150, 150, 150, 25, 25, 150, 150, 25, 25, 25, 25, 25, 25, 25, 25, 25, 200, 25, 25, 150, 25, 25, 25, 25, 25, 150, 25, 25, 25, 200, 25, 25, 150, 25, 25, 25, 25, 25, 25, 150, 25, 25, 25, 25, 150, 25, 25, 150, 25, 25, 25, 25, 150, 150, 25, 150, 25, 25, 25, 25, 150, 150, 25, 25, 150, 25, 25, 25, 150, 150, 25, 200, 25, 150, 150, 200, 25, 150, 25, 150, 25, 200, 250, 150, 25, 25, 150, 25, 200, 25, 25, 25, 200, 25, 200, 150, 25, 25, 500, 25, 25, 25, 25, 25, 200, 25, 25, 250, 250, 150, 25, 150, 25, 25, 25, 500, 25, 25, 250, 25, 25, 150, 25, 25, 150, 25, 25, 25, 25, 25, 25, 25, 150, 25, 250, 150, 150, 150, 150, 25, 500, 150, 200, 250, 25, 25, 150, 150, 25, 25, 200, 25, 25, 25, 25, 25, 150, 25, 25, 200, 150, 500, 200, 25, 25, 150, 150, 250, 25, 25, 200, 25, 150, 25, 25, 200, 25, 25, 150, 150, 150, 25, 200, 25, 25, 150, 25, 150, 150, 25, 150, 25, 25, 25, 25, 150, 150, 200, 150, 25, 200, 25, 25, 25, 25, 150, 150, 25, 25, 250, 25, 25, 25, 25, 150, 250, 150, 25, 25, 25, 25, 25, 25, 25, 25, 200, 25, 25, 25, 150, 200, 200, 150, 25, 150, 25, 25, 200, 25, 25, 25, 25, 25, 25, 25, 150, 150, 150, 25, 25, 150, 150, 500, 250, 25, 25, 25, 25, 150, 250, 250, 25, 25, 250, 200, 25, 25, 25, 25, 150, 250, 25, 1000, 200, 25, 150, 25, 25, 200, 200, 150, 150, 25, 150, 25, 150, 25, 200, 150, 25, 150, 25, 25, 150, 25, 25, 200, 25, 150, 25, 25, 25, 25, 150, 150, 25, 150, 150, 200, 150, 25, 25, 150, 25, 25, 25, 200, 25, 150, 25, 25, 25, 25, 25, 25, 150, 25, 25, 150, 25, 25, 25, 25, 25, 150, 25, 500, 25, 25, 250, 150, 500, 25, 25, 150, 250, 150, 25, 25, 25, 150, 200, 150, 25, 25, 150, 25, 25, 150, 200, 150, 25, 150, 25, 150, 25, 25, 25, 25, 250, 25, 200, 150, 150, 250, 25, 25, 25, 25, 25, 25, 25, 150, 25, 25, 150, 150, 25, 25, 25, 25, 25, 25, 25, 150, 25, 25, 25, 25, 25, 25, 200, 150, 150, 25, 25, 25, 25, 25, 25, 25, 25, 25, 250, 250, 25, 200, 150, 25, 25, 150, 25, 25, 250, 25, 150, 25, 25, 25, 25, 150, 25, 150, 25, 25, 25, 150, 25, 25, 25, 25, 25, 250, 25, 25, 25, 25, 500, 25, 25, 150, 25, 25, 25, 150, 250, 500, 25, 150, 250, 150, 250, 150, 250, 150, 25, 200, 25, 25, 150, 25, 200, 25, 25, 200, 200, 25, 25, 25, 25, 25, 25, 25, 25, 25, 150, 150, 25, 200, 25, 25, 150, 25, 150, 25, 25, 200, 25, 25, 25, 150, 25, 500, 25, 25, 25, 25, 25, 25, 150, 25, 25, 25, 250, 25, 150, 25, 25, 25, 200, 25, 25, 25, 25, 150, 150, 25, 25, 250, 200, 25, 25, 25, 25, 25, 150, 250, 200, 200, 250, 25, 25, 150, 150, 150, 25, 150, 500, 500, 150, 25, 25, 25, 25, 25, 25, 25, 150, 25, 25, 150, 25, 500, 250, 150, 25, 25, 25, 25, 150, 25, 200, 150, 25, 150, 150, 150, 150, 25, 25, 25, 25, 25, 25, 25, 25, 500, 25, 25, 150, 150, 25, 500, 150, 200, 150, 150, 150, 150, 150, 25, 200, 25, 150, 150, 25, 25, 25, 150, 25, 150, 25, 200, 500, 150, 500, 200, 200, 150, 200, 25, 150, 150, 150, 25, 200, 250, 150, 150, 150, 25, 25, 150, 200, 25, 150, 25, 25, 25, 150, 150, 500, 150, 25, 200, 25, 25, 25, 200, 250, 25, 25, 150, 150, 150, 25, 25, 250, 150, 150, 150, 25, 200, 25, 25, 150, 25, 250, 25, 250, 25, 25, 25, 150, 25, 150, 25, 150, 25, 25, 200, 25, 150, 250, 150, 25, 25, 25, 150, 150, 25, 25, 25, 150, 25, 25, 150, 150, 25, 25, 150, 25, 150, 150, 25, 25, 150, 200, 150, 25, 150, 25, 25, 250, 200, 25, 200, 150, 25, 25, 25, 25, 25, 150, 200, 200, 25, 25, 150, 25, 150, 25, 25, 25, 150, 25, 250, 25, 25, 25, 25, 25, 25, 25, 25, 150, 25, 25, 25, 150, 25, 150, 25, 25, 25, 150, 25, 150, 25, 25, 25, 25, 25, 25, 150, 150, 150, 200, 25, 200, 25, 25, 25, 25, 25, 25, 150, 150, 25, 25, 25, 200, 25, 25, 150, 250, 150, 200, 25, 150, 150, 25, 150, 25, 150, 25, 25, 150, 25, 250, 25, 25, 25, 200, 25, 200, 200, 25, 25, 25, 25, 150, 150, 25, 25, 200, 25, 25, 25, 200, 25, 25, 200, 150, 150, 150, 25, 25, 150, 150, 25, 25, 25, 25, 25, 25, 25, 25, 25, 200, 25, 25, 150, 25, 25, 25, 25, 25, 150, 25, 25, 25, 200, 25, 25, 150, 25, 25, 25, 25, 25, 25, 150, 25, 25, 25, 25, 150, 25, 25, 150, 25, 25, 25, 25, 150, 150, 25, 150, 25, 25, 25, 25, 150, 150, 25, 25, 150, 25, 25, 25, 150, 150, 25, 200, 25, 150, 150, 200, 25, 150, 25, 150, 25, 200, 250, 150, 25, 25, 150, 25, 200, 25, 25, 25, 200, 25, 200, 150, 25, 25, 500, 25, 25, 25, 25, 25, 200, 25, 25, 250, 250, 150, 25, 150, 25, 25, 25, 500, 25, 25, 250, 25, 25, 150, 25, 25, 150, 25, 25, 25, 25, 25, 25, 25, 150, 25, 250, 150, 150, 150, 150, 25, 500, 150, 200, 250, 25, 25, 150, 150, 25, 25, 200, 25, 25, 25, 25, 25, 150, 25, 25, 200, 150, 500, 200, 25, 25, 150, 150, 250, 25, 25, 200, 25, 150, 25, 25, 200, 25, 25, 150, 150, 150, 25, 200, 25, 25, 150, 25, 150, 150, 25, 150, 25, 25, 25, 25, 150, 150, 200, 150, 25, 200, 25, 25, 25, 25, 150, 150, 25, 25, 250, 25, 25, 25, 25, 150, 250, 150, 25, 25, 25, 25, 25, 25, 25, 25, 200, 25, 25, 25, 150, 200, 200, 150, 25, 150, 25, 25, 200, 25, 25, 25, 25, 25, 25, 25, 150, 150, 150, 25, 25, 150, 150, 500, 250, 25, 25, 25, 25, 150, 250, 250, 25, 25, 250, 200, 25, 25, 25, 25, 150, 250, 25, 1000, 200, 25, 150, 25, 25, 200, 200, 150, 150, 25, 150, 25, 150, 25, 200, 150, 25, 150, 25, 25, 150, 25, 25, 200, 25, 150, 25
  ], []);

  // Datos de ectogambling basados en la imagen
  const ectoGamblingData: EctoGamblingItem[] = useMemo(() => {
    const data = [];
    
    // Primeros 18 rolls con números específicos
    const first18Rolls = [
      { id: 1, name: 'Roll 1', beforeCount: 0, afterCount: 150, difference: 150, category: 'roll', tier: 1, cost: 100, probability: 0.15, rarity: 'Common', icon: '', currentPrice: 0 },
      { id: 2, name: 'Roll 2', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 150, probability: 0.12, rarity: 'Common', icon: '', currentPrice: 0 },
      { id: 3, name: 'Roll 3', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 200, probability: 0.08, rarity: 'Rare', icon: '', currentPrice: 0 },
      { id: 4, name: 'Roll 4', beforeCount: 0, afterCount: 200, difference: 200, category: 'roll', tier: 1, cost: 250, probability: 0.05, rarity: 'Exotic', icon: '', currentPrice: 0 },
      { id: 5, name: 'Roll 5', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 100, probability: 0.15, rarity: 'Common', icon: '', currentPrice: 0 },
      { id: 6, name: 'Roll 6', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 150, probability: 0.12, rarity: 'Common', icon: '', currentPrice: 0 },
      { id: 7, name: 'Roll 7', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 200, probability: 0.08, rarity: 'Rare', icon: '', currentPrice: 0 },
      { id: 8, name: 'Roll 8', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 100, probability: 0.15, rarity: 'Common', icon: '', currentPrice: 0 },
      { id: 9, name: 'Roll 9', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 150, probability: 0.12, rarity: 'Common', icon: '', currentPrice: 0 },
      { id: 10, name: 'Roll 10', beforeCount: 0, afterCount: 150, difference: 150, category: 'roll', tier: 1, cost: 200, probability: 0.08, rarity: 'Rare', icon: '', currentPrice: 0 },
      { id: 11, name: 'Roll 11', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 250, probability: 0.05, rarity: 'Exotic', icon: '', currentPrice: 0 },
      { id: 12, name: 'Roll 12', beforeCount: 0, afterCount: 150, difference: 150, category: 'roll', tier: 1, cost: 100, probability: 0.15, rarity: 'Common', icon: '', currentPrice: 0 },
      { id: 13, name: 'Roll 13', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 150, probability: 0.12, rarity: 'Common', icon: '', currentPrice: 0 },
      { id: 14, name: 'Roll 14', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 200, probability: 0.08, rarity: 'Rare', icon: '', currentPrice: 0 },
      { id: 15, name: 'Roll 15', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 250, probability: 0.05, rarity: 'Exotic', icon: '', currentPrice: 0 },
      { id: 16, name: 'Roll 16', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 100, probability: 0.20, rarity: 'Rare', icon: '', currentPrice: 0 },
      { id: 17, name: 'Roll 17', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 150, probability: 0.18, rarity: 'Rare', icon: '', currentPrice: 0 },
      { id: 18, name: 'Roll 18', beforeCount: 0, afterCount: 25, difference: 25, category: 'roll', tier: 1, cost: 200, probability: 0.15, rarity: 'Exotic', icon: '', currentPrice: 0 }
    ];
    
    data.push(...first18Rolls);
    
    // Rolls 19-1483 con números específicos
    for (let i = 19; i <= 1483; i++) {
      const rollValue = rollsData[(i - 19) % rollsData.length];
      const ectoplasmaValue = ectoplasmaData[(i - 19) % ectoplasmaData.length];
      data.push({
        id: i,
        name: `Roll ${i}`,
        beforeCount: 0,
        afterCount: rollValue,
        difference: rollValue,
        category: 'roll',
        tier: 1,
        cost: 100 + (i % 4) * 50,
        probability: ectoplasmaValue,
        rarity: i % 3 === 0 ? 'Rare' : i % 5 === 0 ? 'Exotic' : 'Common',
        icon: '',
        currentPrice: 0
      });
    }
    
    return data;
  }, [ectoplasmaData, rollsData]);

  // Función para calcular el costo por roll dinámicamente
  const calculateCostPerRoll = useCallback((ectoPrice: number | null) => {
    if (ectoPrice == null) return 0;
    return 1000000 + (ectoPrice * 250);
  }, []);

  // Totales acumulados para 85%, 90% y 100% (suma de cada fila)
  const rollTotals = useMemo(() => {
    if (ectoUnitPrice == null) {
      return { t85: null as number | null, t90: null as number | null, t100: null as number | null };
    }
    let sum85 = 0;
    let sum90 = 0;
    let sum100 = 0;
    for (let index = 0; index < 1483; index++) {
      const item = ectoGamblingData[index % ectoGamblingData.length];
      const amountTrashCopper = (item.difference || 0) * 10000;
      const amountEctos = ectoplasmaData[index % ectoplasmaData.length] || 0;
      sum85 += amountTrashCopper + Math.round(amountEctos * ectoUnitPrice * 0.85);
      sum90 += amountTrashCopper + Math.round(amountEctos * ectoUnitPrice * 0.9);
      sum100 += amountTrashCopper + Math.round(amountEctos * ectoUnitPrice);
    }
    return { t85: sum85, t90: sum90, t100: sum100 };
  }, [ectoUnitPrice, ectoGamblingData, ectoplasmaData]);

  // Estadísticas principales basadas en la imagen
  const mainStats = useMemo(() => {
    const totalRolls = 1483;
    const total85Value = rollTotals.t85 || 0;
    const avgValuePerRoll = totalRolls > 0 ? Math.round(total85Value / totalRolls) : 0;
    const costPerRoll = calculateCostPerRoll(ectoUnitPrice);
    const loss = ((costPerRoll - avgValuePerRoll)) * totalRolls; // Cálculo dinámico: (costPerRoll - avgValuePerRoll) * totalRolls
    const totalGoldUsedDetailed = costPerRoll * totalRolls; // Cálculo dinámico: costPerRoll * totalRolls
    
    return {
      totalGoldUsed: 1000,
      totalRolls: totalRolls,
      loss: loss, // Cálculo dinámico: (costPerRoll - avgValuePerRoll) * totalRolls
      ectoplasmaTreasure: 247.8435306,
      totalGoldUsedDetailed: totalGoldUsedDetailed, // Cálculo dinámico: costPerRoll * totalRolls
      avgValuePerRoll: avgValuePerRoll, // Cálculo dinámico: Total 85% / totalRolls
      costPerRoll: costPerRoll, // Cálculo dinámico: 1000000 + (precio_ectoplasma * 250)
    };
  }, [ectoUnitPrice, calculateCostPerRoll, rollTotals.t85]);



  // Función para formatear oro, plata y cobre
  const formatGoldSilverCopper = (copper: number): string => {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperRemainder = copper % 100;
    const silverStr = silver.toString().padStart(2, '0');
    const copperStr = copperRemainder.toString().padStart(2, '0');
    
    if (gold > 0) {
      return `${gold}g\u00A0${silverStr}s\u00A0${copperStr}c`;
    } else if (silver > 0) {
      return `${silverStr}s\u00A0${copperStr}c`;
    } else {
      return `${copperStr}c`;
    }
  };

  // Función para formatear valores grandes
  const formatLargeGold = (copper: number): string => {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperRemainder = copper % 100;
    const silverStr = silver.toString().padStart(2, '0');
    const copperStr = copperRemainder.toString().padStart(2, '0');
    
    if (gold > 0) {
      return `${gold}g\u00A0${silverStr}s\u00A0${copperStr}c`;
    } else if (silver > 0) {
      return `${silverStr}s\u00A0${copperStr}c`;
    } else {
      return `${copperStr}c`;
    }
  };


  // Fetch precio de venta del ítem 19721 (Ectoplasma) desde la API de GW2
  useEffect(() => {
    let isCancelled = false;
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.guildwars2.com/v2/commerce/prices/19721');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const unit = data?.sells?.unit_price;
        if (typeof unit === 'number' && unit >= 0) {
          if (!isCancelled) setEctoUnitPrice(unit);
        } else {
          throw new Error('Precio inválido');
        }
      } catch {
        // Error silencioso - el precio se mantiene en null
      }
    };
    fetchPrice();

    // Revalidación cada 5 minutos
    const intervalId = setInterval(fetchPrice, 300000);

    // Refrescar al volver a enfocar la pestaña
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchPrice();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Mapa de Treasure (0 = en blanco, 1 = mostrar 1). 
  const treasureFlags: number[] = useMemo(() => {
    const raw = `
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
1
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
1
0
0
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
1
0
0
0
0
0
0
1
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
1
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
1
1
1
0
0
1
0
0
1
1
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
1
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
1
0
0
0
0
0
0
0
0
0
1
0
0
0
1
0
0
0
1
0
0
0
0
0
0
1
0
0
0
0
1
0
0
1
0
0
1
1
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
1
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
0
0
1
0
0
1
0
1
0
0
0
1
1
1
0
0
0
0
0
0
0
0
0
1
0
0
0
0
1
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
1
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
1
0
1
0
0
0
0
0
0
0
0
0
0
0
1
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
1
0
0
0
0
0
0
1
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
1
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
0
1
0
0
0
0
0
0
0
0
0
1
1
1
0
0
1
0
0
1
1
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
1
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
1
0
0
0
0
0
0
0
0
0
1
0
0
0
1
0
0
0
1
0
0
0
0
0
0
1
0
0
0
0
1
0
0
1
0
0
1
1
0
0
0
0
1
0
0
0
0
0
0
0
0
0
0
0
0
1
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
1
0
0
0
0
0
0
0
1
0
0
1
0
1
0
0
0
1
1
1
0
0
0
0
0
0
0
0
0
1
0
0
0
0
1
0
1
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
0
`;
    return raw.split(/\s+/).filter(Boolean).map(v => (v === '1' ? 1 : 0));
  }, []);


  // Función para manejar el ordenamiento
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc'); // por defecto: mayor a menor
    }
  };

  // Helpers para cálculo por fila
  const getTrashValue = useCallback((index: number) => {
    const item = ectoGamblingData[index % ectoGamblingData.length];
    return item?.difference ?? 0;
  }, [ectoGamblingData]);

  const getEctosValue = useCallback((index: number) => {
    return ectoplasmaData[index % ectoplasmaData.length] || 0;
  }, [ectoplasmaData]);

  const getTotalCopperForPct = useCallback((index: number, pct: number) => {
    if (ectoUnitPrice == null) return 0;
    const item = ectoGamblingData[index % ectoGamblingData.length];
    const amountTrashCopper = ((item?.difference || 0) * 10000);
    const amountEctos = getEctosValue(index);
    return amountTrashCopper + Math.round(amountEctos * ectoUnitPrice * pct);
  }, [ectoUnitPrice, ectoGamblingData, getEctosValue]);

  // Índices ordenados según sortBy/sortOrder
  const sortedIndices = useMemo(() => {
    const indices = Array.from({ length: 1483 }, (_, i) => i);
    if (sortBy === 'name') return indices; // no ordenar por defecto, mantiene orden natural

    const getComparableValue = (idx: number) => {
      switch (sortBy) {
        case 'trash':
          return getTrashValue(idx);
        case 'ectos':
          return getEctosValue(idx);
        case 'total85':
          return getTotalCopperForPct(idx, 0.85);
        case 'total90':
          return getTotalCopperForPct(idx, 0.9);
        case 'total100':
          return getTotalCopperForPct(idx, 1);
        default:
          return 0;
      }
    };

    indices.sort((a, b) => {
      const va = getComparableValue(a);
      const vb = getComparableValue(b);
      if (va === vb) return 0;
      return sortOrder === 'asc' ? (va - vb) : (vb - va);
    });
    return indices;
  }, [sortBy, sortOrder, getTrashValue, getEctosValue, getTotalCopperForPct]);






  return (
    <div className="min-h-screen tf-site-bg">
      <style>{`
        @media (max-width: 640px) {
          .overflow-x-auto {
            -webkit-overflow-scrolling: touch;
          }
          table {
            font-size: 0.75rem;
          }
          th, td {
            padding: 0.5rem 0.25rem;
          }
        }
      `}</style>
      
      <main className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">
            {t('ectogamblingPage.title')}
          </h1>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg">
            {t('ectogamblingPage.subtitle')}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            {t('ectogamblingPage.dataCredit', 'Data Credit for Vortus43').replace('Vortus43', '').trim()}
            <a 
              href="https://www.twitch.tv/vortus43" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 underline transition-colors"
            >Vortus43
            </a>
          </p>
        </div>

        {/* Section Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 shadow-2xl w-full max-w-4xl">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setActiveSection('rolls')}
                className={`px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${
                  activeSection === 'rolls'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                 {t('ectogamblingPage.rolls')}
              </button>
                <button
                  onClick={() => setActiveSection('sandstorm')}
                  className={`px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${
                    activeSection === 'sandstorm'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t('ectogamblingPage.sandstormLuckyDraw')}
                </button>
            </div>
          </div>
        </div>

        {/* Content based on active section */}
        

        {/* Rolls Section */}
        {activeSection === 'rolls' && (
          <>
            {/* Estadísticas (Rolls) - Estilo moderno con gradientes */}
            <section className="bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-2xl overflow-hidden mb-6">
              <header className="flex items-center justify-between px-6 py-4 border-b border-gray-600/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-white">
                    {t('ectogamblingPage.stats')}
                  </h3>
                </div>
                <button
                  onClick={() => setShowRollStats(!showRollStats)}
                  className="md:hidden text-gray-300 hover:text-white bg-gradient-to-r from-gray-700/60 to-gray-600/60 border border-gray-500/50 rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 hover:shadow-lg"
                  aria-expanded={showRollStats}
                >
                  {showRollStats ? 'Ocultar' : 'Mostrar'}
                </button>
              </header>
              {showRollStats && (
                <div className="p-6">
                  {/* Estadísticas principales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                      <div className="mb-2">
                        <span className="text-yellow-400 text-sm font-medium">{t('ectogamblingPage.totalGoldUsed')}</span>
                      </div>
                      <div className="text-yellow-300 font-bold text-lg">{formatLargeGold(mainStats.totalGoldUsedDetailed)}</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-500/30 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                      <div className="mb-2">
                        <span className="text-blue-400 text-sm font-medium">{t('ectogamblingPage.totalRolls')}</span>
                      </div>
                      <div className="text-blue-300 font-bold text-lg">{mainStats.totalRolls.toLocaleString()}</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                      <div className="mb-2">
                        <span className="text-purple-400 text-sm font-medium">{t('ectogamblingPage.avgValue')}</span>
                      </div>
                      <div className="text-purple-300 font-bold text-lg">{formatGoldSilverCopper(mainStats.avgValuePerRoll)}</div>
                    </div>
                  </div>

                  {/* Estadísticas secundarias */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-500/30 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                      <div className="mb-2">
                        <span className="text-red-400 text-sm font-medium">{t('ectogamblingPage.costPerRoll')}</span>
                      </div>
                      <div className="text-red-300 font-bold text-lg">{formatGoldSilverCopper(mainStats.costPerRoll)}</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-500/30 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                      <div className="mb-2">
                        <span className="text-red-400 text-sm font-medium">{t('ectogamblingPage.totalLoss')}</span>
                      </div>
                      <div className="text-red-300 font-bold text-lg">{formatLargeGold(mainStats.loss)}</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/30 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                      <div className="mb-2">
                        <span className="text-green-400 text-sm font-medium">{t('ectogamblingPage.ectoplasmaName')}</span>
                      </div>
                      <div className="text-green-300 font-bold text-lg">{mainStats.ectoplasmaTreasure}</div>
                    </div>
                  </div>

                  {/* Totales por porcentaje */}
                  <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 border border-gray-600/30 rounded-xl p-4">
                    <h4 className="text-gray-300 font-semibold mb-4 text-center">{t('ectogamblingPage.totals')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-lg p-3 text-center">
                        <div className="text-blue-400 text-sm font-medium mb-1">85%</div>
                        <div className="text-blue-300 font-bold text-lg">{rollTotals.t85 != null ? formatLargeGold(rollTotals.t85) : t('ectogamblingPage.loading')}</div>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 border border-indigo-500/20 rounded-lg p-3 text-center">
                      <div className="text-indigo-400 text-sm font-medium mb-1">90%</div>
                        <div className="text-indigo-300 font-bold text-lg">{rollTotals.t90 != null ? formatLargeGold(rollTotals.t90) : t('ectogamblingPage.loading')}</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/20 rounded-lg p-3 text-center">
                        <div className="text-purple-400 text-sm font-medium mb-1">100%</div>
                        <div className="text-purple-300 font-bold text-lg">{rollTotals.t100 != null ? formatLargeGold(rollTotals.t100) : t('ectogamblingPage.loading')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Rolls Table */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Package className="w-6 h-6 mr-3 text-purple-400" />
                  {t('ectogamblingPage.rollsTable')}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 bg-gray-800/60">
                        <th className="text-left p-2 sm:p-3 text-gray-200 font-semibold">
                          <div className="flex items-center gap-2">
                            Rolls
                          </div>
                        </th>
                       <th className="text-center p-2 sm:p-3 text-gray-200 font-semibold cursor-pointer hover:bg-gray-700/60 transition-colors select-none" onClick={() => handleSort('trash')}>
                         <div className="flex items-center justify-center gap-2">
                           {t('ectogamblingPage.trash')}
                           <div className="flex flex-col text-xs text-gray-500">
                             {sortBy === 'trash' ? (
                               sortOrder === 'asc' ? (
                                 <span className="text-blue-400">↑</span>
                               ) : (
                                 <span className="text-blue-400">↓</span>
                               )
                             ) : (
                               <>
                                 <span>↑</span>
                                 <span>↓</span>
                               </>
                             )}
                           </div>
                         </div>
                       </th>
                       <th className="text-center p-2 sm:p-3 text-gray-200 font-semibold cursor-pointer hover:bg-gray-700/60 transition-colors select-none" onClick={() => handleSort('ectos')}>
                         <div className="flex items-center justify-center gap-2">
                           {t('ectogamblingPage.ectos')}
                           <div className="flex flex-col text-xs text-gray-500">
                             {sortBy === 'ectos' ? (
                               sortOrder === 'asc' ? (
                                 <span className="text-blue-400">↑</span>
                               ) : (
                                 <span className="text-blue-400">↓</span>
                               )
                             ) : (
                               <>
                                 <span>↑</span>
                                 <span>↓</span>
                               </>
                             )}
                           </div>
                         </div>
                       </th>
                       <th className="text-center p-2 sm:p-3 text-gray-200 font-semibold">{t('ectogamblingPage.treasure')}</th>
                       <th className="text-center p-2 sm:p-3 text-gray-200 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-700/60 transition-colors select-none" onClick={() => handleSort('total85')}>
                         <div className="flex items-center justify-center gap-2">
                           {t('ectogamblingPage.total85')}
                           <div className="flex flex-col text-xs text-gray-500">
                             {sortBy === 'total85' ? (
                               sortOrder === 'asc' ? (
                                 <span className="text-blue-400">↑</span>
                               ) : (
                                 <span className="text-blue-400">↓</span>
                               )
                             ) : (
                               <>
                                 <span>↑</span>
                                 <span>↓</span>
                               </>
                             )}
                           </div>
                         </div>
                       </th>
                       <th className="text-center p-2 sm:p-3 text-gray-200 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-700/60 transition-colors select-none" onClick={() => handleSort('total90')}>
                         <div className="flex items-center justify-center gap-2">
                           {t('ectogamblingPage.total90')}
                           <div className="flex flex-col text-xs text-gray-500">
                             {sortBy === 'total90' ? (
                               sortOrder === 'asc' ? (
                                 <span className="text-blue-400">↑</span>
                               ) : (
                                 <span className="text-blue-400">↓</span>
                               )
                             ) : (
                               <>
                                 <span>↑</span>
                                 <span>↓</span>
                               </>
                             )}
                           </div>
                         </div>
                       </th>
                       <th className="text-center p-2 sm:p-3 text-gray-200 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-700/60 transition-colors select-none" onClick={() => handleSort('total100')}>
                         <div className="flex items-center justify-center gap-2">
                           {t('ectogamblingPage.total100')}
                           <div className="flex flex-col text-xs text-gray-500">
                             {sortBy === 'total100' ? (
                               sortOrder === 'asc' ? (
                                 <span className="text-blue-400">↑</span>
                               ) : (
                                 <span className="text-blue-400">↓</span>
                               )
                             ) : (
                               <>
                                 <span>↑</span>
                                 <span>↓</span>
                               </>
                             )}
                           </div>
                         </div>
                       </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedIndices.map((index) => {
                       const rollNumber = index + 1;
                       const item = ectoGamblingData[index % ectoGamblingData.length];
                       
                       return (
                         <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                          <td className="p-2 sm:p-3 text-left text-white">
                             <div className="flex items-center gap-3">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-600 rounded flex items-center justify-center">
                                 <Image 
                                   src="https://wiki.guildwars2.com/images/e/ed/Sandstorm_Flush_Hand.png"
                                   alt="Roll Icon"
                                   width={40}
                                   height={40}
                                 />
                               </div>
                               <div>
                                <div className="font-medium text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[6rem] sm:max-w-xs">
                                   {t('ectogamblingPage.roll')} {rollNumber}
                                </div>
                               </div>
                             </div>
                           </td>
                          <td className="p-2 sm:p-3 text-center text-yellow-400 font-semibold">
                             {item.difference}
                           </td>
                          <td className="p-2 sm:p-3 text-center text-green-400 font-semibold">
                             {ectoplasmaData[index % ectoplasmaData.length]}
                           </td>
                          <td className="p-2 sm:p-3 text-center">
                            {(() => {
                              const flag = treasureFlags[rollNumber - 1] ?? 0;
                              if (flag !== 1) return null;
                              return (
                                <span className="px-2 py-1 rounded-full text-sm font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  1
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-2 sm:p-3 text-center text-blue-300 font-semibold">
                            {(() => {
                              if (ectoUnitPrice == null) return '-';
                              const totalCopper = getTotalCopperForPct(index, 0.85);
                              return <span className="font-semibold text-blue-300">{formatLargeGold(totalCopper)}</span>;
                            })()}
                          </td>
                          <td className="p-2 sm:p-3 text-center text-blue-300 font-semibold">
                             {(() => {
                              if (ectoUnitPrice == null) return '-';
                              const totalCopper = getTotalCopperForPct(index, 0.9);
                               return <span className="font-semibold text-blue-300">{formatLargeGold(totalCopper)}</span>;
                             })()}
                           </td>
                          <td className="p-2 sm:p-3 text-center text-blue-300 font-semibold">
                             {(() => {
                              if (ectoUnitPrice == null) return '-';
                              const totalCopper = getTotalCopperForPct(index, 1);
                               return <span className="font-semibold text-blue-300">{formatLargeGold(totalCopper)}</span>;
                             })()}
                           </td>
                         </tr>
                       );
                     })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Sandstorm Lucky Draw Section */}
        {activeSection === 'sandstorm' && (
          <>
            {/* Sandstorm Casino Information */}
            <section className="bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-2xl overflow-hidden mb-6">
              <header className="flex items-center justify-between px-6 py-4 border-b border-gray-600/30 bg-gradient-to-r from-orange-900/20 to-red-900/20">
                <div className="flex items-center space-x-3">
                  <Image
                    src="https://render.guildwars2.com/file/807CFD23F19560EDDE46EBD233C3572A0FEA52A3/1766360.png"
                    alt="Sandstorm Lucky Draw"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                  <h3 className="text-xl font-bold text-white">
                    {t('ectogamblingPage.sandstormLuckyDraw')}
                  </h3>
                </div>
              </header>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-gray-600/50 bg-gray-800/60">
                          <th className="text-left p-2 sm:p-3 text-gray-200 font-semibold">{t('ectogamblingPage.roll')}</th>
                          <th className="text-center p-2 sm:p-3 text-gray-200 font-semibold">{t('ectogamblingPage.value')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { roll: 1, value: 5 }, { roll: 2, value: 5 }, { roll: 3, value: 1 }, { roll: 4, value: 1 },
                          { roll: 5, value: 1 }, { roll: 6, value: 1 }, { roll: 7, value: 1 }, { roll: 8, value: 5 },
                          { roll: 9, value: 1 }, { roll: 10, value: 5 }, { roll: 11, value: 1 }, { roll: 12, value: 1 },
                          { roll: 13, value: 1 }, { roll: 14, value: 1 }, { roll: 15, value: 1 }, { roll: 16, value: 1 },
                          { roll: 17, value: 1 }, { roll: 18, value: 5 }, { roll: 19, value: 1 }, { roll: 20, value: 1 },
                          { roll: 21, value: 1 }, { roll: 22, value: 1 }, { roll: 23, value: 1 }, { roll: 24, value: 1 },
                          { roll: 25, value: 1 }, { roll: 26, value: 1 }, { roll: 27, value: 1 }
                        ].map((item, index) => (
                          <tr key={index} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                            <td className="p-2 sm:p-3 text-gray-300 font-medium">
                              {t('ectogamblingPage.roll')} {item.roll}
                            </td>
                            <td className="p-2 sm:p-3 text-center">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-600/20 text-gray-300">
                                {item.value}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">27</div>
                      <div className="text-xs text-gray-400">{t('ectogamblingPage.totalRollsCount')}</div>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-400">14.8%</div>
                      <div className="text-xs text-gray-400">{t('ectogamblingPage.successRate')}</div>
                    </div>
                </div>
              </div>
            </section>
          </>
        )}

      </main>
    </div>
  );
}