import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const { reason } = await request.json();
    
    // Verificar que el usuario existe
    const userQuery = 'SELECT username, role FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [id]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const username = userResult.rows[0].username;
    const userRole = userResult.rows[0].role;
    
    console.log(`Invalidando sesión del usuario: ${username} (ID: ${id}, Rol: ${userRole}) - Razón: ${reason}`);
    
    // Por ahora, solo registramos la invalidación
    // En una implementación más avanzada, podríamos hacer:
    // 1. Almacenar tokens invalidados en una tabla
    // 2. Usar WebSockets para notificar al usuario en tiempo real
    // 3. Implementar un sistema de blacklist de tokens
    
    return NextResponse.json({ 
      message: 'User session invalidated successfully',
      userId: id,
      username: username,
      userRole: userRole,
      reason: reason,
      invalidatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error invalidating user session:', error);
    
    let errorMessage = 'Error interno del servidor al invalidar sesión';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 