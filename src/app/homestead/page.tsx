'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import Image from 'next/image';
import {
    RefreshCw,
    ExternalLink,
    ChevronDown,
    Warehouse,
} from 'lucide-react';

interface Ingredient {
    id: number;
    name: string;
    baseRequirement: number;
    efficiencyApplies: boolean;
    price?: { buy: number; sell: number };
    icon?: string;
}

interface RefinedMaterial {
    id: number;
    name: string;
    icon: string;
    efficiencyKey: 'wood' | 'metal' | 'fiber';
    ingredients: Ingredient[];
}

const REFINED_MATERIALS: RefinedMaterial[] = [
    {
        id: 103049,
        name: 'Refined Homestead Wood',
        icon: 'https://wiki.guildwars2.com/images/3/37/Refined_Homestead_Wood.png',
        efficiencyKey: 'wood',
        ingredients: [
            { id: 19722, name: 'Elder Wood Log', baseRequirement: 1, efficiencyApplies: false },
            { id: 19726, name: 'Soft Wood Log', baseRequirement: 3, efficiencyApplies: false },
            { id: 19725, name: 'Ancient Wood Log', baseRequirement: 0.5, efficiencyApplies: true },
            { id: 19723, name: 'Green Wood Log', baseRequirement: 5, efficiencyApplies: false },
            { id: 19727, name: 'Seasoned Wood Log', baseRequirement: 1, efficiencyApplies: false },
            { id: 19724, name: 'Hard Wood Log', baseRequirement: 1, efficiencyApplies: true },
        ]
    },
    {
        id: 102205,
        name: 'Refined Homestead Metal',
        icon: 'https://wiki.guildwars2.com/images/c/c1/Refined_Homestead_Metal.png',
        efficiencyKey: 'metal',
        ingredients: [
            { id: 19700, name: 'Mithril Ore', baseRequirement: 4, efficiencyApplies: false },
            { id: 19698, name: 'Gold Ore', baseRequirement: 8, efficiencyApplies: false },
            { id: 19697, name: 'Copper Ore', baseRequirement: 8, efficiencyApplies: false },
            { id: 19702, name: 'Platinum Ore', baseRequirement: 2, efficiencyApplies: true },
            { id: 19703, name: 'Silver Ore', baseRequirement: 20, efficiencyApplies: false },
            { id: 19699, name: 'Iron Ore', baseRequirement: 4, efficiencyApplies: false },
            { id: 19701, name: 'Orichalcum Ore', baseRequirement: 2, efficiencyApplies: true },
        ]
    },
    {
        id: 102306,
        name: 'Refined Homestead Fiber',
        icon: 'https://wiki.guildwars2.com/images/1/10/Refined_Homestead_Fiber.png',
        efficiencyKey: 'fiber',
        ingredients: [
            { id: 82866, name: 'Handful of Red Lentils', baseRequirement: 1, efficiencyApplies: true },
            { id: 12330, name: 'Zucchini', baseRequirement: 2, efficiencyApplies: true },
            { id: 12254, name: 'Raspberry', baseRequirement: 0.5, efficiencyApplies: true },
            { id: 12512, name: 'Artichoke', baseRequirement: 7, efficiencyApplies: true },
            { id: 12511, name: 'Butternut Squash', baseRequirement: 7, efficiencyApplies: true },
            { id: 12508, name: 'Leek', baseRequirement: 7, efficiencyApplies: true },
            { id: 12538, name: 'Sugar Pumpkin', baseRequirement: 8, efficiencyApplies: true },
            { id: 12243, name: 'Sage Leaf', baseRequirement: 0.5, efficiencyApplies: true },
            { id: 12533, name: 'Green Onion', baseRequirement: 6, efficiencyApplies: true },
            { id: 12332, name: 'Head of Cabbage', baseRequirement: 10, efficiencyApplies: true },
            { id: 12336, name: 'Dill Sprig', baseRequirement: 10, efficiencyApplies: true },
            { id: 12241, name: 'Spinach Leaf', baseRequirement: 1, efficiencyApplies: true },
            { id: 12534, name: 'Clove', baseRequirement: 1, efficiencyApplies: true },
            { id: 12510, name: 'Lotus Root', baseRequirement: 4, efficiencyApplies: true },
            { id: 12236, name: 'Black Peppercorn', baseRequirement: 0.5, efficiencyApplies: true },
            { id: 12234, name: 'Vanilla Bean', baseRequirement: 0.5, efficiencyApplies: true },
            { id: 66524, name: 'Nopal', baseRequirement: 6, efficiencyApplies: true },
            { id: 12532, name: 'Head of Cauliflower', baseRequirement: 8, efficiencyApplies: true },
            { id: 12128, name: 'Omnomberry', baseRequirement: 1, efficiencyApplies: true },
            { id: 12341, name: 'Grape', baseRequirement: 8, efficiencyApplies: true },
            { id: 12253, name: 'Strawberry', baseRequirement: 1, efficiencyApplies: true }, 
            { id: 74090, name: 'Pile of Flax Seeds', baseRequirement: 0.5, efficiencyApplies: true },
            { id: 12509, name: 'Seaweed', baseRequirement: 0.5, efficiencyApplies: true },
            { id: 12134, name: 'Carrot', baseRequirement: 1, efficiencyApplies: true },
            { id: 12547, name: 'Saffron Thread', baseRequirement: 0.5, efficiencyApplies: true },
            { id: 12545, name: 'Orrian Truffle', baseRequirement: 0.5, efficiencyApplies: true },
            { id: 12255, name: 'Blueberry', baseRequirement: 2, efficiencyApplies: true },
            { id: 12144, name: 'Snow Truffle', baseRequirement: 2, efficiencyApplies: true },
            { id: 12238, name: 'Head of Lettuce', baseRequirement: 0.5, efficiencyApplies: true },
            { id: 12142, name: 'Onion', baseRequirement: 0.5, efficiencyApplies: true },
            { id: 12162, name: 'Turnip', baseRequirement: 12, efficiencyApplies: true },
            { id: 12546, name: 'Lemongrass', baseRequirement: 4, efficiencyApplies: true },
            { id: 12507, name: 'Parsnip', baseRequirement: 7, efficiencyApplies: true },
            { id: 12537, name: 'Blackberry', baseRequirement: 1, efficiencyApplies: true },
            { id: 12342, name: 'Sesame Seed', baseRequirement: 2, efficiencyApplies: true },
            { id: 73504, name: 'Sawgill Mushroom', baseRequirement: 6, efficiencyApplies: true },
            { id: 36731, name: 'Passion Fruit', baseRequirement: 5, efficiencyApplies: true },
            { id: 73096, name: 'Pile of Allspice Berries', baseRequirement: 1, efficiencyApplies: true },
            { id: 12335, name: 'Rosemary Sprig', baseRequirement: 1, efficiencyApplies: true },
            { id: 12544, name: 'Ghost Pepper', baseRequirement: 1, efficiencyApplies: true },
            { id: 12135, name: 'Potato', baseRequirement: 4, efficiencyApplies: true },
            { id: 12536, name: 'Mint Leaf', baseRequirement: 7, efficiencyApplies: true },
            { id: 12334, name: 'Portobello Mushroomm', baseRequirement: 3.25, efficiencyApplies: true },

            { id: 12506, name: 'Tarragon Leaves', baseRequirement: 1, efficiencyApplies: true },
            { id: 12333, name: 'Kale Leaf', baseRequirement: 1, efficiencyApplies: true },
            { id: 12247, name: 'Bay Leaf', baseRequirement: 8, efficiencyApplies: true },
            { id: 12535, name: 'Rutabaga', baseRequirement: 1, efficiencyApplies: true },
            { id: 12331, name: 'Chili Pepper', baseRequirement: 2, efficiencyApplies: true },
            { id: 12248, name: 'Thyme Leaf', baseRequirement: 1, efficiencyApplies: true },
            { id: 12163, name: 'Head of Garlic', baseRequirement: 1, efficiencyApplies: true },
            { id: 12147, name: 'Mushroom', baseRequirement: 1, efficiencyApplies: true },
            { id: 12504, name: 'Cayenne Pepper', baseRequirement: 1, efficiencyApplies: true },
            { id: 73113, name: 'Cassava Root', baseRequirement: 1, efficiencyApplies: true },
            { id: 12329, name: 'Yam', baseRequirement: 8, efficiencyApplies: true },
            { id: 12161, name: 'Beet', baseRequirement: 15, efficiencyApplies: true },
            { id: 12244, name: 'Oregano Leaf', baseRequirement: 10, efficiencyApplies: true },
            { id: 66522, name: 'Prickly Pear', baseRequirement: 6, efficiencyApplies: true },

        ]
    }
];

