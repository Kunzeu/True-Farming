import { User } from '@/types/auth';

/**
 * Tipos de beneficios disponibles para patrocinadores
 */
export type PatreonBenefit = 
  | 'no_ads'
  | 'exclusive_content'
  | 'discord_role'
  | 'priority_support'
  | 'early_access'
  | 'custom_features'
  | 'api_access';

/**
 * Configuración de tiers y sus beneficios
 * Personaliza esto según tus tiers de Patreon
 */
export const PATREON_TIERS = {
  // Tier bronze - 3€/mes
  'Bronze': {
    benefits: ['no_ads', 'discord_role'] as PatreonBenefit[],
    displayName: 'Bronze',
    color: '#FF9D00',
  },
  // Tier silver - 5€/mes
  'Silver': {
    benefits: ['no_ads', 'exclusive_content', 'discord_role', 'priority_support'] as PatreonBenefit[],
    displayName: 'Silver',
    color: '#FF424D',
  },
  // Tier gold - 10€/mes
  'Gold': {
    benefits: ['no_ads', 'exclusive_content', 'discord_role', 'priority_support', 'early_access', 'custom_features'] as PatreonBenefit[],
    displayName: 'Gold',
    color: '#FFD700',
  }, // Tier legends - 20€/mes
  'Legends': {
    benefits: ['no_ads', 'exclusive_content', 'discord_role', 'priority_support', 'early_access', 'custom_features'] as PatreonBenefit[],
    displayName: 'Legends',
    color: '#FFD700',
  },

} as const;

/**
 * Verifica si un usuario es un patreon activo
 * Un usuario es patreon activo si:
 * - patreonStatus === 'active_patron'
 * - Y tiene un tier válido (Bronze, Silver, Gold, Legends)
 */
export function isActivePatron(user: User | null): boolean {
  if (!user) return false;  
  if (user.role === 'admin' || user.isAdmin) return true;
  
  // Debe tener status 'active_patron'
  if (user.patreonStatus !== 'active_patron') {
    return false;
  }
  
  // Debe tener un tier válido
  if (!user.patreonTier || user.patreonTier.trim() === '') {
    return false;
  }
  
  // Verificar que el tier sea uno de los válidos (case-insensitive)
  const tier = user.patreonTier.trim();
  const validTiers = ['Bronze', 'Silver', 'Gold', 'Legends'];
  const tierLower = tier.toLowerCase();
  
  const isValidTier = validTiers.some(validTier => 
    validTier.toLowerCase() === tierLower
  );
  
  return isValidTier;
}

export function getUserPatreonTier(user: User | null): string | null {
  if (!user) return null;
  
  if (user.role === 'admin' || user.isAdmin) return 'Legends';

  if (!isActivePatron(user)) return null;
  return user?.patreonTier || null;
}

/**
 * Verifica si un usuario tiene un beneficio específico
 */
export function hasBenefit(user: User | null, benefit: PatreonBenefit): boolean {
  if (!isActivePatron(user)) return false;
  
  const tier = getUserPatreonTier(user);
  if (!tier) return false;
  
  const tierConfig = PATREON_TIERS[tier as keyof typeof PATREON_TIERS];
  if (!tierConfig) return false;
  
  return tierConfig.benefits.includes(benefit);
}

/**
 * Obtiene todos los beneficios del usuario (solo si es patrón activo)
 */
export function getUserBenefits(user: User | null): PatreonBenefit[] {
  if (!isActivePatron(user)) return [];
  
  const tier = getUserPatreonTier(user);
  if (!tier) return [];
  
  const tierConfig = PATREON_TIERS[tier as keyof typeof PATREON_TIERS];
  if (!tierConfig) return [];
  
  return tierConfig.benefits;
}

/**
 * Obtiene los beneficios del tier del usuario (independientemente del estado de patrón activo)
 */
export function getTierBenefits(user: User | null): PatreonBenefit[] {
  const tier = getUserPatreonTier(user);
  if (!tier) return [];
  
  const tierConfig = PATREON_TIERS[tier as keyof typeof PATREON_TIERS];
  if (!tierConfig) return [];
  
  return tierConfig.benefits;
}

/**
 * Obtiene información del tier del usuario
 */
export function getTierInfo(user: User | null) {
  if (!isActivePatron(user)) return null;
  
  const tier = getUserPatreonTier(user);
  if (!tier) return null;
  
  return PATREON_TIERS[tier as keyof typeof PATREON_TIERS] || null;
}

export function shouldShowAds(user: User | null): boolean {
  // Administradores y moderadores no ven anuncios
  if (user?.role === 'admin' || user?.isAdmin || user?.role === 'moderator') {
    return false;
  }
  
  // Si es un patreon activo (status = 'active_patron'), NO mostrar anuncios
  if (isActivePatron(user)) {
    return false; // No mostrar anuncios a patreons activos
  }
  // Si no es patreon activo, mostrar anuncios
  return true; // Mostrar anuncios a usuarios que no son patreons activos
}

/**
 * Verifica si el usuario tiene acceso a contenido exclusivo
 */
export function hasExclusiveAccess(user: User | null): boolean {
  return hasBenefit(user, 'exclusive_content');
}

/**
 * Verifica si el usuario tiene soporte prioritario
 */
export function hasPrioritySupport(user: User | null): boolean {
  return hasBenefit(user, 'priority_support');
}

/**
 * Verifica si el usuario tiene acceso anticipado
 */
export function hasEarlyAccess(user: User | null): boolean {
  return hasBenefit(user, 'early_access');
}

/**
 * Obtiene el nombre para mostrar del tier
 */
export function getTierDisplayName(user: User | null): string | null {
  const tierInfo = getTierInfo(user);
  return tierInfo?.displayName || null;
}

/**
 * Obtiene el color del tier
 */
export function getTierColor(user: User | null): string {
  const tierInfo = getTierInfo(user);
  return tierInfo?.color || '#6B7280'; // gray-500 por defecto
}

/**
 * Verifica el nivel mínimo requerido para un beneficio
 */
export function getMinimumTierForBenefit(benefit: PatreonBenefit): string | null {
  for (const [tierName, config] of Object.entries(PATREON_TIERS)) {
    if (config.benefits.includes(benefit)) {
      return tierName;
    }
  }
  return null;
}

/**
 * Hook personalizado para usar en componentes React
 */
export function usePatreonBenefits(user: User | null) {
  return {
    isActivePatron: isActivePatron(user),
    tier: getUserPatreonTier(user),
    tierInfo: getTierInfo(user),
    benefits: getUserBenefits(user),
    hasBenefit: (benefit: PatreonBenefit) => hasBenefit(user, benefit),
    shouldShowAds: shouldShowAds(user),
    hasExclusiveAccess: hasExclusiveAccess(user),
    hasPrioritySupport: hasPrioritySupport(user),
    hasEarlyAccess: hasEarlyAccess(user),
    tierDisplayName: getTierDisplayName(user),
    tierColor: getTierColor(user),
  };
}

/**
 * Componente de ejemplo para mostrar un badge de Patreon
 */
export function getPatreonBadge(user: User | null): { show: boolean; text: string; color: string } | null {
  if (!isActivePatron(user)) return null;
  
  const tierInfo = getTierInfo(user);
  if (!tierInfo) return null;
  
  return {
    show: true,
    text: tierInfo.displayName,
    color: tierInfo.color,
  };
}
