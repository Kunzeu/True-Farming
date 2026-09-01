'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/framer-motion-optimized';
import { useI18n } from '@/contexts/I18nContext';
import type { NavItem } from './types';
import { getImageSrc, isImageUnoptimized } from './nav-utils';

interface NavSearchCommandProps {
  items: NavItem[];
}

export default function NavSearchCommand({ items }: NavSearchCommandProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter((item) => {
        const inLabel = item.label.toLowerCase().includes(q);
        const inKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
        return inLabel || inKeywords;
      })
      .slice(0, 12);
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : i));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : 0));
    } else if (event.key === 'Enter' && results[selectedIndex]) {
      event.preventDefault();
      window.location.href = results[selectedIndex].href;
      close();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 min-w-[9.5rem] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 text-sm text-slate-400 transition hover:border-amber-400/25 hover:bg-white/[0.07] hover:text-slate-200 md:flex lg:min-w-[11rem]"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">{t('nav.search', 'Buscar...')}</span>
        <kbd className="hidden rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 lg:inline">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:text-white md:hidden"
        aria-label={t('nav.search', 'Buscar')}
      >
        <Search className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[12vh]">
            <motion.button
              type="button"
              aria-label="Close"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={close}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c1018]/95 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <Search className="h-4 w-4 text-amber-300/70" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder={t('nav.search', 'Buscar páginas y herramientas...')}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-2">
                {results.length > 0 ? (
                  results.map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        index === selectedIndex
                          ? 'bg-amber-500/15 text-white'
                          : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      {item.isImage ? (
                        <Image
                          src={getImageSrc(item.icon as string)}
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 shrink-0"
                          unoptimized={isImageUnoptimized(item.icon as string)}
                        />
                      ) : (
                        <item.icon className="h-4 w-4 shrink-0 text-amber-300/80" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))
                ) : query.trim() ? (
                  <p className="px-3 py-8 text-center text-sm text-slate-500">
                    {t('nav.noResults', 'No se encontraron resultados')}
                  </p>
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-slate-500">
                    {t('nav.searchHint', 'Escribe para buscar guías, herramientas y rutas')}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
