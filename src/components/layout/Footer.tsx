'use client';

import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import {
  ExternalLink,
  Heart,
  Coffee,
  Zap,
  Bot,
  Globe,
  Package,
  Trophy,
} from 'lucide-react';

const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
  </svg>
);

const sectionTitle =
  'mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500';
const footerLink =
  'block text-sm text-zinc-400 transition-colors hover:text-white';

export default function Footer() {
  const { t, lang, setLang } = useI18n();

  const languages = [
    { code: 'es', name: 'ES' },
    { code: 'en', name: 'EN' },
    { code: 'de', name: 'DE' },
    { code: 'fr', name: 'FR' },
  ] as const;

  return (
    <footer className="relative z-10 mt-auto border-t border-slate-600/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {/* Apoyo */}
          <div>
            <h3 className={sectionTitle}>
              <Coffee className="h-3.5 w-3.5 text-orange-400" />
              {t('footer.supportSite', 'Apoyo')}
            </h3>
            <p className="mb-3 hidden text-xs leading-relaxed text-zinc-500 sm:block">
              {t('footer.supportDescription', 'Ayúdanos a mantener y mejorar la plataforma')}
            </p>
            <a
              href="https://patreon.com/KunzeuLabs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3.5 py-2 text-sm font-medium text-orange-300 transition-colors hover:bg-orange-500/20 hover:text-orange-200"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">{t('footer.becomePatron', 'Hazte Patrocinador')}</span>
              <span className="sm:hidden">Patreon</span>
            </a>
            <Link
              href="/support"
              className="mt-2 block text-xs text-orange-400/80 transition-colors hover:text-orange-300"
            >
              {t('footer.viewBenefits', 'Ver beneficios y niveles')}
            </Link>
            <Link
              href="/contributions"
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-800/50 px-3.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-slate-700/50 hover:text-white"
            >
              <Trophy className="h-4 w-4 text-cyan-400" />
              {t('pageTitles.contributions', 'Contribuciones')}
            </Link>
          </div>

          {/* Comunidad */}
          <div>
            <h3 className={sectionTitle}>
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              {t('footer.communityContact', 'Comunidad')}
            </h3>
            <div className="space-y-2">
              <a
                href="https://discord.gg/KQSrhA2qmx"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-fit items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                <DiscordIcon className="h-4 w-4 text-indigo-400" />
                Discord
                <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
              <a
                href="https://x.com/TrueFarming"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-fit items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                <XIcon className="h-4 w-4 text-zinc-300" />
                X
                <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
              <a
                href="https://discord.com/oauth2/authorize?client_id=1328499706162315334"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-fit items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                <Bot className="h-4 w-4 text-sky-400" />
                Bot
                <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className={sectionTitle}>
              <ExternalLink className="h-3.5 w-3.5 text-sky-400" />
              {t('footer.legal', 'Legal')}
            </h3>
            <div className="space-y-2">
              <Link href="/privacy-policy" className={footerLink}>
                {t('footer.privacyPolicy', 'Política de Privacidad')}
              </Link>
              <Link href="/terms-of-service" className={footerLink}>
                {t('footer.termsOfService', 'Términos de Servicio')}
              </Link>
              <Link href="/cookies-info" className={footerLink}>
                {t('footer.cookiePolicy', 'Política de Cookies')}
              </Link>
              <Link href="/data-management" className={footerLink}>
                {t('footer.dataManagement', 'Gestión de Datos')}
              </Link>
            </div>
          </div>

          {/* Changelog */}
          <div>
            <h3 className={sectionTitle}>
              <Package className="h-3.5 w-3.5 text-sky-400" />
              {t('footer.changelog', 'Actualizaciones')}
            </h3>
            <Link href="/changelog" className={`${footerLink} inline-flex items-center gap-1.5`}>
              <Zap className="h-3.5 w-3.5" />
              {t('footer.viewChangelog', 'Ver Changelog')}
            </Link>
          </div>

          {/* Idioma */}
          <div>
            <h3 className={sectionTitle}>
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              {t('footer.language', 'Idioma')}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    lang === l.code
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-zinc-400 hover:bg-slate-700/60 hover:text-white'
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-600/50 pt-4 text-center">
          <p className="mb-1 text-xs text-zinc-400" suppressHydrationWarning>
            © {new Date().getFullYear()} True Farming.{' '}
            {t('footer.allRights', 'Todos los derechos reservados.')}
          </p>
          <p className="text-xs text-zinc-500">
            Guild Wars 2 © ArenaNet LLC.{' '}
            {t('footer.notAffiliated', 'No afiliado con ArenaNet.')}
          </p>
        </div>
      </div>
    </footer>
  );
}
