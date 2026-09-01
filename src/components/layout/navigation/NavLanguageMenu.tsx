'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

const LANGUAGES = [
  { code: 'es', name: 'Español', short: 'ES' },
  { code: 'en', name: 'English', short: 'EN' },
  { code: 'de', name: 'Deutsch', short: 'DE' },
  { code: 'fr', name: 'Français', short: 'FR' },
] as const;

export default function NavLanguageMenu() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[1];

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-slate-200 transition hover:border-amber-400/30 hover:bg-white/[0.07] hover:text-white"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="h-3.5 w-3.5 text-amber-300/80" />
        <span>{current.short}</span>
        <ChevronDown className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] min-w-[9.5rem] overflow-hidden rounded-xl border border-white/10 bg-[#0d1118]/95 py-1 shadow-2xl backdrop-blur-xl"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={lang === l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                lang === l.code
                  ? 'bg-amber-500/15 text-amber-100'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span>{l.name}</span>
              <span className="text-xs opacity-60">{l.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
