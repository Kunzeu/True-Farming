import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import FourWindsConfigEditor from '@/components/festivals/FourWindsConfigEditor';
import {
  DEFAULT_FOUR_WINDS_CONFIG,
  FESTIVAL_TOKEN_ITEM_ID,
  type FourWindsConfig,
} from '@/lib/four-winds-config';
import { gw2WikiUrl } from '@/lib/gw2-wiki';
import { maxProfitSS90T6, T6_SS_PRICE_IDS } from '@/lib/t6-ss-profit';
import { CORE_CONVERSION_PRICE_IDS, maxProfitSS90Core } from '@/lib/core-conversion';
import { 
  RefreshCw,
  Package,
  TrendingUp,
  Info,
  Calculator,
  Plus,
  Search,
  X,
  Wind,
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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

interface BoxCalculatorItem {
  id: number;
  name: string;
  icon: string;
  numPerBox: number;
  pricePerUnit: number;
  pricePerBox: number;
  myMaterials: number;
  resultingBoxes: number;
}

const GW2_IDS_CHUNK = 200;

async function fetchGw2Chunked<T extends { id: number }>(url: string, ids: number[]): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += GW2_IDS_CHUNK) {
    const chunk = ids.slice(i, i + GW2_IDS_CHUNK);
    const res = await fetch(`${url}${chunk.join(',')}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) continue;
    const data: T[] = await res.json();
    out.push(...data);
  }
  return out;
}

interface BoxOpeningPrimaryItem {
  id: number;
  name: string;
  nameEn: string;
  icon: string;
  quantity: number;
  perBox: number;
  pricePerUnit?: number;
}

function realItemName(name: string | undefined, id: number): string {
  if (!name || name === `Item ${id}`) return '';
  return name;
}

function mapOpeningItems(
  yearData: { boxes: number; ids: number[]; counts: number[] },
  prev: BoxOpeningPrimaryItem[]
): BoxOpeningPrimaryItem[] {
  const prevById = new Map(prev.map((p) => [p.id, p]));
  const boxes = yearData.boxes || 1;
  return yearData.ids.map((id, idx) => {
    const qty = yearData.counts[idx] ?? 0;
    const old = prevById.get(id);
    const name = realItemName(old?.name, id);
    return {
      id,
      name: name || `Item ${id}`,
      nameEn: realItemName(old?.nameEn, id),
      icon: old?.icon || '',
      quantity: qty,
      perBox: qty / boxes,
      pricePerUnit: old?.pricePerUnit ?? 0,
    };
  });
}

function buildCalculatorItems(cfg: FourWindsConfig, prev?: BoxCalculatorItem[]): BoxCalculatorItem[] {
  return cfg.boxCalculator.map((item) => {
    const existing = prev?.find((p) => p.id === item.id);
    return {
      id: item.id,
      name: item.name,
      icon: existing?.icon || '',
      numPerBox: item.numPerBox,
      pricePerUnit: existing?.pricePerUnit ?? item.pricePerUnit,
      pricePerBox: Math.round((existing?.pricePerUnit ?? item.pricePerUnit) * item.numPerBox),
      myMaterials: existing?.myMaterials ?? 0,
      resultingBoxes: existing
        ? Math.floor((existing.myMaterials || 0) / item.numPerBox)
        : 0,
    };
  });
}

const FOUR_WINDS_CALCULATOR_KEY = 'four_winds_calculator_data';

const FourWindsPage = () => {
  usePageTitle('pageTitles.fourWinds', 'Four Winds Festival');
  const { t, lang } = useI18n();
  const { hasPermission, token, user } = useAuth();
  const canEditFourWinds = hasPermission('moderator');
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const pricesTableRef = useRef<HTMLDivElement | null>(null);
  const openingFetchGen = useRef(0);

  const [fwConfig, setFwConfig] = useState<FourWindsConfig>(() =>
    structuredClone(DEFAULT_FOUR_WINDS_CONFIG)
  );
  const boxCalculatorData = useMemo(
    () => buildCalculatorItems(fwConfig),
    [fwConfig]
  );

  const [boxCalculatorItems, setBoxCalculatorItems] = useState<BoxCalculatorItem[]>(() => {
    const base = buildCalculatorItems(DEFAULT_FOUR_WINDS_CONFIG);
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(FOUR_WINDS_CALCULATOR_KEY);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          return base.map((baseItem) => {
            const savedItem = parsedData.find((item: BoxCalculatorItem) => item.id === baseItem.id);
            return savedItem ? { ...baseItem, ...savedItem, numPerBox: baseItem.numPerBox } : baseItem;
          });
        } catch (error) {
          console.error('Error loading saved calculator data:', error);
        }
      }
    }
    return base;
  });

  const [inputValues, setInputValues] = useState<Record<number, string>>({});
  const [boxCalculatorLoading, setBoxCalculatorLoading] = useState(true);

  const [showItemSelectionModal, setShowItemSelectionModal] = useState(false);
  const [selectedBoxItems, setSelectedBoxItems] = useState<Set<number>>(
    () => new Set(DEFAULT_FOUR_WINDS_CONFIG.boxCalculator.map((item) => item.id))
  );
  const [searchBoxTerm, setSearchBoxTerm] = useState('');
  const FT_ICON = 'https://render.guildwars2.com/file/63E1A0F023D101045B5BA2331C289327687FC7E3/797790.png';
  const TOME_ITEM_ID = 43766;
  const TOME_NAME_EN = 'Tome of Knowledge';
  const [tomeName, setTomeName] = useState(TOME_NAME_EN);
  const [tomeIcon, setTomeIcon] = useState(
    'https://render.guildwars2.com/file/1932B731E2F70F2F1E3D453A4B7C26B24CF647C0/603246.png'
  );
  const FT_PER_TOME = fwConfig.tokensPerTome;
  const [festivalTokensInput, setFestivalTokensInput] = useState('');
  const festivalTokens = Math.max(0, parseInt(festivalTokensInput, 10) || 0);
  const tomesFromTokens = Math.floor(festivalTokens / FT_PER_TOME);
  const tokensRemainder = festivalTokens % FT_PER_TOME;
  const tokensToNextTome = festivalTokens === 0 ? FT_PER_TOME : FT_PER_TOME - tokensRemainder;

  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const openingYears = useMemo(
    () => Object.keys(fwConfig.boxOpening).sort(),
    [fwConfig.boxOpening]
  );
  const [boxOpeningYear, setBoxOpeningYear] = useState<string>('2026');
  const [primaryItems, setPrimaryItems] = useState<BoxOpeningPrimaryItem[]>([]);
  const [maxProfitSS90, setMaxProfitSS90] = useState(0);
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [primarySortField, setPrimarySortField] = useState<'id' | 'name' | 'quantity' | 'perBox' | 'value85'>('id');
  const [primarySortDirection, setPrimarySortDirection] = useState<'asc' | 'desc'>('asc');

  const [zephyriteBoxName, setZephyriteBoxName] = useState<string>(t('fourWinds.zephyrite.name'));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://api.guildwars2.com/v2/items/${TOME_ITEM_ID}?lang=${lang}`
        );
        if (!res.ok) return;
        const data: Gw2Item = await res.json();
        if (cancelled) return;
        setTomeName(data.name || TOME_NAME_EN);
        if (data.icon) setTomeIcon(data.icon);
      } catch (e) {
        console.error('tome item load', e);
      }
    })();
    return () => { cancelled = true; };
  }, [lang]);

  const applyFwConfig = useCallback((cfg: FourWindsConfig) => {
    setFwConfig(cfg);
    setBoxCalculatorItems((prev) => {
      const next = buildCalculatorItems(cfg, prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem(FOUR_WINDS_CALCULATOR_KEY, JSON.stringify(next));
      }
      return next;
    });
    setSelectedBoxItems((prev) => {
      const nextIds = cfg.boxCalculator.map((i) => i.id);
      const nextSet = new Set(nextIds);
      const kept = [...prev].filter((id) => nextSet.has(id));
      const added = nextIds.filter((id) => !prev.has(id));
      return new Set([...kept, ...added]);
    });
    const years = Object.keys(cfg.boxOpening).sort();
    setBoxOpeningYear((y) => {
      const nextY = cfg.boxOpening[y] ? y : years.at(-1) || y;
      const yearData = cfg.boxOpening[nextY];
      openingFetchGen.current += 1;
      setPrimaryItems((prev) => (yearData ? mapOpeningItems(yearData, prev) : []));
      return nextY;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/festivals/four-winds/config');
        if (!res.ok) return;
        const text = await res.text();
        if (text.trimStart().startsWith('<')) return;
        const data = JSON.parse(text);
        if (!cancelled && data.config) applyFwConfig(data.config);
      } catch (e) {
        console.error('four-winds config load', e);
      }
    })();
    return () => { cancelled = true; };
  }, [applyFwConfig]);

  const saveCalculatorData = useCallback((data: BoxCalculatorItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FOUR_WINDS_CALCULATOR_KEY, JSON.stringify(data));
    }
  }, []);

  const formatGoldSilverCopper = (copper: number) => {
    const isNegative = copper < 0;
    const abs = Math.abs(copper);
    const gold = Math.floor(abs / 10000);
    const silver = Math.floor((abs % 10000) / 100);
    const copperRemaining = abs % 100;
    const sign = isNegative ? '-' : '';
    return `${sign}${gold.toLocaleString('en-US', { minimumIntegerDigits: 2 })}G ${silver.toString().padStart(2, '0')}S ${copperRemaining.toString().padStart(2, '0')}C`;
  };

  const buildWikiUrl = (englishName: string, localizedName?: string, itemId?: number) => {
    const en = itemId != null ? realItemName(englishName, itemId) : englishName;
    const loc = itemId != null ? realItemName(localizedName, itemId) : (localizedName || '');
    return gw2WikiUrl(loc || en, lang, {
      itemId,
      englishName: en || undefined,
    });
  };

  const fetchBoxCalculatorData = useCallback(async () => {
    try {
      setBoxCalculatorLoading(true);
      const itemIds = fwConfig.boxCalculator.map(item => item.id).join(',');
      if (!itemIds) {
        setBoxCalculatorLoading(false);
        return;
      }

      const [itemsResponse, pricesResponse] = await Promise.all([
        fetch(`https://api.guildwars2.com/v2/items?ids=${itemIds}&lang=${lang}`, {
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate, br' }
        }),
        fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${itemIds}&lang=${lang}`, {
          headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate, br' }
        })
      ]);

      if (itemsResponse.ok && pricesResponse.ok) {
        const itemsData: Gw2Item[] = await itemsResponse.json();
        const pricesData: Gw2Price[] = await pricesResponse.json();
        const itemsMap: Record<number, Gw2Item> = {};
        const pricesMap: Record<number, Gw2Price> = {};
        itemsData.forEach(item => { itemsMap[item.id] = item; });
        pricesData.forEach(price => { pricesMap[price.id] = price; });

        setBoxCalculatorItems(prevItems => {
          const updatedItems = fwConfig.boxCalculator.map(item => {
            const currentPrice = pricesMap[item.id]?.buys?.unit_price || item.pricePerUnit;
            const pricePerBox = Math.round(currentPrice * item.numPerBox);
            const existingItem = prevItems.find(existing => existing.id === item.id);
            return {
              id: item.id,
              name: itemsMap[item.id]?.name || item.name,
              icon: itemsMap[item.id]?.icon || '',
              numPerBox: item.numPerBox,
              pricePerUnit: currentPrice,
              pricePerBox,
              myMaterials: existingItem?.myMaterials || 0,
              resultingBoxes: existingItem
                ? Math.floor((existingItem.myMaterials || 0) / item.numPerBox)
                : 0,
            };
          });
          saveCalculatorData(updatedItems);
          return updatedItems;
        });
      }
    } catch (error) {
      console.error('Error fetching box calculator data:', error);
    } finally {
      setBoxCalculatorLoading(false);
    }
  }, [lang, fwConfig.boxCalculator, saveCalculatorData]);

  // Función para obtener el nombre de Zephyrite Supply Box
  const fetchZephyriteBoxName = useCallback(() => {
    // Usar la traducción en lugar de la API
    setZephyriteBoxName(t('fourWinds.zephyrite.name'));
  }, [t]);

  // Cargar nombres e iconos de los IDs primarios (Apertura de Cajas)
  const fetchPrimaryItems = useCallback(async () => {
    const yearData = fwConfig.boxOpening[boxOpeningYear];
    if (!yearData) {
      setPrimaryItems([]);
      return;
    }
    const { ids: openingIds, counts, boxes } = yearData;
    const gen = ++openingFetchGen.current;
    try {
      if (openingIds.length === 0) {
        setPrimaryItems([]);
        return;
      }
      setPrimaryLoading(true);
      const priceIds = [...new Set([...openingIds, ...T6_SS_PRICE_IDS, ...CORE_CONVERSION_PRICE_IDS])];
      const [itemsData, pricesData, enData] = await Promise.all([
        fetchGw2Chunked<Gw2Item>(
          `https://api.guildwars2.com/v2/items?lang=${lang}&ids=`,
          openingIds
        ),
        fetchGw2Chunked<Gw2Price>(
          'https://api.guildwars2.com/v2/commerce/prices?ids=',
          priceIds
        ),
        lang !== 'en'
          ? fetchGw2Chunked<Gw2Item>(
              'https://api.guildwars2.com/v2/items?lang=en&ids=',
              openingIds
            )
          : Promise.resolve([] as Gw2Item[]),
      ]);
      if (openingFetchGen.current !== gen) return;
      const itemsMap: Record<number, Gw2Item> = {};
      itemsData.forEach((d) => { itemsMap[d.id] = d; });
      const pricesMap: Record<number, Gw2Price> = {};
      pricesData.forEach((p) => { pricesMap[p.id] = p; });
      const nameEnById: Record<number, string> = {};
      enData.forEach((d) => { nameEnById[d.id] = d.name; });
      setMaxProfitSS90(Math.max(maxProfitSS90T6(pricesMap), maxProfitSS90Core(pricesMap)));
      const boxCount = boxes || 1;
      setPrimaryItems((prev) => {
        if (openingFetchGen.current !== gen) return prev;
        const prevById = new Map(prev.map((p) => [p.id, p]));
        return openingIds.map((id, idx) => {
          const d = itemsMap[id];
          const qty = counts[idx] ?? 0;
          const old = prevById.get(id);
          const dName = realItemName(d?.name, id);
          const name = dName || realItemName(old?.name, id) || `Item ${id}`;
          const nameEn =
            realItemName(nameEnById[id], id) ||
            (lang === 'en' ? dName : '') ||
            realItemName(old?.nameEn, id);
          return {
            id,
            name,
            nameEn,
            icon: d?.icon || old?.icon || '',
            quantity: qty,
            perBox: qty / boxCount,
            pricePerUnit: pricesMap[id]?.sells?.unit_price ?? old?.pricePerUnit ?? 0,
          };
        });
      });
    } catch (e) {
      console.error('Error cargando items primarios:', e);
    } finally {
      if (openingFetchGen.current === gen) setPrimaryLoading(false);
    }
  }, [lang, boxOpeningYear, fwConfig.boxOpening]);

  useEffect(() => {
    const yearData = fwConfig.boxOpening[boxOpeningYear];
    setPrimaryItems((prev) => (yearData ? mapOpeningItems(yearData, prev) : []));
  }, [boxOpeningYear, fwConfig.boxOpening]);

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
    fetchPrimaryItems();
    fetchZephyriteBoxName();
  }, [fetchPrimaryItems, fetchZephyriteBoxName, lang]);

  // Auto-actualización de ítems obtenidos cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrimaryItems();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrimaryItems]);

  const handlePrimarySort = (field: 'id' | 'name' | 'quantity' | 'perBox' | 'value85') => {
    if (primarySortField === field) {
      setPrimarySortDirection(primarySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setPrimarySortField(field);
      setPrimarySortDirection('desc');
    }
  };

  const getPrimarySortIcon = (field: 'id' | 'name' | 'quantity' | 'perBox' | 'value85') => {
    if (primarySortField !== field) return <ArrowUpDown className="w-3.5 h-3.5" />;
    return primarySortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
  };

  // Eliminado el restablecer al orden original

  const sortedPrimaryItems = useMemo(() => {
    const items = [...primaryItems];
    const indexById: Record<number, number> = {};
    (fwConfig.boxOpening[boxOpeningYear]?.ids || []).forEach((id, idx) => {
      indexById[id] = idx;
    });
    items.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (primarySortField === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (primarySortField === 'quantity') {
        aVal = a.quantity;
        bVal = b.quantity;
      } else if (primarySortField === 'id') {
        aVal = indexById[a.id] ?? Number.MAX_SAFE_INTEGER;
        bVal = indexById[b.id] ?? Number.MAX_SAFE_INTEGER;
      } else if (primarySortField === 'value85') {
        aVal = Math.floor((a.pricePerUnit || 0) * 0.85);
        bVal = Math.floor((b.pricePerUnit || 0) * 0.85);
      } else {
        aVal = a.perBox;
        bVal = b.perBox;
      }
      if (primarySortDirection === 'asc') return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    });
    return items;
  }, [primaryItems, primarySortField, primarySortDirection, boxOpeningYear, fwConfig.boxOpening]);

  // (reservado) Métricas de valor por caja – se calcula después de determinar cheapestByBox

  // Función para aplicar selección de items en la calculadora de cajas
  const applyItemSelection = () => {
    setSelectedBoxItems(new Set(Array.from(selectedBoxItems)));
    setShowItemSelectionModal(false);
  };

  // Función para seleccionar todos los items
  const selectAllBoxItems = () => {
    setSelectedBoxItems(new Set(boxCalculatorData.map(item => item.id)));
  };

  // Función para deseleccionar todos los items
  const deselectAllBoxItems = () => {
    setSelectedBoxItems(new Set());
  };

  // Items filtrados para el modal de selección
  const filteredBoxItems = useMemo(() => 
    boxCalculatorItems.filter(item =>
      item.name.toLowerCase().includes(searchBoxTerm.toLowerCase())
    ), [searchBoxTerm, boxCalculatorItems]
  );

  // Función para actualizar cantidad de materiales en la calculadora de cajas
  const updateBoxCalculatorMaterials = (id: number, materials: number) => {
    setBoxCalculatorItems(prev => {
      const updatedItems = prev.map(item => {
        if (item.id === id) {
          const resultingBoxes = Math.floor(materials / item.numPerBox);
          return { ...item, myMaterials: materials, resultingBoxes };
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

  // Función para calcular totales de la calculadora de cajas
  const calculateBoxCalculatorTotals = () => {
    const totalMaterials = boxCalculatorItems.reduce((sum, item) => sum + item.myMaterials, 0);
    const totalBoxes = boxCalculatorItems.reduce((sum, item) => sum + item.resultingBoxes, 0);
    return { totalMaterials, totalBoxes };
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

  // Función para ordenar los items
  const sortedBoxCalculatorItems = useMemo(() => {
    // Sin orden inicial: respetar el orden original
    if (!sortField) return [...boxCalculatorItems];

    return [...boxCalculatorItems].sort((a, b) => {
      let aValue: string | number = a[sortField as keyof BoxCalculatorItem] as string | number;
      let bValue: string | number = b[sortField as keyof BoxCalculatorItem] as string | number;

      if (['numPerBox', 'pricePerUnit', 'pricePerBox', 'myMaterials', 'resultingBoxes'].includes(sortField)) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

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
  }, [boxCalculatorItems, sortField, sortDirection]);

  // Ítem más barato por unidad (entre los seleccionados)
  function getPricePerBoxCopper(item: BoxCalculatorItem): number {
    const perBox6 = Math.round((item.numPerBox || 0) * 1_000_000) / 1_000_000;
    const unit = item.pricePerUnit || 0;
    return Math.round(unit * perBox6);
  }

  const { totalValueCopper, withTomesCopper } = useMemo(() => {
    const totalValueCopper = primaryItems.reduce(
      (sum, i) => sum + i.quantity * (i.pricePerUnit || 0),
      0
    );
    const ft = primaryItems.find((i) => i.id === FESTIVAL_TOKEN_ITEM_ID)?.quantity ?? 0;
    const perTome = FT_PER_TOME || 300;
    const withTomesCopper = Math.round(
      totalValueCopper + (ft / perTome) * maxProfitSS90
    );
    return { totalValueCopper, withTomesCopper };
  }, [primaryItems, FT_PER_TOME, maxProfitSS90]);

  const cheapestByBox = useMemo(() => {
    const items = boxCalculatorItems.filter(
      (i) => selectedBoxItems.has(i.id) && getPricePerBoxCopper(i) > 0
    );
    if (items.length === 0) return null;
    return items.reduce((min, curr) => (getPricePerBoxCopper(curr) < getPricePerBoxCopper(min) ? curr : min));
  }, [boxCalculatorItems, selectedBoxItems]);

  // Valor por caja personalizado según reglas (sin SS/infusiones vs con infusiones+SS)
  const {
    valueNoSSCopper,
    valueWithInfAndSSCopper,
    avgNoSSCopper,
    avgWithInfAndSSCopper
  } = useMemo(() => {
    const isInfusion = (name: string) => name.toLowerCase().includes('infus');
    const isFestivalToken = (item: BoxOpeningPrimaryItem) => {
      if (item.id === FESTIVAL_TOKEN_ITEM_ID) return true;
      const n = (item.name || '').toLowerCase();
      return (
        n.includes('festival token') ||
        n.includes('vale del festival') ||
        n.includes('jeton du festival') ||
        n.includes('festmarke')
      );
    };

    let grossNoInfNoTok = 0; // sin infusiones, sin tokens
    let grossWithInf = 0;     // con infusiones, sin tokens
    let tokensPerBox = 0;     // promedio de FT por caja

    for (const item of primaryItems) {
      const unit = item.pricePerUnit || 0;
      const perBox6 = Math.round((item.perBox || 0) * 1_000_000) / 1_000_000;
      const name = item.name || '';

      if (isFestivalToken(item)) {
        // Volver a usar per-box como al inicio
        tokensPerBox += perBox6;
        continue; // tokens no aportan cobre directo, se convierten a SS
      }

      grossWithInf += perBox6 * unit;
      if (!isInfusion(name)) {
        grossNoInfNoTok += perBox6 * unit;
      }
    }

    const afterNoInfNoTok = Math.round(grossNoInfNoTok * 0.85);
    const afterWithInf = Math.round(grossWithInf * 0.85);

    const ssFromTokens = tokensPerBox / 300; // 300 FT -> 1 SS (por caja)
    const ssCopper = Math.round(ssFromTokens * 28000); // 1 SS = 3g = 30000 cobre

    const costPerBox = cheapestByBox ? getPricePerBoxCopper(cheapestByBox) : 0;

    return {
      valueNoSSCopper: afterNoInfNoTok,
      valueWithInfAndSSCopper: afterWithInf + ssCopper,
      avgNoSSCopper: afterNoInfNoTok - costPerBox,
      avgWithInfAndSSCopper: afterWithInf + ssCopper - costPerBox,
    };
  }, [primaryItems, cheapestByBox]);

  // Ir a Calculators con orden Price/u ascendente y desplazar a la tabla
  const goToCheapestByUnit = () => {
    setSelectedSection('calculators');
    setSortField('pricePerBox');
    setSortDirection('asc');
    if (pricesTableRef.current) {
      pricesTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Reforzar el orden una vez montada la sección para evitar condiciones de carrera
    setTimeout(() => {
      setSortField('pricePerBox');
      setSortDirection('asc');
      if (pricesTableRef.current) {
        pricesTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  };

  // Cargar datos al montar el componente
     useEffect(() => {
       fetchBoxCalculatorData(); // Cargar iconos y precios de la calculadora de cajas
     }, [fetchBoxCalculatorData]);

   // Actualizar datos automáticamente cada 5 minutos
   useEffect(() => {
     const interval = setInterval(() => {
       fetchBoxCalculatorData();
     }, 5 * 60 * 1000); // 5 minutos

     return () => clearInterval(interval);
   }, [fetchBoxCalculatorData]);

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: 'url(/images/backgrounds/Fourwinds.webp)' }}>
      {/* Overlay semitransparente para mejorar legibilidad */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Contenido principal */}
      <div className="relative z-10">
      
             <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* Botón Volver */}
          <div className="flex justify-start mb-4">
            <a
              href="/festivals"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 hover:bg-gray-800/90 border border-green-500/30 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('nav.backToFestivals')}
            </a>
          </div>
          
          <div className="flex items-center justify-center mb-4">
            <Wind className="w-12 h-12 text-cyan-400 mr-3" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{t('festival.fourWinds')}</h1>
          </div>
            <p className="text-base sm:text-xl text-gray-300">{t('festivals.page.subtitle').replace('{name}', t('festival.fourWinds'))}</p>
        </motion.div>

        {canEditFourWinds && (
          <FourWindsConfigEditor
            config={fwConfig}
            token={token}
            userId={user?.id ?? null}
            onSaved={(cfg) => {
              applyFwConfig(cfg);
            }}
          />
        )}

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {([
            { id: 'overview', label: t('festivals.tabs.overview'), icon: Info },
            { id: 'calculators', label: t('festivals.tabs.calculators'), icon: Calculator },
            { id: 'box-opening', label: t('festivals.tabs.boxOpening'), icon: Package, hash: 'Box-Opening' },
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
                  ? 'bg-cyan-600/80 text-white border border-cyan-400/50 shadow-lg'
                  : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800/90 border border-cyan-500/20 hover:border-cyan-500/40'
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
            <div className="space-y-4">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center">
                  <Info className="w-6 h-6 mr-3 text-cyan-400" />
                  {t('festival.fourWinds')}
                </h2>
                <p className="text-gray-200 mb-4">{t('fourWinds.overview.p1')}</p>
                
                {/* Información sobre Zephyrite Supply Box */}
                <div className="bg-blue-900/40 border border-blue-500/50 rounded-lg p-4 mb-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <Package className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-blue-300 font-semibold mb-2">{zephyriteBoxName}</h3>
                      <p className="text-gray-200 text-sm mb-3">
                        {t('fourWinds.zephyrite.description').replace('{name}', zephyriteBoxName)}
                      </p>
                      <a
                        href={buildWikiUrl('Zephyrite Supply Box', zephyriteBoxName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600/80 hover:bg-blue-700/80 text-white rounded text-sm transition-all duration-200 hover:scale-105 border border-blue-500/50"
                      >
                        <Package className="w-4 h-4" />
                        {t('fourWinds.zephyrite.wikiLink')}
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-200 shadow-lg">
                    <h3 className="text-white font-semibold mb-2">{t('fourWinds.cards.gauntlet.title')}</h3>
                    <p className="text-gray-200 text-sm">{t('fourWinds.cards.gauntlet.desc')}</p>
                  </div>
                  <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-200 shadow-lg">
                    <h3 className="text-white font-semibold mb-2">{t('fourWinds.cards.blitz.title')}</h3>
                    <p className="text-gray-200 text-sm">{t('fourWinds.cards.blitz.desc')}</p>
                    </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedSection('calculators')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedSection('calculators'); }}
                    className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/30 hover:border-cyan-400/70 transition-all duration-200 shadow-lg cursor-pointer"
                  >
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Image src={FT_ICON} alt="" width={22} height={22} className="rounded" unoptimized />
                      {t('fourWinds.cards.tokens.title')}
                    </h3>
                    <p className="text-gray-200 text-sm">{t('fourWinds.cards.tokens.desc')}</p>
                    <p className="text-cyan-400 text-xs mt-2 font-semibold">{t('fourWinds.tomeCalc.openCalc', 'Open calculator →')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

                                 {/* Calculators Section */}
            {selectedSection === 'calculators' && (
              <div className="space-y-4">
              {/* Festival Tokens → Tomes */}
              <div className="bg-gradient-to-br from-cyan-950/80 to-gray-900/90 backdrop-blur-sm border-2 border-cyan-400/50 rounded-lg p-5 shadow-2xl shadow-cyan-500/10">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <a href={buildWikiUrl('Festival Token')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:opacity-80">
                      <Image src={FT_ICON} alt="" width={32} height={32} className="rounded" unoptimized />
                      <span>{t('fourWinds.cards.tokens.title')}</span>
                    </a>
                    <span className="text-cyan-400">→</span>
                    <a href={buildWikiUrl(TOME_NAME_EN, tomeName)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:opacity-80">
                      <Image src={tomeIcon} alt={tomeName} width={32} height={32} className="rounded" unoptimized />
                      <span>{tomeName}</span>
                    </a>
                  </h2>
                  <span className="text-cyan-300/90 text-sm font-mono bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded">
                    {FT_PER_TOME} = 1
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
                  <div className="bg-gray-900/70 border border-cyan-500/25 rounded-lg p-4">
                    <label className="flex flex-col gap-2">
                      <a href={buildWikiUrl('Festival Token')} target="_blank" rel="noopener noreferrer" className="text-gray-300 text-sm flex items-center gap-2 hover:text-cyan-300 w-fit">
                        <Image src={FT_ICON} alt="" width={20} height={20} className="rounded" unoptimized />
                        {t('fourWinds.cards.tokens.title')}
                      </a>
                      <input
                        type="number"
                        min="0"
                        value={festivalTokensInput}
                        onChange={(e) => setFestivalTokensInput(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-cyan-500/40 rounded-lg text-white text-xl font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                        placeholder="0"
                      />
                    </label>
                  </div>

                  <div className="hidden md:flex items-center justify-center text-cyan-400 text-3xl font-bold px-2">→</div>

                  <div className="bg-cyan-950/50 border border-cyan-400/40 rounded-lg p-4 flex flex-col justify-center">
                    <a href={buildWikiUrl(TOME_NAME_EN, tomeName)} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider text-cyan-300/80 mb-1 flex items-center gap-2 hover:text-cyan-200 w-fit">
                      <Image src={tomeIcon} alt={tomeName} width={18} height={18} className="rounded" unoptimized />
                      {tomeName}
                    </a>
                    <div className="text-4xl font-bold text-white font-mono leading-none">
                      {tomesFromTokens.toLocaleString('en-US')}
                    </div>
                    <div className="text-gray-300 text-sm mt-2">
                      {t('fourWinds.tomeCalc.remainder', 'Remainder')}:{' '}
                      <span className="text-cyan-300 font-mono">{tokensRemainder}</span>
                      {festivalTokens > 0 && tokensRemainder > 0 && (
                        <span className="text-gray-400"> · {tokensToNextTome} {t('fourWinds.tomeCalc.toNext', 'to next')}</span>
                      )}
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-gray-800 overflow-hidden border border-cyan-500/20">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-200"
                        style={{ width: `${(tokensRemainder / FT_PER_TOME) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

                {/* Calculadora de Cajas */}
               <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 shadow-2xl">
                     <h2 className="text-2xl font-bold text-white mb-3 flex items-center">
                        <Calculator className="w-6 h-6 mr-3 text-cyan-400" />
                        {t('fourWinds.calculator.title')}
                     </h2>

                                  
                   <div className="flex flex-col xl:flex-row gap-4">
                    {/* Tabla de Precios y Datos - IZQUIERDA */}
                     <div className="flex-1 min-w-0" ref={pricesTableRef}>
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-white flex items-center">
                            <Package className="w-6 h-6 mr-3 text-cyan-400" />
                            {t('fourWinds.prices.title')}
                            {boxCalculatorLoading && (
                              <RefreshCw className="w-5 h-5 ml-3 animate-spin text-cyan-400" />
                            )}
                             <span className="ml-2 text-sm text-green-400 font-normal">{t('fourWinds.prices.autoSave')}</span>
                          </h3>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => setShowItemSelectionModal(true)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-700/80 text-white rounded text-sm transition-all duration-200 hover:scale-105 border border-blue-500/50"
                            >
                               <Plus className="w-4 h-4" />
                               {t('common.selectItems')}
                            </button>
                            <button
                              onClick={fetchBoxCalculatorData}
                              disabled={boxCalculatorLoading}
                              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600/80 hover:bg-cyan-700/80 disabled:bg-gray-600/60 text-white rounded text-sm transition-all duration-200 hover:scale-105 border border-cyan-500/50 disabled:border-gray-500/50"
                            >
                               <RefreshCw className={`w-4 h-4 ${boxCalculatorLoading ? 'animate-spin' : ''}`} />
                               {t('common.refreshData')}
                            </button>
                          </div>
                        </div>
                          <div className="overflow-x-auto bg-gray-800/50 rounded-lg border border-cyan-500/20 shadow-lg">
                         <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-cyan-500/30 bg-gray-700/60">
                              <th 
                                className="text-left py-3 px-4 text-gray-200 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('name')}
                              >
                                <div className="flex items-center gap-1">
                                   {t('salvage.table.material')}
                                  {getSortIcon('name')}
                                </div>
                              </th>
                              <th 
                                className="text-center py-3 px-2 text-gray-200 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('numPerBox')}
                              >
                                <div className="flex items-center justify-center gap-1">
                                   {t('fourWinds.table.numPerBox')}
                                  {getSortIcon('numPerBox')}
                                </div>
                              </th>
                              <th 
                                className="text-center py-3 px-2 text-gray-200 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('pricePerUnit')}
                              >
                                <div className="flex items-center justify-center gap-1">
                                   {t('fourWinds.table.pricePerUnit')}
                                  {getSortIcon('pricePerUnit')}
                                </div>
                              </th>
                              <th 
                                className="text-center py-3 px-2 text-gray-200 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('pricePerBox')}
                              >
                                <div className="flex items-center justify-center gap-1">
                                   {t('fourWinds.table.pricePerBox')}
                                  {getSortIcon('pricePerBox')}
                                </div>
                              </th>
                               <th className="text-center py-3 px-2 text-gray-200 font-semibold text-xs uppercase tracking-wider">{t('fourWinds.table.boxes250')}</th>
                               <th className="text-center py-3 px-2 text-gray-200 font-semibold text-xs uppercase tracking-wider">{t('fourWinds.table.boxes2500')}</th>
                               <th className="text-center py-3 px-2 text-gray-200 font-semibold text-xs uppercase tracking-wider">{t('fourWinds.table.boxes25000')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedBoxCalculatorItems.filter(item => selectedBoxItems.has(item.id)).map((item, index) => (
                              <tr key={item.id} className={`border-b border-cyan-500/20 hover:bg-cyan-500/10 transition-all duration-200 group ${index % 2 === 0 ? 'bg-gray-800/40' : 'bg-gray-800/20'}`}>
                                <td className="py-2 px-4 text-white text-sm">
                                  <a
                                    href={buildWikiUrl(
                                      boxCalculatorData.find((b) => b.id === item.id)?.name || item.name,
                                      item.name,
                                      item.id
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center hover:text-cyan-300"
                                  >
                                    {item.icon ? (
                                      <Image 
                                        src={item.icon} 
                                        alt={item.name} 
                                        width={32}
                                        height={32}
                                        className="mr-3 rounded border border-cyan-500/30"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    ) : null}
                                    <span className="font-medium">{item.name}</span>
                                  </a>
                                </td>
                                                                 <td className="py-2 px-2 text-center text-gray-200 font-mono text-sm">
                                   <span>{item.numPerBox}</span>
                                 </td>
                                <td className="py-2 px-2 text-center text-gray-200 whitespace-nowrap font-mono text-sm">{formatGoldSilverCopper(item.pricePerUnit)}</td>
                                <td className="py-2 px-2 text-center text-gray-200 whitespace-nowrap font-mono text-sm">{formatGoldSilverCopper(item.pricePerBox)}</td>
                                <td className="py-2 px-2 text-center text-gray-200 whitespace-nowrap font-mono text-sm">{formatGoldSilverCopper(item.pricePerBox * 250)}</td>
                                <td className="py-2 px-2 text-center text-gray-200 whitespace-nowrap font-mono text-sm">{formatGoldSilverCopper(item.pricePerBox * 2500)}</td>
                                <td className="py-2 px-2 text-center text-gray-200 whitespace-nowrap font-mono text-sm">{formatGoldSilverCopper(item.pricePerBox * 25000)}</td>
                              </tr>
                            ))}
                          </tbody>
                         </table>
                          <div className="md:hidden text-gray-400 text-xs mt-2 text-center">{t('common.swipeHint')}</div>
                      </div>
                    </div>

                                                                                   {/* Calculadora de Cajas - DERECHA */}
                      <div className="flex-1 min-w-0">
                         <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                           <Calculator className="w-6 h-6 mr-3 text-cyan-400" />
                          {t('fourWinds.calculator.title')}
                         </h3>
                                             <div className="overflow-x-auto bg-gray-800/50 rounded-lg border border-cyan-500/20 shadow-lg">
                         <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-cyan-500/30 bg-gray-700/60">
                              <th 
                                className="text-left py-3 px-4 text-gray-200 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('name')}
                              >
                                <div className="flex items-center gap-1">
                                  {t('salvage.table.material')}
                                  {getSortIcon('name')}
                                </div>
                              </th>
                              <th 
                                className="text-center py-3 px-4 text-gray-200 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('myMaterials')}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {t('fourWinds.table.myMaterials')}
                                  {getSortIcon('myMaterials')}
                                </div>
                              </th>
                              <th 
                                className="text-center py-3 px-4 text-gray-200 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('resultingBoxes')}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {t('fourWinds.table.resultingBoxes')}
                                  {getSortIcon('resultingBoxes')}
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                                                         {sortedBoxCalculatorItems.filter(item => selectedBoxItems.has(item.id)).map((item, index) => (
                               <tr key={item.id} className={`border-b border-cyan-500/20 hover:bg-cyan-500/10 transition-all duration-200 group ${index % 2 === 0 ? 'bg-gray-800/40' : 'bg-gray-800/20'}`}>
                                 <td className="py-1 px-4 text-white text-sm">
                                   <a
                                     href={buildWikiUrl(
                                       boxCalculatorData.find((b) => b.id === item.id)?.name || item.name,
                                       item.name,
                                       item.id
                                     )}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="flex items-center hover:text-cyan-300"
                                   >
                                                                           {item.icon ? (
                                        <Image 
                                          src={item.icon} 
                                          alt={item.name} 
                                          width={32}
                                          height={32}
                                          className="mr-3 rounded border border-cyan-500/30"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      ) : null}
                                     <span className="font-medium">{item.name}</span>
                                   </a>
                                 </td>
                                 <td className="py-1 px-4 text-center">
                                                                     <input
                                     type="number"
                                     min="0"
                                     value={inputValues[item.id] !== undefined ? inputValues[item.id] : item.myMaterials.toString()}
                                     onChange={(e) => {
                                       const value = e.target.value;
                                       
                                       // Actualizar el valor temporal del input
                                       setInputValues(prev => ({
                                         ...prev,
                                         [item.id]: value
                                       }));
                                       
                                       // Si el campo está vacío, usar 0
                                       if (value === '') {
                                         updateBoxCalculatorMaterials(item.id, 0);
                                       } else {
                                         const numValue = parseInt(value);
                                         // Solo actualizar si es un número válido
                                         if (!isNaN(numValue)) {
                                           updateBoxCalculatorMaterials(item.id, numValue);
                                         }
                                       }
                                     }}
                                     onBlur={(e) => {
                                       // Al perder el foco, asegurar que el valor sea válido
                                       const value = e.target.value;
                                       if (value === '' || isNaN(parseInt(value))) {
                                         updateBoxCalculatorMaterials(item.id, 0);
                                       }
                                     }}
                                     className="w-24 px-2 py-1 bg-gray-700/80 border border-cyan-500/30 rounded text-white text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200"
                                     placeholder="0"
                                   />
                                </td>
                                                                 <td className="py-1 px-4 text-center text-cyan-400 font-semibold font-mono text-base">{item.resultingBoxes}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="border-t-2 border-cyan-500">
                             <tr className="bg-gray-700/60">
                                                              <td className="py-2 px-4 text-right text-gray-200 font-bold text-base">{t('common.total')}:</td>
                               <td className="py-2 px-4 text-center text-white font-bold text-base font-mono">
                                 {calculateBoxCalculatorTotals().totalMaterials.toLocaleString('en-US')}
                               </td>
                               <td className="py-2 px-4 text-center text-cyan-400 font-bold text-base font-mono">
                                 {calculateBoxCalculatorTotals().totalBoxes.toLocaleString('en-US')}
                               </td>
                            </tr>
                          </tfoot>
                         </table>
                          <div className="md:hidden text-gray-400 text-xs mt-2 text-center">{t('common.swipeHint')}</div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedSection === 'strategies' && (
            <div className="space-y-4">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-3 text-cyan-400" />
                  {t('fourWinds.strategies.title')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">{t('fourWinds.strategies.gauntlet.title')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('fourWinds.strategies.gauntlet.progressive')}</h4>
                          <p className="text-gray-200 text-sm">{t('fourWinds.strategies.gauntlet.progressiveDesc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('fourWinds.strategies.gauntlet.builds')}</h4>
                          <p className="text-gray-200 text-sm">{t('fourWinds.strategies.gauntlet.buildsDesc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('fourWinds.strategies.gauntlet.rewards')}</h4>
                          <p className="text-gray-200 text-sm">{t('fourWinds.strategies.gauntlet.rewardsDesc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">{t('fourWinds.strategies.blitz.title')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('fourWinds.strategies.blitz.coordination')}</h4>
                          <p className="text-gray-200 text-sm">{t('fourWinds.strategies.blitz.coordinationDesc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('fourWinds.strategies.blitz.routes')}</h4>
                          <p className="text-gray-200 text-sm">{t('fourWinds.strategies.blitz.routesDesc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-white font-semibold">{t('fourWinds.strategies.blitz.timing')}</h4>
                          <p className="text-gray-200 text-sm">{t('fourWinds.strategies.blitz.timingDesc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consejos de Farming */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-white mb-4">{t('fourWinds.tips.title')}</h3>
                  <div className="bg-gray-800/60 rounded-lg p-4 border border-cyan-500/20">
                    <ul className="text-gray-200 text-sm space-y-2">
                      <li>• {t('fourWinds.tips.gauntlet')}</li>
                      <li>• {t('fourWinds.tips.groups')}</li>
                      <li>• {t('fourWinds.tips.tokens')}</li>
                      <li>• {t('fourWinds.tips.prices')}</li>
                      <li>• {t('fourWinds.tips.events')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Box Opening Section */}
          {selectedSection === 'box-opening' && (
            <div className="space-y-4">
              <div id="Box-Opening" className="invisible absolute -top-20"></div>
              <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center">
                  <Package className="w-6 h-6 mr-3 text-cyan-400" />
                  {t('fourWinds.boxOpening.title')}
                </h2>
                
                <div className="bg-gray-800/60 rounded-lg p-4 mb-4 border border-cyan-500/20 shadow-lg">
                  <div className="flex justify-center gap-2 mb-3">
                    {openingYears.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setBoxOpeningYear(y)}
                        className={`px-3 py-1 rounded text-sm border transition-colors ${
                          boxOpeningYear === y
                            ? 'bg-cyan-600/80 border-cyan-400 text-white'
                            : 'bg-gray-700/50 border-cyan-500/30 text-gray-300 hover:border-cyan-500/50'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-2">{t('fourWinds.stats.title')}</h3>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {(fwConfig.boxOpening[boxOpeningYear]?.boxes ?? 1).toLocaleString('en-US')}
                    </p>
                    <p className="text-gray-200 text-sm mt-2">{t('fourWinds.stats.desc')}</p>
                    <p className="text-gray-300 text-xs mt-1">
                      {t('fourWinds.stats.credit').split('Vortus43')[0]}
                      <a 
                        href="https://www.twitch.tv/vortus43" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                      >
                        Vortus43
                      </a>
                      {t('fourWinds.stats.credit').split('Vortus43')[1]}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Quick: Precio caja (P.C) como tarjeta tipo "Results Analysis" */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={goToCheapestByUnit}
                      className="bg-gray-800/60 rounded-lg p-3 text-left hover:bg-gray-700/70 border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-200 hover:shadow-lg group"
                    >
                      <div className="text-xs uppercase tracking-wider text-gray-400">{t('fourWinds.quick.pc.title')}</div>
                      <div className="mt-1 text-sm text-gray-200">
                        {cheapestByBox ? (
                          <div className="flex items-center gap-2">
                            {cheapestByBox.icon ? (
                              <Image
                                src={cheapestByBox.icon}
                                alt={cheapestByBox.name}
                                width={32}
                                height={32}
                                className="rounded border border-cyan-500/30 group-hover:border-cyan-500/50 transition-colors"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : null}
                            <span className="text-white font-medium">{cheapestByBox.name}</span>
                            <span className="text-gray-300">— {formatGoldSilverCopper(getPricePerBoxCopper(cheapestByBox))}</span>
                          </div>
                        ) : (
                          t('common.loadingApiData')
                        )}
                      </div>
                      <div className="mt-2 text-cyan-400 text-sm font-semibold group-hover:text-cyan-300 transition-colors">{t('fourWinds.quick.seeInCalculator')}</div>
                    </button>
                    {/* Valor por caja */}
                    <div className="bg-gray-800/60 rounded-lg p-3 border border-cyan-500/30 shadow-lg">
                      <div className="text-xs uppercase tracking-wider text-gray-400">{t('fourWinds.quick.expectedPerBox')}</div>
                      <div className="mt-1 text-cyan-400 font-bold text-lg text-center">{formatGoldSilverCopper(valueNoSSCopper)}</div>
                      <div className="mt-1 text-gray-300 text-xs text-center">{t('fourWinds.quick.variantWithoutSS')}</div>
                      <div className="mt-2 text-gray-200 text-xs text-center">AVG: <span className="text-white font-semibold">{formatGoldSilverCopper(avgNoSSCopper)}</span></div>
                    </div>
                    <div className="bg-gray-800/60 rounded-lg p-3 border border-cyan-500/30 shadow-lg">
                      <div className="text-xs uppercase tracking-wider text-gray-400">{t('fourWinds.quick.expectedPerBox')}</div>
                      <div className="mt-1 text-cyan-400 font-bold text-lg text-center">{formatGoldSilverCopper(valueWithInfAndSSCopper)}</div>
                      <div className="mt-1 text-gray-300 text-xs text-center">{t('fourWinds.quick.variantWithSS')}</div>
                      <div className="mt-2 text-gray-200 text-xs text-center">AVG: <span className="text-white font-semibold">{formatGoldSilverCopper(avgWithInfAndSSCopper)}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                      <TrendingUp className="w-6 h-6 mr-3 text-cyan-400" />
                      {t('fourWinds.stats.resultsAnalysis')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-cyan-500/20 shadow-lg">
                        <div className="text-2xl font-bold text-cyan-400">
                          {primaryItems.filter(i => i.quantity > 0).length.toLocaleString('en-US')}
                        </div>
                         <div className="text-gray-200 text-sm">{t('fourWinds.stats.uniqueItems')}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-cyan-500/20 shadow-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {primaryItems.reduce((sum, i) => sum + i.quantity, 0).toLocaleString('en-US')}
                        </div>
                         <div className="text-gray-200 text-sm">{t('fourWinds.stats.totalItems')}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-cyan-500/20 shadow-lg">
                        <div className="text-2xl font-bold text-yellow-400">
                          {formatGoldSilverCopper(totalValueCopper)}
                        </div>
                         <div className="text-gray-200 text-sm">{t('fourWinds.stats.totalValue')}</div>
                         <div className="mt-2 text-xl font-bold text-amber-300">
                          {formatGoldSilverCopper(withTomesCopper)}
                        </div>
                         <div className="text-gray-300 text-xs">{t('fourWinds.stats.withTomes')}</div>
                      </div>
                      {/* Eliminado el bloque inferior duplicado de valor por caja */}
                    </div>
                  </div>

                  <div className="">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-white flex items-center">
                        <Calculator className="w-6 h-6 mr-3 text-cyan-400" />
                        {t('fourWinds.obtained.title')}
                      </h3>
                      <button
                        onClick={fetchPrimaryItems}
                        disabled={primaryLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600/80 hover:bg-cyan-700/80 disabled:bg-gray-600/60 text-white rounded text-sm transition-all duration-200 hover:scale-105 border border-cyan-500/50 disabled:border-gray-500/50"
                      >
                        <RefreshCw className={`w-4 h-4 ${primaryLoading ? 'animate-spin' : ''}`} />
                        {t('common.refreshData', 'Refresh Data')}
                      </button>
                    </div>
                    {primaryItems.length === 0 ? (
                      <div className="bg-gray-800/50 rounded-lg border border-cyan-500/20 overflow-hidden shadow-lg">
                        <div className="p-4 text-center text-gray-300">
                          <p>{primaryLoading ? t('common.loadingItems') : t('fourWinds.obtained.waiting')}</p>
                          <p className="text-sm mt-2">{t('fourWinds.obtained.sendIds')}</p>
                        </div>
                      </div>
                    ) : (
                                             <div className="overflow-x-auto bg-gray-800/50 rounded-lg border border-cyan-500/20 shadow-lg">
                         <table className="w-full text-base">
                          <thead>
                            <tr className="border-b border-cyan-500/30 bg-gray-700/60">
                              <th onClick={() => handlePrimarySort('name')} className="text-left py-2.5 px-3 text-gray-200 font-semibold text-sm uppercase tracking-wider cursor-pointer select-none">
                                 <div className="flex items-center gap-1.5">{t('salvage.table.material')} {getPrimarySortIcon('name')}</div>
                              </th>
                              <th 
                                onClick={() => handlePrimarySort('value85')} 
                                className="text-center py-2.5 px-2 text-gray-200 font-semibold text-sm uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  {t('fourWinds.table.value85', 'Value 85%')} {getPrimarySortIcon('value85')}
                                </div>
                              </th>
                              <th onClick={() => handlePrimarySort('quantity')} className="text-center py-2.5 px-2 text-gray-200 font-semibold text-sm uppercase tracking-wider cursor-pointer select-none">
                                 <div className="flex items-center justify-center gap-1.5">{t('table.quantity')} {getPrimarySortIcon('quantity')}</div>
                              </th>
                              <th onClick={() => handlePrimarySort('perBox')} className="text-center py-2.5 px-2 text-gray-200 font-semibold text-sm uppercase tracking-wider cursor-pointer select-none">
                                 <div className="flex items-center justify-center gap-1.5">{t('fourWinds.table.perBox')} {getPrimarySortIcon('perBox')}</div>
                              </th>
                              
                              
                            </tr>
                          </thead>
                          <tbody>
                            {sortedPrimaryItems.map((item, index) => (
                              <tr key={item.id} className={`border-b border-cyan-500/20 hover:bg-cyan-500/10 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-800/40' : 'bg-gray-800/20'}`}>
                                <td className="py-2 px-3 text-white">
                                  <a
                                    href={buildWikiUrl(item.nameEn, item.name, item.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 hover:text-cyan-300"
                                  >
                                    {item.icon ? (
                                      <Image src={item.icon} alt={item.name} width={28} height={28} className="rounded border border-cyan-500/30" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : null}
                                    <span className="font-medium text-base">{item.name}</span>
                                  </a>
                                </td>
                                <td className="py-2 px-2 text-center text-gray-200 font-mono text-base">
                                  {formatGoldSilverCopper(Math.round((item.pricePerUnit || 0) * 0.85))}
                                </td>
                                <td className="py-2 px-2 text-center text-gray-200 font-mono text-base">{item.quantity.toLocaleString('en-US')}</td>
                                <td className="py-2 px-2 text-center text-gray-200 font-mono text-base">{item.perBox.toFixed(6)}</td>
                                
                              </tr>
                            ))}
                          </tbody>
                         </table>
                         <div className="md:hidden text-gray-400 text-xs mt-2 text-center">{t('common.swipeHint')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
                 </motion.div>

       </div>

               {/* Item Selection Modal for Box Calculator */}
        {showItemSelectionModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900/95 backdrop-blur-md rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden border border-cyan-500/30 shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-cyan-500/30">
                <h3 className="text-xl font-bold text-white">{t('fourWinds.modal.selectItemsTitle')}</h3>
                <button
                  onClick={() => setShowItemSelectionModal(false)}
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={t('common.searchItemsPlaceholder')}
                      value={searchBoxTerm}
                      onChange={(e) => setSearchBoxTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800/80 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={selectAllBoxItems}
                    className="px-3 py-1 bg-blue-600/80 hover:bg-blue-700/80 text-white rounded text-sm transition-all duration-200 hover:scale-105 border border-blue-500/50"
                  >
                    {t('common.addAll')}
                  </button>
                  <button
                    onClick={deselectAllBoxItems}
                    className="px-3 py-1 bg-red-600/80 hover:bg-red-700/80 text-white rounded text-sm transition-all duration-200 hover:scale-105 border border-red-500/50"
                  >
                    {t('common.removeAll')}
                  </button>
                </div>

                {/* Items Grid */}
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filteredBoxItems.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedBoxItems.has(item.id)
                            ? 'bg-cyan-600/80 border-cyan-500 shadow-lg'
                            : 'bg-gray-800/60 border-cyan-500/20 hover:bg-gray-700/80 hover:border-cyan-500/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBoxItems.has(item.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedBoxItems);
                            if (e.target.checked) {
                              newSelected.add(item.id);
                            } else {
                              newSelected.delete(item.id);
                            }
                            setSelectedBoxItems(newSelected);
                          }}
                          className="mr-3 accent-cyan-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center">
                                                         {item.icon ? (
                               <Image 
                                 src={item.icon} 
                                 alt={item.name} 
                                 width={16}
                                 height={16}
                                 className="mr-2 rounded border border-cyan-500/30"
                                 onError={(e) => {
                                   e.currentTarget.style.display = 'none';
                                 }}
                               />
                             ) : null}
                            <a
                              href={buildWikiUrl(
                                boxCalculatorData.find((b) => b.id === item.id)?.name || item.name,
                                item.name,
                                item.id
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-white font-medium text-sm hover:text-cyan-300"
                            >
                              {item.name}
                            </a>
                          </div>
                          <div className="text-gray-300 text-xs">Num/Box: {item.numPerBox}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-cyan-500/30">
                  <div className="text-gray-300 text-sm">
                    {t('common.itemsSelected').replace('{count}', String(selectedBoxItems.size))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowItemSelectionModal(false)}
                      className="px-4 py-2 bg-gray-700/80 hover:bg-gray-600/80 text-white rounded-lg transition-all duration-200 hover:scale-105 border border-gray-600/50"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={applyItemSelection}
                      disabled={selectedBoxItems.size === 0}
                      className="px-4 py-2 bg-cyan-600/80 hover:bg-cyan-700/80 disabled:bg-gray-600/60 text-white rounded-lg transition-all duration-200 hover:scale-105 border border-cyan-500/50 disabled:border-cyan-500/30"
                    >
                      {t('common.addSelected').replace('{count}', String(selectedBoxItems.size))}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        

        </div>
      </div>
    );
  };

 export default FourWindsPage; 