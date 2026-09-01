'use client';

import { useEffect, useState } from 'react';

export function useResetTimers() {
  const [dailyResetTime, setDailyResetTime] = useState('--h --m --s');
  const [weeklyResetTime, setWeeklyResetTime] = useState('--d --h --m');
  const [specialEventTime, setSpecialEventTime] = useState('--d --h --m');

  useEffect(() => {
    const calculateDailyReset = () => {
      const now = new Date();
      const resetTime = new Date();
      resetTime.setUTCHours(0, 0, 0, 0);
      if (now.getTime() > resetTime.getTime()) {
        resetTime.setUTCDate(resetTime.getUTCDate() + 1);
      }
      const diff = resetTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setDailyResetTime(`${hours}h ${minutes}m ${seconds}s`);
    };

    const calculateWeeklyReset = () => {
      const now = new Date();
      const resetTime = new Date();
      resetTime.setUTCHours(7, 30, 0, 0);
      const daysUntilMonday = (8 - resetTime.getUTCDay()) % 7;
      resetTime.setUTCDate(resetTime.getUTCDate() + daysUntilMonday);
      if (now.getTime() > resetTime.getTime()) {
        resetTime.setUTCDate(resetTime.getUTCDate() + 7);
      }
      const diff = resetTime.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setWeeklyResetTime(`${days}d ${hours}h ${minutes}m`);
    };

    const calculateSpecialEvent = () => {
      const now = new Date();
      const endTime = new Date('2026-09-01T16:00:00.000Z');
      const diff = endTime.getTime() - now.getTime();
      if (diff <= 0) {
        setSpecialEventTime('Ended');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setSpecialEventTime(`${days}d ${hours}h ${minutes}m`);
    };

    const tick = () => {
      calculateDailyReset();
      calculateWeeklyReset();
      calculateSpecialEvent();
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return { dailyResetTime, weeklyResetTime, specialEventTime };
}
