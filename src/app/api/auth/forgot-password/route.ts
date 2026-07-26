import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgres-db';
import { canRequestPasswordReset, createPasswordResetToken } from '@/lib/server/password-reset';
import { sendPasswordResetEmail } from '@/lib/server/email';
import { EMAIL_SEND_FAILED, parseEmailLocale } from '@/lib/server/email-i18n';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // Respuesta genérica para no revelar si el email existe
    const genericSuccess = {
      message: 'Si el correo existe, te enviamos instrucciones para restablecer la contraseña.',
    };

    const userResult = await pool.query(
      `SELECT id, email, username, is_active as "isActive"
       FROM users
       WHERE LOWER(email) = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(genericSuccess);
    }

    const user = userResult.rows[0];
    if (user.isActive === false) {
      return NextResponse.json(genericSuccess);
    }

    if (!(await canRequestPasswordReset(user.id))) {
      return NextResponse.json(
        { error: 'Espera unos minutos antes de solicitar otro email', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const locale = parseEmailLocale(request, body.locale);
    const token = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail(user.email, user.username, token, locale);

    return NextResponse.json(genericSuccess);
  } catch (error) {
    console.error('Forgot password error:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    if (message.includes('RESEND_API_KEY')) {
      return NextResponse.json(
        { error: 'El servicio de email no está configurado' },
        { status: 503 }
      );
    }
    const errorCode = error instanceof Error
      ? (error as Error & { code?: string }).code
      : undefined;

    return NextResponse.json({
      error: errorCode === EMAIL_SEND_FAILED ? message : 'Error interno del servidor',
    }, { status: 500 });
  }
}
