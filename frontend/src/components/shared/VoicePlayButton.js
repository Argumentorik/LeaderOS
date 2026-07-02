import { useState, useRef, useCallback, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { getTtsSpeed } from '../../lib/ttsSpeed';
import { VoiceWaveVisualizer } from './VoiceWaveVisualizer';

/**
 * VoicePlayButton — triggers ElevenLabs TTS synthesis + inline <audio> playback.
 * @param {string} text - Text to speak (max 800 chars)
 * @param {string} persona - One of: wlad, bezos, musk, oprah, jobs, branson, sandberg, page, hastings
 * @param {string} size - xs | sm | md (default: sm)
 * @param {string} variant - primary | ghost | pill (default: ghost)
 * @param {string} label - Optional label override (default: "Anhören")
 * @param {boolean} showWave - Render an inline waveform visualizer next to the button
 * @param {() => void} onStart - Optional callback when synthesis starts
 * @param {() => void} onEnd - Optional callback when audio finishes
 */
export default function VoicePlayButton({
  text, persona, size = 'sm', variant = 'ghost', label,
  onStart, onEnd, className = '', testId, showWave = false,
}) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  // Force re-render when audioRef changes so the visualizer sees it
  const [audioVersion, setAudioVersion] = useState(0);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'h-8 px-3 text-[11px]',
    md: 'h-9 px-4 text-xs',
  };

  const variantClasses = {
    primary: 'bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-black shadow-md shadow-[#BFFF00]/10',
    ghost: 'bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 text-foreground border border-black/[0.06] dark:border-white/[0.06]',
    pill: 'bg-black/90 hover:bg-black text-white font-bold',
  };

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';  // release data-URL
      audioRef.current = null;
    }
    setPlaying(false);
    if (onEnd) onEnd();
  }, [onEnd]);

  // Cleanup when component unmounts or persona changes — prevents ghost audio
  // when user navigates away mid-playback.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [persona]);

  const speak = useCallback(async () => {
    if (playing) { stop(); return; }
    if (!text || !persona) return;
    setLoading(true);
    if (onStart) onStart();
    try {
      const res = await api.post('/voice/tts', { text: text.slice(0, 800), persona });
      if (!res.data.audio_url) {
        setLoading(false);
        if (onEnd) onEnd();
        return;
      }
      const audio = new Audio(res.data.audio_url);
      audio.playbackRate = getTtsSpeed();
      audio.preservesPitch = false; // browsers default to true; false = "cooler" pitched-up feel
      // Iter 92.23: keep TTS audio at native pitch — playbackRate-induced
      // pitch shifts made Wlad sound chipmunk-y. We still respect the user's
      // preferred speed (1.25× default) but no longer disable pitch
      // preservation — modern browsers handle pitch-corrected time-stretching
      // gracefully, and that's what Mert means by "standard AI sound".
      audio.preservesPitch = true;
      audioRef.current = audio;
      setAudioVersion(v => v + 1);  // Trigger re-render so visualizer picks up new audio
      // Live-update playbackRate if user changes the global speed mid-playback.
      const onSpeedChange = (e) => {
        if (audioRef.current) {
          audioRef.current.playbackRate = e.detail;
          audioRef.current.preservesPitch = false;
        }
      };
      window.addEventListener('wladbot:tts-speed', onSpeedChange);
      audio.onended = () => {
        window.removeEventListener('wladbot:tts-speed', onSpeedChange);
        setPlaying(false); if (onEnd) onEnd();
      };
      audio.onerror = () => {
        window.removeEventListener('wladbot:tts-speed', onSpeedChange);
        setPlaying(false); setLoading(false);
      };
      audio.onplay = () => { setLoading(false); setPlaying(true); };
      await audio.play();
    } catch (err) {
      logger.error('Voice TTS failed:', err);
      setLoading(false);
      setPlaying(false);
    }
  }, [text, persona, playing, stop, onStart, onEnd]);

  // Icon-only (xs) variant
  if (size === 'xs') {
    return (
      <button
        onClick={speak}
        disabled={loading}
        className={`inline-flex items-center justify-center rounded-full transition-all ${sizeClasses.xs} ${variantClasses[variant]} ${className} ${playing ? 'ring-2 ring-[#BFFF00]/40' : ''}`}
        aria-label={playing ? 'Stop' : 'Speak'}
        data-testid={testId || `voice-play-${persona}`}
      >
        {loading ? <Loader2 size={10} className="animate-spin" /> : playing ? <VolumeX size={10} /> : <Volume2 size={10} />}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      <button
        onClick={speak}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-full transition-all ${sizeClasses[size]} ${variantClasses[variant]} ${className} ${playing ? 'ring-2 ring-[#BFFF00]/40' : ''}`}
        data-testid={testId || `voice-play-${persona}`}
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : playing ? <VolumeX size={12} /> : <Volume2 size={12} />}
        <span className="font-bold">{playing ? (loading ? '...' : 'Stop') : (label || 'Anhören')}</span>
      </button>
      {showWave && (
        <VoiceWaveVisualizer
          key={audioVersion}
          audioEl={audioRef.current}
          active={playing}
          width={120}
          height={32}
        />
      )}
    </span>
  );
}
