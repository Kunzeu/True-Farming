import type { JWTPayload } from './jwt-utils';
import { authenticateRequest, authorizeRequest } from './jwt-utils';
import { json } from '@/lib/http';

type Handler<T extends unknown[]> = (
  request: Request,
  user: JWTPayload,
  ...args: T
) => Promise<Response>;

export function withAuth<T extends unknown[]>(handler: Handler<T>) {
  return async (request: Request, ...args: T): Promise<Response> => {
    const authResult = authenticateRequest(request);
    if (!authResult.isAuthenticated) {
      return json({ error: 'Authentication required', details: authResult.error }, 401);
    }
    return handler(request, authResult.user!, ...args);
  };
}

export function withRole<T extends unknown[]>(
  requiredRole: 'admin' | 'moderator' | 'user',
  handler: Handler<T>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    const authResult = authorizeRequest(request, requiredRole);
    if (!authResult.isAuthorized) {
      return json(
        {
          error: 'Insufficient permissions',
          details: authResult.error,
          required: requiredRole,
          current: authResult.user?.role || 'none',
        },
        403
      );
    }
    return handler(request, authResult.user!, ...args);
  };
}

export function withAdmin<T extends unknown[]>(handler: Handler<T>) {
  return withRole('admin', handler);
}

export function withModerator<T extends unknown[]>(handler: Handler<T>) {
  return withRole('moderator', handler);
}

export function withSelfOrAdmin<T extends unknown[]>(
  getUserIdFromRequest: (request: Request, ...args: T) => string,
  handler: Handler<T>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    const authResult = authenticateRequest(request);
    if (!authResult.isAuthenticated) {
      return json({ error: 'Authentication required', details: authResult.error }, 401);
    }
    const targetUserId = getUserIdFromRequest(request, ...args);
    const currentUser = authResult.user!;
    if (currentUser.userId !== targetUserId && currentUser.role !== 'admin') {
      return json(
        {
          error: 'Access denied. You can only access your own data or be an admin.',
          targetUser: targetUserId,
          currentUser: currentUser.userId,
          currentRole: currentUser.role,
        },
        403
      );
    }
    return handler(request, currentUser, ...args);
  };
}

export function extractUserIdFromParams(
  _request: Request,
  _context: { params: Promise<{ id: string }> }
): string {
  return 'placeholder';
}

export function withSecurityLogging<T extends unknown[]>(
  handler: (request: Request, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`[SECURITY] ${method} ${url} - IP: ${ip} - UserAgent: ${userAgent.substring(0, 100)}`);
    try {
      const response = await handler(request, ...args);
      console.log(
        `[SECURITY] ${method} ${url} - Status: ${response.status} - Duration: ${Date.now() - startTime}ms`
      );
      return response;
    } catch (error) {
      console.error(
        `[SECURITY] ${method} ${url} - ERROR: ${error} - Duration: ${Date.now() - startTime}ms`
      );
      throw error;
    }
  };
}

export function withSecureAdmin<T extends unknown[]>(handler: Handler<T>) {
  return withSecurityLogging(withAdmin(handler));
}

export function withSecureAuth<T extends unknown[]>(handler: Handler<T>) {
  return withSecurityLogging(withAuth(handler));
}
