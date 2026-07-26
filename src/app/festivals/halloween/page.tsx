'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  RefreshCw,
  Package,
  TrendingUp,
  Info,
  Calculator,
  Plus,
  List,
  Search,
  X,
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Map
} from 'lucide-react';

interface Gw2Price {
  id: number;
  buys: { quantity: number; unit_price: number };
  sells: { quantity: number; unit_price: number };
}

interface Gw2Item {
  id: number;
  name: string;
  icon: string;
}

interface CalculatorItem {
  id: number;
  name: string;
  icon?: string;
  quantity: number;
  price100: number;
  price85: number;
  total100: number;
  total85: number;
}


interface BoxOpeningPrimaryItem {
  id: number;
  name: string;
  icon: string;
  quantity: number;
  perBox: number;
  pricePerUnit?: number;
  priceBuyPerUnit?: number;
}

const candyCornItems = [
  { id: 36059, name: '', icon: '' }, // Plastic Fangs
  { id: 36060, name: '', icon: '' }, // Chattering Skull
  { id: 36061, name: '', icon: '' }, // Nougat Center
  { id: 36076, name: '', icon: '' }, // Strawberry Ghost
  { id: 36074, name: '', icon: '' }, // Bowl of Candy Corn Custard
  { id: 36041, name: '', icon: '' }, // Piece of Candy Corn
  { id: 67379, name: '', icon: '' }, // Bottle of Batwing Brew
  { id: 36084, name: '', icon: '' }, // Spicy Pumpkin Cookie
  { id: 36081, name: '', icon: '' }, // Glazed Peach Tart
  { id: 67371, name: '', icon: '' }, // Flask of Pumpkin Oil
  { id: 67367, name: '', icon: '' }, // Lump of Crystallized Nougat
  { id: 67368, name: '', icon: '' }, // Sharpening Skull
  { id: 36080, name: '', icon: '' }, // Glazed Pear Tart
  { id: 79679, name: '', icon: '' }, // Hellfire Skeleton Tonic
  { id: 79673, name: '', icon: '' }, // Gargoyle Tonic
  { id: 79677, name: '', icon: '' }, // Shadow Raven Tonic
  { id: 67386, name: '', icon: '' }, // Unopened Endless Bottle of Batwing Brew
  { id: 67382, name: '', icon: '' }, // Recipe: Sharpening Skull
  { id: 67366, name: '', icon: '' }, // Recipe: Pumpkin Oil
  { id: 79647, name: '', icon: '' }, // Polyluminescent Undulating Refractor (Teal)
  { id: 67370, name: '', icon: '' }, // Polyluminescent Undulating Refractor (Green)
  { id: 67372, name: '', icon: '' }, // Polyluminescent Undulating Refractor (Orange)
  { id: 67375, name: '', icon: '' }, // Polyluminescent Undulating Refractor (Black)
  { id: 71931, name: '', icon: '' }, // Karka Helm Skin
  { id: 48807, name: '', icon: '' }, // Gibbering Skull
  { id: 48805, name: '', icon: '' }, // High-Quality Plastic Fangs
  { id: 48806, name: '', icon: '' }, // Tyria's Best Nougat Center
  { id: 36046, name: '', icon: '' }, // Recipe: Superior Rune of the Mad King
  { id: 36048, name: '', icon: '' }, // Recipe: Superior Rune of the Mad King
  { id: 36050, name: '', icon: '' }, // Recipe: Superior Rune of the Mad King
  { id: 36063, name: '', icon: '' }, // Recipe: Superior Sigil of the Night
  { id: 36065, name: '', icon: '' }, // Recipe: Superior Sigil of the Night
  { id: 36067, name: '', icon: '' }, // Recipe: Superior Sigil of the Night
  { id: 67381, name: '', icon: '' }, // Recipe: Maize Balm
  { id: 79638, name: '', icon: '' }, // Jailbroken
  { id: 79637, name: '', icon: '' }, // Grim Pact
  { id: 79690, name: '', icon: '' }, // Onus
  { id: 76642, name: '', icon: '' }, // Vassago
  { id: 76131, name: '', icon: '' }, // Pumpkin Smasher
  { id: 71946, name: '', icon: '' }, // Nest
  { id: 70732, name: '', icon: '' }, // Nightwing
  { id: 89036, name: '', icon: '' }, // The Cure
  { id: 89051, name: '', icon: '' }, // Revenge
  { id: 88997, name: '', icon: '' }, // Soul Conductor
  { id: 79684, name: '', icon: '' }, // Mini Charles the Hellfire Skeleton
  { id: 24300, name: '', icon: '' }, // Elaborate Totem
  { id: 24277, name: '', icon: '' }, // Pile of Crystalline Dust
  { id: 24283, name: '', icon: '' }, // Powerful Venom Sac
  { id: 24289, name: '', icon: '' }, // Armored Scale
  { id: 24295, name: '', icon: '' }, // Vial of Powerful Blood
  { id: 24358, name: '', icon: '' }, // Ancient Bone
  { id: 24351, name: '', icon: '' }, // Vicious Claw
  { id: 24357, name: '', icon: '' }, // Vicious Fang
  { id: 36101, name: '', icon: '' }, // Recipe: Candy Corn Almond Brittle
  { id: 36106, name: '', icon: '' }, // Endless Halloween Tonic
  { id: 36102, name: '', icon: '' }, // Recipe: Strawberry Ghost
  { id: 36103, name: '', icon: '' }, // Recipe: Candy Corn Custard
  { id: 67369, name: '', icon: '' }, // Recipe: Crystallized Nougat
  { id: 67380, name: '', icon: '' }, // Recipe: Batwing Brew
  { id: 36045, name: '', icon: '' }, // Recipe: Major Rune of the Mad King
  { id: 36047, name: '', icon: '' }, // Recipe: Major Rune of the Mad King
  { id: 36049, name: '', icon: '' }, // Recipe: Major Rune of the Mad King
  { id: 36062, name: '', icon: '' }, // Recipe: Major Sigil of the Night
  { id: 36064, name: '', icon: '' }, // Recipe: Major Sigil of the Night
  { id: 36066, name: '', icon: '' }, // Recipe: Major Sigil of the Night
  { id: 67365, name: '', icon: '' }, // Mini Zuzu, Cat of Darkness
  { id: 67383, name: '', icon: '' }, // Old Pillowcase
  { id: 76569, name: '', icon: '' }, // Mini Devil Dog
  { id: 88998, name: '', icon: '' }, // Mini Pumpkin Jack
  { id: 89002, name: '', icon: '' }, // Soul Pastry
  { id: 36109, name: '', icon: '' }, // Candy Corn Tonic
  { id: 36108, name: '', icon: '' }, // Plastic Spider Tonic
  { id: 36107, name: '', icon: '' }, // Concentrating Halloween Tonic
  { id: 36095, name: '', icon: '' }, // Minor Potion of Halloween Slaying
  { id: 72113, name: '', icon: '' }, // Festive Transom
  { id: 92128, name: '', icon: '' }, // Royal Flame Weapon Coffer
  { id: 89065, name: '', icon: '' }, // Ember Infusion
  { id: 79674, name: '', icon: '' }, // Phospholuminescent Infusion
  { id: 36069, name: '', icon: '' }, // Gift of the Moon
  { id: 36058, name: '', icon: '' }, // Gift of Spiders
  { id: 36072, name: '', icon: '' }, // Gift of Souls
  { id: 85384, name: '', icon: '' }, // Touch of Madness
  { id: 89071, name: '', icon: '' }, // Polysaturating Reverberating Infusion (Red)
  { id: 24791, name: '', icon: '' }, // Superior Rune of the Wurm
  { id: 89007, name: '', icon: '' }, // Polysaturating Reverberating Infusion (Gray)
  { id: 36038, name: '', icon: '' }  // Trick-or-Treat Bag
];


