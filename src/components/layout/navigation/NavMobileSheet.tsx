'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from '@/lib/framer-motion-optimized';
import {
  BookOpen,
  ChevronDown,
  Crown,
  Gift,
  LayoutGrid,
  LogOut,
  Menu,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { NavItem } from './types';
import { getImageSrc, isImageUnoptimized } from './nav-utils';
import NavResetBar from './NavResetBar';
import NavLanguageMenu from './NavLanguageMenu';

interface NavMobileSheetProps {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  guidesItems: NavItem[];
  toolsItems: NavItem[];
  daily: string;
  weekly: string;
  special: string;
  onLogout: () => void;
}

function MobileSection({
  title,
  icon: Icon,
  items,
  onClose,
}: {
  title: string;
  icon: typeof BookOpen;
  items: NavItem[];
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-white/10 pt-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </span>
        <ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="mt-1 space-y-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-white/[0.05] hover:text-white"
            >
              {item.isImage ? (
                <Image
                  src={getImageSrc(item.icon as string)}
                  alt=""
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px]"
                  unoptimized={isImageUnoptimized(item.icon as string)}
                />
              ) : (
                <item.icon className="h-4 w-4 text-amber-300/80" />
              )}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NavMobileSheet({
  open,
  onClose,
  navItems,
  guidesItems,
  toolsItems,
  daily,
  weekly,
  special,
  onLogout,
}: NavMobileSheetProps) {
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const [userOpen, setUserOpen] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-[65] flex w-[min(100vw-2.5rem,20rem)] flex-col border-l border-white/10 bg-[#090d14]/98 shadow-2xl backdrop-blur-2xl lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-white">{t('nav.menu', 'Menú')}</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
              <NavResetBar daily={daily} weekly={weekly} special={special} compact />

              <div className="space-y-0.5">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[0.05]"
                  >
                    <item.icon className="h-4 w-4 text-amber-300/80" />
                    {item.label}
                  </Link>
                ))}
              </div>

              <MobileSection
                title={t('nav.guides', 'Guías')}
                icon={BookOpen}
                items={guidesItems}
                onClose={onClose}
              />
              <MobileSection
                title={t('nav.tools', 'Herramientas')}
                icon={Shield}
                items={toolsItems}
                onClose={onClose}
              />

              <Link
                href="/giveaways"
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-100"
              >
                <Gift className="h-4 w-4" />
                {t('nav.giveaways', 'Sorteos')}
              </Link>

              <div className="border-t border-white/10 pt-3">
                <NavLanguageMenu />
              </div>

              {isAuthenticated ? (
                <div className="border-t border-white/10 pt-2">
                  <button
                    type="button"
                    onClick={() => setUserOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {user?.username}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition ${userOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userOpen && (
                    <div className="mt-1 space-y-0.5">
                      <Link href="/account" onClick={onClose} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-white/[0.05]">
                        <LayoutGrid className="h-4 w-4" />
                        {t('auth.myAccount', 'My Account')}
                      </Link>
                      <Link href="/profile" onClick={onClose} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-white/[0.05]">
                        <User className="h-4 w-4" />
                        {t('auth.profile', 'Profile')}
                      </Link>
                      {user?.role === 'admin' && (
                        <Link href="/admin" onClick={onClose} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-amber-200 hover:bg-amber-500/10">
                          <Crown className="h-4 w-4" />
                          {t('auth.admin', 'Admin Panel')}
                        </Link>
                      )}
                      {user?.role === 'moderator' && (
                        <Link href="/moderator" onClick={onClose} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-sky-200 hover:bg-sky-500/10">
                          <Shield className="h-4 w-4" />
                          {t('auth.moderation', 'Moderation Panel')}
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onLogout();
                          onClose();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('auth.logout', 'Logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
                >
                  {t('auth.login', 'Login')}
                </Link>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function NavMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08] lg:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
