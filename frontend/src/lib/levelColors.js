/**
 * levelColors — lesbare Levelfarben in beiden Modi.
 *
 * Kundenmeldung (Iter 185): „Aktuelles Level", „Visionär", „3.537 XP" und
 * „Höchstes Level erreicht" waren im hellen Modus nicht zu lesen. Ursache:
 * Die Schriftfarbe dieser Karte ist die Levelfarbe — beim höchsten Level das
 * Neongrün der Marke (#BFFF00), auf Weiß praktisch unsichtbar.
 *
 * Hier bekommt jede Levelfarbe eine zweite, dunklere Variante für den hellen
 * Modus (Kontrast >= 4.5:1 auf Weiß), genau wie der Rest der App es mit
 * `text-[#6B8A00] dark:text-[#BFFF00]` schon macht.
 *
 * WICHTIG: Nur für Text/Icons auf HELLEM Grund verwenden. Auf dunklen Karten
 * (z. B. Profil-Hero, XP-Karte auf #0A0A0A) bleibt die Originalfarbe.
 */
import { useTheme } from '../contexts/ThemeContext';

const LIGHT_VARIANT = {
  '#BFFF00': '#5A7A00', // Neongrün → dunkles Grün
  '#D4FF4D': '#5A7A00',
  '#FFB800': '#8A5B00', // Gelb → Bernstein
  '#F59E0B': '#8A5B00',
  '#FF8A00': '#9A4B00',
  '#00AAFF': '#0369A1',
  '#FF4444': '#B3261E',
  '#64748B': '#475569',
  '#9333EA': '#6B21A8',
  '#14B8A6': '#0F766E',
  '#22C55E': '#15803D',
};

/** Dunklere Variante für den hellen Modus; im dunklen Modus Originalfarbe. */
export function readableLevelColor(color, isDark) {
  if (!color || typeof color !== 'string') return color;
  if (isDark) return color;
  return LIGHT_VARIANT[color.toUpperCase()] || color;
}

/**
 * Hook: gibt `ink(color)` zurück — die lesbare Textfarbe für den aktiven Modus,
 * plus `isDark` für Sonderfälle.
 */
export function useReadableColor() {
  const theme = useTheme();
  const isDark = theme?.theme === 'dark';
  return { isDark, ink: (color) => readableLevelColor(color, isDark) };
}

export default useReadableColor;
