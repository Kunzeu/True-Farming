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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    const includeLocationImage = await hasLocationImageColumn();
    

    
    // Construir la query dinámicamente solo con los campos que se envían
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    
    if (body.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(body.name);
      paramIndex++;
    }
    
    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.length > 500) {
        return NextResponse.json({ 
          error: 'Validation error', 
          details: 'Description must be a string up to 500 characters'
        }, { status: 400 });
      }
      updateFields.push(`description = $${paramIndex}`);
      values.push(body.description);
      paramIndex++;
    }
    
    if (body.estimatedTime !== undefined) {
      updateFields.push(`estimated_time = $${paramIndex}`);
      values.push(body.estimatedTime);
      paramIndex++;
    }
    
    if (body.estimatedGold !== undefined) {
      updateFields.push(`estimated_gold = $${paramIndex}`);
      values.push(body.estimatedGold);
      paramIndex++;
    }
    
    if (body.estimatedSpirit !== undefined) {
      updateFields.push(`estimated_spirit = $${paramIndex}`);
      values.push(body.estimatedSpirit);
      paramIndex++;
    }
    
    if (body.estimatedRewards !== undefined) {
      updateFields.push(`estimated_rewards = $${paramIndex}`);
      values.push(JSON.stringify(body.estimatedRewards));
      paramIndex++;
    }
    
    if (body.isSolo !== undefined) {
      updateFields.push(`is_solo = $${paramIndex}`);
      values.push(body.isSolo);
      paramIndex++;
    }
    
    if (body.requiresSquad !== undefined) {
      updateFields.push(`requires_squad = $${paramIndex}`);
      values.push(body.requiresSquad);
      paramIndex++;
    }
    
    if (body.waypoint !== undefined) {
      updateFields.push(`waypoint = $${paramIndex}`);
      values.push(body.waypoint);
      paramIndex++;
    }

    if (includeLocationImage && body.locationImageUrl !== undefined) {
      const raw = body.locationImageUrl;
      if (raw !== null && typeof raw !== 'string') {
        return NextResponse.json(
          { error: 'Validation error', details: 'locationImageUrl must be a string or null' },
          { status: 400 }
        );
      }
      const trimmed =
        raw === null || raw === '' ? null : String(raw).trim().slice(0, 2048);
      updateFields.push(`location_image_url = $${paramIndex}`);
      values.push(trimmed);
      paramIndex++;
    }
    
    if (body.expansion !== undefined) {
      updateFields.push(`expansion = $${paramIndex}`);
      values.push(JSON.stringify(body.expansion));
      paramIndex++;
    }
    
    if (body.selected !== undefined) {
      updateFields.push(`selected = $${paramIndex}`);
      values.push(body.selected);
      paramIndex++;
    }
    
    if (body.order !== undefined) {
      updateFields.push(`"order" = $${paramIndex}`);
      values.push(body.order);
      paramIndex++;
    }
    
    if (body.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      values.push(body.status);
      paramIndex++;
    }
    

    
    // Campos de edición por moderadores (comentados hasta que se ejecute la migración)
    // if (body.lastEditedBy !== undefined) {
    //   updateFields.push(`last_edited_by = $${paramIndex}`);
    //   values.push(body.lastEditedBy);
    //   paramIndex++;
    // }
    
    // if (body.lastEditedAt !== undefined) {
    //   updateFields.push(`last_edited_at = $${paramIndex}`);
    //   values.push(body.lastEditedAt);
    //   paramIndex++;
    // }
    
    // Agregar updated_at automáticamente
    updateFields.push(`updated_at = NOW()`);
    
    // Agregar el ID al final
    values.push(id);
    
    const locationImageReturning = includeLocationImage
      ? 'location_image_url as "locationImageUrl",'
      : 'NULL::text as "locationImageUrl",';

    const query = `
      UPDATE farm_items 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, description, estimated_time as "estimatedTime", 
                estimated_gold as "estimatedGold", estimated_spirit as "estimatedSpirit",
                estimated_rewards as "estimatedRewards", expansion, is_solo as "isSolo",
                requires_squad as "requiresSquad", waypoint, ${locationImageReturning}
                selected, "order", status, 
                created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Farm no encontrado' }, { status: 404 });
    }
    
    const row = result.rows[0];
    
    // Obtener el username del creador
    const userQuery = 'SELECT username FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [row.createdBy]);
    const createdByUsername = userResult.rows[0]?.username || null;
    
    const farm = {
      ...row,
      createdByUsername,
      expansion: typeof row.expansion === 'string' ? JSON.parse(row.expansion) : row.expansion,
      estimatedRewards: typeof row.estimatedRewards === 'string' ? JSON.parse(row.estimatedRewards) : row.estimatedRewards || {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };


    return NextResponse.json(farm);
  } catch (error) {
    console.error('Error updating farm:', error);
    return NextResponse.json({ 
      error: 'Error updating farm', 
      details: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? error.code : 'UNKNOWN'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    

    
    const query = 'DELETE FROM farm_items WHERE id = $1 RETURNING id';

    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Farm no encontrado' }, { status: 404 });
    }


    return NextResponse.json({ message: 'Farm eliminado exitosamente' });
  } catch (error) {
    console.error('❌ Error deleting farm:', error);
    return NextResponse.json({ 
      error: 'Error deleting farm', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 