// IDs primarios para "Apertura de Cajas" de Halloween
const BOX_OPENING_PRIMARY_IDS: number[] = [
  36059, 36060, 36061, 36076, 36074, 36041, 67379, 36084, 36081, 67371, 67367, 67368, 36080, 36077, 79679, 79673, 79677, 67386, 67382, 67366, 79647, 67370, 67372, 67375, 71931, 48807, 48805, 48806, 36046, 36048, 36050, 36063, 36065, 36067, 67381, 79638, 79637, 79690, 76642, 76131, 71946, 70732, 89036, 89051, 88997, 79684, 24300, 24277, 24283, 24289, 24295, 24358, 24351, 24357, 36101, 36106, 36102, 36103, 67369, 67380, 36045, 36047, 36049, 36062, 36064, 36066, 67365, 67383, 76569, 88998, 89002, 36109, 36108, 36107, 36095, 72113, 92128, 89065, 79674, 36069, 36058, 36072, 85384, 89071, 24791, 89007, 45177, 46733, 46735, 43772, 46731, 45176, 36409, 36408, 36032, 36031, 45178, 45179
];

const BOX_OPENING_PRIMARY_COUNTS: number[] = [
  277294, 277460, 277552, 19045, 19797, 962530, 4825, 9807, 9570, 21333, 20798, 20658, 10679, 13099, 13302, 13265, 13202, 9, 3, 9, 11, 11, 9, 17, 14, 26, 17, 6, 6, 14, 6, 6, 11, 9, 14, 6, 6, 11, 3, 17, 11, 11, 11, 26, 3, 14, 140, 260, 120, 290, 170, 200, 170, 230, 9, 17, 26, 34, 20, 11, 11, 14, 26, 29, 23, 23, 17, 43, 74, 43, 10725, 1682, 1399, 1630, 1519, 14, 9, 1, 2, 4, 5, 5, 11, 18, 11, 7, 14560, 69684, 65337, 352, 69469, 20272, 4831, 4893, 14223, 15358, 9718, 31
];

const TOTAL_OPENED_BOXES = 280000;

// Clave para localStorage
const HALLOWEEN_CALCULATOR_KEY = 'halloween_calculator_data';

import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

