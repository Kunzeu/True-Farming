"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Info, Calculator, TrendingUp, ArrowLeft, Package, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useI18n } from "@/contexts/I18nContext";
import Image from "next/image";

// Interfaces para la tabla de apertura de cajas
interface Gw2Item {
  id: number;
  name: string;
  icon: string;
}

interface Gw2Price {
  id: number;
  buys?: {
    unit_price: number;
  };
  sells?: {
    unit_price: number;
  };
}

interface BoxOpeningItem {
  id: number;
  name: string;
  icon: string;
  quantity: number;
  perBox: number;
  pricePerUnit?: number;
  priceBuyPerUnit?: number;
}

// IDs de items que se pueden obtener de Red Bags (Lucky Red Bag - ID 94653)
const RED_BAG_ITEM_IDS: number[] = [
  // Agregar IDs de items que se obtienen de Red Bags
  68638, 77699, 68636, 68632, 68635, 68633, 104158, 104194, 68634, 68640, 104154, 68637
];

// Cantidades obtenidas por cada item (datos de ejemplo)
const RED_BAG_ITEM_COUNTS: number[] = [
  1321153, 9261, 9286, 9185, 8901, 9006, 485, 12190, 5342, 5, 63, 22887
];

const TOTAL_OPENED_RED_BAGS = 1208833; // Número total de Red Bags abiertos

// IDs de items que se pueden obtener de Divine Envelopes (ID 94653)
const DIVINE_ENVELOPE_ITEM_IDS: number[] = [
  // Items comunes de Divine Envelopes
  68634, 77699, 68636, 68632, 68635, 68633, 77750, 77747, 77686, 90001, 89999, 104194, 104158, 104164, 104154, 68640, 104167, 45175, 45176, 45177, 45178, 45179
];

// Cantidades obtenidas por cada item de Divine Envelopes (datos de ejemplo)
const DIVINE_ENVELOPE_ITEM_COUNTS: number[] = [
  12977, 25224, 17837, 17788, 17761, 17991, 143730, 34630, 34469, 3839, 3683, 3757, 395, 14876, 231708, 9721, 1941, 1845981, 2524128, 3787717, 3041084, 701366
];

const TOTAL_OPENED_DIVINE_ENVELOPES = 224129; // Número total de Divine Envelopes abiertos

