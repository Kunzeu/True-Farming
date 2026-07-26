'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import SalvageGearPageLayout from '@/components/salvage/SalvageGearPageLayout';
import SalvageLoadingState from '@/components/salvage/SalvageLoadingState';
import { gw2WikiUrl } from '@/lib/gw2-wiki';

interface Material {
  id: number;
  name: string;
  icon: string;
  dropRate: number;
  sellPrice: number;
  processedPrice: number;
  category: 'common' | 'fine' | 'masterwork' | 'rare' | 'exotic';
}

interface SalvageResult {
  material: Material;
  quantity: number;
  totalValue: number;
}

// Datos base de materiales con sus drop rates y IDs de GW2 API
// Basado en: https://wiki.guildwars2.com/wiki/Piece_of_Unidentified_Gear/Salvage_Rate
// Salvage after identifying with Runecrafter&apos;s Salvage-o-Matic
const baseMaterials: Omit<Material, 'sellPrice' | 'processedPrice'>[] = [
  { id: 19748, name: "Seda", icon: "", dropRate: 0.34174, category: 'common' },
  { id: 19745, name: "Gasa", icon: "", dropRate: 0.01866, category: 'fine' },
  { id: 19722, name: "Madera T5", icon: "", dropRate: 0.36104, category: 'common' },
  { id: 19725, name: "Madera T6", icon: "", dropRate: 0.02806, category: 'fine' },
  { id: 19729, name: "Cuero T5", icon: "", dropRate: 0.27492, category: 'common' },
  { id: 19732, name: "Cuero T6", icon: "", dropRate: 0.0173, category: 'fine' },
  { id: 19700, name: "Mithril", icon: "", dropRate: 0.4564, category: 'common' },
  { id: 19701, name: "Orica​lco", icon: "", dropRate: 0.03854, category: 'fine' },
  { id: 89140, name: "Mota", icon: "", dropRate: 0.98114, category: 'common' },
  { id: 89182, name: "Dolor", icon: "", dropRate: 0.00378, category: 'rare' },
  { id: 89141, name: "Mejora", icon: "", dropRate: 0.00464, category: 'rare' },
  { id: 89098, name: "Control", icon: "", dropRate: 0.00192, category: 'rare' },
  { id: 89103, name: "Brillantez", icon: "", dropRate: 0.00438, category: 'rare' },
  { id: 89258, name: "Potencia", icon: "", dropRate: 0.00224, category: 'rare' },
  { id: 89216, name: "Habilidad", icon: "", dropRate: 0.0027, category: 'rare' },
  { id: 19721, name: "Ectos", icon: "", dropRate: 0.030708, category: 'exotic' }
];

