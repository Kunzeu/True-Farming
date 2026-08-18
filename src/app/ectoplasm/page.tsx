'use client';
import dynamic from 'next/dynamic';
const Motion = dynamic(() => import('@/components/ectoplasm/EctoplasmMotion').then(m => m.default), { ssr: false });
import { useState, useEffect } from 'react';
import { 
  Table, 
  Layers, 
  TrendingUp, 
  BarChart3, 
  Info,
  Calculator,
  ArrowRight
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import Image from 'next/image';
import Link from 'next/link';
import EctoRecycleCompareTable from '@/components/ectoplasm/EctoRecycleCompareTable';

// IDs de los materiales
const MATERIAL_IDS = {
  ecto: 19721,
  dust: 24277,
  luckBlue: 45175,
  luckGreen: 45176,
  luckYellow: 45177,
  luckOrange: 45178,
  kitMaster: 23043,
  kitMystic: 23045,
  kitSilver: 67027,
};

const TABLE_DATA = [
  [8250, 15263, 60018, 3803, 368, 172],
  [1730, 3201, 12919, 737, 88, 30],
  [25000, 46250, 178616, 12158, 1231, 510],
  [15020, 27787, 107426, 7256, 741, 322],
  [15000, 27750, 107866, 7273, 672, 294],
  [15000, 27750, 107585, 7482, 659, 319],
  [20000, 36999, 142609, 9922, 925, 438],
];

const TOTALS = [100000, 185000, 717039, 48631, 4684, 2085];

export default function EctoplasmSalvagePage() {
  const { t, lang } = useI18n();
  usePageTitle(t('ectoplasm.title'), t('ectoplasm.title'));

  const [materialIcons, setMaterialIcons] = useState<Record<number, string>>({});
  const [materialNames, setMaterialNames] = useState<Record<number, string>>({});
  const [marketPrices, setMarketPrices] = useState<Record<number, { buy: number; sell: number }>>({});
  const [ectoCount, setEctoCount] = useState<number>(250);
  const [selectedKit, setSelectedKit] = useState<string>('silver'); // Default to Silver

  useEffect(() => {
    const fetchMaterialData = async () => {
      try {
        const itemIds = Object.values(MATERIAL_IDS).join(',');
        
        // Fetch Names and Icons
        const response = await fetch(`https://api.guildwars2.com/v2/items?ids=${itemIds}&lang=${lang}`);
        if (response.ok) {
          const items = await response.json();
          const icons: Record<number, string> = {};
          const names: Record<number, string> = {};
          items.forEach((item: any) => {
            icons[item.id] = item.icon;
            names[item.id] = item.name;
          });
          setMaterialIcons(icons);
          setMaterialNames(names);
        }

        // Fetch Market Prices
        const priceIds = [MATERIAL_IDS.ecto, MATERIAL_IDS.dust].join(',');
        const pricesResponse = await fetch(`https://api.guildwars2.com/v2/commerce/prices?ids=${priceIds}`);
        if (pricesResponse.ok) {
          const prices = await pricesResponse.json();
          const priceMap: Record<number, { buy: number; sell: number }> = {};
          prices.forEach((p: any) => {
            priceMap[p.id] = { buy: p.buys.unit_price, sell: p.sells.unit_price };
          });
          setMarketPrices(priceMap);
        }
      } catch (error) {
        console.error('Error fetching material data:', error);
      }
    };
    fetchMaterialData();
  }, [lang]);

  function formatGSC(copper: number) {
    const sign = copper < 0 ? '-' : '';
    const abs = Math.abs(copper);
    const g = Math.floor(abs / 10000);
    const rem = abs - g * 10000;
    const s = Math.floor(rem / 100);
    const c = Math.round((rem - s * 100) * 100) / 100;
    const cStr = Number.isInteger(c) ? String(c).padStart(2, '0') : c.toFixed(2);
    return `${sign}${g.toLocaleString('en-US', { minimumIntegerDigits: 2 })}G ${String(s).padStart(2, '0')}S ${cStr}C`;
  }

  function formatPrice(copper: number) {
    if (!copper) return '...';
    const g = Math.floor(copper / 10000);
    const s = Math.floor((copper % 10000) / 100);
    const c = copper % 100;
    return (
      <span className="flex items-center gap-1">
        {g > 0 && <span className="text-amber-400">{g}g</span>}
        {s > 0 && <span className="text-slate-300">{s}s</span>}
        <span className="text-amber-600">{c}c</span>
      </span>
    );
  }

  function materialismIcon(id: number) {
    return materialIcons[id] || null;
  }

  const KITS_INFO = {
    master: { price: 1536, charges: 25, itemId: MATERIAL_IDS.kitMaster },
    mystic: { price: 2624, charges: 250, itemId: MATERIAL_IDS.kitMystic },
    silver: { price: 60, charges: 1, itemId: MATERIAL_IDS.kitSilver },
  };

  // Calculadora: comparar (polvo * 1.85) a 90% vs ecto (precio mercado)
  const DUST_MULTIPLIER = 1.85;
  const COMMON_FACTOR = 0.9; // 90% aplicado al polvo según usuario
  
  const ectoPrice = marketPrices[MATERIAL_IDS.ecto]?.sell || 0;
  const dustPrice = marketPrices[MATERIAL_IDS.dust]?.sell || 0;

  const expectedDust = ectoCount * DUST_MULTIPLIER;
  
  // Valor de polvos generados por 1 solo Ecto
  const valuePerEcto = Math.floor(dustPrice * COMMON_FACTOR * DUST_MULTIPLIER);
  
  // Coste del reciclaje (Kits completos para consumibles, por uso para permanente)
  const kit = KITS_INFO[selectedKit as keyof typeof KITS_INFO];
  const totalKitCost = Math.ceil(ectoCount / kit.charges) * kit.price;
  const kitCostLabel = (info: { price: number; charges: number }) =>
    info.charges === 1
      ? `${formatGSC(info.price)} ${t('ectoplasm.kits.perUse')}`
      : `${formatGSC(info.price)} / ${info.charges} ${t('ectoplasm.kits.uses')}`;

  // Inversión y Retornos Totales (aplicando 90% a ambos para comparar "vender vs reciclar")
  const totalInvestment = Math.floor(ectoCount * ectoPrice * COMMON_FACTOR);
  const totalReturns = Math.floor(expectedDust * dustPrice * COMMON_FACTOR);
  const totalProfit = totalReturns - totalInvestment - totalKitCost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex flex-col">
      
      <main className="container mx-auto px-4 py-12 flex-1">

        {/* Header Section */}
        <div className="text-center mb-16">
          <Motion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center mb-4"
          >
            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 mr-4">
              <Layers className="w-10 h-10 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              <span 
                className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {t('ectoplasm.title')}
              </span>
            </h1>
          </Motion>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            {t('ectoplasm.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: t('ectoplasm.table.ecto'), value: '100,000', icon: materialismIcon(MATERIAL_IDS.ecto), color: 'purple', subtitle: 'Tamaño de Muestra' },
            { label: t('ectoplasm.table.dust'), value: '185,000', icon: materialismIcon(MATERIAL_IDS.dust), color: 'blue', subtitle: '1.85 Media por Ecto' },
            { label: t('ectoplasm.totalLuck'), value: '772,439', icon: materialismIcon(MATERIAL_IDS.luckOrange), color: 'orange', subtitle: '7.72 Media por Ecto' },
          ].map((stat, i) => (
            <Motion
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 flex items-center gap-4 hover:border-slate-600/50 transition-all group"
            >
              <div className={`p-4 ${stat.color === 'orange' ? 'bg-amber-500/10' : stat.color === 'purple' ? 'bg-purple-500/10' : 'bg-blue-500/10'} rounded-xl group-hover:scale-110 transition-transform`}>
                {stat.icon ? (
                  <Image src={stat.icon} alt={stat.label} width={40} height={40} className="w-10 h-10" />
                ) : (
                  <TrendingUp className={`w-8 h-8 ${stat.color === 'orange' ? 'text-amber-400' : stat.color === 'purple' ? 'text-purple-400' : 'text-blue-400'}`} />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                <div className="flex flex-col">
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase mt-1">{stat.subtitle}</p>
                </div>
              </div>
            </Motion>
          ))}
        </div>

        <EctoRecycleCompareTable
          className="mb-12"
          ectoSell={marketPrices[MATERIAL_IDS.ecto]?.sell}
          dustSell={marketPrices[MATERIAL_IDS.dust]?.sell}
          ectoIcon={materialIcons[MATERIAL_IDS.ecto]}
          dustIcon={materialIcons[MATERIAL_IDS.dust]}
        />

          {/* Profitability Analysis Section */}
          <Motion
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/60 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden"
          >          
          <div className="relative z-10 text-center mb-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center justify-center gap-3">
              <Calculator className="w-6 h-6 text-blue-400" />
              {t('ectogamblingPage.stats')}
            </h2>
          </div>
          <div className="flex flex-col items-center gap-6 relative z-10 max-w-4xl mx-auto">
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              <div className="flex flex-col items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('ectoplasm.calc.ectoQuantity')}</span>
                <div className="text-center w-full">
                  <input
                    type="number"
                    min={1}
                    value={ectoCount}
                    onChange={(e) => setEctoCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full text-center bg-transparent border border-slate-700/40 rounded-md px-3 py-2 text-white font-black"
                  />
                  <p className="text-xs text-gray-400 mt-2">{t('ectoplasm.calc.addQuantity')}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('ectoplasm.calc.selectKit')}</span>
                <div className="w-full flex items-center gap-2">
                  {materialIcons[kit.itemId] ? (
                    <Image src={materialIcons[kit.itemId]} alt="" width={32} height={32} />
                  ) : (
                    <span className="w-8 h-8 rounded bg-slate-700 shrink-0" />
                  )}
                  <select
                    value={selectedKit}
                    onChange={(e) => setSelectedKit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700/40 rounded-md px-3 py-2 text-white font-bold appearance-none cursor-pointer text-center"
                  >
                    <option value="master">{t('ectoplasm.kits.master.name')}</option>
                    <option value="mystic">{t('ectoplasm.kits.mystic.name')}</option>
                    <option value="silver">{t('ectoplasm.kits.silver.name')}</option>
                  </select>
                </div>
                <div className="text-xs text-gray-400 font-mono text-center">
                  {kitCostLabel(kit)}
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('ectoplasm.calc.dustValueSell')}</span>
                <div className="text-center font-mono text-white text-xl">{formatPrice(dustPrice)}</div>
                {materialIcons[MATERIAL_IDS.dust] && <Image src={materialIcons[MATERIAL_IDS.dust]} alt="Polvo" width={48} height={48} />}
              </div>
            </div>

            <div className="w-full bg-slate-900/40 p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-400">{t('ectoplasm.calc.estimatedDust')}</p>
                <p className="text-3xl font-black text-white">{parseFloat(expectedDust.toFixed(2))} <span className="text-xs text-gray-400">{t('ectoplasm.table.dust')}</span></p>
                <p className="text-xs text-gray-400 mt-2">{t('ectoplasm.calc.valuePerEcto')}: {formatPrice(valuePerEcto)}</p>
              </div>

              <div className="text-center md:text-right space-y-2">
                <div className="flex flex-col md:items-end">
                  <span className="text-xs text-slate-500 uppercase font-bold">{t('ectoplasm.calc.investment')}</span>
                  <span className="text-lg font-black text-white">{formatPrice(totalInvestment)}</span>
                </div>
                <div className="flex flex-col md:items-end">
                  <span className="text-xs uppercase font-bold text-blue-400">{t('ectoplasm.calc.returns')}</span>
                  <span className="text-lg font-black text-blue-400">{formatPrice(totalReturns)}</span>
                </div>
                <div className="flex flex-col md:items-end pt-1">
                  <span className="text-xs text-slate-500 uppercase font-bold">{t('ectoplasm.calc.kitCost')}</span>
                  <span className="text-sm font-mono text-slate-400">-{formatPrice(totalKitCost)}</span>
                </div>
                <div className="flex flex-col md:items-end pt-2 border-t border-white/5">
                  <span className="text-xs text-slate-500 uppercase font-bold">{t('ectoplasm.calc.profit')}</span>
                  <span className={`text-2xl font-black ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPrice(Math.abs(totalProfit))}
                    {totalProfit < 0 ? ' (Pérdida)' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full text-center">
              <Link href="/conversion-guide" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg shadow hover:opacity-90 transition-opacity">
                {t('conversionGuidePage.sidebar.title')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Profit Indicator */}
          <div className="mt-8 flex flex-col items-center">
             <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl max-w-lg text-center">
               <p className="text-xs text-gray-400 font-medium leading-relaxed italic">
                 {t('ectoplasm.calc.disclaimer')}
                 <span className="text-blue-400 font-bold block mt-1 uppercase tracking-widest">⚠️ {t('ectoplasm.calc.kitNote')}</span>
               </p>
             </div>
          </div>
        </Motion>

        {/* Market Analysis Mini-Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
           <Motion 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between"
           >
              <div className="flex items-center gap-3">
                {materialIcons[MATERIAL_IDS.ecto] && <Image src={materialIcons[MATERIAL_IDS.ecto]} alt="" width={32} height={32} />}
                <span className="text-gray-300 font-bold">{materialNames[MATERIAL_IDS.ecto] || 'Ecto'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-500 uppercase font-bold">TP (Venta)</span>
                <span className="font-mono">{formatPrice(marketPrices[MATERIAL_IDS.ecto]?.sell || 0)}</span>
              </div>
           </Motion>
           <Motion 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between"
           >
              <div className="flex items-center gap-3">
                {materialIcons[MATERIAL_IDS.dust] && <Image src={materialIcons[MATERIAL_IDS.dust]} alt="" width={32} height={32} />}
                <span className="text-gray-300 font-bold">{materialNames[MATERIAL_IDS.dust] || 'Polvo T6'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-500 uppercase font-bold">TP (Venta)</span>
                <span className="font-mono">{formatPrice(marketPrices[MATERIAL_IDS.dust]?.sell || 0)}</span>
                </div>
              </Motion>
        </div>

        {/* Salvage Kits Section */}
        <div className="mb-12">
          <Motion as="h3" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold text-white mb-6 flex items-center gap-3"
          >
            <BarChart3 className="w-6 h-6 text-purple-400" />
            {t('ectoplasm.kits.title')}
          </Motion>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'master', itemId: MATERIAL_IDS.kitMaster, color: 'yellow' },
              { id: 'mystic', itemId: MATERIAL_IDS.kitMystic, color: 'purple' },
              { id: 'silver', itemId: MATERIAL_IDS.kitSilver, color: 'slate' },
            ].map((card, i) => {
              const info = KITS_INFO[card.id as keyof typeof KITS_INFO];
              return (
              <Motion
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-slate-900/50 rounded-xl">
                    {materialIcons[card.itemId] && <Image src={materialIcons[card.itemId]} alt="" width={40} height={40} />}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{t(`ectoplasm.kits.${card.id}.name`)}</h4>
                    <p className="text-xs text-gray-500 font-medium uppercase">{t(`ectoplasm.kits.${card.id}.desc`)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-slate-700/30">
                    <span className="text-gray-400 text-sm">{t('salvage.label.costPerUse')}</span>
                    <span className={`font-black ${card.color === 'yellow' ? 'text-yellow-400' : card.color === 'purple' ? 'text-purple-400' : 'text-gray-300'}`}>
                      {kitCostLabel(info)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                    <span className="text-blue-400/80 text-xs font-bold uppercase">{t('ectoplasm.kits.totalCost100k')}</span>
                    <span className="font-black text-white italic">
                      {formatGSC(Math.ceil(100000 / info.charges) * info.price)}
                    </span>
                  </div>
                </div>
                </Motion>
            );
            })}
          </div>
        </div>

        {/* Main Table Card */}
          <Motion
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl mb-12"
          >
          <div className="p-8 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/30">
            <div className="flex items-center gap-3">
              <Table className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">{t('ectoplasm.table.title')}</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700/50">
              <Info className="w-3.5 h-3.5" />
              {t('ectoplasm.sampleData')}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40">
                  <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-wider border-b border-slate-700/50 w-24">#</th>
                  <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-wider border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      {materialIcons[MATERIAL_IDS.ecto] && <Image src={materialIcons[MATERIAL_IDS.ecto]} alt="" width={20} height={20} />}
                      {t('ectoplasm.table.ecto')}
                    </div>
                  </th>
                  <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-wider border-b border-slate-700/50">
                    <div className="flex items-center gap-2 text-blue-300">
                      {materialIcons[MATERIAL_IDS.dust] && <Image src={materialIcons[MATERIAL_IDS.dust]} alt="" width={20} height={20} />}
                      {t('ectoplasm.table.dust')}
                    </div>
                  </th>
                  <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-wider border-b border-slate-700/50">
                    <div className="flex items-center gap-2 text-blue-400">
                      {materialIcons[MATERIAL_IDS.luckBlue] && <Image src={materialIcons[MATERIAL_IDS.luckBlue]} alt="" width={20} height={20} />}
                      {t('ectoplasm.table.blueEssence')}
                    </div>
                  </th>
                  <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-wider border-b border-slate-700/50">
                    <div className="flex items-center gap-2 text-green-400">
                      {materialIcons[MATERIAL_IDS.luckGreen] && <Image src={materialIcons[MATERIAL_IDS.luckGreen]} alt="" width={20} height={20} />}
                      {t('ectoplasm.table.greenEssence')}
                    </div>
                  </th>
                  <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-wider border-b border-slate-700/50">
                    <div className="flex items-center gap-2 text-yellow-500">
                      {materialIcons[MATERIAL_IDS.luckYellow] && <Image src={materialIcons[MATERIAL_IDS.luckYellow]} alt="" width={20} height={20} />}
                      {t('ectoplasm.table.yellowEssence')}
                    </div>
                  </th>
                  <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-wider border-b border-slate-700/50">
                    <div className="flex items-center gap-2 text-orange-500">
                      {materialIcons[MATERIAL_IDS.luckOrange] && <Image src={materialIcons[MATERIAL_IDS.luckOrange]} alt="" width={20} height={20} />}
                      {t('ectoplasm.table.orangeEssence')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                 {/* Totales Row at the Top just like in the image */}
                 <tr className="bg-blue-500/5 border-b-2 border-blue-500/20 group hover:bg-blue-500/10 transition-colors">
                  <td className="px-8 py-5 font-black text-blue-400 uppercase italic tracking-tighter">{t('ectoplasm.table.totals')}</td>
                  {TOTALS.map((total, idx) => (
                    <td key={idx} className="px-6 py-5 font-black text-xl text-white group-hover:scale-105 transition-transform origin-left">
                      {total.toLocaleString('en-US')}
                    </td>
                  ))}
                </tr>

                {TABLE_DATA.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-8 py-5 text-gray-500 font-mono text-sm">{rowIndex + 1}</td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className={`px-6 py-5 font-medium ${cellIndex === 0 ? 'text-white' : 'text-gray-300'}`}>
                        {cell.toLocaleString('en-US')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Motion>



        {/* Info Card */}
          <Motion
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 bg-blue-900/20 border border-blue-500/20 rounded-2xl p-6 flex gap-4 items-start"
          >
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-white font-bold mb-1">{t('ectoplasm.info.title')}</h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('ectoplasm.info.content')}
            </p>
          </div>
        </Motion>
      </main>
    </div>
  );
}
