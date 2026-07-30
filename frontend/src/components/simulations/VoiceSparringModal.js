/**
 * VoiceSparringModal — full-screen, mobile-first live voice sparring UI
 * inspired by ChatGPT Voice Mode & Grok Voice.
 *
 * Iter 124.2 (Wlad Godmode-Launch):
 * - Persona-picker (CFO / Board / Kunde / Chef / Team) each with its own
 *   ElevenLabs voice + attitude prompt.
 * - iOS-style interruption: mic keeps listening during Wlad's TTS playback
 *   and cuts him off the moment the user starts speaking.
 * - Word-by-word text reveal timed to the TTS audio duration for the
 *   authentic ChatGPT-Voice reading feel.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Loader2, Volume2, MicOff, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import logger from '../../lib/logger';

const SILENCE_MS = 1400;               // ms of quiet before we auto-cut recording
const MIN_SPEECH_MS = 700;             // ignore blips shorter than this
const RMS_VOICE_THRESHOLD = 0.018;     // above this = user speaking
const INTERRUPT_RMS = 0.038;           // higher bar so TTS bleed doesn't self-interrupt
const INTERRUPT_HOLD_MS = 220;         // must sustain voice this long to cut TTS
const MAX_RECORD_MS = 30_000;          // hard cap per turn

const STATE_COPY = {
  picker:    { label: 'Wähle deinen Gegenüber', hint: 'Wlad passt seinen Ton in Echtzeit an' },
  idle:      { label: 'Bereit',                 hint: 'Tap Orb zum Starten' },
  listening: { label: 'Ich höre …',             hint: 'Sprich frei — ich schneide automatisch' },
  thinking:  { label: 'Sekunde …',              hint: 'Antwort wird geformt' },
  speaking:  { label: 'Antwort läuft',          hint: 'Fang einfach an zu sprechen — ich stoppe' },
  error:     { label: 'Verbindung weg',         hint: 'Tap um nochmal zu versuchen' },
};

const DEFAULT_PERSONAS = [
  { key: 'cfo',      label: 'CFO / Finanz-Chef',  hint: 'Zahlen · ROI · kalt · misstrauisch' },
  { key: 'board',    label: 'Board / Vorstand',   hint: 'Strategisch · gemessen · staatsmännisch' },
  { key: 'customer', label: 'Verärgerter Kunde',  hint: 'Emotional · direkt · ungeduldig' },
  { key: 'boss',     label: 'Chef / Vorgesetzter', hint: 'Zeitknapp · pragmatisch · leicht skeptisch' },
  { key: 'team',     label: 'Team-Mitglied',      hint: 'Enttäuscht · verletzlich · sucht Warum' },
];

export function VoiceSparringModal({ prepContext, prepGoal, onClose }) {
  const [personas, setPersonas] = useState(DEFAULT_PERSONAS);
  const [personaKey, setPersonaKey] = useState(null);
  const [state, setState] = useState('picker');
  const [level, setLevel] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [turns, setTurns] = useState([]);
  const [muted, setMuted] = useState(false);
  const [revealText, setRevealText] = useState('');  // word-by-word reveal
  const [fullReply, setFullReply] = useState('');

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
  const interruptStartedRef = useRef(0);
  const revealTimerRef = useRef(null);

  // ── Fetch remote persona list (with sensible defaults on failure) ──────
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/voice/sparring-personas');
        if (res.data?.personas?.length) setPersonas(res.data.personas);
      } catch (err) {
        logger.warn('sparring-personas fetch failed, using defaults', err);
      }
    })();
  }, []);

  // ── Clean up everything ────────────────────────────────────────────────
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
    if (revealTimerRef.current) clearInterval(revealTimerRef.current);
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = '';
    }
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  // ── Word-by-word text reveal, timed to match the TTS audio duration ────
  const startWordReveal = useCallback((text, audioEl) => {
    if (revealTimerRef.current) clearInterval(revealTimerRef.current);
    setRevealText('');
    const words = (text || '').split(/\s+/).filter(Boolean);
    if (words.length === 0) { setRevealText(text || ''); return; }
    // Estimate duration from audio element (fallback to 3.5 chars/sec reading pace).
    const duration = audioEl?.duration && Number.isFinite(audioEl.duration)
      ? audioEl.duration * 1000
      : Math.max(1200, words.length * 260);
    const perWord = Math.max(90, duration / words.length);
    let i = 0;
    revealTimerRef.current = setInterval(() => {
      i += 1;
      setRevealText(words.slice(0, i).join(' '));
      if (i >= words.length) {
        clearInterval(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    }, perWord);
  }, []);

  // ── Backend call: send a recorded turn ─────────────────────────────────
  const sendTurn = useCallback(async (blob) => {
    if (cancelledRef.current) return;
    setState('thinking');
    setRevealText('');
    try {
      const fd = new FormData();
      fd.append('file', blob, 'sparring.webm');
      if (sessionId) fd.append('session_id', sessionId);
      fd.append('prep_context', JSON.stringify(prepContext || {}));
      fd.append('persona', 'wlad');
      if (personaKey) fd.append('sparring_role', personaKey);
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
      setFullReply(response_text || '');

      if (audio_url && !muted) {
        setState('speaking');
        const el = audioElRef.current;
        if (el) {
          el.src = audio_url;
          el.onloadedmetadata = () => startWordReveal(response_text, el);
          el.onended = () => {
            setRevealText(response_text || '');
            if (!cancelledRef.current) startListeningRef.current();
          };
          el.onerror = () => {
            setRevealText(response_text || '');
            if (!cancelledRef.current) startListeningRef.current();
          };
          try { await el.play(); } catch { startListeningRef.current(); }
        } else {
          startListeningRef.current();
        }
      } else {
        setRevealText(response_text || '');
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
  }, [muted, prepContext, sessionId, personaKey, startWordReveal]);

  // ── Start recording + VAD (dual-mode: recording OR interrupt-watch) ────
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
          if (!cancelledRef.current) startListeningRef.current();
          return;
        }
        await sendTurn(blob);
      };

      rec.start();
      startedAtRef.current = Date.now();
      lastVoiceAtRef.current = 0;
      setState('listening');

      hardStopRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      }, MAX_RECORD_MS);

      const buf = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (cancelledRef.current) return;
        analyser.getByteTimeDomainData(buf);
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

  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // ── iOS-style interruption: watch mic during TTS playback ──────────────
  useEffect(() => {
    if (state !== 'speaking') return undefined;
    let cancelled = false;
    let localStream = null;
    let localCtx = null;
    let localRaf = 0;

    (async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (cancelled) { localStream.getTracks().forEach((t) => t.stop()); return; }
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        localCtx = new AudioCtx();
        const src = localCtx.createMediaStreamSource(localStream);
        const analyser = localCtx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        interruptStartedRef.current = 0;
        const tick = () => {
          if (cancelled) return;
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          if (rms > INTERRUPT_RMS) {
            if (!interruptStartedRef.current) interruptStartedRef.current = Date.now();
            if (Date.now() - interruptStartedRef.current > INTERRUPT_HOLD_MS) {
              // User is talking during Wlad's playback — cut him off, listen.
              if (audioElRef.current) audioElRef.current.pause();
              cancelled = true;
              startListeningRef.current();
              return;
            }
          } else {
            interruptStartedRef.current = 0;
          }
          localRaf = requestAnimationFrame(tick);
        };
        localRaf = requestAnimationFrame(tick);
      } catch (err) {
        logger.warn('interruption watcher unavailable', err);
      }
    })();

    return () => {
      cancelled = true;
      if (localRaf) cancelAnimationFrame(localRaf);
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      if (localCtx && localCtx.state !== 'closed') { try { localCtx.close(); } catch { /* noop */ } }
    };
  }, [state]);

  // ── Start once a persona is chosen ─────────────────────────────────────
  const beginSparring = (key) => {
    setPersonaKey(key);
    setState('idle');
    // start on next tick so state flips first (nicer transition)
    setTimeout(() => { if (!cancelledRef.current) startListening(); }, 60);
  };

  const handleInterrupt = () => {
    if (state === 'speaking' && audioElRef.current) {
      audioElRef.current.pause();
      startListening();
      return;
    }
    if (state === 'error') { startListening(); return; }
    if (state === 'listening' && mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const onExit = () => { teardown(); onClose?.(); };

  const stateCopy = STATE_COPY[state] || STATE_COPY.idle;
  const orbScale = state === 'speaking' ? 1.06 : (state === 'listening' ? 1 + Math.min(0.25, level * 0.5) : 1);
  const orbGlow = state === 'speaking'
    ? 'rgba(191,255,0,0.55)'
    : state === 'listening' ? `rgba(191,255,0,${0.35 + level * 0.4})`
    : state === 'thinking' ? 'rgba(191,255,0,0.28)'
    : 'rgba(191,255,0,0.18)';
  const activePersonaLabel = personas.find((p) => p.key === personaKey)?.label || '';

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col bg-[#050505] text-white overflow-hidden"
      data-testid="voice-sparring-modal"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingTop: 'env(safe-area-inset-top)' }}
    >
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
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#BFFF00] flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-[#0A0A0A]" />
          </div>
          <div className="min-w-0">
            <p className="text-[9.5px] font-black uppercase tracking-[0.22em] text-white/45">
              Voice Sparring{activePersonaLabel ? ` · ${activePersonaLabel}` : ' · Wlad Live'}
            </p>
            <p className="text-[13px] font-black tracking-tight truncate max-w-[70vw]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {prepGoal || 'Live Argumentations-Sparring'}
            </p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors shrink-0"
          data-testid="voice-sparring-close"
          aria-label="Sparring beenden"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 relative flex flex-col items-center justify-center px-6">
        {state === 'picker' ? (
          <PersonaPicker personas={personas} onPick={beginSparring} />
        ) : (
          <>
            <button
              type="button"
              onClick={handleInterrupt}
              className="relative outline-none"
              data-testid="voice-sparring-orb"
              aria-label={state === 'speaking' ? 'Antwort unterbrechen' : 'Aufnahme abschließen'}
            >
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

            {/* Word-by-word reveal of the current reply */}
            {(state === 'speaking' || (state === 'listening' && revealText)) && revealText && (
              <div className="mt-8 max-w-lg text-center">
                <motion.p
                  key={revealText.length}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.12 }}
                  className="text-[15px] text-white/90 leading-relaxed"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  &bdquo;{revealText}
                  {fullReply && revealText.length < fullReply.length && (
                    <span className="inline-block w-[3px] h-[16px] align-middle bg-[#BFFF00] ml-1 animate-pulse" />
                  )}
                  {fullReply && revealText.length >= fullReply.length && '"'}
                </motion.p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom bar */}
      {state !== 'picker' && (
        <div className="relative z-10 px-5 pb-6">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className={`w-11 h-11 rounded-full flex items-center justify-center border transition-colors ${
                muted ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
              data-testid="voice-sparring-mute"
              aria-label={muted ? 'Wlad-Stimme aktivieren' : 'Stimme stumm schalten'}
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
            Sprich einfach los — ich stoppe wenn du redest · Tap-Orb = manuell weiter
          </p>
        </div>
      )}

      <audio ref={audioElRef} preload="auto" data-testid="voice-sparring-audio">
        <track kind="captions" />
      </audio>
    </div>
  );
}

// ── Persona Picker ──────────────────────────────────────────────────────────
function PersonaPicker({ personas, onPick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md text-center"
      data-testid="voice-sparring-picker"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BFFF00]/12 border border-[#BFFF00]/25 mb-4">
        <Sparkles size={11} className="text-[#BFFF00]" />
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#BFFF00]">
          Wähle deinen Gegenüber
        </span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Mit wem sparrst du?
      </h2>
      <p className="text-[12.5px] text-white/50 mt-2 leading-relaxed">
        Jede Rolle hat ihre eigene Stimme, Attitude und typische Einwände. Wlad passt sein Coaching auf dich an.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-2.5">
        {personas.map((p, i) => (
          <motion.button
            key={p.key}
            type="button"
            onClick={() => onPick(p.key)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.28 }}
            className="group flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#BFFF00]/50 hover:bg-[#BFFF00]/[0.06] transition-all active:scale-[0.98] text-left"
            data-testid={`sparring-persona-${p.key}`}
          >
            <div className="min-w-0">
              <div className="text-[13.5px] font-black leading-tight">{p.label}</div>
              <div className="text-[10.5px] text-white/45 mt-0.5">{p.hint}</div>
            </div>
            <ArrowRight size={14} className="text-white/25 group-hover:text-[#BFFF00] transition-colors shrink-0" />
          </motion.button>
        ))}
      </div>

      <p className="text-[10px] text-white/25 mt-6 leading-relaxed">
        Du kannst nach dem Start zwischen Personas wechseln — beende einfach das Sparring und starte neu.
      </p>
    </motion.div>
  );
}

export default VoiceSparringModal;
