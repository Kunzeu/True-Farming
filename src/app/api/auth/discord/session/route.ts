import { NextRequest, NextResponse } from 'next/server';
import { generateToken, type JWTPayload } from '@/lib/server/jwt-utils';
import { resolveEffectiveRole } from '@/lib/server/site-admin';
import { pool } from '@/lib/postgres-db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();
    if (!access_token || typeof access_token !== 'string') {
      return NextResponse.json({ error: 'access_token required' }, { status: 400 });
    }

    const discordRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!discordRes.ok) {
      return NextResponse.json({ error: 'Invalid Discord token' }, { status: 401 });
    }
    const discordUser = (await discordRes.json()) as { id?: string };
    if (!discordUser.id) {
      return NextResponse.json({ error: 'Discord user missing id' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT id, email, username, role, is_active as "isActive"
       FROM users WHERE discord_id = $1`,
      [discordUser.id]
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
    console.error('Discord session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
