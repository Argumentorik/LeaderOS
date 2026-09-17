/**
 * audioBus — Globaler Audio-Manager für Leader-OS
 *
 * Problem (User-Feedback, Iter 121):
 *   „wenn man zb. bei challengers ist und dann wegklickt geht immer noch
 *    der ton weiter von den Challengern"
 *
 * Lösung: Jede TTS-/Audio-Instanz registriert sich hier. Beim Route-Change
 * (via `useAudioRouteStopper` in App.js) killen wir ALLES gleichzeitig —
 * kein überlappendes Vorlesen mehr, egal wie viele Player parallel laufen.
 *
 * Zusätzlich stoppt der Bus auch die Browser-SpeechSynthesis-API (Fallback
 * in ChallengersPage) sowie AudioContext-Streams (VoiceMode).
 */

const _players = new Set();
const _media = new Set();
let _lastCleanupTs = 0;

/**
 * Registriert ein <video>/<audio>-Element, das beim Stoppen NUR pausiert wird
 * (Kundenmeldung Iter 185: „Ton läuft weiter, wenn ein Video weggeklickt
 * wird"). Anders als `registerAudio` bleiben `src` und Abspielposition
 * erhalten — beim erneuten Öffnen läuft das Video dort weiter, wo es
 * angehalten wurde.
 */
export function registerMedia(el) {
  if (!el) return () => {};
  _media.add(el);
  return () => _media.delete(el);
}

/** Pausiert alle registrierten Videos + eingebettete Vimeo/YouTube-Player. */
export function stopMedia(reason = 'media-stop', except = null) {
  _media.forEach((el) => {
    if (el === except) return;
    try { if (typeof el.pause === 'function') el.pause(); } catch { /* ignore */ }
  });
  if (typeof document === 'undefined') return;
  // Eingebettete Player lassen sich nur per Nachricht anhalten.
  document.querySelectorAll('iframe[src*="player.vimeo.com"]').forEach((f) => {
    try { f.contentWindow?.postMessage('{"method":"pause"}', '*'); } catch { /* cross-origin */ }
  });
  document.querySelectorAll('iframe[src*="youtube.com/embed"]').forEach((f) => {
    try { f.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":[]}', '*'); } catch { /* cross-origin */ }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('leaderos:media-stop', { detail: { reason } }));
  }
}

/**
 * Registriert ein <audio>-Element (oder eigenes Objekt mit `pause`/`stop`)
 * und liefert eine `unregister`-Funktion zurück. Nach `unregister` ist der
 * Player nicht mehr Teil der globalen Stop-Cascade.
 */
export function registerAudio(player) {
  if (!player) return () => {};
  _players.add(player);
  // Auto-cleanup wenn native <audio> selbst endet
  if (typeof player.addEventListener === 'function') {
    const onEnd = () => _players.delete(player);
    player.addEventListener('ended', onEnd, { once: true });
    player.addEventListener('error', onEnd, { once: true });
  }
  return () => _players.delete(player);
}

/** Stoppt SOFORT alle registrierten Player + SpeechSynthesis. */
export function stopAllAudio(reason = 'route-change') {
  _lastCleanupTs = Date.now();
  // 1) Alle registrierten <audio>-Elemente
  _players.forEach((p) => {
    try {
      if (typeof p.pause === 'function') p.pause();
      if ('currentTime' in p) p.currentTime = 0;
      if ('src' in p) {
        // Release blob/data-URLs damit Browser nicht in Playback-Loop hängt
        try { p.src = ''; } catch { /* readonly on some polyfills */ }
      }
      if (typeof p.stop === 'function') p.stop();
    } catch { /* ignore individual failures — best-effort cleanup */ }
  });
  _players.clear();

  // 1b) Videos pausieren (Position bleibt erhalten)
  stopMedia(reason);

  // 2) Browser-TTS (SpeechSynthesis) — nutzt ChallengersPage als Fallback
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch { /* Safari edge cases */ }
  }

  // 3) Broadcast — andere Components (VoiceMode, VoicePlayButton) können
  //    darauf hören und ihren eigenen State (playing=false) resetten.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('leaderos:audio-stop-all', { detail: { reason } }));
  }
}

/** Debug helper — für den Testing-Agent. */
export function getAudioStats() {
  return { active: _players.size, media: _media.size, lastCleanup: _lastCleanupTs };
}
