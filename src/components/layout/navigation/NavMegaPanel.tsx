'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from '@/lib/framer-motion-optimized';
import type { NavItem } from './types';
import { getImageSrc, isImageUnoptimized } from './nav-utils';

interface NavMegaPanelProps {
  title: string;
  items: NavItem[];
  onClose: () => void;
}

export default function NavMegaPanel({ title, items, onClose }: NavMegaPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-x-0 top-full z-50 border-b border-white/15 bg-[#0b0f16] shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
    >
      <div className="mx-auto max-w-[100rem] px-5 py-5 sm:px-8 lg:px-10 xl:px-12">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
          {title}
        </p>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-amber-400/25 hover:bg-white/[0.08]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] ring-1 ring-white/15">
                {item.isImage ? (
                  <Image
                    src={getImageSrc(item.icon as string)}
                    alt=""
                    width={22}
                    height={22}
                    className={`h-[22px] w-[22px] ${item.icon === 'Glosary' ? 'mix-blend-screen' : ''}`}
                    unoptimized={isImageUnoptimized(item.icon as string)}
                  />
                ) : (
                  <item.icon className="h-4 w-4 text-amber-300/80" />
                )}
              </span>
              <span className="min-w-0 text-sm font-medium text-slate-100 group-hover:text-white">
                <span className="line-clamp-2">{item.label}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
