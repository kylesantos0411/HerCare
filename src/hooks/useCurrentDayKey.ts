import { useEffect, useMemo, useState } from 'react';

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getReferenceDateFromKey(dayKey: string) {
  return new Date(`${dayKey}T12:00:00`);
}

function getMillisecondsUntilNextDay(now = new Date()) {
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 0, 0);
  return Math.max(nextDay.getTime() - now.getTime(), 0);
}

export function useCurrentDayKey() {
  const [dayKey, setDayKey] = useState(() => getLocalDayKey());

  useEffect(() => {
    let timeoutId: number | null = null;

    const syncDayKey = () => {
      setDayKey(getLocalDayKey());
    };

    const scheduleNextSync = () => {
      timeoutId = window.setTimeout(() => {
        syncDayKey();
        scheduleNextSync();
      }, getMillisecondsUntilNextDay() + 100);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncDayKey();
      }
    };

    scheduleNextSync();
    window.addEventListener('focus', syncDayKey);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener('focus', syncDayKey);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const referenceDate = useMemo(() => getReferenceDateFromKey(dayKey), [dayKey]);

  return { dayKey, referenceDate };
}
