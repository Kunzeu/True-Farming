'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Calculator, ArrowUp, ArrowDown, ChevronsUpDown, Download } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { hasExclusiveAccess } from '@/lib/patreon-benefits';

export default function OrphanCalculatorPage() {
    const { t, lang } = useI18n();
    const { user } = useAuth();

    // Calculator State
    const [prices, setPrices] = useState<Record<number, number>>({});
    const [items, setItems] = useState<Record<number, { name: string, icon: string }>>({});
    const [minPrice, setMinPrice] = useState<number>(0);

    // Sorting State - Default: Cheapest (Total Ascending)
    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'quantity' | 'price' | 'total', direction: 'asc' | 'desc' } | null>({ key: 'total', direction: 'asc' });

    const calculatorIds = [38448, 38450, 38449, 77579, 77630, 77643, 38463, 38458, 38469, 38467, 38461, 38471, 38460, 38465];

    useEffect(() => {
        const fetchCalculatorData = async () => {
            try {
                // Fetch Prices
                const ids = calculatorIds.join(',');
                const priceRes = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${ids}`);
                const priceData = await priceRes.json();
                const newPrices: Record<number, number> = {};

                priceData.forEach((p: any) => {
                    // Use Sell Price (Buy Now) as the conservative "instant" cost
                    newPrices[p.id] = p.sells.unit_price;
                });
                setPrices(newPrices);

                // Calculate Min Total
                const quantities: Record<number, number> = {
                    38448: 4, 38449: 2, 38450: 1, 77579: 1, 77630: 1, 77643: 1,
                    38463: 1, 38458: 1, 38469: 1, 38467: 1, 38461: 1, 38471: 1, 38460: 1, 38465: 1
                };

                let min = Infinity;
                calculatorIds.forEach(id => {
                    if (newPrices[id]) {
                        const qty = quantities[id] || 1;
                        const total = newPrices[id] * qty * 30;
                        if (total < min) min = total;
                    }
                });
                setMinPrice(min === Infinity ? 0 : min);

                // Fetch Item Details (Name/Icon)
                const itemRes = await fetch(`https://api.guildwars2.com/v2/items?ids=${ids}&lang=${lang}`);
                const itemData = await itemRes.json();
                const newItems: Record<number, { name: string, icon: string }> = {};
                itemData.forEach((i: any) => {
                    newItems[i.id] = { name: i.name, icon: i.icon };
                });
                setItems(newItems);

            } catch (e) {
                console.error("Error fetching calculator data", e);
            }
        };

        fetchCalculatorData();
    }, [lang]);

    const handleSort = (key: 'name' | 'quantity' | 'price' | 'total') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedItems = () => {
        const mappedItems = calculatorIds.map((id) => {
            const quantities: Record<number, number> = {
                38448: 4, 38449: 2, 38450: 1, 77579: 1, 77630: 1, 77643: 1,
                38463: 1, 38458: 1, 38469: 1, 38467: 1, 38461: 1, 38471: 1, 38460: 1, 38465: 1
            };
            const quantity = quantities[id] || 1;
            const price = prices[id] || 0;
            const total = price * quantity * 30;

            const names: Record<number, string> = {
                38448: "Ugly Wool Sock",
                38450: "Ugly Wool Sweater",
                38449: "Ugly Wool Hat",
                77579: "Tropical Peppermint Cake",
                77630: "Scoop of Mintberry Swirl Ice Cream",
                77643: "Peppermint Omnomberry Bar",
                38463: "Wooden Dagger Skin",
                38458: "Toy Staff Skin",
                38469: "Princess Wand Skin",
                38467: "Slingshot Skin",
                38461: "Pop Gun Skin",
                38471: "Bell Focus Skin",
                38460: "Toy Sword Skin",
                38465: "Toy Candy Cane Hammer Skin"
            };
            const name = items[id]?.name || names[id];

            return { id, name, quantity, price, total };
        });

        if (sortConfig !== null) {
            mappedItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return mappedItems;
    };

    const sortedItems = getSortedItems();

    const handleExportCsv = () => {
        const rows = [
            [t('wintersday.calculator.item', 'Objeto'), t('wintersday.calculator.quantity', 'Cantidad x1'), t('wintersday.calculator.price', 'Precio x1'), t('wintersday.calculator.total', 'Total')].join(','),
            ...sortedItems.map(item => [
                `"${item.name.replace(/"/g, '""')}"`,
                item.quantity,
                item.price,
                item.total
            ].join(','))
        ];
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wintersday-calculator.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div id="section-calculator" className="space-y-8">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <Calculator className="w-6 h-6 mr-3 text-cyan-400" />
                        {t('wintersday.calculator.title', 'Calculadora de Regalos')}
                    </h2>
                    {hasExclusiveAccess(user) && sortedItems.length > 0 && (
                        <button
                            onClick={handleExportCsv}
                            className="flex items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-100 hover:bg-emerald-500/20 transition-colors"
                            title={t("search.exportCsv", "Export CSV")}
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <p className="text-gray-300 mb-6">
                    {t('wintersday.calculator.desc', 'Compara el costo de obtener los Regalos Envueltos necesarios con diferentes objetos.')}
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-300">
                        <thead className="text-xs uppercase bg-cyan-900/20 text-cyan-300">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg cursor-pointer hover:bg-cyan-900/40 transition-colors group" onClick={() => handleSort('name')}>
                                    <div className="flex items-center">
                                        {t('wintersday.calculator.item', 'Objeto')}
                                        {sortConfig?.key === 'name' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />
                                        ) : (
                                            <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-500 opacity-50" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center cursor-pointer hover:bg-cyan-900/40 transition-colors group" onClick={() => handleSort('quantity')}>
                                    <div className="flex items-center justify-center">
                                        {t('wintersday.calculator.quantity', 'Cantidad')}
                                        {sortConfig?.key === 'quantity' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />
                                        ) : (
                                            <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-500 opacity-50" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right cursor-pointer hover:bg-cyan-900/40 transition-colors group" onClick={() => handleSort('price')}>
                                    <div className="flex items-center justify-end">
                                        {t('wintersday.calculator.price', 'Precio Unitario')}
                                        {sortConfig?.key === 'price' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />
                                        ) : (
                                            <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-500 opacity-50" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right rounded-r-lg cursor-pointer hover:bg-cyan-900/40 transition-colors group" onClick={() => handleSort('total')}>
                                    <div className="flex items-center justify-end">
                                        {t('wintersday.calculator.total', 'Costo por 30')}
                                        {sortConfig?.key === 'total' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />
                                        ) : (
                                            <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-500 opacity-50" />
                                        )}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {sortedItems.map((item) => {
                                const { id, quantity, price, total, name } = item;
                                const isCheapest = minPrice > 0 && total === minPrice;
                                const icon = items[id]?.icon;

                                return (
                                    <tr key={id} className={`hover:bg-cyan-900/10 transition-colors ${isCheapest ? 'bg-green-900/20' : ''}`}>
                                        <td className="px-4 py-4 flex items-center">
                                            {icon && <Image src={icon} alt={name} width={32} height={32} className="mr-3 rounded" />}
                                            <div>
                                                <div className={isCheapest ? 'text-green-400 font-semibold' : ''}>{name}</div>
                                            </div>
                                            {isCheapest && <span className="ml-2 text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full border border-green-700">{t('wintersday.calculator.cheapest', '¡Más Barato!')}</span>}
                                        </td>
                                        <td className="px-4 py-4 text-center font-mono text-gray-300">
                                            {quantity}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-gray-400">
                                            {price > 0 ? (
                                                <>
                                                    {Math.floor(price / 10000) > 0 && <span className="text-yellow-500 mr-1">{Math.floor(price / 10000)}g</span>}
                                                    {Math.floor((price % 10000) / 100) > 0 && <span className="text-gray-400 mr-1">{Math.floor((price % 10000) / 100)}s</span>}
                                                    <span className="text-orange-400">{price % 100}c</span>
                                                </>
                                            ) : '...'}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono font-medium text-white">
                                            {price > 0 ? (
                                                <>
                                                    {Math.floor(total / 10000) > 0 && <span className="text-yellow-500 mr-1">{Math.floor(total / 10000)}g</span>}
                                                    {Math.floor((total % 10000) / 100) > 0 && <span className="text-gray-400 mr-1">{Math.floor((total % 10000) / 100)}s</span>}
                                                    <span className="text-orange-400">{total % 100}c</span>
                                                </>
                                            ) : '...'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                </div>
                <div className="mt-4 text-xs text-gray-500 text-center">
                    * {t('wintersday.calculator.disclaimer', 'Prices updated from Trading Post. Does not include Karma cost for Wrapping Paper (500 Karma each).')}
                </div>
            </div>
        </div>
    );
}
