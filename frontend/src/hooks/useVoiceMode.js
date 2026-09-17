import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../lib/api';
import logger from '../lib/logger';
import { registerAudio, stopMedia } from '../lib/audioBus';

/**
 * useVoiceMode — Hands-free voice conversation state machine.
 *
 * States: idle → listening → thinking → speaking → idle (auto-loops).
 * VAD: auto-stops recording after SILENCE_DURATION_MS of silence.
 * Safari: feature-detects MIME type (webm → mp4 → ogg fallback chain).
 */

export const VOICE_STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

const SILENCE_THRESHOLD = 0.012;
// Iter 137 (Wlad): Walkie-Talkie-Gefühl — 5s Stille, damit man mitten im Satz
// Luft holen darf, ohne dass Wlad losredet. Orb-Tap sendet sofort.
export const SILENCE_DURATION_MS = 2000; // Iter 177: Anruf-Gefühl — 2 s Stille senden (Tipp auf den Orb sendet sofort)
const MIN_RECORDING_MS = 600;
const MAX_RECORDING_MS = 30000;
const MAX_EMPTY_RETRIES = 3;
// Iter 92.52 (Mert): VAD must WAIT for real speech before it may auto-stop.
// Bug was: 1.4s of ambient silence triggered send → "thinking" fired although
// nobody had spoken. Now we require >= SPEECH_MIN_FRAMES frames above
// SPEECH_THRESHOLD before the silence-timer is allowed to end the recording.
const SPEECH_THRESHOLD = 0.02;
const SPEECH_MIN_FRAMES = 4;
const NO_SPEECH_RESTART_MS = 15000;
const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg;codecs=opus',
];

const pickSupportedMime = () => {
  if (typeof MediaRecorder === 'undefined') return '';
  return MIME_CANDIDATES.find(m => MediaRecorder.isTypeSupported?.(m)) || '';
};

const mimeToExt = (mime) => {
  if (mime.includes('mp4') || mime.includes('mpeg')) return 'mp4';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
};

