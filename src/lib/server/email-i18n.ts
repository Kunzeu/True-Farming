import type { NextRequest } from 'next/server';
import en from '@/i18n/messages/en.json';
import es from '@/i18n/messages/es.json';
import de from '@/i18n/messages/de.json';
import fr from '@/i18n/messages/fr.json';

export type EmailLocale = 'en' | 'es' | 'de' | 'fr';

const MESSAGES: Record<EmailLocale, Record<string, string>> = {
  en,
  es,
  de,
  fr,
};

const SUPPORTED_LOCALES: EmailLocale[] = ['en', 'es', 'de', 'fr'];

export function normalizeEmailLocale(value: unknown): EmailLocale | null {
  if (typeof value !== 'string') return null;
  const locale = value.toLowerCase().split('-')[0] as EmailLocale;
  return SUPPORTED_LOCALES.includes(locale) ? locale : null;
}

export function parseEmailLocale(
  request: NextRequest,
  bodyLocale?: unknown
): EmailLocale {
  const fromBody = normalizeEmailLocale(bodyLocale);
  if (fromBody) return fromBody;

  // En Astro el handler recibe un Request plano, sin `cookies`
  const cookieLocale = request.headers.get('cookie')?.match(/(?:^|;\s*)tf_lang=([^;]+)/)?.[1];
  const fromCookie = normalizeEmailLocale(cookieLocale);
  if (fromCookie) return fromCookie;

  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(',')
      .map((part) => part.trim().split(';')[0].toLowerCase());

    for (const lang of preferred) {
      const normalized = normalizeEmailLocale(lang);
      if (normalized) return normalized;
    }
  }

  return 'en';
}

export const EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED';

function t(locale: EmailLocale, key: string, fallback: string): string {
  const value = MESSAGES[locale][key];
  return typeof value === 'string' ? value : fallback;
}

export function getEmailSendFailedMessage(locale: EmailLocale): string {
  return t(
    locale,
    'auth.emailVerification.sendFailed',
    'Could not send the verification email.'
  );
}

export function createEmailSendError(locale: EmailLocale, details?: string): Error {
  const base = getEmailSendFailedMessage(locale);
  const error = new Error(details ? `${base} (${details})` : base) as Error & { code: string };
  error.code = EMAIL_SEND_FAILED;
  return error;
}

export function getPasswordResetSendFailedMessage(locale: EmailLocale): string {
  return t(
    locale,
    'auth.passwordReset.sendFailed',
    'Could not send the password reset email.'
  );
}

export function createPasswordResetSendError(locale: EmailLocale, details?: string): Error {
  const base = getPasswordResetSendFailedMessage(locale);
  const error = new Error(details ? `${base} (${details})` : base) as Error & { code: string };
  error.code = EMAIL_SEND_FAILED;
  return error;
}

export interface VerificationEmailContent {
  subject: string;
  html: string;
}

function buildEmailHtml(
  brand: string,
  greeting: string,
  intro: string,
  button: string,
  url: string,
  fallback: string,
  expires: string,
  escapeHtml: (value: string) => string
): string {
  return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #2563eb;">${escapeHtml(brand)}</h1>
        <p>${greeting}</p>
        <p>${escapeHtml(intro)}</p>
        <p style="margin: 32px 0;">
          <a href="${url}" style="background: #2563eb; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">
            ${escapeHtml(button)}
          </a>
        </p>
        <p style="font-size: 14px; color: #6b7280;">
          ${escapeHtml(fallback)}<br />
          <a href="${url}">${escapeHtml(url)}</a>
        </p>
        <p style="font-size: 14px; color: #6b7280;">${escapeHtml(expires)}</p>
      </div>
    `;
}

export function getVerificationEmailContent(
  locale: EmailLocale,
  username: string,
  verifyUrl: string,
  escapeHtml: (value: string) => string
): VerificationEmailContent {
  const greeting = t(
    locale,
    'auth.emailVerification.greeting',
    'Hello {username},'
  ).replace('{username}', `<strong>${escapeHtml(username)}</strong>`);

  return {
    subject: t(locale, 'auth.emailVerification.subject', 'Confirm your True Farming account'),
    html: buildEmailHtml(
      t(locale, 'auth.emailVerification.brand', 'True Farming'),
      greeting,
      t(
        locale,
        'auth.emailVerification.intro',
        'Thanks for signing up. Confirm your email to activate your account:'
      ),
      t(locale, 'auth.emailVerification.button', 'Confirm my account'),
      verifyUrl,
      t(
        locale,
        'auth.emailVerification.fallback',
        'If the button does not work, copy and paste this link into your browser:'
      ),
      t(locale, 'auth.emailVerification.expires', 'This link expires in 24 hours.'),
      escapeHtml
    ),
  };
}

export function getPasswordResetEmailContent(
  locale: EmailLocale,
  username: string,
  resetUrl: string,
  escapeHtml: (value: string) => string
): VerificationEmailContent {
  const greeting = t(
    locale,
    'auth.passwordReset.greeting',
    'Hello {username},'
  ).replace('{username}', `<strong>${escapeHtml(username)}</strong>`);

  const html = buildEmailHtml(
    t(locale, 'auth.emailVerification.brand', 'True Farming'),
    greeting,
    t(
      locale,
      'auth.passwordReset.intro',
      'We received a request to reset your password. Choose a new one here:'
    ),
    t(locale, 'auth.passwordReset.button', 'Reset my password'),
    resetUrl,
    t(
      locale,
      'auth.emailVerification.fallback',
      'If the button does not work, copy and paste this link into your browser:'
    ),
    t(locale, 'auth.passwordReset.expires', 'This link expires in 1 hour.'),
    escapeHtml
  );

  const ignore = t(
    locale,
    'auth.passwordReset.ignore',
    'If you did not request this, you can ignore this email; your password stays the same.'
  );

  return {
    subject: t(locale, 'auth.passwordReset.subject', 'Reset your True Farming password'),
    html: `${html}<p style="font-size: 14px; color: #6b7280; max-width: 560px; margin: 0 auto;">${escapeHtml(ignore)}</p>`,
  };
}
