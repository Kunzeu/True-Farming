'use client';

import { motion } from 'framer-motion';
import { Clock, Copy, Info, User, Users } from 'lucide-react';
import ExpansionIcon from '@/components/ui/ExpansionIcon';
import GW2Icon from '@/components/ui/GW2Icon';
import MarkdownText from '@/components/ui/MarkdownText';
import { FarmItem } from '@/hooks/useDatabase';

const EXPANSIONS = ['core', 'hot', 'pof', 'eod', 'soto', 'jw', 'voe'] as const;
type Expansion = (typeof EXPANSIONS)[number];

const currencyMap = {
  gold: { icon: 'gold' as const, labelKey: 'currency.gold', suffix: '' },
  spiritShards: { icon: 'spirit-shard' as const, labelKey: 'currency.spiritShards', suffix: '' },
  karma: { icon: 'karma' as const, labelKey: 'currency.karma', suffix: '' },
  fractalRelics: { icon: 'fractal-relic' as const, labelKey: 'currency.fractalRelics', suffix: '' },
  volatileMagic: { icon: 'volatile-magic' as const, labelKey: 'currency.volatileMagic', suffix: '' },
  unboundMagic: { icon: 'unbound-magic' as const, labelKey: 'currency.unboundMagic', suffix: '' },
  riftEssences: { icon: 'rift-essence' as const, labelKey: 'currency.riftEssences', suffix: '' },
  mysticClovers: { icon: 'mystic-clover' as const, labelKey: 'currency.mysticClovers', suffix: '' },
  imperialFavor: { icon: 'imperial-favor' as const, labelKey: 'currency.imperialFavor', suffix: '' },
};

interface FarmingRouteCardProps {
  route: FarmItem;
  index: number;
  copiedWaypoint: string | null;
  onCopyWaypoint: (waypoint: string, farmId: string) => void;
  onOpenDescription: (route: FarmItem) => void;
  truncateDescription: (text: string, maxLength?: number) => string;
  formatGoldDisplay: (goldValue: string | undefined) => string;
  t: (key: string, fallback?: string) => string;
}

function getRouteRewards(
  route: FarmItem,
  formatGoldDisplay: (goldValue: string | undefined) => string
) {
  const rewards: {
    key: string;
    labelKey: string;
    icon: (typeof currencyMap)[keyof typeof currencyMap]['icon'];
    value: string;
  }[] = [];

  if (route.estimatedRewards && Object.keys(route.estimatedRewards).length > 0) {
    Object.entries(route.estimatedRewards).forEach(([currencyType, rawValue]) => {
      if (!rawValue || !rawValue.trim()) return;
      const currency = currencyMap[currencyType as keyof typeof currencyMap];
      if (!currency) return;
      rewards.push({
        key: currencyType,
        labelKey: currency.labelKey,
        icon: currency.icon,
        value: currencyType === 'gold' ? formatGoldDisplay(rawValue) : `${rawValue}${currency.suffix}`,
      });
    });
  } else {
    if (route.estimatedGold?.trim()) {
      rewards.push({
        key: 'gold',
        labelKey: 'currency.gold',
        icon: 'gold',
        value: formatGoldDisplay(route.estimatedGold),
      });
    }
    if (route.estimatedSpirit?.trim()) {
      rewards.push({
        key: 'spiritShards',
        labelKey: 'currency.spiritShards',
        icon: 'spirit-shard',
        value: `${route.estimatedSpirit}/h`,
      });
    }
  }

  return rewards;
}

