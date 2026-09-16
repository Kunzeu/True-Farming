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
    const discordUser = (await discordRes.json()) as { id?: string; email?: string; username?: string };
    if (!discordUser.id) {
      return NextResponse.json({ error: 'Discord user missing id' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT id, email, username, role, is_active as "isActive"
       FROM users WHERE discord_id = $1`,
      [discordUser.id]
    );
    let user = result.rows[0] as
      | { id: string; email: string; username: string; role: JWTPayload['role']; isActive: boolean }
      | undefined;

    if (!user && discordUser.email) {
      const emailResult = await pool.query(
        `SELECT id, email, username, role, is_active as "isActive"
         FROM users WHERE email = $1`,
        [discordUser.email]
      );
      if (emailResult.rows.length > 0) {
        user = emailResult.rows[0] as { id: string; email: string; username: string; role: JWTPayload['role']; isActive: boolean };
        await pool.query(
          `UPDATE users SET discord_id = $1, updated_at = NOW() WHERE id = $2`,
          [discordUser.id, user.id]
        );
      }
    }

    if (!user) {
      const newId = crypto.randomUUID();
      const emailToUse = discordUser.email || `${discordUser.id}@discord.user`;
      let usernameToUse = discordUser.username || `user_${discordUser.id.substring(0, 8)}`;

      // Verificar si el username ya está ocupado por otro usuario
      const usernameCheck = await pool.query(
        `SELECT id FROM users WHERE username = $1`,
        [usernameToUse]
      );
      if (usernameCheck.rows.length > 0) {
        usernameToUse = `${usernameToUse}_${discordUser.id.substring(0, 4)}`;
      }

      const insertResult = await pool.query(
        `INSERT INTO users (id, email, username, role, is_active, discord_id, email_verified, email_verified_at)
         VALUES ($1, $2, $3, 'user', true, $4, true, NOW())
         RETURNING id, email, username, role, is_active as "isActive"`,
        [newId, emailToUse, usernameToUse, discordUser.id]
      );
      user = insertResult.rows[0] as { id: string; email: string; username: string; role: JWTPayload['role']; isActive: boolean };
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    const role = resolveEffectiveRole(user.role, user.email, user.username);
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: role,
      isActive: user.isActive,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: role,
        isActive: user.isActive,
        discordId: discordUser.id,
      },
    });
  } catch (error) {
    console.error('Discord session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
