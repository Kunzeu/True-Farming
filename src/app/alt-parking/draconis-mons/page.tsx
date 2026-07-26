"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Users, Clock, Coins, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useI18n } from "@/contexts/I18nContext";
import Image from "next/image";

// Datos específicos de Draconis Mons
const draconisMonsData = {
  id: "draconis-mons",
  name: "Draconis Mons",
  totalCharacters: 453,
  rewards: [
    {
      nameKey: "altParking.rewards.unboundMagic",
      quantity: 13693,
      avgPerCharacter: 30.23,
      category: "magic"
    },
    {
      nameKey: "altParking.rewards.fireOrchidBlossom",
      quantity: 1359,
      avgPerCharacter: 3.00,
      category: "materials"
    },
    {
      nameKey: "altParking.rewards.greenUnids",
      quantity: 438,
      avgPerCharacter: 0.97,
      category: "materials"
    },
    {
      nameKey: "altParking.rewards.yellowUnids",
      quantity: 15,
      avgPerCharacter: 0.03,
      category: "materials"
    },
    {
      nameKey: "altParking.rewards.crystal",
      quantity: 506,
      avgPerCharacter: 1.12,
      category: "materials"
    },
    {
      nameKey: "altParking.rewards.orbs",
      quantity: 69,
      avgPerCharacter: 0.15,
      category: "materials"
    },
    {
      nameKey: "altParking.rewards.crest",
      quantity: 26,
      avgPerCharacter: 0.06,
      category: "materials"
    },
    {
      nameKey: "altParking.rewards.medallion",
      quantity: 315,
      avgPerCharacter: 0.70,
      category: "materials"
    },
    {
      nameKey: "altParking.rewards.rare",
      quantity: 453,
      avgPerCharacter: 1.00,
      category: "equipment"
    },
    {
      nameKey: "altParking.rewards.exotic",
      quantity: 0,
      avgPerCharacter: 0.00,
      category: "equipment"
    },
    {
      nameKey: "altParking.rewards.empyreal",
      quantity: 1356,
      avgPerCharacter: 2.99,
      category: "materials"
    },
    {
      nameKey: "altParking.rewards.recipes",
      quantity: 12,
      avgPerCharacter: 0.03,
      category: "materials"
    }
  ]
};

