// API Route para farms con PostgreSQL y RLS
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId'); // Para establecer el usuario actual para RLS


  try {
    // Si se proporciona userId, establecerlo para RLS
    if (userId) {
      await pool.query('SELECT set_current_user_id($1)', [userId]);
    }

    const includeLocationImage = await hasLocationImageColumn();
    const locationImageSelect = includeLocationImage
      ? 'f.location_image_url as "locationImageUrl",'
      : 'NULL::text as "locationImageUrl",';

    const query = `
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
      ORDER BY f."order" ASC NULLS LAST, f.created_at DESC
    `;
    
    console.log('Executing query to fetch farms...');
    const result = await pool.query(query);
    console.log('Query result:', result.rows.length, 'farms found');
    
    const farms = result.rows.map(row => ({
      ...row,
      expansion: typeof row.expansion === 'string' ? JSON.parse(row.expansion) : row.expansion,
      estimatedRewards: typeof row.estimatedRewards === 'string' ? JSON.parse(row.estimatedRewards) : row.estimatedRewards || {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));

    console.log('Processed farms:', farms.length);
    return NextResponse.json(farms);
  } catch (error) {
    console.error('Error fetching farms:', error);
    return NextResponse.json({ 
      error: 'Error fetching farms', 
      details: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? error.code : 'UNKNOWN'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Debug: Log the received data
    console.log('Received farm data:', JSON.stringify(body, null, 2));

    // Validar campos requeridos
    if (!body.name || !body.description || !body.estimatedTime) {
    // Limitar longitud de descripción
    if (typeof body.description !== 'string' || body.description.length > 500) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: 'Description must be a string up to 500 characters'
      }, { status: 400 });
    }
      return NextResponse.json({ 
        error: 'Validation error', 
        details: 'Name, description, and estimatedTime are required fields'
      }, { status: 400 });
    }

    // Validar que al menos una recompensa esté presente (nuevo formato o compatibilidad hacia atrás)
    const hasOldFormatRewards = body.estimatedGold || body.estimatedSpirit;
    const hasNewFormatRewards = body.estimatedRewards && Object.values(body.estimatedRewards).some((value: unknown) => typeof value === 'string' && value.trim() !== '');
    
    if (!hasOldFormatRewards && !hasNewFormatRewards) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: 'At least one reward must be specified'
      }, { status: 400 });
    }

    // Validar que createdBy esté presente
    if (!body.createdBy) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: 'createdBy is required'
      }, { status: 400 });
    }

    // Validar que createdByRole esté presente y sea válido
    if (!body.createdByRole) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: 'createdByRole is required'
      }, { status: 400 });
    }

    // Validar que solo moderadores y admins puedan crear farms
    if (body.createdByRole === 'user') {
      return NextResponse.json({ 
        error: 'Permission denied', 
        details: 'Regular users cannot create farms. Only moderators and admins can create farms.'
      }, { status: 403 });
    }

    // Establecer el usuario actual para RLS
    await pool.query('SELECT set_current_user_id($1)', [body.createdBy]);

    const id = crypto.randomUUID();
    
    const includeLocationImage = await hasLocationImageColumn();
    const query = includeLocationImage
      ? `
      INSERT INTO farm_items (id, name, description, estimated_time, estimated_gold, 
                             estimated_spirit, estimated_rewards, expansion, is_solo, 
                             requires_squad, waypoint, location_image_url, selected, "order", status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, name, description, estimated_time as "estimatedTime", 
                estimated_gold as "estimatedGold", estimated_spirit as "estimatedSpirit",
                estimated_rewards as "estimatedRewards", expansion, is_solo as "isSolo",
                requires_squad as "requiresSquad", waypoint, location_image_url as "locationImageUrl",
                selected, "order", status, 
                created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
    `
      : `
      INSERT INTO farm_items (id, name, description, estimated_time, estimated_gold, 
                             estimated_spirit, estimated_rewards, expansion, is_solo, 
                             requires_squad, waypoint, selected, "order", status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, name, description, estimated_time as "estimatedTime", 
                estimated_gold as "estimatedGold", estimated_spirit as "estimatedSpirit",
                estimated_rewards as "estimatedRewards", expansion, is_solo as "isSolo",
                requires_squad as "requiresSquad", waypoint, NULL::text as "locationImageUrl",
                selected, "order", status, 
                created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    // Determinar el status basado en el rol del usuario
    const status = body.createdByRole === 'admin' ? 'approved' : 'pending';
    
    // Mapear nuevos campos a formato legacy para compatibilidad
    const mappedGold = body.estimatedGold || (body.estimatedRewards?.gold) || null;
    const mappedSpirit = body.estimatedSpirit || (body.estimatedRewards?.spiritShards) || null;
    
    const values = [
      id, 
      body.name, 
      body.description, 
      body.estimatedTime, 
      mappedGold,
      mappedSpirit, 
      JSON.stringify(body.estimatedRewards || {}), // Nuevas recompensas como JSON
      JSON.stringify(body.expansion || []), // Expansiones como array
      body.isSolo || false, // Nuevo campo: es solitario
      body.requiresSquad || false, // Nuevo campo: requiere squad
      body.waypoint || null, // Nuevo campo: waypoint
      body.selected || false, 
      body.order || null, // Nuevo campo: orden
      status, 
      body.createdBy
    ];

    if (includeLocationImage) {
      values.splice(
        11,
        0,
        typeof body.locationImageUrl === 'string' && body.locationImageUrl.trim()
          ? body.locationImageUrl.trim().slice(0, 2048)
          : null
      );
    }
    
    const result = await pool.query(query, values);
    const row = result.rows[0];
    
    // Obtener el username del creador
    const userQuery = 'SELECT username FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [row.createdBy]);
    const createdByUsername = userResult.rows[0]?.username || null;
    
    const farm = {
      ...row,
      createdByUsername,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };

    return NextResponse.json(farm);
  } catch (error) {
    console.error('Error creating farm:', error);
    
    // Proporcionar información más detallada del error
    let errorDetails = 'Unknown error';
    let errorCode = 'UNKNOWN';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      if ('code' in error) {
        errorCode = String(error.code);
      }
    } else {
      errorDetails = String(error);
    }
    
    // Log adicional para debugging
    console.error('Error details:', {
      message: errorDetails,
      code: errorCode,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Error creating farm', 
      details: errorDetails,
      code: errorCode
    }, { status: 500 });
  }
} 