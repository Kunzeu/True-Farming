import { Resend } from 'resend';
import { buildVerificationUrl } from '@/lib/server/email-verification';
import { buildPasswordResetUrl } from '@/lib/server/password-reset';
import {
  type EmailLocale,
  createEmailSendError,
  createPasswordResetSendError,
  getPasswordResetEmailContent,
  getVerificationEmailContent,
} from '@/lib/server/email-i18n';
import { getWorkerEnvSync } from '@/lib/cf-env';

function envStr(key: 'RESEND_API_KEY' | 'EMAIL_FROM'): string {
  const worker = getWorkerEnvSync();
  const fromWorker = worker?.[key];
  if (typeof fromWorker === 'string' && fromWorker.trim()) return fromWorker.trim();
  const fromProcess = process.env[key];
  return typeof fromProcess === 'string' ? fromProcess.trim() : '';
}

function getResendClient(): Resend {
  const apiKey = envStr('RESEND_API_KEY');
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return envStr('EMAIL_FROM') || 'True Farming <onboarding@resend.dev>';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendVerificationEmail(
  to: string,
  username: string,
  token: string,
  locale: EmailLocale = 'en'
): Promise<void> {
  const verifyUrl = buildVerificationUrl(token);
  const resend = getResendClient();
  const { subject, html } = getVerificationEmailContent(
    locale,
    username,
    verifyUrl,
    escapeHtml
  );

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
  });

  if (error) {
    console.error('Resend verification email error:', error);
    throw createEmailSendError(locale, error.message);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  username: string,
  token: string,
  locale: EmailLocale = 'en'
): Promise<void> {
  const resetUrl = buildPasswordResetUrl(token);
  const resend = getResendClient();
  const { subject, html } = getPasswordResetEmailContent(
    locale,
    username,
    resetUrl,
    escapeHtml
  );

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
  });

  if (error) {
    console.error('Resend password reset email error:', error);
    throw createPasswordResetSendError(locale, error.message);
  }
}
