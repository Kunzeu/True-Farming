import { NextRequest, NextResponse } from 'next/server';
import { comparePassword } from '@/lib/server/password-utils';
import { generateToken } from '@/lib/server/jwt-utils';
import { pool } from '@/lib/postgres-db';
import { resolveEffectiveRole } from '@/lib/server/site-admin';
import { syncPatreonMembershipForUser } from '@/lib/server/patreon-sync';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    // Get user from database
    const query = `
      SELECT id, email, username, password, role, is_active as "isActive",
             email_verified as "emailVerified",
             created_at as "createdAt", updated_at as "updatedAt", discord_id as "discordId",
             patreon_id as "patreonId", patreon_tier as "patreonTier", patreon_status as "patreonStatus"
      FROM users 
      WHERE email = $1
    `;
    
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }

    const user = result.rows[0];

    if (!user.isActive) {
      return NextResponse.json({ 
        error: 'Account is deactivated' 
      }, { status: 401 });
    }

    if (user.emailVerified === false) {
      return NextResponse.json({
        error: 'Confirma tu email antes de iniciar sesión',
        code: 'EMAIL_NOT_VERIFIED',
      }, { status: 403 });
    }

    // Compare password - handle both plain text and hashed passwords
    let isPasswordValid = false;
    
    // Check if password is hashed (starts with $2a$ or $2b$)
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // Password is hashed, use bcrypt comparison
      isPasswordValid = await comparePassword(password, user.password);
    } else {
      // Password is plain text (legacy), compare directly
      isPasswordValid = password === user.password;
      
      // If login is successful with plain text password, hash it for future use
      if (isPasswordValid) {
        const { hashPassword } = await import('@/lib/server/password-utils');
        const hashedPassword = await hashPassword(password);
        
        // Update the password in database to hashed version
        try {
          await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, user.id]
          );
          console.log(`Updated password for user ${user.email} to hashed version`);
        } catch (updateError) {
          console.error('Error updating password to hashed version:', updateError);
          // Don't fail the login, just log the error
        }
      }
    }
    
    if (!isPasswordValid) {
      return NextResponse.json({ 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }

    // Re-sincronizar Patreon con la API del creador (evita roles/status obsoletos)
    if (user.patreonId) {
      try {
        const synced = await syncPatreonMembershipForUser({
          patreonId: user.patreonId,
          userId: user.id,
          email: user.email,
        });
        user.patreonStatus = synced.patreonStatus;
        user.patreonTier = synced.patreonTier;
        user.role = synced.role;
      } catch (syncError) {
        console.error('Patreon sync on login failed:', syncError);
      }
    }

    const effectiveRole = resolveEffectiveRole(user.role, user.email, user.username);
    user.role = effectiveRole;

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: effectiveRole,
      isActive: user.isActive
    });

    // Return user data (without password) and JWT token
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword,
      token: token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
