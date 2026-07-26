import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserPreferences } from '@/types/auth';

export interface DashboardPreferences {
  layout: 'grid' | 'list';
  cardOrder: string[];
  hiddenCards: string[];
  cardSizes: Record<string, 'small' | 'medium' | 'large'>;
}

const defaultPreferences: DashboardPreferences = {
  layout: 'grid',
  cardOrder: [
    'farms',
    'dailyRoutine',
    'salvaging',
    'magic',
    'festivals',
    'farmingTracker',
    'giftOfMastery',
    'giftOfJadeMastery',
    'garden',
    'giveaways',
    'opened',
    'ectogambling',
    'conversionGuide',
    'ectoplasm',
    'altParking',
    'orrianJewelry',
    'glossary',
    'magicMirrors',
    'homestead',
    'holidayCalendar',
    'expBuffs',
    'buyout',
  ],
  hiddenCards: [],
  cardSizes: {}
};

export function useDashboardPreferences() {
  const { user, updateUser } = useAuth();
  const [preferences, setPreferences] = useState<DashboardPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const lastSavedRef = useRef<string>('');
  const hasLoadedRef = useRef(false);
  const lastUserRef = useRef<string | null>(null);

  // Cargar preferencias del usuario
  useEffect(() => {
    // Si el usuario cambió, resetear el flag de carga
    const userId = user?.id || null;
    if (lastUserRef.current !== userId) {
      hasLoadedRef.current = false;
      lastUserRef.current = userId;
      lastSavedRef.current = '';
    }

    // Si no hay usuario, usar preferencias por defecto
    if (!user) {
      if (!hasLoadedRef.current) {
        setPreferences(defaultPreferences);
        hasLoadedRef.current = true;
      }
      return;
    }

    // Si el usuario tiene preferencias de dashboard, cargarlas
    if (user?.preferences?.dashboard) {
      const dashboard = user.preferences.dashboard;
      
      const newPrefs: DashboardPreferences = {
        layout: dashboard.layout || defaultPreferences.layout,
        cardOrder: dashboard.cardOrder && Array.isArray(dashboard.cardOrder) && dashboard.cardOrder.length > 0
          ? dashboard.cardOrder
          : defaultPreferences.cardOrder,
        hiddenCards: dashboard.hiddenCards && Array.isArray(dashboard.hiddenCards)
          ? dashboard.hiddenCards
          : defaultPreferences.hiddenCards,
        cardSizes: dashboard.cardSizes && typeof dashboard.cardSizes === 'object' && dashboard.cardSizes !== null
          ? dashboard.cardSizes
          : defaultPreferences.cardSizes
      };
      
      // En la primera carga (después de refrescar o cambiar de usuario), SIEMPRE cargar las preferencias sin verificar el hash
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        lastSavedRef.current = ''; // Limpiar el hash en la carga inicial
        setPreferences(newPrefs);
        return;
      }
      
      setPreferences((prev) => {
        // Crear un hash del nuevo orden para comparar
        const newOrderHash = JSON.stringify(newPrefs.cardOrder);
        
        // Si acabamos de guardar este orden, no sobrescribir PERO verificar si el orden es diferente
        if (lastSavedRef.current === newOrderHash) {
          // Solo ignorar si el orden es el mismo que el actual
          const currentOrderHash = JSON.stringify(prev.cardOrder);
          if (currentOrderHash === newOrderHash) {
            return prev;
          }
          // Si el orden es diferente, actualizar (puede ser una actualización desde otro lugar)
          // Limpiar el hash para permitir la actualización
          lastSavedRef.current = '';
        }
        
        // Comparar si son diferentes
        const isDifferent = 
          prev.layout !== newPrefs.layout ||
          JSON.stringify(prev.cardOrder) !== JSON.stringify(newPrefs.cardOrder) ||
          JSON.stringify(prev.hiddenCards) !== JSON.stringify(newPrefs.hiddenCards) ||
          JSON.stringify(prev.cardSizes) !== JSON.stringify(newPrefs.cardSizes);
        
        return isDifferent ? newPrefs : prev;
      });
    } else {
      // Si no hay preferencias guardadas, usar las por defecto
      if (!hasLoadedRef.current) {
        setPreferences(defaultPreferences);
        hasLoadedRef.current = true;
      }
    }
  }, [user, user?.preferences?.dashboard]);

  // Guardar preferencias en la base de datos
  const savePreferences = useCallback(async (newPreferences: Partial<DashboardPreferences>) => {
    if (!user) return;

    setIsLoading(true);
    let previousState: DashboardPreferences | null = null;
    let finalState: DashboardPreferences | null = null;
    
    try {
      // Calcular el estado final ANTES de actualizar el estado
      setPreferences((prev) => {
        previousState = prev;
        // Asegurarse de que cardOrder sea un nuevo array si está en newPreferences
        const updatedPreferences = { ...newPreferences };
        if ('cardOrder' in newPreferences && Array.isArray(newPreferences.cardOrder)) {
          updatedPreferences.cardOrder = [...newPreferences.cardOrder];
        }
        
        finalState = {
          ...prev,
          ...updatedPreferences
        };
        return finalState;
      });

      // Esperar un momento para que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 0));

      // Si finalState es null, usar el estado actual como fallback
      if (!finalState) {
        finalState = {
          ...preferences,
          ...newPreferences
        };
        if ('cardOrder' in newPreferences && Array.isArray(newPreferences.cardOrder)) {
          finalState.cardOrder = [...newPreferences.cardOrder];
        }
      }

      // Guardar el hash del orden que estamos guardando para evitar sobrescritura
      const orderHash = JSON.stringify(finalState.cardOrder);
      lastSavedRef.current = orderHash;
      
      // Fusionar las preferencias actuales con las nuevas preferencias de dashboard
      const updatedUserPreferences: UserPreferences = {
        ...user.preferences,
        dashboard: finalState
      };

      await updateUser({ preferences: updatedUserPreferences });
      
      // El estado local ya se actualizó con setPreferences, así que el modal debería actualizarse
      // Limpiar el hash después de un tiempo para permitir que el useEffect cargue las nuevas preferencias desde BD
      setTimeout(() => {
        lastSavedRef.current = '';
      }, 1000);
    } catch (error) {
      console.error('Error saving dashboard preferences:', error);
      // Revertir cambios en caso de error
      if (previousState) {
        setPreferences(previousState);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, preferences, updateUser]);

  // Funciones específicas para el dashboard
  const updateCardOrder = useCallback((newOrder: string[]) => {
    savePreferences({ cardOrder: newOrder });
  }, [savePreferences]);

  const toggleCardVisibility = useCallback((cardId: string) => {
    const newHiddenCards = preferences.hiddenCards.includes(cardId)
      ? preferences.hiddenCards.filter(id => id !== cardId)
      : [...preferences.hiddenCards, cardId];
    
    savePreferences({ hiddenCards: newHiddenCards });
  }, [preferences.hiddenCards, savePreferences]);

  const updateCardSize = useCallback((cardId: string, size: 'small' | 'medium' | 'large') => {
    const newCardSizes = {
      ...preferences.cardSizes,
      [cardId]: size
    };
    
    savePreferences({ cardSizes: newCardSizes });
  }, [preferences.cardSizes, savePreferences]);

  const setGlobalCardSize = useCallback((size: 'small' | 'medium' | 'large') => {
    // Aplicar el tamaño a todas las tarjetas visibles
    const allCardIds = preferences.cardOrder;
    const newCardSizes: Record<string, 'small' | 'medium' | 'large'> = {};
    
    allCardIds.forEach(cardId => {
      newCardSizes[cardId] = size;
    });
    
    savePreferences({ cardSizes: newCardSizes });
  }, [preferences.cardOrder, savePreferences]);

  const setLayout = useCallback((layout: 'grid' | 'list') => {
    savePreferences({ layout });
  }, [savePreferences]);

  const resetToDefault = useCallback(() => {
    savePreferences(defaultPreferences);
  }, [savePreferences]);

  return {
    preferences,
    isLoading,
    updateCardOrder,
    toggleCardVisibility,
    updateCardSize,
    setGlobalCardSize,
    setLayout,
    resetToDefault,
    savePreferences
  };
}
