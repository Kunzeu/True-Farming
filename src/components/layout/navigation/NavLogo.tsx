'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from '@/lib/framer-motion-optimized';

export default function NavLogo() {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-3 sm:gap-3.5">
      <motion.div
        whileHover={{ scale: 1.04 }}
        className="relative shrink-0"
      >
        <div className="absolute -inset-1 rounded-xl bg-amber-400/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
        <Image
          src="/images/icons/icon.webp"
          alt="True Farming"
          width={40}
          height={40}
          className="relative h-9 w-9 rounded-lg ring-1 ring-white/10 sm:h-10 sm:w-10"
        />
      </motion.div>
      <div className="hidden sm:block">
        <p className="whitespace-nowrap text-sm font-bold tracking-tight text-white sm:text-[15px]">
          True Farming
        </p>
        <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.16em] text-amber-200/50 sm:text-[11px]">
          Guild Wars 2
        </p>
      </div>
    </Link>
  );
}
