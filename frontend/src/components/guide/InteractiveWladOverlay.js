import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Mic, Sparkles, MessageSquare } from 'lucide-react';
import { useVoiceMode, VOICE_STATES } from '../../hooks/useVoiceMode';
import { VoiceControls } from '../chat/VoiceControls';

const WLAD = '/wladbot-avatar-clean.png';

const statusLabel = (state, error, de) => ({
  [VOICE_STATES.IDLE]: de ? 'Tippe auf Wlad, um zu sprechen' : 'Tap Wlad to speak',
  [VOICE_STATES.LISTENING]: de ? 'Ich höre dir zu…' : 'Listening…',
  [VOICE_STATES.THINKING]: de ? 'Wlad denkt nach…' : 'Wlad is thinking…',
  [VOICE_STATES.SPEAKING]: de ? 'Wlad spricht' : 'Wlad is speaking',
  [VOICE_STATES.ERROR]: error || (de ? 'Fehler aufgetreten' : 'Error occurred'),
}[state]);

/** Avatar mit Atem-Loop, Sprech-Ring (Ausgabepegel) und Mikro-Puls (Eingabepegel). */
const WladAvatar = ({ state, level, speakLevel, onTap, label }) => {
  const speaking = state === VOICE_STATES.SPEAKING;
  const listening = state === VOICE_STATES.LISTENING;
  const ring = speaking ? 6 + speakLevel * 26 : listening ? 4 + Math.min(level * 80, 22) : 3;
  const scale = speaking ? 1 + speakLevel * 0.05 : 1;
  return (
    <button type="button" onClick={onTap} aria-label={label} className="relative outline-none group" data-testid="interactive-wlad-avatar">
      <span className="absolute inset-0 rounded-full transition-[box-shadow] duration-100"
            style={{ boxShadow: `0 0 0 ${ring}px rgba(191,255,0,${speaking ? 0.35 : listening ? 0.25 : 0.15}), 0 0 ${40 + speakLevel * 60}px rgba(191,255,0,0.25)` }} />
      <span className={`block w-44 h-44 sm:w-56 sm:h-56 rounded-full overflow-hidden bg-[#101010] border border-white/10 ${state === VOICE_STATES.THINKING ? 'animate-pulse' : 'wlad-breathe'}`}
            style={{ transform: `scale(${scale})`, transition: 'transform 80ms linear' }}>
        <img src={WLAD} alt="Wlad" className="w-full h-full object-cover" draggable={false} />
      </span>
      {speaking && (
        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-6" aria-hidden>
          {[0.6, 1, 0.8, 1, 0.6].map((f, i) => (
            <span key={i} className="w-[4px] rounded-full bg-[#BFFF00]" style={{ height: `${6 + speakLevel * 18 * f}px`, transition: 'height 70ms linear' }} />
          ))}
        </span>
      )}
      {listening && <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#BFFF00] text-black flex items-center justify-center shadow-lg"><Mic size={16} /></span>}
    </button>
  );
};

export const InteractiveWladOverlay = ({ clip, onClose, de = true, access = null }) => {
  const extraFields = useMemo(() => ({ context_title: clip?.title || '', context_script: (clip?.script || '').slice(0, 1200) }), [clip]);
  const [turns, setTurns] = useState([]);
  const [trialLeft, setTrialLeft] = useState(access?.trial ? access.trial_left : null);
  const endRef = useRef(null);
  const {
    state, transcript, error, paused, muted, level, speakLevel,
    handleOrbTap, togglePause, toggleMute, fullCleanup, sendText,
  } = useVoiceMode({
    de, persona: 'wlad', endpoint: '/guide/interactive/turn', speakEndpoint: '/guide/interactive/speak', extraFields,
    onTurn: (t) => {
      setTurns((prev) => [...prev, { id: `${Date.now()}`, question: t.transcript, answer: t.reply }]);
      if (t.data?.trial) setTrialLeft(t.data.trial_left);
    },
  });
  const trialExhausted = trialLeft === 0;
  const questions = (clip?.questions || []).slice(0, 3);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns]);
  // Letztes Test-Gespräch verbraucht: nach Wlads Antwort nicht weiter zuhören
  useEffect(() => { if (trialExhausted && state === VOICE_STATES.LISTENING && !paused) togglePause(); }, [trialExhausted, state, paused, togglePause]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { fullCleanup(); onClose?.(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullCleanup, onClose]);

  const voiceLoading = state === VOICE_STATES.THINKING && !!transcript && turns.some((t) => t.question === transcript);
  const status = voiceLoading ? (de ? 'Wlads Stimme kommt…' : "Wlad's voice is coming…") : statusLabel(state, error, de);
  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0A] text-white flex flex-col items-center justify-between py-8 px-5" data-testid="interactive-wlad-overlay">
      <div className="w-full max-w-2xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#BFFF00]">
          <Sparkles size={15} />
          <span className="text-[11px] font-black tracking-[0.18em] uppercase">{de ? 'Mit Wlad sprechen' : 'Talk to Wlad'}</span>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#BFFF00] text-black tracking-wider">BETA</span>
        </div>
        <button type="button" onClick={() => { fullCleanup(); onClose?.(); }} data-testid="interactive-wlad-close"
                className="text-white/60 hover:text-white p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.10] transition-colors" aria-label={de ? 'Schließen' : 'Close'}>
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-7 w-full">
        <WladAvatar state={state} level={level} speakLevel={speakLevel} onTap={trialExhausted ? undefined : handleOrbTap} label={status} />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold tracking-wide" data-testid="interactive-wlad-status">{status}</p>
          {clip?.title && <p className="text-[11px] text-white/40">{de ? 'Zum Video' : 'About'} „{clip.title}“ · {de ? 'Wlads Stimme' : "Wlad's voice"}</p>}
          {trialLeft != null && (
            <p className={`text-[11px] font-bold ${trialExhausted ? 'text-amber-400' : 'text-[#BFFF00]/80'}`} data-testid="interactive-wlad-trial">
              {trialExhausted
                ? (de ? 'Deine Test-Gespräche sind aufgebraucht.' : 'Your trial conversations are used up.')
                : (de ? `Noch ${trialLeft} Test-Gespräch${trialLeft === 1 ? '' : 'e'}` : `${trialLeft} trial conversation${trialLeft === 1 ? '' : 's'} left`)}
              {trialExhausted && <Link to="/coaching" onClick={() => { fullCleanup(); onClose?.(); }} className="ml-2 underline text-white" data-testid="interactive-wlad-upgrade">{de ? 'Mit Leader-OS unbegrenzt →' : 'Unlimited with Leader-OS →'}</Link>}
            </p>
          )}
        </div>
        {!turns.length && !trialExhausted && questions.length > 0 && (state === VOICE_STATES.IDLE || state === VOICE_STATES.LISTENING) && (
          <div className="flex flex-wrap justify-center gap-2 max-w-xl" data-testid="interactive-wlad-suggestions">
            {questions.map((q, i) => (
              <button key={q} type="button" onClick={() => sendText(q)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.04] hover:bg-[#BFFF00] hover:text-black hover:border-[#BFFF00] transition-colors"
                      data-testid={`interactive-wlad-suggestion-${i}`}>
                <MessageSquare size={11} /> {q}
              </button>
            ))}
          </div>
        )}
        <div className="max-w-xl w-full space-y-3 max-h-[32vh] overflow-y-auto px-1 scrollbar-hide" data-testid="interactive-wlad-history">
          {turns.map((t, i) => (
            <div key={t.id} className="space-y-1.5" data-testid={`interactive-wlad-turn-${i}`}>
              {t.question && <p className="text-white/45 text-sm italic select-text">„{t.question}“</p>}
              <p className="text-white text-[15px] leading-relaxed select-text">{t.answer}</p>
            </div>
          ))}
          {transcript && !turns.some((t) => t.question === transcript) && <p className="text-white/45 text-sm italic">„{transcript}“</p>}
          {!turns.length && !transcript && (
            <p className="text-white/30 text-sm text-center">
              {de ? 'Frag Wlad direkt zum Video — er antwortet mit seiner Stimme.' : 'Ask Wlad about the video — he answers in his own voice.'}
            </p>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <VoiceControls paused={paused} muted={muted} onTogglePause={togglePause} onToggleMute={toggleMute} de={de} />
    </div>
  );
};
