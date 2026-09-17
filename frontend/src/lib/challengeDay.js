import { useState, useEffect } from 'react';
import api from './api';
import { takeSlice } from './dashboardBootstrap';

/**
 * useChallengeDay — Stand der 30-Tage-Herausforderung fürs Menü („Tag 7 / 30").
 * Iter 185: Nutzt zuerst das Dashboard-Bündel, sonst ein Request pro 5 Minuten.
 */
let cache = { day: null, at: 0 };
const TTL = 5 * 60 * 1000;

export function useChallengeDay() {
  const [day, setDay] = useState(cache.day);

  useEffect(() => {
    const slice = takeSlice('challenge_today');
    if (slice?.day) {
      cache = { day: slice.day, at: Date.now() };
      setDay(slice.day);
      return undefined;
    }
    if (cache.day && Date.now() - cache.at < TTL) {
      setDay(cache.day);
      return undefined;
    }
    let alive = true;
    api.get('/challenge30/status')
      .then((res) => {
        const d = res.data?.current_day;
        if (!alive || !d) return;
        cache = { day: d, at: Date.now() };
        setDay(d);
      })
      .catch(() => { /* Menü bleibt einfach ohne Stand */ });
    return () => { alive = false; };
  }, []);

  return day;
}

export default useChallengeDay;
