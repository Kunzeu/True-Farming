// Cliente para API de base de datos (funciona en browser)

import { getAuthHeaders } from '@/lib/auth-client';
export interface FarmItem {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
  estimatedRewards: {
    gold?: string;
    spiritShards?: string;
    karma?: string;
    fractalRelics?: string;
    volatileMagic?: string;
    unboundMagic?: string;
    riftEssences?: string;
    mysticClovers?: string;
    imperialFavor?: string;
  };
  expansion: ('core' | 'hot' | 'pof' | 'eod' | 'soto' | 'jw' | 'voe')[];
  isSolo: boolean;
  requiresSquad: boolean;
  waypoint?: string;
  /** Ruta bajo /public o URL absoluta; se muestra en el modal de rutas como "dónde jugar". */
  locationImageUrl?: string;
  selected: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string; // ID del usuario que creó el farm
  createdByUsername?: string; // Username del creador (para mostrar)
  order?: number; // Orden de visualización (menor número = más arriba)
  // Campos para compatibilidad hacia atrás
  estimatedGold?: string;
  estimatedSpirit?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  password?: string; // Opcional para usuarios de Discord
  role: 'user' | 'admin' | 'moderator';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  discordId?: string; // ID de Discord para autenticación OAuth
  gw2ApiKey?: string; // Guild Wars 2 API key
  patreonId?: string; // ID de Patreon para autenticación OAuth
  patreonTier?: string; // Tier de membresía de Patreon
  patreonStatus?: 'active_patron' | 'declined_patron' | 'former_patron' | null; // Estado de membresía de Patreon
  preferences?: {
    theme?: 'dark' | 'light' | 'auto';
    language?: 'es' | 'en';
    notifications?: {
      priceAlerts: boolean;
      eventReminders: boolean;
      buildUpdates: boolean;
    };
  };
}

class DatabaseClientService {
  async init(): Promise<void> {
    // No need to initialize anything for HTTP client

  }

  // Farm methods
  async getAllFarms(): Promise<FarmItem[]> {
    // Agregar timestamp para evitar caché
    const timestamp = Date.now();
    const url = `/api/farms?t=${timestamp}`;
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch farms:', response.status, errorText);
      throw new Error(`Failed to fetch farms: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((farm: any) => ({
      ...farm,
      createdAt: new Date(farm.createdAt),
      updatedAt: new Date(farm.updatedAt)
    }));
  }

  async createFarm(farm: Omit<FarmItem, 'id' | 'createdAt' | 'updatedAt'> & { createdByRole: string }): Promise<FarmItem> {
    const response = await fetch('/api/farms', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(farm),
    });
    
    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.details || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      } catch {
        // Si no se puede parsear como JSON, usar el texto de la respuesta
        const errorText = await response.text();
        errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
      }
      console.error('Error creating farm:', errorMessage);
      throw new Error(`Failed to create farm: ${errorMessage}`);
    }
    
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }

  async updateFarm(id: string, updates: Partial<FarmItem>): Promise<FarmItem> {
    
    
    const response = await fetch(`/api/farms/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    
    
    
    if (!response.ok) {
      const errorData = await response.text();
      
      throw new Error(`Failed to update farm: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    
    
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }

  async deleteFarm(id: string): Promise<void> {
    
    
    const response = await fetch(`/api/farms/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    
    
    if (!response.ok) {
      const errorText = await response.text();
      
      throw new Error(`Failed to delete farm: ${response.status} ${errorText}`);
    }
    
    
  }

  // User methods
  async getAllUsers(): Promise<User[]> {
    const response = await fetch('/api/admin/users', {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch users');
    }
    
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((user: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...safeUser } = user;
      return {
        ...safeUser,
        createdAt: new Date(safeUser.createdAt),
        updatedAt: new Date(safeUser.updatedAt)
      };
    });
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 409) {
        // Error de conflicto - email o username duplicado
        throw new Error(errorData.error || 'Email o username ya existe');
      }
      throw new Error(errorData.error || 'Failed to create user');
    }
    
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = data;
    return {
      ...safeUser,
      createdAt: new Date(safeUser.createdAt),
      updatedAt: new Date(safeUser.updatedAt)
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const response = await fetch(`/api/users/${id}?user_id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update user error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to update user: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = data;
      
      // Parsear preferencias si vienen como string JSON
      let parsedPreferences = safeUser.preferences;
      if (typeof parsedPreferences === 'string') {
        try {
          parsedPreferences = JSON.parse(parsedPreferences);
        } catch {
          // Si falla el parse, mantener como está
        }
      }
      
      return {
        ...safeUser,
        preferences: parsedPreferences,
        createdAt: new Date(safeUser.createdAt),
        updatedAt: new Date(safeUser.updatedAt)
      };
    } catch (error) {
      console.error('Database client updateUser error:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<{ farmsDeleted: number; farmsPreserved: number; userRole: string }> {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    
    const data = await response.json();
    return {
      farmsDeleted: data.farmsDeleted || 0,
      farmsPreserved: data.farmsPreserved || 0,
      userRole: data.userRole || 'unknown'
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const response = await fetch(`/api/auth/search?email=${encodeURIComponent(email)}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch user');
    }
    
    const data = await response.json();
    // Para login, necesitamos la contraseña, así que no la ocultamos
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const response = await fetch(`/api/auth/search?username=${encodeURIComponent(username)}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch user');
    }
    
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = data;
    return {
      ...safeUser,
      createdAt: new Date(safeUser.createdAt),
      updatedAt: new Date(safeUser.updatedAt)
    };
  }

  async getUserByDiscordId(discordId: string): Promise<User | null> {
    const response = await fetch(`/api/auth/search?discordId=${encodeURIComponent(discordId)}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch user');
    }
    
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = data;
    return {
      ...safeUser,
      createdAt: new Date(safeUser.createdAt),
      updatedAt: new Date(safeUser.updatedAt)
    };
  }

  async getUserByPatreonId(patreonId: string): Promise<User | null> {
    const response = await fetch(`/api/auth/search?patreonId=${encodeURIComponent(patreonId)}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch user');
    }
    
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = data;
    return {
      ...safeUser,
      createdAt: new Date(safeUser.createdAt),
      updatedAt: new Date(safeUser.updatedAt)
    };
  }

  async getUserById(id: string): Promise<{ role: string; isActive: boolean } | null> {
    // Usar summary ligero para evitar descargar el usuario completo
    const response = await fetch(`/api/users/${id}/summary`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch user by ID');
    }
    
    const data = await response.json();
    return {
      role: data.role,
      isActive: Boolean(data.isActive)
    };
  }

  async getFullUserById(id: string): Promise<User | null> {
    const response = await fetch(`/api/users/${id}?full=true`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch full user by ID');
    }
    
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = data;
    return {
      ...safeUser,
      createdAt: new Date(safeUser.createdAt),
      updatedAt: new Date(safeUser.updatedAt)
    };
  }

  async invalidateUserSession(userId: string, reason: string): Promise<void> {
    const response = await fetch(`/api/users/${userId}/invalidate-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to invalidate user session');
    }
  }
}

export const dbClientService = new DatabaseClientService(); 