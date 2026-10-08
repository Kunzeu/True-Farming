// Configuración de fechas de festivales
// Se pueden actualizar desde variables de entorno en producción

export interface FestivalDate {
  startDate: string;
  endDate: string;
  startDateFormatted: string;
  endDateFormatted: string;
  startTime?: string; // Hora de inicio en formato HH:MM (opcional)
  endTime?: string;   // Hora de fin en formato HH:MM (opcional)
  timezone?: string;  // Zona horaria (por defecto 'UTC')
}

export interface FestivalEvent {
  nameKey: string;
  path: string;
  color: string;
}

export const festivalDates: Record<string, FestivalDate> = {
  lunarNewYear: {
    startDate: '2026-02-03',
    endDate: '2026-02-24',
    startDateFormatted: 'months.february',
    endDateFormatted: 'months.february',
    startTime: '12:00', // 12:00 PM Colombia (UTC-5)
    endTime: '12:00',
    timezone: 'America/Bogota'
  },
  dragonBash: {
    startDate: '2026-06-02',
    endDate: '2026-06-23',
    startDateFormatted: 'months.june',
    endDateFormatted: 'months.june',
    startTime: '11:00', // 11:00 AM Colombia (UTC-5)
    endTime: '11:00',
    timezone: 'America/Bogota'
  },
  fourWinds: {
    startDate: '2026-08-11',
    endDate: '2026-09-01',
    startDateFormatted: 'months.august',
    endDateFormatted: 'months.august',
    startTime: '11:00', // 11:00 AM Colombia (UTC-5)
    endTime: '11:00',
    timezone: 'America/Bogota'
  },
  halloween: {
    startDate: '2026-10-13',
    endDate: '2026-11-03',
    startDateFormatted: 'months.october',
    endDateFormatted: 'months.november',
    startTime: '11:00', // 11:00 AM Colombia (UTC-5)
    endTime: '11:00',
    timezone: 'America/Bogota'
  },
  wintersday: {
    startDate: '2026-12-09',
    endDate: '2026-01-02',
    startDateFormatted: 'months.december',
    endDateFormatted: 'months.january',
    startTime: '11:00', // 11:00 AM Colombia (UTC-5)
    endTime: '11:00',
    timezone: 'America/Bogota'
  }
};

// Función para obtener el nombre del mes traducido usando claves de traducción
export const getMonthName = (date: string, t: (key: string) => string): string => {
  const monthDate = new Date(date);
  const monthIndex = monthDate.getMonth();

  const monthKeys = [
    'months.january', 'months.february', 'months.march', 'months.april',
    'months.may', 'months.june', 'months.july', 'months.august',
    'months.september', 'months.october', 'months.november', 'months.december'
  ];

  return t(monthKeys[monthIndex]);
};

// Función para obtener el rango de fechas formateado con traducción
export const getFormattedDateRange = (startDate: string, endDate: string, t: (key: string) => string): string => {
  const startMonth = getMonthName(startDate, t);
  const endMonth = getMonthName(endDate, t);

  if (startMonth === endMonth) {
    return startMonth;
  }

  return `${startMonth} - ${endMonth}`;
};

// Función para crear una fecha con hora específica (normalizada a UTC internamente)
const createDateTime = (date: string, time?: string, timezone: string = 'UTC'): Date => {
  if (!time) {
    // Interpretar fecha a medianoche UTC
    const [y, m, d] = date.split('-').map(Number);
    return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0));
  }

  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);

  // Nota: América/Bogotá es UTC-5 y no tiene DST
  if (timezone === 'America/Bogota') {
    // 11:00 hora Colombia = 16:00 UTC → sumar 5 horas para convertir a UTC
    return new Date(Date.UTC(y, (m || 1) - 1, d || 1, (hh || 0) + 5, mm || 0, 0));
  }

  // Por defecto, tratar como UTC
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0));
};

// Función para obtener el estado actual del festival
export const getFestivalStatus = (
  startDate: string,
  endDate: string,
  startTime?: string,
  endTime?: string,
  timezone: string = 'UTC'
): 'active' | 'upcoming' | 'ended' => {
  const now = new Date();
  const start = createDateTime(startDate, startTime, timezone);
  const end = createDateTime(endDate, endTime, timezone);

  if (now >= start && now <= end) {
    return 'active';
  } else if (now < start) {
    return 'upcoming';
  } else {
    return 'ended';
  }
};

// Función para formatear fechas en formato legible (mantiene compatibilidad)
export const formatDateRange = (startDate: string, endDate: string, t: (key: string) => string): string => {
  return getFormattedDateRange(startDate, endDate, t);
};

// Configuración de eventos de festivales con sus propiedades
export const festivalEvents: FestivalEvent[] = [
  {
    nameKey: 'festival.fourWinds',
    path: '/festivals/four-winds',
    color: 'from-green-600 to-cyan-600',
  },
  {
    nameKey: 'festival.halloween',
    path: '/festivals/halloween',
    color: 'from-orange-600 to-orange-700',
  },
  {
    nameKey: 'festival.lunarNewYear',
    path: '/festivals/lunar-new-year',
    color: 'from-red-600 to-yellow-500',
  },
  {
    nameKey: 'festival.dragonBash',
    path: '/festivals/dragon-bash',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    nameKey: 'festival.wintersday',
    path: '/festivals/wintersday',
    color: 'from-sky-600 to-cyan-500',
  },
];

// Función para obtener eventos activos basados en las fechas y horas
export const getActiveFestivalEvents = (): Array<FestivalEvent & { start: Date; end: Date }> => {
  const now = new Date();
  const activeEvents: Array<FestivalEvent & { start: Date; end: Date }> = [];

  festivalEvents.forEach(event => {
    const festivalKey = event.nameKey.replace('festival.', '');
    const dates = festivalDates[festivalKey];

    if (dates) {
      const start = createDateTime(
        dates.startDate,
        dates.startTime,
        dates.timezone || 'UTC'
      );
      const end = createDateTime(
        dates.endDate,
        dates.endTime,
        dates.timezone || 'UTC'
      );

      if (now >= start && now <= end) {
        activeEvents.push({
          ...event,
          start,
          end
        });
      }
    }
  });

  return activeEvents;
};

// Función de conveniencia para obtener el estado de un festival específico
export const getFestivalStatusByName = (festivalName: string): 'active' | 'upcoming' | 'ended' | null => {
  const dates = festivalDates[festivalName];

  if (!dates) {
    return null;
  }

  return getFestivalStatus(
    dates.startDate,
    dates.endDate,
    dates.startTime,
    dates.endTime,
    dates.timezone
  );
};

// Función para obtener el tiempo restante hasta el inicio de un festival
export const getTimeUntilFestivalStart = (festivalName: string): { days: number; hours: number; minutes: number } | null => {
  const dates = festivalDates[festivalName];

  if (!dates) {
    return null;
  }

  const now = new Date();
  const start = createDateTime(
    dates.startDate,
    dates.startTime,
    dates.timezone || 'UTC'
  );

  if (now >= start) {
    return { days: 0, hours: 0, minutes: 0 };
  }

  const diffMs = start.getTime() - now.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}; 