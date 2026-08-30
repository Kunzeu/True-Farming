'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthState, User, LoginCredentials, RegisterCredentials } from '@/types/auth';
import type { User as DbUser } from '@/lib/database-client';
import { isActivePatron } from '@/lib/patreon-benefits';
import { getClientOAuthRedirectUri } from '@/lib/oauth-redirect';
import { extractPatreonMembership } from '@/lib/patreon-membership';

// Tipos para la API de Patreon
interface PatreonResource {
  type: string;
  id: string;
  attributes: {
    email?: string;
    full_name?: string;
    vanity?: string;
    patron_status?: 'active_patron' | 'declined_patron' | 'former_patron' | null;
    title?: string;
    currently_entitled_amount_cents?: number;
  };
  relationships?: {
    currently_entitled_tiers?: {
      data: Array<{ type: string; id: string }>;
    };
    campaign?: {
      data?: { type: string; id: string };
    };
    currently_entitled_campaign?: {
      data?: { type: string; id: string };
    };
  };
}

// Estado inicial
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  invalidationMessage: null,
};

// Tipos de acciones
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_RESET_LOADING' }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'REFRESH_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        invalidationMessage: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_RESET_LOADING':
      return {
        ...state,
        isLoading: false,
        error: null,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        invalidationMessage: null,
      };
    case 'REFRESH_USER':
      return {
        ...state,
        user: action.payload,
        invalidationMessage: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        invalidationMessage: null,
      };
    default:
      return state;
  }
}

// Contexto
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  loginWithDiscord: (code: string) => Promise<void>;
  loginWithPatreon: (code: string) => Promise<void>;
  linkPatreon: (code: string) => Promise<void>;
  unlinkPatreon: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hasPermission: (role: 'admin' | 'moderator' | 'user') => boolean;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Interfaz para la respuesta de Patreon Identity API
interface PatreonIdentityResponse {
  data: PatreonResource;
  included?: PatreonResource[];
}

// Función auxiliar para extraer información de Patreon de forma consistente
function extractPatreonInfo(patreonData: PatreonIdentityResponse) {
  return extractPatreonMembership(patreonData);
}

