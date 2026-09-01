'use client';

import { Calendar, Clock, Star } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

interface NavResetBarProps {
  daily: string;
  weekly: string;
  special: string;
  compact?: boolean;
}

function TimerChip({
  icon: Icon,
  label,
  value,
  tone,
  title,
  compact,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  tone: 'sky' | 'violet' | 'amber';
  title: string;
  compact?: boolean;
}) {
  const tones = {
    sky: 'border-sky-500/25 bg-sky-500/10 text-sky-100',
    violet: 'border-violet-500/25 bg-violet-500/10 text-violet-100',
    amber: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
  };

  return (
    <div
      title={title}
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${tones[tone]} ${compact ? 'text-[10px]' : 'text-xs'}`}
    >
      <Icon className={compact ? 'h-3 w-3 shrink-0 opacity-80' : 'h-3.5 w-3.5 shrink-0 opacity-80'} />
      <span className="min-w-[5.75rem] font-mono text-[11px] font-semibold tabular-nums sm:min-w-[6.25rem] sm:text-xs">{value}</span>
      {compact && <span className="ml-auto text-[9px] uppercase tracking-wide opacity-70">{label}</span>}
    </div>
  );
}

export default function NavResetBar({ daily, weekly, special, compact }: NavResetBarProps) {
  const { t } = useI18n();

  if (compact) {
    return (
      <div className="grid grid-cols-1 gap-1.5">
        <TimerChip
          icon={Clock}
          label={t('nav.daily', 'Daily')}
          value={daily}
          tone="sky"
          title={t('nav.dailyReset', 'Reset Daily')}
          compact
        />
        <TimerChip
          icon={Calendar}
          label={t('nav.weekly', 'Weekly')}
          value={weekly}
          tone="violet"
          title={t('nav.weeklyReset', 'Reset Weekly')}
          compact
        />
        <TimerChip
          icon={Star}
          label={t('nav.special', 'Special')}
          value={special}
          tone="amber"
          title={t('nav.specialEvent', "Wizard's Vault Reset")}
          compact
        />
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2.5 lg:flex">
      <TimerChip
        icon={Clock}
        label=""
        value={daily}
        tone="sky"
        title={t('nav.dailyReset', 'Reset Daily')}
      />
      <TimerChip
        icon={Calendar}
        label=""
        value={weekly}
        tone="violet"
        title={t('nav.weeklyReset', 'Reset Weekly')}
      />
      <TimerChip
        icon={Star}
        label=""
        value={special}
        tone="amber"
        title={t('nav.specialEvent', "Wizard's Vault Reset")}
      />
    </div>
  );
}
