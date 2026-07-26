"use client";

import Link from 'next/link';
import { Check, X, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useEffect } from 'react';

export default function SupportPage() {
    const { user, refreshUserData } = useAuth();
    const { t } = useI18n();

    // Refrescar datos del usuario al montar la página
    useEffect(() => {
        if (user) {
            refreshUserData();
        }
    }, []); // Solo al montar

    const isCurrentTier = (tierName: string) => {
        // Free Tier check (Basic)
        if (tierName === 'Free Tier') {
            return !user || user.patreonStatus !== 'active_patron';
        }

        // Patreon Tiers check
        if (user?.patreonStatus === 'active_patron' && user?.patreonTier) {
            // Remove " Tier" suffix for comparison if present in the config name
            const cleanTierName = tierName.replace(' Tier', '').toLowerCase();
            return user.patreonTier.toLowerCase().includes(cleanTierName);
        }

        return false;
    };

    const tiers = [
        {
            name: 'Free Tier',
            price: t('support.price.free'),
            isActive: isCurrentTier('Free Tier'),
            subtitle: isCurrentTier('Free Tier') ? t('support.status.current') : null,
            color: 'bg-stone-700',
            textColor: 'text-stone-100',
            buttonVariant: 'secondary',
            url: null,
            features: {
                freeFeatures: true,
                adFree: false,
                lottery: false,
                luck: false,
                discordColor: false,
            }
        },
        {
            name: 'Bronze Tier',
            price: '$3 ' + t('support.price.month'),
            isActive: isCurrentTier('Bronze Tier'),
            subtitle: isCurrentTier('Bronze Tier') ? t('support.status.current') : null,
            color: 'bg-orange-700',
            textColor: 'text-orange-100',
            buttonVariant: 'primary',
            url: 'https://www.patreon.com/truefarming/membership',
            features: {
                freeFeatures: true,
                adFree: true,
                lottery: true,
                luck: '2x',
                discordColor: '#ffa467',
            }
        },
        {
            name: 'Silver Tier',
            price: '$5 ' + t('support.price.month'),
            isActive: isCurrentTier('Silver Tier'),
            subtitle: isCurrentTier('Silver Tier') ? t('support.status.current') : null,
            color: 'bg-slate-400',
            textColor: 'text-slate-900',
            buttonVariant: 'primary',
            url: 'https://www.patreon.com/truefarming/membership',
            features: {
                freeFeatures: true,
                adFree: true,
                lottery: true,
                luck: '3x',
                discordColor: '#ace5ff',
            }
        },
        {
            name: 'Gold Tier',
            price: '$10 ' + t('support.price.month'),
            isActive: isCurrentTier('Gold Tier'),
            subtitle: isCurrentTier('Gold Tier') ? t('support.status.current') : null,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-900',
            buttonVariant: 'primary',
            url: 'https://www.patreon.com/truefarming/membership',
            features: {
                freeFeatures: true,
                adFree: true,
                lottery: true,
                luck: '4x',
                discordColor: '#f1c40f',
            }
        },
        {
            name: 'Legends Tier',
            price: '$25 ' + t('support.price.month'),
            isActive: isCurrentTier('Legends Tier'),
            subtitle: isCurrentTier('Legends Tier') ? t('support.status.current') : null,
            color: 'bg-cyan-200',
            textColor: 'text-cyan-900',
            buttonVariant: 'primary',
            url: 'https://www.patreon.com/truefarming/membership',
            features: {
                freeFeatures: true,
                adFree: true,
                lottery: true,
                luck: '5x',
                discordColor: '#9329c0',
            }
        }
    ];

    const featuresList = [
        { label: t('support.features.freeFeatures'), key: 'freeFeatures' },
        { label: t('support.features.adFree'), key: 'adFree' },
        { label: t('support.features.lottery'), key: 'lottery' },
        { label: t('support.features.luck'), key: 'luck' },
        { label: t('support.features.discordColor'), key: 'discordColor' },
    ];

    const renderValue = (value: string | boolean, key?: string) => {
        if (value === true) return <Check className="w-6 h-6 text-[#2ecc71] mx-auto" />;
        if (value === false) return <Minus className="w-6 h-6 text-gray-600 mx-auto" />;

        if (key === 'discordColor') {
            if (typeof value === 'string' && value.startsWith('#')) {
                return (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-6 h-6 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: value }} />
                    </div>
                );
            }
            if (value === 'Custom color') {
                return (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 border border-white/10 shadow-sm" />
                        <span className="lg:hidden text-sm">{t('support.tier.custom')}</span>
                    </div>
                );
            }
        }

        return <span className="font-medium text-center">{value}</span>;
    };

    return (
        <>
            <div className="w-full max-w-[1600px] mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4 text-white">{t('support.title')}</h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        {t('support.subtitle')}
                    </p>
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-700 bg-gray-900/50 backdrop-blur shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="p-6 bg-gray-950 border-b border-r border-gray-800 sticky left-0 z-10 w-1/6"></th>
                                {tiers.map((tier) => (
                                    <th key={tier.name} className="p-0 border-b border-gray-800 w-1/6 align-top">
                                        <div className={`h-full flex flex-col items-center justify-center p-6 ${tier.isActive ? `${tier.color} ${tier.textColor}` : ''}`}>
                                            <h3 className={`text-xl font-bold ${tier.isActive ? tier.textColor : 'text-white'}`}>{tier.name}</h3>
                                            {tier.subtitle && (
                                                <span className="text-sm font-semibold opacity-75">{tier.subtitle}</span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {featuresList.map((feature, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-800/30'}>
                                    <td className="p-4 border-r border-gray-800 font-medium text-gray-200 sticky left-0 bg-gray-900 z-10">
                                        {feature.label}
                                    </td>
                                    {tiers.map((tier) => (
                                        // @ts-ignore
                                        <td key={tier.name} className="p-4 border-gray-800 text-center text-gray-300">
                                            {/* @ts-ignore */}
                                            {renderValue(tier.features[feature.key], feature.key)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            <tr>
                                <td className="p-6 border-t border-r border-gray-800 sticky left-0 bg-gray-900 z-10"></td>
                                {tiers.map((tier) => (
                                    <td key={tier.name} className="p-6 border-t border-gray-800 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-2xl font-bold text-white">{tier.price}</span>
                                            {tier.url ? (
                                                <a
                                                    href={tier.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors w-full"
                                                >
                                                    {t('support.button.supportPatreon')}
                                                </a>
                                            ) : (
                                                <span className="text-xl font-bold text-gray-500">{t('')}</span>
                                            )}

                                        </div>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Mobile/Tablet Cards */}
                <div className="lg:hidden space-y-6">
                    {tiers.map((tier) => (
                        <div key={tier.name} className="border border-gray-700 rounded-xl overflow-hidden bg-gray-900/50 backdrop-blur">
                            <div className={`p-4 ${tier.isActive ? `${tier.color} ${tier.textColor}` : 'bg-gray-800 text-white'} flex justify-between items-center`}>
                                <div>
                                    <h3 className="text-xl font-bold">{tier.name}</h3>

                                    {tier.subtitle && <span className="text-sm opacity-75 block">{tier.subtitle}</span>}
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg">{tier.price}</div>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                {featuresList.map((feature) => (
                                    <div key={feature.label} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                                        <div className="text-sm text-gray-400 w-1/2">{feature.label}</div>
                                        <div className="w-1/2 flex justify-end">
                                            {/* @ts-ignore */}
                                            {renderValue(tier.features[feature.key], feature.key)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-gray-950/50">
                                {tier.url ? (
                                    <a
                                        href={tier.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors"
                                    >
                                        {t('support.button.supportPatreon')}
                                    </a>
                                ) : (
                                    <div className="text-center font-bold text-gray-500 py-2">{t('support.button.freePlan')}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