// Provider interno que usa hooks
function AuthProviderInternal({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  const lastUserRefreshRef = useRef<number>(0);
  const didInitialRefreshRef = useRef<boolean>(false);
  const inflightRefreshRef = useRef<Promise<void> | null>(null);
  const lastSummaryRef = useRef<{ hasApiKey: boolean; apiKeyValid: boolean | null } | null>(null);
  const autoEnrollGiveawayRef = useRef<string | null>(null);
  const refreshThrottleMs = 120000; // 2 minutos para deduplicar refrescos

  const broadcastAuth = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tf-auth-change'));
    }
  };

  // Verificar token al cargar (+ sync entre islas Astro)
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('gw2_token');
      const userData = localStorage.getItem('gw2_user');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);

          // Parsear preferencias si vienen como string JSON
          if (user.preferences && typeof user.preferences === 'string') {
            try {
              user.preferences = JSON.parse(user.preferences);
            } catch {
              // Si falla el parse, mantener como está
            }
          }

          // Parsear preferencias de dashboard si existen
          if (user.preferences?.dashboard && typeof user.preferences.dashboard === 'string') {
            try {
              user.preferences.dashboard = JSON.parse(user.preferences.dashboard);
            } catch {
              // Si falla el parse, mantener como está
            }
          }

          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token },
          });
        } catch {
          localStorage.removeItem('gw2_token');
          localStorage.removeItem('gw2_user');
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    checkAuth();
    window.addEventListener('tf-auth-change', checkAuth);
    return () => window.removeEventListener('tf-auth-change', checkAuth);
  }, []);

  useEffect(() => {
    const currentUser = state.user;

    if (!currentUser || !currentUser.id) {
      autoEnrollGiveawayRef.current = null;
      return;
    }

    if (!isActivePatron(currentUser)) {
      return;
    }

    if (autoEnrollGiveawayRef.current === currentUser.id) {
      return;
    }

    let cancelled = false;

    const enroll = async () => {
      try {
        const response = await fetch('/api/giveaways/auto-enroll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: currentUser.id }),
        });

        if (!response.ok) {
          const payload = await response.text();
          console.error('Auto-enroll giveaway failed:', response.status, payload);
          return;
        }

        if (!cancelled) {
          autoEnrollGiveawayRef.current = currentUser.id;
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Auto-enroll giveaway request error:', error);
        }
      }
    };

    enroll();

    return () => {
      cancelled = true;
    };
  }, [state.user]);

  // Función de login
  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' });

    try {
      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          throw new Error('EMAIL_NOT_VERIFIED');
        }
        throw new Error(data.error || 'Login failed');
      }

      // Create user object
      const user: User = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        isActive: data.user.isActive,
        joinDate: data.user.createdAt ? (typeof data.user.createdAt === 'string' ? data.user.createdAt : data.user.createdAt.toISOString()) : new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isAdmin: data.user.role === 'admin',
        preferences: data.user.preferences,
        patreonId: data.user.patreonId || undefined,
        patreonTier: data.user.patreonTier || undefined,
        patreonStatus: data.user.patreonStatus || undefined
      };

      // Use the JWT token from the server response
      const token = data.token;

      // Guardar en localStorage
      localStorage.setItem('gw2_token', token);
      localStorage.setItem('gw2_user', JSON.stringify(user));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('tf-auth-change'));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });

      // Intentar persistir vinculación de Patreon por email (solo si hay datos suficientes)
      try {
        if (user.email && user.patreonId) {
          const persistRes = await fetch('/api/auth/patreon/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              patreonId: user.patreonId,
              patreonTier: user.patreonTier ?? null,
              patreonStatus: user.patreonStatus ?? null
            })
          });
          if (!persistRes.ok) {
            const text = await persistRes.text();
            console.error('Persist Patreon link failed (loginWithPatreon):', persistRes.status, text);
          }
        } else {
          // No hay datos de Patreon en este flujo de login normal; omitir persistencia
        }
        // Refrescar datos luego de persistir
        setTimeout(() => {
          // Best-effort ligero: solo leer summary para snapshot inicial; evitar full
          fetch(`/api/users/${user.id}/summary`)
            .then(r => r.ok ? r.json() : null)
            .then(s => {
              if (!s) return;
              try {
                sessionStorage.setItem('gw2_user_last_summary', JSON.stringify({ hasApiKey: !!s.hasApiKey, apiKeyValid: s.apiKeyValid ?? null }));
              } catch { }
            })
            .catch(() => { });
        }, 300);
      } catch { }

    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Authentication error',
      });
    }
  }, []);

  // Función de registro
  const register = useCallback(async (credentials: RegisterCredentials) => {
    dispatch({ type: 'AUTH_START' });

    try {
      // Llamar a la API de registro real
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      const needsEmailVerification =
        data.requiresEmailVerification === true ||
        (Boolean(data.email) && !data.token);

      if (needsEmailVerification) {
        dispatch({ type: 'AUTH_RESET_LOADING' });
        router.push(`/auth/check-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      if (!data.user?.id || !data.token) {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      // Limpiar localStorage en caso de error
      localStorage.removeItem('gw2_token');
      localStorage.removeItem('gw2_user');

      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Registration error',
      });
    }
  }, [router]);
  const logout = useCallback(() => {
    localStorage.removeItem('gw2_token');
    localStorage.removeItem('gw2_user');
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('tf-auth-change'));
    dispatch({ type: 'AUTH_LOGOUT' });

    // Redirigir a la página principal
    router.push('/');
  }, [router]);

  // Función para actualizar usuario
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!state.user) return;

    try {
      const { getDbService } = await import('@/lib/database-switch');
      const dbService = await getDbService();

      // Actualizar en la base de datos
      const updatedUser = await dbService.updateUser(state.user.id, updates);

      // Actualizar en el contexto - fusionar preferencias correctamente
      // Si se actualizaron preferencias, fusionarlas con las existentes
      let mergedPreferences = state.user.preferences;

      if (updates.preferences) {
        // Si se actualizaron preferencias, fusionarlas
        mergedPreferences = {
          ...state.user.preferences,
          ...updates.preferences,
          // Si hay preferencias de dashboard, fusionarlas también
          ...(updates.preferences.dashboard && {
            dashboard: {
              ...state.user.preferences?.dashboard,
              ...updates.preferences.dashboard
            }
          })
        };
      } else if (updatedUser.preferences) {
        // Si no se actualizaron preferencias pero updatedUser tiene preferencias, usarlas
        mergedPreferences = updatedUser.preferences;
      }

      const newUser = {
        ...state.user,
        ...updatedUser,
        preferences: mergedPreferences
      };

      // Guardar en localStorage INMEDIATAMENTE - esto asegura que las preferencias se persistan
      // Antes de actualizar el contexto, guardar en localStorage para que esté disponible al refrescar
      try {
        localStorage.setItem('gw2_user', JSON.stringify(newUser));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: newUser, token: state.token || '' }
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, [state.user, state.token]);

  // Función de login/registro con Patreon
  const loginWithPatreon = useCallback(async (code: string) => {
    dispatch({ type: 'AUTH_START' });

    try {

      // Intercambiar el código por un token de acceso
      const tokenResponse = await fetch('/api/auth/patreon/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!tokenResponse.ok) {
        let errorMessage = `HTTP ${tokenResponse.status}`;
        try {
          const json = await tokenResponse.json();
          errorMessage = json.error || JSON.stringify(json) || errorMessage;
          console.error('Patreon token error JSON:', {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            error: json.error,
            error_description: json.error_description,
            error_uri: json.error_uri,
            fullResponse: json
          });
        } catch {
          const text = await tokenResponse.text();
          errorMessage = text || errorMessage;
          console.error('Patreon token error TEXT:', {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            response: text
          });
        }
        throw new Error(`Patreon token error (${tokenResponse.status}): ${errorMessage}`);
      }

      let access_token: string;
      try {
        const body = await tokenResponse.json();
        access_token = body.access_token;
      } catch {
        const text = await tokenResponse.text();
        console.error('Patreon token parse error, raw:', text);
        throw new Error('Respuesta inválida del servidor de token de Patreon');
      }


      // Obtener información del usuario de Patreon y su membresía
      const identityResponse = await fetch('/api/auth/patreon/identity', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!identityResponse.ok) {
        const errorData = await identityResponse.text();
        console.error('Patreon identity error:', errorData);
        throw new Error('Error al obtener información del usuario');
      }

      const patreonData = await identityResponse.json();
      const patreonUser = patreonData.data;

      // Usar función auxiliar y normalizar
      const { patreonStatus, patreonTier } = extractPatreonInfo(patreonData);
      const finalStatus = patreonStatus;
      const finalTier = patreonTier;


      // Buscar o crear usuario en la base de datos
      const { getDbService } = await import('@/lib/database-switch');
      const dbService = await getDbService();

      // Primero: si ya estás autenticado, vincular Patreon al usuario actual (ignorar email de Patreon)
      let dbUser: DbUser | null = null;
      if (state.user) {
        // Usuario logueado: vincular Patreon al usuario actual
        dbUser = {
          id: state.user.id,
          email: state.user.email, // Mantener email original del usuario
          username: state.user.username,
          role: (state.user.role ?? 'user'),
          isActive: state.user.isActive,
          createdAt: new Date(state.user.joinDate || Date.now()),
          updatedAt: new Date(),
          discordId: state.user.discordId,
          gw2ApiKey: state.user.gw2ApiKey,
          patreonId: state.user.patreonId ?? undefined,
          patreonTier: state.user.patreonTier ?? undefined,
          patreonStatus: state.user.patreonStatus ?? null,
          preferences: state.user.preferences,
        } as DbUser;
      } else {
        // No hay usuario logueado: buscar por Patreon ID o crear nuevo
        dbUser = await dbService.getUserByPatreonId(patreonUser.id);
      }

      if (!dbUser) {
        try {
          // Crear nuevo usuario
          const createdUser = await dbService.createUser({
            email: patreonUser.attributes.email,
            username: patreonUser.attributes.vanity || patreonUser.attributes.full_name || `patreon_${patreonUser.id}`,
            patreonId: patreonUser.id,
            patreonTier: finalTier || undefined,
            patreonStatus: finalStatus || undefined,
            role: 'user',
            isActive: true,
          });
          dbUser = createdUser;
        } catch (createError) {
          // Fallback robusto: intentar recuperar usuario por email y continuar
          try {
            const existingByEmail = await dbService.getUserByEmail(patreonUser.attributes.email);
            if (existingByEmail) {
              dbUser = existingByEmail;
            } else {
              throw createError;
            }
          } catch (fetchExistingError) {
            console.error('Error fetching existing user by email after createUser failure:', fetchExistingError);
            // Si también falla obtener por email, propagar el error original de creación
            throw createError;
          }
        }
      } else {


        // En lugar de actualizar en la BD (que requiere autenticación),
        // simplemente sobrescribir los datos localmente con la info actual de Patreon
        // La actualización en BD se hará cuando el usuario use la app normalmente
      }

      if (!dbUser) {
        throw new Error('Error al crear/obtener usuario de Patreon');
      }

      const dbUserWithPatreon = dbUser as User & { patreonId?: string; patreonTier?: string; patreonStatus?: 'active_patron' | 'declined_patron' | 'former_patron' | null };


      // Crear objeto de usuario para el contexto
      // Usar los datos más recientes de Patreon obtenidos en este login
      const user: User = {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        isActive: dbUser.isActive,
        joinDate: dbUser.createdAt?.toISOString() || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isAdmin: dbUser.role === 'admin',
        // Usar los datos más recientes de Patreon de este login, o los de la BD
        patreonId: dbUserWithPatreon.patreonId || patreonUser.id,
        patreonTier: patreonTier ?? dbUserWithPatreon.patreonTier ?? undefined,
        // Guardar patreonStatus incluso si es null (no usar undefined)
        patreonStatus: patreonStatus !== null ? patreonStatus : dbUserWithPatreon.patreonStatus ?? null,
        preferences: dbUser.preferences || {
          theme: 'dark',
          language: 'es',
          notifications: {
            priceAlerts: true,
            eventReminders: true,
            buildUpdates: false
          }
        }
      };


      // Persistir inmediatamente la vinculación de Patreon en la BD usando el usuario resuelto
      try {
        const persistRes = await fetch('/api/auth/patreon/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: dbUser.id,
            email: dbUser.email,
            patreonId: patreonUser.id,
            patreonTier: finalTier ?? null,
            patreonStatus: finalStatus ?? null
          })
        });
        if (!persistRes.ok) {
          const text = await persistRes.text();
          console.error('Persist Patreon link failed (loginWithPatreon immediate):', persistRes.status, text);
        }
      } catch (e) {
        console.error('Persist Patreon link threw (loginWithPatreon immediate):', e);
      }

      const existingToken = localStorage.getItem('gw2_token');
      const token =
        existingToken && !existingToken.startsWith('temp_')
          ? existingToken
          : 'temp_patreon_token_' + Date.now();

      // Verificar qué se va a guardar


      // Guardar en localStorage
      localStorage.setItem('gw2_token', token);
      localStorage.setItem('gw2_user', JSON.stringify(user));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('tf-auth-change'));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });

    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Patreon authentication error',
      });
    }
  }, [state.user]);

  // Función para vincular cuenta de Patreon a usuario existente
  const linkPatreon = useCallback(async (code: string) => {
    // Verificar sesión en contexto o localStorage como fallback
    let currentUser = state.user;
    if (!currentUser && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('gw2_user');
      const storedToken = localStorage.getItem('gw2_token');
      if (storedUser && storedToken) {
        try {
          currentUser = JSON.parse(storedUser);
        } catch {
          // Ignorar error de parsing
        }
      }
    }

    if (!currentUser) {
      throw new Error('Debes iniciar sesión primero');
    }

    try {


      // Intercambiar el código por un token de acceso
      const tokenResponse = await fetch('/api/auth/patreon/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!tokenResponse.ok) {
        let errorMessage = `HTTP ${tokenResponse.status}`;
        try {
          const json = await tokenResponse.json();
          errorMessage = json.error || JSON.stringify(json) || errorMessage;
          console.error('Patreon token error JSON:', json);
        } catch {
          const text = await tokenResponse.text();
          errorMessage = text || errorMessage;
          console.error('Patreon token error TEXT:', text);
        }
        throw new Error(errorMessage || 'Error al obtener token de Patreon');
      }

      let access_token: string;
      try {
        const body = await tokenResponse.json();
        access_token = body.access_token;
      } catch {
        const text = await tokenResponse.text();
        console.error('Patreon token parse error, raw:', text);
        throw new Error('Respuesta inválida del servidor de token de Patreon');
      }


      // Obtener información del usuario de Patreon
      const identityResponse = await fetch('/api/auth/patreon/identity', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!identityResponse.ok) {
        const errorData = await identityResponse.text();
        console.error('Patreon identity error:', errorData);
        throw new Error('Error al obtener información del usuario');
      }

      const patreonData = await identityResponse.json();
      const patreonUser = patreonData.data;

      // Usar función auxiliar y normalizar
      const { patreonStatus, patreonTier } = extractPatreonInfo(patreonData);
      const finalStatus = patreonStatus;
      const finalTier = patreonTier;

      const persistRes = await fetch('/api/auth/patreon/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
          patreonId: patreonUser.id,
          patreonTier: finalTier ?? null,
          patreonStatus: finalStatus ?? null,
        }),
      });
      if (!persistRes.ok) {
        const text = await persistRes.text();
        throw new Error(text || 'No se pudo guardar la vinculación de Patreon');
      }

      const patched: User = {
        ...currentUser,
        patreonId: patreonUser.id,
        patreonTier: finalTier || undefined,
        patreonStatus: finalStatus || null,
      };
      localStorage.setItem('gw2_user', JSON.stringify(patched));
      window.dispatchEvent(new Event('tf-auth-change'));
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: patched, token: localStorage.getItem('gw2_token') || '' },
      });
    } catch (error) {
      console.error('Error linking Patreon:', error);
      throw error;
    }
  }, [state.user]);

  // Desvincular cuenta de Patreon del usuario actual
  const unlinkPatreon = useCallback(async () => {
    if (!state.user) return;
    try {
      await fetch('/api/auth/patreon/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.user.email })
      });

      // Actualizar local y contexto
      const newUser: User = {
        ...state.user,
        patreonId: undefined,
        patreonTier: undefined,
        patreonStatus: null
      };
      localStorage.setItem('gw2_user', JSON.stringify(newUser));
      dispatch({ type: 'REFRESH_USER', payload: newUser });
    } catch (error) {
      console.error('Error unlinking Patreon:', error);
      throw error;
    }
  }, [state.user]);

  // Función de login con Discord
  const loginWithDiscord = useCallback(async (code: string) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const redirect_uri = getClientOAuthRedirectUri(
        undefined,
        '/auth/discord/callback',
      );

      // Intercambiar el código por un token de acceso
      const tokenResponse = await fetch('/api/auth/discord/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirect_uri }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Discord token error:', errorData);
        throw new Error(errorData.error || 'Error al obtener token de Discord');
      }

      const { access_token } = await tokenResponse.json();


      // Obtener información del usuario de Discord
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.text();
        console.error('Discord user info error:', errorData);
        throw new Error('Error al obtener información del usuario');
      }

      const discordUser = await userResponse.json();



      // Buscar o crear usuario en la base de datos
      const { getDbService } = await import('@/lib/database-switch');
      const dbService = await getDbService();

      // Buscar usuario existente por Discord ID

      let dbUser = await dbService.getUserByDiscordId(discordUser.id);


      if (!dbUser) {

        // Crear nuevo usuario
        const createdUser = await dbService.createUser({
          email: discordUser.email,
          username: discordUser.username,
          discordId: discordUser.id,
          role: 'user',
          isActive: true,
        });


        // Usar el usuario recién creado
        dbUser = createdUser;
      } else {

      }

      if (!dbUser) {
        throw new Error('Error al crear/obtener usuario de Discord');
      }

      // Crear objeto de usuario para el contexto
      const user: User = {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        isActive: dbUser.isActive,
        joinDate: dbUser.createdAt?.toISOString() || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isAdmin: dbUser.role === 'admin',
        discordId: discordUser.id,
        preferences: {
          theme: 'dark',
          language: 'es',
          notifications: {
            priceAlerts: true,
            eventReminders: true,
            buildUpdates: false
          }
        }
      };

      const sessionRes = await fetch('/api/auth/discord/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token }),
      });
      if (!sessionRes.ok) {
        throw new Error('Error al crear sesión');
      }
      const { token } = await sessionRes.json();
      if (!token || typeof token !== 'string') {
        throw new Error('Error al crear sesión');
      }

      // Guardar en localStorage
      localStorage.setItem('gw2_token', token);
      localStorage.setItem('gw2_user', JSON.stringify(user));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('tf-auth-change'));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });

    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Discord authentication error',
      });
    }
  }, []);

  // Función para limpiar errores
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Función para verificar permisos
  const hasPermission = useCallback((role: 'admin' | 'moderator' | 'user'): boolean => {
    if (!state.user) return false;

    // Admin tiene todos los permisos
    if (state.user.role === 'admin') return true;

    // Moderator tiene permisos de moderator y user
    if (state.user.role === 'moderator') {
      return role === 'moderator' || role === 'user';
    }

    // User solo tiene permisos de user
    if (state.user.role === 'user') {
      return role === 'user';
    }

    return false;
  }, [state.user]);

  // Función para refrescar datos del usuario desde la base de datos
  const refreshUserData = useCallback(async () => {
    if (!state.user) return;
    const currentUser = state.user as User;
    // Throttle y coalescencia de llamadas
    const now = Date.now();
    if (now - lastUserRefreshRef.current < refreshThrottleMs && inflightRefreshRef.current) {
      try { await inflightRefreshRef.current; } catch { }
      return;
    }
    lastUserRefreshRef.current = now;

    const doRefresh = (async () => {
      try {
        const current = currentUser as User;
        if (current.patreonId) {
          try {
            await fetch('/api/auth/patreon/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: current.id,
                email: current.email,
                patreonId: current.patreonId,
              }),
            });
          } catch (syncError) {
            console.error('Patreon sync on refresh failed:', syncError);
          }
        }

        const response = await fetch(`/api/users/${currentUser.id}?full=true`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        });

        if (!response.ok) {
          // Si el usuario no existe o fue desactivado, hacer logout
          if (response.status === 404 || response.status === 403) {
            localStorage.removeItem('gw2_token');
            localStorage.removeItem('gw2_user');
            dispatch({ type: 'AUTH_LOGOUT' });
            return;
          }
          throw new Error('Failed to refresh user data');
        }

        const data = await response.json();


        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...safeUser } = data;

        const refreshedUser: User = {
          ...currentUser,
          email: safeUser.email,
          username: safeUser.username,
          role: safeUser.role,
          isActive: safeUser.isActive,
          discordId: safeUser.discordId,
          gw2ApiKey: safeUser.gw2ApiKey,
          // Si la API devuelve null/undefined, conservar lo que ya tengamos en memoria
          patreonId: safeUser.patreonId ?? currentUser.patreonId,
          patreonTier: safeUser.patreonTier ?? currentUser.patreonTier,
          patreonStatus: (safeUser.patreonStatus !== undefined ? safeUser.patreonStatus : currentUser.patreonStatus) ?? null,
          preferences: safeUser.preferences,
          isAdmin: safeUser.role === 'admin',
          joinDate: currentUser.joinDate,
          lastLogin: currentUser.lastLogin,
        };


        // Actualizar localStorage
        localStorage.setItem('gw2_user', JSON.stringify(refreshedUser));

        // Verificar si el usuario fue desactivado
        const wasActive = currentUser.isActive;
        const nowActive = refreshedUser.isActive;

        // Solo hacer logout si el usuario fue desactivado
        if (wasActive && !nowActive) {
          localStorage.removeItem('gw2_token');
          localStorage.removeItem('gw2_user');
          dispatch({ type: 'AUTH_LOGOUT' });
          return;
        }

        // Actualizar el contexto con los nuevos datos (incluso si cambió el rol)
        dispatch({
          type: 'REFRESH_USER',
          payload: refreshedUser
        });
        try { sessionStorage.setItem('gw2_user_full_refreshed_at', String(Date.now())); } catch { }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    })();
    inflightRefreshRef.current = doRefresh;
    await doRefresh;
    inflightRefreshRef.current = null;
  }, [state.user]);

  // Refresco ligero: usa summary y solo baja el user completo si cambia algo relevante
  const refreshUserSummary = useCallback(async () => {
    if (!state.user) return;
    const currentUser = state.user as User;
    try {
      // Saltar si hubo un full refresh hace menos de 2 minutos
      try {
        const lastFull = Number(sessionStorage.getItem('gw2_user_full_refreshed_at') || '0');
        if (Date.now() - lastFull < refreshThrottleMs) {
          const resp = await fetch(`/api/users/${currentUser.id}/summary`);
          if (resp.ok) {
            const data = await resp.json();
            lastSummaryRef.current = { hasApiKey: !!data.hasApiKey, apiKeyValid: data.apiKeyValid ?? null };
            try { sessionStorage.setItem('gw2_user_last_summary', JSON.stringify(lastSummaryRef.current)); } catch { }
          }
          return;
        }
      } catch { }

      // Inicializar snapshot desde sessionStorage si no existe aún
      if (!lastSummaryRef.current) {
        try {
          const snapshot = sessionStorage.getItem('gw2_user_last_summary');
          if (snapshot) lastSummaryRef.current = JSON.parse(snapshot);
        } catch { }
      }

      const resp = await fetch(`/api/users/${currentUser.id}/summary`);
      if (!resp.ok) return;
      const data = await resp.json();
      const current = lastSummaryRef.current;
      const next = { hasApiKey: !!data.hasApiKey, apiKeyValid: data.apiKeyValid ?? null } as { hasApiKey: boolean; apiKeyValid: boolean | null };
      // Solo disparar full cuando cambia hasApiKey (apiKeyValid puede fluctuar por salud externa)
      const changed = !current || current.hasApiKey !== next.hasApiKey;
      lastSummaryRef.current = next;
      try { sessionStorage.setItem('gw2_user_last_summary', JSON.stringify(next)); } catch { }
      if (changed) {
        await refreshUserData();
      }
    } catch { }
  }, [state.user, refreshUserData]);

  // Refrescar datos del usuario inmediatamente después de autenticarse (una vez por sesión)
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      // Evitar doble ejecución en React StrictMode (dev) o remounts rápidos
      if (didInitialRefreshRef.current) {
        return;
      }
      didInitialRefreshRef.current = true;
      try {
        const key = 'gw2_user_initial_refresh_at';
        const raw = sessionStorage.getItem(key);
        const last = raw ? Number(raw) : 0;
        const now = Date.now();
        // Evitar refrescos repetidos al cambiar de página (dedupe 3 min por sesión)
        if (!last || now - last > 180000) {
          sessionStorage.setItem(key, String(now));
          // Usar summary primero; si cambia, internamente hará el full
          refreshUserSummary();
        }
      } catch {
        // Fallback si sessionStorage no está disponible
        refreshUserSummary();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated]); // Solo cuando se autentica inicialmente

  // MODO EMERGENCIA: DESACTIVADO para reducir consumo en Vercel
  // Verificar y refrescar datos del usuario periódicamente (baja frecuencia) usando summary
  /* useEffect(() => {
    if (!state.isAuthenticated || !state.user) return;

    // Verificar cada 30 minutos para reducir invocaciones en Vercel
    const interval = setInterval(() => {
      // Si la pestaña no está visible, no refrescar
      if (!document.hidden) {
        refreshUserSummary();
      }
    }, 1800000); // 30 minutos

    // Debounce para evitar múltiples llamadas cuando el usuario vuelve a la pestaña
    let focusTimeout: NodeJS.Timeout | null = null;
    let lastFocusTime = 0;
    const FOCUS_DEBOUNCE_MS = 30000; // 30 segundos mínimo entre llamadas

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusTime < FOCUS_DEBOUNCE_MS) {
        return; // Ignorar si fue hace menos de 30 segundos
      }

      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }

      focusTimeout = setTimeout(() => {
        lastFocusTime = Date.now();
        refreshUserSummary();
      }, 2000); // Esperar 2 segundos después de volver a enfocar
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
    };
  }, [state.isAuthenticated, state.user, refreshUserSummary]); */

  const value: AuthContextType = {
    ...state,
    login,
    register,
    loginWithDiscord,
    loginWithPatreon,
    linkPatreon,
    unlinkPatreon,
    logout,
    clearError,
    hasPermission,
    updateUser,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Provider público que maneja hidratación
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Verificar si estamos en el cliente
  const isClient = typeof window !== 'undefined';

  if (!isClient) {
    // En el servidor, renderizar sin contexto
    return <>{children}</>;
  }

  // En el cliente, renderizar con contexto completo
  return <AuthProviderInternal>{children}</AuthProviderInternal>;
}

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Si no hay contexto (servidor), devolver estado inicial
    if (typeof window === 'undefined') {
      return {
        ...initialState,
        login: async () => { },
        register: async () => { },
        loginWithDiscord: async () => { },
        loginWithPatreon: async () => { },
        linkPatreon: async () => { },
        unlinkPatreon: async () => { },
        logout: () => { },
        clearError: () => { },
        hasPermission: () => false,
        updateUser: async () => { },
        refreshUserData: async () => { },
      };
    }
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

