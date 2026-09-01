'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Crown, LayoutGrid, LogOut, Shield, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

interface NavUserMenuProps {
  onLogout: () => void;
}

export default function NavUserMenu({ onLogout }: NavUserMenuProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const initial = (user?.username?.[0] ?? 'U').toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] pl-1 pr-2.5 text-sm text-slate-200 transition hover:border-amber-400/25 hover:bg-white/[0.07]"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-600 text-xs font-bold text-black">
          {initial}
        </span>
        <span className="hidden max-w-[7rem] truncate font-medium sm:inline">{user?.username}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0d1118]/95 py-1 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">{user?.username}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>

          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.05] hover:text-white"
          >
            <LayoutGrid className="h-4 w-4" />
            {t('auth.myAccount', 'My Account')}
          </Link>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.05] hover:text-white"
          >
            <User className="h-4 w-4" />
            {t('auth.profile', 'Profile')}
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-200 hover:bg-amber-500/10"
            >
              <Crown className="h-4 w-4" />
              {t('auth.admin', 'Admin Panel')}
            </Link>
          )}
          {user?.role === 'moderator' && (
            <Link
              href="/moderator"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-sky-200 hover:bg-sky-500/10"
            >
              <Shield className="h-4 w-4" />
              {t('auth.moderation', 'Moderation Panel')}
            </Link>
          )}

          <div className="mt-1 border-t border-white/10 pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-rose-300 hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              {t('auth.logout', 'Logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
