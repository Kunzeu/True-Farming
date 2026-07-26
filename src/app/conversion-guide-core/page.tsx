'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
    Backpack,
    ChevronRight,
    Info,
    ArrowRight,
    Calculator,
    Hammer,
    Sparkles,
    Zap,
    Flame,
    Snowflake,
    Triangle,
    Hexagon,
    Gem
} from 'lucide-react';
import WikiItemLink from '@/components/ui/WikiItemLink';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Item IDs for Cores and Lodestones
const CORE_CONVERSIONS = [
    { name: 'Onyx', coreId: 24309, lodestoneId: 24310, color: 'from-slate-700 to-slate-900', iconColor: 'text-slate-400', symbol: Hexagon },
    { name: 'Molten', coreId: 24314, lodestoneId: 24315, color: 'from-orange-600 to-red-900', iconColor: 'text-orange-400', symbol: Flame },
    { name: 'Glacial', coreId: 24319, lodestoneId: 24320, color: 'from-blue-400 to-indigo-900', iconColor: 'text-blue-300', symbol: Snowflake },
    { name: 'Destroyer', coreId: 24324, lodestoneId: 24325, color: 'from-red-600 to-orange-950', iconColor: 'text-red-500', symbol: Zap },
    { name: 'Crystal', coreId: 24329, lodestoneId: 24330, color: 'from-purple-400 to-indigo-900', iconColor: 'text-purple-300', symbol: Gem },
    { name: 'Corrupted', coreId: 24339, lodestoneId: 24340, color: 'from-indigo-600 to-purple-950', iconColor: 'text-indigo-400', symbol: Triangle },
    { name: 'Charged', coreId: 24304, lodestoneId: 24305, color: 'from-yellow-400 to-orange-600', iconColor: 'text-yellow-300', symbol: Zap },
];

const ADDITIONAL_MATERIALS = {
    ELONIAN_WINE: 19663,
    CRYSTALLINE_DUST: 24277,
    MYSTIC_CRYSTAL: 20799

};

interface ItemData {
    id: number;
    names: Record<string, string>;
    icon: string;
    buy_price: number;
    sell_price: number;
    name?: string;
}

