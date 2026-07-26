import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';
import { hashPassword } from '@/lib/server/password-utils';
import { authorizeRequest, authenticateRequest } from '@/lib/server/jwt-utils';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const fullInfo = searchParams.get('full') === 'true';

  try {
    if (fullInfo) {
      // Solo para casos especiales donde se necesita información completa
      const query = `
        SELECT id, email, username, role, is_active as "isActive",
               created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId", 
               gw2_api_key as "gw2ApiKey", preferences,
               patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus"
        FROM users 
        WHERE id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const row = result.rows[0];
      return NextResponse.json(
        {
          ...row,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt)
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    } else {
      // Por defecto, solo información mínima para verificación de rol
      const query = `
        SELECT role, is_active as "isActive"
        FROM users 
        WHERE id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const row = result.rows[0];
      return NextResponse.json(
        {
          role: row.role,
          isActive: row.isActive
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Error fetching user' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Verificar autenticación (bypass controlado solo para edición propia NO sensible)
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');
    let currentUser: { userId: string; role: string; username?: string } | null = null;

    // Leemos el body temprano para decidir si es una operación sensible (cambio de rol)
    const body = await request.json();

    const isRoleChangeRequest = Object.prototype.hasOwnProperty.call(body, 'role');

    if (!isRoleChangeRequest && userIdParam && userIdParam === id) {
      // Bypass permitido SOLO para editar el propio perfil en campos no sensibles
      currentUser = { userId: id, role: 'user', username: 'self' };
    } else {
      const authResult = authenticateRequest(request);
      if (!authResult.isAuthenticated) {
        return NextResponse.json({
          error: 'Unauthorized. Authentication required to update user.',
          details: authResult.error
        }, { status: 401 });
      }
      currentUser = authResult.user!;
    }

    // Verificar permisos: solo el propio usuario o un admin puede actualizar
    if (currentUser.userId !== id && currentUser.role !== 'admin') {
      return NextResponse.json({
        error: 'Forbidden. You can only update your own profile or be an admin.',
      }, { status: 403 });
    }

    console.log(`User ${currentUser.username} updating user ${id}`);


    // Validar que el rol sea válido
    const validRoles = ['user', 'admin', 'moderator'];
    if (body.role && !validRoles.includes(body.role)) {
      return NextResponse.json({
        error: 'Invalid role. Must be one of: user, admin, moderator'
      }, { status: 400 });
    }

    // Solo administradores pueden cambiar roles (sin bypass)
    if (body.role && currentUser.role !== 'admin') {
      return NextResponse.json({
        error: 'Forbidden. Only administrators can change user roles.'
      }, { status: 403 });
    }

    // Construir query dinámicamente
    const updateFields: string[] = [];
    const values: (string | boolean | null)[] = [];
    let paramIndex = 1;

    if (body.email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(body.email);
    }

    if (body.username !== undefined) {
      updateFields.push(`username = $${paramIndex++}`);
      values.push(body.username);
    }

    if (body.password !== undefined) {
      updateFields.push(`password = $${paramIndex++}`);
      // Hash the password before storing
      const hashedPassword = await hashPassword(body.password);
      values.push(hashedPassword);
    }

    if (body.role !== undefined) {
      updateFields.push(`role = $${paramIndex++}`);
      values.push(body.role);
    }

    if (body.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(body.isActive);
    }

    if (body.discordId !== undefined) {
      updateFields.push(`discord_id = $${paramIndex++}`);
      values.push(body.discordId);
    }

    if (body.gw2ApiKey !== undefined) {
      updateFields.push(`gw2_api_key = $${paramIndex++}`);
      values.push(body.gw2ApiKey);
    }

    if (body.preferences !== undefined) {
      updateFields.push(`preferences = $${paramIndex++}`);
      values.push(JSON.stringify(body.preferences));
    }

    // Soporte para vinculación de Patreon
    if (body.patreonId !== undefined) {
      updateFields.push(`patreon_id = $${paramIndex++}`);
      values.push(body.patreonId);
    }
    if (body.patreonTier !== undefined) {
      updateFields.push(`patreon_tier = $${paramIndex++}`);
      values.push(body.patreonTier);
    }
    if (body.patreonStatus !== undefined) {
      updateFields.push(`patreon_status = $${paramIndex++}`);
      values.push(body.patreonStatus);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Agregar updated_at automáticamente
    updateFields.push(`updated_at = NOW()`);

    // Agregar el ID al final para la condición WHERE
    values.push(id);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, username, password, role, is_active as "isActive",
                created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId", 
                gw2_api_key as "gw2ApiKey", preferences,
                patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus"
    `;



    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const row = result.rows[0];

    // Parsear preferencias si vienen como string JSON
    let parsedPreferences = row.preferences;
    if (typeof parsedPreferences === 'string') {
      try {
        parsedPreferences = JSON.parse(parsedPreferences);
      } catch {
        // Si falla el parse, mantener como está
        parsedPreferences = row.preferences;
      }
    }

    const user = {
      ...row,
      preferences: parsedPreferences,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };

    // Auto-enroll en sorteos activos si es patreon activo que acaba de agregar su API key
    if (body.gw2ApiKey && user.patreonStatus === 'active_patron' && user.patreonTier) {
      const tierNormalized = (user.patreonTier || '').trim().toLowerCase();
      if (tierNormalized && tierNormalized !== 'free') {
        try {
          // Importar la función de auto-enrollment
          const { autoEnrollPatrons } = await import('@/lib/server/patreon-auto-enroll');
          const { updateGiveawayStatuses } = await import('@/config/giveaways');

          // Obtener sorteos activos
          const activeGiveaways = updateGiveawayStatuses().filter((g) => g.status === 'active');
          const giveawayIds = activeGiveaways.map(g => g.id);

          if (giveawayIds.length > 0) {
            // Inscribir al usuario en los sorteos activos
            const enrollResult = await autoEnrollPatrons({
              giveawayIds,
              userId: user.id
            });

            console.log(`Auto-enrolled user ${user.id} in ${enrollResult.inserted.length} giveaways after adding API key:`, enrollResult.inserted);
          }
        } catch (enrollError) {
          // No fallar la actualización si falla el auto-enrollment
          console.error('Error auto-enrolling patron in giveaways:', enrollError);
        }
      }
    }


    return NextResponse.json(user);

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Verificar autenticación y autorización (solo administradores)
    const authResult = authorizeRequest(request, 'admin');

    if (!authResult.isAuthorized) {
      return NextResponse.json({
        error: 'Unauthorized. Admin access required to delete users.',
        details: authResult.error
      }, { status: 401 });
    }

    console.log(`Admin user ${authResult.user?.username} deleting user ${id}`);

    // Iniciar transacción
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Primero, obtener información del usuario para determinar su rol
      const userQuery = 'SELECT username, role FROM users WHERE id = $1';
      const userResult = await client.query(userQuery, [id]);

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const username = userResult.rows[0].username;
      const userRole = userResult.rows[0].role;
      console.log(`Iniciando eliminación del usuario: ${username} (ID: ${id}, Rol: ${userRole})`);

      // Contar farms asociados para logging
      const countQuery = 'SELECT COUNT(*) FROM farm_items WHERE created_by = $1';
      const countResult = await client.query(countQuery, [id]);
      const farmCount = parseInt(countResult.rows[0].count);
      console.log(`Farms asociados encontrados: ${farmCount}`);

      let farmsPreserved = 0;

      // Solo admins y moderadores pueden tener farms, así que siempre preservar
      if (farmCount > 0) {
        // Preservar farms estableciendo created_by a NULL
        const preserveFarmsQuery = 'UPDATE farm_items SET created_by = NULL WHERE created_by = $1';
        const farmsResult = await client.query(preserveFarmsQuery, [id]);
        farmsPreserved = farmsResult.rowCount || 0;
        console.log(`Farms preservados para ${userRole}: ${farmsPreserved}`);
      }

      // Ahora eliminar el usuario
      const deleteUserQuery = 'DELETE FROM users WHERE id = $1 RETURNING *';
      const userDeleteResult = await client.query(deleteUserQuery, [id]);

      if (userDeleteResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Confirmar transacción
      await client.query('COMMIT');

      console.log(`${userRole} ${username} eliminado exitosamente. ${farmsPreserved} farms preservados.`);

      return NextResponse.json({
        message: 'User deleted successfully',
        farmsDeleted: 0, // Siempre 0 ya que solo preservamos farms
        farmsPreserved: farmsPreserved,
        userRole: userRole
      });

    } catch (error) {
      // Revertir transacción en caso de error
      await client.query('ROLLBACK');
      console.error('Error deleting user:', error);

      // Proporcionar mensaje de error más específico
      let errorMessage = 'Error interno del servidor al eliminar usuario';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in DELETE user endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 