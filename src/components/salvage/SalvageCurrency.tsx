'use client';

interface SalvageCurrencyProps {
  copper: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  signed?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm gap-1',
  md: 'text-base gap-1.5',
  lg: 'text-xl gap-2',
  xl: 'text-2xl sm:text-4xl gap-1.5 sm:gap-2',
};

export default function SalvageCurrency({
  copper,
  size = 'md',
  signed = false,
  className = '',
}: SalvageCurrencyProps) {
  const rounded = Math.round(copper);
  const isNegative = rounded < 0;
  const abs = Math.abs(rounded);
  const gold = Math.floor(abs / 10000);
  const silver = Math.floor((abs % 10000) / 100);
  const c = abs % 100;

  const prefix = signed ? (isNegative ? '−' : '+') : '';

  return (
    <span
      className={`inline-flex items-baseline font-mono font-bold tabular-nums tracking-tight ${sizeClasses[size]} ${className}`}
    >
      {prefix && <span className="mr-0.5 text-zinc-500">{prefix}</span>}
      <span className="text-amber-400">{gold.toString().padStart(2, '0')}</span>
      <span className="text-[0.65em] font-semibold text-amber-400/80">g</span>
      <span className="text-zinc-200">{silver.toString().padStart(2, '0')}</span>
      <span className="text-[0.65em] font-semibold text-zinc-400">s</span>
      <span className="text-orange-400/90">{c.toString().padStart(2, '0')}</span>
      <span className="text-[0.65em] font-semibold text-orange-400/70">c</span>
    </span>
  );
}
