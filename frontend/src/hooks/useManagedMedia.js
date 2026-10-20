import { useEffect } from 'react';
import { registerMedia, stopMedia } from '../lib/audioBus';

/**
 * useManagedMedia — meldet ein <video>/<audio>-Element am zentralen
 * Ton-Aus-Schalter an.
 *
 * Kundenmeldung (Iter 185): „Video läuft, man klickt weg oder will mit
 * WladBot sprechen — der Ton läuft weiter."
 *
 * Damit gilt: Es läuft immer nur eine Tonquelle. Startet dieses Video, werden
 * alle anderen pausiert. Wird es zugeklappt/geschlossen (Unmount), der
 * Sprach-Modus geöffnet oder die Seite gewechselt, hört der Ton sofort auf.
 * Die Abspielposition bleibt erhalten.
 */
export function useManagedMedia(ref, key = null) {
  useEffect(() => {
    const el = ref?.current;
    if (!el) return undefined;
    const unregister = registerMedia(el);
    const onPlay = () => stopMedia('other-media-started', el);
    el.addEventListener('play', onPlay);
    return () => {
      el.removeEventListener('play', onPlay);
      unregister();
      try { el.pause(); } catch { /* element already gone */ }
    };
  }, [ref, key]);
}

export default useManagedMedia;
