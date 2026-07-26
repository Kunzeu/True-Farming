import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';

export const runtime = 'nodejs';

async function hasLocationImageColumn(): Promise<boolean> {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'farm_items' AND column_name = 'location_image_url'
    ) AS "exists"`
  );
  return Boolean(result.rows[0]?.exists);
}

// GET /api/farms/[id]/summary
// Devuelve un resumen del farm: datos principales + creador
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const includeLocationImage = await hasLocationImageColumn();
    const locationImageSelect = includeLocationImage
      ? 'f.location_image_url as "locationImageUrl",'
      : 'NULL::text as "locationImageUrl",';

    // Cargar farm base con username del creador
    const farmQuery = `
      SELECT f.id, f.name, f.description, f.estimated_time as "estimatedTime",
             f.estimated_gold as "estimatedGold", f.estimated_spirit as "estimatedSpirit",
             f.estimated_rewards as "estimatedRewards", f.expansion, f.is_solo as "isSolo",
             f.requires_squad as "requiresSquad", f.waypoint,
             ${locationImageSelect}
             f.selected, f."order", f.status,
             f.created_by as "createdBy", f.created_at as "createdAt", f.updated_at as "updatedAt",
             u.username as "createdByUsername"
      FROM farm_items f
      LEFT JOIN users u ON f.created_by = u.id
      WHERE f.id = $1
      LIMIT 1
    `;

    const result = await pool.query(farmQuery, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const farm = {
      ...row,
      expansion: typeof row.expansion === 'string' ? JSON.parse(row.expansion) : row.expansion,
      estimatedRewards: typeof row.estimatedRewards === 'string' ? JSON.parse(row.estimatedRewards) : row.estimatedRewards || {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };

    // Punto de extensión: incluir descripciones/waypoints/tags si existen tablas relacionadas en el futuro
    return NextResponse.json({ farm });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to build farm summary',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}


