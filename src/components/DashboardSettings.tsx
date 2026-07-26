'use client';

import { useState, useEffect } from 'react';
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Settings, Grid, List, Eye, EyeOff, RotateCcw, X } from 'lucide-react';

interface DashboardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const availableCards = [
  { id: 'farms' },
  { id: 'dailyRoutine' },
  { id: 'salvaging' },
  { id: 'magic' },
  { id: 'festivals' },
  { id: 'farmingTracker' },
  { id: 'glossary' },
  { id: 'orrianJewelry' },
  { id: 'giftOfMastery' },
  { id: 'giftOfJadeMastery' },
  { id: 'garden' },
  { id: 'giveaways' },
  { id: 'opened' },
  { id: 'ectogambling' },
  { id: 'conversionGuide' },
  { id: 'ectoplasm' },
  { id: 'altParking' },
  { id: 'magicMirrors' },
  { id: 'homestead' },
  { id: 'holidayCalendar' },
  { id: 'expBuffs' },
  { id: 'buyout' },
];

export default function DashboardSettings({ isOpen, onClose }: DashboardSettingsProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const {
    preferences,
    isLoading,
    updateCardOrder,
    toggleCardVisibility,
    setGlobalCardSize,
    setLayout,
    resetToDefault
  } = useDashboardPreferences();

  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverCard, setDragOverCard] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);


  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
    
    // Cambiar el cursor del mouse a "move"
    document.body.style.cursor = 'move';
    document.body.style.userSelect = 'none';
    
    // Hacer el elemento semi-transparente mientras se arrastra
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
      e.currentTarget.style.cursor = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedCard && draggedCard !== targetCardId) {
      setDragOverCard(targetCardId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Solo limpiar si realmente estamos saliendo del elemento (no entrando a un hijo)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverCard(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedCardId = draggedCard || e.dataTransfer.getData('text/plain');
    
    if (!draggedCardId || draggedCardId === targetCardId) {
      setIsDragging(false);
      setDraggedCard(null);
      setDragOverCard(null);
      return;
    }

    const currentOrder = [...preferences.cardOrder];
    const draggedIndex = currentOrder.indexOf(draggedCardId);
    const targetIndex = currentOrder.indexOf(targetCardId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setIsDragging(false);
      setDraggedCard(null);
      setDragOverCard(null);
      return;
    }

    // Mover la tarjeta
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedCardId);

    // Actualizar inmediatamente
    updateCardOrder(newOrder);
    
    setIsDragging(false);
    setDraggedCard(null);
    setDragOverCard(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Restaurar el cursor del mouse
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Restaurar la opacidad
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.cursor = '';
    }
    
    setIsDragging(false);
    setDraggedCard(null);
    setDragOverCard(null);
    
    // Prevenir clicks después del drag
    setTimeout(() => {
      setIsDragging(false);
    }, 100);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            {t('dashboard.settings.title', 'Configuración del Dashboard')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-gray-700"
            aria-label={t('dashboard.settings.close', 'Cerrar')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Layout Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">{t('dashboard.settings.layout', 'Diseño')}</h3>
          <div className="flex gap-4">
            <button
              onClick={() => setLayout('grid')}
              className={`flex items-center px-4 py-2 rounded-lg ${
                preferences.layout === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Grid className="w-4 h-4 mr-2" />
              {t('dashboard.settings.grid', 'Cuadrícula')}
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`flex items-center px-4 py-2 rounded-lg ${
                preferences.layout === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <List className="w-4 h-4 mr-2" />
              {t('dashboard.settings.list', 'Lista')}
            </button>
          </div>
        </div>

        {/* Global Size Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">{t('dashboard.settings.cardSize', 'Tamaño de Tarjetas')}</h3>
          <p className="text-gray-400 text-sm mb-4">
            {t('dashboard.settings.cardSizeDescription', 'Cambia el tamaño de todas las tarjetas del dashboard.')}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setGlobalCardSize('small')}
              className={`flex items-center px-4 py-2 rounded-lg ${
                Object.values(preferences.cardSizes).every(size => size === 'small') || Object.keys(preferences.cardSizes).length === 0
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="w-3 h-3 bg-current rounded mr-2"></div>
              {t('dashboard.settings.small', 'Pequeño')}
            </button>
            <button
              onClick={() => setGlobalCardSize('medium')}
              className={`flex items-center px-4 py-2 rounded-lg ${
                Object.values(preferences.cardSizes).every(size => size === 'medium')
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="w-4 h-4 bg-current rounded mr-2"></div>
              {t('dashboard.settings.medium', 'Mediano')}
            </button>
            <button
              onClick={() => setGlobalCardSize('large')}
              className={`flex items-center px-4 py-2 rounded-lg ${
                Object.values(preferences.cardSizes).every(size => size === 'large')
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="w-5 h-5 bg-current rounded mr-2"></div>
              {t('dashboard.settings.large', 'Grande')}
            </button>
          </div>
        </div>

        {/* Card Order and Visibility */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            {t('dashboard.settings.orderAndVisibility', 'Orden y Visibilidad de Tarjetas')}
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {t('dashboard.settings.orderDescription', 'Arrastra para reordenar las tarjetas. Haz clic en el ojo para mostrar/ocultar.')}
          </p>
          
          <div className="space-y-2">
            {preferences.cardOrder.map((cardId) => {
              const card = availableCards.find(c => c.id === cardId);
              if (!card) return null;
              
              const isHidden = preferences.hiddenCards.includes(cardId);
              const cardName = t(`dashboard.${cardId}.title`, cardId);

              return (
                <div
                  key={cardId}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, cardId)}
                  onDragOver={(e) => handleDragOver(e, cardId)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, cardId)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    if (isDragging) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  onMouseDown={(e) => {
                    // Permitir el drag solo si no es un click en el botón
                    if (e.target instanceof HTMLElement && e.target.closest('button')) {
                      return;
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 border-dashed bg-gray-700 cursor-move transition-all ${
                    draggedCard === cardId 
                      ? 'opacity-50 border-blue-500 cursor-move' 
                      : dragOverCard === cardId
                      ? 'border-blue-400 bg-gray-600 scale-105 cursor-move'
                      : 'border-gray-500 hover:border-gray-400 cursor-move'
                  }`}
                >
                  <div className="flex items-center flex-1 pointer-events-none">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-3" />
                    <span className={`${isHidden ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {cardName}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCardVisibility(cardId);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onDragStart={(e) => e.stopPropagation()}
                      className={`p-2 rounded transition-colors pointer-events-auto ${
                        isHidden ? 'text-gray-500 hover:text-gray-400' : 'text-blue-400 hover:text-blue-300'
                      }`}
                      title={isHidden ? t('dashboard.settings.show', 'Mostrar') : t('dashboard.settings.hide', 'Ocultar')}
                    >
                      {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
            
            {/* Mostrar tarjetas que no están en el orden */}
            {availableCards
              .filter(card => !preferences.cardOrder.includes(card.id))
              .map((card) => {
                const cardName = t(`dashboard.${card.id}.title`, card.id);
                return (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-3 rounded-lg border-2 border-solid border-gray-600 bg-gray-700 opacity-60"
                  >
                    <div className="flex items-center">
                      <span className="text-gray-500">{cardName}</span>
                      <span className="ml-2 text-xs text-gray-400">{t('dashboard.settings.notAvailable', '(No disponible)')}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end">
          <button
            onClick={resetToDefault}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('dashboard.settings.resetToDefault', 'Restaurar por Defecto')}
          </button>
        </div>
      </div>
    </div>
  );
}
