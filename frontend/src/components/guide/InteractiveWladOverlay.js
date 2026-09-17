import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, Check, Copy, MessageSquare, Mic, Sparkles, X } from 'lucide-react';
import { stopMedia } from '../../lib/audioBus';
import { useVoiceMode, VOICE_STATES } from '../../hooks/useVoiceMode';
import { VoiceControls } from '../chat/VoiceControls';

const WLAD = '/wladbot-avatar-clean.png';

const statusLabel = (state, error, de) => ({
  [VOICE_STATES.IDLE]: de ? 'Tippe auf WladBot, um zu sprechen' : 'Tap WladBot to speak',
  [VOICE_STATES.LISTENING]: de ? 'Ich höre dir zu…' : 'Listening…',
  [VOICE_STATES.THINKING]: de ? 'WladBot denkt nach…' : 'Wlad is thinking…',
  [VOICE_STATES.SPEAKING]: de ? 'WladBot spricht' : 'Wlad is speaking',
  [VOICE_STATES.ERROR]: error || (de ? 'Fehler aufgetreten' : 'Error occurred'),
}[state]);

/** Avatar mit Atem-Loop, Sprech-Ring (Ausgabepegel) und Mikro-Puls (Eingabepegel). */
const WladAvatar = ({ state, level, speakLevel, onTap, label, compact = false }) => {
  const speaking = state === VOICE_STATES.SPEAKING;
  const listening = state === VOICE_STATES.LISTENING;
  const ringMax = compact ? 10 : 26;
  const ring = speaking ? (compact ? 3 : 6) + speakLevel * ringMax : listening ? 3 + Math.min(level * 80, compact ? 9 : 22) : 2;
  const scale = speaking ? 1 + speakLevel * (compact ? 0.03 : 0.05) : 1;
  const size = compact ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-40 h-40 sm:w-52 sm:h-52';
  return (
    <button type="button" onClick={onTap} aria-label={label} className="relative shrink-0 outline-none group" data-testid="interactive-wlad-avatar">
      <span className="absolute inset-0 rounded-full transition-[box-shadow] duration-100"
            style={{ boxShadow: `0 0 0 ${ring}px rgba(191,255,0,${speaking ? 0.35 : listening ? 0.25 : 0.15}), 0 0 ${(compact ? 18 : 40) + speakLevel * (compact ? 24 : 60)}px rgba(191,255,0,0.22)` }} />
      <span className={`block ${size} rounded-full overflow-hidden bg-[#101010] border border-white/10 ${state === VOICE_STATES.THINKING ? 'animate-pulse' : 'wlad-breathe'}`}
            style={{ transform: `scale(${scale})`, transition: 'transform 80ms linear' }}>
        <img src={WLAD} alt="Wlad" className="w-full h-full object-cover" draggable={false} />
      </span>
      {speaking && (
        <span className={`absolute ${compact ? '-bottom-2' : '-bottom-3'} left-1/2 -translate-x-1/2 flex items-end gap-[3px] ${compact ? 'h-4' : 'h-6'}`} aria-hidden>
          {[['l2', 0.6], ['l1', 1], ['c', 0.8], ['r1', 1], ['r2', 0.6]].map(([k, f]) => (
            <span key={k} className={`${compact ? 'w-[3px]' : 'w-[4px]'} rounded-full bg-[#BFFF00]`}
                  style={{ height: `${(compact ? 4 : 6) + speakLevel * (compact ? 11 : 18) * f}px`, transition: 'height 70ms linear' }} />
          ))}
        </span>
      )}
      {listening && (
        <span className={`absolute ${compact ? '-bottom-1.5 w-6 h-6' : '-bottom-3 w-9 h-9'} left-1/2 -translate-x-1/2 rounded-full bg-[#BFFF00] text-black flex items-center justify-center shadow-lg`}>
          <Mic size={compact ? 12 : 16} />
        </span>
      )}
    </button>
  );
};

