import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';
import { hashPassword } from '@/lib/server/password-utils';
import { consumePasswordResetToken } from '@/lib/server/password-reset';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : password;

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 });
    }

    if (password.length < 6 || password.length > 50) {
      return NextResponse.json(
        { error: 'La contraseña debe tener entre 6 y 50 caracteres' },
        { status: 400 }
      );
    }

    const userId = await consumePasswordResetToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: 'El enlace es inválido o ha caducado', code: 'INVALID_TOKEN' },
        { status: 400 }
      );
    }

    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [await hashPassword(password), userId]
    );

    return NextResponse.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
