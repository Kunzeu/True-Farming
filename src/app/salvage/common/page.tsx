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

// Datos base de materiales para Common Unidentified Gear
// Basado en datos actualizados de la tabla proporcionada
const baseMaterials: Omit<Material, 'sellPrice' | 'processedPrice'>[] = [
  { id: 19748, name: "Seda", icon: "", dropRate: 0.29826, category: 'common' },
  { id: 19745, name: "Gasa", icon: "", dropRate: 0.01596, category: 'fine' },
  { id: 19722, name: "Madera T5", icon: "", dropRate: 0.3687, category: 'common' },
  { id: 19725, name: "Madera T6", icon: "", dropRate: 0.03218, category: 'fine' },
  { id: 19729, name: "Cuero T5", icon: "", dropRate: 0.2394, category: 'common' },
  { id: 19732, name: "Cuero T6", icon: "", dropRate: 0.01618, category: 'fine' },
  { id: 19700, name: "Mithril", icon: "", dropRate: 0.43076, category: 'common' },
  { id: 19701, name: "Orica​lco", icon: "", dropRate: 0.03986, category: 'fine' },
  { id: 89140, name: "Mota", icon: "", dropRate: 0.11108, category: 'common' },
  { id: 89182, name: "Pain", icon: "", dropRate: 0.00042, category: 'fine' },
  { id: 89141, name: "Mejora", icon: "", dropRate: 0.00036, category: 'fine' },
  { id: 89098, name: "Control", icon: "", dropRate: 0.00014, category: 'fine' },
  { id: 89103, name: "Brillantez", icon: "", dropRate: 0.00046, category: 'fine' },
  { id: 89258, name: "Potencia", icon: "", dropRate: 0.00034, category: 'fine' },
  { id: 89216, name: "Habilidad", icon: "", dropRate: 0.00032, category: 'fine' },
  { id: 19721, name: "Ectos", icon: "", dropRate: 0.009054, category: 'exotic' }
];

export default function UnidentifiedGearCommonPage() {
  usePageTitle('pageTitles.salvageCommon', 'Salvage - Common');
  const { t, lang } = useI18n();
  const [quantity, setQuantity] = useState(250);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [results, setResults] = useState<SalvageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const kitCost = 3;
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
      const pricesResponse = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${itemIds}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      const pricesData = await pricesResponse.json();
      
      // OPTIMIZADO: Llamadas paralelas con compresión
      const [unidGearResponse, unidGearItemResponse, kitItemResponse] = await Promise.all([
        fetch('https://api.guildwars2.com/v2/commerce/prices/85016', {
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate, br' }
        }),
        fetch(`https://api.guildwars2.com/v2/items/85016?lang=${apiLang}`, {
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate, br' }
        }),
        fetch(`https://api.guildwars2.com/v2/items/44602?lang=${apiLang}`, {
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate, br' }
        })
      ]);
      
      const unidGearData = await unidGearResponse.json();
      const unidGearItemData = await unidGearItemResponse.json();
      const kitItemData = await kitItemResponse.json();
      
      setUnidentifiedGearName(unidGearItemData.name);
      setKitName(kitItemData.name);
      
      setWikiUrl(
        gw2WikiUrl(
          apiLang === 'es' ? 'Piece of Common Unidentified Gear' : unidGearItemData.name,
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
         
                   // Determinar el porcentaje de procesamiento basado en el ID del material
          const getProcessingRate = (materialId: number) => {
            // Materiales que se calculan al 90% según la imagen proporcionada
            const materialsAt90 = [89182, 89141, 89098, 89103, 89258, 89216, 19721];
            
            if (materialsAt90.includes(materialId)) {
              return 0.90; // 90%
            } else {
              return 0.85; // 85% por defecto
            }
          };
         
                   const processingRate = getProcessingRate(baseMaterial.id);
         
         return {
           ...baseMaterial,
           name: itemData?.name || baseMaterial.name,
           icon: itemData?.icon || '',
           sellPrice: priceData?.sells?.unit_price || 0,
           processedPrice: Math.ceil((priceData?.sells?.unit_price || 0) * processingRate), // Precio después de fees TP
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
        // Los drop rates están en formato decimal (ej: 0.29826 = 29.826%)
        // Para calcular la cantidad esperada, multiplicamos por la cantidad
        const expectedQuantity = material.dropRate * quantity;
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
        <SalvageLoadingState tier="common" />
      </>
    );
  }

  return (
    <>
      <SalvageGearPageLayout
        tier="common"
        note={t('salvageCommon.note', 'Prices are obtained in real-time from the GW2 API...')}
        titleFallback={t('salvageCommon.title', 'Unidentified Gear - Common')}
        description={t('salvageCommon.description', 'Calculate how much gold you earn by opening and salvaging Piece of Common Unidentified Gear')}
        wikiUrl={wikiUrl}
        wikiFallback={t('salvagePages.wikiLinks.common', 'https://wiki.guildwars2.com/wiki/Piece_of_Common_Unidentified_Gear')}
        gearName={unidentifiedGearName}
        kitName={kitName}
        kitTitleFallback={t('salvageCommon.copperFedKit', 'Copper-Fed Salvage-o-Matic')}
        kitDescription={t('salvageCommon.recommendedKit', 'Recommended kit for Common Unidentified Gear')}
        profitabilityLabel={t('salvagePages.low', 'Low')}
        profitabilityClassName="text-blue-400"
        quantityLabel={t('salvageCommon.quantityLabel', 'Quantity of Common Unidentified Gear')}
        costGearLabel={t('salvageCommon.costGear', 'Cost {quantity} Common Gear')}
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
        refreshButtonClass="bg-blue-600 hover:bg-blue-500"
      />
    </>
  );
} 