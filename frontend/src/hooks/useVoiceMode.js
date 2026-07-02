import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../lib/api';
import logger from '../lib/logger';

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
const SILENCE_DURATION_MS = 1400;
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

export const useVoiceMode = ({ initialSessionId, onSessionUpdate, persona = 'wlad', de = true }) => {
  const [state, setState] = useState(VOICE_STATES.IDLE);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);

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
  const emptyRetryCountRef = useRef(0);
  const recordedMimeRef = useRef('audio/webm');
  const pausedRef = useRef(false);
  const speechDetectedRef = useRef(false);
  const speechFramesRef = useRef(0);

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
    setLevel(rms);

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
      // Nobody spoke yet → keep listening patiently; soft-restart after 15s
      // to keep the mic stream fresh (no API call, no "thinking" state).
      if (!speechDetectedRef.current && elapsed > NO_SPEECH_RESTART_MS) {
        stopRecording();
        return;
      }
    } else {
      silenceStartRef.current = null;
    }

    if (elapsed > MAX_RECORDING_MS) { stopRecording(); return; }
    rafRef.current = requestAnimationFrame(monitorSilence);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (cancelledRef.current) return;
    setState(VOICE_STATES.LISTENING);
    setError('');
    setTranscript('');
    setReply('');
    stoppedRef.current = false;
    silenceStartRef.current = null;
    speechDetectedRef.current = false;
    speechFramesRef.current = 0;
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
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    try {
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    } catch (e) { logger.error('stopRecording error', e); }
  }, []);

  // ── Network: post audio, get reply, play ─────────────────────────────
  const sendAndPlay = useCallback(async (blob) => {
    setState(VOICE_STATES.THINKING);
    try {
      const ext = mimeToExt(recordedMimeRef.current);
      const fd = new FormData();
      fd.append('file', blob, `voice.${ext}`);
      if (sessionIdRef.current) fd.append('session_id', sessionIdRef.current);
      fd.append('persona', persona);
      // Hard-timeout 28s — Voice-Pipeline (Whisper + GPT-4o-mini + ElevenLabs)
      // sollte typisch in 6-12s durchlaufen. Wenn länger → Cloudflare würde
      // gleich killen → wir geben dem User stattdessen eine klare Fehlermeldung.
      const res = await api.post('/voice/conversation', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 28000,
      });
      if (cancelledRef.current) return;
      const { transcript: t, response_text, audio_url, session_id } = res.data;
      setTranscript(t);
      setReply(response_text);
      if (session_id && session_id !== sessionIdRef.current) {
        sessionIdRef.current = session_id;
        onSessionUpdate?.(session_id);
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
          ? 'Wlad braucht heute etwas länger. Tippe den Orb, um es erneut zu probieren.'
          : 'Wlad is taking longer than usual. Tap the orb to try again.');
        setState(VOICE_STATES.ERROR);
      } else {
        setError(de ? 'Fehler beim Verarbeiten — versuche es erneut.' : 'Processing failed — try again.');
        setState(VOICE_STATES.ERROR);
      }
    }
  }, [de, persona, onSessionUpdate, startRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecordingStopped = useCallback(async () => {
    stopMicTracks();
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
    audio.onended = () => {
      audioPlayerRef.current = null;
      setState(VOICE_STATES.IDLE);
      if (!cancelledRef.current && !pausedRef.current) {
        setTimeout(() => { if (!cancelledRef.current && !pausedRef.current) startRecording(); }, 350);
      }
      resolve();
    };
    audio.onerror = () => { logger.error('Audio playback error'); setState(VOICE_STATES.IDLE); resolve(); };
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
    state, transcript, reply, error, paused, muted, level,
    handleOrbTap, togglePause, toggleMute, fullCleanup,
  };
};