const HomesteadPage = () => {
    usePageTitle('pageTitles.homestead', 'Homesteading');
    const { t, lang } = useI18n();
    const [prices, setPrices] = useState<Record<number, { buy: number; sell: number }>>({});
    const [icons, setIcons] = useState<Record<number, string>>({});
    const [names, setNames] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [efficiencies, setEfficiencies] = useState<Record<string, number>>({
        wood: 0,
        metal: 0,
        fiber: 0
    });

    const fetchMarketData = useCallback(async () => {
        try {
            setLoading(true);
            const allIds = [
                ...REFINED_MATERIALS.map(m => m.id),
                ...REFINED_MATERIALS.flatMap(m => m.ingredients.map(i => i.id))
            ];
            const uniqueIds = Array.from(new Set(allIds)).join(',');

            const [itemsRes, pricesRes] = await Promise.all([
                fetch(`https://api.guildwars2.com/v2/items?ids=${uniqueIds}&lang=${lang}`),
                fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${uniqueIds}`)
            ]);

            if (itemsRes.ok && pricesRes.ok) {
                const itemsData = await itemsRes.json();
                const pricesData = await pricesRes.json();

                const newIcons: Record<number, string> = {};
                const newNames: Record<number, string> = {};
                itemsData.forEach((item: any) => {
                    newIcons[item.id] = item.icon;
                    newNames[item.id] = item.name;
                });

                const newPrices: Record<number, { buy: number; sell: number }> = {};
                pricesData.forEach((price: any) => {
                    newPrices[price.id] = {
                        buy: price.buys.unit_price,
                        sell: price.sells.unit_price
                    };
                });

                setIcons(newIcons);
                setNames(newNames);
                setPrices(newPrices);
            }
        } catch (e) {
            console.error('Error fetching market data:', e);
        } finally {
            setLoading(false);
        }
    }, [lang]);

    useEffect(() => {
        fetchMarketData();
        const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchMarketData]);

    const formatGoldSilverCopper = (copper: number) => {
        if (copper === 0) return (
            <span className="flex items-center gap-1 font-mono text-zinc-500">
                0 <img src="https://wiki.guildwars2.com/images/e/eb/Copper_coin.png" alt="c" className="w-3 h-3" />
            </span>
        );

        const gold = Math.floor(copper / 10000);
        const silver = Math.floor((copper % 10000) / 100);
        const c = copper % 100;

        return (
            <span className="inline-flex items-center gap-1.5 font-mono">
                {gold > 0 && (
                    <span className="flex items-center gap-0.5 text-yellow-400">
                        {gold} <img src="https://wiki.guildwars2.com/images/d/d1/Gold_coin.png" alt="g" className="w-3.5 h-3.5" />
                    </span>
                )}
                {(silver > 0 || gold > 0) && (
                    <span className="flex items-center gap-0.5 text-gray-300">
                        {silver.toString().padStart(gold > 0 ? 2 : 1, '0')} <img src="https://wiki.guildwars2.com/images/3/3c/Silver_coin.png" alt="s" className="w-3.5 h-3.5" />
                    </span>
                )}
                <span className="flex items-center gap-0.5 text-orange-400">
                    {c.toString().padStart(silver > 0 || gold > 0 ? 2 : 1, '0')} <img src="https://wiki.guildwars2.com/images/e/eb/Copper_coin.png" alt="c" className="w-3.5 h-3.5" />
                </span>
            </span>
        );
    };

    const calculateIngredientCost = (ing: Ingredient, efficiencyLevel: number) => {
        const requirement = ing.efficiencyApplies && efficiencyLevel > 0
            ? ing.baseRequirement / 2
            : ing.baseRequirement;
        const sellPrice = prices[ing.id]?.sell || 0;
        return {
            requirement,
            totalCost: requirement * sellPrice,
            buyPrice: prices[ing.id]?.buy || 0,
            sellPrice: sellPrice
        };
    };

    const getCheapestOption = (material: RefinedMaterial) => {
        const options = material.ingredients.map(ing => ({
            ...ing,
            cost: calculateIngredientCost(ing, efficiencies[material.efficiencyKey]).totalCost
        }));
        return options.sort((a, b) => a.cost - b.cost)[0];
    };

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3"
                    >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                            <Warehouse className="h-7 w-7 text-emerald-300" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white sm:text-4xl">
                                {t('homestead.forge', 'Homestead Forge')}
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
                                {t('homestead.description', 'Real-time cost analysis for Refined Homestead materials. Find the most efficient way to farm your decorations.')}
                            </p>
                        </div>
                    </motion.div>

                    <button
                        onClick={fetchMarketData}
                        disabled={loading}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-800/50 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-slate-700/50 hover:text-white disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? t('homestead.fetching', 'Fetching Prices...') : t('homestead.refresh', 'Refresh Market Data')}
                    </button>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8 overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm"
                >
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-600/50 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
                                <th className="px-4 py-3 sm:px-6">{t('homestead.material', 'Material')}</th>
                                <th className="px-4 py-3 text-right sm:px-6">{t('homestead.cheapest', 'Cheapest Material')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {REFINED_MATERIALS.map((mat) => {
                                const cheapest = getCheapestOption(mat);
                                return (
                                    <tr key={mat.id} className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 sm:px-6">
                                            <div className="flex items-center gap-3">
                                                <Image src={mat.icon} alt={names[mat.id] || mat.name} width={24} height={24} className="rounded" />
                                                <span className="text-sm font-semibold text-white">{names[mat.id] || mat.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 sm:px-6">
                                            <div className="flex items-center justify-end gap-3 text-right">
                                                <div className="flex items-center gap-2">
                                                    {icons[cheapest.id] ? (
                                                        <Image src={icons[cheapest.id]} alt={names[cheapest.id] || cheapest.name} width={20} height={20} className="rounded-sm" />
                                                    ) : (
                                                        <div className="h-5 w-5 animate-pulse rounded-sm bg-slate-700/50" />
                                                    )}
                                                    <span className="text-xs text-zinc-400">{names[cheapest.id] || cheapest.name}</span>
                                                </div>
                                                <div className="flex min-w-[80px] justify-end">
                                                    {formatGoldSilverCopper(cheapest.cost)}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </motion.div>

                <div className="space-y-6">
                    {REFINED_MATERIALS.map((mat) => (
                        <motion.div
                            key={mat.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/50 backdrop-blur-sm"
                        >
                            <div className="flex flex-col gap-4 border-b border-slate-600/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                                        <Image src={mat.icon} alt={names[mat.id] || mat.name} width={40} height={40} className="rounded" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{names[mat.id] || mat.name}</h2>
                                        <a
                                            href={`https://wiki.guildwars2.com/wiki/${mat.name.replace(/ /g, '_')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                                        >
                                            <ExternalLink size={12} />
                                            Wiki
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border border-slate-600/50 bg-slate-900/40 px-3 py-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        {t('homestead.efficiency', 'Trade Efficiency:')}
                                    </span>
                                    <div className="relative">
                                        <select
                                            value={efficiencies[mat.efficiencyKey]}
                                            onChange={(e) => setEfficiencies(prev => ({ ...prev, [mat.efficiencyKey]: parseInt(e.target.value) }))}
                                            className="cursor-pointer appearance-none rounded-lg border border-slate-600/50 bg-slate-800 px-3 py-1.5 pr-8 text-sm font-medium text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                        >
                                            <option value={0}>{t('homestead.level0', 'Level 0')}</option>
                                            <option value={1}>{t('homestead.level1', 'Level 1 (Upgraded)')}</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-600/50 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
                                            <th className="px-4 py-3 sm:px-6">{t('common.item', 'Item')}</th>
                                            <th className="px-3 py-3 text-center">{t('homestead.detail.buy', 'Buy Price')}</th>
                                            <th className="px-3 py-3 text-center">{t('homestead.detail.sell', 'Sell Price')}</th>
                                            <th className="px-3 py-3 text-center">{t('homestead.detail.required', 'Required')}</th>
                                            <th className="px-4 py-3 text-right sm:px-6">{t('homestead.detail.total', 'Total Cost')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mat.ingredients
                                            .map(ing => ({ ...ing, ...calculateIngredientCost(ing, efficiencies[mat.efficiencyKey]) }))
                                            .map((item, iIndex) => (
                                                <tr
                                                    key={`${item.id}-${iIndex}`}
                                                    className={`border-b border-slate-700/40 last:border-0 transition-colors ${iIndex === 0 ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-slate-700/30'}`}
                                                >
                                                    <td className="px-4 py-3 sm:px-6">
                                                        <div className="flex items-center gap-3">
                                                            {icons[item.id] ? (
                                                                <Image
                                                                    src={icons[item.id]}
                                                                    alt={names[item.id] || item.name}
                                                                    width={32}
                                                                    height={32}
                                                                    className={`rounded border ${iIndex === 0 ? 'border-emerald-500/40' : 'border-slate-600/50'}`}
                                                                />
                                                            ) : (
                                                                <div className="h-8 w-8 animate-pulse rounded border border-slate-600/50 bg-slate-700/50" />
                                                            )}
                                                            <span className={`text-sm font-medium ${iIndex === 0 ? 'text-emerald-300' : 'text-gray-200'}`}>
                                                                {names[item.id] || item.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <div className="flex justify-center opacity-70">
                                                            {formatGoldSilverCopper(item.buyPrice)}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <div className="flex justify-center">
                                                            {formatGoldSilverCopper(item.sellPrice)}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className={`text-sm font-semibold ${item.efficiencyApplies && efficiencies[mat.efficiencyKey] > 0 ? 'text-sky-400' : 'text-zinc-400'}`}>
                                                                {item.requirement.toFixed(2)}
                                                            </span>
                                                            {item.efficiencyApplies && efficiencies[mat.efficiencyKey] > 0 && (
                                                                <span className="text-[10px] font-medium uppercase tracking-wide text-sky-500/70">
                                                                    {t('homestead.detail.mastery', 'Mastery Active')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right sm:px-6">
                                                        <div className="flex justify-end font-semibold">
                                                            {formatGoldSilverCopper(item.totalCost)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomesteadPage;
