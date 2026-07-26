'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useI18n } from '@/contexts/I18nContext';
import Image from 'next/image';
import { 
  MapPin, 
  X, 
  CheckCircle,
  Star,
  Crown,
  RefreshCw
} from 'lucide-react';

// Caché en memoria para el item 96046 por idioma
const itemCache: Record<string, { data: { name: string; icon: string }; expiry: number }> = {};

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

// Hook para obtener el item 96046 con caché por idioma
function useChestItem(language: string) {
  const [item, setItem] = useState<{ name: string; icon: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = Date.now();
    const cached = itemCache[language];
    
    // Verificar caché para este idioma específico
    if (cached && cached.expiry > now) {
      setItem(cached.data);
      setLoading(false);
      return;
    }

    // Hacer la llamada solo si no hay caché válido para este idioma
    const fetchItem = async () => {
      try {
        const response = await fetch(
          `https://api.guildwars2.com/v2/items/96046?lang=${language}`,
          {
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const itemData = {
            name: data.name,
            icon: data.icon || ''
          };
          
          // Actualizar caché para este idioma
          itemCache[language] = {
            data: itemData,
            expiry: now + CACHE_TTL
          };
          
          setItem(itemData);
        }
      } catch (error) {
        console.error('Error fetching chest item:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [language]);

  return { item, loading };
}

interface Node {
  id: string;
  name: string;
  x: number; // Porcentaje desde la izquierda
  y: number; // Porcentaje desde arriba
  hubId: string;
  waypoint?: string;
  description?: string;
  type?: 'S' | 'M' | 'L'; // Tipo de nodo: Small, Medium, Large
}

interface Hub {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string; // Color de las líneas de conexión
  nodes: Node[];
}

interface MapConfig {
  id: 'castora' | 'shipwreck';
  name: string;
  imageSrc: string;
  missingPathHint: string;
  storageKey: string;
  hubs: Hub[];
}

// Eliminado contenido de recompensas; no se necesitan tipos/constantes de cofres

// Estructura de Hubs y Nodos para Castora
const castoraHubs: Hub[] = [
  {
    id: 'hub-1',
    name: 'Lost Basilica',
    x: 24,
    y: 30,
    color: '#DC143C', // Rojo (según imagen 2 - Lost Basilica tiene líneas rojas)
    nodes: [
      // 4 puntos 'S': alrededor del hub
      { id: 'node-1-1', name: 'Magic Mirror 1', x: 5, y: 29, hubId: 'hub-1', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-1-2', name: 'Magic Mirror 2', x: 30, y: 21, hubId: 'hub-1', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-1-3', name: 'Magic Mirror 3', x: 5, y: 44, hubId: 'hub-1', waypoint: '[&BAAIAAA=]', type: 'L' },
      { id: 'node-1-4', name: 'Magic Mirror 4', x: 30, y: 38, hubId: 'hub-1', waypoint: '[&BAAIAAA=]', type: 'M' },
      { id: 'node-1-5', name: 'Magic Mirror 5', x: 18, y: 38, hubId: 'hub-1', waypoint: '[&BAAIAAA=]', type: 'M' },
    ]
  },
  {
    id: 'hub-2',
    name: 'Untamed Crags',
    x: 50,
    y: 25,
    color: '#32CD32', // Verde (según imagen 2)
    nodes: [
      { id: 'node-2-1', name: 'Magic Mirror 6', x: 35, y: 18, hubId: 'hub-2', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-2-2', name: 'Magic Mirror 7', x: 50, y: 13, hubId: 'hub-2', waypoint: '[&BAAIAAA=]', type: 'M' },
      { id: 'node-2-3', name: 'Magic Mirror 8', x: 59, y: 15, hubId: 'hub-2', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-2-4', name: 'Magic Mirror 9', x: 58, y: 40, hubId: 'hub-2', waypoint: '[&BAAIAAA=]', type: 'M' },
      { id: 'node-2-5', name: 'Magic Mirror 10', x: 45, y: 43, hubId: 'hub-2', waypoint: '[&BAAIAAA=]', type: 'L' },
      { id: 'node-2-6', name: 'Magic Mirror 11', x: 36, y: 43, hubId: 'hub-2', waypoint: '[&BAAIAAA=]', type: 'S' },

    ]
  },
  {
    id: 'hub-3',
    name: 'Command Complex',
    x: 75,
    y: 23,
    color: '#FF5300', // Naranja/Rojo (según imagen 2)
    nodes: [
      { id: 'node-3-1', name: 'Magic Mirror 11', x: 66, y: 28, hubId: 'hub-3', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-3-2', name: 'Magic Mirror 12', x: 65, y: 13, hubId: 'hub-3', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-3-3', name: 'Magic Mirror 13', x: 90, y: 40, hubId: 'hub-3', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-3-4', name: 'Magic Mirror 15', x: 90, y: 27, hubId: 'hub-3', waypoint: '[&BAAIAAA=]', type: 'L' },
      { id: 'node-3-5', name: 'Magic Mirror 16', x: 74, y: 31, hubId: 'hub-3', waypoint: '[&BAAIAAA=]', type: 'M' },
      { id: 'node-3-6', name: 'Magic Mirror 17', x: 82, y: 35, hubId: 'hub-3', waypoint: '[&BAAIAAA=]', type: 'M' },
    ]
  },
  {
    id: 'hub-4',
    name: 'Cloister of Stars',
    x: 25,
    y: 53,
    color: '#9370DB', // Morado (según imagen 2)
    nodes: [
      { id: 'node-4-1', name: 'Magic Mirror 16', x: 8, y: 47, hubId: 'hub-4', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-4-2', name: 'Magic Mirror 17', x: 29, y: 44, hubId: 'hub-4', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-4-3', name: 'Magic Mirror 18', x: 19, y: 55, hubId: 'hub-4', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-4-4', name: 'Magic Mirror 18', x: 18, y: 44, hubId: 'hub-4', waypoint: '[&BAAIAAA=]', type: 'M' },
      { id: 'node-4-5', name: 'Magic Mirror 19', x: 16, y: 62, hubId: 'hub-4', waypoint: '[&BAAIAAA=]', type: 'M' },
      { id: 'node-4-6', name: 'Magic Mirror 20', x: 6, y: 55, hubId: 'hub-4', waypoint: '[&BAAIAAA=]', type: 'L' },
      { id: 'node-4-7', name: 'Magic Mirror 21', x: 28, y: 64, hubId: 'hub-4', waypoint: '[&BAAIAAA=]', type: 'S' },

    ]
  },
  {
    id: 'hub-5',
    name: 'Crumbling Precipice',
    x: 35,
    y: 50,
    color: '#DC143C', // Rojo (según imagen 2)
    nodes: [
      { id: 'node-5-1', name: 'Magic Mirror 21', x: 35, y: 65, hubId: 'hub-5', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-5-2', name: 'Magic Mirror 22', x: 50, y: 65, hubId: 'hub-5', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-5-3', name: 'Magic Mirror 23', x: 50, y: 55, hubId: 'hub-5', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-5-4', name: 'Magic Mirror 24', x: 51, y: 47, hubId: 'hub-5', waypoint: '[&BAAIAAA=]', type: 'S' },
    ]
  },
  {
    id: 'hub-6',
    name: 'Overgrown Thicket',
    x: 9,
    y: 70,
    color: '#FFD700', // Amarillo (según imagen 2)
    nodes: [
      { id: 'node-6-1', name: 'Magic Mirror 26', x: 5, y: 75, hubId: 'hub-6', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-6-2', name: 'Magic Mirror 27', x: 24, y: 73, hubId: 'hub-6', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-6-3', name: 'Magic Mirror 28', x: 16, y: 88, hubId: 'hub-6', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-6-4', name: 'Magic Mirror 29', x: 29, y: 82, hubId: 'hub-6', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-6-5', name: 'Magic Mirror 30', x: 17, y: 78, hubId: 'hub-6', waypoint: '[&BAAIAAA=]', type: 'M' },
      { id: 'node-6-6', name: 'Magic Mirror 31', x: 29, y: 88, hubId: 'hub-6', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-6-7', name: 'Magic Mirror 32', x: 9.5, y: 87, hubId: 'hub-6', waypoint: '[&BAAIAAA=]', type: 'L' },
    ]
  },
  {
    id: 'hub-7',
    name: 'Tranquil Glen',
    x: 53,
    y: 59,
    color: '#FFFFFF', // Blanco (según imagen 2)
    nodes: [
      { id: 'node-7-1', name: 'Magic Mirror 31', x: 60, y: 68, hubId: 'hub-7', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-7-2', name: 'Magic Mirror 32', x: 81, y: 59, hubId: 'hub-7', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-7-3', name: 'Magic Mirror 33', x: 69, y: 60, hubId: 'hub-7', waypoint: '[&BAAIAAA=]', type: 'M' },
      { id: 'node-7-4', name: 'Magic Mirror 34', x: 70, y: 62, hubId: 'hub-7', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-7-5', name: 'Magic Mirror 35', x: 77, y: 48, hubId: 'hub-7', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-7-6', name: 'Magic Mirror 36', x: 67, y: 48, hubId: 'hub-7', waypoint: '[&BAAIAAA=]', type: 'M' },
    ]
  },
  {
    id: 'hub-8',
    name: 'Skyshroud Canopy',
    x: 42,
    y: 78,
    color: '#FF69B4', // Rosa (según imagen 2)
    nodes: [
      { id: 'node-8-1', name: 'Magic Mirror 36', x: 31, y: 89, hubId: 'hub-8', waypoint: '[&BAAIAAA=]', type: 'M' },
      { id: 'node-8-2', name: 'Magic Mirror 37', x: 53, y: 76, hubId: 'hub-8', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-8-3', name: 'Magic Mirror 38', x: 55, y: 84, hubId: 'hub-8', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-8-4', name: 'Magic Mirror 39', x: 55, y: 72, hubId: 'hub-8', waypoint: '[&BAAIAAA=]', type: 'M' },
      { id: 'node-8-5', name: 'Magic Mirror 40', x: 42, y: 87, hubId: 'hub-8', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-8-6', name: 'Magic Mirror 41', x: 30, y: 71, hubId: 'hub-8', waypoint: '[&BAAIAAA=]', type: 'S' },

    ]
  },
  {
    id: 'hub-9',
    name: 'Shimmering Basin',
    x: 60,
    y: 82,
    color: '#87CEEB', // Azul claro (según imagen 2)
    nodes: [
      { id: 'node-9-1', name: 'Magic Mirror 41', x: 65, y: 75, hubId: 'hub-9', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-9-2', name: 'Magic Mirror 42', x: 80, y: 79, hubId: 'hub-9', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-9-3', name: 'Magic Mirror 43', x: 76, y: 88, hubId: 'hub-9', waypoint: '[&BAAIAAA=]', type: 'S' },
    ]
  },
  {
    id: 'hub-10',
    name: 'Enchanting Grottoes',
    x: 92,
    y: 56,
    color: '#ADFF2F', // Verde-amarillo (según imagen 2)
    nodes: [
      { id: 'node-10-1', name: 'Magic Mirror 46', x: 89, y: 62, hubId: 'hub-10', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-10-2', name: 'Magic Mirror 47', x: 82, y: 51, hubId: 'hub-10', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-10-3', name: 'Magic Mirror 48', x: 82, y: 59, hubId: 'hub-10', waypoint: '[&BAAIAAA=]' }, 
    ]
  },
];

// Estructura de Hubs y Nodos para Shipwreck Strand
const shipwreckHubs: Hub[] = [
  {
    id: 'hub-shipwreck-1',
    name: 'Shipwreck Strand',
    x: 50,
    y: 54,
    color: '#87CEEB', // Azul claro (según descripción de la imagen)
    nodes: [
      // 6 nodos secundarios conectados al hub central
      { id: 'node-shipwreck-1-1', name: 'Magic Mirror 1', x: 49, y: 47, hubId: 'hub-shipwreck-1', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-1-2', name: 'Magic Mirror 2', x: 63, y: 39, hubId: 'hub-shipwreck-1', waypoint: '[&BAAIAAA=]', type: 'S' }, // Noreste (en pequeña isla)
      { id: 'node-shipwreck-1-3', name: 'Magic Mirror 3', x: 70, y: 52, hubId: 'hub-shipwreck-1', waypoint: '[&BAAIAAA=]', type: 'S' }, // Este (en el agua, cerca de la costa)
      { id: 'node-shipwreck-1-4', name: 'Magic Mirror 4', x: 62, y: 62, hubId: 'hub-shipwreck-1', waypoint: '[&BAAIAAA=]', type: 'S' }, // Suroeste (en pequeña isla)
    ]
  },
  {
    id: 'hub-shipwreck-2',
    name: 'Coral Bay',
    x: 38,
    y: 42,
    color: '#32CD32', // Verde
    nodes: [
      { id: 'node-shipwreck-2-1', name: 'Magic Mirror 7', x: 26, y: 30, hubId: 'hub-shipwreck-2', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-shipwreck-2-3', name: 'Magic Mirror 9', x: 35, y: 33, hubId: 'hub-shipwreck-2', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-shipwreck-2-4', name: 'Magic Mirror 10', x: 30, y: 40, hubId: 'hub-shipwreck-2', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-shipwreck-2-5', name: 'Magic Mirror 11', x: 33, y: 54, hubId: 'hub-shipwreck-2', waypoint: '[&BAAIAAA=]', type: 'M' },
      { id: 'node-shipwreck-2-6', name: 'Magic Mirror 12', x: 41, y: 44, hubId: 'hub-shipwreck-2', waypoint: '[&BAAIAAA=]', type: 'S' },
      { id: 'node-shipwreck-2-7', name: 'Magic Mirror 13', x: 43, y: 54, hubId: 'hub-shipwreck-2', waypoint: '[&BAAIAAA=]', type: 'L' },
    ]
  },
  {
    id: 'hub-shipwreck-3',
    name: 'Shipwreck Strand',
    x: 25,
    y: 60,
    color: '#FF69B4', // Rosado (según descripción de la imagen)
    nodes: [
      { id: 'node-shipwreck-3-1', name: 'Magic Mirror 14', x: 47, y: 57, hubId: 'hub-shipwreck-3', waypoint: '[&BAAIAAA=]', type: 'M' }, // Norte
      { id: 'node-shipwreck-3-2', name: 'Magic Mirror 15', x: 47, y: 64, hubId: 'hub-shipwreck-3', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-3-3', name: 'Magic Mirror 16', x: 47, y: 72, hubId: 'hub-shipwreck-3', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-3-4', name: 'Magic Mirror 17', x: 37, y: 73, hubId: 'hub-shipwreck-3', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-3-5', name: 'Magic Mirror 18', x: 29, y: 74, hubId: 'hub-shipwreck-3', waypoint: '[&BAAIAAA=]', type: 'L' }, // Norte
    ]
  },
  {
    id: 'hub-shipwreck-4',
    name: 'Shipwreck Strand',
    x: 31,
    y: 78,
    color: '#32CD32', // Verde (según descripción de la imagen)
    nodes: [
      { id: 'node-shipwreck-4-1', name: 'Magic Mirror 19', x: 22, y: 79, hubId: 'hub-shipwreck-4', waypoint: '[&BAAIAAA=]', type: 'M' }, // Norte
      { id: 'node-shipwreck-4-2', name: 'Magic Mirror 20', x: 26, y: 85, hubId: 'hub-shipwreck-4', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-4-3', name: 'Magic Mirror 21', x: 31, y: 93, hubId: 'hub-shipwreck-4', waypoint: '[&BAAIAAA=]', type: 'M' }, // Norte
      { id: 'node-shipwreck-4-4', name: 'Magic Mirror 22', x: 47, y: 77, hubId: 'hub-shipwreck-4', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
    ]
  },
  {
    id: 'hub-shipwreck-5',
    name: 'Shipwreck Strand',
    x: 67,
    y: 69,
    color: '#FFD700', // Amarillo (según descripción de la imagen)
    nodes: [
      { id: 'node-shipwreck-5-1', name: 'Magic Mirror 23', x: 51, y: 74, hubId: 'hub-shipwreck-5', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-5-2', name: 'Magic Mirror 24', x: 56, y: 65, hubId: 'hub-shipwreck-5', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-5-3', name: 'Magic Mirror 25', x: 62, y: 80, hubId: 'hub-shipwreck-5', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
    ]
  },
  {
    id: 'hub-shipwreck-6',
    name: 'Shipwreck Strand',
    x: 83,
    y: 85,
    color: '#FFFFFF', // Blanco (según descripción de la imagen)
    nodes: [
      { id: 'node-shipwreck-6-1', name: 'Magic Mirror 26', x: 76, y: 71, hubId: 'hub-shipwreck-6', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-6-2', name: 'Magic Mirror 27', x: 76, y: 75, hubId: 'hub-shipwreck-6', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-6-3', name: 'Magic Mirror 28', x: 61, y: 81, hubId: 'hub-shipwreck-6', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-6-4', name: 'Magic Mirror 29', x: 59, y: 91, hubId: 'hub-shipwreck-6', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-6-5', name: 'Magic Mirror 30', x: 69, y: 96, hubId: 'hub-shipwreck-6', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
    ]
  },
  {
    id: 'hub-shipwreck-7',
    name: 'Shipwreck Strand',
    x: 30,
    y: 15,
    color: '#CEB7ED', // Blanco (según descripción de la imagen)
    nodes: [
      { id: 'node-shipwreck-7-1', name: 'Magic Mirror 31', x: 32, y: 23, hubId: 'hub-shipwreck-7', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-7-2', name: 'Magic Mirror 32', x: 24, y: 22, hubId: 'hub-shipwreck-7', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-7-3', name: 'Magic Mirror 33', x: 25, y: 10, hubId: 'hub-shipwreck-7', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
    ]
  },
  {
    id: 'hub-shipwreck-8',
    name: 'Shipwreck Strand',
    x: 48,
    y: 9,
    color: '#0F5691', // Blanco (según descripción de la imagen)
    nodes: [
      { id: 'node-shipwreck-8-1', name: 'Magic Mirror 34', x: 37, y: 11, hubId: 'hub-shipwreck-8', waypoint: '[&BAAIAAA=]', type: 'M' }, // Norte
      { id: 'node-shipwreck-8-2', name: 'Magic Mirror 35', x: 39, y: 22, hubId: 'hub-shipwreck-8', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-8-3', name: 'Magic Mirror 36', x: 46, y: 22, hubId: 'hub-shipwreck-8', waypoint: '[&BAAIAAA=]', type: 'M' }, // Norte
      { id: 'node-shipwreck-8-4', name: 'Magic Mirror 37', x: 53, y: 24, hubId: 'hub-shipwreck-8', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-8-5', name: 'Magic Mirror 38', x: 58, y: 11, hubId: 'hub-shipwreck-8', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
    ]
  },
  {
    id: 'hub-shipwreck-9',
    name: 'Shipwreck Strand',
    x: 78,
    y: 13,
    color: '#0F9123', // Blanco (según descripción de la imagen)
    nodes: [
      { id: 'node-shipwreck-9-1', name: 'Magic Mirror 39', x: 64, y: 13, hubId: 'hub-shipwreck-9', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-9-2', name: 'Magic Mirror 40', x: 61, y: 25, hubId: 'hub-shipwreck-9', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-9-3', name: 'Magic Mirror 41', x: 68, y: 26, hubId: 'hub-shipwreck-9', waypoint: '[&BAAIAAA=]', type: 'M' }, // Norte
      { id: 'node-shipwreck-9-4', name: 'Magic Mirror 42', x: 64, y: 35, hubId: 'hub-shipwreck-9', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
      { id: 'node-shipwreck-9-5', name: 'Magic Mirror 43', x: 71, y: 34, hubId: 'hub-shipwreck-9', waypoint: '[&BAAIAAA=]', type: 'L' }, // Norte
      { id: 'node-shipwreck-9-6', name: 'Magic Mirror 44', x: 84, y: 30, hubId: 'hub-shipwreck-9', waypoint: '[&BAAIAAA=]', type: 'M' }, // Norte
      { id: 'node-shipwreck-9-7', name: 'Magic Mirror 45', x: 77, y: 10, hubId: 'hub-shipwreck-9', waypoint: '[&BAAIAAA=]', type: 'S' }, // Norte
    ]
  },
];

// Configs de mapas (Shipwreck Strand inicia vacío para rellenar luego)
const mapConfigs: MapConfig[] = [
  {
    id: 'castora',
    name: 'Castora',
    imageSrc: '/images/backgrounds/castora-map.webp',
    missingPathHint: '/public/images/backgrounds/castora-map.webp',
    storageKey: 'magicMirrors_completed',
    hubs: castoraHubs,
  },
  {
    id: 'shipwreck',
    name: 'Shipwreck Strand',
    imageSrc: '/images/backgrounds/shipwreck-strand-map.webp',
    missingPathHint: '/public/images/backgrounds/shipwreck-strand-map.webp',
    storageKey: 'magicMirrors_shipwreck_completed',
    hubs: shipwreckHubs,
  },
];

export default function MagicMirrorsPage() {
  usePageTitle('pageTitles.magicMirrors', 'Magic Mirrors');
  const { t, lang } = useI18n();
  const { item: chestItem } = useChestItem(lang);
  const [selectedMapId, setSelectedMapId] = useState<MapConfig['id']>('castora');
  const selectedMap = mapConfigs.find(m => m.id === selectedMapId)!;
  const hubs = selectedMap.hubs;
  const allNodes = hubs.flatMap(hub => hub.nodes);
  
  // Ref para el contenedor del mapa para calcular posiciones correctas
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Obtener el nombre traducido del mapa
  const getMapName = (mapId: string) => {
    if (mapId === 'castora') {
      return t('magicMirrors.maps.starlitWeald', 'Starlit Weald');
    }
    if (mapId === 'shipwreck') {
      return t('magicMirrors.maps.shipwreckStrand', 'Shipwreck Strand');
    }
    return selectedMap.name;
  };
  
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [copiedWaypoint, setCopiedWaypoint] = useState<string | null>(null);
  const [showInfo] = useState(false);
  const [mapImageError, setMapImageError] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Cargar estado guardado desde localStorage por mapa
  useEffect(() => {
    const saved = localStorage.getItem(selectedMap.storageKey);
    if (saved) {
      try {
        const savedIds = JSON.parse(saved);
        setCompletedNodes(new Set(savedIds));
      } catch (e) {
        console.error('Error loading saved state:', e);
      }
    }
  }, [selectedMap.storageKey]);

  // Guardar estado en localStorage cuando cambie (para el mapa actual)
  useEffect(() => {
    localStorage.setItem(selectedMap.storageKey, JSON.stringify(Array.from(completedNodes)));
  }, [completedNodes, selectedMap.storageKey]);

  const toggleNode = (nodeId: string) => {
    setCompletedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const resetAll = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    setCompletedNodes(new Set());
    localStorage.removeItem(selectedMap.storageKey);
    setShowResetModal(false);
  };

  const copyWaypoint = async (waypoint: string) => {
    try {
      await navigator.clipboard.writeText(waypoint);
      setCopiedWaypoint(waypoint);
      setTimeout(() => setCopiedWaypoint(null), 2000);
    } catch (err) {
      console.error('Error al copiar waypoint:', err);
    }
  };

  const handleNodeClick = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation();
    // Solo click: marcar o desmarcar
    toggleNode(node.id);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg flex items-center justify-center">
                <Crown className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-center">
                <span className="text-white">{t('pageTitles.magicMirrors', 'Magic Mirrors')} - {getMapName(selectedMapId)}</span>
              </h1>
            </div>
            {/* Selector de mapa */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={() => setSelectedMapId('castora')}
                className={`px-3 py-1.5 rounded-lg text-sm border ${selectedMapId==='castora' ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-800 text-gray-300 border-slate-600 hover:bg-slate-700'}`}
              >
                {getMapName('castora')}
              </button>
              <button
                onClick={() => setSelectedMapId('shipwreck')}
                className={`px-3 py-1.5 rounded-lg text-sm border ${selectedMapId==='shipwreck' ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-800 text-gray-300 border-slate-600 hover:bg-slate-700'}`}
              >
                {getMapName('shipwreck')}
              </button>
            </div>
            <div className="text-center text-sm text-gray-400">
              <p>{t('magicMirrors.clickNode', 'Haz clic en un nodo para marcar o desmarcar como completado.')}</p>
              <p className="mt-1">
                {(() => {
                  const progressText = t('magicMirrors.progress', 'Progreso: {completed} / {total} completados');
                  const parts = progressText.split('{completed}');
                  if (parts.length === 2) {
                    const [before, after] = parts;
                    const afterParts = after.split('{total}');
                    if (afterParts.length === 2) {
                      return (
                        <>
                          {before}
                          <span className="text-purple-400 font-semibold">{completedNodes.size}</span>
                          {afterParts[0]}
                          <span className="text-gray-400">{allNodes.length}</span>
                          {afterParts[1]}
                        </>
                      );
                    }
                  }
                  return progressText.replace('{completed}', String(completedNodes.size)).replace('{total}', String(allNodes.length));
                })()}
              </p>
            </div>
          </motion.div>

          {/* Mapa interactivo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-purple-400" />
                  {t('magicMirrors.interactiveMap', 'Mapa Interactivo')}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetAll}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t('magicMirrors.reset', 'Resetear')}
                  </button>
                </div>
              </div>

              {/* Contenedor del mapa */}
              <div 
                ref={mapContainerRef}
                className="relative bg-slate-900/50 rounded-lg border border-slate-700/50" 
                style={{ 
                  minHeight: '1100px', 
                  aspectRatio: 'auto', 
                  overflow: 'visible',
                  // Asegurar que el contenedor mantenga su tamaño relativo al viewport
                  width: '100%',
                  position: 'relative',
                  // Prevenir que el zoom del navegador afecte las posiciones
                  transformOrigin: 'top left'
                }}
              >
                {/* Imagen del mapa de fondo */}
                <div className="absolute inset-0 overflow-hidden rounded-lg" style={{ width: '100%', height: '100%' }}>
                  {!mapImageError ? (
                    <Image
                      src={selectedMap.imageSrc}
                      alt={`Mapa de ${selectedMap.name}`}
                      fill
                      className="object-contain"
                      sizes="100vw"
                      priority
                      quality={90}
                      onError={() => setMapImageError(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-900/30 via-slate-800 to-green-900/30">
                      <div className="text-center text-gray-600">
                        <MapPin className="w-32 h-32 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">Mapa de {selectedMap.name}</p>
                        <p className="text-sm mt-2">Coloca la imagen del mapa en: {selectedMap.missingPathHint}</p>
                        <p className="text-xs mt-2 text-gray-500">Formatos soportados: .jpg, .png, .webp</p>
                      </div>
                    </div>
                  )}
                  {/* Overlay sutil para mejorar contraste de los puntos */}
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>

                {/* Líneas de conexión entre hubs y nodos */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none" 
                  style={{ zIndex: 1 }}
                  preserveAspectRatio="none"
                >
                  {hubs.map(hub => (
                    hub.nodes.map(node => (
                      <line
                        key={`line-${hub.id}-${node.id}`}
                        x1={`${hub.x}%`}
                        y1={`${hub.y}%`}
                        x2={`${node.x}%`}
                        y2={`${node.y}%`}
                        stroke={hub.color}
                        strokeWidth="3"
                        opacity="0.9"
                      />
                    ))
                  ))}
                </svg>

                {/* Hubs (puntos centrales) */}
                {hubs.map((hub) => (
                  <motion.div
                    key={hub.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${hub.x}%`,
                      top: `${hub.y}%`,
                      zIndex: 3,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {/* Icono del hub con imagen de Magic Mirror - centrado en el punto de conexión de las líneas */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center shadow-lg">
                      <Image
                        src="https://wiki.guildwars2.com/images/1/1d/Magic_Mirror.png"
                        alt="Magic Mirror"
                        width={32}
                        height={32}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    </div>
                    {/* Label del hub */}
                    {showInfo && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none border border-gray-700">
                        {hub.name}
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Nodos (Magic Mirrors) */}
                {allNodes.map((node) => {
                  const isCompleted = completedNodes.has(node.id);
                  const hub = hubs.find(h => h.id === node.hubId);
                  
                  // Calcular posición de la letra más cerca del final de la línea
                  let letterX = node.x;
                  let letterY = node.y;
                  
                  if (hub) {
                    const dx = node.x - hub.x;
                    const dy = node.y - hub.y;
                    
                    // Posicionar la letra exactamente al final de la línea (100% desde el hub hacia el nodo)
                    // Esto la coloca exactamente donde termina la línea SVG
                    const letterPosition = 1.03;
                    letterX = hub.x + (dx * letterPosition);
                    letterY = hub.y + (dy * letterPosition);
                  }
                  
                  return [
                    // Letra S, M, L posicionada más cerca del final de la línea
                    !isCompleted && node.type && (
                      <div
                        key={`letter-${node.id}`}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{
                          left: `${letterX}%`,
                          top: `${letterY}%`,
                          zIndex: 2,
                        }}
                      >
                        <span className="text-xs font-bold text-yellow-400">
                          {node.type}
                        </span>
                      </div>
                    ),
                    // Botón del nodo (en la misma posición que la letra)
                    <motion.button
                      key={node.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                      style={{
                        left: `${letterX}%`,
                        top: `${letterY}%`,
                        zIndex: 2,
                        minWidth: '24px',
                        minHeight: '24px',
                      }}
                      onClick={(e) => handleNodeClick(node, e)}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {/* Nodo sin etiqueta S, M, L */}
                      <div className={`rounded-full transition-all flex items-center justify-center relative ${
                        isCompleted 
                          ? 'w-6 h-6 bg-purple-500 border-2 border-purple-300 shadow-lg shadow-purple-500/50' 
                          : 'w-0 h-0 bg-transparent'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <>
                            {/* Chevron hacia abajo si no tiene tipo definido */}
                            {!node.type && (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" fill="none" className="text-yellow-400" />
                              </svg>
                            )}
                          </>
                        )}
                      </div>
                      {/* Tooltip */}
                      {showInfo && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-700">
                          {node.name} {node.type && `(${node.type})`} {isCompleted && '✓'}
                        </div>
                      )}
                    </motion.button>
                  ].filter(Boolean);
                })}
              </div>

              {/* Leyenda */}
              <div className="mt-4">
                <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6">
                      <Image
                        src="https://wiki.guildwars2.com/images/1/1d/Magic_Mirror.png"
                        alt="Magic Mirror"
                        width={24}
                        height={24}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    </div>
                    <span>{t('magicMirrors.legend.hub', 'Hub (Punto Central)')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-300"></div>
                    <span>{(() => {
                      const text = t('magicMirrors.legend.notCompleted', 'Magic Mirror (No completado)');
                      const mirrorText = t('magicMirrors.magicMirror', 'Magic Mirror');
                      return text.replace('{magicMirror}', mirrorText);
                    })()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded-full border-2 border-purple-300"></div>
                    <span>{(() => {
                      const text = t('magicMirrors.legend.completed', 'Magic Mirror (Completado)');
                      const mirrorText = t('magicMirrors.magicMirror', 'Magic Mirror');
                      return text.replace('{magicMirror}', mirrorText);
                    })()}</span>
                  </div>
                </div>
                <div className="text-sm text-yellow-400 font-semibold flex flex-col gap-1">
                  {t('magicMirrors.legend.typeNote', 'L = Grande (da 8), S = Pequeño (da 1-3), M = Mediano (da 4-6)')
                    .split(', ')
                    .map((item, index) => {
                      const match = item.match(/^(.+?)\s+\((\w+)\s+([^)]+)\)$/);
                      
                      if (match) {
                        const [, typePart, verbPart, quantityPart] = match;
                        
                        return (
                          <span key={index} className="flex items-center gap-2">
                            <span>{typePart} ({verbPart} {quantityPart}</span>
                            {chestItem && (
                              <>
                                <Image
                                  src={chestItem.icon}
                                  alt={chestItem.name}
                                  width={16}
                                  height={16}
                                  className="w-4 h-4"
                                  unoptimized
                                />
                                <span>{chestItem.name})</span>
                              </>
                            )}
                            {!chestItem && <span>)</span>}
                          </span>
                        );
                      }
                      
                      // Fallback si no coincide el patrón
                      return (
                        <span key={index} className="flex items-center gap-2">
                          <span>{item}</span>
                        </span>
                      );
                    })}
                </div>
              </div>
            </div>
          </motion.div>


          {/* Secciones informativas eliminadas a solicitud */}
        </div>
      </div>

    {/* Modal de confirmación para Resetear */}
    <AnimatePresence>
      {showResetModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowResetModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowResetModal(false)}
          >
            <div
              className="bg-slate-800 rounded-xl shadow-xl max-w-sm w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white">{t('magicMirrors.resetProgress', 'Resetear progreso')}</h3>
                <p className="text-sm text-gray-300 mt-2">{t('magicMirrors.resetConfirmMessage', '¿Seguro que quieres resetear todo el progreso de Magic Mirrors?')}</p>
              </div>
              <div className="p-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-600 text-gray-200 hover:bg-slate-700 transition-colors text-sm"
                >
                  {t('common.cancel', 'Cancelar')}
                </button>
                <button
                  onClick={confirmReset}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm flex items-center gap-2"
                >
                  {t('magicMirrors.confirm', 'Confirmar')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

      {/* Modal de detalles del nodo */}
      <AnimatePresence>
        {selectedNode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setSelectedNode(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedNode(null)}
            >
              <div
                className="bg-slate-800 rounded-xl shadow-xl max-w-md w-full border border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      completedNodes.has(selectedNode.id) 
                        ? 'bg-purple-500' 
                        : 'bg-yellow-400'
                    }`}>
                      {completedNodes.has(selectedNode.id) ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Star className="w-5 h-5 text-yellow-800" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{selectedNode.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{t('magicMirrors.modal.hub', 'Hub:')}</p>
                    <p className="text-gray-300">{hubs.find(h => h.id === selectedNode.hubId)?.name}</p>
                  </div>
                  {selectedNode.waypoint && (
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">{t('magicMirrors.modal.waypoint', 'Waypoint')}</p>
                          <p className="text-purple-400 font-mono text-sm">{selectedNode.waypoint}</p>
                        </div>
                        <button
                          onClick={() => copyWaypoint(selectedNode.waypoint!)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                        >
                          {copiedWaypoint === selectedNode.waypoint ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              {t('magicMirrors.modal.copied', 'Copiado')}
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4" />
                              {t('magicMirrors.modal.copy', 'Copiar')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-700/30">
                    <p className="text-sm text-gray-300">
                      <strong className="text-purple-400">{t('magicMirrors.modal.rewards', 'Recompensas:')}</strong> {t('magicMirrors.modal.rewardsDescription', 'Al completar el mini-juego, obtienes un Long-Lost Keepsake Box y múltiples Obscured Chests en el área.')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      toggleNode(selectedNode.id);
                      setSelectedNode(null);
                    }}
                    className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      completedNodes.has(selectedNode.id)
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {completedNodes.has(selectedNode.id) ? (
                      <>
                        <X className="w-4 h-4" />
                        {t('magicMirrors.modal.markAsNotCompleted', 'Marcar como No Completado')}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {t('magicMirrors.modal.markAsCompleted', 'Marcar como Completado')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
