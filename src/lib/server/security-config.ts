/**
 * Configuración de seguridad centralizada
 */

export const SECURITY_CONFIG = {
  // Configuración JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    ISSUER: 'true-farming.com',
    AUDIENCE: 'true-farming-users'
  },

  // Rutas protegidas y sus niveles de acceso requeridos
  PROTECTED_ROUTES: {
    // Rutas que requieren autenticación de administrador
    ADMIN_ONLY: [
      '/api/admin/users',
      '/api/giveaways/select-winners',
      '/api/giveaways/winners' // POST method
    ],
    
    // Rutas que requieren autenticación de moderador o superior
    MODERATOR_OR_ABOVE: [
      '/api/farms', // POST method for creating farms
      '/api/festivals/four-winds/config' // PUT festival config
    ],
    
    // Rutas que requieren autenticación básica
    AUTHENTICATED: [
      '/api/users/[id]' // PUT/DELETE methods
    ]
  },

  // Configuración de rate limiting (para futuro uso)
  RATE_LIMITING: {
    LOGIN_ATTEMPTS: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 15 * 60 * 1000, // 15 minutos
      BLOCK_DURATION_MS: 30 * 60 * 1000 // 30 minutos
    },
    API_CALLS: {
      MAX_REQUESTS: 100,
      WINDOW_MS: 60 * 1000 // 1 minuto
    }
  },

  // Headers de seguridad
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  },

  // Configuración de CORS
  CORS: {
    ALLOWED_ORIGINS: [
      'https://true-farming.com',
      'https://www.true-farming.com',
      'https://qa.true-farming.com',
      'https://true-farming.kunjohn24.workers.dev',
      ...(process.env.NODE_ENV === 'development' ? [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:4321',
        'http://127.0.0.1:4321',
      ] : [])
    ],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Configuración de logging de seguridad
  LOGGING: {
    LOG_FAILED_AUTH: true,
    LOG_ADMIN_ACTIONS: true,
    LOG_SENSITIVE_OPERATIONS: true,
    LOG_IP_ADDRESSES: true
  }
};

/**
 * Verifica si una ruta requiere autenticación de administrador
 */
export function requiresAdminAuth(pathname: string, method: string): boolean {
  // Verificar rutas exactas
  if (SECURITY_CONFIG.PROTECTED_ROUTES.ADMIN_ONLY.includes(pathname)) {
    return true;
  }

  // Verificar rutas específicas por método
  if (pathname === '/api/giveaways/winners' && method === 'POST') {
    return true;
  }

  if (pathname === '/api/giveaways/select-winners' && method === 'POST') {
    return true;
  }

  // Verificar patrones de ruta
  if (pathname.startsWith('/api/admin/')) {
    return true;
  }

  return false;
}

/**
 * Verifica si una ruta requiere autenticación de moderador o superior
 */
export function requiresModeratorAuth(pathname: string, method: string): boolean {
  if (pathname === '/api/farms' && method === 'POST') {
    return true;
  }

  return false;
}

/**
 * Verifica si una ruta requiere autenticación básica
 */
export function requiresAuth(pathname: string, method: string): boolean {
  // Verificar si ya requiere admin o moderator (que incluye auth básica)
  if (requiresAdminAuth(pathname, method) || requiresModeratorAuth(pathname, method)) {
    return true;
  }

  // Rutas de usuario individual (PUT/DELETE)
  if (pathname.match(/^\/api\/users\/[^\/]+$/) && ['PUT', 'DELETE'].includes(method)) {
    return true;
  }

  return false;
}

/**
 * Obtiene el nivel de autenticación requerido para una ruta
 */
export function getRequiredAuthLevel(pathname: string, method: string): 'admin' | 'moderator' | 'user' | 'none' {
  if (requiresAdminAuth(pathname, method)) {
    return 'admin';
  }
  
  if (requiresModeratorAuth(pathname, method)) {
    return 'moderator';
  }
  
  if (requiresAuth(pathname, method)) {
    return 'user';
  }
  
  return 'none';
}