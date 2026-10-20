/**
 * FieldVoiceButton — compact mic-button that sits inside a Textarea corner.
 * Reuses the /api/voice/transcribe pipeline (Whisper) — same as the main
 * VoiceRecorder but styled for inline use.
 *
 * onTranscribed(text) receives the transcribed string; the parent decides
 * whether to append or replace the current value.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import logger from '../../lib/logger';

const MAX_RECORD_MS = 3 * 60 * 1000; // 3 min per field is plenty

export function FieldVoiceButton({ onTranscribed, disabled, testId }) {
  const [state, setState] = useState('idle'); // idle | recording | transcribing
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startRef = useRef(0);
  const tickRef = useRef(null);
  const autoStopRef = useRef(null);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (tickRef.current)    { clearInterval(tickRef.current); tickRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setState('transcribing');
        try {
          const fd = new FormData();
          fd.append('file', blob, 'field.webm');
          const res = await api.post('/voice/transcribe', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (res.data.text) onTranscribed(res.data.text);
          else toast.error('Nichts verstanden — bitte nochmal.');
        } catch (err) {
          logger.error('field transcribe failed', err);
          toast.error('Sprach-Aufnahme fehlgeschlagen.');
        } finally {
          setState('idle');
          setElapsed(0);
        }
      };

      rec.start();
      startRef.current = Date.now();
      setState('recording');
      setElapsed(0);
      tickRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 200);
      autoStopRef.current = setTimeout(stop, MAX_RECORD_MS);
    } catch (err) {
      logger.error('mic denied', err);
      toast.error('Mikrofon-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.');
    }
  }, [onTranscribed, stop]);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
  }, []);

  const sec = Math.floor(elapsed / 1000);
  const mmss = `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  if (state === 'transcribing') {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-[#BFFF00]/15 text-[#6B8A00] dark:text-[#BFFF00]"
        data-testid={testId ? `${testId}-transcribing` : undefined}
        aria-label="Transkribiere ..."
      >
        <Loader2 size={12} className="animate-spin" />
      </button>
    );
  }

  if (state === 'recording') {
    return (
      <button
        type="button"
        onClick={stop}
        className="inline-flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black shadow-lg shadow-rose-500/30 transition-all active:scale-95"
        data-testid={testId ? `${testId}-stop` : undefined}
        aria-label="Aufnahme stoppen"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <Square size={9} className="fill-white" />
        <span className="tabular-nums">{mmss}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled}
      className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:bg-[#BFFF00]/20 hover:text-[#6B8A00] dark:hover:text-[#BFFF00] transition-colors disabled:opacity-40"
      data-testid={testId}
      aria-label="Antwort einsprechen"
      title="Einsprechen statt tippen"
    >
      <Mic size={12} strokeWidth={2.4} />
    </button>
  );
}

export default FieldVoiceButton;