export default function UnidentifiedGearMasterworkPage() {
  usePageTitle('pageTitles.salvageMasterwork', 'Salvage - Masterwork');
  const { t, lang } = useI18n();
  const [quantity, setQuantity] = useState(250);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [results, setResults] = useState<SalvageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const kitCost = 30;
  const [unidentifiedGearPrice, setUnidentifiedGearPrice] = useState<number | null>(null);
  const [unidentifiedGearName, setUnidentifiedGearName] = useState<string | null>(null);
  const [wikiUrl, setWikiUrl] = useState<string>('');
  const [kitName, setKitName] = useState<string | null>(null);

  // Función para obtener precios desde GW2 API
  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      const itemIds = baseMaterials.map(m => m.id).join(',');
      
      // Obtener información básica de items con idioma
      const apiLang = lang === 'es' ? 'es' : lang === 'de' ? 'de' : lang === 'fr' ? 'fr' : 'en';
      const itemsResponse = await fetch(`https://api.guildwars2.com/v2/items?ids=${itemIds}&lang=${apiLang}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      const itemsData = await itemsResponse.json();
      
      // Obtener precios del Trading Post para materiales
      // OPTIMIZADO: Todas las llamadas restantes con compresión
      const [pricesResponse, unidGearResponse, unidGearItemResponse, kitItemResponse] = await Promise.all([
        fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${itemIds}`, {
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate, br' }
        }),
        fetch('https://api.guildwars2.com/v2/commerce/prices/84731', {
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate, br' }
        }),
        fetch(`https://api.guildwars2.com/v2/items/84731?lang=${apiLang}`, {
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate, br' }
        }),
        fetch(`https://api.guildwars2.com/v2/items/89409?lang=${apiLang}`, {
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate, br' }
        })
      ]);
      
      const pricesData = await pricesResponse.json();
      const unidGearData = await unidGearResponse.json();
      const unidGearItemData = await unidGearItemResponse.json();
      const kitItemData = await kitItemResponse.json();
      
      setUnidentifiedGearName(unidGearItemData.name);
      setKitName(kitItemData.name);
      
      setWikiUrl(
        gw2WikiUrl(
          apiLang === 'es' ? 'Piece of Unidentified Gear' : unidGearItemData.name,
          apiLang
        )
      );
      
      // Usar precio de compra (buys) para calcular costo real
      if (unidGearData.buys && unidGearData.buys.unit_price) {
        setUnidentifiedGearPrice(unidGearData.buys.unit_price);
      } else {
    
      }
      
      // Combinar datos
      const materialsWithPrices: Material[] = baseMaterials.map(baseMaterial => {
        const itemData = itemsData.find((item: { id: number }) => item.id === baseMaterial.id);
        const priceData = pricesData.find((price: { id: number }) => price.id === baseMaterial.id);
        
        // Aplicar diferentes porcentajes según el ID del material
        const materialId = baseMaterial.id;
        let feePercentage = 0.85; // Por defecto 85% para materiales comunes/finos
        
        // IDs que deben calcularse al 90% (materiales raros/exóticos)
        // 89182: Dolor, 89141: Mejora, 89098: Control, 89103: Brillantez
        // 89258: Potencia, 89216: Habilidad, 19721: Ectos
        const highValueIds = [89182, 89141, 89098, 89103, 89258, 89216, 19721];
        if (highValueIds.includes(materialId)) {
          feePercentage = 0.90;
        }
        
        return {
          ...baseMaterial,
          name: itemData?.name || baseMaterial.name,
          icon: itemData?.icon || '',
          sellPrice: priceData?.sells?.unit_price || 0,
          processedPrice: Math.round((priceData?.sells?.unit_price || 0) * feePercentage), // Precio después de fees TP
        };
      });
      
      setMaterials(materialsWithPrices);
      const now = new Date();
      setLastUpdated(now);
              // setNextUpdate(new Date(now.getTime() + 120000)); // 2 minutos después
    } catch (error) {
      console.error('Error fetching prices:', error);
      // Fallback con precios por defecto
      const fallbackMaterials: Material[] = baseMaterials.map(base => ({
        ...base,
        sellPrice: 0,
        processedPrice: 0
      }));
      setMaterials(fallbackMaterials);
    } finally {
      setLoading(false);
    }
  }, [lang, t]);

  // Calcular resultados cuando cambien materiales o cantidad
  useEffect(() => {
    if (materials.length > 0) {
      const newResults: SalvageResult[] = materials.map(material => {
        const expectedQuantity = material.dropRate * quantity; // Sin redondear
        const totalValue = expectedQuantity * material.processedPrice;
        
        return {
          material,
          quantity: expectedQuantity,
          totalValue
        };
      });
      
      setResults(newResults);
    }
  }, [materials, quantity]);

  // Cargar precios al montar el componente y actualizar cada 2 minutos
  useEffect(() => {
    fetchPrices();
    
    // Actualizar precios automáticamente cada 2 minutos (120000 ms)
    const interval = setInterval(() => {
      fetchPrices();
    }, 120000);
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Cálculos de resumen
  const totalMaterialsValue = results.reduce((sum, result) => sum + result.totalValue, 0);
  const totalKitCost = quantity * kitCost;
  const totalCost = unidentifiedGearPrice ? quantity * unidentifiedGearPrice : 0;
  const totalProfit = totalMaterialsValue - totalCost - totalKitCost;

  if (loading) {
    return (
      <>
        <SalvageLoadingState tier="masterwork" />
      </>
    );
  }

  return (
    <>
      <SalvageGearPageLayout
        tier="masterwork"
        note={t('salvageMasterwork.note', 'Prices are obtained in real-time from the GW2 API...')}
        titleFallback={t('salvageMasterwork.title', 'Unidentified Gear - Masterwork')}
        description={t('salvageMasterwork.description', 'Calculate how much gold you earn by opening and salvaging Piece of Unidentified Gear Masterwork')}
        wikiUrl={wikiUrl}
        wikiFallback={t('salvagePages.wikiLinks.masterwork', 'https://wiki.guildwars2.com/wiki/Piece_of_Unidentified_Gear')}
        gearName={unidentifiedGearName}
        kitName={kitName}
        kitTitleFallback={t('salvageMasterwork.runecraftersKit', "Runecrafter's Salvage-o-Matic")}
        kitDescription={t('salvageMasterwork.recommendedKit', 'Recommended kit for Unidentified Gear Masterwork')}
        profitabilityLabel={t('salvagePages.mid', 'Mid')}
        profitabilityClassName="text-green-400"
        quantityLabel={t('salvageMasterwork.quantityLabel', 'Quantity of Unidentified Gear')}
        costGearLabel={t('salvageMasterwork.costGear', 'Cost {quantity} Unid. Gear')}
        kitCost={kitCost}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onRefreshPrices={fetchPrices}
        lastUpdated={lastUpdated}
        totalMaterialsValue={totalMaterialsValue}
        totalCost={totalCost}
        totalKitCost={totalKitCost}
        totalProfit={totalProfit}
        unidentifiedGearPrice={unidentifiedGearPrice}
        results={results}
        refreshButtonClass="bg-green-600 hover:bg-green-500"
      />
    </>
  );
} 