export const useVoiceMode = ({ initialSessionId, onSessionUpdate, persona = 'wlad', de = true, endpoint = '/voice/conversation', extraFields = null, onTurn = null, speakEndpoint = null }) => {
  const [state, setState] = useState(VOICE_STATES.IDLE);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);
  const [silenceLeft, setSilenceLeft] = useState(null);
  const [speakLevel, setSpeakLevel] = useState(0);
  // Iter 157: Optionen in einem Ref -> sendAndPlay bleibt stabil, nutzt aber immer die aktuellen Werte (keine Stale Closures)
  const optsRef = useRef({ endpoint, extraFields, onTurn, speakEndpoint, onSessionUpdate, persona });
  optsRef.current = { endpoint, extraFields, onTurn, speakEndpoint, onSessionUpdate, persona };

  const sessionIdRef = useRef(initialSessionId);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const silenceStartRef = useRef(null);
  const recordingStartRef = useRef(0);
  const audioPlayerRef = useRef(null);
  const stoppedRef = useRef(false);
  const cancelledRef = useRef(false);
  const lastLevelRef = useRef(0);
  const emptyRetryCountRef = useRef(0);
  const recordedMimeRef = useRef('audio/webm');
  const pausedRef = useRef(false);
  const speechDetectedRef = useRef(false);
  const speechFramesRef = useRef(0);
  const lastCountdownRef = useRef(null);
  const discardNextStopRef = useRef(false);
  const sendAndPlayRef = useRef(null);

  useEffect(() => { sessionIdRef.current = initialSessionId; }, [initialSessionId]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // ── Cleanup ──────────────────────────────────────────────────────────
  const stopMicTracks = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const fullCleanup = useCallback(() => {
    cancelledRef.current = true;
    stoppedRef.current = true;
    try {
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    } catch (e) { logger.error('cleanup recorder stop', e); }
    stopMicTracks();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = '';
      audioPlayerRef.current = null;
    }
  }, [stopMicTracks]);

  // ── VAD: silence detection loop ──────────────────────────────────────
  const monitorSilence = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || stoppedRef.current) return;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    // Iter 141 (Code Review): nicht 60×/s neu rendern — nur bei sichtbarer
    // Änderung des Pegels (2 %-Schritte reichen für den Orb).
    if (Math.abs(rms - lastLevelRef.current) > 0.01) {
      lastLevelRef.current = rms;
      setLevel(rms);
    }

    const now = Date.now();
    const elapsed = now - recordingStartRef.current;

    // Track real speech: only after sustained voice activity may silence end the turn
    if (rms > SPEECH_THRESHOLD) {
      speechFramesRef.current += 1;
      if (speechFramesRef.current >= SPEECH_MIN_FRAMES) speechDetectedRef.current = true;
    }

    if (rms < SILENCE_THRESHOLD) {
      if (silenceStartRef.current === null) silenceStartRef.current = now;
      if (
        speechDetectedRef.current &&
        elapsed > MIN_RECORDING_MS &&
        now - silenceStartRef.current > SILENCE_DURATION_MS
      ) {
        stopRecording();
        return;
      }
      // Sichtbarer Countdown, sobald wirklich gesprochen wurde
      if (speechDetectedRef.current && elapsed > MIN_RECORDING_MS) {
        const left = Math.ceil((SILENCE_DURATION_MS - (now - silenceStartRef.current)) / 1000);
        if (left !== lastCountdownRef.current) {
          lastCountdownRef.current = left;
          setSilenceLeft(left > 0 ? left : 0);
        }
      }
      // Nobody spoke yet → keep listening patiently; soft-restart after 15s
      // to keep the mic stream fresh (no API call, no "thinking" state).
      if (!speechDetectedRef.current && elapsed > NO_SPEECH_RESTART_MS) {
        stopRecording();
        return;
      }
    } else {
      silenceStartRef.current = null;
      if (lastCountdownRef.current !== null) { lastCountdownRef.current = null; setSilenceLeft(null); }
    }

    if (elapsed > MAX_RECORDING_MS) { stopRecording(); return; }
    rafRef.current = requestAnimationFrame(monitorSilence);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (cancelledRef.current) return;
    // Iter 185: Sprach-Modus hat Vorrang — laufende Videos werden pausiert.
    stopMedia('voice-mode-start');
    setState(VOICE_STATES.LISTENING);
    setError('');
    setTranscript('');
    setReply('');
    stoppedRef.current = false;
    silenceStartRef.current = null;
    speechDetectedRef.current = false;
    speechFramesRef.current = 0;
    lastCountdownRef.current = null;
    setSilenceLeft(null);
    chunksRef.current = [];

    const mime = pickSupportedMime();
    if (!mime) {
      setError(de
        ? 'Dein Browser unterstützt keine Audio-Aufnahme. Nutze Chrome, Firefox oder Safari 16+.'
        : 'Your browser does not support audio recording.');
      setState(VOICE_STATES.ERROR);
      return;
    }
    recordedMimeRef.current = mime;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      // Iter 141 (Code Review): Wurde der Voice Mode während der Mikrofon-
      // Freigabe geschlossen, blieb der Track sonst offen (Aufnahme-Icon an).
      if (cancelledRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = handleRecordingStopped;
      recorder.start();
      recordingStartRef.current = Date.now();
      rafRef.current = requestAnimationFrame(monitorSilence);
    } catch (err) {
      logger.error('Mic access failed:', err);
      setError(de ? 'Mikrofonzugriff verweigert. Bitte Berechtigungen prüfen.' : 'Microphone access denied.');
      setState(VOICE_STATES.ERROR);
    }
  }, [de, monitorSilence]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    lastCountdownRef.current = null;
    setSilenceLeft(null);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    try {
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    } catch (e) { logger.error('stopRecording error', e); }
  }, []);

  // ── Network: post audio, get reply, play ─────────────────────────────
  // Getippte/vorgeschlagene Frage ohne Mikrofon: laufende Aufnahme verwerfen, Text senden
  const sendText = useCallback((text) => {
    if (!text?.trim() || cancelledRef.current) return;
    if (mediaRecorderRef.current?.state === 'recording') {
      discardNextStopRef.current = true;
      try { mediaRecorderRef.current.stop(); } catch (e) { logger.warn('recorder stop', e); }
    } else {
      stopMicTracks();
    }
    sendAndPlayRef.current?.(null, text.trim());
  }, [stopMicTracks]);

  const sendAndPlay = useCallback(async (blob, typedText = null) => {
    setState(VOICE_STATES.THINKING);
    try {
      const fd = new FormData();
      if (typedText) fd.append('text', typedText);
      else fd.append('file', blob, `voice.${mimeToExt(recordedMimeRef.current)}`);
      if (sessionIdRef.current) fd.append('session_id', sessionIdRef.current);
      const { endpoint, extraFields, onTurn, speakEndpoint, onSessionUpdate, persona } = optsRef.current;
      fd.append('persona', persona);
      Object.entries(extraFields || {}).forEach(([k, v]) => { if (v != null) fd.append(k, String(v)); });
      // Hard-timeout 28s — Voice-Pipeline (Whisper + GPT-4o-mini + ElevenLabs)
      // sollte typisch in 6-12s durchlaufen. Wenn länger → Cloudflare würde
      // gleich killen → wir geben dem User stattdessen eine klare Fehlermeldung.
      const res = await api.post(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 28000,
      });
      if (cancelledRef.current) return;
      const { transcript: t, response_text, session_id } = res.data;
      let { audio_url } = res.data;
      setTranscript(t);
      setReply(response_text);
      onTurn?.({ transcript: t, reply: response_text, data: res.data });
      if (session_id && session_id !== sessionIdRef.current) {
        sessionIdRef.current = session_id;
        onSessionUpdate?.(session_id);
      }
      if (!audio_url && speakEndpoint && response_text) {
        // Iter 156: Stimme in eigenem Zeitfenster (Wlads Klon kann in der Fal-Queue 20-40 s brauchen)
        try {
          const sp = await api.post(speakEndpoint, { text: response_text, session_id: sessionIdRef.current }, { timeout: 70000 });
          if (cancelledRef.current) return;
          audio_url = sp.data?.audio_url || '';
        } catch (e) { logger.warn('speak failed — text only', e); }
      }
      await playReply(audio_url);
    } catch (err) {
      logger.error('Voice convo error:', err);
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      const isTimeout = err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '');
      if (status === 402) {
        setError(de ? 'Keine Credits mehr — Upgrade nötig.' : 'No credits left — upgrade required.');
        setState(VOICE_STATES.ERROR);
      } else if (status === 400 && detail === 'empty_transcript') {
        // Silently restart listening
        if (!pausedRef.current && !cancelledRef.current) setTimeout(startRecording, 400);
      } else if (isTimeout) {
        setError(de
          ? 'WladBot braucht heute etwas länger. Tippe den Orb, um es erneut zu probieren.'
          : 'WladBot is taking longer than usual. Tap the orb to try again.');
        setState(VOICE_STATES.ERROR);
      } else {
        setError(de ? 'Fehler beim Verarbeiten — versuche es erneut.' : 'Processing failed — try again.');
        setState(VOICE_STATES.ERROR);
      }
    }
  }, [de, startRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecordingStopped = useCallback(async () => {
    stopMicTracks();
    if (discardNextStopRef.current) { discardNextStopRef.current = false; chunksRef.current = []; return; }
    if (cancelledRef.current) return;
    const blob = new Blob(chunksRef.current, { type: recordedMimeRef.current });
    chunksRef.current = [];

    if (blob.size < 2000) {
      emptyRetryCountRef.current += 1;
      if (emptyRetryCountRef.current >= MAX_EMPTY_RETRIES) {
        emptyRetryCountRef.current = 0;
        setError(de
          ? 'Keine Sprache erkannt — tippe den Orb und sprich deutlich.'
          : 'No speech detected — tap the orb and speak clearly.');
        setState(VOICE_STATES.ERROR);
        return;
      }
      if (!pausedRef.current && !cancelledRef.current) setTimeout(startRecording, 400);
      return;
    }
    emptyRetryCountRef.current = 0;
    await sendAndPlay(blob);
  }, [de, stopMicTracks, sendAndPlay, startRecording]);
  sendAndPlayRef.current = sendAndPlay;

  // ── Playback ─────────────────────────────────────────────────────────
  const playReply = useCallback((audioUrl) => new Promise((resolve) => {
    if (!audioUrl) {
      // TTS unavailable — reply text is shown in the overlay; keep the loop alive
      setState(VOICE_STATES.IDLE);
      if (!cancelledRef.current && !pausedRef.current) {
        setTimeout(() => { if (!cancelledRef.current && !pausedRef.current) startRecording(); }, 2600);
      }
      resolve();
      return;
    }
    setState(VOICE_STATES.SPEAKING);
    const audio = new Audio(audioUrl);
    audio.muted = muted;
    audioPlayerRef.current = audio;
    // Iter 121: register with global audio-bus so navigating away kills it.
    const unregister = registerAudio(audio);
    // Iter 156: Ausgabepegel für die Avatar-Mundbewegung (Data-URL -> kein CORS-Problem)
    let outCtx = null; let outRaf = null;
    const startOutMeter = () => {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        outCtx = new Ctx();
        const src = outCtx.createMediaElementSource(audio);
        const an = outCtx.createAnalyser(); an.fftSize = 512;
        src.connect(an); an.connect(outCtx.destination);
        const buf = new Uint8Array(an.frequencyBinCount);
        const tick = () => {
          an.getByteTimeDomainData(buf);
          let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
          setSpeakLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
          outRaf = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) { logger.warn('out meter unavailable', e); }
    };
    const stopOutMeter = () => {
      if (outRaf) cancelAnimationFrame(outRaf);
      if (outCtx && outCtx.state !== 'closed') outCtx.close().catch(() => {});
      setSpeakLevel(0);
    };
    audio.onplay = startOutMeter;
    audio.onpause = stopOutMeter;
    audio.onended = () => {
      stopOutMeter();
      unregister();
      audioPlayerRef.current = null;
      setState(VOICE_STATES.IDLE);
      if (!cancelledRef.current && !pausedRef.current) {
        setTimeout(() => { if (!cancelledRef.current && !pausedRef.current) startRecording(); }, 350);
      }
      resolve();
    };
    audio.onerror = () => { stopOutMeter(); unregister(); logger.error('Audio playback error'); setState(VOICE_STATES.IDLE); resolve(); };
    audio.play().catch((e) => { logger.error('Audio play() rejected', e); setState(VOICE_STATES.IDLE); resolve(); });
  }), [muted, startRecording]);

  // ── Public actions ───────────────────────────────────────────────────
  const handleOrbTap = useCallback(() => {
    if (state === VOICE_STATES.LISTENING) { stopRecording(); return; }
    if (state === VOICE_STATES.SPEAKING) {
      audioPlayerRef.current?.pause();
      audioPlayerRef.current = null;
      startRecording();
      return;
    }
    setPaused(false);
    startRecording();
  }, [state, stopRecording, startRecording]);

  const togglePause = useCallback(() => {
    setPaused((prev) => {
      const next = !prev;
      if (next) {
        if (state === VOICE_STATES.LISTENING) stopRecording();
        if (state === VOICE_STATES.SPEAKING && audioPlayerRef.current) audioPlayerRef.current.pause();
        setState(VOICE_STATES.IDLE);
      } else if (state === VOICE_STATES.IDLE) {
        startRecording();
      }
      return next;
    });
  }, [state, stopRecording, startRecording]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const nm = !m;
      if (audioPlayerRef.current) audioPlayerRef.current.muted = nm;
      return nm;
    });
  }, []);

  // ── Lifecycle: auto-start on mount, full cleanup on unmount ──────────
  useEffect(() => {
    cancelledRef.current = false;
    const t = setTimeout(() => { if (!cancelledRef.current) startRecording(); }, 250);
    return () => {
      clearTimeout(t);
      fullCleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state, transcript, reply, error, paused, muted, level, silenceLeft, speakLevel,
    handleOrbTap, togglePause, toggleMute, fullCleanup, sendText,
  };
};