export default function ConversionGuideCorePage() {
    const { t, lang } = useI18n();
    usePageTitle(t('conversionGuideCorePage.title'), t('conversionGuideCorePage.title'));

    const [items, setItems] = useState<Record<number, ItemData>>({});
    const [loading, setLoading] = useState(true);
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const itemIds = [
                    ...CORE_CONVERSIONS.map(c => c.coreId),
                    ...CORE_CONVERSIONS.map(c => c.lodestoneId),
                    ADDITIONAL_MATERIALS.ELONIAN_WINE,
                    ADDITIONAL_MATERIALS.CRYSTALLINE_DUST,
                    ADDITIONAL_MATERIALS.MYSTIC_CRYSTAL
                ];

                const LANGS = ['en', 'es', 'de', 'fr'];

                const itemsByLangResponses = await Promise.all(
                    LANGS.map(lang =>
                        fetch(`https://api.guildwars2.com/v2/items?ids=${itemIds.join(',')}&lang=${lang}`).then(r => r.json())
                    )
                );

                const pricesResponse = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${itemIds.join(',')}`);
                const pricesData = await pricesResponse.json();

                const itemsMap: Record<number, ItemData> = {};

                // Build names per language
                itemsByLangResponses.forEach((itemsData: any[], idx: number) => {
                    const lang = LANGS[idx];
                    itemsData.forEach((item: any) => {
                        if (!itemsMap[item.id]) {
                            itemsMap[item.id] = {
                                id: item.id,
                                names: { [lang]: item.name },
                                icon: item.icon,
                                buy_price: 0,
                                sell_price: 0,
                            };
                        } else {
                            itemsMap[item.id].names[lang] = item.name;
                            if (!itemsMap[item.id].icon) itemsMap[item.id].icon = item.icon;
                        }
                    });
                });

                // Attach prices
                pricesData.forEach((p: any) => {
                    if (!itemsMap[p.id]) return;
                    itemsMap[p.id].buy_price = p.buys?.unit_price || 0;
                    itemsMap[p.id].sell_price = p.sells?.unit_price || 0;
                });

                // Set a default `name` (english if available)
                Object.values(itemsMap).forEach(it => {
                    it.name = it.names['en'] || Object.values(it.names)[0] || '';
                });

                setItems(itemsMap);
            } catch (error) {
                console.error('Error fetching item data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    const formatPrice = (copper: number) => {
        const gold = Math.floor(copper / 10000);
        const silver = Math.floor((copper % 10000) / 100);
        const c = copper % 100;

        return (
            <span className="inline-flex items-center gap-1 font-mono text-sm">
                {gold > 0 && <span className="text-yellow-400 font-bold">{gold}g</span>}
                {silver > 0 && <span className="text-gray-300">{silver}s</span>}
                <span className="text-orange-400">{c}c</span>
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[#050506] text-white selection:bg-blue-500/30">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
            </div>

            {/* Hero Section - More Immersive */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex flex-col items-center text-center max-w-4xl mx-auto"
                    >
                        <Link
                            href="/conversion-guide"
                            className="inline-flex items-center gap-2 text-blue-400/60 hover:text-blue-400 transition-all mb-8 group bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-blue-500/30"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium uppercase tracking-wider">{t('conversionGuidePage.sidebar.back')}</span>
                        </Link>

                        <div className="relative mb-6">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 blur-[60px] opacity-20"
                            />
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
                                {t('conversionGuideCorePage.title')}
                            </h1>
                        </div>

                        <p className="text-xl text-gray-400 leading-relaxed max-w-2xl font-light">
                            {t('conversionGuideCorePage.subtitle')}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Symbolic Alchemy Grid */}
            <section className="container mx-auto px-4 py-20 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {CORE_CONVERSIONS.map((conv, index) => {
                        const core = items[conv.coreId];
                        const lodestone = items[conv.lodestoneId];
                        const wine = items[ADDITIONAL_MATERIALS.ELONIAN_WINE]?.buy_price || 0;
                        const dust = items[ADDITIONAL_MATERIALS.CRYSTALLINE_DUST]?.buy_price || 0;

                        const totalCost = core ? (core.buy_price * 2) + wine + dust : 0;
                        const finalValue = lodestone ? Math.floor(lodestone.sell_price * 0.85) : 0;
                        const profit = finalValue - totalCost;
                        const isProfitable = profit > 0;

                        const SymbolIcon = conv.symbol;

                        return (
                            <motion.div
                                key={conv.coreId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onMouseEnter={() => setHoveredCard(conv.coreId)}
                                onMouseLeave={() => setHoveredCard(null)}
                                className="group relative"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${conv.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-[2rem] blur-xl`} />
                                <div className="relative bg-[#111113]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 overflow-hidden group-hover:border-white/20 transition-all duration-500 flex flex-col h-full shadow-2xl">

                                    {/* Elemental Icon Background */}
                                    <div className="absolute top-[-20%] right-[-10%] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                                        <SymbolIcon className="w-48 h-48 rotate-[-15deg]" />
                                    </div>

                                    <div className="flex justify-between items-start mb-8 relative">
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold uppercase tracking-[0.2em] mb-1 ${conv.iconColor}`}>
                                                <WikiItemLink
                                                    name={items[conv.coreId]?.names?.en || items[conv.coreId]?.name || conv.name}
                                                    itemId={conv.coreId}
                                                    className="hover:underline"
                                                >
                                                    {items[conv.coreId]?.names?.[lang] || conv.name}
                                                </WikiItemLink>
                                            </span>
                                            <h3 className="text-2xl font-black text-white">
                                                <WikiItemLink
                                                    name={items[conv.coreId]?.names?.en || items[conv.coreId]?.name || `${conv.name} Core`}
                                                    itemId={conv.coreId}
                                                    className="hover:underline"
                                                >
                                                    {items[conv.coreId]?.name || `${conv.name} Core`}
                                                </WikiItemLink>
                                            </h3>
                                        </div>
                                        <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500 ${conv.iconColor}`}>
                                            <SymbolIcon className="w-5 h-5" />
                                        </div>
                                    </div>

                                    {/* Visual Alchemy Flow */}
                                    <div className="flex items-center justify-between gap-4 mb-8 py-4 px-2 bg-black/20 rounded-2xl border border-white/5">
                                        <div className="flex flex-col items-center">
                                            <div className="relative">
                                                {loading ? (
                                                    <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                                                ) : (
                                                    <img src={core?.icon} alt={core?.name || conv.name} className="w-12 h-12 rounded-lg relative z-10" />
                                                )}
                                                <div className="absolute inset-0 bg-white/20 blur-lg rounded-full opacity-0 group-hover:opacity-40 transition-opacity" />
                                            </div>
                                            <span className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-bold">x2</span>
                                        </div>

                                        <motion.div
                                            animate={hoveredCard === conv.coreId ? { x: [0, 5, 0] } : {}}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                        >
                                            <ArrowRight className={`w-4 h-4 ${isProfitable ? 'text-green-500/50' : 'text-gray-600'}`} />
                                        </motion.div>

                                        <div className="flex flex-col items-center">
                                            <div className="relative">
                                                {loading ? (
                                                    <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                                                ) : (
                                                    <img src={lodestone?.icon} alt={lodestone?.name || conv.name} className="w-12 h-12 rounded-lg relative z-10 grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                                                )}
                                                <div className={`absolute inset-0 blur-lg rounded-full opacity-0 group-hover:opacity-60 transition-opacity bg-gradient-to-br ${conv.color}`} />
                                            </div>
                                            <span className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-bold">x1</span>
                                        </div>
                                    </div>

                                    {/* Financial Details */}
                                    <div className="space-y-4 mt-auto">
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-xs text-gray-500">{t('homestead.detail.buy')} (2)</span>
                                            {loading ? <div className="h-4 w-16 bg-white/5 rounded animate-pulse" /> : formatPrice(core?.buy_price * 2 || 0)}
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-xs text-gray-500">Value (85%)</span>
                                            {loading ? <div className="h-4 w-16 bg-white/5 rounded animate-pulse" /> : formatPrice(finalValue)}
                                        </div>

                                        <div className={`flex justify-between items-center p-4 rounded-2xl ${isProfitable ? 'bg-green-500/5 border border-green-500/10' : 'bg-red-500/5 border border-red-500/10'}`}>
                                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Profit</span>
                                            <div className="flex flex-col items-end">
                                                {loading ? <div className="h-4 w-20 bg-white/5 rounded animate-pulse" /> : (
                                                    <span className={`text-lg font-black ${isProfitable ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]' : 'text-red-400'}`}>
                                                        {formatPrice(profit)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interactive Glow Effect on Hover */}
                                    <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${conv.color} scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`} />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Symbolic Recipe Component */}
            <section className="container mx-auto px-4 py-20 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-12 justify-center">
                        <h2 className="text-4xl font-black text-white text-center">
                            The Alchemy of Cores
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Visual Recipe Circle */}
                        <div className="relative aspect-square max-w-md mx-auto">
                            {/* Outer Ring */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-2 border-dashed border-white/10 rounded-full"
                            />

                            {/* Inner Circle - The Forge */}
                            <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-3xl border border-white/10 flex flex-col items-center justify-center p-8 text-center shadow-[0_0_100px_rgba(59,130,246,0.1)]">
                                <div className="relative w-24 h-24 mb-6">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className="absolute inset-[-20%] bg-blue-500 blur-3xl rounded-full"
                                    />
                                    <div className="relative flex items-center justify-center w-full h-full bg-white/5 border border-white/20 rounded-3xl p-4 shadow-inner">
                                        <img src={items[CORE_CONVERSIONS[0].lodestoneId]?.icon} alt="Result" className="w-16 h-16 opacity-40" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Mystic Forge Upgrade</h3>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed uppercase tracking-widest">Ancient transmutations</p>
                            </div>

                            {/* Ingredient Satellites */}
                                {[
                                { label: '2x Cores', id: CORE_CONVERSIONS[0].coreId, delay: 0, pos: 'top-0 left-1/2 -translate-x-1/2' },
                                { label: t('conversionGuideCorePage.sections.conversionProcess.item2'), id: ADDITIONAL_MATERIALS.ELONIAN_WINE, delay: 1, pos: 'right-0 top-1/2 -translate-y-1/2' },
                                { label: t('conversionGuideCorePage.sections.conversionProcess.item3'), id: ADDITIONAL_MATERIALS.CRYSTALLINE_DUST, delay: 2, pos: 'bottom-0 left-1/2 -translate-x-1/2' },
                                { label: t('conversionGuideCorePage.sections.conversionProcess.item4', 'Lucky Mystic Crystal'), id: ADDITIONAL_MATERIALS.MYSTIC_CRYSTAL, delay: 3, pos: 'left-0 top-1/2 -translate-y-1/2' },
                            ].map((sat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: sat.delay * 0.2 }}
                                    className={`absolute ${sat.pos} flex flex-col items-center gap-2`}
                                >
                                    <div className="w-16 h-16 bg-[#161618] border border-white/10 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group p-2">
                                        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {loading ? (
                                            <div className="w-full h-full bg-white/5 animate-pulse rounded-lg" />
                                        ) : (
                                            <img src={items[sat.id]?.icon} alt={items[sat.id]?.name || sat.label} className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap bg-black/40 px-3 py-1 rounded-full border border-white/5 backdrop-blur-md">
                                        <WikiItemLink
                                            name={items[sat.id]?.names?.en || items[sat.id]?.name || sat.label}
                                            itemId={sat.id}
                                            className="hover:underline hover:text-gray-200"
                                        >
                                            {items[sat.id]?.names?.[lang] || sat.label}
                                        </WikiItemLink>
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Detailed Description */}
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-xl font-bold">{t('conversionGuideCorePage.sections.introduction.title')}</h4>
                                </div>
                                <div className="space-y-4 text-gray-400 font-light leading-relaxed text-lg">
                                    <p>{t('conversionGuideCorePage.sections.introduction.content1')}</p>
                                    <p>{t('conversionGuideCorePage.sections.introduction.content2')}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                        <Hammer className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-xl font-bold">Procesamiento de Materiales</h4>
                                </div>
                                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-6">
                                    <p className="text-gray-400">
                                        {t('conversionGuideCorePage.sections.conversionProcess.content1')}
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        {[
                                            { id: ADDITIONAL_MATERIALS.ELONIAN_WINE, label: t('conversionGuideCorePage.sections.conversionProcess.item2') },
                                            { id: ADDITIONAL_MATERIALS.CRYSTALLINE_DUST, label: t('conversionGuideCorePage.sections.conversionProcess.item3') },
                                            { id: ADDITIONAL_MATERIALS.MYSTIC_CRYSTAL, label: t('conversionGuideCorePage.sections.conversionProcess.item4', '1x Mystic Crystal') }
                                        ].map((mat) => (
                                            <div key={mat.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 pr-4 group hover:bg-white/10 transition-colors">
                                                <div className="w-10 h-10 rounded-xl bg-black/40 p-1.5 border border-white/5 group-hover:border-blue-500/30 transition-colors">
                                                    {loading ? (
                                                        <div className="w-full h-full bg-white/5 animate-pulse rounded-md" />
                                                    ) : (
                                                        <img src={items[mat.id]?.icon} alt={items[mat.id]?.name || mat.label} className="w-full h-full object-contain" />
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                                                    <WikiItemLink
                                                        name={items[mat.id]?.names?.en || items[mat.id]?.name || mat.label}
                                                        itemId={mat.id}
                                                        className="hover:underline hover:text-white"
                                                    >
                                                        {items[mat.id]?.names?.[lang] || mat.label}
                                                    </WikiItemLink>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-yellow-400/5 border border-yellow-400/10 rounded-2xl flex items-start gap-4">
                                        <Zap className="w-5 h-5 text-yellow-400 shrink-0" />
                                        <p className="text-sm text-yellow-400/80 leading-relaxed italic italic">
                                            {t('conversionGuideCorePage.sections.conversionProcess.note')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final Tips Section */}
            <section className="container mx-auto px-4 py-20 relative z-10 border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">{t('conversionGuideCorePage.sections.tips.title')}</h2>
                    <div className="w-20 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {[
                        { content: t('conversionGuideCorePage.sections.tips.content1'), color: 'from-blue-500/20' },
                        { content: t('conversionGuideCorePage.sections.tips.content2'), color: 'from-purple-500/20' }
                    ].map((tip, i) => (
                        <div key={i} className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${tip.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl`} />
                            <div className="relative bg-[#161618] border border-white/5 p-8 rounded-[2rem] hover:border-white/20 transition-all duration-500">
                                <p className="text-gray-300 text-lg leading-relaxed italic">
                                    "{tip.content}"
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer Space */}
            <div className="h-40" />

            {/* Interactive Styles */}
            <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 6s infinite ease-in-out;
        }
      `}</style>
        </div>
    );
}
