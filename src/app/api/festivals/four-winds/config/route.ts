import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';
import { authorizeRequest } from '@/lib/server/jwt-utils';
import {
  DEFAULT_FOUR_WINDS_CONFIG,
  FOUR_WINDS_CONFIG_BACKUP_KEY,
  FOUR_WINDS_CONFIG_SECRET_KEY,
  normalizeFourWindsConfig,
  validateFourWindsConfig,
  type FourWindsConfig,
} from '@/lib/four-winds-config';

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

function parseConfig(raw: string | null | undefined): FourWindsConfig {
  if (!raw) return structuredClone(DEFAULT_FOUR_WINDS_CONFIG);
  try {
    return normalizeFourWindsConfig(JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_FOUR_WINDS_CONFIG);
  }
}

export async function GET() {
  try {
    const current = await readSecret(FOUR_WINDS_CONFIG_SECRET_KEY);
    const backup = await readSecret(FOUR_WINDS_CONFIG_BACKUP_KEY);
    return NextResponse.json(
      {
        config: parseConfig(current?.value),
        updatedAt: current?.updatedAt ?? null,
        source: current ? 'db' : 'defaults',
        hasBackup: !!backup,
        backupUpdatedAt: backup?.updatedAt ?? null,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('four-winds config GET', error);
    return NextResponse.json(
      {
        config: structuredClone(DEFAULT_FOUR_WINDS_CONFIG),
        updatedAt: null,
        source: 'defaults',
        hasBackup: false,
        backupUpdatedAt: null,
        error: 'db_unavailable',
      },
      { status: 200 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = authorizeRequest(request, 'moderator');
  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized. Moderator or admin required.', details: auth.error },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Restaurar backup (swap: current ↔ backup)
    if (body?.restoreBackup === true) {
      const backup = await readSecret(FOUR_WINDS_CONFIG_BACKUP_KEY);
      if (!backup) {
        return NextResponse.json({ error: 'No backup' }, { status: 404 });
      }
      const current = await readSecret(FOUR_WINDS_CONFIG_SECRET_KEY);
      if (current) {
        await writeSecret(FOUR_WINDS_CONFIG_BACKUP_KEY, current.value);
      }
      await writeSecret(FOUR_WINDS_CONFIG_SECRET_KEY, backup.value);
      const config = parseConfig(backup.value);
      console.log(
        `four-winds config restored from backup by ${auth.user?.username} (${auth.user?.email})`
      );
      return NextResponse.json({
        ok: true,
        config,
        restored: true,
        hasBackup: true,
      });
    }

    const config = normalizeFourWindsConfig(body?.config ?? body);
    const invalid = validateFourWindsConfig(config);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }

    // Backup del valor actual antes de sobrescribir
    const current = await readSecret(FOUR_WINDS_CONFIG_SECRET_KEY);
    if (current?.value) {
      await writeSecret(FOUR_WINDS_CONFIG_BACKUP_KEY, current.value);
    }

    await writeSecret(FOUR_WINDS_CONFIG_SECRET_KEY, JSON.stringify(config));

    console.log(
      `four-winds config updated by ${auth.user?.username} (${auth.user?.email})`
    );

    return NextResponse.json({
      ok: true,
      config,
      hasBackup: !!current?.value,
      backedUp: !!current?.value,
    });
  } catch (error) {
    console.error('four-winds config PUT', error);
    return NextResponse.json(
      { error: 'Error saving config', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
