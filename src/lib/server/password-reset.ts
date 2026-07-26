import { pool } from '@/lib/postgres-db';
import {
  generateVerificationToken,
  getAppBaseUrl,
  hashVerificationToken,
} from '@/lib/server/email-verification';

const TOKEN_TTL_MINUTES = 60;
const RESEND_COOLDOWN_MINUTES = 2;

// No hay sistema de migraciones en el repo: la tabla se crea al primer uso.
async function ensureTable(): Promise<void> {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
       token_hash text PRIMARY KEY,
       user_id text NOT NULL,
       expires_at timestamptz NOT NULL,
       created_at timestamptz NOT NULL DEFAULT NOW()
     )`
  );
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  await ensureTable();
  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);

  const { token, hash } = generateVerificationToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await pool.query(
    `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [hash, userId, expiresAt]
  );

  return token;
}

export async function canRequestPasswordReset(userId: string): Promise<boolean> {
  await ensureTable();
  const result = await pool.query(
    `SELECT created_at FROM password_reset_tokens
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) return true;

  const createdAt = new Date(result.rows[0].created_at);
  return Date.now() - createdAt.getTime() >= RESEND_COOLDOWN_MINUTES * 60 * 1000;
}

/** Devuelve el userId y consume el token; null si es inválido o caducó. */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  await ensureTable();
  const tokenHash = hashVerificationToken(token);

  const result = await pool.query(
    'SELECT user_id, expires_at FROM password_reset_tokens WHERE token_hash = $1',
    [tokenHash]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  await pool.query('DELETE FROM password_reset_tokens WHERE token_hash = $1', [tokenHash]);

  if (new Date(row.expires_at) < new Date()) return null;

  return row.user_id as string;
}

export function buildPasswordResetUrl(token: string): string {
  return `${getAppBaseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;
}
