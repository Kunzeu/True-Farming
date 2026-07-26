'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Package, BarChart3, ArrowLeft, Coins, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';

interface RewardItem {
    id: number;
    count: number;
    name?: string;
    icon?: string;
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
}

export default function LaurelsPage() {
    const { lang, t } = useI18n();
    usePageTitle('pageTitles.laurels', 'Conversión de Laureles');

    const [itemDetails, setItemDetails] = useState<Record<number, GW2Item>>({});
    const [itemPrices, setItemPrices] = useState<Record<number, number>>({});
    const [laurelIcon, setLaurelIcon] = useState<string>('https://wiki-es.guildwars2.com/images/5/56/Laurel.png');

    const t3Data = {
        totalBags: 2780,
        accounts: 15,
        items: [
            { id: 24344, count: 5172 }, // Bone
            { id: 24348, count: 5311 }, // Claw
            { id: 24274, count: 5272 }, // Pile of Radiant Dust
            { id: 24354, count: 5194 }, // Fang
            { id: 24286, count: 5144 }, // Scale
            { id: 24298, count: 5091 }, // Totem
            { id: 24280, count: 5385 }, // Venom Sac
            { id: 24292, count: 5184 }  // Vial of Blood
        ]
    };

    const t4Data = {
        totalBags: 2980,
        accounts: 16,
        items: [
            { id: 24345, count: 5653 }, // Heavy Bone
            { id: 24349, count: 5639 }, // Sharp Claw
            { id: 24275, count: 5583 }, // Pile of Luminous Dust
            { id: 24355, count: 5400 }, // Sharp Fang
            { id: 24287, count: 5563 }, // Smooth Scale
            { id: 24363, count: 5661 }, // Engraved Totem
            { id: 24281, count: 5771 }, // Full Venom Sac
            { id: 24293, count: 5443 }  // Vial of Thick Blood
        ]
    };

    const t6Data = {
        // Datos extraídos de la imagen proporcionada (IDs T6 añadidos)
        totalBags: 14183,
        accounts: 3,
        items: [
            { id: 24277, name: 'Polvo', count: 5374 },   // Dust
            { id: 24357, name: 'Colmillo', count: 5275 }, // Fang
            { id: 24358, name: 'Hueso', count: 5357 },   // Bone
            { id: 24351, name: 'Garra', count: 5318 },   // Claw
            { id: 24289, name: 'Escama', count: 5307 },  // Scale
            { id: 24300, name: 'Totem', count: 5295 },   // Totem
            { id: 24283, name: 'Veneno', count: 5311 },  // Venom
            { id: 24295, name: 'Sangre', count: 5312 }   // Blood
        ]
    };

    const fetchItems = useCallback(async (language: string) => {
        const ids = [
            ...t3Data.items.map(i => i.id),
            ...t4Data.items.map(i => i.id),
            // incluir solo IDs definidos (t6Data no contiene IDs por defecto)
            ...((t6Data.items as any[]).map(i => i.id).filter((id) => !!id) as number[])
        ];

        try {
            const response = await fetch(`https://api.guildwars2.com/v2/items?ids=${ids.join(',')}&lang=${language}`);
            const data: GW2Item[] = await response.json();
            const details: Record<number, GW2Item> = {};
            data.forEach(item => {
                details[item.id] = item;
            });
            setItemDetails(details);
        } catch (err) {
            console.error('Error fetching items:', err);
        }
    }, [t3Data.items, t4Data.items]);

    const fetchPrices = useCallback(async () => {
        const ids = [
            ...t3Data.items.map(i => i.id),
            ...t4Data.items.map(i => i.id),
            ...((t6Data.items as any[]).map(i => i.id).filter((id) => !!id) as number[])
        ];

        try {
            const response = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${ids.join(',')}`);
            const data: GW2Price[] = await response.json();
            const prices: Record<number, number> = {};
            data.forEach(price => {
                // Usar precio de venta (sells) y aplicar 90% como en la imagen del usuario
                prices[price.id] = (price.sells?.unit_price || 0) * 0.9;
            });
            setItemPrices(prices);
        } catch (err) {
            console.error('Error fetching prices:', err);
        }
    }, [t3Data.items, t4Data.items]);

    useEffect(() => {
        if (lang) {
            fetchItems(lang);
        }
        fetchPrices();
    }, [lang, fetchItems, fetchPrices]);

    const formatCurrency = (copper: number) => {
        const gold = Math.floor(copper / 10000);
        const silver = Math.floor((copper % 10000) / 100);
        const cop = Math.floor(copper % 100);

        if (gold > 0) {
            return `${gold}g ${silver.toString().padStart(2, '0')}s ${cop.toString().padStart(2, '0')}c`;
        }
        return `${silver}s ${cop.toString().padStart(2, '0')}c`;
    };

    const calculateTotalValue = (items: { id: number; count: number }[]) => {
        return items.reduce((acc, item) => {
            const price = itemPrices[item.id] || 0;
            return acc + price * item.count;
        }, 0);
    };

    const totalT3Value = calculateTotalValue(t3Data.items);
    const totalT4Value = calculateTotalValue(t4Data.items);

    const totalT3Items = t3Data.items.reduce((acc, i) => acc + i.count, 0);
    const totalT4Items = t4Data.items.reduce((acc, i) => acc + i.count, 0);

    const avgT3Items = totalT3Items / t3Data.totalBags;
    const avgT4Items = totalT4Items / t4Data.totalBags;

    const avgT3ValuePerLaurel = totalT3Value / t3Data.totalBags;
    const avgT4ValuePerLaurel = totalT4Value / t4Data.totalBags;

    // Cálculos para T6 (si hay precios asociados con IDs, se contabilizarán)
    const totalT6Items = (t6Data.items as any[]).reduce((acc, i) => acc + i.count, 0);
    const avgT6Items = totalT6Items / t6Data.totalBags;
    const totalT6Value = calculateTotalValue((t6Data.items as any[]).filter((i) => !!i.id));
    const avgT6ValuePerLaurel = totalT6Value / t6Data.totalBags;

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
                    {/* Header */}
                    <div className="mb-8">
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
                                {t('common.back', 'Volver')}
                            </Link>
                        </motion.div>
                        

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-center mb-8"
                        >
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg flex items-center justify-center border border-yellow-400/30 overflow-hidden">
                                    <Image
                                        src={laurelIcon}
                                        alt="Laurel"
                                        width={48}
                                        height={48}
                                        className="object-contain"
                                    />
                                </div>
                                <h1 className="text-4xl font-bold text-yellow-400 drop-shadow-[0_2px_10px_rgba(234,179,8,0.3)]">
                                    {t('opened.laurels.title', 'Laurel Conversion')}
                                </h1>
                            </div>
                            <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
                                {t('opened.laurels.subtitle', 'Análisis de rentabilidad al convertir laureles en bolsas de materiales de Tier 3 y Tier 4.')}
                            </p>
                            <div className="mt-4 text-sm text-gray-400">
                                {t('opened.laurels.credits', 'Crédito de datos: kusanagi.1093')}
                                <span className="mx-1">—</span>
                                <a href="https://twitch.tv/Vortus43" target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">Vortus43 (Twitch)</a>
                            </div>
                        </motion.div>
                    </div>

                    {/* Tier Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-stretch">
                        {/* Tier 3 Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/30 overflow-hidden shadow-xl h-full flex flex-col"
                        >
                            <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 p-4 border-b border-purple-500/30">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30 overflow-hidden group-hover:border-purple-500/50 transition-colors">
                                            <Image
                                                src="https://wiki.guildwars2.com/images/a/a3/Heavy_Crafting_Bag.png"
                                                alt="Tier 3 Bag"
                                                width={32}
                                                height={32}
                                                className="object-contain"
                                            />
                                        </div>
                                        <h2 className="text-2xl font-bold text-purple-300">Materials - Tier 3</h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-purple-400 uppercase tracking-wider">{t('opened.laurels.bagsUsed', 'Bolsas Usadas')}</p>
                                        <p className="text-lg font-bold text-white">{t3Data.totalBags.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-purple-500/20">
                                        <p className="text-xs text-purple-400 mb-1">{t('opened.laurels.itemsPerBag', 'Items x Bolsa')}</p>
                                        <p className="text-xl font-bold text-white">{avgT3Items.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-purple-500/20">
                                        <p className="text-xs text-purple-400 mb-1">{t('opened.laurels.averagePerLaurel', 'Promedio x L')}</p>
                                        <p className="text-xl font-bold text-yellow-400">{formatCurrency(avgT3ValuePerLaurel)}</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-purple-400 border-b border-purple-500/20">
                                                <th className="text-left py-2 font-medium">{t('common.item', 'Item')}</th>
                                                <th className="text-right py-2 font-medium">{t('common.quantity', 'Cantidad')}</th>
                                                <th className="text-right py-2 font-medium">{t('opened.laurels.averagePerLaurel', 'Promedio x L')}</th>
                                                <th className="text-right py-2 font-medium">{t('common.price', 'Precio')} (90%)</th>
                                                <th className="text-right py-2 font-medium">{t('common.total', 'Total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-purple-500/10">
                                            {t3Data.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-purple-500/5 transition-colors">
                                                    <td className="py-2">
                                                        <div className="flex items-center gap-2">
                                                            {itemDetails[item.id] ? (
                                                                <>
                                                                    <Image
                                                                        src={itemDetails[item.id].icon}
                                                                        alt={itemDetails[item.id].name}
                                                                        width={24}
                                                                        height={24}
                                                                        className="rounded shadow-sm"
                                                                    />
                                                                    <span className="text-gray-200">{itemDetails[item.id].name}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-400">{t('common.loading', 'Cargando...')}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-right text-gray-300">{item.count.toLocaleString()}</td>
                                                    <td className="text-right text-gray-400">{(item.count / t3Data.totalBags).toFixed(2)}</td>
                                                    <td className="text-right text-gray-400 whitespace-nowrap">{formatCurrency(itemPrices[item.id] || 0)}</td>
                                                    <td className="text-right text-purple-300 font-medium whitespace-nowrap">
                                                        {formatCurrency((itemPrices[item.id] || 0) * item.count)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-purple-500/30">
                                                <td className="py-3 font-bold text-white">{t('common.total', 'Total')}</td>
                                                <td className="text-right text-white font-bold">
                                                    {t3Data.items.reduce((acc, i) => acc + i.count, 0).toLocaleString()}
                                                </td>
                                                <td className="text-right text-white font-bold">
                                                    {(t3Data.items.reduce((acc, i) => acc + i.count, 0) / t3Data.totalBags).toFixed(2)}
                                                </td>
                                                <td></td>
                                                <td className="text-right text-green-400 font-bold text-lg whitespace-nowrap">
                                                    {formatCurrency(totalT3Value)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </motion.div>

                        {/* Tier 4 Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-orange-500/30 overflow-hidden shadow-xl h-full flex flex-col"
                        >
                            <div className="bg-gradient-to-r from-orange-600/20 to-orange-800/20 p-4 border-b border-orange-500/30">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center border border-orange-500/30 overflow-hidden group-hover:border-orange-500/50 transition-colors">
                                            <Image
                                                src="https://wiki.guildwars2.com/images/b/bc/Medium_Crafting_Bag.png"
                                                alt="Tier 4 Bag"
                                                width={32}
                                                height={32}
                                                className="object-contain"
                                            />
                                        </div>
                                        <h2 className="text-2xl font-bold text-orange-300">Materials - Tier 4</h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-orange-400 uppercase tracking-wider">{t('opened.laurels.bagsUsed', 'Bolsas Usadas')}</p>
                                        <p className="text-lg font-bold text-white">{t4Data.totalBags.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-orange-500/20">
                                        <p className="text-xs text-orange-400 mb-1">{t('opened.laurels.itemsPerBag', 'Items x Bolsa')}</p>
                                        <p className="text-xl font-bold text-white">{avgT4Items.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-orange-500/20">
                                        <p className="text-xs text-orange-400 mb-1">{t('opened.laurels.averagePerLaurel', 'Promedio x L')}</p>
                                        <p className="text-xl font-bold text-yellow-400">{formatCurrency(avgT4ValuePerLaurel)}</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-orange-400 border-b border-orange-500/20">
                                                <th className="text-left py-2 font-medium">{t('common.item', 'Item')}</th>
                                                <th className="text-right py-2 font-medium">{t('common.quantity', 'Cantidad')}</th>
                                                <th className="text-right py-2 font-medium">{t('opened.laurels.averagePerLaurel', 'Promedio x L')}</th>
                                                <th className="text-right py-2 font-medium">{t('common.price', 'Precio')} (90%)</th>
                                                <th className="text-right py-2 font-medium">{t('common.total', 'Total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-orange-500/10">
                                            {t4Data.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-orange-500/5 transition-colors">
                                                    <td className="py-2">
                                                        <div className="flex items-center gap-2">
                                                            {itemDetails[item.id] ? (
                                                                <>
                                                                    <Image
                                                                        src={itemDetails[item.id].icon}
                                                                        alt={itemDetails[item.id].name}
                                                                        width={24}
                                                                        height={24}
                                                                        className="rounded shadow-sm"
                                                                    />
                                                                    <span className="text-gray-200">{itemDetails[item.id].name}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-400">{t('common.loading', 'Cargando...')}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-right text-gray-300">{item.count.toLocaleString()}</td>
                                                    <td className="text-right text-gray-400">{(item.count / t4Data.totalBags).toFixed(2)}</td>
                                                    <td className="text-right text-gray-400 whitespace-nowrap">{formatCurrency(itemPrices[item.id] || 0)}</td>
                                                    <td className="text-right text-orange-300 font-medium whitespace-nowrap">
                                                        {formatCurrency((itemPrices[item.id] || 0) * item.count)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-orange-500/30">
                                                <td className="py-3 font-bold text-white">{t('common.total', 'Total')}</td>
                                                <td className="text-right text-white font-bold">
                                                    {t4Data.items.reduce((acc, i) => acc + i.count, 0).toLocaleString()}
                                                </td>
                                                <td className="text-right text-white font-bold">
                                                    {(t4Data.items.reduce((acc, i) => acc + i.count, 0) / t4Data.totalBags).toFixed(2)}
                                                </td>
                                                <td></td>
                                                <td className="text-right text-green-400 font-bold text-lg whitespace-nowrap">
                                                    {formatCurrency(totalT4Value)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                        {/* Tier 6 Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-teal-500/30 overflow-hidden shadow-xl h-full flex flex-col"
                        >
                            <div className="bg-gradient-to-r from-teal-600/20 to-teal-800/20 p-4 border-b border-teal-500/30">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center border border-teal-500/30 overflow-hidden group-hover:border-teal-500/50 transition-colors">
                                            <Image
                                                src="https://wiki.guildwars2.com/images/a/a3/Heavy_Crafting_Bag.png"
                                                alt="Tier 6 Bag"
                                                width={32}
                                                height={32}
                                                className="object-contain"
                                            />
                                        </div>
                                        <h2 className="text-2xl font-bold text-teal-300">Materials - Tier 6</h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-teal-400 uppercase tracking-wider">{t('opened.laurels.bagsUsed', 'Bolsas Usadas')}</p>
                                        <p className="text-lg font-bold text-white">{t6Data.totalBags.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-teal-500/20">
                                        <p className="text-xs text-teal-400 mb-1">{t('opened.laurels.itemsPerBag', 'Items x Bolsa')}</p>
                                        <p className="text-xl font-bold text-white">{avgT6Items.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-teal-500/20">
                                        <p className="text-xs text-teal-400 mb-1">{t('opened.laurels.averagePerLaurel', 'Promedio x L')}</p>
                                        <p className="text-xl font-bold text-yellow-400">{totalT6Value > 0 ? formatCurrency(avgT6ValuePerLaurel) : '—'}</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-teal-400 border-b border-teal-500/20">
                                                <th className="text-left py-2 font-medium">{t('common.item', 'Item')}</th>
                                                <th className="text-right py-2 font-medium">{t('common.quantity', 'Cantidad')}</th>
                                                <th className="text-right py-2 font-medium">{t('opened.laurels.averagePerLaurel', 'Promedio x L')}</th>
                                                <th className="text-right py-2 font-medium">{t('common.price', 'Precio')} (90%)</th>
                                                <th className="text-right py-2 font-medium">{t('common.total', 'Total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-teal-500/10">
                                            {(t6Data.items as any[]).map((item, idx) => (
                                                <tr key={item.id || item.name || idx} className="hover:bg-teal-500/5 transition-colors">
                                                    <td className="py-2">
                                                        <div className="flex items-center gap-2">
                                                            {item.id && itemDetails[item.id] ? (
                                                                <>
                                                                    <Image
                                                                        src={itemDetails[item.id].icon}
                                                                        alt={itemDetails[item.id].name}
                                                                        width={24}
                                                                        height={24}
                                                                        className="rounded shadow-sm"
                                                                    />
                                                                    <span className="text-gray-200">{itemDetails[item.id].name}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-200">{item.name}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-right text-gray-300">{item.count.toLocaleString()}</td>
                                                    <td className="text-right text-gray-400">{(item.count / t6Data.totalBags).toFixed(2)}</td>
                                                    <td className="text-right text-gray-400 whitespace-nowrap">{item.id ? formatCurrency(itemPrices[item.id] || 0) : <span className="text-gray-500">—</span>}</td>
                                                    <td className="text-right text-teal-300 font-medium whitespace-nowrap">{item.id ? formatCurrency((itemPrices[item.id] || 0) * item.count) : <span className="text-gray-500">—</span>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-teal-500/30">
                                                <td className="py-3 font-bold text-white">{t('common.total', 'Total')}</td>
                                                <td className="text-right text-white font-bold">{totalT6Items.toLocaleString()}</td>
                                                <td className="text-right text-white font-bold">{(totalT6Items / t6Data.totalBags).toFixed(2)}</td>
                                                <td></td>
                                                <td className="text-right text-green-400 font-bold text-lg whitespace-nowrap">{totalT6Value > 0 ? formatCurrency(totalT6Value) : '—'}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}
