import { X, Volume2 } from 'lucide-react';
import { useVoiceMode, VOICE_STATES, SILENCE_DURATION_MS } from '../../hooks/useVoiceMode';
import { VoiceOrb } from './VoiceOrb';
import { VoiceControls } from './VoiceControls';

const statusLabel = (state, error, de) => ({
  [VOICE_STATES.IDLE]: de ? 'Tippe den Orb, um zu sprechen' : 'Tap the orb to speak',
  [VOICE_STATES.LISTENING]: de ? 'Ich höre dir zu…' : 'Listening…',
  [VOICE_STATES.THINKING]: de ? 'Wlad denkt nach…' : 'Wlad is thinking…',
  [VOICE_STATES.SPEAKING]: de ? 'Wlad spricht' : 'Wlad is speaking',
  [VOICE_STATES.ERROR]: error || (de ? 'Fehler aufgetreten' : 'Error occurred'),
}[state]);

const SilenceCountdown = ({ left, de }) => (
  <div className="w-full max-w-xs mx-auto space-y-2" data-testid="voice-silence-countdown">
    <p className="text-center text-sm font-black text-[#BFFF00]">
      {de
        ? `Noch ${left}s — sprich weiter oder tippe zum Senden`
        : `${left}s left — keep talking or tap to send`}
    </p>
    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-[#BFFF00] transition-[width] duration-500 ease-linear"
        style={{ width: `${Math.max(0, Math.min(100, (left / (SILENCE_DURATION_MS / 1000)) * 100))}%` }}
      />
    </div>
  </div>
);

export const VoiceModeOverlay = ({ sessionId, onSessionUpdate, onClose, de = true }) => {
  const {
    state, transcript, reply, error, paused, muted, level, silenceLeft,
    handleOrbTap, togglePause, toggleMute, fullCleanup,
  } = useVoiceMode({ initialSessionId: sessionId, onSessionUpdate, persona: 'wlad', de });

  const status = statusLabel(state, error, de);

  const handleClose = () => {
    fullCleanup();
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col items-center justify-between py-10 px-6"
      data-testid="voice-mode-overlay"
    >
      <div className="w-full max-w-2xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#BFFF00]">
          <Volume2 size={16} />
          <span className="text-xs font-bold tracking-widest uppercase">Audio Mode</span>
        </div>
        <button
          onClick={handleClose}
          data-testid="voice-mode-close"
          className="text-white/60 hover:text-white p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.10] transition-colors"
          aria-label={de ? 'Schließen' : 'Close'}
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-10">
        <VoiceOrb state={state} level={level} onTap={handleOrbTap} ariaLabel={status} />

        <p className="text-white/80 text-sm font-medium tracking-wide" data-testid="voice-mode-status">
          {status}
        </p>

        {state === VOICE_STATES.LISTENING && (
          <div className="h-14 w-full max-w-xs mx-auto flex flex-col justify-center">
            {silenceLeft !== null && silenceLeft <= 4
              ? <SilenceCountdown left={silenceLeft} de={de} />
              : (
                <p className="text-center text-white/35 text-xs" data-testid="voice-mode-hint">
                  {de ? 'Walkie-Talkie: 5s Pause = senden · Orb tippen = sofort senden' : 'Walkie-talkie: 5s pause = send · tap orb = send now'}
                </p>
              )}
          </div>
        )}

        <div className="min-h-[80px] max-w-xl w-full text-center space-y-3">
          {transcript && (
            <p className="text-white/50 text-sm italic" data-testid="voice-mode-transcript">"{transcript}"</p>
          )}
          {reply && (
            <p className="text-white text-base leading-relaxed" data-testid="voice-mode-reply">{reply}</p>
          )}
        </div>
      </div>

      <VoiceControls
        paused={paused}
        muted={muted}
        onTogglePause={togglePause}
        onToggleMute={toggleMute}
        de={de}
      />
    </div>
  );
};
