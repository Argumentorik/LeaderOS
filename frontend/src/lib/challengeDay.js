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
        const d = res.data?.next_open_day || res.data?.current_day;
        if (!alive || !d) return;
        cache = { day: d, at: Date.now() };
        setDay(d);
      })
      .catch(() => { /* Menü bleibt einfach ohne Stand */ });
    return () => { alive = false; };
  }, []);

  return day;
}

/**
 * useChallengeToday — Tag + Titel der heutigen (nächsten offenen) Aufgabe für
 * die Standzeile im Menü (Iter 186).
 */
let todayCache = { value: null, at: 0 };

export function useChallengeToday() {
  const [today, setToday] = useState(todayCache.value);

  useEffect(() => {
    const slice = takeSlice('challenge_today');
    if (slice?.day) {
      const value = { day: slice.day, title: slice.title_de || slice.title_en || '' };
      todayCache = { value, at: Date.now() };
      setToday(value);
      return undefined;
    }
    if (todayCache.value && Date.now() - todayCache.at < TTL) {
      setToday(todayCache.value);
      return undefined;
    }
    let alive = true;
    api.get('/challenge30/status')
      .then((res) => {
        const d = res.data;
        const day = d?.next_open_day || d?.current_day;
        if (!alive || !day) return;
        const entry = (d.challenges || []).find((c) => c.day === day);
        const value = { day, title: entry?.title_de || '' };
        todayCache = { value, at: Date.now() };
        setToday(value);
      })
      .catch(() => { /* Menü bleibt ohne Standzeile */ });
    return () => { alive = false; };
  }, []);

  return today;
}

export default useChallengeDay;