const AnswerBlocks = ({ text }) => (
  <>
    {String(text || '').split(/\n{2,}|\n/).filter((p) => p.trim()).map((p, i) => (
      <p key={`p-${i}`} className="text-white text-[16px] sm:text-[17.5px] leading-[1.75] select-text">{p.trim()}</p>
    ))}
  </>
);

const CopyAnswer = ({ text, de }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { /* Clipboard vom Browser gesperrt — kein Drama */ }
  };
  return (
    <button type="button" onClick={copy} data-testid="interactive-wlad-copy"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/40 hover:text-[#BFFF00] transition-colors">
      {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? (de ? 'Kopiert' : 'Copied') : (de ? 'Antwort kopieren' : 'Copy answer')}
    </button>
  );
};

export const InteractiveWladOverlay = ({ clip, onClose, de = true, access = null }) => {
  const extraFields = useMemo(() => ({ context_title: clip?.title || '', context_script: (clip?.script || '').slice(0, 1200) }), [clip]);
  const [turns, setTurns] = useState([]);
  const [trialLeft, setTrialLeft] = useState(access?.trial ? access.trial_left : null);
  const [atBottom, setAtBottom] = useState(true);
  const [newAnswer, setNewAnswer] = useState(false);
  const scrollRef = useRef(null);
  // Iter 185: Coach-Dialog hat Vorrang — laufende Videos werden pausiert.
  useEffect(() => { stopMedia('coach-dialog-open'); }, []);
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
  const started = turns.length > 0 || !!transcript;

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(near);
    if (near) setNewAnswer(false);
  }, []);

  // Nachscrollen nur, wenn man unten ist — sonst „Neue Antwort ↓“
  useEffect(() => {
    if (!turns.length) return;
    if (atBottom) endRef.current?.scrollIntoView({ behavior: 'smooth' });
    else setNewAnswer(true);
  }, [turns, atBottom]);

  useEffect(() => { if (trialExhausted && state === VOICE_STATES.LISTENING && !paused) togglePause(); }, [trialExhausted, state, paused, togglePause]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { fullCleanup(); onClose?.(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullCleanup, onClose]);

  const voiceLoading = state === VOICE_STATES.THINKING && !!transcript && turns.some((t) => t.question === transcript);
  const status = voiceLoading ? (de ? 'WladBots Stimme kommt…' : "WladBot's voice is coming…") : statusLabel(state, error, de);
  const jumpDown = () => { setNewAnswer(false); endRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0A0A0A] text-white" data-testid="interactive-wlad-overlay">
      {/* Kopf: Titel, Status am Avatar, Schließen */}
      <div className="shrink-0 border-b border-white/[0.06] px-4 pt-4 pb-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          {started && (
            <WladAvatar compact state={state} level={level} speakLevel={speakLevel}
                        onTap={trialExhausted ? undefined : handleOrbTap} label={status} />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[#BFFF00]">
              <Sparkles size={13} />
              <span className="text-[10.5px] font-black uppercase tracking-[0.18em]">{de ? 'Mit WladBot sprechen' : 'Talk to WladBot'}</span>
            </div>
            <p className="mt-0.5 truncate text-[13px] font-bold" data-testid="interactive-wlad-status">{status}</p>
            {clip?.title && (
              <p className="truncate text-[11px] text-white/40">{de ? 'Zum Video' : 'About'} „{clip.title}“ · {de ? 'WladBots Stimme' : "WladBot's voice"}</p>
            )}
          </div>
          <button type="button" onClick={() => { fullCleanup(); onClose?.(); }} data-testid="interactive-wlad-close"
                  className="shrink-0 rounded-full bg-white/[0.04] p-2 text-white/60 transition-colors hover:bg-white/[0.10] hover:text-white"
                  aria-label={de ? 'Schließen' : 'Close'}>
            <X size={20} />
          </button>
        </div>
        {trialLeft != null && (
          <p className={`mx-auto mt-2 w-full max-w-3xl text-[11px] font-bold ${trialExhausted ? 'text-amber-400' : 'text-[#BFFF00]/80'}`}
             data-testid="interactive-wlad-trial">
            {trialExhausted
              ? (de ? 'Deine Test-Gespräche sind aufgebraucht.' : 'Your trial conversations are used up.')
              : (de ? `Noch ${trialLeft} Test-Gespräch${trialLeft === 1 ? '' : 'e'}` : `${trialLeft} trial conversation${trialLeft === 1 ? '' : 's'} left`)}
            {trialExhausted && (
              <Link to="/coaching" onClick={() => { fullCleanup(); onClose?.(); }} className="ml-2 text-white underline" data-testid="interactive-wlad-upgrade">
                {de ? 'Mit Leader-OS unbegrenzt →' : 'Unlimited with Leader-OS →'}
              </Link>
            )}
          </p>
        )}
      </div>

      {/* Antwort: der Hauptdarsteller */}
      <div ref={scrollRef} onScroll={onScroll}
           className="relative flex-1 overflow-y-auto px-4 pt-6 sm:px-6 scrollbar-hide" data-testid="interactive-wlad-history">
        <div className="mx-auto w-full max-w-3xl space-y-7 pb-16">
          {!started && (
            <div className="flex flex-col items-center gap-6 pt-4 text-center">
              <WladAvatar state={state} level={level} speakLevel={speakLevel}
                          onTap={trialExhausted ? undefined : handleOrbTap} label={status} />
              <p className="max-w-md text-[14px] leading-relaxed text-white/45">
                {de ? 'Frag WladBot direkt zum Video — er antwortet mit seiner Stimme.' : 'Ask WladBot about the video — he answers in his own voice.'}
              </p>
              {!trialExhausted && questions.length > 0 && (
                <div className="flex max-w-xl flex-wrap justify-center gap-2" data-testid="interactive-wlad-suggestions">
                  {questions.map((q, i) => (
                    <button key={q} type="button" onClick={() => sendText(q)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold transition-colors hover:border-[#BFFF00] hover:bg-[#BFFF00] hover:text-black"
                            data-testid={`interactive-wlad-suggestion-${i}`}>
                      <MessageSquare size={11} /> {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {turns.map((t, i) => (
            <div key={t.id} className="space-y-2.5" data-testid={`interactive-wlad-turn-${i}`}>
              {t.question && (
                <p className="border-l-2 border-[#BFFF00]/40 pl-3 text-[13.5px] italic text-white/45 select-text">„{t.question}“</p>
              )}
              <AnswerBlocks text={t.answer} />
              {i === turns.length - 1 && <CopyAnswer text={t.answer} de={de} />}
            </div>
          ))}

          {transcript && !turns.some((t) => t.question === transcript) && (
            <p className="border-l-2 border-white/15 pl-3 text-[13.5px] italic text-white/40">„{transcript}“</p>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Fuß: Vorschlagsfragen schmal + Sprachsteuerung mit Sicherheitsabstand */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#0A0A0A]/95 px-4 pt-3 sm:px-6"
           style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}>
        {newAnswer && (
          <button type="button" onClick={jumpDown} data-testid="interactive-wlad-new-answer"
                  className="mx-auto mb-2 flex items-center gap-1.5 rounded-full bg-[#BFFF00] px-3 py-1 text-[11px] font-black text-black shadow-lg">
            <ArrowDown size={11} /> {de ? 'Neue Antwort' : 'New answer'}
          </button>
        )}
        {started && !trialExhausted && questions.length > 0 && (
          <div className="mx-auto mb-2 flex w-full max-w-3xl gap-2 overflow-x-auto scrollbar-hide" data-testid="interactive-wlad-suggestions-row">
            {questions.map((q, i) => (
              <button key={q} type="button" onClick={() => sendText(q)}
                      className="shrink-0 rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-white/70 transition-colors hover:border-[#BFFF00] hover:text-[#BFFF00]"
                      data-testid={`interactive-wlad-suggestion-row-${i}`}>
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="mx-auto w-full max-w-3xl">
          <VoiceControls paused={paused} muted={muted} onTogglePause={togglePause} onToggleMute={toggleMute} de={de} />
        </div>
      </div>
    </div>
  );
};