export default function DraconisMonsLocationPage() {
  const { t } = useI18n();
  usePageTitle("pageTitles.draconisMonsLocation", "Draconis Mons");

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [fireOrchidData, setFireOrchidData] = useState<{
    name: string;
    icon: string;
  } | null>(null);
  const [greenUnidsData, setGreenUnidsData] = useState<{
    name: string;
    icon: string;
  } | null>(null);
  const [yellowUnidsData, setYellowUnidsData] = useState<{
    name: string;
    icon: string;
  } | null>(null);
  const [exoticData, setExoticData] = useState<{
    name: string;
    icon: string;
  } | null>(null);
  const [rareData, setRareData] = useState<{
    name: string;
    icon: string;
  } | null>(null);
  const [empyrealData, setEmpyrealData] = useState<{
    name: string;
    icon: string;
  } | null>(null);
  const [recipeData, setRecipeData] = useState<{
    name: string;
    icon: string;
  } | null>(null);

  // Obtener datos del Fire Orchid Blossom desde la API
  useEffect(() => {
    const fetchFireOrchidData = async () => {
      try {
        const response = await fetch(`https://api.guildwars2.com/v2/items/81127?lang=${t('language', 'en')}`);
        if (response.ok) {
          const data = await response.json();
          setFireOrchidData({
            name: data.name,
            icon: data.icon
          });
        }
      } catch (error) {
        console.error('Error fetching Fire Orchid data:', error);
      }
    };

    fetchFireOrchidData();
  }, [t]);

  // Obtener datos de los Green Unids desde la API
  useEffect(() => {
    const fetchGreenUnidsData = async () => {
      try {
        const response = await fetch(`https://api.guildwars2.com/v2/items/84731?lang=${t('language', 'en')}`);
        if (response.ok) {
          const data = await response.json();
          setGreenUnidsData({
            name: data.name,
            icon: data.icon
          });
        }
      } catch (error) {
        console.error('Error fetching Green Unids data:', error);
      }
    };

    fetchGreenUnidsData();
  }, [t]);

  // Obtener datos de los Yellow Unids desde la API
  useEffect(() => {
    const fetchYellowUnidsData = async () => {
      try {
        const response = await fetch(`https://api.guildwars2.com/v2/items/83008?lang=${t('language', 'en')}`);
        if (response.ok) {
          const data = await response.json();
          setYellowUnidsData({
            name: data.name,
            icon: data.icon
          });
        }
      } catch (error) {
        console.error('Error fetching Yellow Unids data:', error);
      }
    };

    fetchYellowUnidsData();
  }, [t]);

  // Obtener datos del ítem exótico (ID 27022) desde la API
  useEffect(() => {
    const fetchExoticData = async () => {
      try {
        const response = await fetch(`https://api.guildwars2.com/v2/items/27022?lang=${t('language', 'en')}`);
        if (response.ok) {
          const data = await response.json();
          setExoticData({ name: data.name, icon: data.icon });
        }
      } catch (error) {
        console.error('Error fetching Exotic item (27022):', error);
      }
    };
    fetchExoticData();
  }, [t]);

  // Obtener datos del ítem raro (ID 41668) desde la API
  useEffect(() => {
    const fetchRareData = async () => {
      try {
        const response = await fetch(`https://api.guildwars2.com/v2/items/41668?lang=${t('language', 'en')}`);
        if (response.ok) {
          const data = await response.json();
          setRareData({ name: data.name, icon: data.icon });
        }
      } catch (error) {
        console.error('Error fetching Rare item (41668):', error);
      }
    };
    fetchRareData();
  }, [t]);

  // Obtener datos de los Empyreal Fragments desde la API
  useEffect(() => {
    const fetchEmpyrealData = async () => {
      try {
        const response = await fetch(`https://api.guildwars2.com/v2/items/46735?lang=${t('language', 'en')}`);
        if (response.ok) {
          const data = await response.json();
          setEmpyrealData({
            name: data.name,
            icon: data.icon
          });
        }
      } catch (error) {
        console.error('Error fetching Empyreal data:', error);
      }
    };

    fetchEmpyrealData();
  }, [t]);

  // Obtener datos de las recetas desde la API
  useEffect(() => {
    const fetchRecipeData = async () => {
      try {
        const response = await fetch(`https://api.guildwars2.com/v2/items/67178?lang=${t('language', 'en')}`);
        if (response.ok) {
          const data = await response.json();
          setRecipeData({
            name: data.name,
            icon: data.icon
          });
        }
      } catch (error) {
        console.error('Error fetching Recipe data:', error);
      }
    };

    fetchRecipeData();
  }, [t]);
  const [prices, setPrices] = useState<Record<number, number>>({});

  // Fetch prices for Unidentified Gear, Recipe, Crystal, Orbs, and Medallions
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = [84731, 83008, 67178, 24473, 24508, 24476, 24533]; // Green Unid, Yellow Unid, Recipe, Crystal, Orb, Medallion, Crest
        const response = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${ids.join(',')}`);
        if (response.ok) {
          const data = await response.json();
          const newPrices: Record<number, number> = {};
          data.forEach((item: any) => {
            newPrices[item.id] = item.sells.unit_price;
          });
          setPrices(newPrices);
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
  }, []);

  const categories = [
    { key: "all", label: t("altParking.stats.allCategories", "Todas las categorías") },
    { key: "magic", label: t("altParking.stats.magic", "Magia") },
    { key: "materials", label: t("altParking.stats.materials", "Materiales") },
    { key: "equipment", label: t("altParking.stats.equipment", "Equipamiento") }
  ];

  const getFilteredRewards = () => {
    if (selectedCategory === "all") {
      return draconisMonsData.rewards;
    }
    return draconisMonsData.rewards.filter(reward => reward.category === selectedCategory);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "magic": return "from-purple-500/20 to-purple-600/20 border-purple-500/30";
      case "materials": return "from-blue-500/20 to-cyan-500/20 border-blue-500/30";
      case "equipment": return "from-orange-500/20 to-red-500/20 border-orange-500/30";
      default: return "from-gray-500/20 to-gray-600/20 border-gray-500/30";
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const getUnitPrice = (reward: typeof draconisMonsData.rewards[0]) => {
    switch (reward.nameKey) {
      case "altParking.rewards.unboundMagic":
        return 0.0009; // 9 copper
      case "altParking.rewards.fireOrchidBlossom":
        return 0.0324; // 15 copper (User requested)
      case "altParking.rewards.greenUnids":
        return (prices[84731] || 0) / 10000; // Price in Gold (after tax)
      case "altParking.rewards.yellowUnids":
      case "altParking.rewards.rare":
        return (prices[83008] || 0) / 10000; // Price in Gold (after tax)
      case "altParking.rewards.recipes":
        return (prices[67178] || 0) / 10000; // Price in Gold (after tax)
      case "altParking.rewards.empyreal":
        return 0.0030; // 30 copper
      case "altParking.rewards.exotic":
        return 0.45; // 45 silver
      case "altParking.rewards.crystal":
        return (prices[24473] || 0) / 10000; // Price in Gold (after tax)
      case "altParking.rewards.orbs":
        return (prices[24508] || 0) / 10000; // Price in Gold (after tax)
      case "altParking.rewards.medallion":
        return (prices[24476] || 0) / 10000; // Price in Gold (after tax)
      case "altParking.rewards.crest":
        return (prices[24533] || 0) / 10000; // Price in Gold (after tax)
      default:
        return 0;
    }
  };

  const calculateValue = (reward: typeof draconisMonsData.rewards[0]) => {
    const avg = reward.avgPerCharacter;
    return avg * getUnitPrice(reward);
  };

  const formatGold = (amount: number) => {
    const gold = Math.floor(amount);
    const silver = Math.floor((amount - gold) * 100);
    const copper = Math.round(((amount - gold) * 100 - silver) * 100);

    return (
      <div className="flex items-center justify-end gap-1">
        <span className="flex items-center text-gray-300">
          {gold} <Image src="https://wiki.guildwars2.com/images/d/d1/Gold_coin.png" alt="Gold" width={14} height={14} className="ml-0.5" />
        </span>
        <span className="flex items-center text-gray-300">
          {silver.toString().padStart(2, '0')} <Image src="https://wiki.guildwars2.com/images/3/3c/Silver_coin.png" alt="Silver" width={14} height={14} className="ml-0.5" />
        </span>
        <span className="flex items-center text-gray-300">
          {copper.toString().padStart(2, '0')} <Image src="https://wiki.guildwars2.com/images/e/eb/Copper_coin.png" alt="Copper" width={14} height={14} className="ml-0.5" />
        </span>
      </div>
    );
  };

  const filteredRewards = getFilteredRewards();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Link
                href="/alt-parking"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 hover:bg-gray-800/90 border border-purple-500/30 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("altParking.backToAltParking", "Volver a Alt Parking")}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
            >
              <div className="w-20 h-20 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                <MapPin className="h-10 w-10 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold">
                  <span
                    className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
                    style={{
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {draconisMonsData.name}
                  </span>
                </h1>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center px-4"
            >
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-4">
                {t("altParking.draconisMons.description", "Ubicación ideal para recoger recompensas diarias. Excelente para principiantes.")}
              </p>
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-3 max-w-xl mx-auto">
                <p className="text-sm text-yellow-200 font-medium">
                  {t("altParking.draconisMons.exoticWarning", "Cabe la posibilidad, ínfima, de que caigan exóticos y ascendidos")}
                </p>
              </div>



              {/* Data Source Credits */}
              <div className="mt-8 text-center border-t border-gray-700/50 pt-6">
                <p className="text-gray-400 text-sm">
                  {t("altParking.dataSource", "Data Source")}:{" "}
                  <a
                    href="https://www.twitch.tv/vortus43"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    Vortus43
                  </a>
                  , <span className="text-gray-300">NeoXare.1625</span>, <span className="text-gray-300">Rc Ganz.2315</span>, <span className="text-gray-300">kusanagi.1093</span>
                </p>
              </div>
            </motion.div>
          </div>

          {/* Información de la ubicación */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-600/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">
                    {t("altParking.stats.totalCharacters", "Total Personajes")}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">{draconisMonsData.totalCharacters}</p>
              </div>


              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">
                    {t("altParking.stats.timeRequired", "Tiempo")}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">{t("altParking.stats.timeRequiredValue", "1 minuto")}</p>
              </div>

              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">
                    {t("altParking.stats.dailyReward", "Diario")}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatGold(draconisMonsData.rewards
                    .reduce((acc, reward) => acc + calculateValue(reward), 0))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Estadísticas detalladas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600/50"
          >
            {/* Header de estadísticas */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {t("altParking.stats.title", "Estadísticas Detalladas")}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {t("altParking.stats.subtitle", "Datos basados en 453 personajes")}
                  </p>
                </div>
              </div>

              {/* Filtro de categorías */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20"
                >
                  {categories.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabla de recompensas */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600/50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                      {t("altParking.stats.reward", "Recompensa")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">
                      {t("altParking.stats.quantity", "Cantidad")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">
                      {t("altParking.stats.avgPerCharacter", "Promedio por Personaje")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">
                      {t("altParking.stats.unitPrice", "Precio Unitario")}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">
                      {t("altParking.stats.estimatedValue", "Valor Estimado")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRewards.map((reward, index) => (
                    <motion.tr
                      key={reward.nameKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className={`border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors ${index % 2 === 0 ? 'bg-orange-500/5' : 'bg-blue-500/5'
                        }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getCategoryColor(reward.category)}`}></div>
                          {reward.nameKey === "altParking.rewards.fireOrchidBlossom" ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src={fireOrchidData?.icon || "https://wiki.guildwars2.com/images/e/ed/Fire_Orchid_Blossom.png"}
                                alt={fireOrchidData?.name || "Fire Orchid Blossom"}
                                width={32}
                                height={32}
                                className="rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://wiki.guildwars2.com/images/e/ed/Fire_Orchid_Blossom.png";
                                }}
                              />
                              <span className="text-white font-medium">
                                {fireOrchidData?.name || "Fire Orchid Blossom"}
                              </span>
                            </div>
                          ) : reward.nameKey === "altParking.rewards.greenUnids" ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src={greenUnidsData?.icon || "https://wiki.guildwars2.com/images/4/47/Piece_of_Unidentified_Gear.png"}
                                alt={greenUnidsData?.name || "Piece of Unidentified Gear"}
                                width={32}
                                height={32}
                                className="rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://wiki.guildwars2.com/images/4/47/Piece_of_Unidentified_Gear.png";
                                }}
                              />
                              <span className="text-white font-medium">
                                {greenUnidsData?.name || "Piece of Unidentified Gear"}
                              </span>
                            </div>
                          ) : reward.nameKey === "altParking.rewards.yellowUnids" ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src={yellowUnidsData?.icon || "https://wiki.guildwars2.com/images/e/e5/Piece_of_Rare_Unidentified_Gear.png"}
                                alt={yellowUnidsData?.name || "Piece of Rare Unidentified Gear"}
                                width={32}
                                height={32}
                                className="rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://wiki.guildwars2.com/images/e/e5/Piece_of_Rare_Unidentified_Gear.png";
                                }}
                              />
                              <span className="text-white font-medium">
                                {yellowUnidsData?.name || "Piece of Rare Unidentified Gear"}
                              </span>
                            </div>
                          ) : reward.nameKey === "altParking.rewards.crystal" ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src="https://wiki.guildwars2.com/images/b/b7/Emerald_Crystal.png"
                                alt="Crystal"
                                width={32}
                                height={32}
                                className="rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://wiki.guildwars2.com/images/b/b7/Emerald_Crystal.png";
                                }}
                              />
                              <span className="text-white font-medium">
                                {t(reward.nameKey, "Crystal")}
                              </span>
                            </div>
                          ) : reward.nameKey === "altParking.rewards.orbs" ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src="https://wiki.guildwars2.com/images/7/73/Ruby_Orb.png"
                                alt="Ruby Orb"
                                width={32}
                                height={32}
                                className="rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://wiki.guildwars2.com/images/7/73/Ruby_Orb.png";
                                }}
                              />
                              <span className="text-white font-medium">
                                {t(reward.nameKey, "Orbs")}
                              </span>
                            </div>
                          ) : reward.nameKey === "altParking.rewards.medallion" ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src="https://wiki.guildwars2.com/images/c/cc/Medallion_of_the_Shaman.png"
                                alt="Medallion of the Shaman"
                                width={32}
                                height={32}
                                className="rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://wiki.guildwars2.com/images/c/cc/Medallion_of_the_Shaman.png";
                                }}
                              />
                              <span className="text-white font-medium">
                                {t(reward.nameKey, "Medallion")}
                              </span>
                            </div>
                          ) : reward.nameKey === "altParking.rewards.crest" ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src="https://wiki.guildwars2.com/images/d/d2/Crest_of_the_Assassin.png"
                                alt="Crest of the Assassin"
                                width={32}
                                height={32}
                                className="rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://wiki.guildwars2.com/images/d/d2/Crest_of_the_Assassin.png";
                                }}
                              />
                              <span className="text-white font-medium">
                                {t(reward.nameKey, "Crests")}
                              </span>
                            </div>
                          ) : reward.nameKey === "altParking.rewards.empyreal" ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src={empyrealData?.icon || "https://wiki.guildwars2.com/images/2/2f/Empyreal_Fragment.png"}
                                alt={empyrealData?.name || "Empyreal Fragment"}
                                width={32}
                                height={32}
                                className="rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://wiki.guildwars2.com/images/2/2f/Empyreal_Fragment.png";
                                }}
                              />
                              <span className="text-white font-medium">
                                {empyrealData?.name || t(reward.nameKey, "Empyreal Fragment")}
                              </span>
                            </div>
                          ) : reward.nameKey === "altParking.rewards.recipes" ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src={recipeData?.icon || "https://wiki.guildwars2.com/images/6/60/Recipe_sheet_superior_rune.png"}
                                alt={recipeData?.name || "Recipe Sheet"}
                                width={32}
                                height={32}
                                className="rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://wiki.guildwars2.com/images/6/60/Recipe_sheet_superior_rune.png";
                                }}
                              />
                              <span className="text-white font-medium">
                                {recipeData?.name || t(reward.nameKey, "Recipes")}
                              </span>
                            </div>
                          ) : reward.nameKey === "altParking.rewards.unboundMagic" ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src="https://wiki.guildwars2.com/images/1/19/Unbound_Magic_%28highres%29.png"
                                alt="Unbound Magic"
                                width={32}
                                height={32}
                                className="rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://wiki.guildwars2.com/images/1/19/Unbound_Magic_%28highres%29.png";
                                }}
                              />
                              <span className="text-white font-medium">
                                {t(reward.nameKey, "Unbound Magic")}
                              </span>
                            </div>
                          ) : reward.nameKey === "altParking.rewards.exotic" ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src={exoticData?.icon || "https://wiki.guildwars2.com/images/0/07/X7-10_Alpha.png"}
                                alt={exoticData?.name || "Exotic Item"}
                                width={32}
                                height={32}
                                className="rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://wiki.guildwars2.com/images/0/07/X7-10_Alpha.png";
                                }}
                              />
                              <span className="text-white font-medium">
                                {t(reward.nameKey, "Exotic Item")}
                              </span>
                            </div>
                          ) : reward.nameKey === "altParking.rewards.rare" ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src={rareData?.icon || "https://wiki.guildwars2.com/images/6/6b/Fine_Greatsword.png"}
                                alt={rareData?.name || "Rare Item"}
                                width={32}
                                height={32}
                                className="rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://wiki.guildwars2.com/images/6/6b/Fine_Greatsword.png";
                                }}
                              />
                              <span className="text-white font-medium">
                                {t(reward.nameKey, "Rare Item")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-white font-medium">{t(reward.nameKey, "Recompensa")}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-yellow-400 font-semibold">
                          {formatNumber(reward.quantity)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-green-400 font-semibold">
                          {formatNumber(reward.avgPerCharacter)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatGold(getUnitPrice(reward))}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatGold(calculateValue(reward))}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>


          </motion.div>
        </div>
      </div>
    </>
  );
}

