'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type LangCode = 'en' | 'de' | 'es' | 'fr';

type Messages = Record<string, string | Record<string, string>>;

interface I18nContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

import en from '@/i18n/messages/en.json';
import de from '@/i18n/messages/de.json';
import es from '@/i18n/messages/es.json';
import fr from '@/i18n/messages/fr.json';

const LANG_STORAGE_KEY = 'tf_lang';
// ponytail: Nav y páginas son islas Astro distintas; storage no dispara en el mismo tab
const LANG_EVENT = 'tf_lang_change';

const ALL_MESSAGES: Record<LangCode, Messages> = { en, de, es, fr };

function isLangCode(v: string | null | undefined): v is LangCode {
  return !!v && v in ALL_MESSAGES;
}

function detectInitialLang(): LangCode {
  return 'en';
}

export function I18nProvider({ children, initialLang }: { children: React.ReactNode; initialLang?: LangCode }) {
  const initial = initialLang ?? detectInitialLang();
  const [lang, setLangState] = useState<LangCode>(initial);

  const setLang = (next: LangCode) => {
    setLangState(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANG_STORAGE_KEY, next);
        document.cookie = `${LANG_STORAGE_KEY}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
        window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: next }));
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (isLangCode(stored)) {
      setLangState(stored);
    } else {
      const nav = navigator.language?.toLowerCase() || 'en';
      if (nav.startsWith('es')) setLangState('es');
      else if (nav.startsWith('de')) setLangState('de');
      else if (nav.startsWith('fr')) setLangState('fr');
      else setLangState('en');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onIslandLang = (e: Event) => {
      const next = (e as CustomEvent<string>).detail;
      if (isLangCode(next)) setLangState(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === LANG_STORAGE_KEY && isLangCode(e.newValue)) {
        setLangState(e.newValue);
      }
    };

    window.addEventListener(LANG_EVENT, onIslandLang);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LANG_EVENT, onIslandLang);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const messages = useMemo(() => ALL_MESSAGES[lang] || en, [lang]);

  const t = useMemo(() => {
    return (key: string, fallback?: string) => {
      const value = messages[key];
      if (typeof value === 'string') {
        return value;
      } else if (typeof value === 'object' && value !== null) {
        return fallback ?? key;
      }
      return fallback ?? key;
    };
  }, [messages]);

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
