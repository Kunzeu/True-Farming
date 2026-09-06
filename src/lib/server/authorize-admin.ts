import { pool } from '@/lib/postgres-db';
import {
  authenticateRequest,
  hasRequiredRole,
  type JWTPayload,
} from '@/lib/server/jwt-utils';
import { resolveEffectiveRole } from '@/lib/server/site-admin';

export async function authorizeAdminRequest(request: Request): Promise<{
  isAuthorized: boolean;
  user: JWTPayload | null;
  error?: string;
}> {
  const authResult = authenticateRequest(request);

  if (!authResult.isAuthenticated || !authResult.user) {
    return {
      isAuthorized: false,
      user: null,
      error: authResult.error,
    };
  }

  const jwtUser = authResult.user;

  try {
    const result = await pool.query(
      `SELECT email, username, role, is_active as "isActive"
       FROM users WHERE id = $1`,
      [jwtUser.userId],
    );
    const dbUser = result.rows[0] as
      | { email: string; username: string; role: string; isActive: boolean }
      | undefined;

    if (!dbUser) {
      return {
        isAuthorized: false,
        user: jwtUser,
        error: 'User not found',
      };
    }

    if (!dbUser.isActive) {
      return {
        isAuthorized: false,
        user: jwtUser,
        error: 'Account is deactivated',
      };
    }

    const effectiveRole = resolveEffectiveRole(dbUser.role, dbUser.email, dbUser.username);
    const user: JWTPayload = {
      ...jwtUser,
      email: dbUser.email,
      username: dbUser.username,
      role: effectiveRole,
      isActive: dbUser.isActive,
    };

    if (!hasRequiredRole(effectiveRole, 'admin')) {
      return {
        isAuthorized: false,
        user,
        error: `Insufficient permissions. Required: admin, Current: ${effectiveRole}`,
      };
    }

    return {
      isAuthorized: true,
      user,
    };
  } catch (error) {
    console.error('authorizeAdminRequest DB lookup failed:', error);
    if (hasRequiredRole(jwtUser.role, 'admin')) {
      return { isAuthorized: true, user: jwtUser };
    }
    return {
      isAuthorized: false,
      user: jwtUser,
      error: 'Unable to verify admin permissions',
    };
  }
}
