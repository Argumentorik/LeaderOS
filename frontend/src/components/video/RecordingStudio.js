/**
 * RecordingStudio · Sci-Fi cockpit recording UI.
 *
 * Flow:
 *   1. SETUP: title + description + rating config visible, big circular RECORD button
 *   2. COUNTDOWN: 3-2-1 overlay; description hidden behind blur to focus the user
 *   3. RECORDING: title hidden, GIANT timer overlay, prompt-pill in corner only,
 *      single STOP button (large, premium)
 *   4. RECORDED: re-record OR submit
 *   5. ANALYZING: full-screen loading state
 *
 * Premium polish:
 *   - Lime accents on neon black, no red-pink gradients
 *   - Circular animated record button (iOS Voice Memos × Apple Vision)
 *   - Huge tabular-nums timer (visible from 3m away)
 *   - Description hidden during recording so the user faces the camera
 */
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight, Square, Loader2, Mic, Radio, Upload } from 'lucide-react';
import { RatingConfig } from './RatingConfig';
import { RecordingCountdown } from './RecordingCountdown';
import api from '../../lib/api';

const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

// ────────────────────────────────────────────────────────────────────────────
// Big circular record button (Apple Voice Memos × Vision Pro feel)
// ────────────────────────────────────────────────────────────────────────────
const BigRecordButton = ({ onClick, de }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid="start-recording-btn"
    aria-label={de ? 'Aufnahme starten' : 'Start recording'}
    className="group relative flex flex-col items-center gap-3 focus:outline-none"
  >
    <span className="relative inline-flex items-center justify-center w-[88px] h-[88px] rounded-full">
      {/* Outer pulsing halo */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-[#BFFF00]/15 group-hover:bg-[#BFFF00]/25 transition-colors animate-[recordPulse_2s_ease-in-out_infinite]"
      />
      {/* Static ring */}
      <span
        aria-hidden
        className="absolute inset-2 rounded-full border-2 border-[#BFFF00]/50 group-hover:border-[#BFFF00] transition-colors"
      />
      {/* Solid center disc */}
      <span className="relative inline-flex items-center justify-center w-[58px] h-[58px] rounded-full bg-[#BFFF00] group-hover:scale-105 group-active:scale-95 transition-transform shadow-[0_0_32px_rgba(191,255,0,0.4)]">
        <Mic size={22} className="text-[#0A0A0A]" strokeWidth={2.4} />
      </span>
    </span>
    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60 group-hover:text-[#BFFF00] transition-colors">
      {de ? 'Aufnahme starten' : 'Start recording'}
    </span>

    <style>{`
      @keyframes recordPulse {
        0%, 100% { transform: scale(1);   opacity: 0.6; }
        50%      { transform: scale(1.18); opacity: 0.9; }
      }
    `}</style>
  </button>
);

// ────────────────────────────────────────────────────────────────────────────
// Big circular STOP button (when recording is live)
// ────────────────────────────────────────────────────────────────────────────
const BigStopButton = ({ onClick, de }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid="stop-recording-btn"
    aria-label={de ? 'Aufnahme stoppen' : 'Stop recording'}
    className="group relative flex flex-col items-center gap-3 focus:outline-none"
  >
    <span className="relative inline-flex items-center justify-center w-[88px] h-[88px] rounded-full">
      <span aria-hidden className="absolute inset-0 rounded-full bg-red-500/20 animate-[stopPulse_1.2s_ease-in-out_infinite]" />
      <span aria-hidden className="absolute inset-2 rounded-full border-2 border-red-500/60" />
      <span className="relative inline-flex items-center justify-center w-[58px] h-[58px] rounded-2xl bg-red-500 group-hover:scale-105 group-active:scale-95 transition-transform shadow-[0_0_32px_rgba(239,68,68,0.5)]">
        <Square size={22} className="text-white fill-white" />
      </span>
    </span>
    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/85 group-hover:text-red-300 transition-colors">
      {de ? 'Stoppen' : 'Stop'}
    </span>

    <style>{`
      @keyframes stopPulse {
        0%, 100% { transform: scale(1);   opacity: 0.5; }
        50%      { transform: scale(1.2); opacity: 0.85; }
      }
    `}</style>
  </button>
);

// ────────────────────────────────────────────────────────────────────────────
// Giant tabular timer + REC indicator
// ────────────────────────────────────────────────────────────────────────────
const BigTimer = ({ timer, max, recording }) => {
  const remaining = Math.max(0, max - timer);
  const isWarning = timer / max > 0.8;

  return (
    <div className="absolute top-5 left-5 flex items-center gap-3 z-20" data-testid="recording-big-timer">
      {recording && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-[0.2em]">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> REC
        </span>
      )}
      <span
        className={`px-4 py-2 rounded-2xl backdrop-blur-md tabular-nums font-black ${
          isWarning ? 'bg-red-500/85 text-white' : 'bg-black/65 text-white'
        }`}
        style={{ fontSize: '28px', lineHeight: 1, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.04em' }}
      >
        {formatTime(remaining)}
      </span>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Prompt pill (visible bottom-left during recording · small, non-intrusive)
// ────────────────────────────────────────────────────────────────────────────
const PromptPill = ({ challenge, de }) => (
  <div
    className="absolute bottom-5 left-5 right-5 z-20"
    data-testid="recording-prompt-pill"
  >
    <div className="inline-flex max-w-full items-center gap-2 px-3 py-2 rounded-full bg-black/55 backdrop-blur-md border border-white/10">
      <Radio size={11} className="text-[#BFFF00] shrink-0" />
      <p className="text-[11px] font-semibold text-white/85 truncate">
        {challenge.title}
      </p>
      <span className="text-[9px] text-white/40 uppercase tracking-wider hidden sm:inline">
        {de ? 'in Kamera schauen' : 'look at camera'}
      </span>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────
// Eigenes Material hochladen (Meeting-Ausschnitt, Handy-Video) — gleicher Analyse-Weg wie die Aufnahme.
const UploadOwnVideo = ({ onPickFile, de }) => (
  <label
    className="group flex cursor-pointer flex-col items-center gap-3 focus-within:outline-none"
    data-testid="upload-video-label"
  >
    <span className="relative inline-flex h-[88px] w-[88px] items-center justify-center rounded-full">
      <span aria-hidden className="absolute inset-2 rounded-full border-2 border-white/20 transition-colors group-hover:border-[#BFFF00]/60" />
      <span className="relative inline-flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white/10 transition-transform group-hover:scale-105 group-active:scale-95">
        <Upload size={22} className="text-white/80" strokeWidth={2.2} />
      </span>
    </span>
    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60 transition-colors group-hover:text-[#BFFF00]">
      {de ? 'Video hochladen' : 'Upload video'}
    </span>
    <input
      type="file"
      accept="video/*,audio/*"
      className="sr-only"
      data-testid="upload-video-input"
      onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onPickFile(f); }}
    />
  </label>
);

export const RecordingStudio = ({
  activeChallenge, recording, recorded, analyzing, timer,
  videoRef, ratingConfig, onSaveRatingConfig,
  onCancel, onStartRecording, onStopRecording, onReset, onSubmit, onPickFile, lang,
}) => {
  const de = lang === 'de';
  const [counting, setCounting] = useState(false);
  // Iter 185: VOR dem Aufnehmen prüfen — wer aufnehmen darf, bekommt die
  // Auswertung garantiert. Keine Absage nach der Arbeit mehr.
  const [access, setAccess] = useState(null);
  useEffect(() => {
    let alive = true;
    api.get('/video-challenges/access')
      .then((r) => { if (alive) setAccess(r.data); })
      .catch(() => { if (alive) setAccess({ allowed: true, reason: 'unknown', message: '' }); });
    return () => { alive = false; };
  }, []);

  // Click on RECORD → start countdown; countdown end → actual recording starts.
  const handleStartClick = useCallback(() => {
    setCounting(true);
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setCounting(false);
    onStartRecording();
  }, [onStartRecording]);

  const handleCountdownCancel = useCallback(() => {
    setCounting(false);
  }, []);

  return (
    <div className="space-y-5 animate-fade-in" data-testid="recording-studio">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost" size="sm" onClick={onCancel}
          disabled={recording || counting}
          className="font-semibold disabled:opacity-40"
          data-testid="cancel-video-btn"
        >
          <ArrowLeft size={16} className="mr-1" /> {de ? 'Abbrechen' : 'Cancel'}
        </Button>

        {/* Status pill · only visible in non-recording states */}
        {!recording && !counting && !analyzing && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#BFFF00]/10 border border-[#BFFF00]/25 text-[10px] font-bold uppercase tracking-[0.2em] text-[#BFFF00]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
            {de ? 'Bereit' : 'Ready'}
          </span>
        )}
      </div>

      {/* ── Title block · only when not recording (so the user focuses on the camera) ── */}
      {!recording && !counting && (
        <div className="text-center mb-2" data-testid="recording-prompt-block">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#BFFF00]/80 mb-2">
            {de ? 'Deine Mission' : 'Your Mission'}
          </p>
          <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {activeChallenge.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
            {activeChallenge.description}
          </p>
        </div>
      )}

      {/* ── Zugang & Kosten VOR der Aufnahme (Iter 185) ── */}
      {!recording && !recorded && !analyzing && !counting && access && (
        <div className={`rounded-2xl border px-4 py-3 text-[12.5px] font-semibold ${access.allowed
          ? 'border-[#BFFF00]/25 bg-[#BFFF00]/[0.06] text-foreground'
          : 'border-amber-500/30 bg-amber-500/[0.08] text-amber-700 dark:text-amber-300'}`}
             data-testid="video-access-hint">
          {access.message || (access.first_free
            ? (de ? 'Deine erste Auswertung ist kostenlos.' : 'Your first analysis is free.')
            : (de ? `Diese Auswertung kostet ${access.cost} Credit.` : `This analysis costs ${access.cost} credit.`))}
        </div>
      )}

      {/* ── Rating config — only in setup phase ── */}
      {!recording && !recorded && !analyzing && !counting && (
        <RatingConfig config={ratingConfig} onChange={onSaveRatingConfig} de={de} compact />
      )}

      {/* ── Video viewport (always present once a challenge is active) ── */}
      <Card className="overflow-hidden border-white/[0.06] bg-black shadow-2xl shadow-black/40">
        <CardContent className="p-0 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full aspect-video bg-black"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Soft inner vignette for cockpit feel */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.55)',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), transparent 25%, transparent 75%, rgba(0,0,0,0.35))',
            }}
          />

          {/* Big timer · only when recording (otherwise too noisy) */}
          {(recording || counting) && (
            <BigTimer timer={timer} max={activeChallenge.time_limit} recording={recording} />
          )}

          {/* Prompt pill during recording */}
          {recording && <PromptPill challenge={activeChallenge} de={de} />}

          {/* Countdown overlay */}
          {counting && (
            <RecordingCountdown
              from={3}
              onComplete={handleCountdownComplete}
              onCancel={handleCountdownCancel}
              de={de}
            />
          )}

          {/* Analyzing overlay */}
          {analyzing && (
            <div
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md"
              data-testid="recording-analyzing-overlay"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center mb-5 shadow-lg shadow-[#BFFF00]/30 animate-[recordPulse_2s_ease-in-out_infinite]">
                <Loader2 size={24} className="text-[#0A0A0A] animate-spin" strokeWidth={2.5} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#BFFF00]/80 mb-2">
                {de ? 'KI analysiert deine Delivery' : 'AI analyzing your delivery'}
              </p>
              <p className="text-sm text-white/55 max-w-sm text-center px-6">
                {de
                  ? 'Klarheit · Souveränität · Empathie · Struktur · Wlads Framework wird angewendet'
                  : 'Clarity · Confidence · Empathy · Structure · applying Wlad\'s framework'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Bottom action area ── */}
      {!analyzing && (
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 pb-1">
          {!recording && !recorded && !counting && (
            <>
              <BigRecordButton onClick={handleStartClick} de={de} />
              {onPickFile && (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">
                    {de ? 'oder' : 'or'}
                  </span>
                  <UploadOwnVideo onPickFile={onPickFile} de={de} />
                </>
              )}
            </>
          )}

          {recording && (
            <BigStopButton onClick={onStopRecording} de={de} />
          )}

          {recorded && (
            <div className="flex flex-wrap items-center justify-center gap-3" data-testid="recording-post-actions">
              <Button
                variant="outline"
                onClick={onReset}
                className="font-semibold h-11 px-5 border-white/15 hover:bg-white/5"
                data-testid="re-record-btn"
              >
                {de ? 'Nochmal aufnehmen' : 'Re-record'}
              </Button>
              <Button
                onClick={onSubmit}
                className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-black h-11 px-8 shadow-lg shadow-[#BFFF00]/20"
                data-testid="submit-video-btn"
              >
                {de ? 'Zur Analyse einreichen' : 'Submit for Analysis'}
                <ArrowRight size={16} className="ml-2" strokeWidth={2.5} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
