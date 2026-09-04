'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from '@/lib/framer-motion-optimized';
import {
  BookOpen,
  ChevronDown,
  Crown,
  LayoutGrid,
  LogOut,
  Menu,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useNav } from '@/hooks/useNav';
import type { NavItem } from './types';
import { getImageSrc, isImageUnoptimized } from './nav-utils';
import NavResetBar from './NavResetBar';
import NavLanguageMenu from './NavLanguageMenu';
import PatreonBadge from '@/components/PatreonBadge';

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

function itemActive(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
}

function MobileLink({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const { pathname } = useNav();
  const active = itemActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/20'
          : 'text-slate-200 hover:bg-white/[0.06] hover:text-white'
      }`}
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
        <item.icon className={`h-4 w-4 ${active ? 'text-amber-300' : 'text-amber-300/70'}`} />
      )}
      <span>{item.label}</span>
    </Link>
  );
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
  const { pathname } = useNav();
  const hasActive = items.some((item) => itemActive(pathname, item.href));
  const [expanded, setExpanded] = useState(hasActive);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-amber-300/80" />
          {title}
        </span>
        <ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="space-y-0.5 border-t border-white/[0.06] px-1.5 py-1.5">
          {items.map((item) => (
            <MobileLink key={item.href} item={item} onClose={onClose} />
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
  const initial = (user?.username?.[0] ?? 'U').toUpperCase();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
            className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-[65] flex w-[min(100vw-1.25rem,22rem)] flex-col border-l border-white/10 bg-[#080c12] shadow-[0_0_80px_rgba(0,0,0,0.55)] lg:hidden"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/images/icons/icon.webp"
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg ring-1 ring-white/10"
                />
                <div>
                  <p className="text-sm font-semibold text-white">{t('nav.menu', 'Menú')}</p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-200/45">
                    True Farming
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="shrink-0 border-b border-white/[0.08] px-3 py-3">
              {isAuthenticated ? (
                <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]">
                  <button
                    type="button"
                    onClick={() => setUserOpen((v) => !v)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-200"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 text-xs font-bold text-black">
                        {initial}
                      </span>
                      <span className="truncate">{user?.username}</span>
                      <PatreonBadge className="!px-1.5 !py-0" />
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${userOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userOpen && (
                    <div className="space-y-0.5 border-t border-white/[0.06] px-1.5 py-1.5">
                      <Link href="/account" onClick={onClose} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-300 hover:bg-white/[0.05]">
                        <LayoutGrid className="h-4 w-4" />
                        {t('auth.myAccount', 'My Account')}
                      </Link>
                      <Link href="/profile" onClick={onClose} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-300 hover:bg-white/[0.05]">
                        <User className="h-4 w-4" />
                        {t('auth.profile', 'Profile')}
                      </Link>
                      {user?.role === 'admin' && (
                        <Link href="/admin" onClick={onClose} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-amber-200 hover:bg-amber-500/10">
                          <Crown className="h-4 w-4" />
                          {t('auth.admin', 'Admin Panel')}
                        </Link>
                      )}
                      {user?.role === 'moderator' && (
                        <Link href="/moderator" onClick={onClose} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-sky-200 hover:bg-sky-500/10">
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
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
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
                  className="flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400"
                >
                  {t('auth.login', 'Login')}
                </Link>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
              <NavResetBar daily={daily} weekly={weekly} special={special} compact />

              <div className="space-y-0.5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-1.5">
                {navItems.map((item) => (
                  <MobileLink key={item.href} item={item} onClose={onClose} />
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

            </div>

            <div className="shrink-0 border-t border-white/[0.08] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <NavLanguageMenu fullWidth />
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
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-amber-400/30 hover:bg-white/[0.08] hover:text-white lg:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
