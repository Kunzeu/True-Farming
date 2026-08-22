export type UnidentifiedGearTier = 'common' | 'masterwork' | 'rare';

export interface SalvageTierTheme {
  glow: string;
  accent: string;
  accentMuted: string;
  border: string;
  borderActive: string;
  gradient: string;
  gradientText: string;
  button: string;
  buttonHover: string;
  spinner: string;
  ring: string;
  tabActive: string;
  tabInactive: string;
  profitPositive: string;
  profitNegative: string;
}

export const SALVAGE_TIER_THEMES: Record<UnidentifiedGearTier, SalvageTierTheme> = {
  common: {
    glow: 'bg-sky-500/25',
    accent: 'text-sky-400',
    accentMuted: 'text-sky-400/70',
    border: 'border-sky-500/20',
    borderActive: 'border-sky-400/60',
    gradient: 'from-sky-500 to-cyan-400',
    gradientText: 'from-sky-300 to-cyan-200',
    button: 'bg-sky-600',
    buttonHover: 'hover:bg-sky-500',
    spinner: 'border-sky-400',
    ring: 'ring-sky-400/40',
    tabActive: 'bg-sky-500/15 text-sky-100 shadow-[inset_0_-2px_0_0_rgba(56,189,248,0.9)]',
    tabInactive: 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200',
    profitPositive: 'text-emerald-400',
    profitNegative: 'text-rose-400',
  },
  masterwork: {
    glow: 'bg-emerald-500/25',
    accent: 'text-emerald-400',
    accentMuted: 'text-emerald-400/70',
    border: 'border-emerald-500/20',
    borderActive: 'border-emerald-400/60',
    gradient: 'from-emerald-500 to-teal-400',
    gradientText: 'from-emerald-300 to-teal-200',
    button: 'bg-emerald-600',
    buttonHover: 'hover:bg-emerald-500',
    spinner: 'border-emerald-400',
    ring: 'ring-emerald-400/40',
    tabActive: 'bg-emerald-500/15 text-emerald-100 shadow-[inset_0_-2px_0_0_rgba(52,211,153,0.9)]',
    tabInactive: 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200',
    profitPositive: 'text-emerald-400',
    profitNegative: 'text-rose-400',
  },
  rare: {
    glow: 'bg-amber-500/25',
    accent: 'text-amber-400',
    accentMuted: 'text-amber-400/70',
    border: 'border-amber-500/20',
    borderActive: 'border-amber-400/60',
    gradient: 'from-amber-500 to-yellow-400',
    gradientText: 'from-amber-300 to-yellow-200',
    button: 'bg-amber-600',
    buttonHover: 'hover:bg-amber-500',
    spinner: 'border-amber-400',
    ring: 'ring-amber-400/40',
    tabActive: 'bg-amber-500/15 text-amber-100 shadow-[inset_0_-2px_0_0_rgba(251,191,36,0.9)]',
    tabInactive: 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200',
    profitPositive: 'text-emerald-400',
    profitNegative: 'text-rose-400',
  },
};

export const UNIDENTIFIED_GEAR_TIERS: {
  id: UnidentifiedGearTier;
  href: string;
  labelKey: string;
  defaultLabel: string;
  gearIcon: string;
  headerIcon: string;
  kitIcon: string;
}[] = [
  {
    id: 'common',
    href: '/salvage/common',
    labelKey: 'salvage.dropdown.common',
    defaultLabel: 'Common',
    gearIcon: 'https://render.guildwars2.com/file/E37A036C10C33E4242E568690CB2EA55AA65B915/1938436.png',
    headerIcon: 'https://render.guildwars2.com/file/E37A036C10C33E4242E568690CB2EA55AA65B915/1938436.png',
    kitIcon: 'https://render.guildwars2.com/file/CC2004000FFDFCEF346AAE296FD0E858C0990548/619581.png',
  },
  {
    id: 'masterwork',
    href: '/salvage/masterwork',
    labelKey: 'salvage.dropdown.masterwork',
    defaultLabel: 'Masterwork',
    gearIcon: 'https://render.guildwars2.com/file/B147379DFC5430E207FCB742804E199EDF727719/1766400.png',
    headerIcon: 'https://render.guildwars2.com/file/B147379DFC5430E207FCB742804E199EDF727719/1766400.png',
    kitIcon: 'https://render.guildwars2.com/file/68A875CAEC167AE97D3B9248A1014999D40CAEF5/2075500.png',
  },
  {
    id: 'rare',
    href: '/salvage/rare',
    labelKey: 'salvage.dropdown.rare',
    defaultLabel: 'Rare',
    gearIcon: 'https://render.guildwars2.com/file/EF63A10BD2317CECCEA63A3B7E6555550B414C4E/1766399.png',
    headerIcon: 'https://render.guildwars2.com/file/EF63A10BD2317CECCEA63A3B7E6555550B414C4E/1766399.png',
    kitIcon: 'https://render.guildwars2.com/file/53BE1B65A817091427E30319C2B2B3777C27A319/855379.png',
  },
];

export function getTierTheme(tier: UnidentifiedGearTier): SalvageTierTheme {
  return SALVAGE_TIER_THEMES[tier];
}

export function getMaterialRowClass(materialId: number): string {
  const cloth = [19748, 19745];
  const wood = [19722, 19725];
  const leather = [19729, 19732];
  const metal = [19700, 19701];
  const mota = [89140];
  const runes = [89182, 89141, 89098, 89103, 89258, 89216];

  if (cloth.includes(materialId)) return 'border-l-sky-500/50';
  if (wood.includes(materialId)) return 'border-l-orange-500/50';
  if (leather.includes(materialId)) return 'border-l-yellow-500/50';
  if (metal.includes(materialId)) return 'border-l-zinc-500/50';
  if (mota.includes(materialId)) return 'border-l-emerald-500/50';
  if (materialId === 19721) return 'border-l-violet-500/60';
  if (runes.includes(materialId)) return 'border-l-cyan-500/50';
  if (materialId === -1) return 'border-l-amber-400/70'; // Exóticos
  if (materialId === -2) return 'border-l-rose-400/50'; // Placas
  if (materialId === -3) return 'border-l-fuchsia-400/60'; // Suerte
  if (materialId === -4) return 'border-l-pink-400/50'; // Suerte Rápida
  return 'border-l-transparent';
}
