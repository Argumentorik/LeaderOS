import { useState, useRef, useCallback, useEffect } from 'react';
import logger from '../../lib/logger';
import { Button } from '../ui/button';
import { Mic, Square, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

// Iter 92.20 (Mert/Wlad): max 15 Min für Boardroom-Rehearsals & längere Pitches.
// Backend chunked Whisper-Pipeline (siehe routes/video.py) macht effektiv unlimited
// Aufnahmelänge möglich — 15 Min ist nur ein UX-Safety-Cap gegen versehentliche
// Endlos-Recordings. Wer länger braucht, kann eine Datei hochladen (Upload-Cap = 500 MB).
const MAX_RECORD_MS = 15 * 60 * 1000;

const formatMMSS = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const VoiceRecorder = ({ onTranscription, disabled }) => {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startTsRef = useRef(0);
  const tickRef = useRef(null);
  const autoStopRef = useRef(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('file', blob, 'recording.webm');
          const res = await api.post('/voice/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          // Iter 121: /voice/transcribe now returns
          //   { text, low_confidence, hint, matched_frameworks[], is_question }
          // Show a "speak clearer" toast when confidence is low, and
          // surface any matched Wlad-Framework so mis-heard triggers like
          // "sexier" still route to the SEXIER-Argumentation framework.
          if (res.data.hint) {
            toast.warning(res.data.hint, { icon: <AlertTriangle size={16} className="text-amber-500" /> });
          }
          if (Array.isArray(res.data.matched_frameworks) && res.data.matched_frameworks.length > 0) {
            const first = res.data.matched_frameworks[0];
            toast.info(`Framework erkannt: ${first.framework}${first.pillar ? ` · ${first.pillar}` : ''}`);
          }
          if (res.data.text) onTranscription(res.data.text, {
            frameworks: res.data.matched_frameworks || [],
            lowConfidence: !!res.data.low_confidence,
            isQuestion: !!res.data.is_question,
          });
        } catch (err) {
          logger.error('Transcription failed:', err);
          toast.error('Aufnahme konnte nicht verstanden werden. Bitte versuche es nochmal.');
        } finally {
          setTranscribing(false);
          setElapsedMs(0);
        }
      };

      mediaRecorder.start();
      startTsRef.current = Date.now();
      setElapsedMs(0);
      setRecording(true);

      // Tick countdown UI 10× per sekunde für smoothe Progress-Animation
      tickRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTsRef.current);
      }, 100);

      // Hard auto-stop bei 15 min — danach chunked Whisper-Pipeline serverseitig
      autoStopRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORD_MS);
    } catch (err) {
      logger.error('Microphone access denied:', err);
    }
  }, [onTranscription, stopRecording]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
  }, []);

  if (transcribing) {
    return (
      <Button disabled size="icon" variant="outline" className="shrink-0" data-testid="voice-transcribing">
        <Loader2 size={16} className="animate-spin" />
      </Button>
    );
  }

  if (!recording) {
    return (
      <Button
        size="icon"
        variant="outline"
        onClick={startRecording}
        disabled={disabled}
        className="shrink-0"
        data-testid="voice-record-btn"
        title="Stelle deine Frage — sprich deutlich in Richtung Mikrofon (max 15:00)"
        aria-label="Frage per Sprachaufnahme stellen"
      >
        <Mic size={16} />
      </Button>
    );
  }

  // Recording state · show countdown ring + mm:ss
  const remainingMs = Math.max(0, MAX_RECORD_MS - elapsedMs);
  const progress = Math.min(1, elapsedMs / MAX_RECORD_MS);
  const isWarning = remainingMs < 20_000;  // last 20s pulse red
  const R = 18;
  const C = 2 * Math.PI * R;

  return (
    <div className="inline-flex items-center gap-2 shrink-0" data-testid="voice-recording-active">
      <button
        type="button"
        onClick={stopRecording}
        className="relative w-10 h-10 rounded-full flex items-center justify-center bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-500/30"
        title="Aufnahme stoppen"
        data-testid="voice-stop-btn"
        aria-label="Aufnahme stoppen"
      >
        {/* Progress Ring (40×40, stroke shrinks as time runs out) */}
        <svg className="absolute inset-0" width="40" height="40" viewBox="0 0 40 40" aria-hidden>
          <circle
            cx="20" cy="20" r={R}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2"
          />
          <circle
            cx="20" cy="20" r={R}
            fill="none"
            stroke={isWarning ? '#FFFFFF' : '#FFFFFF'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            transform="rotate(-90 20 20)"
            className={isWarning ? 'animate-pulse' : ''}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>
        <Square size={12} className="text-white fill-white relative z-10" />
        {/* Live indicator dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-400 ring-2 ring-rose-500">
          <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-75" />
        </span>
      </button>

      {/* Live MM:SS Countdown · tabular nums so it doesn't jitter */}
      <span
        className={`text-[12px] font-black tabular-nums leading-none ${isWarning ? 'text-rose-500 animate-pulse' : 'text-foreground/85'}`}
        style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
        data-testid="voice-countdown"
        aria-live="polite"
      >
        {formatMMSS(remainingMs)}
      </span>
    </div>
  );
};
