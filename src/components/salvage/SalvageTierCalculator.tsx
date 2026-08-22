'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import SalvageGearPageLayout from '@/components/salvage/SalvageGearPageLayout';
import SalvageLoadingState from '@/components/salvage/SalvageLoadingState';
import { gw2WikiUrl } from '@/lib/gw2-wiki';
import type { UnidentifiedGearTier } from '@/components/salvage/salvage-config';
import {
  loadSalvageTier,
  computeSalvageRois,
  type LuckMode,
  type SalvageMaterialRow,
  type SalvageTierKey,
} from '@/lib/unidentified-salvage';

const META: Record<
  SalvageTierKey,
  {
    pageTier: UnidentifiedGearTier;
    titleKey: string;
    titleFallback: string;
    wikiEn: string;
    noteKey: string;
    descKey: string;
    descFallback: string;
    qtyKey: string;
    costKey: string;
    kitFallback: string;
    kitDescKey: string;
    profitLabelKey: string;
    profitLabelFallback: string;
    profitClass: string;
  }
> = {
  low: {
    pageTier: 'common',
    titleKey: 'pageTitles.salvageCommon',
    titleFallback: 'Salvage - Low',
    wikiEn: 'Piece of Common Unidentified Gear',
    noteKey: 'salvageCommon.note',
    descKey: 'salvageCommon.description',
    descFallback: 'Calculate profit opening and salvaging Piece of Common Unidentified Gear',
    qtyKey: 'salvageCommon.quantityLabel',
    costKey: 'salvageCommon.costGear',
    kitFallback: 'Copper-Fed Salvage-o-Matic',
    kitDescKey: 'salvageCommon.recommendedKit',
    profitLabelKey: 'salvagePages.low',
    profitLabelFallback: 'Low',
    profitClass: 'text-blue-400',
  },
  mid: {
    pageTier: 'masterwork',
    titleKey: 'pageTitles.salvageMasterwork',
    titleFallback: 'Salvage - Mid',
    wikiEn: 'Piece of Unidentified Gear',
    noteKey: 'salvageMasterwork.note',
    descKey: 'salvageMasterwork.description',
    descFallback: 'Calculate profit opening and salvaging Piece of Unidentified Gear',
    qtyKey: 'salvageMasterwork.quantityLabel',
    costKey: 'salvageMasterwork.costGear',
    kitFallback: "Runecrafter's Salvage-o-Matic",
    kitDescKey: 'salvageMasterwork.recommendedKit',
    profitLabelKey: 'salvagePages.mid',
    profitLabelFallback: 'Mid',
    profitClass: 'text-emerald-400',
  },
  high: {
    pageTier: 'rare',
    titleKey: 'pageTitles.salvageRare',
    titleFallback: 'Salvage - High',
    wikiEn: 'Piece of Rare Unidentified Gear',
    noteKey: 'salvageRare.note',
    descKey: 'salvageRare.description',
    descFallback: 'Calculate profit opening and salvaging Piece of Rare Unidentified Gear',
    qtyKey: 'salvageRare.quantityLabel',
    costKey: 'salvageRare.costGear',
    kitFallback: 'Silver-Fed Salvage-o-Matic',
    kitDescKey: 'salvageRare.recommendedKit',
    profitLabelKey: 'salvagePages.high',
    profitLabelFallback: 'High',
    profitClass: 'text-amber-400',
  },
};

export default function SalvageTierCalculator({ tierKey }: { tierKey: SalvageTierKey }) {
  const meta = META[tierKey];
  usePageTitle(meta.titleKey, meta.titleFallback);
  const { t, lang } = useI18n();
  const [quantity, setQuantity] = useState(250);
  const [materials, setMaterials] = useState<SalvageMaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [gearBuy, setGearBuy] = useState(0);
  const [gearName, setGearName] = useState<string | null>(null);
  const [kitName, setKitName] = useState<string | null>(null);
  const [kitCost, setKitCost] = useState(0);
  const [wikiUrl, setWikiUrl] = useState('');
  const [luckMode, setLuckMode] = useState<LuckMode>('none');

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadSalvageTier(tierKey, lang);
      setMaterials(data.materials);
      setGearBuy(data.gearBuy || 0);
      setGearName(data.gearName);
      setKitName(data.kitName);
      setKitCost(data.kitCost);
      setLuckMode(data.luckDropRate > 0 ? 'luck' : 'none');
      setWikiUrl(gw2WikiUrl(meta.wikiEn, lang === 'es' ? 'es' : lang));
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [lang, meta.wikiEn, tierKey]);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 120_000);
    return () => clearInterval(id);
  }, [fetchPrices]);

  const { rois, defaultMode } = computeSalvageRois(materials, quantity, gearBuy, kitCost);
  const active = rois.find((r) => r.mode === luckMode) || rois.find((r) => r.mode === defaultMode) || rois[0];
  const results = materials.map((material) => {
    const qty = material.dropRate * quantity;
    return { material, quantity: qty, totalValue: qty * material.processedPrice };
  });

  if (loading) return <SalvageLoadingState tier={meta.pageTier} />;

  return (
    <SalvageGearPageLayout
      tier={meta.pageTier}
      note={t(meta.noteKey, '')}
      titleFallback={gearName || meta.wikiEn}
      description={t(meta.descKey, meta.descFallback)}
      wikiUrl={wikiUrl}
      wikiFallback={`https://wiki.guildwars2.com/wiki/${meta.wikiEn.replace(/ /g, '_')}`}
      gearName={gearName}
      kitName={kitName}
      kitTitleFallback={meta.kitFallback}
      kitDescription={t(meta.kitDescKey, 'Recommended kit')}
      profitabilityLabel={t(meta.profitLabelKey, meta.profitLabelFallback)}
      profitabilityClassName={meta.profitClass}
      quantityLabel={t(meta.qtyKey, 'Quantity')}
      costGearLabel={t(meta.costKey, 'Buy gear ×{quantity}')}
      kitCost={kitCost}
      quantity={quantity}
      onQuantityChange={setQuantity}
      onRefreshPrices={fetchPrices}
      lastUpdated={lastUpdated}
      totalMaterialsValue={active?.income || 0}
      totalCost={quantity * gearBuy}
      totalKitCost={quantity * kitCost}
      totalProfit={active?.profit || 0}
      unidentifiedGearPrice={gearBuy || null}
      results={results}
      rois={rois}
      luckMode={active?.mode || 'none'}
      onLuckModeChange={setLuckMode}
    />
  );
}
