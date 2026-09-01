'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from '@/lib/framer-motion-optimized';
import { BookOpen, ChevronDown, Gift, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useNav } from '@/hooks/useNav';
import NavLogo from './navigation/NavLogo';
import NavResetBar from './navigation/NavResetBar';
import NavLanguageMenu from './navigation/NavLanguageMenu';
import NavSearchCommand from './navigation/NavSearchCommand';
import NavMegaPanel from './navigation/NavMegaPanel';
import NavUserMenu from './navigation/NavUserMenu';
import NavMobileSheet, { NavMobileMenuButton } from './navigation/NavMobileSheet';
import { useNavigationItems } from './navigation/useNavigationItems';
import { useResetTimers } from './navigation/useResetTimers';
import type { MegaMenuId } from './navigation/types';

function navLinkClass(active: boolean) {
  return [
    'rounded-lg px-4 py-2 text-sm font-medium transition',
    active
      ? 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/20'
      : 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
  ].join(' ');
}

export default function Navigation() {
  const { t } = useI18n();
  const { pathname } = useNav();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { navItems, guidesItems, toolsItems, allSearchableItems } = useNavigationItems();
  const { dailyResetTime, weeklyResetTime, specialEventTime } = useResetTimers();

  const [megaMenu, setMegaMenu] = useState<MegaMenuId>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const closeMega = () => setMegaMenu(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        closeMega();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    closeMega();
    setMobileOpen(false);
  }, [pathname]);

  const isGuidesActive = guidesItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const isToolsActive = toolsItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-50"
      data-no-ads="true"
      data-ads-exclude="true"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />

      <div className="border-b border-white/[0.08] bg-[#070a10] backdrop-blur-2xl">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-[100rem] items-center gap-4 px-5 sm:px-8 lg:gap-6 lg:px-10 xl:gap-8 xl:px-12">
          <div className="flex min-w-0 shrink-0 items-center gap-4 lg:gap-8">
            <NavLogo />

            <nav className="hidden items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1.5 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={navLinkClass(active)}>
                  {item.label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setMegaMenu((m) => (m === 'guides' ? null : 'guides'))}
              className={`flex items-center gap-1.5 ${navLinkClass(isGuidesActive || megaMenu === 'guides')}`}
            >
              <BookOpen className="h-3.5 w-3.5 opacity-80" />
              {t('nav.guides', 'Guías')}
              <ChevronDown className={`h-3.5 w-3.5 transition ${megaMenu === 'guides' ? 'rotate-180' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setMegaMenu((m) => (m === 'tools' ? null : 'tools'))}
              className={`flex items-center gap-1.5 ${navLinkClass(isToolsActive || megaMenu === 'tools')}`}
            >
              <Shield className="h-3.5 w-3.5 opacity-80" />
              {t('nav.tools', 'Herramientas')}
              <ChevronDown className={`h-3.5 w-3.5 transition ${megaMenu === 'tools' ? 'rotate-180' : ''}`} />
            </button>
          </nav>
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-2.5 sm:gap-3 lg:gap-4 xl:gap-5">
            <div className="hidden h-7 w-px shrink-0 bg-white/10 lg:block" aria-hidden />

            <NavResetBar
              daily={dailyResetTime}
              weekly={weeklyResetTime}
              special={specialEventTime}
            />

            <NavSearchCommand items={allSearchableItems} />

            <Link
              href="/giveaways"
              className="hidden h-9 items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/15 sm:flex"
            >
              <Gift className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t('nav.giveaways', 'Sorteos')}</span>
            </Link>

            <div className="hidden sm:block">
              <NavLanguageMenu />
            </div>

            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <div className="hidden lg:block">
                    <NavUserMenu onLogout={logout} />
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="hidden h-9 items-center rounded-lg bg-amber-500 px-3 text-sm font-semibold text-black transition hover:bg-amber-400 lg:flex"
                  >
                    {t('auth.login', 'Login')}
                  </Link>
                )}
              </>
            )}

            <NavMobileMenuButton onClick={() => setMobileOpen(true)} />
          </div>
        </div>

        <AnimatePresence>
          {megaMenu === 'guides' && (
            <NavMegaPanel
              title={t('nav.guides', 'Guías')}
              items={guidesItems}
              onClose={closeMega}
            />
          )}
          {megaMenu === 'tools' && (
            <NavMegaPanel
              title={t('nav.tools', 'Herramientas')}
              items={toolsItems}
              onClose={closeMega}
            />
          )}
        </AnimatePresence>
      </div>

      <NavMobileSheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navItems={navItems}
        guidesItems={guidesItems}
        toolsItems={toolsItems}
        daily={dailyResetTime}
        weekly={weeklyResetTime}
        special={specialEventTime}
        onLogout={logout}
      />
    </header>
  );
}
