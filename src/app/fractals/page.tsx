'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import Navigation from '@/components/layout/Navigation';
import { Package, Search } from 'lucide-react';
import Image from 'next/image';
import { usePageTitle } from '@/hooks/usePageTitle';

interface FarmingItem {
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
}

interface GW2Item {
  id: number;
  name: string;
  icon: string;
}

interface GW2Price {
  id: number;
  sells?: {
    unit_price: number;
  };
  buys?: {
    unit_price: number;
  };
}

export default function FarmingTrackerPage() {
  usePageTitle('pageTitles.fractals', 'Fractal Chest Analysis');
  const { t, lang } = useI18n();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('difference');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [itemDetails, setItemDetails] = useState<Record<number, { icon: string; currentPrice: number; buyPrice: number; name: string }>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeSection, setActiveSection] = useState<'T1' | 'T2' | 'T3' | 'T4' | 'fractal-encryptions'>('T1');

  // Constantes para el cálculo de trofeos
  const ENCRYPTION_DATA = {
    seliciZanar: { opened: 1000000, trophyRate: 1.285333 },
    vortus: { opened: 1000000, trophyRate: 1.286211 },
    shinymeta: { opened: 100000, trophyRate: 1.28752 }
  };

  // Función para calcular trofeos
  const calculateTrophies = (encryptionsOpened: number, trophyRate: number): number => {
    return Math.floor(encryptionsOpened * trophyRate);
  };

  // Cálculos de trofeos  
  const trophyCalculations = {
    seliciZanar: calculateTrophies(ENCRYPTION_DATA.seliciZanar.opened, ENCRYPTION_DATA.seliciZanar.trophyRate),
    vortus: calculateTrophies(ENCRYPTION_DATA.vortus.opened, ENCRYPTION_DATA.vortus.trophyRate),
    shinymeta: calculateTrophies(ENCRYPTION_DATA.shinymeta.opened, ENCRYPTION_DATA.shinymeta.trophyRate)
  };

  const totalTrophies = trophyCalculations.seliciZanar + trophyCalculations.vortus + trophyCalculations.shinymeta;



  // Calcular porcentaje total: suma de trofeos reales / total encryptions abiertos
  const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
  const totalPercentage = ((totalTrophies / totalEncryptions) * 100).toFixed(2);

  // Calcular porcentajes totales para cada item
  const manuscriptTotalPercentage = ((600296 / totalEncryptions) * 100).toFixed(2);
  const proofTotalPercentage = ((899638 / totalEncryptions) * 100).toFixed(2);
  const treatiseTotalPercentage = ((600311 / totalEncryptions) * 100).toFixed(2);
  const postulateTotalPercentage = ((600051 / totalEncryptions) * 100).toFixed(2);




  const farmingData: FarmingItem[] = useMemo(() => [
    // Fractales
    { id: 69862, name: 'Pristine Fractal Relic', beforeCount: 23547, afterCount: 25797, difference: 2250, category: 'fractals', icon: '', currentPrice: 0 },
    { id: 73248, name: 'Stabilizing Matrix', beforeCount: 20550, afterCount: 22528, difference: 1978, valueEach: 3898, valueTotal: 7710244, category: 'fractals' },
    { id: 70438, name: 'Fractal Encryption Key', beforeCount: 413, afterCount: 3122, difference: 2709, category: 'fractals' },
    { id: 49426, name: '+3 Agony Infusion', beforeCount: 68, afterCount: 175, difference: 107, valueEach: 869, valueTotal: 92983, category: 'fractals' },
    { id: 49429, name: '+6 Agony Infusion', beforeCount: 24, afterCount: 56, difference: 32, valueEach: 7879, valueTotal: 252128, category: 'fractals' },
    { id: 49432, name: '+9 Agony Infusion', beforeCount: 1167, afterCount: 1184, difference: 17, valueEach: 58985, valueTotal: 1002745, category: 'fractals' },
    { id: 49424, name: '+1 Agony Infusion', beforeCount: 558, afterCount: 7308, difference: 6750, valueEach: 47, valueTotal: 317250, category: 'fractals' },
    
    // Materiales de alto valor
    { id: 19976, name: 'Mystic Coin', beforeCount: 28822, afterCount: 29073, difference: 251, valueEach: 21241, valueTotal: 5331491, category: 'materials' },
    { id: 19721, name: 'Glob of Ectoplasm', beforeCount: 9964, afterCount: 10417, difference: 453, valueEach: 3608, valueTotal: 1634424, category: 'materials' },
    { id: 46738, name: 'Deldrimor Steel Ingot', beforeCount: 305, afterCount: 361, difference: 56, valueEach: 41899, valueTotal: 2346344, category: 'materials' },
    { id: 46739, name: 'Elonian Leather Square', beforeCount: 189, afterCount: 242, difference: 53, valueEach: 24699, valueTotal: 1309047, category: 'materials' },
    { id: 46741, name: 'Bolt of Damask', beforeCount: 178, afterCount: 250, difference: 72, valueEach: 12500, valueTotal: 900000, category: 'materials' },
    { id: 73034, name: 'Vial of Linseed Oil', beforeCount: 176, afterCount: 228, difference: 52, valueEach: 4616, valueTotal: 240032, category: 'materials' },
    
    // Materiales T5
    { id: 24294, name: 'Vial of Powerful Blood', beforeCount: 0, afterCount: 339475, difference: 339475, category: 't5-materials' },
    { id: 24341, name: 'Large Bone', beforeCount: 0, afterCount: 0, difference: 0, category: 't5-materials' },
    { id: 24350, name: 'Large Claw', beforeCount: 0, afterCount: 0, difference: 0, category: 't5-materials' },
    { id: 24288, name: 'Large Scale', beforeCount: 0, afterCount: 0, difference: 0, category: 't5-materials' },
    { id: 24356, name: 'Large Fang', beforeCount: 0, afterCount: 0, difference: 0, category: 't5-materials' },
    { id: 24299, name: 'Large Totem', beforeCount: 0, afterCount: 0, difference: 0, category: 't5-materials' },
    { id: 24282, name: 'Large Venom Sac', beforeCount: 0, afterCount: 0, difference: 0, category: 't5-materials' },
    { id: 24276, name: 'Pile of Crystalline Dust', beforeCount: 0, afterCount: 0, difference: 0, category: 't5-materials' },
    
    // Items de fractales
    { id: 71315, name: 'Prototype Alchemical Precipitate', beforeCount: 0, afterCount: 374, difference: 374, category: 'fractal-items' },
    { id: 72796, name: 'Beta Alchemical Precipitate', beforeCount: 0, afterCount: 112, difference: 112, category: 'fractal-items' },
    { id: 73398, name: 'Refined Alchemical Precipitate', beforeCount: 0, afterCount: 54, difference: 54, category: 'fractal-items' },
    { id: 71428, name: 'Resonating Sliver', beforeCount: 1510, afterCount: 10510, difference: 9000, valueEach: 5, valueTotal: 45000, category: 'fractal-items' },
    
    // Equipamiento de fractales
    { id: 70638, name: 'Gold Fractal Warhorn', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-gear' },
    { id: 70785, name: 'Gold Fractal Staff', beforeCount: 0, afterCount: 4, difference: 4, category: 'fractal-gear' },
    { id: 71164, name: 'Gold Fractal Rifle', beforeCount: 0, afterCount: 9, difference: 9, category: 'fractal-gear' },
    { id: 71232, name: 'Gold Fractal Focus', beforeCount: 0, afterCount: 3, difference: 3, category: 'fractal-gear' },
    { id: 71670, name: 'Gold Fractal Hammer', beforeCount: 0, afterCount: 3, difference: 3, category: 'fractal-gear' },
    { id: 72165, name: 'Gold Fractal Short Bow', beforeCount: 0, afterCount: 4, difference: 4, category: 'fractal-gear' },
    { id: 72542, name: 'Gold Fractal Shield', beforeCount: 0, afterCount: 2, difference: 2, category: 'fractal-gear' },
    { id: 73091, name: 'Gold Fractal Greatsword', beforeCount: 0, afterCount: 5, difference: 5, category: 'fractal-gear' },
    { id: 73269, name: 'Gold Fractal Longbow', beforeCount: 0, afterCount: 3, difference: 3, category: 'fractal-gear' },
    { id: 74760, name: 'Gold Fractal Speargun', beforeCount: 0, afterCount: 2, difference: 2, category: 'fractal-gear' },
    { id: 74862, name: 'Gold Fractal Pistol', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-gear' },
    { id: 75830, name: 'Gold Fractal Harpoon', beforeCount: 2, afterCount: 3, difference: 1, category: 'fractal-gear' },
    { id: 76257, name: 'Gold Fractal Sword', beforeCount: 0, afterCount: 2, difference: 2, category: 'fractal-gear' },
    { id: 76598, name: 'Gold Fractal Scepter', beforeCount: 0, afterCount: 3, difference: 3, category: 'fractal-gear' },
    { id: 76974, name: 'Gold Fractal Torch', beforeCount: 0, afterCount: 8, difference: 8, category: 'fractal-gear' },
    { id: 77196, name: 'Gold Fractal Trident', beforeCount: 0, afterCount: 4, difference: 4, category: 'fractal-gear' },
    
    // Pociónes y herramientas
    { id: 71659, name: 'Large Mist Offensive Potion', beforeCount: 3, afterCount: 43, difference: 40, category: 'consumables' },
    { id: 73070, name: 'Mist Offensive Potion', beforeCount: 0, afterCount: 85, difference: 85, category: 'consumables' },
    { id: 74185, name: 'Mist Mobility Potion', beforeCount: 0, afterCount: 76, difference: 76, category: 'consumables' },
    { id: 75427, name: 'Large Mist Mobility Potion', beforeCount: 0, afterCount: 41, difference: 41, category: 'consumables' },
    { id: 74426, name: 'Mist Defensive Potion', beforeCount: 0, afterCount: 91, difference: 91, category: 'consumables' },
    { id: 76150, name: 'Large Mist Defensive Potion', beforeCount: 0, afterCount: 37, difference: 37, category: 'consumables' },
    { id: 73481, name: 'Ascended Salvage Kit', beforeCount: 1, afterCount: 10, difference: 9, category: 'tools' },
    { id: 79105, name: 'Ascended Salvage Kit', beforeCount: 0, afterCount: 22, difference: 22, category: 'tools' },
    { id: 75284, name: 'Ascended Salvage Tool', beforeCount: 2, afterCount: 210, difference: 208, category: 'tools' },
       
    // Otros items
    { id: 20323, name: 'Unidentified Dye', beforeCount: 537, afterCount: 685, difference: 148, valueEach: 464, valueTotal: 68672, category: 'other' },
    { id: 68325, name: 'Chest of Black Lion Goods', beforeCount: 111, afterCount: 287, difference: 176, category: 'other' },
    { id: 72936, name: 'Golden Fractal Relic', beforeCount: 170, afterCount: 193, difference: 23, category: 'other' },
    
    // Items adicionales del CSV
    { id: 39224, name: 'Durmand\'s Pen', beforeCount: 0, afterCount: 3, difference: 3, category: 'other' },
    { id: 39225, name: 'Golden Relic of Rin', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 39228, name: 'Halfmad\'s Mug', beforeCount: 1, afterCount: 7, difference: 6, category: 'other' },
    { id: 39227, name: 'Appleseller\'s Lucky Cog', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 39229, name: 'Marriner\'s Flask', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 39231, name: 'Fierceshot\'s Arrowhead', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 39232, name: 'Magister\'s Field Journal', beforeCount: 7, afterCount: 15, difference: 8, category: 'other' },
    { id: 39233, name: 'Althea\'s Ashes', beforeCount: 7, afterCount: 10, difference: 3, category: 'other' },
    { id: 39234, name: 'Plague Idol', beforeCount: 2, afterCount: 5, difference: 3, category: 'other' },
    { id: 39235, name: 'Matriarch\'s Quill', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 39236, name: 'Zinn\'s Data Crystal', beforeCount: 2, afterCount: 5, difference: 3, category: 'other' },
    { id: 39237, name: 'Experiment ZX-27115', beforeCount: 2, afterCount: 3, difference: 1, category: 'other' },
    { id: 39238, name: 'Imperial Chef Yileng\'s Golden Spoon', beforeCount: 1, afterCount: 5, difference: 4, category: 'other' },
    { id: 39239, name: 'Gargoyle Skull', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 39243, name: 'Ancient Mursaat Token', beforeCount: 1, afterCount: 3, difference: 2, category: 'other' },
    { id: 39546, name: 'Preserved Red Iris Flower', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 39547, name: 'Kurzick Bauble', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 39550, name: 'Warmaster\'s Family Heirloom', beforeCount: 0, afterCount: 3, difference: 3, category: 'other' },
    { id: 39551, name: 'Totem of the Gorilla', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 39554, name: 'Fledgling Charm', beforeCount: 1, afterCount: 9, difference: 8, category: 'other' },
    { id: 39555, name: 'Anton\'s Secret', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 3925, name: 'Passiflora Karkinata', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 39559, name: 'Ancient Karka Carapace', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 39562, name: 'Molten Ore', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 39563, name: 'Big Mama\'s Tooth', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 43766, name: 'Tome of Knowledge', beforeCount: 11293, afterCount: 11508, difference: 215, category: 'other' },
    
    // Weapon Chests
    { id: 45182, name: 'Occam\'s Weapon Chest', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 45183, name: 'Grizzlemouth\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45184, name: 'Mathilde\'s Weapon Chest', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 45185, name: 'Theodosus\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45186, name: 'Hronk\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45188, name: 'Stonecleaver\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45189, name: 'Zojja\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45190, name: 'Chorben\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45191, name: 'Coalforge\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45192, name: 'Soros\'s Weapon Chest', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 45193, name: 'Leftpaw\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45194, name: 'Angchu Weapon Chest', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 45195, name: 'Beigarth\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45196, name: 'Zintl Weapon Chest', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 45197, name: 'Tonn\'s Weapon Chest', beforeCount: 0, afterCount: 3, difference: 3, category: 'other' },
    
    // Infused Rings
    { id: 49277, name: 'Endless Fractal Tonic', beforeCount: 1, afterCount: 2, difference: 1, category: 'other' },
    { id: 49394, name: 'Royal Signet of Doric (Infused)', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 49395, name: 'Lost Seal of Usoku (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49398, name: 'Rurik\'s Royal Signet Ring (Infused)', beforeCount: 1, afterCount: 6, difference: 5, category: 'other' },
    { id: 49399, name: 'Adelbern\'s Royal Signet Ring (Infused)', beforeCount: 0, afterCount: 3, difference: 3, category: 'other' },
    { id: 49400, name: 'Ouroboros Loop (Infused)', beforeCount: 0, afterCount: 9, difference: 9, category: 'other' },
    { id: 49401, name: 'Khilbron\'s Phylactery (Infused)', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 49402, name: 'Crystalline Band (Infused)', beforeCount: 2, afterCount: 4, difference: 2, category: 'other' },
    { id: 49403, name: 'Ring of Red Death (Infused)', beforeCount: 4, afterCount: 7, difference: 3, category: 'other' },
    { id: 49404, name: 'Vassar\'s Band (Infused)', beforeCount: 0, afterCount: 7, difference: 7, category: 'other' },
    { id: 49405, name: 'Ralena\'s Band (Infused)', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 49406, name: 'Vine of the Pale Tree (Infused)', beforeCount: 0, afterCount: 3, difference: 3, category: 'other' },
    { id: 49407, name: 'Bagh Nakh (Infused)', beforeCount: 0, afterCount: 6, difference: 6, category: 'other' },
    { id: 49408, name: 'Mellaggan\'s Whorl (Infused)', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 49409, name: 'Seal of the Khan-Ur (Infused)', beforeCount: 0, afterCount: 6, difference: 6, category: 'other' },
    { id: 49412, name: 'Lunaria, Circle of the Moon (Infused)', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 49413, name: 'Solaria, Circle of the Sun (Infused)', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 49414, name: 'Druid\'s Circle (Infused)', beforeCount: 0, afterCount: 3, difference: 3, category: 'other' },
    { id: 49415, name: 'Healing Signet (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49416, name: 'Ettinband (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49417, name: 'Ossa Family Signet Ring (Infused)', beforeCount: 0, afterCount: 6, difference: 6, category: 'other' },
    { id: 49418, name: 'Barbed Signet (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49419, name: 'Palawa Joko\'s Finger Cuff (Infused)', beforeCount: 1, afterCount: 6, difference: 5, category: 'other' },
    { id: 49420, name: 'Lucce Seal (Infused)', beforeCount: 0, afterCount: 3, difference: 3, category: 'other' },
    { id: 49421, name: 'Purge Signet (Infused)', beforeCount: 0, afterCount: 6, difference: 6, category: 'other' },
    { id: 49422, name: 'Band of the Brotherhood (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49423, name: 'Cirque of Arah (Infused)', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    
    // Armor Chests
    { id: 64164, name: 'Malicious Chest of Leggings', beforeCount: 9, afterCount: 11, difference: 2, category: 'other' },
    { id: 64165, name: 'Healer\'s Chest of Leggings', beforeCount: 5, afterCount: 6, difference: 1, category: 'other' },
    { id: 64166, name: 'Defender\'s Chest of Shoulders', beforeCount: 16, afterCount: 18, difference: 2, category: 'other' },
    { id: 64167, name: 'Healer\'s Chest of Coats', beforeCount: 3, afterCount: 4, difference: 1, category: 'other' },
    { id: 64168, name: 'Defender\'s Chest of Leggings', beforeCount: 12, afterCount: 15, difference: 3, category: 'other' },
    { id: 64169, name: 'Assaulter\'s Chest of Leggings', beforeCount: 5, afterCount: 9, difference: 4, category: 'other' },
    { id: 64170, name: 'Healer\'s Chest of Gloves', beforeCount: 7, afterCount: 10, difference: 3, category: 'other' },
    { id: 64171, name: 'Malicious Chest of Gloves', beforeCount: 10, afterCount: 14, difference: 4, category: 'other' },
    { id: 64172, name: 'Assaulter\'s Chest of Gloves', beforeCount: 14, afterCount: 16, difference: 2, category: 'other' },
    { id: 64173, name: 'Defender\'s Chest of Gloves', beforeCount: 21, afterCount: 22, difference: 1, category: 'other' },
    { id: 64174, name: 'Defender\'s Chest of Boots', beforeCount: 15, afterCount: 17, difference: 2, category: 'other' },
    { id: 64175, name: 'Assaulter\'s Chest of Boots', beforeCount: 8, afterCount: 10, difference: 2, category: 'other' },
    { id: 64176, name: 'Malicious Chest of Boots', beforeCount: 11, afterCount: 14, difference: 3, category: 'other' },
    { id: 64177, name: 'Assaulter\'s Chest of Shoulders', beforeCount: 6, afterCount: 7, difference: 1, category: 'other' },
    { id: 64178, name: 'Healer\'s Chest of Boots', beforeCount: 8, afterCount: 13, difference: 5, category: 'other' },
    { id: 64179, name: 'Malicious Chest of Coats', beforeCount: 6, afterCount: 10, difference: 4, category: 'other' },
    { id: 64180, name: 'Assaulter\'s Chest of Helms', beforeCount: 8, afterCount: 9, difference: 1, category: 'other' },
    { id: 64181, name: 'Defender\'s Chest of Helms', beforeCount: 8, afterCount: 10, difference: 2, category: 'other' },
    { id: 64183, name: 'Malicious Chest of Helms', beforeCount: 8, afterCount: 12, difference: 4, category: 'other' },
    { id: 64184, name: 'Healer\'s Chest of Shoulders', beforeCount: 18, afterCount: 19, difference: 1, category: 'other' },
    { id: 64185, name: 'Malicious Chest of Shoulders', beforeCount: 11, afterCount: 13, difference: 2, category: 'other' },
    { id: 64186, name: 'Assaulter\'s Chest of Coats', beforeCount: 12, afterCount: 15, difference: 3, category: 'other' },
    { id: 64187, name: 'Defender\'s Chest of Coats', beforeCount: 4, afterCount: 7, difference: 3, category: 'other' },
    ], []);

  // Datos específicos para cada cofre de fractales
  const dungeonChestData: FarmingItem[] = useMemo(() => [
   
    { id: 69862, name: 'Pristine Fractal Relic', beforeCount: 30431, afterCount: 32681, difference: 2250, category: 'fractal-relics' },
    { id: 73248, name: 'Stabilizing Matrix', beforeCount: 30036, afterCount: 32112, difference: 2076, category: 'fractal-materials' },
    { id: 49424, name: '+1 Agony Infusion', beforeCount: 12636, afterCount: 17136, difference: 4500, category: 'fractal-materials' },
    { id: 71428, name: 'Resonating Sliver', beforeCount: 2830, afterCount: 5080, difference: 2250, category: 'fractal-items' },
    { id: 70438, name: 'Fractal Encryption Key', beforeCount: 612, afterCount: 3271, difference: 2659, category: 'fractal-materials' },
    
    // Anillos infundidos del CSV expanded_gad.7365.csv
    { id: 37074, name: 'Khilbron\'s Phylactery', beforeCount: 0, afterCount: 6, difference: 6, category: 'infused-rings' },
    { id: 37075, name: 'Crystalline Band', beforeCount: 2, afterCount: 13, difference: 11, category: 'infused-rings' },
    { id: 37076, name: 'Royal Signet of Doric', beforeCount: 0, afterCount: 5, difference: 5, category: 'infused-rings' },
    { id: 37077, name: 'Ralena\'s Band', beforeCount: 0, afterCount: 13, difference: 13, category: 'infused-rings' },
    { id: 37078, name: 'Lunaria, Circle of the Moon', beforeCount: 0, afterCount: 7, difference: 7, category: 'infused-rings' },
    { id: 37079, name: 'Adelbern\'s Royal Signet Ring', beforeCount: 0, afterCount: 5, difference: 5, category: 'infused-rings' },
    { id: 37080, name: 'Vine of the Pale Tree', beforeCount: 1, afterCount: 16, difference: 15, category: 'infused-rings' },
    { id: 37082, name: 'Mellaggan\'s Whorl', beforeCount: 0, afterCount: 7, difference: 7, category: 'infused-rings' },
    { id: 37085, name: 'Ouroboros Loop', beforeCount: 0, afterCount: 4, difference: 4, category: 'infused-rings' },
    { id: 37086, name: 'Ring of Red Death', beforeCount: 2, afterCount: 10, difference: 8, category: 'infused-rings' },
    { id: 37087, name: 'Vassar\'s Band', beforeCount: 0, afterCount: 7, difference: 7, category: 'infused-rings' },
    { id: 37088, name: 'Solaria, Circle of the Sun', beforeCount: 0, afterCount: 6, difference: 6, category: 'infused-rings' },
    { id: 37089, name: 'Lost Seal of Usoku', beforeCount: 0, afterCount: 7, difference: 7, category: 'infused-rings' },
    { id: 37090, name: 'Rurik\'s Royal Signet Ring', beforeCount: 0, afterCount: 5, difference: 5, category: 'infused-rings' },
    { id: 37091, name: 'Seal of the Khan-Ur', beforeCount: 0, afterCount: 5, difference: 5, category: 'infused-rings' },
    { id: 37092, name: 'Bagh Nakh', beforeCount: 1, afterCount: 5, difference: 4, category: 'infused-rings' },
    { id: 39596, name: 'Druid\'s Circle', beforeCount: 0, afterCount: 3, difference: 3, category: 'infused-rings' },
    { id: 39597, name: 'Healing Signet', beforeCount: 0, afterCount: 6, difference: 6, category: 'infused-rings' },
    { id: 39600, name: 'Ettinband', beforeCount: 0, afterCount: 3, difference: 3, category: 'infused-rings' },
    { id: 39601, name: 'Ossa Family Signet Ring', beforeCount: 1, afterCount: 17, difference: 16, category: 'infused-rings' },
    { id: 39604, name: 'Barbed Signet', beforeCount: 0, afterCount: 4, difference: 4, category: 'infused-rings' },
    { id: 39605, name: 'Palawa Joko\'s Finger Cuff', beforeCount: 1, afterCount: 5, difference: 4, category: 'infused-rings' },
    { id: 39608, name: 'Lucce Seal', beforeCount: 0, afterCount: 4, difference: 4, category: 'infused-rings' },
    { id: 39609, name: 'Purge Signet', beforeCount: 0, afterCount: 7, difference: 7, category: 'infused-rings' },
    { id: 39612, name: 'Band of the Brotherhood', beforeCount: 0, afterCount: 8, difference: 8, category: 'infused-rings' },
    { id: 39613, name: 'Cirque of Arah', beforeCount: 0, afterCount: 2, difference: 2, category: 'infused-rings' },
    
    // Otros items
    { id: 43766, name: 'Tome of Knowledge', beforeCount: 11887, afterCount: 11934, difference: 47, category: 'consumables' },
    { id: 64176, name: 'Malicious Chest of Boots', beforeCount: 16, afterCount: 17, difference: 1, category: 'armor-chests' },
    { id: 64185, name: 'Malicious Chest of Shoulders', beforeCount: 16, afterCount: 17, difference: 1, category: 'armor-chests' },
  ], []);

  const raidChestData: FarmingItem[] = useMemo(() => [
    // Datos para Cofre de Avezado de los Fractales (T2) - Datos reales del CSV    
    // Cofre principal y base para cálculos
    { id: 69862, name: 'Pristine Fractal Relic', beforeCount: 28169, afterCount: 30419, difference: 2250, category: 'fractal-relics' },
    
    // Materiales de fractales - cantidades reales del CSV
    { id: 73248, name: 'Stabilizing Matrix', beforeCount: 26846, afterCount: 28809, difference: 1963, category: 'fractal-materials' },
    { id: 70438, name: 'Fractal Encryption Key', beforeCount: 616, afterCount: 3332, difference: 2716, category: 'fractal-materials' },
    { id: 49424, name: '+1 Agony Infusion', beforeCount: 8028, afterCount: 12528, difference: 4500, category: 'fractal-materials' },
    { id: 49426, name: '+3 Agony Infusion', beforeCount: 200, afterCount: 234, difference: 34, category: 'fractal-materials' },
    { id: 49429, name: '+6 Agony Infusion', beforeCount: 69, afterCount: 87, difference: 18, category: 'fractal-materials' },
    { id: 71428, name: 'Resonating Sliver', beforeCount: 2830, afterCount: 7330, difference: 4500, category: 'fractal-items' },
    
    // Materiales de alto valor - cantidades reales del CSV
    { id: 19976, name: 'Mystic Coin', beforeCount: 29222, afterCount: 29279, difference: 57, category: 'materials' },
    { id: 19721, name: 'Glob of Ectoplasm', beforeCount: 103, afterCount: 189, difference: 86, category: 'materials' },
    { id: 46738, name: 'Deldrimor Steel Ingot', beforeCount: 388, afterCount: 396, difference: 8, category: 'materials' },
    { id: 46739, name: 'Elonian Leather Square', beforeCount: 262, afterCount: 268, difference: 6, category: 'materials' },
    { id: 46741, name: 'Bolt of Damask', beforeCount: 273, afterCount: 279, difference: 6, category: 'materials' },
    { id: 73034, name: 'Vial of Linseed Oil', beforeCount: 261, afterCount: 272, difference: 11, category: 'materials' },
    
    // Anillos infundidos - cantidades reales del CSV
    { id: 37074, name: 'Khilbron\'s Phylactery', beforeCount: 0, afterCount: 6, difference: 6, category: 'infused-rings' },
    { id: 37075, name: 'Crystalline Band', beforeCount: 2, afterCount: 7, difference: 5, category: 'infused-rings' },
    { id: 37076, name: 'Royal Signet of Doric', beforeCount: 0, afterCount: 1, difference: 1, category: 'infused-rings' },
    { id: 37077, name: 'Ralena\'s Band', beforeCount: 0, afterCount: 4, difference: 4, category: 'infused-rings' },
    { id: 37078, name: 'Lunaria, Circle of the Moon', beforeCount: 0, afterCount: 3, difference: 3, category: 'infused-rings' },
    { id: 37079, name: 'Adelbern\'s Royal Signet Ring', beforeCount: 0, afterCount: 2, difference: 2, category: 'infused-rings' },
    { id: 37080, name: 'Vine of the Pale Tree', beforeCount: 1, afterCount: 4, difference: 3, category: 'infused-rings' },
    { id: 37082, name: 'Mellaggan\'s Whorl', beforeCount: 0, afterCount: 6, difference: 6, category: 'infused-rings' },
    { id: 37085, name: 'Ouroboros Loop', beforeCount: 0, afterCount: 2, difference: 2, category: 'infused-rings' },
    { id: 37086, name: 'Ring of Red Death', beforeCount: 2, afterCount: 9, difference: 7, category: 'infused-rings' },
    { id: 37087, name: 'Vassar\'s Band', beforeCount: 0, afterCount: 4, difference: 4, category: 'infused-rings' },
    { id: 37088, name: 'Solaria, Circle of the Moon', beforeCount: 0, afterCount: 4, difference: 4, category: 'infused-rings' },
    { id: 37089, name: 'Lost Seal of Usoku', beforeCount: 0, afterCount: 4, difference: 4, category: 'infused-rings' },
    { id: 37090, name: 'Rurik\'s Royal Signet Ring', beforeCount: 0, afterCount: 5, difference: 5, category: 'infused-rings' },
    { id: 37091, name: 'Seal of the Khan-Ur', beforeCount: 0, afterCount: 4, difference: 4, category: 'infused-rings' },
    { id: 37092, name: 'Bagh Nakh', beforeCount: 1, afterCount: 4, difference: 3, category: 'infused-rings' },
    { id: 39596, name: 'Druid\'s Circle', beforeCount: 0, afterCount: 3, difference: 3, category: 'infused-rings' },
    { id: 39597, name: 'Healing Signet', beforeCount: 0, afterCount: 5, difference: 5, category: 'infused-rings' },
    { id: 39600, name: 'Ettinband', beforeCount: 0, afterCount: 5, difference: 5, category: 'infused-rings' },
    { id: 39601, name: 'Ossa Family Signet Ring', beforeCount: 1, afterCount: 5, difference: 4, category: 'infused-rings' },
    { id: 39604, name: 'Barbed Signet', beforeCount: 0, afterCount: 5, difference: 5, category: 'infused-rings' },
    { id: 39605, name: 'Palawa Joko\'s Finger Cuff', beforeCount: 1, afterCount: 4, difference: 3, category: 'infused-rings' },
    { id: 39608, name: 'Lucce Seal', beforeCount: 0, afterCount: 8, difference: 8, category: 'infused-rings' },
    { id: 39609, name: 'Purge Signet', beforeCount: 0, afterCount: 7, difference: 7, category: 'infused-rings' },
    { id: 39612, name: 'Band of the Brotherhood', beforeCount: 0, afterCount: 8, difference: 8, category: 'infused-rings' },
    { id: 39613, name: 'Cirque of Arah', beforeCount: 0, afterCount: 5, difference: 5, category: 'infused-rings' },
    
    // Otros items - cantidades reales del CSV
    { id: 43766, name: 'Tome of Knowledge', beforeCount: 11771, afterCount: 11887, difference: 116, category: 'consumables' },
    
    // Weapon Chests - cantidades reales del CSV
    { id: 45182, name: 'Occam\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45185, name: 'Theodosus\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45187, name: 'Ebonmane\'s Weapon Chest', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 45188, name: 'Stonecleaver\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45189, name: 'Zojja\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45193, name: 'Leftpaw\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45194, name: 'Angchu Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45195, name: 'Beigarth\'s Weapon Chest', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    
    // Fractal Weapons - cantidades reales del CSV
    { id: 49257, name: 'Fractal Axe', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-weapons' },
    { id: 49258, name: 'Fractal Longbow', beforeCount: 0, afterCount: 2, difference: 2, category: 'fractal-weapons' },
    { id: 49259, name: 'Fractal Short Bow', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-weapons' },
    { id: 49260, name: 'Fractal Dagger', beforeCount: 0, afterCount: 2, difference: 2, category: 'fractal-weapons' },
    { id: 49261, name: 'Fractal Focus', beforeCount: 0, afterCount: 2, difference: 2, category: 'fractal-weapons' },
    { id: 49262, name: 'Fractal Greatsword', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-weapons' },
    { id: 49263, name: 'Fractal Hammer', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-weapons' },
    { id: 49264, name: 'Fractal Mace', beforeCount: 0, afterCount: 2, difference: 2, category: 'fractal-weapons' },
    { id: 49265, name: 'Fractal Pistol', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-weapons' },
    { id: 49267, name: 'Fractal Scepter', beforeCount: 0, afterCount: 2, difference: 2, category: 'fractal-weapons' },
    { id: 49268, name: 'Fractal Shield', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-weapons' },
    { id: 49269, name: 'Fractal Harpoon', beforeCount: 0, afterCount: 3, difference: 3, category: 'fractal-weapons' },
    { id: 49270, name: 'Fractal Speargun', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-weapons' },
    { id: 49272, name: 'Fractal Sword', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-weapons' },
    { id: 49273, name: 'Fractal Torch', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-weapons' },
    { id: 49274, name: 'Fractal Trident', beforeCount: 0, afterCount: 3, difference: 3, category: 'fractal-weapons' },
    { id: 49275, name: 'Fractal Warhorn', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-weapons' },
    
    // Anillos infundidos (versión avanzada) - cantidades reales del CSV
    { id: 49394, name: 'Royal Signet of Doric (Infused)', beforeCount: 0, afterCount: 8, difference: 8, category: 'other' },
    { id: 49395, name: 'Lost Seal of Usoku (Infused)', beforeCount: 0, afterCount: 3, difference: 3, category: 'other' },
    { id: 49398, name: 'Rurik\'s Royal Signet Ring (Infused)', beforeCount: 1, afterCount: 4, difference: 3, category: 'other' },
    { id: 49399, name: 'Adelbern\'s Royal Signet Ring (Infused)', beforeCount: 0, afterCount: 7, difference: 7, category: 'other' },
    { id: 49400, name: 'Ouroboros Loop (Infused)', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 49401, name: 'Khilbron\'s Phylactery (Infused)', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 49402, name: 'Crystalline Band (Infused)', beforeCount: 2, afterCount: 8, difference: 6, category: 'other' },
    { id: 49403, name: 'Ring of Red Death (Infused)', beforeCount: 4, afterCount: 7, difference: 3, category: 'other' },
    { id: 49404, name: 'Vassar\'s Band (Infused)', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 49405, name: 'Ralena\'s Band (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49406, name: 'Vine of the Pale Tree (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49407, name: 'Bagh Nakh (Infused)', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 49408, name: 'Mellaggan\'s Whorl (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49409, name: 'Seal of the Khan-Ur (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49412, name: 'Lunaria, Circle of the Moon (Infused)', beforeCount: 0, afterCount: 3, difference: 3, category: 'other' },
    { id: 49413, name: 'Solaria, Circle of the Sun (Infused)', beforeCount: 0, afterCount: 6, difference: 6, category: 'other' },
    { id: 49414, name: 'Druid\'s Circle (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49415, name: 'Healing Signet (Infused)', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 49416, name: 'Ettinband (Infused)', beforeCount: 0, afterCount: 3, difference: 3, category: 'other' },
    { id: 49417, name: 'Ossa Family Signet Ring (Infused)', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 49418, name: 'Barbed Signet (Infused)', beforeCount: 0, afterCount: 7, difference: 7, category: 'other' },
    { id: 49419, name: 'Palawa Joko\'s Finger Cuff (Infused)', beforeCount: 1, afterCount: 8, difference: 7, category: 'other' },
    { id: 49420, name: 'Lucce Seal (Infused)', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 49421, name: 'Purge Signet (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49422, name: 'Band of the Brotherhood (Infused)', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 49423, name: 'Cirque of Arah (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    
    // Armor Chests - cantidades reales del CSV
    { id: 64164, name: 'Malicious Chest of Leggings', beforeCount: 11, afterCount: 12, difference: 1, category: 'other' },
    { id: 64165, name: 'Healer\'s Chest of Leggings', beforeCount: 7, afterCount: 8, difference: 1, category: 'other' },
    { id: 64166, name: 'Defender\'s Chest of Shoulders', beforeCount: 20, afterCount: 21, difference: 1, category: 'other' },
    { id: 64170, name: 'Healer\'s Chest of Gloves', beforeCount: 14, afterCount: 17, difference: 3, category: 'other' },
    { id: 64171, name: 'Malicious Chest of Gloves', beforeCount: 16, afterCount: 17, difference: 1, category: 'other' },
    { id: 64173, name: 'Defender\'s Chest of Gloves', beforeCount: 24, afterCount: 26, difference: 2, category: 'other' },
    { id: 64174, name: 'Defender\'s Chest of Boots', beforeCount: 17, afterCount: 18, difference: 1, category: 'other' },
    { id: 64175, name: 'Assaulter\'s Chest of Boots', beforeCount: 11, afterCount: 12, difference: 1, category: 'other' },
    { id: 64177, name: 'Assaulter\'s Chest of Shoulders', beforeCount: 8, afterCount: 11, difference: 3, category: 'other' },
    { id: 64182, name: 'Healer\'s Chest of Helms', beforeCount: 11, afterCount: 12, difference: 1, category: 'other' },
    { id: 64184, name: 'Healer\'s Chest of Shoulders', beforeCount: 20, afterCount: 24, difference: 4, category: 'other' },
    
    // Otros items - cantidades reales del CSV
    { id: 68325, name: 'Chest of Black Lion Goods', beforeCount: 351, afterCount: 384, difference: 33, category: 'other' },
    
    // Items de fractales - cantidades reales del CSV
    { id: 71315, name: 'Prototype Alchemical Precipitate', beforeCount: 0, afterCount: 351, difference: 351, category: 'fractal-items' },
    { id: 72796, name: 'Beta Alchemical Precipitate', beforeCount: 0, afterCount: 150, difference: 150, category: 'fractal-items' },
    
    // Potiones de Mist - cantidades reales del CSV
    { id: 73070, name: 'Mist Offensive Potion', beforeCount: 0, afterCount: 126, difference: 126, category: 'consumables' },
    { id: 74185, name: 'Mist Mobility Potion', beforeCount: 0, afterCount: 121, difference: 121, category: 'consumables' },
    { id: 74426, name: 'Mist Defensive Potion', beforeCount: 0, afterCount: 121, difference: 121, category: 'consumables' },
    
    // Herramientas - cantidades reales del CSV
    { id: 75284, name: 'Ascended Salvage Tool', beforeCount: 1, afterCount: 22, difference: 21, category: 'tools' },
  ], []);

  const strikeChestData: FarmingItem[] = useMemo(() => [
    // Datos para Cofre de Experto de los Fractales (T3) - Datos reales del CSV    
    // Cofre principal y base para cálculos
    { id: 69862, name: 'Pristine Fractal Relic', beforeCount: 25919, afterCount: 28169, difference: 2250, category: 'fractal-relics' },
    
    // Materiales de fractales - cantidades reales del CSV
    { id: 73248, name: 'Stabilizing Matrix', beforeCount: 23738, afterCount: 25789, difference: 2051, category: 'fractal-materials' },
    { id: 70438, name: 'Fractal Encryption Key', beforeCount: 429, afterCount: 3115, difference: 2686, category: 'fractal-materials' },
    { id: 49424, name: '+1 Agony Infusion', beforeCount: 1278, afterCount: 8028, difference: 6750, category: 'fractal-materials' },
    { id: 49426, name: '+3 Agony Infusion', beforeCount: 175, afterCount: 200, difference: 25, category: 'fractal-materials' },
    { id: 49429, name: '+6 Agony Infusion', beforeCount: 56, afterCount: 69, difference: 13, category: 'fractal-materials' },
    { id: 49432, name: '+9 Agony Infusion', beforeCount: 1212, afterCount: 1223, difference: 11, category: 'fractal-materials' },
    { id: 71428, name: 'Resonating Sliver', beforeCount: 2830, afterCount: 9580, difference: 6750, category: 'fractal-items' },
    
    // Materiales de alto valor - cantidades reales del CSV
    { id: 19976, name: 'Mystic Coin', beforeCount: 29092, afterCount: 29222, difference: 130, category: 'materials' },
    { id: 19721, name: 'Glob of Ectoplasm', beforeCount: 360, afterCount: 585, difference: 225, category: 'materials' },
    { id: 46738, name: 'Deldrimor Steel Ingot', beforeCount: 361, afterCount: 388, difference: 27, category: 'materials' },
    { id: 46739, name: 'Elonian Leather Square', beforeCount: 242, afterCount: 262, difference: 20, category: 'materials' },
    { id: 46741, name: 'Bolt of Damask', beforeCount: 250, afterCount: 273, difference: 23, category: 'materials' },
    { id: 73034, name: 'Vial of Linseed Oil', beforeCount: 228, afterCount: 261, difference: 33, category: 'materials' },
    
    // Items de fractales - cantidades reales del CSV
    { id: 71315, name: 'Prototype Alchemical Precipitate', beforeCount: 0, afterCount: 177, difference: 177, category: 'fractal-items' },
    { id: 72796, name: 'Beta Alchemical Precipitate', beforeCount: 0, afterCount: 82, difference: 82, category: 'fractal-items' },
    { id: 73398, name: 'Refined Alchemical Precipitate', beforeCount: 0, afterCount: 29, difference: 29, category: 'fractal-items' },
    
    // Equipamiento de fractales - cantidades reales del CSV
    { id: 73380, name: 'Gold Fractal Axe', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-gear' },
    { id: 71164, name: 'Gold Fractal Rifle', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-gear' },
    { id: 71232, name: 'Gold Fractal Focus', beforeCount: 0, afterCount: 2, difference: 2, category: 'fractal-gear' },
    { id: 71670, name: 'Gold Fractal Hammer', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-gear' },
    { id: 72165, name: 'Gold Fractal Short Bow', beforeCount: 0, afterCount: 2, difference: 2, category: 'fractal-gear' },
    { id: 76257, name: 'Gold Fractal Sword', beforeCount: 0, afterCount: 3, difference: 3, category: 'fractal-gear' },
    { id: 76598, name: 'Gold Fractal Scepter', beforeCount: 0, afterCount: 3, difference: 3, category: 'fractal-gear' },
    { id: 76974, name: 'Gold Fractal Torch', beforeCount: 0, afterCount: 2, difference: 2, category: 'fractal-gear' },
    { id: 77196, name: 'Gold Fractal Trident', beforeCount: 0, afterCount: 1, difference: 1, category: 'fractal-gear' },
    
    // Potiones de Mist - cantidades reales del CSV
    { id: 71659, name: 'Large Mist Offensive Potion', beforeCount: 3, afterCount: 20, difference: 17, category: 'consumables' },
    { id: 73070, name: 'Mist Offensive Potion', beforeCount: 0, afterCount: 36, difference: 36, category: 'consumables' },
    { id: 74185, name: 'Mist Mobility Potion', beforeCount: 0, afterCount: 48, difference: 48, category: 'consumables' },
    { id: 75427, name: 'Large Mist Mobility Potion', beforeCount: 0, afterCount: 20, difference: 20, category: 'consumables' },
    { id: 74426, name: 'Mist Defensive Potion', beforeCount: 0, afterCount: 59, difference: 59, category: 'consumables' },
    { id: 76150, name: 'Large Mist Defensive Potion', beforeCount: 0, afterCount: 23, difference: 23, category: 'consumables' },
    
    // Herramientas - cantidades reales del CSV
    { id: 73481, name: 'Ascended Salvage Kit', beforeCount: 9, afterCount: 11, difference: 2, category: 'tools' },
    { id: 79105, name: 'Ascended Salvage Kit', beforeCount: 24, afterCount: 38, difference: 14, category: 'tools' },
    { id: 75284, name: 'Ascended Salvage Tool', beforeCount: 1, afterCount: 115, difference: 114, category: 'tools' },
    
    // Otros items - cantidades reales del CSV
    { id: 20323, name: 'Unidentified Dye', beforeCount: 685, afterCount: 754, difference: 69, category: 'other' },
    { id: 68325, name: 'Chest of Black Lion Goods', beforeCount: 287, afterCount: 351, difference: 64, category: 'other' },
    { id: 72936, name: 'Golden Fractal Relic', beforeCount: 248, afterCount: 258, difference: 10, category: 'other' },
    
    // Items adicionales del CSV
    { id: 39228, name: 'Halfmad\'s Mug', beforeCount: 1, afterCount: 2, difference: 1, category: 'other' },
    { id: 39229, name: 'Appleseller\'s Lucky Cog', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 39230, name: 'Marriner\'s Flask', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 39232, name: 'Magister\'s Field Journal', beforeCount: 7, afterCount: 10, difference: 3, category: 'other' },
    { id: 39234, name: 'Plague Idol', beforeCount: 2, afterCount: 3, difference: 1, category: 'other' },
    { id: 39235, name: 'Matriarch\'s Quill', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 39237, name: 'Experiment ZX-27115', beforeCount: 2, afterCount: 3, difference: 1, category: 'other' },
    { id: 39238, name: 'Imperial Chef Yileng\'s Golden Spoon', beforeCount: 1, afterCount: 4, difference: 3, category: 'other' },
    { id: 39239, name: 'Gargoyle Skull', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 39243, name: 'Ancient Mursaat Token', beforeCount: 1, afterCount: 2, difference: 1, category: 'other' },
    { id: 39546, name: 'Preserved Red Iris Flower', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 39547, name: 'Kurzick Bauble', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 39550, name: 'Warmaster\'s Family Heirloom', beforeCount: 0, afterCount: 3, difference: 3, category: 'other' },
    { id: 39555, name: 'Anton\'s Secret', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 39558, name: 'Passiflora Karkinata', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 39559, name: 'Ancient Karka Carapace', beforeCount: 0, afterCount: 2, difference: 2, category: 'other' },
    { id: 39562, name: 'Molten Ore', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 39563, name: 'Big Mama\'s Tooth', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 43766, name: 'Tome of Knowledge', beforeCount: 11607, afterCount: 11771, difference: 164, category: 'consumables' },
    
    // Weapon Chests - cantidades reales del CSV
    { id: 45183, name: 'Grizzlemouth\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45185, name: 'Theodosus\'s Weapon Chest', beforeCount: 1, afterCount: 3, difference: 2, category: 'other' },
    { id: 45187, name: 'Ebonmane\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45191, name: 'Coalforge\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45195, name: 'Beigarth\'s Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 45196, name: 'Zintl Weapon Chest', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    
    // Anillos infundidos (versión avanzada) - cantidades reales del CSV
    { id: 49394, name: 'Royal Signet of Doric (Infused)', beforeCount: 0, afterCount: 7, difference: 7, category: 'other' },
    { id: 49395, name: 'Lost Seal of Usoku (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49398, name: 'Rurik\'s Royal Signet Ring (Infused)', beforeCount: 1, afterCount: 9, difference: 8, category: 'other' },
    { id: 49399, name: 'Adelbern\'s Royal Signet Ring (Infused)', beforeCount: 0, afterCount: 6, difference: 6, category: 'other' },
    { id: 49400, name: 'Ouroboros Loop (Infused)', beforeCount: 0, afterCount: 6, difference: 6, category: 'other' },
    { id: 49401, name: 'Khilbron\'s Phylactery (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49402, name: 'Crystalline Band (Infused)', beforeCount: 2, afterCount: 6, difference: 4, category: 'other' },
    { id: 49403, name: 'Ring of Red Death (Infused)', beforeCount: 4, afterCount: 9, difference: 5, category: 'other' },
    { id: 49404, name: 'Vassar\'s Band (Infused)', beforeCount: 0, afterCount: 6, difference: 6, category: 'other' },
    { id: 49405, name: 'Ralena\'s Band (Infused)', beforeCount: 0, afterCount: 7, difference: 7, category: 'other' },
    { id: 49406, name: 'Vine of the Pale Tree (Infused)', beforeCount: 0, afterCount: 7, difference: 7, category: 'other' },
    { id: 49407, name: 'Bagh Nakh (Infused)', beforeCount: 0, afterCount: 6, difference: 6, category: 'other' },
    { id: 49408, name: 'Mellaggan\'s Whorl (Infused)', beforeCount: 0, afterCount: 7, difference: 7, category: 'other' },
    { id: 49409, name: 'Seal of the Khan-Ur (Infused)', beforeCount: 0, afterCount: 6, difference: 6, category: 'other' },
    { id: 49412, name: 'Lunaria, Circle of the Moon (Infused)', beforeCount: 0, afterCount: 6, difference: 6, category: 'other' },
    { id: 49413, name: 'Solaria, Circle of the Sun (Infused)', beforeCount: 1, afterCount: 9, difference: 8, category: 'other' },
    { id: 49415, name: 'Healing Signet (Infused)', beforeCount: 0, afterCount: 7, difference: 7, category: 'other' },
    { id: 49416, name: 'Ettinband (Infused)', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 49417, name: 'Ossa Family Signet Ring (Infused)', beforeCount: 1, afterCount: 6, difference: 5, category: 'other' },
    { id: 49418, name: 'Barbed Signet (Infused)', beforeCount: 0, afterCount: 6, difference: 6, category: 'other' },
    { id: 49419, name: 'Palawa Joko\'s Finger Cuff (Infused)', beforeCount: 1, afterCount: 5, difference: 4, category: 'other' },
    { id: 49420, name: 'Lucce Seal (Infused)', beforeCount: 0, afterCount: 4, difference: 4, category: 'other' },
    { id: 49421, name: 'Purge Signet (Infused)', beforeCount: 0, afterCount: 5, difference: 5, category: 'other' },
    { id: 49422, name: 'Band of the Brotherhood (Infused)', beforeCount: 0, afterCount: 1, difference: 1, category: 'other' },
    { id: 49423, name: 'Cirque of Arah (Infused)', beforeCount: 0, afterCount: 3, difference: 3, category: 'other' },
    
    // Armor Chests - cantidades reales del CSV
    { id: 64165, name: 'Healer\'s Chest of Leggings', beforeCount: 6, afterCount: 7, difference: 1, category: 'other' },
    { id: 64166, name: 'Defender\'s Chest of Shoulders', beforeCount: 18, afterCount: 20, difference: 2, category: 'other' },
    { id: 64168, name: 'Defender\'s Chest of Leggings', beforeCount: 15, afterCount: 16, difference: 1, category: 'other' },
    { id: 64170, name: 'Healer\'s Chest of Gloves', beforeCount: 10, afterCount: 14, difference: 4, category: 'other' },
    { id: 64171, name: 'Malicious Chest of Gloves', beforeCount: 14, afterCount: 16, difference: 2, category: 'other' },
    { id: 64172, name: 'Assaulter\'s Chest of Gloves', beforeCount: 16, afterCount: 17, difference: 1, category: 'other' },
    { id: 64173, name: 'Defender\'s Chest of Gloves', beforeCount: 22, afterCount: 24, difference: 2, category: 'other' },
    { id: 64175, name: 'Assaulter\'s Chest of Boots', beforeCount: 10, afterCount: 11, difference: 1, category: 'other' },
    { id: 64176, name: 'Malicious Chest of Boots', beforeCount: 14, afterCount: 16, difference: 2, category: 'other' },
    { id: 64177, name: 'Assaulter\'s Chest of Shoulders', beforeCount: 7, afterCount: 8, difference: 1, category: 'other' },
    { id: 64178, name: 'Healer\'s Chest of Boots', beforeCount: 13, afterCount: 14, difference: 1, category: 'other' },
    { id: 64179, name: 'Malicious Chest of Coats', beforeCount: 10, afterCount: 11, difference: 1, category: 'other' },
    { id: 64180, name: 'Assaulter\'s Chest of Helms', beforeCount: 9, afterCount: 10, difference: 1, category: 'other' },
    { id: 64181, name: 'Defender\'s Chest of Helms', beforeCount: 10, afterCount: 11, difference: 1, category: 'other' },
    { id: 64182, name: 'Healer\'s Chest of Helms', beforeCount: 8, afterCount: 11, difference: 3, category: 'other' },
    { id: 64184, name: 'Healer\'s Chest of Shoulders', beforeCount: 19, afterCount: 20, difference: 1, category: 'other' },
    { id: 64185, name: 'Malicious Chest of Shoulders', beforeCount: 13, afterCount: 16, difference: 3, category: 'other' },
  ], []);

  // OPTIMIZADO: Calcular estadísticas para cada cofre con mejor performance
  const dungeonChestStats = useMemo(() => {
    const totalItems = dungeonChestData.reduce((sum, item) => sum + Math.max(0, item.difference), 0);
    
    // OPTIMIZADO: Calcular valor total más eficientemente
    let totalValue = 0;
    for (const item of dungeonChestData) {
      if (item.id > 0) {
        const currentPrice = itemDetails[item.id]?.currentPrice;
        if (currentPrice) {
          totalValue += currentPrice * Math.max(0, item.difference);
        }
      }
    }
    
    // Cada Pristine Fractal Relic = 1 cofre abierto
    const estimatedChests = 2250; // Base fija basada en Pristine Fractal Relics
    const avgGoldPerChest = totalValue / estimatedChests;
    
    // OPTIMIZADO: Pre-calcular valores reutilizados
    const totalItemsIsValid = totalItems > 0;
    const estimatedChestsIsValid = estimatedChests > 0;
    
    const itemsWithStats = dungeonChestData.map(item => {
      const difference = Math.max(0, item.difference);
      return {
        ...item,
        percentage: totalItemsIsValid ? (difference / totalItems) * 100 : 0,
        dropRate: estimatedChestsIsValid ? (difference / estimatedChests) : 0
      };
    });

    return {
      totalItems,
      totalValue,
      estimatedChests,
      avgGoldPerChest,
      itemsWithStats,
      uniqueItemTypes: dungeonChestData.filter(item => item.difference > 0).length
    };
  }, [dungeonChestData, itemDetails]);

  const raidChestStats = useMemo(() => {
    const totalItems = raidChestData.reduce((sum, item) => sum + Math.max(0, item.difference), 0);
    
    // Calcular valor total usando precios actuales
    const totalValue = raidChestData.reduce((sum, item) => {
      if (item.id > 0 && itemDetails[item.id]?.currentPrice) {
        return sum + (itemDetails[item.id].currentPrice * Math.max(0, item.difference));
      }
      return sum;
    }, 0);
    
    // Cada Pristine Fractal Relic = 1 cofre abierto
    const estimatedChests = 2250; // Base fija basada en Pristine Fractal Relics
    const avgGoldPerChest = totalValue / estimatedChests;
    
    // Calcular porcentajes y drop rates para cada item
    const itemsWithStats = raidChestData.map(item => ({
      ...item,
      percentage: totalItems > 0 ? (Math.max(0, item.difference) / totalItems) * 100 : 0,
      dropRate: estimatedChests > 0 ? (Math.max(0, item.difference) / estimatedChests) : 0
    }));

    return {
      totalItems,
      totalValue,
      estimatedChests,
      avgGoldPerChest,
      itemsWithStats,
      uniqueItemTypes: raidChestData.filter(item => item.difference > 0).length
    };
  }, [raidChestData, itemDetails]);

  const strikeChestStats = useMemo(() => {
    const totalItems = strikeChestData.reduce((sum, item) => sum + Math.max(0, item.difference), 0);
    
    // Calcular valor total usando precios actuales
    const totalValue = strikeChestData.reduce((sum, item) => {
      if (item.id > 0 && itemDetails[item.id]?.currentPrice) {
        return sum + (itemDetails[item.id].currentPrice * Math.max(0, item.difference));
      }
      return sum;
    }, 0);
    
    // Cada Pristine Fractal Relic = 1 cofre abierto
    const estimatedChests = 2250; // Base fija basada en Pristine Fractal Relics
    const avgGoldPerChest = totalValue / estimatedChests;
    
    // Calcular porcentajes y drop rates para cada item
    const itemsWithStats = strikeChestData.map(item => ({
      ...item,
      percentage: totalItems > 0 ? (Math.max(0, item.difference) / totalItems) * 100 : 0,
      dropRate: estimatedChests > 0 ? (Math.max(0, item.difference) / estimatedChests) : 0
    }));

    return {
      totalItems,
      totalValue,
      estimatedChests,
      avgGoldPerChest,
      itemsWithStats,
      uniqueItemTypes: strikeChestData.filter(item => item.difference > 0).length
    };
  }, [strikeChestData, itemDetails]);

  // Cargar detalles de los items (iconos y precios actuales)
  const fetchItemDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener todos los IDs de todas las secciones
        const allItemIds = [
    ...farmingData.map(item => item.id),
    ...dungeonChestData.map(item => item.id),
    ...raidChestData.map(item => item.id),
    ...strikeChestData.map(item => item.id),
    75919, // Fractal Encryption
    75409, // Cracked Fractal Encryption
    // IDs de Trofeos para la tabla
    73478, // Manuscript
    75220, // Proof
    73848, // Treaties
    72336, // Postulate
    79792, // Handful of Fractal Relics
    74268, // Mini Professor Mew
    67261, // New item
    46733, // Dragonite Ore
    46735, // Empyreal Fragment
    46731, // Pile of Bloodstone Dust

    // Materiales T5 IDs
    24294, // Sangre
    24341, // Hueso
    24350, // Garra
    24288, // Escama
    24356, // Colmillo
    24299, // Totem
    24282, // Vesícula
    24276, // Polvo
    24277, // Polvo adicional (usado en Total1 y Total2)
    19721,  // Ectoplasm (usado en Total3)
    19718,  // Empyreal Fragment (usado en item 46735)
     // IDs para Cálculo 0.9 × 250
    24295, 24358, 24351, 24357, 24289, 24300, 24283,
     // IDs para el cálculo oculto del item 43971 (19 IDs × 0.85 ÷ 19 - Aetherized weapons correctos)
    44001, 44004, 44007, 44010, 44013, 44016, 44019, 44022, 44025, 44028, 44031, 44034, 44037, 44040, 44043, 44046, 44049, 44052, 44055,
     // ID para el cálculo oculto del item 46735 (Toxic Tuning Crystal)
    48917,
     // ID para el item 83008 (Rare Unid)
    83008,
     // ID para el cálculo oculto del item 49424 (+9 Agony Infusion)
    49432,
     // ID para Reactivo termocatalítico (usado en +9 Agony Infusion)
     46747,
  ].filter(id => id > 0);
      
      // Eliminar duplicados
      const uniqueItemIds = [...new Set(allItemIds)];
      
      
      if (uniqueItemIds.length === 0) {
        setLoading(false);
        return;
      }

      // Helper: dividir en lotes seguros para la API
      const chunkArray = <T,>(arr: T[], size: number): T[][] => {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };
      const chunkSize = 180; // bajo el límite de 200 ids por request de la API

      // Obtener detalles de los items en lotes
      const itemChunks = chunkArray(uniqueItemIds, chunkSize);
      const itemsArrays = await Promise.all(
        itemChunks.map(async (chunk) => {
          try {
            const res = await fetch(`https://api.guildwars2.com/v2/items?ids=${chunk.join(',')}&lang=${lang}`, {
              headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br'
              }
            });
            const data = await res.json();
            return Array.isArray(data) ? data : [data];
          } catch {
            return [];
          }
        })
      );
      const items: Array<GW2Item> = itemsArrays.flat();

      // Obtener precios actuales en lotes
      const priceChunks = itemChunks;
      const pricesArrays = await Promise.all(
        priceChunks.map(async (chunk) => {
          try {
            const res = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${chunk.join(',')}`, {
              headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br'
              }
            });
            const data = await res.json();
            return Array.isArray(data) ? data : [data];
          } catch {
            return [];
          }
        })
      );
      const prices: Array<GW2Price> = pricesArrays.flat();
      const priceById: Record<number, GW2Price> = {};
      prices.forEach((p) => { if (p && typeof p.id === 'number') priceById[p.id] = p; });

      const details: Record<number, { icon: string; currentPrice: number; buyPrice: number; name: string }> = {};
      
      items.forEach((item: GW2Item) => {
        const price = priceById[item.id];
        details[item.id] = {
          icon: item.icon || '',
          currentPrice: price?.sells?.unit_price || 0,
          buyPrice: price?.buys?.unit_price || 0,
          name: item.name || ''
        };
      });

      setItemDetails(details);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching item details:', error);
    } finally {
      setLoading(false);
    }
  }, [farmingData, dungeonChestData, raidChestData, strikeChestData, lang]);

  useEffect(() => {
    fetchItemDetails();
  }, [fetchItemDetails]);

  // Actualización automática cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchItemDetails();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [fetchItemDetails]);

  // Manejo del hash para navegación directa a secciones
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'T1') {
        setActiveSection('T1');
      } else if (hash === 'T2') {
        setActiveSection('T2');
      } else if (hash === 'T3') {
        setActiveSection('T3');
      } else if (hash === 'T4') {
        setActiveSection('T4');
      } else if (hash === 'fractal-encryptions') {
        setActiveSection('fractal-encryptions');
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalItems = farmingData.reduce((sum, item) => sum + Math.max(0, item.difference), 0);
    
    // Calcular valor total usando precios actuales
    const totalValue = farmingData.reduce((sum, item) => {
      if (item.id > 0 && itemDetails[item.id]?.currentPrice) {
        return sum + (itemDetails[item.id].currentPrice * Math.max(0, item.difference));
      }
      return sum;
    }, 0);
    
    // Cada Pristine Fractal Relic = 1 cofre abierto
    const estimatedChests = 2250; // Base fija basada en Pristine Fractal Relics
    const avgGoldPerChest = totalValue / estimatedChests;
    
    // Calcular porcentajes y drop rates para cada item
    const itemsWithStats = farmingData.map(item => ({
      ...item,
      percentage: totalItems > 0 ? (Math.max(0, item.difference) / totalItems) * 100 : 0,
      dropRate: estimatedChests > 0 ? (Math.max(0, item.difference) / estimatedChests) : 0
    }));

    return {
      totalItems,
      totalValue,
      estimatedChests,
      avgGoldPerChest,
      itemsWithStats,
      uniqueItemTypes: farmingData.filter(item => item.difference > 0).length
    };
  }, [farmingData, itemDetails]);

  
  // OPTIMIZADO: Formateo de oro memoizado para evitar re-cálculos
  const formatGoldSilverCopper = useCallback((copper: number) => {
    const isNegative = copper < 0;
    const absCopper = Math.abs(copper);
    const gold = Math.floor(absCopper / 10000);
    const silver = Math.floor((absCopper % 10000) / 100);
    const copperRemainder = Math.round(absCopper % 100);
    const sign = isNegative ? '- ' : '';
    return `${sign}${gold.toString().padStart(2, '0')}G ${silver.toString().padStart(2, '0')}S ${copperRemainder.toString().padStart(2, '0')}C`;
  }, []);

  // Mapeo de IDs a nombres de traducción para los items de fractales
  const fractalItemNames: Record<number, string> = {
    24294: 'fractals.items.blood',    // Sangre
    24341: 'fractals.items.bone',     // Hueso
    24350: 'fractals.items.claw',     // Garra
    24356: 'fractals.items.fang',     // Colmillo
    24288: 'fractals.items.scale',    // Escama
    24299: 'fractals.items.totem',    // Tótem
    24282: 'fractals.items.venom',    // Vesícula
    24276: 'fractals.items.dust',     // Polvo
    19721: 'fractals.items.ectoplasm', // Ectoplasma
    24277: 'fractals.items.ancientWood', // Madera Antigua
    24295: 'fractals.items.orichalcum',  // Oricalco
    24358: 'fractals.items.gossamer',    // Gossamer
    24351: 'fractals.items.silk',        // Seda
    24357: 'fractals.items.thickLeather', // Cuero Grueso
    24289: 'fractals.items.wool',        // Lana
    24300: 'fractals.items.linen',       // Lino
    24283: 'fractals.items.iron',        // Hierro
    24342: 'fractals.items.platinum',    // Platino
    24343: 'fractals.items.mithril',     // Mitril
    24344: 'fractals.items.gold',        // Oro
    24345: 'fractals.items.silver',      // Plata
    24346: 'fractals.items.copper',      // Cobre
    24347: 'fractals.items.tin',         // Estaño
    24348: 'fractals.items.softWood',    // Madera Blanda
    24349: 'fractals.items.seasonedWood', // Madera Sazonada
    24352: 'fractals.items.hardWood',    // Madera Dura
    24353: 'fractals.items.rawhide',     // Cuero Crudo
    24354: 'fractals.items.thinLeather', // Cuero Fino
    24355: 'fractals.items.coarseLeather', // Cuero Grueso
    24359: 'fractals.items.ruggedLeather', // Cuero Resistente
    24360: 'fractals.items.jute',        // Yute
    24361: 'fractals.items.cotton',      // Algodón
    24362: 'fractals.items.silkScrap',   // Retal de Seda
    24363: 'fractals.items.woolScrap',   // Retal de Lana
    24364: 'fractals.items.linenScrap',  // Retal de Lino
    24365: 'fractals.items.ironOre',     // Mineral de Hierro
    24366: 'fractals.items.platinumOre', // Mineral de Platino
    24367: 'fractals.items.mithrilOre',  // Mineral de Mitril
    24368: 'fractals.items.goldOre',     // Mineral de Oro
    24369: 'fractals.items.silverOre',   // Mineral de Plata
    24370: 'fractals.items.copperOre',   // Mineral de Cobre
    24371: 'fractals.items.tinOre'       // Mineral de Estaño
  };

  // Utilidades de búsqueda multi-idioma (usa nombre localizado y normaliza acentos)
  type ItemWithName = { id: number; name: string };
  const normalizeForSearch = useCallback((text: string) =>
    (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  , []);
  const getItemDisplayName = useCallback((item: ItemWithName) => itemDetails[item.id]?.name || item.name, [itemDetails]);
  const itemMatchesSearch = useCallback((item: ItemWithName, term: string) => {
    if (!term) return true;
    const name = normalizeForSearch(getItemDisplayName(item));
    const q = normalizeForSearch(term);
    return name.includes(q);
  }, [normalizeForSearch, getItemDisplayName]);

  // Filtrar y ordenar items
  const filteredAndSortedItems = useMemo(() => {
    const filtered = stats.itemsWithStats.filter(item => itemMatchesSearch(item, searchTerm));

    // Ordenar items
    const sorted = [...filtered].map((item, index) => ({ ...item, originalIndex: index })).sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'difference':
          aValue = a.difference;
          bValue = b.difference;
          break;
        case 'currentPrice':
          aValue = itemDetails[a.id]?.currentPrice || 0;
          bValue = itemDetails[b.id]?.currentPrice || 0;
          break;
        case 'totalValue':
          aValue = (itemDetails[a.id]?.currentPrice || 0) * Math.max(0, a.difference);
          bValue = (itemDetails[b.id]?.currentPrice || 0) * Math.max(0, b.difference);
          break;
        case 'percentage':
          aValue = a.percentage || 0;
          bValue = b.percentage || 0;
          break;
        case 'dropRate':
          aValue = a.dropRate || 0;
          bValue = b.dropRate || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        if (aValue > bValue) return 1;
        if (aValue < bValue) return -1;
        return a.originalIndex - b.originalIndex; // Mantener orden original cuando son iguales
      } else {
        if (aValue < bValue) return 1;
        if (aValue > bValue) return -1;
        return a.originalIndex - b.originalIndex; // Mantener orden original cuando son iguales
      }
    }).map(item => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { originalIndex, ...rest } = item;
      return rest;
    }); // Remover originalIndex del resultado final

    return sorted;
  }, [stats.itemsWithStats, searchTerm, sortBy, sortOrder, itemDetails, itemMatchesSearch]);

  // Función para manejar el ordenamiento por columna
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Componente de encabezado ordenable
  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <th 
      className="text-center p-2 sm:p-3 text-gray-200 font-semibold cursor-pointer hover:bg-gray-700/60 transition-all duration-200 select-none group"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        <span className="text-xs sm:text-sm">{children}</span>
        <div className="flex flex-col text-xs">
          {sortBy === column ? (
            sortOrder === 'asc' ? (
              <span className="text-blue-400 font-bold">↑</span>
            ) : (
              <span className="text-blue-400 font-bold">↓</span>
            )
          ) : (
            <div className="flex flex-col text-gray-500 group-hover:text-gray-300 transition-colors">
              <span className="opacity-60">↑</span>
              <span className="opacity-60">↓</span>
            </div>
          )}
        </div>
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <style jsx global>{`
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
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
                 <div className="text-center mb-6 md:mb-8">
           <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">
             {t('farmingTracker.title')}
           </h1>
           <p className="text-gray-300 text-sm sm:text-base md:text-lg" dangerouslySetInnerHTML={{ __html: t('farmingTracker.subtitle') }}>
           </p>
                  </div>
 
         {/* Section Navigation */}
         <div className="flex justify-center mb-8">
           <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 shadow-2xl w-full max-w-3xl">
             <div className="flex flex-wrap justify-center gap-2">
               <button
                 onClick={() => {
                   setActiveSection('T1');
                   if (typeof window !== 'undefined') {
                     window.location.hash = 'T1';
                   }
                 }}
                 className={`px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${
                   activeSection === 'T1'
                     ? 'bg-green-600 text-white shadow-lg'
                     : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                 }`}
               >
                 {t('farmingTracker.sections.initiate')}
               </button>
               <button
                 onClick={() => {
                   setActiveSection('T2');
                   if (typeof window !== 'undefined') {
                     window.location.hash = 'T2';
                   }
                 }}
                 className={`px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${
                   activeSection === 'T2'
                     ? 'bg-purple-600 text-white shadow-lg'
                     : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                 }`}
               >
                 {t('farmingTracker.sections.adept')}
               </button>
               <button
                 onClick={() => {
                   setActiveSection('T3');
                   if (typeof window !== 'undefined') {
                     window.location.hash = 'T3';
                   }
                 }}
                 className={`px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${
                   activeSection === 'T3'
                     ? 'bg-orange-600 text-white shadow-lg'
                     : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                 }`}
               >
                 {t('farmingTracker.sections.expert')}
               </button>
               <button
                 onClick={() => {
                   setActiveSection('T4');
                   if (typeof window !== 'undefined') {
                     window.location.hash = 'T4';
                   }
                 }}
                 className={`px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${
                   activeSection === 'T4'
                     ? 'bg-blue-600 text-white shadow-lg'
                     : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                 }`}
               >
                 {t('farmingTracker.sections.fractal')}
               </button>
               <button
                 onClick={() => {
                   setActiveSection('fractal-encryptions');
                   if (typeof window !== 'undefined') {
                     window.location.hash = 'fractal-encryptions';
                   }
                 }}
                 className={`px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 text-sm md:text-base ${
                   activeSection === 'fractal-encryptions'
                     ? 'bg-teal-600 text-white shadow-lg'
                     : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                 }`}
               >
                 {t('farmingTracker.sections.encryption')}
               </button>
             </div>
           </div>
         </div>
 
          {/* Content based on active section */}
         
          {/* Initiate Section (T1) */}
         {activeSection === 'T1' && (
           <>
             <div id="T1" className="invisible absolute -top-20"></div>
             {/* Stats Overview */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.totalValueGained')}</h3>
                 <div className="text-base sm:text-lg font-bold text-green-400">
                   {formatGoldSilverCopper(dungeonChestStats.totalValue)}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.totalValueGained')}</p>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.itemsGained')}</h3>
                 <div className="text-base sm:text-lg font-bold text-blue-400">
                   {dungeonChestStats.totalItems.toLocaleString()}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.totalAmount')}</p>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.chestsOpened')}</h3>
                 <div className="text-base sm:text-lg font-bold text-purple-400">
                   {dungeonChestStats.estimatedChests.toLocaleString()}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.basedOnRelics')}</p>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.avgGoldPerChest')}</h3>
                 <div className="text-base sm:text-lg font-bold text-yellow-400">
                   {formatGoldSilverCopper(Math.round(dungeonChestStats.avgGoldPerChest))}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.avgValuePerChest')}</p>
               </div>
             </div>

             {/* Search and Update */}
             <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6 shadow-2xl mb-8">
               <div className="flex flex-col md:flex-row gap-4 items-center">
                 {/* Search */}
                 <div className="flex-1">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                     <input
                       type="text"
                       placeholder={t('farmingTracker.search.placeholder')}
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 bg-gray-800/80 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                     />
                   </div>
                 </div>
                 
                 {/* Update Button and Last Update Info */}
                 <div className="flex flex-col items-end gap-2">
                   <button
                     onClick={fetchItemDetails}
                     disabled={loading}
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                   >
                     {loading ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         {t('farmingTracker.search.updating')}
                       </>
                     ) : (
                       <>
                         <Package className="w-4 h-4" />
                         {t('farmingTracker.search.updatePrices')}
                       </>
                     )}
                   </button>
                   <div className="text-xs text-gray-400" suppressHydrationWarning={true}>
                     {t('farmingTracker.search.lastUpdate')}: {lastUpdate.toLocaleTimeString()}
                   </div>
                 </div>
               </div>
             </div>

             {/* Items Table */}
             <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
               <div className="p-6 border-b border-gray-700">
                 <h2 className="text-2xl font-bold text-white flex items-center">
                   <Package className="w-6 h-6 mr-3 text-green-400" />
                   Contenedor de Items Ganados - Análisis de Box Opening
                 </h2>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="border-b border-gray-700 bg-gray-800/60">
                       <th className="text-left p-3 text-gray-200 font-semibold cursor-pointer hover:bg-gray-700/60 transition-colors select-none" onClick={() => handleSort('name')}>
                         <div className="flex items-center gap-2">
                           {t('farmingTracker.table.headers.item')}
                           <div className="flex flex-col text-xs text-gray-500">
                             {sortBy === 'name' ? (
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
                       <SortableHeader column="difference">{t('farmingTracker.table.headers.quantityObtained')}</SortableHeader>
                       <SortableHeader column="currentPrice">{t('farmingTracker.table.headers.currentPrice')}</SortableHeader>
                       <SortableHeader column="totalValue">{t('farmingTracker.table.headers.totalValueGained')}</SortableHeader>
                       <SortableHeader column="percentage">{t('farmingTracker.table.headers.dropPercentage')}</SortableHeader>
                       <SortableHeader column="dropRate">{t('farmingTracker.table.headers.dropRatePerChest')}</SortableHeader>
                     </tr>
                   </thead>
                   <tbody>
                     {dungeonChestStats.itemsWithStats
                       .filter(item => itemMatchesSearch(item, searchTerm))
                       .sort((a, b) => {
                         let aValue: string | number, bValue: string | number;
                         switch (sortBy) {
                           case 'name':
                             aValue = a.name.toLowerCase();
                             bValue = b.name.toLowerCase();
                             break;
                           case 'difference':
                             aValue = a.difference;
                             bValue = b.difference;
                             break;
                           case 'currentPrice':
                             aValue = itemDetails[a.id]?.currentPrice || 0;
                             bValue = itemDetails[b.id]?.currentPrice || 0;
                             break;
                           case 'totalValue':
                             aValue = (itemDetails[a.id]?.currentPrice || 0) * Math.max(0, a.difference);
                             bValue = (itemDetails[b.id]?.currentPrice || 0) * Math.max(0, b.difference);
                             break;
                           case 'percentage':
                             aValue = a.percentage || 0;
                             bValue = b.percentage || 0;
                             break;
                           case 'dropRate':
                             aValue = a.dropRate || 0;
                             bValue = b.dropRate || 0;
                             break;
                           default:
                             aValue = a.name.toLowerCase();
                             bValue = b.name.toLowerCase();
                         }
                         if (sortOrder === 'asc') {
                           return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
                         } else {
                           return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
                         }
                       })
                       .map((item, index) => (
                         <tr key={`${item.id}-${index}`} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                           <td className="p-3 text-white">
                             <div className="flex items-center gap-3">
                               {item.id > 0 && itemDetails[item.id]?.icon ? (
                                 <Image
                                   src={itemDetails[item.id].icon}
                                   alt={item.name}
                                   width={32}
                                   height={32}
                                   className="rounded"
                                 />
                               ) : (
                                 <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                                   <span className="text-xs text-gray-400">?</span>
                                 </div>
                               )}
                               <div>
                                 <div className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{itemDetails[item.id]?.name || item.name}</div>
                               </div>
                             </div>
                           </td>
                           <td className="p-3 text-center">
                             <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                               item.difference > 0 
                                 ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                 : item.difference < 0
                                 ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                 : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                             }`}>
                               {item.difference > 0 ? '+' : ''}{item.difference.toLocaleString()}
                             </span>
                           </td>
                           <td className="p-3 text-center">
                             {item.id > 0 && itemDetails[item.id]?.currentPrice ? (
                               <div className="text-green-400 font-semibold">
                                 {formatGoldSilverCopper(itemDetails[item.id].currentPrice)}
                               </div>
                             ) : (
                               <span className="text-gray-500">-</span>
                             )}
                           </td>
                           <td className="p-3 text-center">
                             {item.id > 0 && itemDetails[item.id]?.currentPrice ? (
                               <div className="text-green-400 font-semibold">
                                 {formatGoldSilverCopper(itemDetails[item.id].currentPrice * Math.max(0, item.difference))}
                               </div>
                             ) : (
                               <span className="text-gray-500">-</span>
                             )}
                           </td>
                           <td className="p-3 text-center text-gray-300">
                             {item.percentage?.toFixed(2)}%
                           </td>
                           <td className="p-3 text-center text-gray-300">
                             {item.dropRate?.toFixed(2)}
                           </td>
                         </tr>
                       ))}
                   </tbody>
                 </table>
               </div>
               
             </div>
           </>
         )}

         {/* Adept Section (T2) */}
         {activeSection === 'T2' && (
           <>
             <div id="T2" className="invisible absolute -top-20"></div>
             {/* Stats Overview */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.totalValueGained')}</h3>
                 <div className="text-base sm:text-lg font-bold text-green-400">
                   {formatGoldSilverCopper(raidChestStats.totalValue)}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.totalValueGained')}</p>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.itemsGained')}</h3>
                 <div className="text-base sm:text-lg font-bold text-blue-400">
                   {raidChestStats.totalItems.toLocaleString()}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.totalAmount')}</p>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.chestsOpened')}</h3>
                 <div className="text-base sm:text-lg font-bold text-purple-400">
                   {raidChestStats.estimatedChests.toLocaleString()}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.basedOnRelics')}</p>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.avgGoldPerChest')}</h3>
                 <div className="text-base sm:text-lg font-bold text-yellow-400">
                   {formatGoldSilverCopper(Math.round(raidChestStats.avgGoldPerChest))}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.avgValuePerChest')}</p>
               </div>
             </div>

             {/* Search and Update */}
             <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6 shadow-2xl mb-8">
               <div className="flex flex-col md:flex-row gap-4 items-center">
                 {/* Search */}
                 <div className="flex-1">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                     <input
                       type="text"
                       placeholder={t('farmingTracker.search.placeholder')}
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 bg-gray-800/80 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                     />
                   </div>
                 </div>
                 
                 {/* Update Button and Last Update Info */}
                 <div className="flex flex-col items-end gap-2">
                   <button
                     onClick={fetchItemDetails}
                     disabled={loading}
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                   >
                     {loading ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         {t('farmingTracker.search.updating')}
                       </>
                     ) : (
                       <>
                         <Package className="w-4 h-4" />
                         {t('farmingTracker.search.updatePrices')}
                       </>
                     )}
                   </button>
                   <div className="text-xs text-gray-400" suppressHydrationWarning={true}>
                     {t('farmingTracker.search.lastUpdate')}: {lastUpdate.toLocaleTimeString()}
                   </div>
                 </div>
               </div>
             </div>

             {/* Items Table */}
             <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
               <div className="p-6 border-b border-gray-700">
                 <h2 className="text-2xl font-bold text-white flex items-center">
                   <Package className="w-6 h-6 mr-3 text-green-400" />
                   Contenedor de Items Ganados - Análisis de Box Opening
                 </h2>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="border-b border-gray-700 bg-gray-800/60">
                       <th className="text-left p-3 text-gray-200 font-semibold cursor-pointer hover:bg-gray-700/60 transition-colors select-none" onClick={() => handleSort('name')}>
                         <div className="flex items-center gap-2">
                           {t('farmingTracker.table.headers.item')}
                           <div className="flex flex-col text-xs text-gray-500">
                             {sortBy === 'name' ? (
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
                       <SortableHeader column="difference">{t('farmingTracker.table.headers.quantityObtained')}</SortableHeader>
                       <SortableHeader column="currentPrice">{t('farmingTracker.table.headers.currentPrice')}</SortableHeader>
                       <SortableHeader column="totalValue">{t('farmingTracker.table.headers.totalValueGained')}</SortableHeader>
                       <SortableHeader column="percentage">{t('farmingTracker.table.headers.dropPercentage')}</SortableHeader>
                       <SortableHeader column="dropRate">{t('farmingTracker.table.headers.dropRatePerChest')}</SortableHeader>
                     </tr>
                   </thead>
                   <tbody>
                     {raidChestStats.itemsWithStats
                       .filter(item => itemMatchesSearch(item, searchTerm))
                       .sort((a, b) => {
                         let aValue: string | number, bValue: string | number;
                         switch (sortBy) {
                           case 'name':
                             aValue = a.name.toLowerCase();
                             bValue = b.name.toLowerCase();
                             break;
                           case 'difference':
                             aValue = a.difference;
                             bValue = b.difference;
                             break;
                           case 'currentPrice':
                             aValue = itemDetails[a.id]?.currentPrice || 0;
                             bValue = itemDetails[b.id]?.currentPrice || 0;
                             break;
                           case 'totalValue':
                             aValue = (itemDetails[a.id]?.currentPrice || 0) * Math.max(0, a.difference);
                             bValue = (itemDetails[b.id]?.currentPrice || 0) * Math.max(0, b.difference);
                             break;
                           case 'percentage':
                             aValue = a.percentage || 0;
                             bValue = b.percentage || 0;
                             break;
                           case 'dropRate':
                             aValue = a.dropRate || 0;
                             bValue = b.dropRate || 0;
                             break;
                           default:
                             aValue = a.name.toLowerCase();
                             bValue = b.name.toLowerCase();
                         }
                         if (sortOrder === 'asc') {
                           return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
                         } else {
                           return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
                         }
                       })
                       .map((item, index) => (
                         <tr key={`${item.id}-${index}`} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                           <td className="p-3 text-white">
                             <div className="flex items-center gap-3">
                               {item.id > 0 && itemDetails[item.id]?.icon ? (
                                 <Image
                                   src={itemDetails[item.id].icon}
                                   alt={item.name}
                                   width={32}
                                   height={32}
                                   className="rounded"
                                 />
                               ) : (
                                 <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                                   <span className="text-xs text-gray-400">?</span>
                                 </div>
                               )}
                               <div>
                                 <div className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{itemDetails[item.id]?.name || item.name}</div>
                               </div>
                             </div>
                           </td>
                           <td className="p-3 text-center">
                             <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                               item.difference > 0 
                                 ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                 : item.difference < 0
                                 ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                 : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                             }`}>
                               {item.difference > 0 ? '+' : ''}{item.difference.toLocaleString()}
                             </span>
                           </td>
                           <td className="p-3 text-center">
                             {item.id > 0 && itemDetails[item.id]?.currentPrice ? (
                               <div className="text-green-400 font-semibold">
                                 {formatGoldSilverCopper(itemDetails[item.id].currentPrice)}
                               </div>
                             ) : (
                               <span className="text-gray-500">-</span>
                             )}
                           </td>
                           <td className="p-3 text-center">
                             {item.id > 0 && itemDetails[item.id]?.currentPrice ? (
                               <div className="text-green-400 font-semibold">
                                 {formatGoldSilverCopper(itemDetails[item.id].currentPrice * Math.max(0, item.difference))}
                               </div>
                             ) : (
                               <span className="text-gray-500">-</span>
                             )}
                           </td>
                           <td className="p-3 text-center text-gray-300">
                             {item.percentage?.toFixed(2)}%
                           </td>
                           <td className="p-3 text-center text-gray-300">
                             {item.dropRate?.toFixed(2)}
                           </td>
                         </tr>
                       ))}
                   </tbody>
                 </table>
               </div>
               
             </div>
           </>
         )}

         {/* Expert Section (T3) */}
         {activeSection === 'T3' && (
           <>
             <div id="T3" className="invisible absolute -top-20"></div>
             {/* Stats Overview */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.totalValueGained')}</h3>
                 <div className="text-base sm:text-lg font-bold text-green-400">
                   {formatGoldSilverCopper(strikeChestStats.totalValue)}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.totalValueGained')}</p>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.itemsGained')}</h3>
                 <div className="text-base sm:text-lg font-bold text-blue-400">
                   {strikeChestStats.totalItems.toLocaleString()}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.totalAmount')}</p>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.chestsOpened')}</h3>
                 <div className="text-base sm:text-lg font-bold text-purple-400">
                   {strikeChestStats.estimatedChests.toLocaleString()}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.basedOnRelics')}</p>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.avgGoldPerChest')}</h3>
                 <div className="text-base sm:text-lg font-bold text-yellow-400">
                   {formatGoldSilverCopper(Math.round(strikeChestStats.avgGoldPerChest))}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.avgValuePerChest')}</p>
               </div>
             </div>

             {/* Search and Update */}
             <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6 shadow-2xl mb-8">
               <div className="flex flex-col md:flex-row gap-4 items-center">
                 {/* Search */}
                 <div className="flex-1">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                     <input
                       type="text"
                       placeholder={t('farmingTracker.search.placeholder')}
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 bg-gray-800/80 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                     />
                   </div>
                 </div>
                 
                 {/* Update Button and Last Update Info */}
                 <div className="flex flex-col items-end gap-2">
                   <button
                     onClick={fetchItemDetails}
                     disabled={loading}
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                   >
                     {loading ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         {t('farmingTracker.search.updating')}
                       </>
                     ) : (
                       <>
                         <Package className="w-4 h-4" />
                         {t('farmingTracker.search.updatePrices')}
                       </>
                     )}
                   </button>
                   <div className="text-xs text-gray-400" suppressHydrationWarning={true}>
                     {t('farmingTracker.search.lastUpdate')}: {lastUpdate.toLocaleTimeString()}
                   </div>
                 </div>
               </div>
             </div>

             {/* Items Table */}
             <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
               <div className="p-6 border-b border-gray-700">
                 <h2 className="text-2xl font-bold text-white flex items-center">
                   <Package className="w-6 h-6 mr-3 text-green-400" />
                   Contenedor de Items Ganados - Análisis de Box Opening
                 </h2>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="border-b border-gray-700 bg-gray-800/60">
                       <th className="text-left p-3 text-gray-200 font-semibold cursor-pointer hover:bg-gray-700/60 transition-colors select-none" onClick={() => handleSort('name')}>
                         <div className="flex items-center gap-2">
                           {t('farmingTracker.table.headers.item')}
                           <div className="flex flex-col text-xs text-gray-500">
                             {sortBy === 'name' ? (
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
                       <SortableHeader column="difference">{t('farmingTracker.table.headers.quantityObtained')}</SortableHeader>
                       <SortableHeader column="currentPrice">{t('farmingTracker.table.headers.currentPrice')}</SortableHeader>
                       <SortableHeader column="totalValue">{t('farmingTracker.table.headers.totalValueGained')}</SortableHeader>
                       <SortableHeader column="percentage">{t('farmingTracker.table.headers.dropPercentage')}</SortableHeader>
                       <SortableHeader column="dropRate">{t('farmingTracker.table.headers.dropRatePerChest')}</SortableHeader>
                     </tr>
                   </thead>
                   <tbody>
                     {strikeChestStats.itemsWithStats
                       .filter(item => itemMatchesSearch(item, searchTerm))
                       .sort((a, b) => {
                         let aValue: string | number, bValue: string | number;
                         switch (sortBy) {
                           case 'name':
                             aValue = a.name.toLowerCase();
                             bValue = b.name.toLowerCase();
                             break;
                           case 'difference':
                             aValue = a.difference;
                             bValue = b.difference;
                             break;
                           case 'currentPrice':
                             aValue = itemDetails[a.id]?.currentPrice || 0;
                             bValue = itemDetails[b.id]?.currentPrice || 0;
                             break;
                           case 'totalValue':
                             aValue = (itemDetails[a.id]?.currentPrice || 0) * Math.max(0, a.difference);
                             bValue = (itemDetails[b.id]?.currentPrice || 0) * Math.max(0, b.difference);
                             break;
                           case 'percentage':
                             aValue = a.percentage || 0;
                             bValue = b.percentage || 0;
                             break;
                           case 'dropRate':
                             aValue = a.dropRate || 0;
                             bValue = b.dropRate || 0;
                             break;
                           default:
                             aValue = a.name.toLowerCase();
                             bValue = b.name.toLowerCase();
                         }
                         if (sortOrder === 'asc') {
                           return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
                         } else {
                           return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
                         }
                       })
                       .map((item, index) => (
                         <tr key={`${item.id}-${index}`} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                           <td className="p-3 text-white">
                             <div className="flex items-center gap-3">
                               {item.id > 0 && itemDetails[item.id]?.icon ? (
                                 <Image
                                   src={itemDetails[item.id].icon}
                                   alt={item.name}
                                   width={32}
                                   height={32}
                                   className="rounded"
                                 />
                               ) : (
                                 <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                                   <span className="text-xs text-gray-400">?</span>
                                 </div>
                               )}
                               <div>
                                 <div className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{itemDetails[item.id]?.name || item.name}</div>
                               </div>
                             </div>
                           </td>
                           <td className="p-3 text-center">
                             <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                               item.difference > 0 
                                 ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                 : item.difference < 0
                                 ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                 : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                             }`}>
                               {item.difference > 0 ? '+' : ''}{item.difference.toLocaleString()}
                             </span>
                           </td>
                           <td className="p-3 text-center">
                             {item.id > 0 && itemDetails[item.id]?.currentPrice ? (
                               <div className="text-green-400 font-semibold">
                                 {formatGoldSilverCopper(itemDetails[item.id].currentPrice)}
                               </div>
                             ) : (
                               <span className="text-gray-500">-</span>
                             )}
                           </td>
                           <td className="p-3 text-center">
                             {item.id > 0 && itemDetails[item.id]?.currentPrice ? (
                               <div className="text-green-400 font-semibold">
                                 {formatGoldSilverCopper(itemDetails[item.id].currentPrice * Math.max(0, item.difference))}
                               </div>
                             ) : (
                               <span className="text-gray-500">-</span>
                             )}
                           </td>
                           <td className="p-3 text-center text-gray-300">
                             {item.percentage?.toFixed(2)}%
                           </td>
                           <td className="p-3 text-center text-gray-300">
                             {item.dropRate?.toFixed(2)}
                           </td>
                         </tr>
                       ))}
                   </tbody>
                 </table>
               </div>
               
             </div>
           </>
         )}

         {/* Fractal Section (T4) - Master's Chest */}
         {activeSection === 'T4' && (
           <>
             <div id="T4" className="invisible absolute -top-20"></div>
             {/* Stats Overview */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.totalValueGained')}</h3>
                 <div className="text-base sm:text-lg font-bold text-green-400">
                   {formatGoldSilverCopper(stats.totalValue)}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">
                   {t('farmingTracker.stats.totalValueGained')}
                 </p>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.itemsGained')}</h3>
                 <div className="text-base sm:text-lg font-bold text-blue-400">
                   {stats.totalItems.toLocaleString()}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.totalAmount')}</p>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.chestsOpened')}</h3>
                 <div className="text-base sm:text-lg font-bold text-purple-400">
                   {stats.estimatedChests.toLocaleString()}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.basedOnRelics')}</p>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2 sm:p-3 shadow-2xl text-center sm:text-left">
                 <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">{t('farmingTracker.stats.avgGoldPerChest')}</h3>
                 <div className="text-base sm:text-lg font-bold text-yellow-400">
                   {formatGoldSilverCopper(Math.round(stats.avgGoldPerChest))}
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{t('farmingTracker.stats.avgValuePerChest')}</p>
               </div>
             </div>

        {/* Search and Filters */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6 shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('farmingTracker.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/80 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Update Button and Last Update Info */}
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={fetchItemDetails}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <div className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                  )}
                </div>
                {loading ? t('farmingTracker.search.updating') : t('farmingTracker.search.updatePrices')}
              </button>
              <div className="text-xs text-gray-400" suppressHydrationWarning={true}>
                {t('farmingTracker.search.lastUpdate')}: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Items Container */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Package className="w-6 h-6 mr-3 text-blue-400" />
              Contenedor de Items Ganados - Análisis de Box Opening
            </h2>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-gray-400 mt-2">{t('farmingTracker.search.loading')}</p>
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800/60">
                  <th className="text-left p-3 text-gray-200 font-semibold cursor-pointer hover:bg-gray-700/60 transition-colors select-none" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">
                      {t('farmingTracker.table.headers.item')}
                      <div className="flex flex-col text-xs text-gray-500">
                        {sortBy === 'name' ? (
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
                  <SortableHeader column="difference">{t('farmingTracker.table.headers.quantityObtained')}</SortableHeader>
                  <SortableHeader column="currentPrice">{t('farmingTracker.table.headers.currentPrice')}</SortableHeader>
                  <SortableHeader column="totalValue">{t('farmingTracker.table.headers.totalValueGained')}</SortableHeader>
                  <SortableHeader column="percentage">{t('farmingTracker.table.headers.dropPercentage')}</SortableHeader>
                  <SortableHeader column="dropRate">{t('farmingTracker.table.headers.dropRatePerChest')}</SortableHeader>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedItems.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 text-white">
                      <div className="flex items-center gap-3">
                        {item.id > 0 && itemDetails[item.id]?.icon ? (
                          <Image 
                            src={itemDetails[item.id].icon} 
                            alt={itemDetails[item.id]?.name || item.name}
                            width={32}
                            height={32}
                            className="rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-400">?</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{itemDetails[item.id]?.name || item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                        item.difference > 0 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : item.difference < 0
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {item.difference > 0 ? '+' : ''}{item.difference.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {item.id > 0 && itemDetails[item.id]?.currentPrice ? (
                        <div className="text-green-400 font-semibold">
                          {formatGoldSilverCopper(itemDetails[item.id].currentPrice)}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.id > 0 && itemDetails[item.id]?.currentPrice ? (
                        <div className="text-green-400 font-semibold">
                          {formatGoldSilverCopper(itemDetails[item.id].currentPrice * Math.max(0, item.difference))}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center text-gray-300">
                      {item.percentage?.toFixed(2)}%
                    </td>
                    <td className="p-3 text-center text-gray-300">
                      {item.dropRate?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </div>
           </>
         )}

         {/* Fractal Encryption Section */}
         {activeSection === 'fractal-encryptions' && (
           <>
             <div id="fractal-encryptions" className="invisible absolute -top-20"></div>
             {/* Data Source Info */}
             <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-700/30 rounded-lg p-4 mb-6 md:mb-8">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                 <div className="text-blue-300 text-sm sm:text-base">
                   <strong>{t('fractals.dataSource.label')}</strong> {t('fractals.dataSource.description')}{' '}
                   <span className="text-blue-200 font-bold">2.1M {itemDetails[75409]?.name || 'Cracked Fractal Encryption'}</span> {t('fractals.dataSource.opened')}. 
                   500k Zanar, 500k Selici, 100k Shinymeta (<a href="https://www.reddit.com/r/Guildwars2/comments/khwj92/research_fractal_encryptions/" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-blue-100 underline">{t('fractals.dataSource.publicData')}</a>), 
                   1M <a href="https://www.twitch.tv/vortus43" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-blue-100 underline">Vortus43</a>
                 </div>
               </div>
             </div>
             
             {/* Fractal Encryptions */}
             <div className="bg-cyan-900/20 backdrop-blur-sm border border-cyan-700/30 rounded-lg p-3 sm:p-4 md:p-6 shadow-2xl mb-6 md:mb-8">
               <h3 className="text-lg sm:text-xl font-semibold text-cyan-300 mb-3 md:mb-4">
                 {itemDetails[75919]?.name || 'Fractal Encryptions'}
               </h3>
               <div className="overflow-x-auto">
                 <table className="w-full min-w-[800px] text-sm">
                   <thead>
                     <tr className="border-b border-cyan-700/50 bg-cyan-800/30">
                       <th className="text-left p-2 sm:p-3 text-cyan-200 font-semibold"></th>
                       <th className="p-2 sm:p-3 text-center text-yellow-200 font-semibold">{t('fractals.table.total')}</th>
                       <th className="p-2 sm:p-3 text-center text-yellow-200 font-semibold">% Total</th>
                       <th className="p-2 sm:p-3 text-center text-green-200 font-semibold">{t('fractals.table.price')}</th>
                       <th className="p-2 sm:p-3 text-center text-blue-200 font-semibold">{t('fractals.table.value85')}</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr className="border-b border-cyan-800/50">
                       <td className="p-2 sm:p-3 text-cyan-300 font-semibold">{t('fractals.table.amountEncryptionsOpened')}</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">{((ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened) / 1000000).toFixed(1)}M</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">100%</td>
                       <td className="p-2 sm:p-3 text-center text-green-200 font-semibold">-</td>
                       <td className="p-2 sm:p-3 text-center text-blue-200 font-semibold">-</td>
                     </tr>
                     <tr className="border-b border-yellow-800/50 bg-yellow-800/20">
                       <td className="p-2 sm:p-3 text-yellow-300 font-semibold">{t('fractals.table.trophies')}</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">{totalTrophies.toLocaleString()}</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{totalPercentage}%</td>
                       <td className="p-2 sm:p-3 text-center text-green-200 font-semibold">-</td>
                       <td className="p-2 sm:p-3 text-center text-blue-200 font-semibold">-</td>
                     </tr>
                     <tr className="border-b border-cyan-800/50">
                       <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                         {itemDetails[73478]?.icon && (
                           <Image 
                             src={itemDetails[73478].icon} 
                             alt={itemDetails[73478]?.name || "Manuscript"}
                             width={24} 
                             height={24} 
                             className="w-6 h-6"
                           />
                         )}
                         {itemDetails[73478]?.name?.split(' ')[0] || t('fractals.items.manuscripts')}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">600,296</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{manuscriptTotalPercentage}%</td>
                       <td className="p-2 sm:p-3 text-center text-green-200 text-sm font-medium">{formatGoldSilverCopper(6000)}</td>
                     </tr>
                     <tr className="border-b border-cyan-800/50">
                       <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                         {itemDetails[75220]?.icon && (
                           <Image 
                             src={itemDetails[75220].icon} 
                             alt={itemDetails[75220]?.name || "Proof"}
                             width={24} 
                             height={24} 
                             className="w-6 h-6"
                           />
                         )}
                          {itemDetails[75220]?.name?.split(' ')[0] || t('fractals.items.proofs')}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">899,638</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{proofTotalPercentage}%</td>
                       <td className="p-2 sm:p-3 text-center text-green-200 text-sm font-medium">{formatGoldSilverCopper(3000)}</td>
                     </tr>
                     <tr className="border-b border-cyan-800/50">
                       <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                         {itemDetails[73848]?.icon && (
                           <Image 
                             src={itemDetails[73848].icon} 
                             alt={itemDetails[73848]?.name || "Treatise"}
                             width={24} 
                             height={24} 
                             className="w-6 h-6"
                           />
                         )}
                          {itemDetails[73848]?.name?.split(' ')[0] || t('fractals.items.treatises')}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">600,311</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{treatiseTotalPercentage}%</td>
                       <td className="p-2 sm:p-3 text-center text-green-200 text-sm font-medium">{formatGoldSilverCopper(2500)}</td>
                     </tr>
                     <tr>
                       <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                         {itemDetails[72336]?.icon && (
                           <Image 
                             src={itemDetails[72336].icon} 
                             alt={itemDetails[72336]?.name || "Postulate"}
                             width={24} 
                             height={24} 
                             className="w-6 h-6"
                           />
                         )}
                         {itemDetails[72336]?.name?.split(' ')[0] || t('fractals.items.postulates')}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">600,051</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{postulateTotalPercentage}%</td>
                       <td className="p-2 sm:p-3 text-center text-green-200 text-sm font-medium">{formatGoldSilverCopper(2000)}</td>
                     </tr>
                     <tr className="border-b border-red-800/50 bg-red-800/20">
                       <td className="p-2 sm:p-3 text-red-300 font-semibold">{t('fractals.table.t5CraftingMaterials')}</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">{(() => {
                         // Suma total de las tres columnas
                         const seliciValues: Record<number, number> = {
                           24294: 339475, // Vial of Powerful Blood
                           24341: 334960, // Large Bone
                           24350: 339190, // Large Claw
                           24288: 339260, // Large Scale
                           24356: 336540, // Large Fang
                           24299: 338230, // Large Totem
                           24282: 337195, // Large Venom Sac
                           24276: 337825, // Pile of Crystalline Dust
                         };
                         const vortusValues: Record<number, number> = {
                           24294: 338435, // Vial of Powerful Blood
                           24341: 337705, // Large Bone
                           24350: 335845, // Large Claw
                           24288: 338365, // Large Scale
                           24356: 337605, // Large Fang
                           24299: 339345, // Large Totem
                           24282: 338115, // Large Venom Sac
                           24276: 337905, // Pile of Crystalline Dust
                         };
                         const shinymetaValues: Record<number, number> = {
                           24294: 33785, // Vial of Powerful Blood
                           24341: 33830, // Large Bone
                           24350: 34545, // Large Claw
                           24288: 33550, // Large Scale
                           24356: 33505, // Large Fang
                           24299: 33530, // Large Totem
                           24282: 34035, // Large Venom Sac
                           24276: 33720, // Pile of Crystalline Dust
                         };
                         const t5Ids = [24294, 24341, 24350, 24288, 24356, 24299, 24282, 24276];
                         const total = t5Ids.reduce((sum, id) => 
                           sum + (seliciValues[id] || 0) + (vortusValues[id] || 0) + (shinymetaValues[id] || 0), 0);
                         return total.toLocaleString();
                       })()}</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                         const seliciValues: Record<number, number> = {
                           24294: 339475, // Vial of Powerful Blood
                           24341: 334960, // Large Bone
                           24350: 339190, // Large Claw
                           24288: 339260, // Large Scale
                           24356: 336540, // Large Fang
                           24299: 338230, // Large Totem
                           24282: 337195, // Large Venom Sac
                           24276: 337825, // Pile of Crystalline Dust
                         };
                         const vortusValues: Record<number, number> = {
                           24294: 338435, // Vial of Powerful Blood
                           24341: 337705, // Large Bone
                           24350: 335845, // Large Claw
                           24288: 338365, // Large Scale
                           24356: 337605, // Large Fang
                           24299: 339345, // Large Totem
                           24282: 338115, // Large Venom Sac
                           24276: 337905, // Pile of Crystalline Dust
                         };
                         const shinymetaValues: Record<number, number> = {
                           24294: 33785, // Vial of Powerful Blood
                           24341: 33830, // Large Bone
                           24350: 34545, // Large Claw
                           24288: 33550, // Large Scale
                           24356: 33505, // Large Fang
                           24299: 33530, // Large Totem
                           24282: 34035, // Large Venom Sac
                           24276: 33720, // Pile of Crystalline Dust
                         };
                         const t5Ids = [24294, 24341, 24350, 24288, 24356, 24299, 24282, 24276];
                         const total = t5Ids.reduce((sum, id) => 
                           sum + (seliciValues[id] || 0) + (vortusValues[id] || 0) + (shinymetaValues[id] || 0), 0);
                         const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                         const percentage = total > 0 ? ((total / totalEncryptions) * 100).toFixed(2) : '0.00';
                         return percentage + '%';
                       })()}</td>
                       <td className="p-2 sm:p-4 text-center text-green-200 font-semibold">-</td>
                       <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold">-</td>
                     </tr>
                     {[24294, 24341, 24350, 24356, 24288, 24299, 24282, 24276].map((id) => (
                       <tr key={id} className="border-b border-cyan-800/50">
                         <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                           {itemDetails[id]?.icon && (
                             <Image 
                               src={itemDetails[id].icon} 
                               alt={t(fractalItemNames[id])}
                               width={24} 
                               height={24} 
                               className="w-6 h-6"
                             />
                           )}
                           {itemDetails[id]?.name || t(fractalItemNames[id])}
                         </td>
                         <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">{(() => {
                           // Suma de las tres columnas para este material específico
                           const seliciValues: Record<number, number> = {
                             24294: 339475, // Vial of Powerful Blood
                             24341: 334960, // Large Bone
                             24350: 339190, // Large Claw
                             24288: 339260, // Large Scale
                             24356: 336540, // Large Fang
                             24299: 338230, // Large Totem
                             24282: 337195, // Large Venom Sac
                             24276: 337825, // Pile of Crystalline Dust
                           };
                           const vortusValues: Record<number, number> = {
                             24294: 338435, // Vial of Powerful Blood
                             24341: 337705, // Large Bone
                             24350: 335845, // Large Claw
                             24288: 338365, // Large Scale
                             24356: 337605, // Large Fang
                             24299: 339345, // Large Totem
                             24282: 338115, // Large Venom Sac
                             24276: 337905, // Pile of Crystalline Dust
                           };
                           const shinymetaValues: Record<number, number> = {
                             24294: 33785, // Vial of Powerful Blood
                             24341: 33830, // Large Bone
                             24350: 34545, // Large Claw
                             24288: 33550, // Large Scale
                             24356: 33505, // Large Fang
                             24299: 33530, // Large Totem
                             24282: 34035, // Large Venom Sac
                             24276: 33720, // Pile of Crystalline Dust
                           };
                           const total = (seliciValues[id] || 0) + (vortusValues[id] || 0) + (shinymetaValues[id] || 0);
                           return total.toLocaleString();
                         })()}</td>
                         <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                           const seliciValues: Record<number, number> = {
                             24294: 339475, // Vial of Powerful Blood
                             24341: 334960, // Large Bone
                             24350: 339190, // Large Claw
                             24288: 339260, // Large Scale
                             24356: 336540, // Large Fang
                             24299: 338230, // Large Totem
                             24282: 337195, // Large Venom Sac
                             24276: 337905, // Pile of Crystalline Dust
                           };
                           const vortusValues: Record<number, number> = {
                             24294: 338435, // Vial of Powerful Blood
                             24341: 337705, // Large Bone
                             24350: 335845, // Large Claw
                             24288: 338365, // Large Scale
                             24356: 337605, // Large Fang
                             24299: 339345, // Large Totem
                             24282: 338115, // Large Venom Sac
                             24276: 337905, // Pile of Crystalline Dust
                           };
                           const shinymetaValues: Record<number, number> = {
                             24294: 33785, // Vial of Powerful Blood
                             24341: 33830, // Large Bone
                             24350: 34545, // Large Claw
                             24288: 33550, // Large Scale
                             24356: 33505, // Large Fang
                             24299: 33530, // Large Totem
                             24282: 34035, // Large Venom Sac
                             24276: 33720, // Pile of Crystalline Dust
                           };
                           const total = (seliciValues[id] || 0) + (vortusValues[id] || 0) + (shinymetaValues[id] || 0);
                           const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                           const percentage = total > 0 ? ((total / totalEncryptions) * 100).toFixed(2) : '0.00';
                           return percentage + '%';
                         })()}</td>
                         <td className="p-2 sm:p-4 text-center text-green-200 font-semibold text-sm">
                           {itemDetails[id]?.currentPrice ? formatGoldSilverCopper(itemDetails[id].currentPrice) : '00G 00S 00C'}
                         </td>
                         <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold text-sm">
                           {itemDetails[id]?.currentPrice ? formatGoldSilverCopper(Math.round(itemDetails[id].currentPrice * 0.85)) : '00G 00S 00C'}
                         </td>
                       </tr>
                     ))}
                     
                     {/* Fila de +1 Agony Infusion */}
                     <tr className="border-b border-cyan-800/50 bg-cyan-800/5">
                         <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                         {itemDetails[49424]?.icon && (
                           <Image 
                             src={itemDetails[49424].icon} 
                             alt="+1 Agony Infusion"
                             width={24} 
                             height={24} 
                             className="w-6 h-6"
                           />
                         )}
                         {itemDetails[49424]?.name || '+1 Agony Infusion'}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">{(() => {
                         const seliciValue = 2263678;
                         const vortusValue = 2264266;
                         const shinymetaValue = 226740;
                         const total = seliciValue + vortusValue + shinymetaValue;
                         return total.toLocaleString();
                       })()}</td>
                         <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                           const seliciValue = 2263678;
                           const vortusValue = 2264266;
                           const shinymetaValue = 226740;
                           const total = seliciValue + vortusValue + shinymetaValue;
                           const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                           const percentage = ((total / totalEncryptions) * 100).toFixed(2);
                           return percentage + '%';
                         })()}</td>
                       <td className="p-2 sm:p-4 text-center text-green-200 font-semibold text-sm">
                         {itemDetails[49424]?.currentPrice ? formatGoldSilverCopper(itemDetails[49424].currentPrice) : '00G 00S 00C'}
                       </td>
                       <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold text-sm">
                         {itemDetails[49424]?.currentPrice ? formatGoldSilverCopper(Math.round(itemDetails[49424].currentPrice * 0.85)) : '00G 00S 00C'}
                       </td>
                     </tr>

                     {/* Fractal Encryption Key*/}

                     <tr className="border-b border-cyan-800/50 bg-cyan-800/5">
                       <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                         {itemDetails[70438]?.icon && (
                           <Image 
                             src={itemDetails[70438].icon} 
                             alt="Fractal Encryption Key"
                             width={24} 
                             height={24} 
                             className="w-6 h-6"
                           />
                         )}
                         {itemDetails[70438]?.name || 'Fractal Encryption Key'}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">{(() => {
                         const seliciValue = 99812;
                         const vortusValue = 2264266;
                         const shinymetaValue = 226740;
                         const total = seliciValue + vortusValue + shinymetaValue;
                         return total.toLocaleString();
                       })()}</td>
                         <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                           const seliciValue = 2263678;
                           const vortusValue = 2264266;
                           const shinymetaValue = 226740;
                           const total = seliciValue + vortusValue + shinymetaValue;
                           const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                           const percentage = ((total / totalEncryptions) * 100).toFixed(2);
                           return percentage + '%';
                         })()}</td>
                       <td className="p-2 sm:p-4 text-center text-green-200 font-semibold text-sm">
                         {itemDetails[70438]?.currentPrice ? formatGoldSilverCopper(itemDetails[70438].currentPrice) : '00G 00S 00C'}
                       </td>
                       <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold text-sm">
                         {itemDetails[70438]?.currentPrice ? formatGoldSilverCopper(Math.round(itemDetails[70438].currentPrice * 0.85)) : '00G 00S 00C'}
                       </td>
                     </tr>
                     
                     {/* Handful of Fractal Relics*/}

                     <tr className="border-b border-cyan-800/50 bg-cyan-800/5">
                       <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                         {itemDetails[79792]?.icon && (
                           <Image 
                             src={itemDetails[79792].icon} 
                             alt="Handful of Fractal Relics"
                             width={24} 
                             height={24} 
                             className="w-6 h-6"
                           />
                         )}
                         {itemDetails[79792]?.name || 'Handful of Fractal Relics'}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">{(() => {
                         const seliciValue = 66795;
                         const vortusValue = 67281;
                         const shinymetaValue = 6883;
                         const total = seliciValue + vortusValue + shinymetaValue;
                         return total.toLocaleString();
                       })()}</td>
                         <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                           const seliciValue = 66795;
                           const vortusValue = 67281;
                           const shinymetaValue = 6883;
                           const total = seliciValue + vortusValue + shinymetaValue;
                           const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                           const percentage = ((total / totalEncryptions) * 100).toFixed(2);
                           return percentage + '%';
                         })()}</td>
                       <td className="p-2 sm:p-4 text-center text-green-200 font-semibold text-sm">
                         {itemDetails[79792]?.currentPrice ? formatGoldSilverCopper(itemDetails[79792].currentPrice) : '00G 00S 00C'}
                       </td>
                       <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold text-sm">
                         {itemDetails[79792]?.currentPrice ? formatGoldSilverCopper(Math.round(itemDetails[79792].currentPrice * 0.85)) : '00G 00S 00C'}
                       </td>
                     </tr>

                     {/* Mini Professor Mew*/}

                     <tr className="border-b border-cyan-800/50 bg-cyan-800/5">
                       <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                         {itemDetails[74268]?.icon && (
                           <Image 
                             src={itemDetails[74268].icon} 
                             alt="Mini Professor Mew"
                             width={24} 
                             height={24} 
                             className="w-6 h-6"
                           />
                         )}
                         {itemDetails[74268]?.name || 'Mini Professor Mew'}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">{(() => {
                         const seliciValue = 66795;
                         const vortusValue = 67281;
                         const shinymetaValue = 6883;
                         const total = seliciValue + vortusValue + shinymetaValue;
                         return total.toLocaleString();
                       })()}</td>
                         <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                           const seliciValue = 66795;
                           const vortusValue = 67281;
                           const shinymetaValue = 6883;
                           const total = seliciValue + vortusValue + shinymetaValue;
                           const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                           const percentage = ((total / totalEncryptions) * 100).toFixed(2);
                           return percentage + '%';
                         })()}</td>
                       <td className="p-2 sm:p-4 text-center text-green-200 font-semibold text-sm">
                         {itemDetails[74268]?.currentPrice ? formatGoldSilverCopper(itemDetails[74268].currentPrice) : '00G 00S 00C'}
                       </td>
                       <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold text-sm">
                         {itemDetails[74268]?.currentPrice ? formatGoldSilverCopper(Math.round(itemDetails[74268].currentPrice * 0.85)) : '00G 00S 00C'}
                       </td>
                     </tr>

                     {/* Item ID 67261 */}
                     <tr className="border-b border-cyan-800/50 bg-cyan-800/5">
                       <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                         {itemDetails[67261]?.icon && (
                           <Image 
                             src={itemDetails[67261].icon} 
                             alt={itemDetails[67261]?.name || "Item 67261"}
                             width={24} 
                             height={24} 
                             className="w-6 h-6"
                           />
                         )}
                         {itemDetails[67261]?.name || 'Item 67261'}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">355</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                         const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                         const percentage = ((355 / totalEncryptions) * 100).toFixed(2);
                         return percentage + '%';
                       })()}</td>
                       <td className="p-2 sm:p-4 text-center text-green-200 font-semibold text-sm">
                         {itemDetails[67261]?.currentPrice ? formatGoldSilverCopper(itemDetails[67261].currentPrice) : '00G 00S 00C'}
                       </td>
                       <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold text-sm">
                         {itemDetails[67261]?.currentPrice ? formatGoldSilverCopper(Math.round(itemDetails[67261].currentPrice * 0.85)) : '00G 00S 00C'}
                       </td>
                     </tr>

                     {/* Ascended Materials */}
                     <tr className="border-b border-purple-800/50 bg-purple-800/20">
                       <td className="p-2 sm:p-3 text-purple-300 font-semibold">{t('fractals.table.ascendedMaterials')}</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">6,365,460</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                         const total = 6365460;
                         const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                         const percentage = ((total / totalEncryptions) * 100).toFixed(2);
                         return percentage + '%';
                       })()}</td>
                       <td className="p-2 sm:p-4 text-center text-green-200 font-semibold">-</td>
                       <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold">-</td>
                     </tr>

                     {/* Item ID 46733 */}
                     <tr className="border-b border-cyan-800/50 bg-cyan-800/5">
                       <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                         {itemDetails[46733]?.icon && (
                           <Image 
                             src={itemDetails[46733].icon} 
                             alt={itemDetails[46733]?.name || "Item 46733"}
                             width={24} 
                             height={24} 
                             className="w-6 h-6"
                           />
                         )}
                         {itemDetails[46733]?.name || 'Item 46733'}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">2,117,577</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                         const total = 2117577;
                         const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                         const percentage = ((total / totalEncryptions) * 100).toFixed(2);
                         return percentage + '%';
                       })()}</td>
                       <td className="p-2 sm:p-4 text-center text-green-200 font-semibold text-sm">
                         {itemDetails[46733]?.currentPrice ? formatGoldSilverCopper(itemDetails[46733].currentPrice) : '00G 00S 00C'}
                       </td>
                       <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold text-sm">
                         {itemDetails[46733]?.currentPrice ? formatGoldSilverCopper(Math.round(itemDetails[46733].currentPrice * 0.85)) : '00G 00S 00C'}
                       </td>
                     </tr>

                     {/* Item ID 46735 */}
                     <tr className="border-b border-cyan-800/50 bg-cyan-800/5">
                       <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                         {itemDetails[46735]?.icon && (
                           <Image 
                             src={itemDetails[46735].icon} 
                             alt={itemDetails[46735]?.name || "Item 46735"}
                             width={24} 
                             height={24} 
                             className="w-6 h-6"
                           />
                         )}
                         {itemDetails[46735]?.name || 'Item 46735'}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">2,124,083</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                         const total = 2124083;
                         const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                         const percentage = ((total / totalEncryptions) * 100).toFixed(2);
                         return percentage + '%';
                       })()}</td>
                       <td className="p-2 sm:p-4 text-center text-green-200 font-semibold text-sm">
                         {itemDetails[46735]?.currentPrice ? formatGoldSilverCopper(itemDetails[46735].currentPrice) : '00G 00S 00C'}
                       </td>
                       <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold text-sm">
                         {itemDetails[46735]?.currentPrice ? formatGoldSilverCopper(Math.round(itemDetails[46735].currentPrice * 0.85)) : '00G 00S 00C'}
                       </td>
                     </tr>

                     {/* Item ID 46731 */}
                     <tr className="border-b border-cyan-800/50 bg-cyan-800/5">
                       <td className="p-2 sm:p-3 text-cyan-300 font-semibold flex items-center gap-2">
                         {itemDetails[46731]?.icon && (
                           <Image 
                             src={itemDetails[46731].icon} 
                             alt={itemDetails[46731]?.name || "Item 46731"}
                             width={24} 
                             height={24} 
                             className="w-6 h-6"
                           />
                         )}
                         {itemDetails[46731]?.name || 'Item 46731'}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">2,123,800</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                         const total = 2123800;
                         const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                         const percentage = ((total / totalEncryptions) * 100).toFixed(2);
                         return percentage + '%';
                       })()}</td>
                       <td className="p-2 sm:p-4 text-center text-green-200 font-semibold text-sm">
                         {itemDetails[46731]?.currentPrice ? formatGoldSilverCopper(itemDetails[46731].currentPrice) : '00G 00S 00C'}
                       </td>
                       <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold text-sm">
                         {itemDetails[46731]?.currentPrice ? formatGoldSilverCopper(Math.round(itemDetails[46731].currentPrice * 0.85)) : '00G 00S 00C'}
                       </td>
                     </tr>

                     {/* Aetherized Skins */}
                     <tr className="border-b border-green-800/50 bg-green-800/20">
                       <td className="p-2 sm:p-3 text-green-300 font-semibold flex items-center gap-2">
                         <Image 
                           src="https://render.guildwars2.com/file/C5DA0BE8047D800F72D9CE2B62E5036754D7E3DB/607547.png"
                           alt={t('fractals.items.aetherizeSkins')}
                           width={24} 
                           height={24} 
                           className="w-6 h-6"
                         />
                         {t('fractals.items.aetherizeSkins')}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">449</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                         const total = 449;
                         const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                         const percentage = ((total / totalEncryptions) * 100).toFixed(2);
                         return percentage + '%';
                       })()}</td>
                       <td className="p-2 sm:p-4 text-center text-green-200 font-semibold text-sm">
                         {itemDetails[46731]?.currentPrice ? formatGoldSilverCopper(itemDetails[46731].currentPrice) : '00G 00S 00C'}
                       </td>
                       <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold text-sm">
                         {itemDetails[46731]?.currentPrice ? formatGoldSilverCopper(Math.round(itemDetails[46731].currentPrice * 0.85)) : '00G 00S 00C'}
                       </td>
                     </tr>

                     {/* Ascended Recipes */}
                     <tr className="border-b border-pink-800/50 bg-pink-800/20">
                       <td className="p-2 sm:p-3 text-pink-300 font-semibold flex items-center gap-2">
                         <Image 
                           src="https://render.guildwars2.com/file/162616E65F5D247791C12B0BA27442536637E1D8/631170.png"
                           alt={t('fractals.items.ascendedRecipes')}
                           width={24} 
                           height={24} 
                           className="w-6 h-6"
                         />
                         {t('fractals.items.ascendedRecipes')}
                       </td>
                       <td className="p-2 sm:p-3 text-center text-yellow-300 font-bold">15,804</td>
                       <td className="p-2 sm:p-3 text-center text-yellow-200 font-bold">{(() => {
                         const total = 15804;
                         const totalEncryptions = ENCRYPTION_DATA.seliciZanar.opened + ENCRYPTION_DATA.vortus.opened + ENCRYPTION_DATA.shinymeta.opened;
                         const percentage = ((total / totalEncryptions) * 100).toFixed(2);
                         return percentage + '%';
                       })()}</td>
                       <td className="p-2 sm:p-4 text-center text-green-200 font-semibold text-sm">00G 00S 00C</td>
                       <td className="p-2 sm:p-4 text-center text-blue-200 font-semibold text-sm">00G 00S 00C</td>
                     </tr>

                   </tbody>
                 </table>
               </div>
             </div>





            {/* Profits */}
            <div className="bg-cyan-900/20 backdrop-blur-sm border border-cyan-700/30 rounded-lg p-3 sm:p-4 md:p-6 shadow-2xl mb-6 md:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-cyan-300 mb-3 md:mb-4">{t('fractals.sections.profits')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                   <thead>
                     <tr className="border-b border-cyan-700/50 bg-cyan-800/30">
                       <th className="text-left p-2 text-cyan-200 font-semibold">{t('fractals.profits.table.boxKeyTypes')}</th>
                       <th className="p-2 text-cyan-200 font-semibold">{t('fractals.profits.table.box')}</th>
                       <th className="p-2 text-cyan-200 font-semibold">{t('fractals.profits.table.key')}</th>
                       <th className="p-2 text-cyan-200 font-semibold">{t('fractals.profits.table.total')}</th>
                       <th className="p-2 text-cyan-200 font-semibold">{t('fractals.profits.table.profitAvg')}</th>
                       <th className="p-2 text-cyan-200 font-semibold">{t('fractals.profits.table.roi')}</th>
                     </tr>
                   </thead>
                   <tbody>
                      {[
                        { label: t('fractals.profits.boxKey90'), boxItemId: 75919, boxRatio: 0.9, keyItemId: 73248, keyRatio: 0.9 },
                        { label: t('fractals.profits.boxKeyBuyOrder'), boxItemId: 75919, boxRatio: 1.0, keyItemId: 73248, keyRatio: 1.0 },
                        { label: t('fractals.profits.boxKeySellOrder'), boxItemId: 75919, boxRatio: 1.0, keyItemId: 73248, keyRatio: 1.0},
                        { label: t('fractals.profits.boxMinKey20s'), boxItemId: 75919, boxRatio: (() => {
                          const prices = [
                            (itemDetails[75919]?.currentPrice || 0) * 0.9,  // Caja + Llave 90%
                            (itemDetails[75919]?.buyPrice || 0) * 1.0,      // Caja + Llave BuyOrder
                            (itemDetails[75919]?.currentPrice || 0) * 1.0   // Caja + Llave SellOrder
                          ];
                          const minPrice = Math.min(...prices);
                          if (minPrice === (itemDetails[75919]?.currentPrice || 0) * 0.9) return 0.9;
                          if (minPrice === (itemDetails[75919]?.buyPrice || 0) * 1.0) return 1.0;
                          return 1.0;
                        })(), keyItemId: 73248, keyRatio: 1.0 },
                        { label: t('fractals.profits.boxMinKey25s04c'), boxItemId: 75919, boxRatio: (() => {
                          const prices = [
                            (itemDetails[75919]?.currentPrice || 0) * 0.9,  // Caja + Llave 90%
                            (itemDetails[75919]?.buyPrice || 0) * 1.0,      // Caja + Llave BuyOrder
                            (itemDetails[75919]?.currentPrice || 0) * 1.0   // Caja + Llave SellOrder
                          ];
                          const minPrice = Math.min(...prices);
                          if (minPrice === (itemDetails[75919]?.currentPrice || 0) * 0.9) return 0.9;
                          if (minPrice === (itemDetails[75919]?.buyPrice || 0) * 1.0) return 1.0;
                          return 1.0;
                        })(), keyItemId: 73248, keyRatio: 1.0 },
                        { label: t('fractals.profits.boxMinKey30s'), boxItemId: 75919, boxRatio: (() => {
                          const prices = [
                            (itemDetails[75919]?.currentPrice || 0) * 0.9,  // Caja + Llave 90%
                            (itemDetails[75919]?.buyPrice || 0) * 1.0,      // Caja + Llave BuyOrder
                            (itemDetails[75919]?.currentPrice || 0) * 1.0   // Caja + Llave SellOrder
                          ];
                          const minPrice = Math.min(...prices);
                          if (minPrice === (itemDetails[75919]?.currentPrice || 0) * 0.9) return 0.9;
                          if (minPrice === (itemDetails[75919]?.buyPrice || 0) * 1.0) return 1.0;
                          return 1.0;
                        })(), keyItemId: 73248, keyRatio: 1.0 },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-cyan-800/50 hover:bg-cyan-800/20 transition-colors">
                          <td className="p-2 text-cyan-200 text-sm font-medium">{row.label}</td>
                          <td className="p-2 text-center text-green-400 text-sm">
                            <span className="whitespace-nowrap">
                              {itemDetails[row.boxItemId]?.currentPrice ? formatGoldSilverCopper(Math.round((row.boxItemId === 75919 && row.label === t('fractals.profits.boxKeyBuyOrder') ? (itemDetails[row.boxItemId]?.buyPrice || 0) : (itemDetails[row.boxItemId]?.currentPrice || 0)) * row.boxRatio)) : '—'}
                            </span>
                          </td>
                          <td className="p-2 text-center text-green-400 text-sm">
                            <span className="whitespace-nowrap">
                              {itemDetails[row.keyItemId]?.currentPrice ? formatGoldSilverCopper(Math.round((() => {
                                if (row.label === t('fractals.profits.boxMinKey20s')) return 2000;
                                if (row.label === t('fractals.profits.boxMinKey25s04c')) return 2504;
                                if (row.label === t('fractals.profits.boxMinKey30s')) return 3000;
                                if (row.label === t('fractals.profits.boxKeyBuyOrder')) return (itemDetails[row.keyItemId]?.buyPrice || 0) * row.keyRatio;
                                return (itemDetails[row.keyItemId]?.currentPrice || 0) * row.keyRatio;
                              })())) : '—'}
                            </span>
                          </td>
                          <td className="p-2 text-center text-blue-400 text-sm">
                            <span className="whitespace-nowrap">
                              {itemDetails[row.boxItemId]?.currentPrice ? formatGoldSilverCopper(Math.round((row.boxItemId === 75919 && row.label === t('fractals.profits.boxKeyBuyOrder') ? (itemDetails[row.boxItemId]?.buyPrice || 0) : (itemDetails[row.boxItemId]?.currentPrice || 0)) * row.boxRatio + (() => {
                                if (row.label === t('fractals.profits.boxMinKey20s')) return 2000;
                                if (row.label === t('fractals.profits.boxMinKey25s04c')) return 2504;
                                if (row.label === t('fractals.profits.boxMinKey30s')) return 3000;
                                if (row.label === t('fractals.profits.boxKeyBuyOrder')) return (itemDetails[row.keyItemId]?.buyPrice || 0) * row.keyRatio;
                                return (itemDetails[row.keyItemId]?.currentPrice || 0) * row.keyRatio;
                              })())) : '—'}
                            </span>
                          </td>
                          <td className="p-2 text-center text-yellow-300 font-semibold text-sm">
                            <span className="whitespace-nowrap">
                              {itemDetails[row.boxItemId]?.currentPrice ? (() => {
                                // Calcular el Total (Caja + Llave)
                                const total = (row.boxItemId === 75919 && row.label === t('fractals.profits.boxKeyBuyOrder') ? (itemDetails[row.boxItemId]?.buyPrice || 0) : (itemDetails[row.boxItemId]?.currentPrice || 0)) * row.boxRatio + (() => {
                                  if (row.label === t('fractals.profits.boxMinKey20s')) return 2000;
                                  if (row.label === t('fractals.profits.boxMinKey25s04c')) return 2504;
                                  if (row.label === t('fractals.profits.boxMinKey30s')) return 3000;
                                  if (row.label === t('fractals.profits.boxKeyBuyOrder')) return (itemDetails[row.keyItemId]?.buyPrice || 0) * row.keyRatio;
                                  return (itemDetails[row.keyItemId]?.currentPrice || 0) * row.keyRatio;
                                })();
                                
                                // Calcular Mejor Income Por Caja (valor L19)
                                {/*const dynamicRows = [
                                  { qty: 1650, priceCopper: (itemDetails[24277]?.currentPrice || 0) * 0.9 },
                                  { qty: 1650, priceCopper: (itemDetails[24277]?.buyPrice || 0) },
                                  { qty: 892, priceCopper: (itemDetails[19721]?.currentPrice || 0) * 0.9 },
                                ];
                               */}
                                // Profit AVG = Mejor Income Por Caja - Total
                                const mejorIncomePorCaja = 4853; // 00G 48S 53C en cobre
                                const profitAvg = mejorIncomePorCaja - total;
                                
                                return formatGoldSilverCopper(Math.round(profitAvg));
                              })() : '—'}
                            </span>
                          </td>
                          <td className="p-2 text-center text-purple-300 font-semibold text-sm">
                            <span className="whitespace-nowrap">
                              {itemDetails[row.boxItemId]?.currentPrice ? (() => {
                                const total = (row.boxItemId === 75919 && row.label === t('fractals.profits.boxKeyBuyOrder') ? (itemDetails[row.boxItemId]?.buyPrice || 0) : (itemDetails[row.boxItemId]?.currentPrice || 0)) * row.boxRatio + (() => {
                                  if (row.label === t('fractals.profits.boxMinKey20s')) return 2000;
                                  if (row.label === t('fractals.profits.boxMinKey25s04c')) return 2504;
                                  if (row.label === t('fractals.profits.boxMinKey30s')) return 3000;
                                  if (row.label === t('fractals.profits.boxKeyBuyOrder')) return (itemDetails[row.keyItemId]?.buyPrice || 0) * row.keyRatio;
                                  return (itemDetails[row.keyItemId]?.currentPrice || 0) * row.keyRatio;
                                })();
                                const mejorIncomePorCaja = 4853; // 00G 48S 53C en cobre
                                
                                // ROI = (Mejor Income Por Caja - Total) / Total
                                const roi = ((mejorIncomePorCaja - total) / total) * 100;
                                
                                return `${roi.toFixed(2)}%`;
                              })() : '—'}
                            </span>
                          </td>
                     </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
             </div>

           </>
         )}
       </main>
    </div>
  );
 }