import crypto from 'crypto';
import { pool } from '@/lib/postgres-db';
import { getWorkerEnvSync } from '@/lib/cf-env';

const TOKEN_BYTES = 32;
const TOKEN_TTL_HOURS = 24;
const RESEND_COOLDOWN_MINUTES = 2;

export function hashVerificationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateVerificationToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
  return { token, hash: hashVerificationToken(token), expiresAt };
}

export async function createVerificationToken(userId: string): Promise<string> {
  await pool.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);

  const { token, hash, expiresAt } = generateVerificationToken();

  await pool.query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hash, expiresAt]
  );

  return token;
}

export async function canResendVerification(userId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT created_at FROM email_verification_tokens
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return true;
  }

  const createdAt = new Date(result.rows[0].created_at);
  const cooldownMs = RESEND_COOLDOWN_MINUTES * 60 * 1000;
  return Date.now() - createdAt.getTime() >= cooldownMs;
}

export async function verifyEmailToken(token: string): Promise<{ userId: string; email: string } | null> {
  const tokenHash = hashVerificationToken(token);

  const result = await pool.query(
    `SELECT evt.user_id, evt.expires_at, u.email
     FROM email_verification_tokens evt
     JOIN users u ON u.id = evt.user_id
     WHERE evt.token_hash = $1`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  if (new Date(row.expires_at) < new Date()) {
    await pool.query('DELETE FROM email_verification_tokens WHERE token_hash = $1', [tokenHash]);
    return null;
  }

  await pool.query(
    `UPDATE users
     SET email_verified = true, email_verified_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [row.user_id]
  );

  await pool.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [row.user_id]);

  return { userId: row.user_id, email: row.email };
}

export function getAppBaseUrl(): string {
  const w = getWorkerEnvSync();
  return (
    w?.NEXT_PUBLIC_APP_URL ||
    w?.PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.PUBLIC_SITE_URL ||
    'https://www.true-farming.com'
  ).replace(/\/$/, '');
}

export function buildVerificationUrl(token: string): string {
  return `${getAppBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;
}
