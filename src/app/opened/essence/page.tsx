"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Gift,
  Package,
  BarChart3,
  ArrowLeft,
  Zap,
  Calculator,
} from "lucide-react";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useI18n } from "@/contexts/I18nContext";

interface GW2Item {
  id: number;
  name: string;
  icon: string;
  type: string;
  rarity: string;
  level: number;
  vendor_value: number;
  game_types: string[];
  flags: string[];
  restrictions: string[];
  chat_link: string;
  description?: string;
}

export default function RiftEssenceCofferPage() {
  const { lang, t } = useI18n();
  const [riftEssenceCoffer, setRiftEssenceCoffer] = useState<{
    name: string;
    icon: string;
  } | null>(null);
  const [itemDetails, setItemDetails] = useState<{
    [key: number]: { name: string; icon: string };
  }>({});
  const [itemPrices, setItemPrices] = useState<{
    [key: number]: { buy: number; sell: number };
  }>({});
  const [sortBy, setSortBy] = useState<string>("quantity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Estados para la calculadora
  const [fineEssence, setFineEssence] = useState<string>("");
  const [masterworkEssence, setMasterworkEssence] = useState<string>("");
  const [rareEssence, setRareEssence] = useState<string>("");
  const [desiredAmalgamated, setDesiredAmalgamated] = useState<string>("");
  usePageTitle(
    "pageTitles.riftEssenceCoffer",
    riftEssenceCoffer?.name || "Unlocked Rift Essence Coffer"
  );

  const totalOpened = 105856; // Total de cofres abiertos

  // Función para calcular número por cofre y porcentaje
  const calculateItemStats = (quantity: string) => {
    // Extraer el número de la cantidad (manejar rangos como "5-10" tomando el promedio)
    const quantityMatch = quantity.match(/(\d+)(?:-(\d+))?/);
    if (!quantityMatch)
      return { numPerCoffer: "0.00", percentagePerCoffer: "0.00" };

    const min = parseInt(quantityMatch[1]);
    const max = quantityMatch[2] ? parseInt(quantityMatch[2]) : min;
    const average = (min + max) / 2;

    const numPerCoffer = average / totalOpened;
    const percentagePerCoffer = numPerCoffer * 100;

    return {
      numPerCoffer: numPerCoffer.toFixed(2),
      percentagePerCoffer: percentagePerCoffer.toFixed(2),
    };
  };

  // Función para abreviar nombres de esencias
  const getAbbreviatedName = (itemId: number) => {
    const fullName = itemDetails[itemId]?.name || "";
    if (itemId === 104747) return t("riftEssenceCoffer.essence.fine", "Fine");
    if (itemId === 104773)
      return t("riftEssenceCoffer.essence.masterwork", "Masterwork");
    if (itemId === 105009) return t("riftEssenceCoffer.essence.rare", "Rare");
    return fullName;
  };

  // Funciones para la calculadora
  const calculateAmalgamatedEssence = () => {
    const fine = parseInt(fineEssence) || 0;
    const masterwork = parseInt(masterworkEssence) || 0;
    const rare = parseInt(rareEssence) || 0;

    const fineAmalgamated = Math.floor(fine / 250);
    const masterworkAmalgamated = Math.floor(masterwork / 100);
    const rareAmalgamated = Math.floor(rare / 50);

    return Math.min(fineAmalgamated, masterworkAmalgamated, rareAmalgamated);
  };

  const calculateRequiredCoffers = () => {
    const desired = parseInt(desiredAmalgamated) || 0;
    if (desired <= 0) return 0;

    // Cada amalgamated essence necesita 6.5 cofres de media
    const coffersPerEssence = 6.5;
    return Math.ceil(desired * coffersPerEssence);
  };

  // Datos de los items - aquí puedes actualizar los valores
  const itemsData = {
    // Items Comunes
    common: [
      { id: 104747, name: "Fine Rift Essence", quantity: "4066070" },
      { id: 104773, name: "Masterwork Rift Essence", quantity: "1624972" },
      { id: 105009, name: "Rare Rift Essence", quantity: "813531" },
      { id: 46733, name: "Dragonite Ore", quantity: "291845" },
      { id: 46735, name: "Empyreal Fragment", quantity: "295245" },
      { id: 46731, name: "Pile of Bloodstone Dust", quantity: "293445" },
      { id: 24276, name: "Pile of Incandescent Dust", quantity: "98075" },
      { id: 24282, name: "Potent Venom Sac", quantity: "98095" },
      { id: 24299, name: "Intricate Totem", quantity: "98980" },
      { id: 24288, name: "Large Scale", quantity: "98075" },
      { id: 24356, name: "Large Fang", quantity: "98985" },
      { id: 24350, name: "Large Claw", quantity: "99550" },
      { id: 24341, name: "Large Bone", quantity: "99075" },
      { id: 24294, name: "Vial of Potent Blood", quantity: "98745" },
    ],
    // Items Raros
    rare: [{ id: 101298, name: "Unstable Rift Motivation", quantity: "93" }],
  };

  // Función para calcular el total de items
  const calculateTotalItems = () => {
    let total = 0;
    Object.values(itemsData).forEach((category) => {
      category.forEach((item) => {
        // Extraer el número de la cantidad (manejar rangos como "5-10" tomando el promedio)
        const quantityMatch = item.quantity.match(/(\d+)(?:-(\d+))?/);
        if (quantityMatch) {
          const min = parseInt(quantityMatch[1]);
          const max = quantityMatch[2] ? parseInt(quantityMatch[2]) : min;
          const average = (min + max) / 2;
          total += average;
        }
      });
    });
    return Math.round(total);
  };

  const totalItems = calculateTotalItems();

  // Función para calcular el valor promedio por bag
  const calculateBagValue = () => {
    let totalValue = 0;

    Object.values(itemsData).forEach((category) => {
      category.forEach((item) => {
        const quantityMatch = item.quantity.match(/(\d+)(?:-(\d+))?/);
        if (quantityMatch) {
          const min = parseInt(quantityMatch[1]);
          const max = quantityMatch[2] ? parseInt(quantityMatch[2]) : min;
          const average = (min + max) / 2;
          
          const sellPrice = itemPrices[item.id]?.sell || 0;

          const priceAfterTax = sellPrice * 0.85;
          totalValue += average * priceAfterTax;
        }
      });
    });

    // Dividir entre el número total de cofres para obtener valor por cofre
    return totalValue / totalOpened;
  };

  const averageBagValue = calculateBagValue();

  // Función para convertir cobre a formato G S C
  const formatCurrency = (copper: number) => {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperRemainder = copper % 100;
    
    return `${gold.toString().padStart(2, '0')}G ${silver.toString().padStart(2, '0')}S ${copperRemainder.toString().padStart(2, '0')}C`;
  };

  // Función para ordenar los items
  const sortItems = (
    items: { id: number; name: string; quantity: string }[]
  ) => {
    return [...items].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = itemDetails[a.id]?.name || a.name;
          bValue = itemDetails[b.id]?.name || b.name;
          break;
        case "quantity":
          const aQuantityMatch = a.quantity.match(/(\d+)(?:-(\d+))?/);
          const bQuantityMatch = b.quantity.match(/(\d+)(?:-(\d+))?/);
          if (aQuantityMatch && bQuantityMatch) {
            const aMin = parseInt(aQuantityMatch[1]);
            const aMax = aQuantityMatch[2] ? parseInt(aQuantityMatch[2]) : aMin;
            const bMin = parseInt(bQuantityMatch[1]);
            const bMax = bQuantityMatch[2] ? parseInt(bQuantityMatch[2]) : bMin;
            aValue = (aMin + aMax) / 2;
            bValue = (bMin + bMax) / 2;
          } else {
            aValue = 0;
            bValue = 0;
          }
          break;
        case "numPerCoffer":
          const aStats = calculateItemStats(a.quantity);
          const bStats = calculateItemStats(b.quantity);
          aValue = parseFloat(aStats.numPerCoffer);
          bValue = parseFloat(bStats.numPerCoffer);
          break;
        case "percentagePerCoffer":
          const aStats2 = calculateItemStats(a.quantity);
          const bStats2 = calculateItemStats(b.quantity);
          aValue = parseFloat(aStats2.percentagePerCoffer);
          bValue = parseFloat(bStats2.percentagePerCoffer);
          break;
        case "value":
          aValue = itemPrices[a.id]?.sell || 0;
          bValue = itemPrices[b.id]?.sell || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const aNum = typeof aValue === "number" ? aValue : 0;
      const bNum = typeof bValue === "number" ? bValue : 0;

      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
    });
  };

  // Función para manejar el clic en los headers
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  // Función para obtener los precios de los items
  const fetchItemPrices = async () => {
    try {
      // IDs de todos los items que aparecen en la tabla
      const itemIds = [
        101266, // Unlocked Rift Essence Coffer
        100930, // Amalgamated Rift Essence
        46733, // Dragonite Ore
        46735, // Empyreal Fragment
        46731, // Pile of Bloodstone Dust
        24276, // Pile of Incandescent Dust
        24282, // Potent Venom Sac
        24299, // Intricate Totem
        24288, // Large Scale
        24356, // Large Fang
        24350, // Large Claw
        24341, // Large Bone
        24294, // Vial of Potent Blood
        101298, // Unstable Rift Motivation
        104747, // Fine Rift Essence,
        104773, // Masterwork Rift Essence
        105009, // Rare Rift Essence
      ];

      const response = await fetch(
        `https://api.guildwars2.com/v2/commerce/prices?ids=${itemIds.join(",")}`,
        {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate, br",
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const pricesMap: {
          [key: number]: { buy: number; sell: number };
        } = {};
        data.forEach((price: { id: number; buys?: { unit_price: number }; sells?: { unit_price: number } }) => {
          pricesMap[price.id] = {
            buy: price.buys?.unit_price || 0,
            sell: price.sells?.unit_price || 0,
          };
        });
        setItemPrices(pricesMap);
      }
    } catch (error) {
      console.error("Error fetching item prices:", error);
    }
  };

  // Función para obtener los items según el idioma
  const fetchItems = async (language: string) => {
    try {
      // IDs de todos los items que aparecen en la tabla
      const itemIds = [
        101266, // Unlocked Rift Essence Coffer
        100930, // Amalgamated Rift Essence
        46733, // Dragonite Ore
        46735, // Empyreal Fragment
        46731, // Pile of Bloodstone Dust
        24276, // Pile of Incandescent Dust
        24282, // Potent Venom Sac
        24299, // Intricate Totem
        24288, // Large Scale
        24356, // Large Fang
        24350, // Large Claw
        24341, // Large Bone
        24294, // Vial of Potent Blood
        101298, // Unstable Rift Motivation
        104747, // Fine Rift Essence,
        104773, // Masterwork Rift Essence
        105009, // Rare Rift Essence
      ];

      const response = await fetch(
        `https://api.guildwars2.com/v2/items?ids=${itemIds.join(
          ","
        )}&lang=${language}`,
        {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate, br",
          },
        }
      );
      const data: GW2Item[] = await response.json();

      if (data && data.length > 0) {
        // Configurar el cofre principal
        const cofferData = data[0];
        setRiftEssenceCoffer({
          name: cofferData.name,
          icon: cofferData.icon,
        });

        // Configurar los detalles de todos los items
        const itemDetailsMap: {
          [key: number]: { name: string; icon: string };
        } = {};
        data.forEach((item: GW2Item) => {
          itemDetailsMap[item.id] = {
            name: item.name,
            icon: item.icon,
          };
        });
        setItemDetails(itemDetailsMap);
      }
    } catch (error) {
      console.error("Error fetching items data:", error);
    }
  };

  // Efecto para cargar los items cuando cambie el idioma
  useEffect(() => {
    if (lang) {
      fetchItems(lang);
      fetchItemPrices();
    }
  }, [lang]);

  // Auto-refresco cada 5 minutos (300000 ms)
  const refreshData = useCallback(() => {
    if (!lang) return;
    fetchItems(lang);
    fetchItemPrices();
  }, [lang]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshData();
    }, 300000);
    return () => clearInterval(intervalId);
  }, [refreshData]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Hero Section */}
          <div className="mb-8">
            {/* Botón de regreso */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Link
                href="/opened"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 hover:bg-gray-800/90 border border-cyan-500/30 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                {t(
                  "riftEssenceCoffer.backToContainers",
                  "Volver a Contenedores"
                )}
              </Link>
            </motion.div>

            {/* Título centrado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
            >
              <div className="w-20 h-20 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                {riftEssenceCoffer ? (
                  <Image
                    src={riftEssenceCoffer.icon}
                    alt={riftEssenceCoffer.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Gift className="h-10 w-10 sm:h-8 sm:w-8 text-white" />
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-center">
                <span
                  className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {riftEssenceCoffer?.name || "Unlocked Rift Essence Coffer"}
                </span>
              </h1>
            </motion.div>

            {/* Subtítulo centrado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center px-4"
            >
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                {riftEssenceCoffer
                  ? `El ${riftEssenceCoffer.name.toLowerCase()} contiene esencia de grieta de varios niveles. Haz doble clic para abrir.`
                  : "The unlocked coffer contains rift essence of various tiers. Double-click to open."}
              </p>
            </motion.div>
          </div>

          {/* Estadísticas Generales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 max-w-6xl mx-auto"
          >
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center shadow-sm">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {t("riftEssenceCoffer.openings", "Aperturas")}
                </h3>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {totalOpened.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-lg p-4 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:scale-105 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-md flex items-center justify-center shadow-sm">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {t("riftEssenceCoffer.totalItems", "Total de Items")}
                </h3>
              </div>
              <p className="text-2xl font-bold text-orange-400">
                {totalItems.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-lg p-4 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-md flex items-center justify-center shadow-sm">
                  <Calculator className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {t("riftEssenceCoffer.bagValue", "Valor por bolsa (85%)")}
                </h3>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {averageBagValue > 0 ? formatCurrency(Math.round(averageBagValue)) : "00G 00S 00C"}
              </p>
            </div>
          </motion.div>

          {/* Calculadora de Rift Essence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-cyan-400" />
                {t(
                  "riftEssenceCoffer.calculator.title",
                  "Calculadora de Esencia de fisura"
                )}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Calculadora 1: Cuántas Amalgamated Essence puedes hacer */}
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-blue-400" />
                    {t(
                      "riftEssenceCoffer.calculator.essencesToAmalgamated",
                      "Esencias → Amalgamated"
                    )}
                  </h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="flex text-xs text-gray-300 mb-1 items-center gap-1">
                          {itemDetails[104747] && (
                            <Image
                              src={itemDetails[104747].icon}
                              alt={itemDetails[104747].name}
                              width={16}
                              height={16}
                              className="w-4 h-4"
                            />
                          )}
                          {getAbbreviatedName(104747)}
                        </label>
                        <input
                          type="number"
                          value={fineEssence}
                          onChange={(e) => setFineEssence(e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="flex text-xs text-gray-300 mb-1 items-center gap-1">
                          {itemDetails[104773] && (
                            <Image
                              src={itemDetails[104773].icon}
                              alt={itemDetails[104773].name}
                              width={16}
                              height={16}
                              className="w-4 h-4"
                            />
                          )}
                          {getAbbreviatedName(104773)}
                        </label>
                        <input
                          type="number"
                          value={masterworkEssence}
                          onChange={(e) => setMasterworkEssence(e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="flex text-xs text-gray-300 mb-1 items-center gap-1">
                          {itemDetails[105009] && (
                            <Image
                              src={itemDetails[105009].icon}
                              alt={itemDetails[105009].name}
                              width={16}
                              height={16}
                              className="w-4 h-4"
                            />
                          )}
                          {getAbbreviatedName(105009)}
                        </label>
                        <input
                          type="number"
                          value={rareEssence}
                          onChange={(e) => setRareEssence(e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded p-3 border border-blue-500/30 text-center">
                      <p className="text-sm text-gray-300 mb-1">
                        {t(
                          "riftEssenceCoffer.calculator.canCraft",
                          "Puedes craftear:"
                        )}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        {itemDetails[100930] && (
                          <Image
                            src={itemDetails[100930].icon}
                            alt={itemDetails[100930].name}
                            width={24}
                            height={24}
                            className="w-6 h-6"
                          />
                        )}
                        <p className="text-xl font-bold text-blue-400">
                          {calculateAmalgamatedEssence()}{" "}
                          {itemDetails[100930]?.name || "Amalgamated"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculadora 2: Cuántos cofres necesitas */}
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-lg p-4 border border-green-500/30">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-green-400" />
                    {t(
                      "riftEssenceCoffer.calculator.amalgamatedToCoffers",
                      "Amalgamated → Cofres"
                    )}
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="flex text-xs text-gray-300 mb-1 items-center gap-1">
                        {itemDetails[100930] && (
                          <Image
                            src={itemDetails[100930].icon}
                            alt={itemDetails[100930].name}
                            width={16}
                            height={16}
                            className="w-4 h-4"
                          />
                        )}
                        {t(
                          "riftEssenceCoffer.calculator.desiredAmalgamated",
                          "Amalgamated deseadas"
                        )}
                      </label>
                      <input
                        type="number"
                        value={desiredAmalgamated}
                        onChange={(e) => setDesiredAmalgamated(e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-green-400 focus:outline-none"
                      />
                    </div>

                    <div className="bg-gray-800/50 rounded p-3 border border-green-500/30 text-center">
                      <p className="text-sm text-gray-300 mb-1">
                        {t(
                          "riftEssenceCoffer.calculator.coffersNeeded",
                          "Cofres necesarios:"
                        )}
                      </p>
                      <p className="text-xl font-bold text-green-400">
                        {calculateRequiredCoffers().toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        (6.5 {t("riftEssenceCoffer.calculator.coffersPerAmalgamated", "cofres por amalgamada")}{" "}
                        {itemDetails[100930]?.name || "amalgamated"})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabla de Datos del Rift Essence Coffer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center">
                <Package className="w-6 h-6 mr-3 text-cyan-400" />
                {t(
                  "riftEssenceCoffer.cofferContent",
                  "Contenido del Cofre de Esencia de Fisura"
                )}
              </h2>

              <div className="bg-gray-800/60 rounded-lg p-4 mb-4 border border-cyan-500/20 shadow-lg">
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-2">
                    {t(
                      "riftEssenceCoffer.generalStats",
                      "Estadísticas Generales"
                    )}
                  </h3>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {totalOpened.toLocaleString()}{" "}
                    {t(
                      "riftEssenceCoffer.coffersAnalyzed",
                      "Cofres Analizados"
                    )}
                  </p>
                  <p className="text-gray-300 text-xs mt-1">
                    {t("riftEssenceCoffer.creditData", "Credit Data:")}{" "}
                    <a
                      href="https://www.reddit.com/r/Guildwars2/comments/1aywzh9/data_1058k_exposed_stabilized_kryptis_essence"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Selici
                    </a>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Análisis de Resultados */}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <Package className="w-6 h-6 mr-3 text-cyan-400" />
                       {t(
                         "riftEssenceCoffer.detailedContent",
                         "Contenido Detallado"
                       )}
                    </h3>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg border border-cyan-500/20 shadow-lg">
                    <div className="p-6">
                      <div className="text-center mb-6">
                        <p className="text-gray-300 text-sm mb-4">
                          {t(
                            "riftEssenceCoffer.detailedInfo",
                            "Información detallada sobre el contenido del"
                          )}{" "}
                          {riftEssenceCoffer
                            ? riftEssenceCoffer.name
                            : "Unlocked Rift Essence Coffer"}
                        </p>
                        <div className="bg-cyan-900/20 border border-cyan-500/50 rounded-lg p-4">
                          <p className="text-cyan-200 text-sm font-medium">
                            💡 Tip:{" "}
                            {t(
                              "riftEssenceCoffer.tipContent",
                              "Este cofre siempre contiene Esencia de Fisura de diferentes niveles"
                            )}
                          </p>
                        </div>
                        <div className="mt-3 bg-emerald-900/20 border border-emerald-500/40 rounded-lg p-3">
                          <p className="text-emerald-200 text-sm">
                            {t('riftEssenceCoffer.note.crafting', 'Nota: Crafteando con')} {itemDetails[46735]?.name || 'Empyreal Fragment'} {t('riftEssenceCoffer.note.canIncreaseProfit', 'se puede aumentar el profit.')} 
                          </p>
                        </div>
                      </div>

                      {/* Tabla de Contenido */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-600">
                              <th
                                className="text-left py-2 text-gray-300 cursor-pointer hover:text-white transition-colors bg-gray-700/30 hover:bg-gray-600/30 rounded-t"
                                onClick={() => handleSort("name")}
                                title={t(
                                  "riftEssenceCoffer.table.clickToSort",
                                  "Haz clic para ordenar"
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  {t("riftEssenceCoffer.table.item", "Item")}
                                  <span className="text-xs text-gray-400">
                                    (↑↓)
                                  </span>
                                  {sortBy === "name" && (
                                    <span className="text-cyan-400 font-bold">
                                      {sortDirection === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors bg-gray-700/30 hover:bg-gray-600/30"
                                onClick={() => handleSort("quantity")}
                                title={t(
                                  "riftEssenceCoffer.table.clickToSort",
                                  "Haz clic para ordenar"
                                )}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {t(
                                    "riftEssenceCoffer.table.quantity",
                                    "Cantidad"
                                  )}
                                  <span className="text-xs text-gray-400">
                                    (↑↓)
                                  </span>
                                  {sortBy === "quantity" && (
                                    <span className="text-cyan-400 font-bold">
                                      {sortDirection === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors bg-gray-700/30 hover:bg-gray-600/30"
                                onClick={() => handleSort("numPerCoffer")}
                                title={t(
                                  "riftEssenceCoffer.table.clickToSort",
                                  "Haz clic para ordenar"
                                )}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {t(
                                    "riftEssenceCoffer.table.numPerCoffer",
                                    "Num por cofre %"
                                  )}
                                  <span className="text-xs text-gray-400">
                                    (↑↓)
                                  </span>
                                  {sortBy === "numPerCoffer" && (
                                    <span className="text-cyan-400 font-bold">
                                      {sortDirection === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors bg-gray-700/30 hover:bg-gray-600/30"
                                onClick={() =>
                                  handleSort("percentagePerCoffer")
                                }
                                title={t(
                                  "riftEssenceCoffer.table.clickToSort",
                                  "Haz clic para ordenar"
                                )}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {t(
                                    "riftEssenceCoffer.table.percentagePerCoffer",
                                    "% por cofre"
                                  )}
                                  <span className="text-xs text-gray-400">
                                    (↑↓)
                                  </span>
                                  {sortBy === "percentagePerCoffer" && (
                                    <span className="text-cyan-400 font-bold">
                                      {sortDirection === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                className="text-center py-2 text-gray-300 cursor-pointer hover:text-white transition-colors bg-gray-700/30 hover:bg-gray-600/30 rounded-t"
                                onClick={() => handleSort("value")}
                                title={t(
                                  "riftEssenceCoffer.table.clickToSort",
                                  "Haz clic para ordenar"
                                )}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {t(
                                    "riftEssenceCoffer.table.value",
                                    "Valor 85%"
                                  )}
                                  <span className="text-xs text-gray-400">
                                    (↑↓)
                                  </span>
                                  {sortBy === "value" && (
                                    <span className="text-cyan-400 font-bold">
                                      {sortDirection === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Items Comunes */}
                            {sortItems(itemsData.common).map((item, index) => {
                              const stats = calculateItemStats(item.quantity);
                              return (
                                <tr
                                  key={index}
                                  className="border-b border-gray-700"
                                >
                                  <td className="py-2 text-white">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center overflow-hidden">
                                        {itemDetails[item.id] ? (
                                          <Image
                                            src={itemDetails[item.id].icon}
                                            alt={itemDetails[item.id].name}
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 object-cover"
                                          />
                                        ) : (
                                          <span className="text-xs text-white">
                                            D
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-sm">
                                        {itemDetails[item.id]?.name ||
                                          item.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 text-center text-orange-400 font-semibold">
                                    {item.quantity}
                                  </td>
                                  <td className="py-2 text-center text-green-400 font-semibold">
                                    {stats.numPerCoffer}
                                  </td>
                                  <td className="py-2 text-center text-green-400 font-semibold">
                                    {stats.percentagePerCoffer}
                                  </td>
                                  <td className="py-2 text-center text-yellow-400 font-semibold">
                                    {itemPrices[item.id]?.sell
                                      ? formatCurrency(Math.round(itemPrices[item.id].sell * 0.85))
                                      : "00G 00S 00C"}
                                  </td>
                                </tr>
                              );
                            })}
                            {/* Items Raros */}
                            {sortItems(itemsData.rare).map((item, index) => {
                              const stats = calculateItemStats(item.quantity);
                              return (
                                <tr
                                  key={index}
                                  className="border-b border-gray-700"
                                >
                                  <td className="py-2 text-white">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center overflow-hidden">
                                        {itemDetails[item.id] ? (
                                          <Image
                                            src={itemDetails[item.id].icon}
                                            alt={itemDetails[item.id].name}
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 object-cover"
                                          />
                                        ) : (
                                          <span className="text-xs text-white">
                                            R
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-sm">
                                        {itemDetails[item.id]?.name ||
                                          item.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 text-center text-red-400 font-semibold">
                                    {item.quantity}
                                  </td>
                                  <td className="py-2 text-center text-green-400 font-semibold">
                                    {stats.numPerCoffer}
                                  </td>
                                  <td className="py-2 text-center text-green-400 font-semibold">
                                    {stats.percentagePerCoffer}
                                  </td>
                                  <td className="py-2 text-center text-yellow-400 font-semibold">
                                    {itemPrices[item.id]?.sell
                                      ? formatCurrency(Math.round(itemPrices[item.id].sell * 0.85))
                                      : "00G 00S 00C"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
