import jwt from 'jsonwebtoken';

// Clave secreta para JWT - en producción debe estar en variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '3d';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: 'admin' | 'moderator' | 'user';
  isActive: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Genera un token JWT para un usuario
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'true-farming.com',
    audience: 'true-farming-users'
  } as jwt.SignOptions);
}

/**
 * Verifica y decodifica un token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'true-farming.com',
      audience: 'true-farming-users'
    } as jwt.VerifyOptions) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Extrae el token del header Authorization
 */
export function extractTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  // Formato esperado: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Middleware de autenticación para rutas de API
 */
export function authenticateRequest(request: Request): {
  isAuthenticated: boolean;
  user: JWTPayload | null;
  error?: string;
} {
  const token = extractTokenFromRequest(request);
  
  if (!token) {
    return {
      isAuthenticated: false,
      user: null,
      error: 'No token provided'
    };
  }

  const user = verifyToken(token);
  
  if (!user) {
    return {
      isAuthenticated: false,
      user: null,
      error: 'Invalid or expired token'
    };
  }

  if (!user.isActive) {
    return {
      isAuthenticated: false,
      user: null,
      error: 'Account is deactivated'
    };
  }

  return {
    isAuthenticated: true,
    user
  };
}

/**
 * Verifica si un usuario tiene el rol requerido
 */
export function hasRequiredRole(userRole: string, requiredRole: 'admin' | 'moderator' | 'user'): boolean {
  const roleHierarchy = {
    'admin': 3,
    'moderator': 2,
    'user': 1
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
}

/**
 * Middleware de autorización para rutas de API
 */
export function authorizeRequest(
  request: Request, 
  requiredRole: 'admin' | 'moderator' | 'user' = 'user'
): {
  isAuthorized: boolean;
  user: JWTPayload | null;
  error?: string;
} {
  const authResult = authenticateRequest(request);
  
  if (!authResult.isAuthenticated) {
    return {
      isAuthorized: false,
      user: null,
      error: authResult.error
    };
  }

  const user = authResult.user!;
  
  if (!hasRequiredRole(user.role, requiredRole)) {
    return {
      isAuthorized: false,
      user,
      error: `Insufficient permissions. Required: ${requiredRole}, Current: ${user.role}`
    };
  }

  return {
    isAuthorized: true,
    user
  };
}