const HalloweenPage = () => {
  usePageTitle('pageTitles.halloween', 'Halloween Festival');
  const { t, lang } = useI18n();
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [calculatorItems, setCalculatorItems] = useState<CalculatorItem[]>(() => {
    // Cargar datos guardados del localStorage al inicializar
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(HALLOWEEN_CALCULATOR_KEY);
      if (savedData) {
        try {
          return JSON.parse(savedData);
        } catch (error) {
          console.error('Error loading saved calculator data:', error);
        }
      }
    }
    return [];
  });
  const [isLoadingCalculator, setIsLoadingCalculator] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [availableItems, setAvailableItems] = useState<CalculatorItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  // Precio TP de la Trick-or-Treat Bag (36038)
  const [bagTPPrice, setBagTPPrice] = useState<{ buy: number; sell: number } | null>(null);
  
  // Estado para manejar inputs como strings durante la escritura
  const [inputValues, setInputValues] = useState<Record<number, string>>({});
  
  // Estados para ordenamiento
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Estados para ordenamiento de Items Obtenidos
  const [primarySortField, setPrimarySortField] = useState<string>('quantity');
  const [primarySortDirection, setPrimarySortDirection] = useState<'asc' | 'desc'>('desc');

  

  // Estado para Items Obtenidos (IDs primarios)
  const [primaryItems, setPrimaryItems] = useState<BoxOpeningPrimaryItem[]>([]);
  const [primaryLoading, setPrimaryLoading] = useState(false);

  // Función para guardar datos en localStorage
  const saveCalculatorData = useCallback((data: CalculatorItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(HALLOWEEN_CALCULATOR_KEY, JSON.stringify(data));
    }
  }, []);


  const allItemIds = useMemo(() => [
    ...candyCornItems.map(item => item.id)
  ], []);

  const fetchCalculatorData = useCallback(async () => {
    setIsLoadingCalculator(true);
    try {
      // OPTIMIZADO: Obtener precios de la API de GW2 con compresión
      const pricesResponse = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${allItemIds.join(',')}&lang=${lang}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      const prices = await pricesResponse.json();
      
      // OPTIMIZADO: Obtener detalles de los items con compresión
      const itemsResponse = await fetch(`https://api.guildwars2.com/v2/items?ids=${allItemIds.join(',')}&lang=${lang}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      const items = await itemsResponse.json();

      // Crear mapas
      const pricesMap = prices.reduce((acc: Record<number, Gw2Price>, price: Gw2Price) => {
        acc[price.id] = price;
        return acc;
      }, {} as Record<number, Gw2Price>);

      const itemsMap = items.reduce((acc: Record<number, Gw2Item>, item: Gw2Item) => {
        acc[item.id] = item;
        return acc;
      }, {} as Record<number, Gw2Item>);

      // Crear datos de calculadora
      const calculatorData: CalculatorItem[] = candyCornItems.map(item => {
        const itemInfo = itemsMap[item.id];
        const price = pricesMap[item.id];
        const sellPrice = price?.sells?.unit_price || 0;
        
        return {
          id: item.id,
          name: itemInfo?.name || item.name,
          icon: itemInfo?.icon || '',
          quantity: 0, // Cantidad por defecto
          price100: sellPrice,
          price85: Math.ceil(sellPrice * 0.85),
          total100: 0,
          total85: 0
        };
      });

      setAvailableItems(calculatorData); // Guardar todos los items disponibles
      
      // Preservar los items existentes en la calculadora
      setCalculatorItems(prevItems => {
        const updatedItems = prevItems.map(existingItem => {
          const newItem = calculatorData.find(item => item.id === existingItem.id);
          if (newItem) {
            return {
              ...newItem,
              quantity: existingItem.quantity,
              total100: existingItem.quantity * newItem.price100,
              total85: Math.ceil(existingItem.quantity * newItem.price100 * 0.85)
            };
          }
          return existingItem;
        });
        
        // Guardar en localStorage
        saveCalculatorData(updatedItems);
        return updatedItems;
      });
    } catch (error) {
      console.error('Error fetching calculator data:', error);
    } finally {
      setIsLoadingCalculator(false);
    }
  }, [allItemIds, saveCalculatorData, lang]);

  const fetchHalloweenData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Función simplificada - solo maneja el estado de carga
      // Los datos se obtienen en fetchCalculatorData
    } catch (error) {
      console.error('Error fetching Halloween data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);


  // Cargar nombres e iconos de los IDs primarios (Apertura de Cajas)
  const fetchPrimaryItems = useCallback(async () => {
    try {
      if (BOX_OPENING_PRIMARY_IDS.length === 0) {
        setPrimaryItems([]);
        return;
      }
      setPrimaryLoading(true);
      const ids = BOX_OPENING_PRIMARY_IDS.join(',');
      const [itemsRes, pricesRes] = await Promise.all([
        fetch(`https://api.guildwars2.com/v2/items?ids=${ids}&lang=${lang}`, {  
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        }),
        fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${ids}&lang=${lang}`, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        })
      ]);
      if (!itemsRes.ok) return;
      const data: Gw2Item[] = await itemsRes.json();
      const pricesData: Gw2Price[] = pricesRes.ok ? await pricesRes.json() : [];
      const pricesMap: Record<number, Gw2Price> = {};
      pricesData.forEach((p) => { pricesMap[p.id] = p; });
      // Construir mapa id -> cantidad
      const countById: Record<number, number> = {};
      BOX_OPENING_PRIMARY_IDS.forEach((id, idx) => {
        countById[id] = BOX_OPENING_PRIMARY_COUNTS[idx] ?? 0;
      });
      const mapped: BoxOpeningPrimaryItem[] = data.map((d) => ({
        id: d.id,
        name: d.name,
        icon: d.icon,
        quantity: countById[d.id] ?? 0,
        perBox: (countById[d.id] ?? 0) / TOTAL_OPENED_BOXES,
        pricePerUnit: pricesMap[d.id]?.sells?.unit_price ?? 0,
        priceBuyPerUnit: pricesMap[d.id]?.buys?.unit_price ?? 0,
      }));
      setPrimaryItems(mapped);
    } catch (e) {
      console.error('Error cargando items primarios:', e);
    } finally {
      setPrimaryLoading(false);
    }
  }, [lang]);

  // Cargar precio TP del ítem 36038 directamente desde la API de GW2 (al cargar y cada 5 min)
  const fetchBagPrice = useCallback(async () => {
    try {
      const res = await fetch(`https://api.guildwars2.com/v2/commerce/prices/36038`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      if (!res.ok) return;
      const data = await res.json();
      const buy = data?.buys?.unit_price || 0;
      const sell = data?.sells?.unit_price || 0;
      setBagTPPrice({ buy, sell });
    } catch (e) {
      console.error('Error cargando precio de la bolsa 36038:', e);
    }
  }, []);

  useEffect(() => {
    // Carga inicial
    fetchBagPrice();
    // Intervalo cada 5 minutos
    const intervalId = setInterval(fetchBagPrice, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [fetchBagPrice]);

  useEffect(() => {
    // Sincroniza la pestaña con el hash al cargar y cuando cambie
    if (typeof window === 'undefined') return;
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'Box-Opening') {
        setSelectedSection('box-opening');
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  useEffect(() => {
    if (selectedSection === 'calculators') {
      fetchHalloweenData();
      fetchCalculatorData();
    }
    if (selectedSection === 'box-opening') {
      fetchPrimaryItems();
    }
  }, [selectedSection, fetchHalloweenData, fetchCalculatorData, fetchPrimaryItems]);

  // Auto-actualización de ítems obtenidos cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrimaryItems();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrimaryItems]);

  const formatGoldSilverCopper = (copper: number) => {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperRemaining = copper % 100;
    
    return `${gold.toString().padStart(2, '0')}G ${silver.toString().padStart(2, '0')}S ${copperRemaining.toString().padStart(2, '0')}C`;
  };

  const updateItemQuantity = (id: number, quantity: number) => {
    setCalculatorItems(prev => {
      const updatedItems = prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            quantity,
            total100: item.price100 * quantity,
            total85: Math.ceil(item.price100 * quantity * 0.85)
          };
        }
        return item;
      });
      
      // Guardar en localStorage
      saveCalculatorData(updatedItems);
      return updatedItems;
    });
    
    // Limpiar el valor de input temporal cuando se actualiza el estado
    setInputValues(prev => {
      const newValues = { ...prev };
      delete newValues[id];
      return newValues;
    });
  };

  const addSelectedItems = () => {
    const itemsToAdd = availableItems.filter(item => selectedItems.has(item.id));
    setCalculatorItems(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const newItems = itemsToAdd.filter(item => !existingIds.has(item.id));
      const updatedItems = [...prev, ...newItems];
      
      // Guardar en localStorage
      saveCalculatorData(updatedItems);
      return updatedItems;
    });
    setSelectedItems(new Set());
    setShowItemModal(false);
  };

  const addAllItems = () => {
    setCalculatorItems(availableItems);
    saveCalculatorData(availableItems);
  };

  const removeItem = (id: number) => {
    setCalculatorItems(prev => {
      const updatedItems = prev.filter(item => item.id !== id);
      saveCalculatorData(updatedItems);
      return updatedItems;
    });
  };

  const removeAllItems = () => {
    setCalculatorItems([]);
    saveCalculatorData([]);
  };


  // Función para manejar el ordenamiento
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Función para obtener el icono de ordenamiento
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Función para manejar el ordenamiento de Items Obtenidos
  const handlePrimarySort = (field: string) => {
    if (primarySortField === field) {
      setPrimarySortDirection(primarySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setPrimarySortField(field);
      setPrimarySortDirection('desc');
    }
  };

  // Función para obtener el icono de ordenamiento de Items Obtenidos
  const getPrimarySortIcon = (field: string) => {
    if (primarySortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return primarySortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Función para ordenar los items
  const sortedCalculatorItems = useMemo(() => {
    return [...calculatorItems].sort((a, b) => {
      let aValue: string | number = a[sortField as keyof CalculatorItem] as string | number;
      let bValue: string | number = b[sortField as keyof CalculatorItem] as string | number;
      
      // Para campos numéricos, convertir a número
      if (['quantity', 'price100', 'price85', 'total100', 'total85'].includes(sortField)) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      // Para campos de texto, convertir a minúsculas
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [calculatorItems, sortField, sortDirection]);

  const filteredAvailableItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para ordenar los items de Items Obtenidos
  const sortedPrimaryItems = useMemo(() => {
    const filteredItems = primaryItems.filter(item => item.quantity > 0);
    
    return filteredItems.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (primarySortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'perBox':
          aValue = a.perBox;
          bValue = b.perBox;
          break;
        case 'price':
          aValue = Math.floor((a.pricePerUnit || 0) * 0.85);
          bValue = Math.floor((b.pricePerUnit || 0) * 0.85);
          break;
        case 'totalValue':
          aValue = Math.floor(a.quantity * Math.floor((a.pricePerUnit || 0) * 0.85));
          bValue = Math.floor(b.quantity * Math.floor((b.pricePerUnit || 0) * 0.85));
          break;
        default:
          aValue = a.quantity;
          bValue = b.quantity;
      }

      if (primarySortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [primaryItems, primarySortField, primarySortDirection]);


  return (
    <>
      <div 
        className="min-h-screen relative"
        style={{
          backgroundImage: 'url(/images/backgrounds/Halloween.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay oscuro para mejorar la legibilidad */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Contenido principal */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8">
            {/* Botón Volver */}
            <div className="flex justify-start mb-4">
              <a
                href="/festivals"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 hover:bg-gray-800/90 border border-orange-500/30 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg">
                <ArrowLeft className="w-4 h-4" />
                {t('nav.backToFestivals')}
              </a>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
              <span className="text-3xl mr-3">🎃</span>
              {t('festival.halloween')}
            </h1>
            <p className="text-xl text-gray-300">
              {t('festivals.page.subtitle').replace('{name}', t('festival.halloween'))}
            </p>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-8">
            {([
              { id: 'overview', label: t('festivals.tabs.overview'), icon: Info },
              { id: 'calculators', label: t('festivals.tabs.calculators'), icon: Calculator },
              { id: 'box-opening', label: t('festivals.tabs.boxOpening'), icon: Package },
              { id: 'labyrinth-guide', label: t('pageTitles.halloweenLabyrinth', 'Guía del Laberinto'), icon: Map },
              { id: 'strategies', label: t('festivals.tabs.strategies'), icon: TrendingUp },

            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedSection(tab.id);
                  if (tab.id === 'box-opening' && typeof window !== 'undefined') {
                    window.location.hash = 'Box-Opening';
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedSection === tab.id
                    ? 'bg-orange-600/80 text-white border border-orange-400/50 shadow-lg'
                    : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800/90 border border-orange-500/20 hover:border-orange-500/40'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Content Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Overview Section */}
            {selectedSection === 'overview' && (
              <div className="space-y-8">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <Info className="w-6 h-6 mr-3 text-orange-400" />
                    {t('festival.halloween')}
                  </h2>
                  <p className="text-gray-200 mb-6">{t('halloween.overview.p1')}</p>
                
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-200 shadow-lg">
                      <h3 className="text-white font-semibold mb-2">{t('halloween.cards.bags.title')}</h3>
                      <p className="text-gray-200 text-sm">{t('halloween.cards.bags.desc')}</p>
                    </div>
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-200 shadow-lg">
                      <h3 className="text-white font-semibold mb-2">{t('halloween.cards.lab.title')}</h3>
                      <p className="text-gray-200 text-sm">{t('halloween.cards.lab.desc')}</p>
                    </div>
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-200 shadow-lg">
                      <h3 className="text-white font-semibold mb-2">{t('halloween.cards.corn.title')}</h3>
                      <p className="text-gray-200 text-sm">{t('halloween.cards.corn.desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calculators Section */}
            {selectedSection === 'calculators' && (
              <div className="space-y-8">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <Calculator className="w-6 h-6 mr-3 text-orange-400" />
                      <h2 className="text-2xl font-bold text-white">{t('halloween.calculator.title')}</h2>
                    </div>
                      <button
                      onClick={() => {
                        fetchHalloweenData();
                        fetchCalculatorData();
                      }}
                      disabled={isLoading || isLoadingCalculator}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading || isLoadingCalculator ? 'animate-spin' : ''}`} />
                        {isLoading || isLoadingCalculator ? t('common.updating') : t('common.refreshData')}
                    </button>
                  </div>

                  {/* Custom Calculator */}
                  <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-orange-400" />
                        {t('halloween.calculator.materials')}
                        <span className="ml-2 text-sm text-green-400 font-normal">{t('halloween.calculator.autoSave')}</span>
                    </h3>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-6">
                        <button
                        onClick={() => setShowItemModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200"
                      >
                        <Plus className="w-4 h-4" />
                          {t('common.addItems')}
                      </button>
                        <button
                        onClick={addAllItems}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                      >
                        <List className="w-4 h-4" />
                          {t('common.addAll')}
                      </button>
                      {calculatorItems.length > 0 && (
                        <button
                          onClick={removeAllItems}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                        >
                          <X className="w-4 h-4" />
                          {t('common.removeAll')}
                        </button>
                      )}
                    </div>
                    
                    {/* Calculator Table */}
                    {!isLoadingCalculator && calculatorItems.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-600">
                              <th 
                                className="text-left py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('name')}
                              >
                                <div className="flex items-center gap-1">
                                   {t('table.name')}
                                  {getSortIcon('name')}
                                </div>
                              </th>
                              <th 
                                className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('quantity')}
                              >
                                <div className="flex items-center justify-center gap-1">
                                   {t('table.quantity')}
                                  {getSortIcon('quantity')}
                                </div>
                              </th>
                              <th 
                                className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('price100')}
                              >
                                <div className="flex items-center justify-center gap-1">
                                   {t('table.price85')}
                                  {getSortIcon('price100')}
                                </div>
                              </th>
                              <th 
                                className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('price85')}
                              >
                                <div className="flex items-center justify-center gap-1">
                                   {t('table.price85')}
                                  {getSortIcon('price85')}
                                </div>
                              </th>
                              <th 
                                className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('total100')}
                              >
                                <div className="flex items-center justify-center gap-1">
                                   {t('table.total100')}
                                  {getSortIcon('total100')}
                                </div>
                              </th>
                              <th 
                                className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('total85')}
                              >
                                <div className="flex items-center justify-center gap-1">
                                   {t('table.total85')}
                                  {getSortIcon('total85')}
                                </div>
                              </th>
                              <th className="text-center py-2 text-gray-300">{t('table.action')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedCalculatorItems.map((item) => (
                              <tr key={item.id} className="border-b border-gray-700">
                                <td className="py-2 text-white">
                                  <div className="flex items-center gap-2">
                                    {item.icon && (
                                      <Image
                                        src={item.icon}
                                        alt={item.name}
                                        width={28}
                                        height={28}
                                        className="rounded border border-gray-600"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                      />
                                    )}
                                    <span>{item.name}</span>
                                  </div>
                                </td>
                                <td className="py-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={inputValues[item.id] !== undefined ? inputValues[item.id] : item.quantity.toString()}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      
                                      // Actualizar el valor temporal del input
                                      setInputValues(prev => ({
                                        ...prev,
                                        [item.id]: value
                                      }));
                                      
                                      // Si el campo está vacío, usar 0
                                      if (value === '') {
                                        updateItemQuantity(item.id, 0);
                                      } else {
                                        const numValue = parseInt(value);
                                        // Solo actualizar si es un número válido
                                        if (!isNaN(numValue)) {
                                          updateItemQuantity(item.id, numValue);
                                        }
                                      }
                                    }}
                                    onBlur={(e) => {
                                      // Al perder el foco, asegurar que el valor sea válido
                                      const value = e.target.value;
                                      if (value === '' || isNaN(parseInt(value))) {
                                        updateItemQuantity(item.id, 0);
                                      }
                                    }}
                                    className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center"
                                  />
                                </td>
                                <td className="py-2 text-center text-gray-300">{formatGoldSilverCopper(item.price100)}</td>
                                <td className="py-2 text-center text-gray-300">{formatGoldSilverCopper(item.price85)}</td>
                                <td className="py-2 text-center text-green-400 font-semibold">{formatGoldSilverCopper(item.total100)}</td>
                                <td className="py-2 text-center text-yellow-400 font-semibold">{formatGoldSilverCopper(item.total85)}</td>
                                <td className="py-2 text-center">
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {!isLoadingCalculator && calculatorItems.length === 0 && (
                      <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-orange-500/20">
                        <Package className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                        <p className="text-gray-200 mb-2">{t('halloween.calculator.empty')}</p>
                        <p className="text-gray-300 text-sm">{t('halloween.calculator.emptyTip')}</p>
                      </div>
                    )}

                    {isLoadingCalculator && (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
                        <p className="text-gray-300 mt-2">{t('common.loadingApiData')}</p>
                      </div>
                    )}
                  </div>




                </div>
              </div>
            )}

            {/* Box Opening Section */}
            {selectedSection === 'box-opening' && (
              <>
                <div id="Box-Opening" className="invisible absolute -top-20"></div>
                <div className="space-y-4">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-500/30 rounded-lg p-4 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-3 flex items-center">
                      <Package className="w-6 h-6 mr-3 text-orange-400" />
                    {t('halloween.boxOpening.title')}
                  </h2>
                  
                  <div className="bg-gray-800/60 rounded-lg p-4 mb-4 border border-orange-500/20 shadow-lg">
                    <div className="text-center">
                      <h3 className="text-lg sm:text-xl font-bold text-orange-400 mb-2">{t('halloween.stats.title')}</h3>
                      <p className="text-xl sm:text-2xl font-bold text-white">{TOTAL_OPENED_BOXES.toLocaleString()} {t('halloween.stats.boxesOpened')}</p>
                      <p className="text-gray-300 text-xs mt-1">
                        {t('halloween.stats.credit').split('Vortus43')[0]}
                        <a 
                          href="https://www.twitch.tv/vortus43" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:text-orange-300 underline transition-colors"
                        >
                          Vortus43
                        </a>
                        {t('halloween.stats.credit').split('Vortus43')[1]}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Análisis de Resultados */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                        <TrendingUp className="w-6 h-6 mr-3 text-orange-400" />
                        {t('halloween.stats.resultsAnalysis')}
                    </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-orange-500/20 shadow-lg">
                          <div className="text-2xl font-bold text-orange-400">
                            {primaryItems.filter(i => i.quantity > 0).length.toLocaleString()}
                          </div>
                          <div className="text-gray-200 text-sm">{t('halloween.stats.uniqueItems')}</div>
                          </div>
                        <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-orange-500/20 shadow-lg">
                          <div className="text-2xl font-bold text-green-400">
                            {primaryItems.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()}
                              </div>
                          <div className="text-gray-200 text-sm">{t('halloween.stats.totalItems')}</div>
                              </div>
                        <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-orange-500/20 shadow-lg">
                          <div className="text-2xl font-bold text-yellow-400">
                            {formatGoldSilverCopper(primaryItems.reduce((sum, i) => sum + Math.ceil(i.quantity * ((i.pricePerUnit || 0) * 0.85)), 0))}
                              </div>
                          <div className="text-gray-200 text-sm">{t('halloween.stats.totalValue')} (85%)</div>
                              </div>
                      </div>

                      {/* Contenedores extra: Precio TP, Open or Sell, Valor por bolsa */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        {/* Precio TP de la bolsa (Trick-or-Treat Bag) */}
                        <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-orange-500/20 shadow-lg">
                          {(() => {
                            const priceBuy = bagTPPrice?.buy || 0;
                            return (
                              <>
                                <div className="text-2xl font-bold text-white">{formatGoldSilverCopper(priceBuy)}</div>
                                <div className="text-gray-200 text-sm">{t('halloween.stats.priceTP', 'Precio TP')}</div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Open or Sell */}
                        <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-orange-500/20 shadow-lg">
                          {(() => {
                            const tpBuy = bagTPPrice?.buy || 0; // Precio TP (izquierda)
                            const ev85 = primaryItems.reduce((sum, i) => {
                              const price = i.pricePerUnit || 0;
                              return sum + (i.perBox * Math.floor(price * 0.85));
                            }, 0);
                            const recommendOpen = ev85 > tpBuy;
                            return (
                              <>
                                <div className={`text-2xl font-bold ${recommendOpen ? 'text-green-400' : 'text-red-400'}`}>
                                  {recommendOpen ? t('halloween.stats.open', 'Abrir') : t('halloween.stats.sell', 'Vender')}
                                </div>
                                <div className="text-gray-200 text-xs mt-1">
                                  {recommendOpen 
                                    ? t('halloween.stats.openHint', 'Ahora mismo se recomienda Abrir.')
                                    : t('halloween.stats.sellHint', 'Ahora mismo se recomienda Vender.')}
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Valor por bolsa (EV al 85%) */}
                        <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-orange-500/20 shadow-lg">
                          {(() => {
                            const ev85 = primaryItems.reduce((sum, i) => {
                              const price = i.pricePerUnit || 0;
                              return sum + (i.perBox * Math.floor(price * 0.85));
                            }, 0);
                            return (
                              <>
                                <div className="text-2xl font-bold text-yellow-400">{formatGoldSilverCopper(Math.round(ev85))}</div>
                                <div className="text-gray-200 text-sm">{t('halloween.stats.valuePerBag', 'Valor por bolsa (85%)')}</div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <Calculator className="w-6 h-6 mr-3 text-orange-400" />
                          {t('halloween.obtained.title')}
                        </h3>
                        <button
                          onClick={fetchPrimaryItems}
                          disabled={primaryLoading}
                          className="flex items-center gap-2 px-3 py-1.5 bg-orange-600/80 hover:bg-orange-700/80 disabled:bg-gray-600/60 text-white rounded text-sm transition-all duration-200 hover:scale-105 border border-orange-500/50 disabled:border-gray-500/50"
                        >
                          <RefreshCw className={`w-4 h-4 ${primaryLoading ? 'animate-spin' : ''}`} />
                          {t('common.refreshData', 'Refresh Data')}
                        </button>
                      </div>
                      
                      {primaryItems.length === 0 ? (
                        <div className="bg-gray-800/50 rounded-lg border border-orange-500/20 overflow-hidden shadow-lg">
                          <div className="p-4 text-center text-gray-300">
                            <p>{primaryLoading ? t('common.loadingItems') : t('halloween.obtained.waiting')}</p>
                            <p className="text-sm mt-2">{t('halloween.obtained.sendIds')}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-800/50 rounded-lg border border-orange-500/20 shadow-lg">
                          <div className="p-6">
                            <div className="text-center mb-6">
                              <p className="text-gray-300 text-sm mb-4">{t('halloween.obtained.summaryDesc')}</p>
                              <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4">
                                <p className="text-orange-200 text-sm font-medium">{t('halloween.obtained.proTip')}</p>
                              </div>
                            </div>
                            
                            {/* Tabla de Items Obtenidos */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-600">
                                    <th 
                                      className="text-left py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                      onClick={() => handlePrimarySort('name')}
                                    >
                                      <div className="flex items-center gap-1">
                                        {t('table.name')}
                                        {getPrimarySortIcon('name')}
                                      </div>
                                    </th>
                                    <th 
                                      className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                      onClick={() => handlePrimarySort('quantity')}
                                    >
                                      <div className="flex items-center justify-center gap-1">
                                        {t('table.quantity')}
                                        {getPrimarySortIcon('quantity')}
                                      </div>
                                    </th>
                                    <th 
                                      className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                      onClick={() => handlePrimarySort('perBox')}
                                    >
                                      <div className="flex items-center justify-center gap-1">
                                        {t('table.perBox')}
                                        {getPrimarySortIcon('perBox')}
                                      </div>
                                    </th>
                                    <th 
                                      className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                      onClick={() => handlePrimarySort('price')}
                                    >
                                      <div className="flex items-center justify-center gap-1">
                                      {t('table.price85')}
                                      {getPrimarySortIcon('price')}
                                      </div>
                                    </th>
                                    <th 
                                      className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                      onClick={() => handlePrimarySort('totalValue')}
                                    >
                                      <div className="flex items-center justify-center gap-1">
                                        {t('table.totalValue')} (825%)
                                        {getPrimarySortIcon('totalValue')}
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sortedPrimaryItems.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-700">
                                      <td className="py-2 text-white">
                                        <div className="flex items-center gap-2">
                                          {item.icon && (
                                            <Image
                                              src={item.icon}
                                              alt={item.name}
                                              width={28}
                                              height={28}
                                              className="rounded border border-gray-600"
                                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                            />
                                          )}
                                          <span className="text-sm">{item.name}</span>
                                        </div>
                                      </td>
                                      <td className="py-2 text-center text-gray-300">
                                        {item.quantity.toLocaleString()}
                                      </td>
                                      <td className="py-2 text-center text-gray-300">
                                        {item.perBox.toFixed(6)}
                                      </td>
                                      <td className="py-2 text-center text-gray-300">
                                        {formatGoldSilverCopper(Math.floor((item.pricePerUnit || 0) *0.85))}
                                      </td>
                                      <td className="py-2 text-center text-yellow-400 font-semibold">
                                        {formatGoldSilverCopper(Math.floor(item.quantity * Math.floor((item.pricePerUnit || 0) * 0.85)))}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </>
            )}

            {/* Strategies Section */}
            {selectedSection === 'strategies' && (
              <div className="space-y-8">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-3 text-orange-400" />
                    {t('halloween.strategies.title')}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">{t('halloween.strategies.lab.title')}</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                          <h4 className="text-white font-semibold">{t('halloween.strategies.lab.route')}</h4>
                          <p className="text-gray-300 text-sm">{t('halloween.strategies.lab.routeDesc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('halloween.strategies.lab.group')}</h4>
                          <p className="text-gray-300 text-sm">{t('halloween.strategies.lab.groupDesc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('halloween.strategies.lab.timing')}</h4>
                          <p className="text-gray-300 text-sm">{t('halloween.strategies.lab.timingDesc')}</p>
                        </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">{t('halloween.strategies.tp.title')}</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                          <h4 className="text-white font-semibold">{t('halloween.strategies.tp.early')}</h4>
                          <p className="text-gray-300 text-sm">{t('halloween.strategies.tp.earlyDesc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('halloween.strategies.tp.sell')}</h4>
                          <p className="text-gray-300 text-sm">{t('halloween.strategies.tp.sellDesc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('halloween.strategies.tp.corn')}</h4>
                          <p className="text-gray-300 text-sm">{t('halloween.strategies.tp.cornDesc')}</p>
                        </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Labyrinth Guide Section */}
            {selectedSection === 'labyrinth-guide' && (
              <div className="space-y-8">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <Map className="w-6 h-6 mr-3 text-orange-400" />
                    {t('pageTitles.halloweenLabyrinth', 'Guía del Laberinto de Halloween')}
                  </h2>
                  
                  <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-6 mb-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <span className="text-2xl mr-3">🎃</span>
                      {t('halloween.labyrinth.title', 'Guía Completa del Laberinto')}
                    </h3>
                    <p className="text-gray-200 mb-4">
                      {t('halloween.labyrinth.subtitle', 'Descubre todo lo que necesitas saber para farmear el Laberinto de Halloween eficientemente')}
                    </p>
                    <p className="text-gray-300 text-sm mb-6">
                      {t('halloween.labyrinth.description', 'En esta guía encontrarás builds recomendadas, rutas de farm, estrategias de recompensas y consejos avanzados para maximizar tus ganancias en el Laberinto de Halloween.')}
                    </p>
                    <a
                      href="/festivals/halloween/labyrinth-guide"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg font-semibold"
                    >
                      <span className="text-lg">🎯</span>
                      {t('halloween.labyrinth.viewGuide', 'Ver Guía Completa del Laberinto')}
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-4 hover:border-orange-500/50 transition-all duration-200">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Info className="w-5 h-5 text-orange-400" />
                        {t('halloween.labyrinth.sections.overview', 'Introducción')}
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {t('halloween.labyrinth.overview.description', 'Aprende qué es el Laberinto y cómo maximizar tus ganancias')}
                      </p>
                    </div>
                    
                    <div className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-4 hover:border-orange-500/50 transition-all duration-200">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Package className="w-5 h-5 text-orange-400" />
                        {t('halloween.labyrinth.sections.builds', 'Builds Recomendadas')}
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {t('halloween.labyrinth.builds.description', 'Las mejores builds para farmear eficientemente en el laberinto')}
                      </p>
                    </div>
                    
                    <div className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-4 hover:border-orange-500/50 transition-all duration-200">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Map className="w-5 h-5 text-orange-400" />
                        {t('halloween.labyrinth.sections.routes', 'Rutas de Farm')}
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {t('halloween.labyrinth.routes.description', 'Rutas optimizadas para maximizar tus recompensas')}
                      </p>
                    </div>
                    
                    <div className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-4 hover:border-orange-500/50 transition-all duration-200">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-400" />
                        {t('halloween.labyrinth.sections.rewards', 'Recompensas')}
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {t('halloween.labyrinth.rewards.description', 'Descubre todas las recompensas que puedes obtener')}
                      </p>
                    </div>
                    
                    <div className="bg-gray-800/60 border border-orange-500/30 rounded-lg p-4 hover:border-orange-500/50 transition-all duration-200">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-400" />
                        {t('halloween.labyrinth.advanced.title', 'Consejos Avanzados')}
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {t('halloween.labyrinth.advanced.description', 'Boosters, comida y mejoras para maximizar tu eficiencia')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Item Selection Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 backdrop-blur-md rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden border border-orange-500/30 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-orange-500/30">
              <h3 className="text-xl font-bold text-white">{t('common.selectItems')}</h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="text-gray-400 hover:text-orange-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={t('common.searchItemsPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800/80 border border-orange-500/30 rounded-lg text-white placeholder-gray-400 focus:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              {/* Items Grid */}
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredAvailableItems.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedItems.has(item.id)
                          ? 'bg-orange-600/80 border-orange-500 shadow-lg'
                          : 'bg-gray-800/60 border-orange-500/20 hover:bg-gray-700/80 hover:border-orange-500/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedItems);
                          if (e.target.checked) {
                            newSelected.add(item.id);
                          } else {
                            newSelected.delete(item.id);
                          }
                          setSelectedItems(newSelected);
                        }}
                        className="mr-3 accent-orange-500"
                      />
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{item.name}</div>
                        <div className="text-gray-300 text-xs">{formatGoldSilverCopper(item.price100)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-orange-500/30">
                <div className="text-gray-300 text-sm">
                  {t('common.itemsSelected').replace('{count}', String(selectedItems.size))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowItemModal(false)}
                    className="px-4 py-2 bg-gray-700/80 hover:bg-gray-600/80 text-white rounded-lg transition-colors border border-gray-600/50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={addSelectedItems}
                    disabled={selectedItems.size === 0}
                    className="px-4 py-2 bg-orange-600/80 hover:bg-orange-700/80 disabled:bg-gray-600/60 text-white rounded-lg transition-colors border border-orange-500/50 disabled:border-gray-500/50"
                  >
                    {t('common.addSelected').replace('{count}', String(selectedItems.size))}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HalloweenPage; 