/**
 * VoiceSparringModal — full-screen, mobile-first live voice sparring UI
 * inspired by ChatGPT Voice Mode & Grok Voice.
 *
 * Flow:
 *   idle → listening (auto-VAD via loud→quiet threshold) → thinking →
 *   speaking → listening (loop)
 *
 * The central orb morphs with the state:
 *   - idle:      static pulse
 *   - listening: reactive to mic input (waveform-driven scale + glow)
 *   - thinking:  slow shimmer, indeterminate
 *   - speaking:  breathes with the audio playback
 *
 * The whole surface is safe-area aware, tap-anywhere-to-interrupt when Wlad
 * is speaking, and offers a big "Beenden"-button that always shows the
 * transcript-summary in a bottom sheet.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Loader2, Volume2, MicOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import logger from '../../lib/logger';

const SILENCE_MS = 1400;         // ms of quiet before we auto-cut recording
const MIN_SPEECH_MS = 700;       // ignore blips shorter than this
const RMS_VOICE_THRESHOLD = 0.018;  // above this = user speaking
const MAX_RECORD_MS = 30_000;    // hard cap per turn

const STATE_COPY = {
  idle:       { label: 'Bereit',            hint: 'Tap zum Starten' },
  listening:  { label: 'Ich höre ...',      hint: 'Sprich frei — ich schneide automatisch' },
  thinking:   { label: 'Wlad denkt ...',    hint: 'Sekunde ...' },
  speaking:   { label: 'Wlad spart',        hint: 'Antworte einfach — ich höre danach zu' },
  error:      { label: 'Verbindung weg',    hint: 'Tap um nochmal zu versuchen' },
};

export function VoiceSparringModal({ prepContext, prepGoal, onClose }) {
  const [state, setState] = useState('idle');
  const [level, setLevel] = useState(0);         // 0..1 mic amplitude
  const [sessionId, setSessionId] = useState(null);
  const [turns, setTurns] = useState([]);         // [{role, text}]
  const [muted, setMuted] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const audioElRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const lastVoiceAtRef = useRef(0);
  const rafRef = useRef(0);
  const hardStopRef = useRef(0);
  const cancelledRef = useRef(false);
  const startListeningRef = useRef(() => {});

  // ── Clean up everything when unmounting or ending session ──────────────
  const teardown = useCallback(() => {
    cancelledRef.current = true;
    if (mediaRecorderRef.current?.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch { /* noop */ }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch { /* noop */ }
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (hardStopRef.current) clearTimeout(hardStopRef.current);
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = '';
    }
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  // ── Send audio to backend and stream reply ─────────────────────────────
  const sendTurn = useCallback(async (blob) => {
    if (cancelledRef.current) return;
    setState('thinking');
    try {
      const fd = new FormData();
      fd.append('file', blob, 'sparring.webm');
      if (sessionId) fd.append('session_id', sessionId);
      fd.append('prep_context', JSON.stringify(prepContext || {}));
      fd.append('persona', 'wlad');
      const res = await api.post('/voice/argumentation-sparring', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (cancelledRef.current) return;
      const { session_id, transcript, response_text, audio_url } = res.data || {};
      if (session_id) setSessionId(session_id);
      setTurns((cur) => [
        ...cur,
        ...(transcript ? [{ role: 'user', text: transcript }] : []),
        ...(response_text ? [{ role: 'assistant', text: response_text }] : []),
      ]);

      if (audio_url && !muted) {
        setState('speaking');
        const el = audioElRef.current;
        if (el) {
          el.src = audio_url;
          el.onended = () => {
            if (!cancelledRef.current) startListeningRef.current();
          };
          el.onerror = () => {
            if (!cancelledRef.current) startListeningRef.current();
          };
          try { await el.play(); } catch { startListeningRef.current(); }
        } else {
          startListeningRef.current();
        }
      } else {
        startListeningRef.current();
      }
    } catch (err) {
      logger.error('sparring turn failed', err);
      if (err?.response?.status === 400 && err.response.data?.detail === 'empty_transcript') {
        toast.error('Nichts verstanden — sag es nochmal.');
      } else {
        toast.error('Verbindung zu Wlad verloren. Tap um weiterzumachen.');
      }
      setState('error');
    }
  }, [muted, prepContext, sessionId]);

  // ── Start recording + VAD loop ─────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (cancelledRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (hardStopRef.current) clearTimeout(hardStopRef.current);
        const duration = Date.now() - startedAtRef.current;
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (duration < MIN_SPEECH_MS || blob.size < 2000) {
          // too short — treat as no-op, reset to idle listening
          if (!cancelledRef.current) startListeningRef.current();
          return;
        }
        await sendTurn(blob);
      };

      rec.start();
      startedAtRef.current = Date.now();
      lastVoiceAtRef.current = 0;
      setState('listening');

      // hard cap
      hardStopRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      }, MAX_RECORD_MS);

      // VAD loop
      const buf = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (cancelledRef.current) return;
        analyser.getByteTimeDomainData(buf);
        // compute RMS around 128 (silence)
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        setLevel(Math.min(1, rms * 4));
        const now = Date.now();
        if (rms > RMS_VOICE_THRESHOLD) lastVoiceAtRef.current = now;
        const elapsed = now - startedAtRef.current;
        const silenceFor = lastVoiceAtRef.current ? now - lastVoiceAtRef.current : 0;
        if (lastVoiceAtRef.current && elapsed > MIN_SPEECH_MS && silenceFor > SILENCE_MS) {
          if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      logger.error('mic denied', err);
      toast.error('Mikrofon-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.');
      setState('error');
    }
  }, [sendTurn]);

  // Keep startListening ref in sync so sendTurn/recorder onstop can call it
  // without reintroducing a circular useCallback dependency.
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // ── Auto-start on mount ────────────────────────────────────────────────
  useEffect(() => {
    startListening();
    return () => { cancelledRef.current = true; };
  }, [startListening]);

  // ── User interruption / restart ────────────────────────────────────────
  const handleInterrupt = () => {
    if (state === 'speaking' && audioElRef.current) {
      audioElRef.current.pause();
      startListening();
      return;
    }
    if (state === 'error') {
      startListening();
      return;
    }
    if (state === 'listening' && mediaRecorderRef.current?.state === 'recording') {
      // manual cut
      mediaRecorderRef.current.stop();
    }
  };

  const onExit = () => {
    teardown();
    onClose?.();
  };

  const stateCopy = STATE_COPY[state] || STATE_COPY.idle;
  const orbScale = state === 'speaking' ? 1.06 : (state === 'listening' ? 1 + Math.min(0.25, level * 0.5) : 1);
  const orbGlow = state === 'speaking'
    ? 'rgba(191,255,0,0.55)'
    : state === 'listening' ? `rgba(191,255,0,${0.35 + level * 0.4})`
    : state === 'thinking' ? 'rgba(191,255,0,0.28)'
    : 'rgba(191,255,0,0.18)';

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col bg-[#050505] text-white overflow-hidden"
      data-testid="voice-sparring-modal"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Ambient gradient — moves with state */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        animate={{
          background:
            state === 'speaking'
              ? 'radial-gradient(60% 50% at 50% 40%, rgba(191,255,0,0.16) 0%, rgba(5,5,5,0) 65%)'
              : state === 'listening'
              ? `radial-gradient(55% 45% at 50% 40%, rgba(191,255,0,${0.06 + level * 0.14}) 0%, rgba(5,5,5,0) 65%)`
              : 'radial-gradient(50% 40% at 50% 40%, rgba(191,255,0,0.06) 0%, rgba(5,5,5,0) 65%)',
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#BFFF00] flex items-center justify-center">
            <Sparkles size={14} className="text-[#0A0A0A]" />
          </div>
          <div className="min-w-0">
            <p className="text-[9.5px] font-black uppercase tracking-[0.22em] text-white/45">Voice Sparring · Wlad Live</p>
            <p className="text-[13px] font-black tracking-tight truncate max-w-[70vw]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {prepGoal || 'Live Argumentations-Sparring'}
            </p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
          data-testid="voice-sparring-close"
          aria-label="Sparring beenden"
        >
          <X size={16} />
        </button>
      </div>

      {/* Orb + state */}
      <div className="flex-1 relative flex flex-col items-center justify-center px-6">
        <button
          type="button"
          onClick={handleInterrupt}
          className="relative outline-none"
          data-testid="voice-sparring-orb"
          aria-label={state === 'speaking' ? 'Wlad unterbrechen' : 'Aufnahme abschließen'}
        >
          {/* Outer aura ring */}
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full"
            animate={{
              scale: state === 'listening' ? 1 + level * 0.9 : state === 'speaking' ? [1, 1.18, 1] : 1,
              opacity: state === 'idle' || state === 'error' ? 0.35 : 0.7,
            }}
            transition={state === 'speaking'
              ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
              : { type: 'spring', stiffness: 220, damping: 26 }}
            style={{
              boxShadow: `0 0 80px 8px ${orbGlow}, inset 0 0 40px rgba(191,255,0,0.15)`,
              width: 240,
              height: 240,
            }}
          />
          {/* Inner orb */}
          <motion.div
            className="relative w-[220px] h-[220px] rounded-full flex items-center justify-center"
            animate={{ scale: orbScale }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{
              background:
                state === 'speaking'
                  ? 'radial-gradient(circle at 30% 30%, #D4FF4D 0%, #BFFF00 45%, #7EA800 100%)'
                  : state === 'listening'
                  ? 'radial-gradient(circle at 30% 30%, #BFFF00 0%, #7EA800 60%, #0A0A0A 100%)'
                  : 'radial-gradient(circle at 30% 30%, #2A2A2A 0%, #0A0A0A 100%)',
            }}
          >
            {/* Live shimmer (thinking) */}
            {state === 'thinking' && (
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, rgba(191,255,0,0.35) 30%, transparent 60%)',
                }}
              />
            )}
            {/* State icon */}
            <div className="relative z-10">
              {state === 'listening' && <Mic size={44} className="text-[#0A0A0A]" strokeWidth={2.2} />}
              {state === 'thinking'  && <Loader2 size={44} className="animate-spin text-[#BFFF00]" strokeWidth={2.2} />}
              {state === 'speaking'  && <Volume2 size={44} className="text-[#0A0A0A]" strokeWidth={2.2} />}
              {(state === 'idle' || state === 'error') && (
                <Mic size={44} className="text-[#BFFF00]/80" strokeWidth={2.2} />
              )}
            </div>
          </motion.div>
        </button>

        {/* State copy */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24 }}
            className="mt-10 text-center"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#BFFF00]/80">
              {stateCopy.label}
            </p>
            <p className="text-[13px] text-white/50 mt-1.5">{stateCopy.hint}</p>
          </motion.div>
        </AnimatePresence>

        {/* Last Wlad line (subtle caption) */}
        {turns.length > 0 && (
          <div className="mt-8 max-w-lg text-center">
            {(() => {
              const last = [...turns].reverse().find((t) => t.role === 'assistant');
              return last ? (
                <motion.p
                  key={last.text}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-[15px] text-white/85 leading-relaxed"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  &bdquo;{last.text}&ldquo;
                </motion.p>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 px-5 pb-6">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-colors ${
              muted ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
            }`}
            data-testid="voice-sparring-mute"
            aria-label={muted ? 'Wlad-Stimme aktivieren' : 'Wlad-Stimme stumm schalten'}
            title={muted ? 'Nur Text — kein TTS' : 'Wlad spricht'}
          >
            {muted ? <MicOff size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="h-11 px-6 rounded-full bg-white text-[#0A0A0A] font-black text-[13px] hover:bg-white/90 transition-colors active:scale-[0.97]"
            data-testid="voice-sparring-end"
          >
            Sparring beenden
          </button>
        </div>
        <p className="text-center text-[10px] text-white/25 mt-3">
          Auto-Turn: kurze Pause = Wlad antwortet · Tap-Orb = manuell weiter
        </p>
      </div>

      <audio ref={audioElRef} preload="auto" data-testid="voice-sparring-audio">
        <track kind="captions" />
      </audio>
    </div>
  );
}

export default VoiceSparringModal;
