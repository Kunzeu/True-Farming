import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/server/jwt-utils';
import { resolveEffectiveRole } from '@/lib/server/site-admin';
import { pool } from '@/lib/postgres-db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();
    if (!access_token || typeof access_token !== 'string') {
      return NextResponse.json({ error: 'access_token required' }, { status: 400 });
    }

    const identityResponse = await fetch(
      'https://www.patreon.com/api/oauth2/v2/identity?' +
        new URLSearchParams({
          'fields[user]': 'email',
        }),
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    if (!identityResponse.ok) {
      return NextResponse.json({ error: 'Invalid Patreon token' }, { status: 401 });
    }

    const identityData = (await identityResponse.json()) as { data?: { id?: string } };
    const patreonUserId = identityData?.data?.id;
    if (!patreonUserId) {
      return NextResponse.json({ error: 'Patreon user missing id' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT id, email, username, role, is_active as "isActive"
       FROM users WHERE patreon_id = $1`,
      [String(patreonUserId)],
    );
    const user = result.rows[0] as
      | { id: string; email: string; username: string; role: JWTPayload['role']; isActive: boolean }
      | undefined;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: resolveEffectiveRole(user.role, user.email, user.username),
      isActive: user.isActive,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Patreon session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