export default function FarmingRouteCard({
  route,
  index,
  copiedWaypoint,
  onCopyWaypoint,
  onOpenDescription,
  truncateDescription,
  formatGoldDisplay,
  t,
}: FarmingRouteCardProps) {
  const routeExpansions = (Array.isArray(route.expansion) ? route.expansion : [route.expansion]) as Expansion[];
  const locationImage = route.locationImageUrl?.trim() || '';
  const rewards = getRouteRewards(route, formatGoldDisplay);
  const copyKey = route.waypoint ? `${route.id}-${route.waypoint}` : '';

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.2) }}
      className="group relative min-h-[300px] w-full overflow-hidden rounded-2xl border border-purple-500/55 shadow-[0_0_28px_rgba(147,51,234,0.14)] transition duration-300 hover:border-purple-400/75 hover:shadow-[0_0_36px_rgba(147,51,234,0.24)]"
    >
      {locationImage ? (
        <>
          {/* img: remote GW2 icon URL */}
          <img
            src={locationImage}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#080b16] from-[38%] via-[#080b16]/90 via-[55%] to-[#080b16]/25" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-[#080b16] via-[#12081f] to-[#1a1030]" />
      )}

      <div className="relative z-10 flex min-h-[300px] flex-col p-5 pr-[18%] sm:p-6 sm:pr-[20%]">
        {route.requiresSquad && (
          <span className="mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
            <Users className="h-3.5 w-3.5" />
            {t('farmingRoutes.mode.squad', 'Squad')}
          </span>
        )}
        {route.isSolo && !route.requiresSquad && (
          <span className="mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
            <User className="h-3.5 w-3.5" />
            {t('farmingRoutes.mode.solo', 'Solo')}
          </span>
        )}

        <h2 className="mb-2.5 max-w-[85%] text-xl font-bold leading-snug text-white sm:text-2xl">{route.name}</h2>

        <button type="button" onClick={() => onOpenDescription(route)} className="mb-3 max-w-[85%] text-left">
          <div className="[&_a]:font-medium [&_a]:text-violet-400 [&_a]:underline [&_a:hover]:text-violet-300">
            <MarkdownText
              text={truncateDescription(route.description, 260)}
              className="text-sm leading-relaxed text-gray-100"
            />
          </div>
          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-violet-400 transition group-hover:text-violet-300">
            <Info className="h-4 w-4" />
            {t('cta.seeFullDescription', 'See full description')}
          </span>
        </button>

        {route.waypoint && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-purple-300/70">{t('label.waypoint', 'Waypoint:')}</span>
            <button
              type="button"
              onClick={() => onCopyWaypoint(route.waypoint!, route.id)}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs transition ${
                copiedWaypoint === copyKey
                  ? 'border-green-500/40 bg-green-900/30 text-green-300'
                  : 'border-purple-500/30 bg-purple-950/50 text-violet-300 hover:bg-purple-900/40'
              }`}
            >
              {route.waypoint}
              <Copy className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="mb-4 flex items-start gap-2.5">
          <Clock className="mt-1 h-5 w-5 shrink-0 text-purple-400" />
          <div>
            <p className="text-sm font-medium text-purple-400">{t('label.time', 'Time')}</p>
            <p className="text-2xl font-bold tracking-wide text-white sm:text-[1.75rem]">
              {route.estimatedTime}
            </p>
          </div>
        </div>

        {rewards.length > 0 && (
          <div className="mt-auto flex flex-wrap items-start gap-y-4 pt-2">
            {rewards.map((reward, rewardIndex) => (
              <div
                key={reward.key}
                className={`flex min-w-[5.25rem] shrink-0 flex-col gap-1 sm:min-w-[6.5rem] ${
                  rewardIndex > 0 ? 'border-l border-purple-500/30 pl-4 sm:pl-5' : 'pr-1'
                } ${rewardIndex < rewards.length - 1 ? 'pr-4 sm:pr-5' : ''}`}
              >
                <div className="flex items-start gap-1.5">
                  <GW2Icon type={reward.icon} size="lg" className="mt-0.5 shrink-0" />
                  <p className="text-xs font-medium leading-tight text-purple-400">
                    {t(reward.labelKey, reward.labelKey)}
                  </p>
                </div>
                <p className="text-sm font-bold tabular-nums leading-tight text-yellow-300 sm:text-base">
                  {reward.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2.5 rounded-2xl border border-white/25 bg-black/70 px-2.5 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.65)] sm:right-5">
        {routeExpansions.map((exp) => (
          <ExpansionIcon key={exp} expansion={exp} size="md" variant="compact" />
        ))}
      </div>
    </motion.article>
  );
}
