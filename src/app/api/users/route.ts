// API Route para users con PostgreSQL y RLS
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';
import { hashPassword } from '@/lib/server/password-utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const username = searchParams.get('username');
  const discordId = searchParams.get('discordId');
  const userId = searchParams.get('userId'); // Para obtener perfil específico

  try {
    // Si no es una búsqueda específica por email/username/discordId/userId, requiere autenticación admin
    if (!email && !username && !discordId && !userId) {
      // Importar la función de autorización
      const { authorizeRequest } = await import('@/lib/server/jwt-utils');
      const authResult = authorizeRequest(request, 'admin');

      if (!authResult.isAuthorized) {
        return NextResponse.json({
          error: 'Unauthorized. Admin access required to list all users.',
          details: authResult.error
        }, { status: 401 });
      }
    }
    if (email) {
      // Buscar por email (para login)
      const query = `
        SELECT id, email, username, password, role, is_active as "isActive",
               created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId",
               patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus"
        FROM users 
        WHERE email = $1
      `;

      const result = await pool.query(query, [email]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const row = result.rows[0];
      return NextResponse.json({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      });

    } else if (username) {
      // Buscar por username
      const query = `
        SELECT id, email, username, role, is_active as "isActive",
               created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId",
               patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus"
        FROM users 
        WHERE username = $1
      `;

      const result = await pool.query(query, [username]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const row = result.rows[0];
      return NextResponse.json({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      });

    } else if (discordId) {
      // Buscar por Discord ID
      const query = `
        SELECT id, email, username, role, is_active as "isActive",
               created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId",
               patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus"
        FROM users 
        WHERE discord_id = $1
      `;

      const result = await pool.query(query, [discordId]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const row = result.rows[0];
      return NextResponse.json({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      });

    } else if (userId) {
      // Obtener perfil específico (usando RLS)
      await pool.query('SELECT set_current_user_id($1)', [userId]);

      const query = `
        SELECT id, email, username, role, is_active as "isActive",
               created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId",
               gw2_api_key as "gw2ApiKey",
               patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus"
        FROM users 
        WHERE id = $1
      `;

      const result = await pool.query(query, [userId]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const row = result.rows[0];
      return NextResponse.json({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      });

    } else {
      // Obtener todos los usuarios (solo para admins)
      // Nota: Esto requeriría verificar que el usuario actual es admin
      const query = `
        SELECT id, email, username, role, is_active as "isActive",
               created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId",
               gw2_api_key as "gw2ApiKey"
        FROM users 
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query);
      const users = result.rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));

      return NextResponse.json(users);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      error: 'Error fetching users',
      details: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? error.code : 'UNKNOWN'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos requeridos
    if (!body.email || !body.username) {
      return NextResponse.json({
        error: 'Email y username son requeridos'
      }, { status: 400 });
    }

    // Para usuarios regulares (no OAuth), validar contraseña
    if (!body.discordId && !body.patreonId && !body.password) {
      return NextResponse.json({
        error: 'Contraseña es requerida para usuarios regulares'
      }, { status: 400 });
    }

    // Validar que email, username, discordId y patreonId sean únicos
    const checkQuery = `
      SELECT email, username, discord_id, patreon_id FROM users 
      WHERE email = $1 OR username = $2 OR (discord_id = $3 AND $3 IS NOT NULL) OR (patreon_id = $4 AND $4 IS NOT NULL)
    `;

    const checkResult = await pool.query(checkQuery, [body.email, body.username, body.discordId, body.patreonId]);

    if (checkResult.rows.length > 0) {
      const existingUser = checkResult.rows[0];
      let errorMessage = '';
      let field = '';

      if (existingUser.email === body.email) {
        errorMessage = 'El email ya está registrado';
        field = 'email';
      } else if (existingUser.username === body.username) {
        errorMessage = 'El username ya está en uso';
        field = 'username';
      } else if (existingUser.discord_id === body.discordId) {
        errorMessage = 'Esta cuenta de Discord ya está vinculada';
        field = 'discordId';
      } else if (existingUser.patreon_id === body.patreonId) {
        errorMessage = 'Esta cuenta de Patreon ya está vinculada';
        field = 'patreonId';
      }

      return NextResponse.json({
        error: errorMessage,
        field: field
      }, { status: 409 }); // 409 Conflict
    }

    const id = crypto.randomUUID();

    // Hash the password before storing (only if password is provided)
    let hashedPassword = null;
    if (body.password) {
      hashedPassword = await hashPassword(body.password);
    }

    const emailVerified = true;
    const emailVerifiedAt = new Date();

    const query = `
      INSERT INTO users (id, email, username, password, role, is_active, discord_id, gw2_api_key, patreon_id, patreon_tier, patreon_status, email_verified, email_verified_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, email, username, password, role, is_active as "isActive",
                email_verified as "emailVerified",
                created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId",
                gw2_api_key as "gw2ApiKey", patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus"
    `;

    const values = [
      id,
      body.email,
      body.username,
      hashedPassword,
      body.role || 'user',
      body.isActive !== undefined ? body.isActive : true,
      body.discordId || null,
      body.gw2ApiKey || null,
      body.patreonId || null,
      body.patreonTier || null,
      body.patreonStatus || null,
      emailVerified,
      emailVerifiedAt,
    ];

    console.log('Creating user with values:', {
      id: id.substring(0, 8) + '...',
      email: body.email,
      username: body.username,
      hasPassword: !!hashedPassword,
      role: body.role || 'user',
      isActive: body.isActive !== undefined ? body.isActive : true,
      discordId: body.discordId || null,
      patreonId: body.patreonId || null,
      patreonTier: body.patreonTier || null,
      patreonStatus: body.patreonStatus || null
    });

    const result = await pool.query(query, values);
    const row = result.rows[0];

    console.log('User created, row returned from database:', {
      id: row.id,
      email: row.email,
      username: row.username,
      patreonId: row.patreonId,
      patreonTier: row.patreonTier,
      patreonStatus: row.patreonStatus
    });

    const user = {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };

    console.log('User object to return:', {
      id: user.id,
      email: user.email,
      username: user.username,
      patreonId: user.patreonId,
      patreonTier: user.patreonTier,
      patreonStatus: user.patreonStatus
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
  }
} 