const LunarNewYearPage = () => {
  const [selectedSection, setSelectedSection] = useState<
    "overview" | "calculators" | "box-opening" | "envelope-opening" | "strategies"
  >("overview");
  const [divineEnvelopeName, setDivineEnvelopeName] = useState<string>("");
  const [rewardsItemName, setRewardsItemName] = useState<string>("");

  // Estados para la tabla de apertura de Red Bags
  const [redBagItems, setRedBagItems] = useState<BoxOpeningItem[]>([]);
  const [redBagLoading, setRedBagLoading] = useState(false);

  // Estados para ordenamiento
  const [redBagSortField, setRedBagSortField] = useState<string>('quantity');
  const [redBagSortDirection, setRedBagSortDirection] = useState<'asc' | 'desc'>('desc');

  // Estados para la tabla de apertura de Divine Envelopes
  const [envelopeItems, setEnvelopeItems] = useState<BoxOpeningItem[]>([]);
  const [envelopeLoading, setEnvelopeLoading] = useState(false);

  // Estados para ordenamiento de envelopes
  const [envelopeSortField, setEnvelopeSortField] = useState<string>('quantity');
  const [envelopeSortDirection, setEnvelopeSortDirection] = useState<'asc' | 'desc'>('desc');
  const [envelopeMarketPrice, setEnvelopeMarketPrice] = useState(0);

  usePageTitle("pageTitles.lunarNewYear", "Lunar New Year");
  const { t, lang } = useI18n();

  // Sincronizar pestaña con hash en la URL (solo Box/Envelope Opening)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'Box-Opening') setSelectedSection('box-opening');
      if (hash === 'Envelope-Opening') setSelectedSection('envelope-opening');
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  // Función para formatear oro, plata y cobre
  const formatGoldSilverCopper = (copper: number) => {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperRemaining = copper % 100;

    return `${gold.toString().padStart(2, '0')}G ${silver.toString().padStart(2, '0')}S ${copperRemaining.toString().padStart(2, '0')}C`;
  };

  // Función para obtener datos de Red Bags
  const fetchRedBagData = useCallback(async (force = false) => {
    const cacheKey = `gw2_lny_red_bags_${lang}`;

    // Intentar cargar del caché primero si no es forzado
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          // Caché válido por 5 minutos
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setRedBagItems(data);
            return;
          }
        }
      } catch (e) {
        console.error('Error reading red bag cache', e);
      }
    }

    try {
      if (RED_BAG_ITEM_IDS.length === 0) {
        setRedBagItems([]);
        return;
      }
      setRedBagLoading(true);
      const ids = RED_BAG_ITEM_IDS.join(',');
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
      if (!itemsRes.ok) throw new Error('Failed to fetch items');

      const data: Gw2Item[] = await itemsRes.json();
      const pricesData: Gw2Price[] = pricesRes.ok ? await pricesRes.json() : [];
      const pricesMap: Record<number, Gw2Price> = {};
      pricesData.forEach((p) => { pricesMap[p.id] = p; });

      // Construir mapa id -> cantidad
      const countById: Record<number, number> = {};
      RED_BAG_ITEM_IDS.forEach((id, idx) => {
        countById[id] = RED_BAG_ITEM_COUNTS[idx] ?? 0;
      });

      const mapped: BoxOpeningItem[] = data.map((d) => ({
        id: d.id,
        name: d.name,
        icon: d.icon,
        quantity: countById[d.id] ?? 0,
        perBox: (countById[d.id] ?? 0) / TOTAL_OPENED_RED_BAGS,
        pricePerUnit: d.id === 68638 ? 88 : d.id === 68637 ? 888 : d.id === 68640 ? 88888 : d.id === 104154 ? 8888 : (pricesMap[d.id]?.sells?.unit_price ?? 0),
        priceBuyPerUnit: d.id === 68638 ? 88 : d.id === 68637 ? 888 : d.id === 68640 ? 88888 : d.id === 104154 ? 8888 : (pricesMap[d.id]?.buys?.unit_price ?? 0),
      }));

      setRedBagItems(mapped);

      // Guardar en caché
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: mapped
        }));
      } catch (e) {
        console.error('Error saving red bag cache', e);
      }

    } catch (e) {
      console.error('Error cargando datos de Red Bags:', e);
      // Fallback a caché aunque esté expirado
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data } = JSON.parse(cached);
          setRedBagItems(data);
        }
      } catch (cacheErr) {
        console.error('Error reading fallback cache', cacheErr);
      }
    } finally {
      setRedBagLoading(false);
    }
  }, [lang]);

  // Función para obtener datos de Divine Envelopes
  const fetchEnvelopeData = useCallback(async (force = false) => {
    const cacheKey = `gw2_lny_envelopes_${lang}`;

    // Intentar cargar del caché primero si no es forzado
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          // Caché válido por 5 minutos
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setEnvelopeItems(data);
            return;
          }
        }
      } catch (e) {
        console.error('Error reading envelope cache', e);
      }
    }

    try {
      if (DIVINE_ENVELOPE_ITEM_IDS.length === 0) {
        setEnvelopeItems([]);
        return;
      }
      setEnvelopeLoading(true);
      const ids = DIVINE_ENVELOPE_ITEM_IDS.join(',');
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
      if (!itemsRes.ok) throw new Error('Failed to fetch items');

      const data: Gw2Item[] = await itemsRes.json();
      const pricesData: Gw2Price[] = pricesRes.ok ? await pricesRes.json() : [];
      const pricesMap: Record<number, Gw2Price> = {};
      pricesData.forEach((p) => { pricesMap[p.id] = p; });

      // Construir mapa id -> cantidad
      const countById: Record<number, number> = {};
      DIVINE_ENVELOPE_ITEM_IDS.forEach((id, idx) => {
        countById[id] = DIVINE_ENVELOPE_ITEM_COUNTS[idx] ?? 0;
      });

      const mapped: BoxOpeningItem[] = data.map((d) => ({
        id: d.id,
        name: d.name,
        icon: d.icon,
        quantity: countById[d.id] ?? 0,
        perBox: (countById[d.id] ?? 0) / TOTAL_OPENED_DIVINE_ENVELOPES,
        pricePerUnit: d.id === 104154 ? 8888 : d.id === 68640 ? 88888 : (pricesMap[d.id]?.sells?.unit_price ?? 0),
        priceBuyPerUnit: d.id === 104154 ? 8888 : d.id === 68640 ? 88888 : (pricesMap[d.id]?.buys?.unit_price ?? 0),
      }));
      setEnvelopeItems(mapped);

      // Fetch market price for Divine Lucky Envelope (68646) for the calculator
      try {
        const priceRes = await fetch('https://api.guildwars2.com/v2/commerce/prices/68646');
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          setEnvelopeMarketPrice(priceData.sells.unit_price);
        }
      } catch (priceErr) {
        console.error('Error fetching envelope market price:', priceErr);
      }

      // Guardar en caché
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: mapped
        }));
      } catch (e) {
        console.error('Error saving envelope cache', e);
      }

    } catch (e) {
      console.error('Error cargando datos de Divine Envelopes:', e);
      // Fallback a caché aunque esté expirado
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data } = JSON.parse(cached);
          setEnvelopeItems(data);
        }
      } catch (cacheErr) {
        console.error('Error reading fallback cache', cacheErr);
      }
    } finally {
      setEnvelopeLoading(false);
    }
  }, [lang]);


  // Función para manejar el ordenamiento
  const handleRedBagSort = (field: string) => {
    if (redBagSortField === field) {
      setRedBagSortDirection(redBagSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setRedBagSortField(field);
      setRedBagSortDirection('desc');
    }
  };

  // Función para obtener el icono de ordenamiento
  const getRedBagSortIcon = (field: string) => {
    if (redBagSortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return redBagSortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Función para manejar el ordenamiento de envelopes
  const handleEnvelopeSort = (field: string) => {
    if (envelopeSortField === field) {
      setEnvelopeSortDirection(envelopeSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setEnvelopeSortField(field);
      setEnvelopeSortDirection('desc');
    }
  };

  // Función para obtener el icono de ordenamiento de envelopes
  const getEnvelopeSortIcon = (field: string) => {
    if (envelopeSortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return envelopeSortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Función para ordenar los items de Red Bags
  const sortedRedBagItems = useMemo(() => {
    const filteredItems = redBagItems.filter(item => item.quantity > 0);

    return filteredItems.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (redBagSortField) {
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
          aValue = a.pricePerUnit || 0;
          bValue = b.pricePerUnit || 0;
          break;
        case 'totalValue':
          aValue = Math.floor(a.quantity * (a.pricePerUnit || 0));
          bValue = Math.floor(b.quantity * (b.pricePerUnit || 0));
          break;
        default:
          aValue = a.quantity;
          bValue = b.quantity;
      }

      if (redBagSortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [redBagItems, redBagSortField, redBagSortDirection]);

  // Función para ordenar los items de Divine Envelopes
  const sortedEnvelopeItems = useMemo(() => {
    const filteredItems = envelopeItems.filter(item => item.quantity > 0);

    return filteredItems.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (envelopeSortField) {
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
          aValue = a.pricePerUnit || 0;
          bValue = b.pricePerUnit || 0;
          break;
        case 'totalValue':
          aValue = Math.floor(a.quantity * (a.pricePerUnit || 0));
          bValue = Math.floor(b.quantity * (b.pricePerUnit || 0));
          break;
        default:
          aValue = a.quantity;
          bValue = b.quantity;
      }

      if (envelopeSortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [envelopeItems, envelopeSortField, envelopeSortDirection]);

  // Totales calculados para Divine Envelopes
  const envelopeTotalValue = useMemo(() => {
    return envelopeItems.reduce((sum, i) => sum + Math.ceil(i.quantity * (i.pricePerUnit || 0)), 0);
  }, [envelopeItems]);
  const envelopeValuePerEnvelope = useMemo(() => {
    if (!TOTAL_OPENED_DIVINE_ENVELOPES) return 0;
    return Math.floor(envelopeTotalValue / TOTAL_OPENED_DIVINE_ENVELOPES);
  }, [envelopeTotalValue]);

  // Obtener los nombres de los items desde la API
  useEffect(() => {
    const fetchItemNames = async () => {
      try {
        // Obtener ambos items en una sola llamada
        const response = await fetch(`https://api.guildwars2.com/v2/items?ids=94653,68646&lang=${lang}`, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length >= 2) {
            // 94653 es para actividades, 68646 es para recompensas
            setDivineEnvelopeName(data[0].name || t("lunarNewYear.cards.activities.title"));
            setRewardsItemName(data[1].name || t("lunarNewYear.cards.rewards.title"));
          } else {
            setDivineEnvelopeName(t("lunarNewYear.cards.activities.title"));
            setRewardsItemName(t("lunarNewYear.cards.rewards.title"));
          }
        } else {
          setDivineEnvelopeName(t("lunarNewYear.cards.activities.title"));
          setRewardsItemName(t("lunarNewYear.cards.rewards.title"));
        }
      } catch (error) {
        console.error('Error fetching item names:', error);
        setDivineEnvelopeName(t("lunarNewYear.cards.activities.title"));
        setRewardsItemName(t("lunarNewYear.cards.rewards.title"));
      }
    };

    fetchItemNames();
  }, [lang, t]);

  // Cargar datos cuando se selecciona la sección de box-opening
  useEffect(() => {
    if (selectedSection === 'box-opening') {
      fetchRedBagData();
    }
  }, [selectedSection, fetchRedBagData]);

  // Cargar datos cuando se selecciona la sección de envelope-opening
  useEffect(() => {
    if (selectedSection === 'envelope-opening') {
      fetchEnvelopeData();
    }
  }, [selectedSection, fetchEnvelopeData]);

  // Totales calculados para Red Bags
  const redBagTotalValue = useMemo(() => {
    return redBagItems.reduce((sum, i) => sum + Math.ceil(i.quantity * (i.pricePerUnit || 0)), 0);
  }, [redBagItems]);
  const redBagValuePerBag = useMemo(() => {
    if (!TOTAL_OPENED_RED_BAGS) return 0;
    return Math.floor(redBagTotalValue / TOTAL_OPENED_RED_BAGS);
  }, [redBagTotalValue]);

  // Auto-actualización cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedSection === 'box-opening') {
        fetchRedBagData(true);
      } else if (selectedSection === 'envelope-opening') {
        fetchEnvelopeData(true);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedSection, fetchRedBagData, fetchEnvelopeData]);

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/images/backgrounds/Lunar New Year.webp')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay oscuro para mejorar la legibilidad */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Contenido principal */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex justify-start mb-4">
              <a
                href="/festivals"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 hover:bg-gray-800/90 border border-red-500/30 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("nav.backToFestivals")}
              </a>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {t("festival.lunarNewYear")}
            </h1>
            <p className="text-base sm:text-xl text-gray-300">
              {t("festivals.page.subtitle").replace(
                "{name}",
                t("festival.lunarNewYear")
              )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {(
              [
                {
                  id: "overview" as const,
                  label: t("festivals.tabs.overview"),
                  icon: Info,
                },
                {
                  id: "calculators" as const,
                  label: t("festivals.tabs.calculators"),
                  icon: Calculator,
                },
                {
                  id: "box-opening" as const,
                  label: t("festivals.tabs.boxOpening"),
                  icon: Package,
                },
                {
                  id: "envelope-opening" as const,
                  label: t("lunarNewYear.tabs.envelopeOpening"),
                  icon: Package,
                },
                {
                  id: "strategies" as const,
                  label: t("festivals.tabs.strategies"),
                  icon: TrendingUp,
                },
              ] as {
                id: "overview" | "calculators" | "box-opening" | "envelope-opening" | "strategies";
                label: string;
                icon: typeof Info;
              }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedSection(tab.id);
                  if (typeof window !== 'undefined') {
                    if (tab.id === 'box-opening') window.location.hash = 'Box-Opening';
                    else if (tab.id === 'envelope-opening') window.location.hash = 'Envelope-Opening';
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${selectedSection === tab.id
                  ? "bg-red-600/80 text-white border border-red-400/50 shadow-lg"
                  : "bg-gray-900/80 text-gray-300 hover:bg-gray-800/90 border border-red-500/20 hover:border-red-500/40"
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {selectedSection === "overview" && (
              <div className="space-y-8">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-lg p-6 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <Info className="w-6 h-6 mr-3 text-red-400" />
                    {t("festival.lunarNewYear")}
                  </h2>
                  <p className="text-gray-200 mb-6">
                    El Año Nuevo Lunar en Guild Wars 2 es un festival anual que
                    celebra la llegada del nuevo año según el calendario lunar,
                    conmemorando el Año de la Serpiente en 2025. Las
                    festividades se llevan a cabo en Linde de la Divinidad y
                    están abiertas a jugadores de todos los niveles.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-red-500/30 hover:border-red-500/50 transition-all duration-200 shadow-lg">
                      <h3 className="text-white font-semibold mb-2">
                        {divineEnvelopeName || t("lunarNewYear.cards.activities.title")}
                      </h3>
                      <p className="text-gray-200 text-sm">
                        {t("lunarNewYear.cards.activities.desc")}
                      </p>
                    </div>
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-red-500/30 hover:border-red-500/50 transition-all duration-200 shadow-lg">
                      <h3 className="text-white font-semibold mb-2">
                        {rewardsItemName || t("lunarNewYear.cards.rewards.title")}
                      </h3>
                      <p className="text-gray-200 text-sm">
                        {t("lunarNewYear.cards.rewards.desc")}
                      </p>
                    </div>
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-red-500/30 hover:border-red-500/50 transition-all duration-200 shadow-lg">
                      <h3 className="text-white font-semibold mb-2">
                        {t("lunarNewYear.cards.luck.title")}
                      </h3>
                      <p className="text-gray-200 text-sm">
                        {t("lunarNewYear.cards.luck.desc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedSection === "calculators" && (
              <div className="space-y-8">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-lg p-6 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center relative z-10">
                    <Calculator className="w-8 h-8 mr-3 text-red-400 p-1.5 bg-red-400/20 rounded-lg" />
                    {t("lunarNewYear.calculator.title")}
                  </h2>

                  <p className="text-gray-300 mb-8 relative z-10 max-w-2xl">
                    {t("lunarNewYear.calculator.description")}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {/* Tarjeta: Valor Estimado de Apertura */}
                    <div className="bg-gray-800/60 p-5 rounded-xl border border-red-500/20 shadow-lg group hover:border-red-500/40 transition-all duration-300">
                      <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 flex justify-between">
                        {t("lunarNewYear.calculator.expectedValue")}
                        <Info className="w-4 h-4 text-red-400/50 group-hover:text-red-400 transition-colors" />
                      </div>
                      <div className="text-2xl font-extrabold text-yellow-400 mb-1">
                        {formatGoldSilverCopper(16400)}
                      </div>
                      <div className="text-gray-500 text-[10px] italic">
                        {t("lunarNewYear.calculator.mfNote")}
                      </div>
                    </div>

                    {/* Tarjeta: Precio de Venta (Neto) */}
                    <div className="bg-gray-800/60 p-5 rounded-xl border border-red-500/20 shadow-lg group hover:border-red-500/40 transition-all duration-300">
                      <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                        {t("lunarNewYear.calculator.marketPrice")}
                      </div>
                      <div className="text-2xl font-extrabold text-white mb-1">
                        {envelopeMarketPrice ? formatGoldSilverCopper(Math.floor(envelopeMarketPrice * 0.85)) : '...'}
                      </div>
                      <div className="text-gray-500 text-[10px]">
                        TP Sell: {envelopeMarketPrice ? formatGoldSilverCopper(envelopeMarketPrice) : '...'}
                      </div>
                    </div>

                    {/* Tarjeta: Beneficio Resultante */}
                    <div className="bg-gray-800/60 p-5 rounded-xl border border-red-500/20 shadow-lg group hover:border-red-500/40 transition-all duration-300 flex flex-col justify-between">
                      <div>
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                          {t("lunarNewYear.calculator.profitPerEnvelope")}
                        </div>
                        <div className={`text-2xl font-extrabold mb-1 ${16400 - (envelopeMarketPrice * 0.85) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {envelopeMarketPrice ? (16400 - (envelopeMarketPrice * 0.85) > 0 ? '+' : '') : ''}
                          {envelopeMarketPrice ? formatGoldSilverCopper(Math.floor(16400 - (envelopeMarketPrice * 0.85))) : '...'}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{t("lunarNewYear.calculator.recommendation")}:</span>
                        <span className={`px-4 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${16400 - (envelopeMarketPrice * 0.85) > 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                          {16400 - (envelopeMarketPrice * 0.85) > 0 ? t("lunarNewYear.calculator.open") : t("lunarNewYear.calculator.sell")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notas y Advertencias */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="p-4 bg-green-900/10 rounded-xl border border-green-500/20">
                      <h4 className="flex items-center gap-2 text-green-400 font-bold mb-2 text-sm">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        {t("lunarNewYear.calculator.open")}
                      </h4>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        {t("lunarNewYear.calculator.openNote")}
                      </p>
                    </div>
                    <div className="p-4 bg-red-900/10 rounded-xl border border-red-500/20">
                      <h4 className="flex items-center gap-2 text-red-400 font-bold mb-2 text-sm">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                        {t("lunarNewYear.calculator.sell")}
                      </h4>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        {t("lunarNewYear.calculator.sellNote")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedSection === "box-opening" && (
              <div className="space-y-8">
                <div id="Box-Opening" className="invisible absolute -top-20"></div>
                <div className="bg-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-lg p-6 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <Package className="w-6 h-6 mr-3 text-red-400" />
                    {t("festivals.tabs.boxOpening")}
                  </h2>

                  {/* Estadísticas de apertura */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <Calculator className="w-6 h-6 mr-3 text-red-400" />
                      {t("lunarNewYear.boxOpening.stats")}
                    </h3>

                    {/* Información de créditos y cajas abiertas */}
                    <div className="bg-gray-800/60 rounded-lg p-4 mb-4 text-center border border-red-500/20 shadow-lg">
                      <div className="text-lg sm:text-xl font-bold text-red-400 mb-2">
                        {t("lunarNewYear.boxOpening.stats")}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-white">
                        {TOTAL_OPENED_RED_BAGS.toLocaleString()} {t("lunarNewYear.boxOpening.boxesOpened")}
                      </div>
                      <div className="text-gray-300 text-xs mt-2">
                        <div className="font-semibold mb-1">{t("lunarNewYear.boxOpening.dataSource")}</div>
                        <div>
                          {t("lunarNewYear.boxOpening.dataSourceDesc").split('Vortus43')[0]}
                          <a
                            href="https://www.twitch.tv/vortus43"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-400 hover:text-red-300 underline transition-colors"
                          >
                            Vortus43
                          </a>
                          {t("lunarNewYear.boxOpening.dataSourceDesc").split('Vortus43')[1].split('OVERHELL.1659')[0]}
                          <a
                            href="https://discord.com/users/272812905597108224"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-400 hover:text-red-300 underline transition-colors"
                          >
                            OVERHELL.1659
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-red-500/20 shadow-lg">
                        <div className="text-2xl font-bold text-red-400">
                          {redBagItems.filter(i => i.quantity > 0).length.toLocaleString()}
                        </div>
                        <div className="text-gray-200 text-sm">{t("lunarNewYear.boxOpening.uniqueItems")}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-red-500/20 shadow-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {redBagItems.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()}
                        </div>
                        <div className="text-gray-200 text-sm">{t("lunarNewYear.boxOpening.totalItems")}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-red-500/20 shadow-lg">
                        <div className="text-2xl font-bold text-yellow-400">
                          {formatGoldSilverCopper(redBagTotalValue)}
                        </div>
                        <div className="text-gray-200 text-sm">{t("lunarNewYear.boxOpening.totalValue")}</div>
                      </div>

                      <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-red-500/20 shadow-lg">
                        <div className="text-2xl font-bold text-yellow-400">
                          {formatGoldSilverCopper(redBagValuePerBag)}
                        </div>
                        <div className="text-gray-200 text-sm">{t("lunarNewYear.boxOpening.valuePerBag", "Valor por saco (85%)")}</div>
                      </div>
                    </div>

                  </div>

                  {/* Tabla de Items Obtenidos */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-white flex items-center">
                        <Calculator className="w-6 h-6 mr-3 text-red-400" />
                        {t("lunarNewYear.boxOpening.obtainedItems")}
                      </h3>
                      <button
                        onClick={() => fetchRedBagData(true)}
                        disabled={redBagLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600/80 hover:bg-red-700/80 disabled:bg-gray-600/60 text-white rounded text-sm transition-all duration-200 hover:scale-105 border border-red-500/50 disabled:border-gray-500/50"
                      >
                        <RefreshCw className={`w-4 h-4 ${redBagLoading ? 'animate-spin' : ''}`} />
                        {t("common.refreshData")}
                      </button>
                    </div>

                    {redBagItems.length === 0 ? (
                      <div className="bg-gray-800/50 rounded-lg border border-red-500/20 overflow-hidden shadow-lg">
                        <div className="p-4 text-center text-gray-300">
                          <p>{redBagLoading ? t("common.loadingItems") : t("lunarNewYear.boxOpening.waiting")}</p>
                          <p className="text-sm mt-2">{t("lunarNewYear.boxOpening.sendIds")}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-800/50 rounded-lg border border-red-500/20 shadow-lg">
                        <div className="p-6">
                          <div className="text-center mb-6">
                            <p className="text-gray-300 text-sm mb-4">{t("lunarNewYear.boxOpening.summaryDesc")}</p>
                          </div>

                          {/* Tabla de Items Obtenidos */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-600">
                                  <th
                                    className="text-left py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleRedBagSort('name')}
                                  >
                                    <div className="flex items-center gap-1">
                                      {t("table.name")}
                                      {getRedBagSortIcon('name')}
                                    </div>
                                  </th>
                                  <th
                                    className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleRedBagSort('quantity')}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {t("table.quantity")}
                                      {getRedBagSortIcon('quantity')}
                                    </div>
                                  </th>
                                  <th
                                    className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleRedBagSort('perBox')}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {t("table.perBox")}
                                      {getRedBagSortIcon('perBox')}
                                    </div>
                                  </th>
                                  <th
                                    className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleRedBagSort('price')}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {t("table.price")}
                                      {getRedBagSortIcon('price')}
                                    </div>
                                  </th>
                                  <th
                                    className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleRedBagSort('totalValue')}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {t("table.totalValue")}
                                      {getRedBagSortIcon('totalValue')}
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedRedBagItems.map((item) => (
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
                                      {(item.perBox * 100).toFixed(4)}%
                                    </td>
                                    <td className="py-2 text-center text-gray-300">
                                      {formatGoldSilverCopper(item.pricePerUnit || 0)}
                                    </td>
                                    <td className="py-2 text-center text-yellow-400 font-semibold">
                                      {formatGoldSilverCopper(Math.floor(item.quantity * (item.pricePerUnit || 0)))}
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
            )}

            {selectedSection === "envelope-opening" && (
              <div className="space-y-8">
                <div id="Envelope-Opening" className="invisible absolute -top-20"></div>
                <div className="bg-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-lg p-6 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <Package className="w-6 h-6 mr-3 text-red-400" />
                    {t("lunarNewYear.tabs.envelopeOpening")}
                  </h2>

                  {/* Estadísticas de apertura */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <Calculator className="w-6 h-6 mr-3 text-red-400" />
                      {t("lunarNewYear.envelopeOpening.stats")}
                    </h3>

                    {/* Información de créditos y sobres abiertos */}
                    <div className="bg-gray-800/60 rounded-lg p-4 mb-4 text-center border border-red-500/20 shadow-lg">
                      <div className="text-lg sm:text-xl font-bold text-red-400 mb-2">
                        {t("lunarNewYear.envelopeOpening.stats")}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-white">
                        {TOTAL_OPENED_DIVINE_ENVELOPES.toLocaleString()} {t("lunarNewYear.envelopeOpening.envelopesOpened")}
                      </div>
                      <div className="text-gray-300 text-xs mt-2">
                        <div className="font-semibold mb-1">{t("lunarNewYear.envelopeOpening.dataSource")}</div>
                        <div>
                          {(() => {
                            const desc = t("lunarNewYear.envelopeOpening.dataSourceDesc") || '';
                            const tokens = desc.split(/(Vortus43|OVERHELL\.1659)/g);
                            return (
                              <>
                                {tokens.map((tk, idx) => {
                                  if (tk === 'Vortus43') {
                                    return <span key={idx} className="text-red-400"> Vortus43 </span>;
                                  }
                                  if (tk === 'OVERHELL.1659') {
                                    return (
                                      <a
                                        key={idx}
                                        href="https://discord.com/users/272812905597108224"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-red-400 hover:text-red-300 underline transition-colors"
                                      >
                                        OVERHELL.1659
                                      </a>
                                    );
                                  }
                                  return <span key={idx}>{tk}</span>;
                                })}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-red-500/20 shadow-lg">
                        <div className="text-2xl font-bold text-red-400">
                          {envelopeItems.filter(i => i.quantity > 0).length.toLocaleString()}
                        </div>
                        <div className="text-gray-200 text-sm">{t("lunarNewYear.envelopeOpening.uniqueItems")}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-red-500/20 shadow-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {envelopeItems.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()}
                        </div>
                        <div className="text-gray-200 text-sm">{t("lunarNewYear.envelopeOpening.totalItems")}</div>
                      </div>
                      <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-red-500/20 shadow-lg">
                        <div className="text-2xl font-bold text-yellow-400">
                          {formatGoldSilverCopper(envelopeTotalValue)}
                        </div>
                        <div className="text-gray-200 text-sm">{t("lunarNewYear.envelopeOpening.totalValue")}</div>
                      </div>

                      <div className="bg-gray-800/60 rounded-lg p-3 text-center border border-red-500/20 shadow-lg">
                        <div className="text-2xl font-bold text-yellow-400">
                          {formatGoldSilverCopper(envelopeValuePerEnvelope)}
                        </div>
                        <div className="text-gray-200 text-sm">{t("lunarNewYear.envelopeOpening.valuePerEnvelope", "Valor por sobre")}</div>
                      </div>
                    </div>

                  </div>

                  {/* Tabla de Items Obtenidos */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-white flex items-center">
                        <Calculator className="w-6 h-6 mr-3 text-red-400" />
                        {t("lunarNewYear.envelopeOpening.obtainedItems")}
                      </h3>
                      <button
                        onClick={() => fetchEnvelopeData(true)}
                        disabled={envelopeLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600/80 hover:bg-red-700/80 disabled:bg-gray-600/60 text-white rounded text-sm transition-all duration-200 hover:scale-105 border border-red-500/50 disabled:border-gray-500/50"
                      >
                        <RefreshCw className={`w-4 h-4 ${envelopeLoading ? 'animate-spin' : ''}`} />
                        {t("common.refreshData")}
                      </button>
                    </div>

                    {envelopeItems.length === 0 ? (
                      <div className="bg-gray-800/50 rounded-lg border border-red-500/20 overflow-hidden shadow-lg">
                        <div className="p-4 text-center text-gray-300">
                          <p>{envelopeLoading ? t("common.loadingItems") : t("lunarNewYear.envelopeOpening.waiting")}</p>
                          <p className="text-sm mt-2">{t("lunarNewYear.envelopeOpening.sendIds")}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-800/50 rounded-lg border border-red-500/20 shadow-lg">
                        <div className="p-6">
                          <div className="text-center mb-6">
                            <p className="text-gray-300 text-sm mb-4">{t("lunarNewYear.envelopeOpening.summaryDesc")}</p>
                          </div>

                          {/* Tabla de Items Obtenidos */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-600">
                                  <th
                                    className="text-left py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleEnvelopeSort('name')}
                                  >
                                    <div className="flex items-center gap-1">
                                      {t("table.name")}
                                      {getEnvelopeSortIcon('name')}
                                    </div>
                                  </th>
                                  <th
                                    className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleEnvelopeSort('quantity')}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {t("table.quantity")}
                                      {getEnvelopeSortIcon('quantity')}
                                    </div>
                                  </th>
                                  <th
                                    className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleEnvelopeSort('perBox')}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {t("table.perBox")}
                                      {getEnvelopeSortIcon('perBox')}
                                    </div>
                                  </th>
                                  <th
                                    className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleEnvelopeSort('price')}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {t("table.price")}
                                      {getEnvelopeSortIcon('price')}
                                    </div>
                                  </th>
                                  <th
                                    className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleEnvelopeSort('totalValue')}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {t("table.totalValue")}
                                      {getEnvelopeSortIcon('totalValue')}
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedEnvelopeItems.map((item) => (
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
                                      {(item.perBox * 100).toFixed(4)}%
                                    </td>
                                    <td className="py-2 text-center text-gray-300">
                                      {formatGoldSilverCopper(item.pricePerUnit || 0)}
                                    </td>
                                    <td className="py-2 text-center text-yellow-400 font-semibold">
                                      {formatGoldSilverCopper(Math.floor(item.quantity * (item.pricePerUnit || 0)))}
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
            )}

            {selectedSection === "strategies" && (
              <div className="space-y-8">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-lg p-6 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-3 text-red-400" />
                    {t("festivals.tabs.strategies")}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">{t("lunarNewYear.strategies.redBags.title")}</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <h4 className="text-white font-semibold">{t("lunarNewYear.strategies.redBags.magicFind")}</h4>
                            <p className="text-gray-300 text-sm">{t("lunarNewYear.strategies.redBags.magicFindDesc")}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">{t("lunarNewYear.strategies.envelopes.title")}</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <h4 className="text-white font-semibold">{t("lunarNewYear.strategies.envelopes.magicFind")}</h4>
                            <p className="text-gray-300 text-sm">{t("lunarNewYear.strategies.envelopes.magicFindDesc")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LunarNewYearPage;
