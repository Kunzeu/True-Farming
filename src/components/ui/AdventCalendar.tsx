"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { getAuthHeaders, isUsableAuthToken } from "@/lib/auth-client";
import Link from "next/link";
import { Crown, AlertCircle, Users, Trophy, Gift } from "lucide-react";

interface AdventDay {
  day: number;
  date: Date;
  isAvailable: boolean;
  isClosed: boolean;
  isParticipated: boolean;
  giveawayId?: string;
  participantCount?: number;
  winners?: Array<{
    position: number;
    accountName: string;
    itemIcon?: string;
    gemPrize?: boolean;
  }>;
  prizes?: Array<{
    itemId?: number;
    quantity?: number;
    gemPrize?: boolean;
    itemIcon?: string;
  }>;
}

interface AdventCalendarProps {
  year?: number;
  month?: number; // 11 = diciembre
  className?: string;
}

export default function AdventCalendar({
  year = 2025,
  month = 11, // Diciembre
  className = ""
}: AdventCalendarProps) {
  const { isAuthenticated, user, token } = useAuth();
  const { t } = useI18n();
  const [adventDays, setAdventDays] = useState<AdventDay[]>([]);
  const [participatedDays, setParticipatedDays] = useState<Set<string>>(new Set());
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [accountInfo, setAccountInfo] = useState<{ id: string; name: string } | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [giveaways, setGiveaways] = useState<Record<string, {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    participantCount: number;
    prizes: Array<{
      itemId?: number;
      quantity?: number;
      gemPrize?: boolean;
      itemIcon?: string;
    }>;
  }>>({});
  const [winners, setWinners] = useState<Record<string, Array<{ position: number; accountName: string }>>>({});
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(true);
  const [isLoadingParticipations, setIsLoadingParticipations] = useState(true);
  const [isSelectingWinners, setIsSelectingWinners] = useState(false);
  const [showSelectWinnersModal, setShowSelectWinnersModal] = useState(false);
  const [showWinnersResultModal, setShowWinnersResultModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedWinners, setSelectedWinners] = useState<Array<{
    giveaway_id: string;
    user_id: string;
    account_name: string;
    position: number;
    prize_description: string;
    prize_value: string;
    item_id?: number | null;
    quantity?: number | null;
    gem_prize?: boolean;
    item_icon?: string | null;
  }>>([]);
  const [giveawayToSelectWinners, setGiveawayToSelectWinners] = useState<string | null>(null);


  // Cargar sorteos (Configuración Estática + Conteos Dinámicos)
  useEffect(() => {
    let isMounted = true;

    // 1. Cargar Configuración Estática (IDs, Fechas, Premios, Imágenes)
    const loadGiveawaysConfig = async () => {
      try {
        const CONFIG_CACHE_KEY = 'giveaways_config_cache_v1';
        const CONFIG_CACHE_TIME = 'giveaways_config_time';
        const CACHE_DURATION = 300000; // 5 minutos

        const cachedData = localStorage.getItem(CONFIG_CACHE_KEY);
        const cachedTime = localStorage.getItem(CONFIG_CACHE_TIME);

        if (cachedData && cachedTime) {
          const timeDiff = Date.now() - parseInt(cachedTime);
          if (timeDiff < CACHE_DURATION) {
            const data = JSON.parse(cachedData);
            processGiveawaysData(data.giveaways);
            return;
          }
        }

        const response = await fetch("/api/giveaways");
        if (response.ok && isMounted) {
          const data = await response.json();
          localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(CONFIG_CACHE_TIME, Date.now().toString());
          processGiveawaysData(data.giveaways);
        }
      } catch (error) {
        console.error("Error loading giveaways config:", error);
      }
    };

    // Helper para procesar la data y setear estado
    const processGiveawaysData = (giveawaysList: any[]) => {
      const giveawaysMap: Record<string, any> = {};
      giveawaysList?.forEach((giveaway: any) => {
        if (giveaway.id.startsWith('advent-')) {
          giveawaysMap[giveaway.id] = {
            ...giveaway,
            participantCount: 0, // Inicializar en 0, luego se llena con dinámica
          };
        }
      });
      setGiveaways(prev => {
        const newState = { ...prev };
        Object.keys(giveawaysMap).forEach(key => {
          newState[key] = {
            ...newState[key], // Mantener datos previos (counts) si existen
            ...giveawaysMap[key], // Actualizar config
            participantCount: newState[key]?.participantCount || 0
          };
        });
        return newState;
      });
    };

    // 2. Cargar Datos Dinámicos (Conteos, Estado real)
    // Esto se hace cada 10 minutos para reducir invocations
    const loadGiveawaysCounts = async () => {
      // Si la pestaña no está visible, no hacemos poll
      if (document.hidden) return;

      try {
        // Cache local más largo (20 min) alineado con intervalo para reducir invocations
        const COUNTS_CACHE_KEY = 'giveaways_counts_cache';
        const COUNTS_CACHE_TIME = 'giveaways_counts_time';
        const COUNTS_DURATION = 60000; // 1 minuto

        const cachedData = localStorage.getItem(COUNTS_CACHE_KEY);
        const cachedTime = localStorage.getItem(COUNTS_CACHE_TIME);
        const now = Date.now();

        if (cachedData && cachedTime) {
          const timeDiff = now - parseInt(cachedTime);
          if (timeDiff < COUNTS_DURATION) {
            const data = JSON.parse(cachedData);
            updateGiveawaysWithCounts(data.data);
            return;
          }
        }

        // Usar cache del navegador (el endpoint tiene s-maxage=120)
        const response = await fetch("/api/giveaways/counts");
        if (response.ok && isMounted) {
          const data = await response.json();
          // data.data es { 'id': { status: 'active', count: 123 } }

          localStorage.setItem(COUNTS_CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(COUNTS_CACHE_TIME, now.toString());

          updateGiveawaysWithCounts(data.data);
        }
      } catch (error) {
        console.error("Error loading giveaway counts:", error);
      }
    };

    const updateGiveawaysWithCounts = (countsData: Record<string, { status: string; count: number }>) => {
      setGiveaways(prev => {
        const newState = { ...prev };
        let hasChanges = false;

        Object.keys(countsData).forEach(id => {
          if (newState[id]) {
            const newCount = countsData[id].count;
            const newStatus = countsData[id].status;

            if (newState[id].participantCount !== newCount || newState[id].status !== newStatus) {
              newState[id] = {
                ...newState[id],
                participantCount: newCount,
                status: newStatus
              };
              hasChanges = true;
            }
          }
        });

        return hasChanges ? newState : prev;
      });
    };

    // Ejecución inicial
    loadGiveawaysConfig().then(() => {
      // Cargar counts después de config
      loadGiveawaysCounts();
    });

    // Intervalo para counts (20 minutos) - Optimizado para reducir invocations en Vercel
    const interval = setInterval(loadGiveawaysCounts, 60000); // 1 minuto

    // Re-fetch al volver a la pestaña
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadGiveawaysCounts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Cargar ganadores con caché local
  useEffect(() => {
    const loadWinners = async () => {
      try {
        // Cache local para winners (5 minutos)
        const WINNERS_CACHE_KEY = 'giveaways_winners_cache_v2';
        const WINNERS_CACHE_TIME = 'giveaways_winners_time';
        const WINNERS_DURATION = 60000; // 1 minuto

        const cachedData = localStorage.getItem(WINNERS_CACHE_KEY);
        const cachedTime = localStorage.getItem(WINNERS_CACHE_TIME);
        const now = Date.now();

        if (cachedData && cachedTime) {
          const timeDiff = now - parseInt(cachedTime);
          if (timeDiff < WINNERS_DURATION) {
            const data = JSON.parse(cachedData);
            const winnersMap: Record<string, Array<{ position: number; accountName: string; itemIcon?: string; gemPrize?: boolean }>> = {};
            data.winners?.forEach((winner: {
              giveawayId: string;
              position: number;
              accountName: string;
              itemIcon?: string;
              gemPrize?: boolean;
            }) => {
              if (!winnersMap[winner.giveawayId]) {
                winnersMap[winner.giveawayId] = [];
              }
              winnersMap[winner.giveawayId].push({
                position: winner.position,
                accountName: winner.accountName,
                itemIcon: winner.itemIcon,
                gemPrize: winner.gemPrize
              });
            });
            setWinners(winnersMap);
            return;
          }
        }

        // Usar cache del navegador (el endpoint tiene revalidate=60)
        const response = await fetch("/api/giveaways/winners");
        if (response.ok) {
          const data = await response.json();
          const winnersMap: Record<string, Array<{ position: number; accountName: string; itemIcon?: string; gemPrize?: boolean }>> = {};

          data.winners?.forEach((winner: {
            giveawayId: string;
            position: number;
            accountName: string;
            itemIcon?: string;
            gemPrize?: boolean;
          }) => {
            if (!winnersMap[winner.giveawayId]) {
              winnersMap[winner.giveawayId] = [];
            }
            winnersMap[winner.giveawayId].push({
              position: winner.position,
              accountName: winner.accountName,
              itemIcon: winner.itemIcon,
              gemPrize: winner.gemPrize
            });
          });

          // Guardar en cache local
          localStorage.setItem(WINNERS_CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(WINNERS_CACHE_TIME, now.toString());

          setWinners(winnersMap);
        }
      } catch (error) {
        console.error("Error loading winners:", error);
      }
    };

    loadWinners();
  }, []);

  // Inicializar días del adviento con datos de sorteos
  useEffect(() => {
    const today = new Date();

    const days: AdventDay[] = [];
    for (let day = 1; day <= 32; day++) {
      const date = new Date(year, month, day);
      const dayStr = day.toString().padStart(2, '0');
      const giveawayId = `advent-${year}-12-${dayStr}`;
      const giveaway = giveaways[giveawayId];

      // Comparar fechas completas (con hora) en lugar de solo el día del mes
      const giveawayStartDate = giveaway ? new Date(giveaway.startDate) : null;
      const giveawayEndDate = giveaway ? new Date(giveaway.endDate) : null;

      // El día 25 siempre está disponible (aunque no sea la fecha actual)
      const isAvailable = day === 25
        ? Boolean(giveaway)
        : Boolean(giveaway && giveawayStartDate && (
          giveawayStartDate.getTime() <= today.getTime()
        ));

      const isClosed = Boolean(giveaway && (
        (giveawayEndDate && giveawayEndDate.getTime() <= today.getTime()) ||
        giveaway.status === 'ended' ||
        giveaway.status === 'winners_announced'
      ));

      const prizes = giveaway?.prizes?.map((p: {
        itemId?: number;
        quantity?: number;
        gemPrize?: boolean;
        itemIcon?: string;
      }) => ({
        itemId: p.itemId,
        quantity: p.quantity,
        gemPrize: p.gemPrize,
        itemIcon: p.itemIcon
      })) || [
          { itemId: 19721, quantity: 250, gemPrize: false },
          { quantity: 1, gemPrize: true },
          { itemId: 19721, quantity: 250, gemPrize: false }
        ];

      const participantCount = giveaway?.participantCount ?? 0;

      days.push({
        day,
        date,
        isAvailable,
        isClosed,
        isParticipated: participatedDays.has(giveawayId),
        giveawayId,
        participantCount,
        winners: winners[giveawayId]?.sort((a, b) => a.position - b.position),
        prizes
      });
    }
    setAdventDays(days);
  }, [year, month, giveaways, participatedDays, winners]);

  // Verificar API key y cuenta con caché local
  useEffect(() => {
    const controller = new AbortController();
    const checkApiKey = async () => {
      setIsLoadingApiKey(true);

      if (!isAuthenticated || !user?.id) {
        setHasApiKey(false);
        setApiKeyValid(false);
        setIsLoadingApiKey(false);
        return;
      }

      try {
        // Cache local para API key check (5 minutos)
        const API_KEY_CACHE_KEY = `api_key_check_${user.id}`;
        const API_KEY_CACHE_TIME = `api_key_check_time_${user.id}`;
        const API_KEY_DURATION = 60000; // 1 minuto

        const cachedData = localStorage.getItem(API_KEY_CACHE_KEY);
        const cachedTime = localStorage.getItem(API_KEY_CACHE_TIME);
        const now = Date.now();

        if (cachedData && cachedTime) {
          const timeDiff = now - parseInt(cachedTime);
          if (timeDiff < API_KEY_DURATION) {
            const data = JSON.parse(cachedData);
            setHasApiKey(Boolean(data.hasApiKey));
            // Manejar null correctamente: null significa "no verificado", no "inválido"
            setApiKeyValid(data.apiKeyValid === null ? null : Boolean(data.apiKeyValid));
            setAccountInfo(data.accountInfo || null);
            setIsLoadingApiKey(false);
            return;
          }
        }

        // Permitir cache del navegador (el endpoint puede tener cache)
        const response = await fetch(`/api/users/${user.id}/summary`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setHasApiKey(Boolean(data.hasApiKey));
          // Manejar null correctamente: null significa "no verificado", no "inválido"
          // Solo considerar false si explícitamente es false, no si es null
          setApiKeyValid(data.apiKeyValid === null ? null : Boolean(data.apiKeyValid));
          setAccountInfo(data.accountInfo || null);

          // Guardar en cache local
          localStorage.setItem(API_KEY_CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(API_KEY_CACHE_TIME, now.toString());
        } else {
          setHasApiKey(false);
          setApiKeyValid(null); // No sabemos si es válida o no
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error("Error checking API key:", error);
        setHasApiKey(false);
        setApiKeyValid(false);
      } finally {
        setIsLoadingApiKey(false);
      }
    };

    checkApiKey();
    return () => controller.abort();
  }, [isAuthenticated, user?.id]);

  // Cargar participaciones del usuario
  useEffect(() => {
    const controller = new AbortController();
    const loadParticipations = async () => {
      setIsLoadingParticipations(true);
      if (!user?.id || !isAuthenticated) {
        setIsLoadingParticipations(false);
        return;
      }

      // Removed local caching to ensure fresh data
      // const cacheKey = `participated_${user.id}`;
      // const cached = localStorage.getItem(cacheKey);
      // const cacheTime = localStorage.getItem(`${cacheKey}_time`);

      // if (cached && cacheTime) {
      //   const timeDiff = Date.now() - parseInt(cacheTime);
      //   if (timeDiff < 60000) { // 1 minute cache
      //     const cachedArray = JSON.parse(cached) as string[];
      //     const participatedSet = new Set<string>(cachedArray);
      //     setParticipatedDays(participatedSet);
      //     setIsLoadingParticipations(false);
      //     return;
      //   }
      // }

      try {
        // Permitir cache del navegador en lugar de forzar no-cache
        const response = await fetch(`/api/giveaways/participants?userId=${user.id}`, {
          signal: controller.signal,
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          const participatedSet = new Set<string>(
            data.participants.map((p: { giveawayId: string }) => p.giveawayId)
          );

          // localStorage.setItem(
          //   cacheKey,
          //   JSON.stringify(Array.from(participatedSet))
          // );
          // localStorage.setItem(`${cacheKey}_time`, Date.now().toString());

          setParticipatedDays(participatedSet);
        } else {
          setParticipatedDays(new Set<string>());
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error("Error loading participations:", error);
        setParticipatedDays(new Set());
      } finally {
        setIsLoadingParticipations(false);
      }
    };

    if (isAuthenticated && user?.id) {
      loadParticipations();
    } else {
      setParticipatedDays(new Set());
      setIsLoadingParticipations(false);
    }
    return () => controller.abort();
  }, [isAuthenticated, user?.id]);



  // Abrir modal de confirmación
  const handleParticipateClick = (day: number) => {
    const dayData = adventDays.find(d => d.day === day);
    if (!dayData || !dayData.giveawayId) {
      return;
    }

    if (!isAuthenticated || !user?.id) {
      window.location.href = "/login";
      return;
    }

    if (!hasApiKey || apiKeyValid === false) {
      window.location.href = "/profile";
      return;
    }

    // Si apiKeyValid es null (aún no verificado), permitir intentar participar
    // El backend validará la API key al procesar la participación

    if (!accountInfo) {
      alert("Información de cuenta no disponible. Por favor intenta de nuevo.");
      return;
    }

    if (participatedDays.has(dayData.giveawayId)) {
      alert("¡Ya te has apuntado a este sorteo!");
      return;
    }

    setSelectedDay(day);
    setShowConfirmModal(true);
  };

  // Confirmar y participar en sorteo
  const handleConfirmParticipate = async () => {
    if (!selectedDay) return;

    const dayData = adventDays.find(d => d.day === selectedDay);
    if (!dayData || !dayData.giveawayId || !user?.id || !accountInfo) {
      return;
    }

    setShowConfirmModal(false);
    setIsParticipating(true);
    try {
      const response = await fetch("/api/giveaways/participants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          giveawayId: dayData.giveawayId,
          userId: user.id,
          accountName: accountInfo.name,
        }),
      });

      if (response.ok) {
        const newParticipatedDays = new Set(participatedDays);
        newParticipatedDays.add(dayData.giveawayId);
        setParticipatedDays(newParticipatedDays);

        // Actualizar solo el count del sorteo específico en lugar de recargar todo
        // El intervalo de counts se encargará de actualizar el contador completo
        if (dayData.giveawayId) {
          setGiveaways(prev => {
            const newState = { ...prev };
            if (newState[dayData.giveawayId!]) {
              newState[dayData.giveawayId!] = {
                ...newState[dayData.giveawayId!],
                participantCount: (newState[dayData.giveawayId!].participantCount || 0) + 1
              };
            }
            return newState;
          });
        }

        // Update cache
        const cacheKey = `participated_${user.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cachedArray = JSON.parse(cached) as string[];
          if (!cachedArray.includes(dayData.giveawayId)) {
            cachedArray.push(dayData.giveawayId);
            localStorage.setItem(cacheKey, JSON.stringify(cachedArray));
            localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
          }
        }

        // No mostrar alert, el accountName se mostrará en el botón
      } else {
        const errorData = await response.json();
        console.error("Error participating in giveaway:", errorData);
        alert(errorData.error || "Error al apuntarse al sorteo. Por favor intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error participating in giveaway:", error);
      alert("Error al apuntarse al sorteo. Por favor intenta de nuevo.");
    } finally {
      setIsParticipating(false);
      setSelectedDay(null);
    }
  };

  // Verificar si el usuario es admin
  const isAdmin = user?.role === "admin";

  // Función para mostrar modal de selección de ganadores
  const handleSelectWinnersClick = (giveawayId: string) => {
    setGiveawayToSelectWinners(giveawayId);
    setShowSelectWinnersModal(true);
  };

  // Función para confirmar y seleccionar ganadores
  const handleConfirmSelectWinners = async () => {
    if (!giveawayToSelectWinners) return;

    const sessionToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('gw2_token') : null);
    if (!isUsableAuthToken(sessionToken)) {
      setErrorMessage(
        'Tu sesión no es válida para acciones de administrador. Cierra sesión y vuelve a entrar (Patreon o email).',
      );
      setShowErrorModal(true);
      setShowSelectWinnersModal(false);
      return;
    }

    try {
      setIsSelectingWinners(true);
      setShowSelectWinnersModal(false);

      const response = await fetch("/api/giveaways/select-winners", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          giveawayId: giveawayToSelectWinners,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido al seleccionar ganadores' }));
        console.error("Error selecting winners:", errorData);
        setErrorMessage(errorData.error || errorData.details || "Error al seleccionar ganadores. Por favor intenta de nuevo.");
        setShowErrorModal(true);
        setIsSelectingWinners(false);
        return;
      }

      const data = await response.json();

      if (!data.winners || data.winners.length === 0) {
        setErrorMessage(data.message || "No se pudieron seleccionar ganadores. Verifica que el sorteo tenga premios configurados y participantes.");
        setShowErrorModal(true);
        setIsSelectingWinners(false);
        return;
      }

      setSelectedWinners(data.winners || []);
      setShowWinnersResultModal(true);

      // Actualizar estado local directamente con los ganadores recibidos
      // en lugar de hacer fetch adicionales
      const winnersMap: Record<string, Array<{ position: number; accountName: string; itemIcon?: string; gemPrize?: boolean }>> = {};
      (data.winners || []).forEach((winner: {
        giveaway_id: string;
        position: number;
        account_name: string;
        item_icon?: string | null;
        gem_prize?: boolean;
      }) => {
        if (!winnersMap[winner.giveaway_id]) {
          winnersMap[winner.giveaway_id] = [];
        }
        winnersMap[winner.giveaway_id].push({
          position: winner.position,
          accountName: winner.account_name,
          itemIcon: winner.item_icon || undefined,
          gemPrize: winner.gem_prize || false
        });
      });

      // Actualizar winners localmente y cache
      setWinners(prev => {
        const updatedWinners = { ...prev, ...winnersMap };

        // Actualizar cache local de winners
        const WINNERS_CACHE_KEY = 'giveaways_winners_cache';
        const WINNERS_CACHE_TIME = 'giveaways_winners_time';
        const winnersArray = Object.keys(updatedWinners).flatMap(giveawayId =>
          updatedWinners[giveawayId].map(w => ({
            giveawayId,
            position: w.position,
            accountName: w.accountName,
            itemIcon: 'itemIcon' in w ? w.itemIcon : undefined,
            gemPrize: 'gemPrize' in w ? w.gemPrize : undefined
          }))
        );
        localStorage.setItem(WINNERS_CACHE_KEY, JSON.stringify({ winners: winnersArray }));
        localStorage.setItem(WINNERS_CACHE_TIME, Date.now().toString());

        return updatedWinners;
      });

      // Actualizar estado del sorteo localmente
      setGiveaways(prev => {
        const newState = { ...prev };
        if (newState[giveawayToSelectWinners]) {
          newState[giveawayToSelectWinners] = {
            ...newState[giveawayToSelectWinners],
            status: 'winners_announced'
          };
        }
        return newState;
      });
    } catch (error) {
      console.error("Error selecting winners:", error);
      setIsSelectingWinners(false);
      setErrorMessage(
        "Error seleccionando ganadores. Por favor intenta de nuevo."
      );
      setShowErrorModal(true);
    } finally {
      setIsSelectingWinners(false);
      setGiveawayToSelectWinners(null);
    }
  };


  return (
    <div className={`mb-8 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          {t("holidayCalendar.title", `Calendario de Adviento - Diciembre ${year}`).replace("{year}", year.toString())}
        </h2>
        <p className="text-gray-300 text-lg mb-4">
          {t("holidayCalendar.subtitle", "¡Abre un sorteo cada día y apúntate para ganar premios increíbles!")}
        </p>
        <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg px-6 py-4 max-w-3xl mx-auto">
          <p className="text-yellow-300 font-semibold text-lg">
            {t("holidayCalendar.participateEveryDay", "⚠️ IMPORTANTE: Debes participar TODOS LOS DÍAS para tener más oportunidades de ganar")}
          </p>
        </div>
      </div>

      {/* Patreon Promo Banner - Only for non-active patrons */}
      {isAuthenticated && user?.patreonStatus !== 'active_patron' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600/90 to-orange-600/90 backdrop-blur-md p-4 rounded-xl border border-red-400/30 shadow-xl max-w-xl mx-auto mt-6 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-300" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-bold text-sm md:text-base leading-tight mb-1">
                {t('advent.promo.title', '¿Cansado de entrar cada día?')}
              </h3>
              <p className="text-red-100 text-xs md:text-sm">
                {t('advent.promo.desc', 'Hazte patreon de cualquier tier y participa automáticamente en los sorteos.')}
              </p>
            </div>
            <a
              href="https://www.patreon.com/KunzeuLabs"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap px-4 py-2 bg-white text-red-600 font-bold rounded-lg text-xs md:text-sm hover:bg-gray-100 transition-colors shadow-sm"
            >
              {t('advent.promo.btn', 'Desbloquear')}
            </a>
          </div>
        </motion.div>
      )}

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
        {adventDays
          .filter(day => {
            // Filtrar día 32: solo visible para administradores
            if (day.day === 32) {
              return false;
            }
            return true;
          })
          .map((day, index) => {
            const dayWinners = day.winners || [];
            const isClosed = day.isClosed || dayWinners.length > 0;
            // El botón aparece en todos los días que tengan giveaway, estén disponibles y no estén cerrados
            const showButton = day.giveawayId && day.isAvailable && !isClosed;
            // Para admin: mostrar botón en todas las tarjetas
            const showAdminButton = isAdmin && day.giveawayId;
            // El botón está habilitado solo si el día está cerrado, faltan ganadores y hay participantes
            const canSelectWinners = day.isClosed && dayWinners.length < (day.prizes?.length || 0) && (day.participantCount || 0) > 0;

            return (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="relative"
              >
                {/* Tarjeta usando la imagen completa */}
                <div className={`
                relative rounded-xl overflow-hidden
                transition-all duration-300
                w-full
                aspect-[3/5]
                ${!isClosed ? 'hover:shadow-2xl hover:scale-105 cursor-pointer' : 'cursor-default'}
              `}>
                  {/* Imagen de fondo completa sin modificaciones */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={
                        day.day === 1 ? "/images/assets/day1.webp" :
                          day.day === 2 ? "/images/assets/day2.webp" :
                            day.day === 3 ? "/images/assets/day3.webp" :
                              day.day === 4 ? "/images/assets/day4.webp" :
                                day.day === 5 ? "/images/assets/day5.webp" :
                                  day.day === 6 ? "/images/assets/day6.webp" :
                                    day.day === 7 ? "/images/assets/day7.webp" :
                                      day.day === 8 && day.isAvailable ? "/images/assets/day8.webp" :
                                        day.day === 9 && day.isAvailable ? "/images/assets/day9.webp" :
                                          day.day === 10 && day.isAvailable ? "/images/assets/day10.webp" :
                                            day.day === 11 && day.isAvailable ? "/images/assets/day11.webp" :
                                              day.day === 12 && day.isAvailable ? "/images/assets/day12.webp" :
                                                day.day === 13 && day.isAvailable ? "/images/assets/dayy13.webp" :
                                                  day.day === 14 && day.isAvailable ? "/images/assets/day14.webp" :
                                                    day.day === 15 && day.isAvailable ? "/images/assets/day15.webp" :
                                                      day.day === 16 && day.isAvailable ? "/images/assets/day16.webp" :
                                                        (day.day === 17 && day.isAvailable) ? "/images/assets/day17.webp" :
                                                          (day.day === 18 && day.isAvailable) ? "/images/assets/day18.webp" :
                                                            (day.day === 19 && day.isAvailable) ? "/images/assets/day19.webp" :
                                                              (day.day === 20 && day.isAvailable) ? "/images/assets/day20.webp" :
                                                                (day.day === 21 && day.isAvailable) ? "/images/assets/day21.webp" :
                                                                  (day.day === 22 && day.isAvailable) ? "/images/assets/day22.webp" :
                                                                    (day.day === 23 && day.isAvailable) ? "/images/assets/day23.webp" :
                                                                      (day.day === 24 && day.isAvailable) ? "/images/assets/day24.webp?v=3" :
                                                                        (day.day === 25 && day.isAvailable) ? "/images/assets/day25.webp" :
                                                                          (day.day === 26 && day.isAvailable) ? "/images/assets/day26.webp" :
                                                                            (day.day === 27 && day.isAvailable) ? "/images/assets/day27.webp" :
                                                                              (day.day === 28 && day.isAvailable) ? "/images/assets/day28.webp" :
                                                                                (day.day === 29 && day.isAvailable) ? "/images/assets/day29.webp" :
                                                                                  (day.day === 30 && day.isAvailable) ? "/images/assets/day30.webp" :
                                                                                    (day.day === 31 && day.isAvailable) ? "/images/assets/day31.webp" :
                                                                                      "/images/assets/soon.webp"
                      }
                      alt={`Día ${day.day}`}
                      fill
                      className="object-contain"
                      priority={index < 7}
                      unoptimized={day.day === 28}
                    />
                  </div>

                  {/* Contenido posicionado absolutamente sobre la imagen respetando sus espacios */}
                  <div className="relative z-10 w-full h-full">

                    {/* Indicador de CERRADO (cuando está cerrado y tiene ganadores) */}
                    {isClosed && dayWinners.length > 0 && (
                      <div className="absolute top-3 left-3 bg-red-600/95 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg border border-red-400/50 z-30">
                        <span className="text-xs font-bold">
                          {t("holidayCalendar.closed", "CERRADO")}
                        </span>
                      </div>
                    )}

                    {/* Indicador de participantes */}
                    {day.giveawayId && (
                      <div className="absolute top-3 right-3 bg-blue-600/95 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg border border-blue-400/50 z-30">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">
                          {day.participantCount ?? 0}
                        </span>
                      </div>
                    )}

                    {/* Botón APUNTATE - Sobre la imagen */}
                    {showButton && (
                      <div className="absolute top-[64%] sm:top-[calc(65%_-_6px)] left-1/2 transform -translate-x-1/2 w-[90%] px-2">
                        {!isAuthenticated ? (
                          <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors w-full"
                          >
                            {t("holidayCalendar.login", "INICIA SESIÓN")}
                          </Link>
                        ) : isLoadingApiKey || isLoadingParticipations ? (
                          <div className="inline-flex items-center justify-center gap-2 bg-gray-600 text-gray-300 font-semibold py-2 rounded-lg w-full">
                            {t("holidayCalendar.loading", "Cargando...")}
                          </div>
                        ) : !hasApiKey || apiKeyValid === false ? (
                          <Link
                            href="/profile"
                            className="inline-flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold text-2xl py-3.5 rounded-lg transition-colors w-full"
                          >
                            {t("holidayCalendar.linkApiKey", "VINCULA API KEY")}
                          </Link>
                        ) : participatedDays.has(day.giveawayId || '') ? (
                          <div className="inline-flex items-center justify-center gap-2 bg-gray-600 text-white font-bold text-2xl py-3.5 rounded-lg w-full">
                            {accountInfo?.name || t("holidayCalendar.registered", "APUNTADO")}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleParticipateClick(day.day)}
                            disabled={isParticipating}
                            className={`
                            w-full py-4 lg:py-3 rounded-lg
                            font-bold text-white text-lg lg:text-base
                            transition-all duration-200
                            bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 active:scale-95 shadow-lg
                          `}
                          >
                            <span className="flex items-center justify-center gap-2">
                              <span>-</span>
                              <span>{t("holidayCalendar.participate", "APUNTATE")}</span>
                              <span>-</span>
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Indicador de CERRADO - PENDIENTE (cuando está cerrado pero sin ganadores) */}
                    {isClosed && dayWinners.length === 0 && day.giveawayId && (
                      <div className="absolute bottom-[3.78rem] left-1/2 transform -translate-x-1/2 w-[85%] px-2">
                        <div className="bg-yellow-600/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-center shadow-lg border border-yellow-400/50">
                          <p className="text-xs font-bold">{t("holidayCalendar.closedPending", "CERRADO - PENDIENTE")}</p>
                          <p className="text-[10px] mt-0.5 opacity-90">{t("holidayCalendar.awaitingWinners", "En espera de ganadores")}</p>
                        </div>
                      </div>
                    )}

                    {/* Lista de ganadores */}
                    {dayWinners.length > 0 && (
                      <div className="absolute bottom-[2.75rem] sm:bottom-[calc(2.5rem-18px)] left-1/2 transform -translate-x-1/2 w-[85%] px-2">
                        <div className="space-y-0.5 sm:space-y-1">
                          {dayWinners.map((winner) => (
                            <div key={winner.position} className="text-sm text-gray-900 text-center font-medium leading-tight flex items-center justify-center gap-1 sm:gap-1.5">
                              <span className="font-bold">{winner.position}º</span>
                              {/* Icono del premio */}
                              {winner.gemPrize ? (
                                <img
                                  src="https://wiki.guildwars2.com/images/8/88/Gem_%28highres%29.png"
                                  alt="Gems"
                                  className="w-6 h-6 object-contain"
                                />
                              ) : winner.itemIcon ? (
                                <img
                                  src={winner.itemIcon}
                                  alt="Prize"
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : null}
                              <span className="text-xs leading-none font-bold">{winner.accountName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botón de Admin para seleccionar ganadores - Aparece en todas las tarjetas para admins, si faltan ganadores */}
                    {showAdminButton && dayWinners.length < (day.prizes?.length || 0) && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[85%] px-2 z-20">
                        <button
                          onClick={() => handleSelectWinnersClick(day.giveawayId!)}
                          disabled={isSelectingWinners || !canSelectWinners}
                          className={`w-full py-2 px-3 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg ${canSelectWinners
                            ? "bg-yellow-600 hover:bg-yellow-700"
                            : "bg-gray-600 cursor-not-allowed opacity-60"
                            }`}
                          title={
                            !day.isClosed
                              ? "El sorteo aún no ha cerrado"
                              : dayWinners.length >= (day.prizes?.length || 0)
                                ? "Ya hay ganadores seleccionados"
                                : (day.participantCount || 0) === 0
                                  ? "No hay participantes"
                                  : "Seleccionar ganadores al azar"
                          }
                        >
                          <Crown className="w-3 h-3" />
                          {isSelectingWinners ? "Seleccionando..." : "Seleccionar Ganadores"}
                        </button>
                        {!canSelectWinners && dayWinners.length > 0 && (
                          <p className="text-gray-500 text-xs mt-1 text-center">
                            Ganadores ya seleccionados
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Modal de confirmación */}
      {
        showConfirmModal && selectedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700"
            >
              <h3 className="text-xl font-bold text-white mb-4 text-center">
                {t("holidayCalendar.confirmTitle", "Confirmar participación")}
              </h3>
              <p className="text-gray-300 mb-6 text-center">
                {t("holidayCalendar.confirmMessage", `¿Estás seguro de que quieres participar en el sorteo del día ${selectedDay}?`).replace("{day}", selectedDay.toString())}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedDay(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {t("holidayCalendar.cancel", "Cancelar")}
                </button>
                <button
                  onClick={handleConfirmParticipate}
                  disabled={isParticipating}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isParticipating ? t("holidayCalendar.participating", "Participando...") : t("holidayCalendar.confirm", "Confirmar")}
                </button>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* Modal de confirmación para seleccionar ganadores */}
      {
        showSelectWinnersModal && giveawayToSelectWinners && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Seleccionar Ganadores
                </h3>
                <p className="text-gray-300 mb-6">
                  ¿Estás seguro de que quieres seleccionar ganadores al azar para este sorteo? Esta acción no se puede deshacer.
                </p>
                <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-400 mb-2">
                    Información del sorteo:
                  </p>
                  <p className="text-white font-semibold">
                    Día {adventDays.find(d => d.giveawayId === giveawayToSelectWinners)?.day || 'N/A'}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {adventDays.find(d => d.giveawayId === giveawayToSelectWinners)?.participantCount || 0} participantes •{" "}
                    {adventDays.find(d => d.giveawayId === giveawayToSelectWinners)?.prizes?.length || 0} premios
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSelectWinnersModal(false);
                      setGiveawayToSelectWinners(null);
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmSelectWinners}
                    disabled={isSelectingWinners}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {isSelectingWinners ? "Seleccionando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* Modal de resultado de ganadores */}
      {
        showWinnersResultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-2xl w-[90%] bg-gray-900 border border-gray-700 rounded-2xl p-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  ¡Ganadores Seleccionados!
                </h3>
                <p className="text-gray-300 mb-6">
                  Se han seleccionado {selectedWinners.length} ganadores al azar para el sorteo.
                </p>

                <div className="bg-gray-800/60 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    Lista de Ganadores
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedWinners
                      .sort((a, b) => a.position - b.position)
                      .map((winner, index) => (
                        <div
                          key={index}
                          className="bg-gray-700/50 rounded-lg p-4 flex flex-col items-center text-center"
                        >
                          <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3">
                            {winner.position}
                          </div>
                          <p className="text-white font-semibold mb-2 text-sm">
                            {winner.account_name}
                          </p>
                          {/* Mostrar icono del premio */}
                          <div className="flex items-center justify-center gap-2 mb-2">
                            {winner.gem_prize ? (
                              <img
                                src="https://wiki.guildwars2.com/images/8/88/Gem_%28highres%29.png"
                                alt="Gems"
                                className="w-8 h-8 object-contain"
                              />
                            ) : winner.item_icon ? (
                              <img
                                src={winner.item_icon}
                                alt={`Item ${winner.item_id}`}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  // Fallback si la imagen no carga
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : null}
                          </div>
                          <p className="text-gray-300 text-xs font-semibold">
                            {winner.gem_prize
                              ? `${winner.prize_value} Gems`
                              : winner.quantity && winner.item_id
                                ? `${winner.quantity}x`
                                : winner.prize_description
                            }
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowWinnersResultModal(false)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* Modal de error */}
      {
        showErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-md w-[90%] bg-gray-900 border border-red-500 rounded-2xl p-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Error</h3>
                <p className="text-gray-300 mb-6">{errorMessage}</p>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )
      }
    </div >
  );
}

