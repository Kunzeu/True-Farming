import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';
import { authorizeRequest, hasRequiredRole, type JWTPayload } from '@/lib/server/jwt-utils';
import {
  DEFAULT_HALLOWEEN_CONFIG,
  HALLOWEEN_CONFIG_BACKUP_KEY,
  HALLOWEEN_CONFIG_SECRET_KEY,
  normalizeHalloweenConfig,
  validateHalloweenConfig,
  type HalloweenConfig,
} from '@/lib/halloween-config';

export const runtime = 'nodejs';

async function ensureSecretsTable() {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS secrets (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz NOT NULL DEFAULT NOW())'
  );
}

async function readSecret(key: string): Promise<{ value: string; updatedAt: string } | null> {
  await ensureSecretsTable();
  const r = await pool.query('SELECT value, updated_at FROM secrets WHERE key=$1', [key]);
  if (!r.rows[0]) return null;
  return {
    value: r.rows[0].value as string,
    updatedAt: new Date(r.rows[0].updated_at).toISOString(),
  };
}

async function writeSecret(key: string, value: string) {
  await ensureSecretsTable();
  await pool.query(
    `INSERT INTO secrets(key, value, updated_at)
     VALUES($1, $2, NOW())
     ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`,
    [key, value]
  );
}

function parseConfig(raw: string | null | undefined): HalloweenConfig {
  if (!raw) return structuredClone(DEFAULT_HALLOWEEN_CONFIG);
  try {
    return normalizeHalloweenConfig(JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_HALLOWEEN_CONFIG);
  }
}

export async function GET() {
  try {
    const current = await readSecret(HALLOWEEN_CONFIG_SECRET_KEY);
    const backup = await readSecret(HALLOWEEN_CONFIG_BACKUP_KEY);
    return NextResponse.json(
      {
        config: parseConfig(current?.value),
        updatedAt: current?.updatedAt ?? null,
        source: current ? 'db' : 'defaults',
        hasBackup: !!backup,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('halloween config GET', error);
    return NextResponse.json({
      config: structuredClone(DEFAULT_HALLOWEEN_CONFIG),
      source: 'defaults',
      hasBackup: false,
      error: 'db_unavailable',
    });
  }
}

async function authorizeModeratorWrite(
  request: NextRequest,
  userId?: string
): Promise<{ isAuthorized: boolean; user: JWTPayload | null; error?: string }> {
  const jwt = authorizeRequest(request, 'moderator');
  if (jwt.isAuthorized) return jwt;
  if (!userId) return jwt;

  const r = await pool.query(
    `SELECT id, email, username, role, is_active as "isActive" FROM users WHERE id = $1`,
    [userId]
  );
  const u = r.rows[0] as
    | { id: string; email: string; username: string; role: string; isActive: boolean }
    | undefined;
  if (!u?.isActive || !hasRequiredRole(u.role, 'moderator')) return jwt;

  return {
    isAuthorized: true,
    user: {
      userId: u.id,
      email: u.email,
      username: u.username,
      role: u.role as JWTPayload['role'],
      isActive: u.isActive,
    },
  };
}

export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const auth = await authorizeModeratorWrite(
    request,
    typeof body.userId === 'string' ? body.userId : undefined
  );
  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized. Moderator or admin required.', details: auth.error },
      { status: 401 }
    );
  }

  try {
    if (body?.restoreBackup === true) {
      const backup = await readSecret(HALLOWEEN_CONFIG_BACKUP_KEY);
      if (!backup) return NextResponse.json({ error: 'No backup' }, { status: 404 });
      const current = await readSecret(HALLOWEEN_CONFIG_SECRET_KEY);
      if (current) await writeSecret(HALLOWEEN_CONFIG_BACKUP_KEY, current.value);
      await writeSecret(HALLOWEEN_CONFIG_SECRET_KEY, backup.value);
      return NextResponse.json({
        ok: true,
        config: parseConfig(backup.value),
        restored: true,
        hasBackup: true,
      });
    }

    const config = normalizeHalloweenConfig(body?.config ?? body);
    const invalid = validateHalloweenConfig(config);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    const current = await readSecret(HALLOWEEN_CONFIG_SECRET_KEY);
    if (current?.value) await writeSecret(HALLOWEEN_CONFIG_BACKUP_KEY, current.value);
    await writeSecret(HALLOWEEN_CONFIG_SECRET_KEY, JSON.stringify(config));

    return NextResponse.json({ ok: true, config, hasBackup: !!current?.value });
  } catch (error) {
    console.error('halloween config PUT', error);
    return NextResponse.json(
      { error: 'Error saving config', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
