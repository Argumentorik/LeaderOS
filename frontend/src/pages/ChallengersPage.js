import { useState, useEffect, useRef, useCallback } from 'react';
import logger from '../lib/logger';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import { VoiceRecorder } from '../components/shared/VoiceRecorder';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { WladBotAvatar } from '../components/brand/WladBotAvatar';
import api from '../lib/api';
import { openStrategyCall } from '../lib/calendly';
import {
  Trophy, Send, Loader2, ArrowRight, Star,
  ArrowLeft, Shield, Zap, ChevronRight, Volume2, VolumeX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* Strip markdown bold from AI text */
const cleanText = (t) => (t || '').replace(/\*\*/g, '').replace(/\*/g, '');

/* Browser TTS fallback (used if ElevenLabs fails) */
const browserSpeak = (text, lang = 'de') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(cleanText(text));
  u.lang = lang === 'de' ? 'de-DE' : 'en-US';
  u.rate = 0.95;
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
};

/* Current audio element reference — used to stop in-flight synthesis */
let _currentAudio = null;

/* ElevenLabs persona TTS — falls back to browser synthesis if API fails */
const speakPersona = async (text, persona, api, lang = 'de') => {
  stopSpeaking();
  const clean = cleanText(text).slice(0, 800);
  if (!clean || !persona) return;
  try {
    const res = await api.post('/voice/tts', { text: clean, persona });
    const audio = new Audio(res.data.audio_url);
    _currentAudio = audio;
    await audio.play();
  } catch {
    // Fallback to browser TTS so the feature still works
    browserSpeak(clean, lang);
  }
};

const stopSpeaking = () => {
  window.speechSynthesis?.cancel();
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
    _currentAudio = null;
  }
};

const DIFF = {
  hard: { label: 'Schwer', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  medium: { label: 'Mittel', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
};

export default function ChallengersPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [challengers, setChallengers] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [activeChallengerData, setActiveChallengerData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [ttsEnabled, setTtsEnabled] = useState(false); // Tester-Feedback: kein Audio-Autoplay — User schaltet bewusst ein
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const loadChallengers = useCallback(async () => {
    try { const res = await api.get('/challengers'); setChallengers(res.data); } catch (err) { logger.error(err); }
  }, []);
  const loadHistory = useCallback(async () => {
    try { const res = await api.get('/challengers/history'); setHistory(res.data); } catch (err) { logger.error(err); }
  }, []);

  // Iter 92.48 (Mert · GODMODE): Warm-cache everything the moment the user
  // hits this page — so the first click feels INSTANT.
  //
  // 1) Prefetch avatar images (browser cache) — no more slow image pop-in.
  // 2) Prefetch ElevenLabs TTS for each challenger's static intro. On the
  //    first visit this actually synthesises (~2-4s per persona, kicked off
  //    in parallel); on repeat visits the audio is already cached server-side
  //    and returns as a base64 data-URL in <200ms → the voice plays the
  //    instant the user picks a challenger. "Vorab catchen ist ja sowieso
  //    immer der selbe start" — exactly what Mert asked for.
  const warmedRef = useRef(false);
  useEffect(() => {
    if (warmedRef.current || challengers.length === 0) return;
    warmedRef.current = true;
    // (a) Image preload — via Image() so browser puts them in the disk cache
    // without rendering them yet.
    challengers.forEach((c) => {
      if (!c?.avatar) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = c.avatar;
    });
    // (b) Voice warm-cache — fetch static intros then hit /voice/tts
    // SEQUENTIALLY (ElevenLabs caps concurrent requests at 3). Fire-and-forget:
    // any failure just means the user hears the voice ~2s later on first click.
    (async () => {
      try {
        const res = await api.get('/challengers/intros');
        const intros = res.data || [];
        for (const it of intros) {
          await api.post('/voice/tts', {
            text: it.initial_message,
            persona: it.challenger_id,
          }).catch(() => null);
        }
      } catch (err) {
        logger.warn?.('Challenger warm-cache skipped:', err?.message);
      }
    })();
  }, [challengers]);

  useEffect(() => { loadChallengers(); loadHistory(); }, [loadChallengers, loadHistory]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => () => stopSpeaking(), []);

  const startChallenge = async (challengerId) => {
    setStarting(true); setResult(null);
    try {
      const res = await api.post(`/challengers/${challengerId}/start`);
      setActiveChallenge(res.data.challenge_id);
      setActiveChallengerData(res.data.challenger);
      const clean = cleanText(res.data.initial_message);
      setMessages([{ role: 'assistant', content: clean }]);
      if (ttsEnabled) speakPersona(clean, challengerId, api, lang);
    } catch (err) { logger.error(err); } finally { setStarting(false); }
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading || !activeChallenge) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await api.post(`/challengers/${activeChallengerData.challenger_id}/message`, {
        message: msg, challenge_id: activeChallenge
      });
      const clean = cleanText(res.data.response);
      setMessages(prev => [...prev, { role: 'assistant', content: clean }]);
      if (res.data.result) setResult(res.data.result);
      else if (ttsEnabled) speakPersona(clean, activeChallengerData.challenger_id, api, lang);
    } catch (err) { logger.error(err); } finally { setLoading(false); }
  };

  const endChallenge = async () => {
    if (loading || !activeChallenge) return;
    setLoading(true);
    stopSpeaking();
    try {
      const res = await api.post(`/challengers/${activeChallengerData.challenger_id}/message`, {
        message: '', challenge_id: activeChallenge, finish: true
      });
      if (res.data.result) setResult(res.data.result);
    } catch (err) { logger.error(err); } finally { setLoading(false); }
  };

  const resetChallenge = () => {
    stopSpeaking();
    setActiveChallenge(null); setActiveChallengerData(null); setMessages([]); setResult(null);
    loadHistory();
  };

  const handleVoiceResult = (text) => { if (text.trim()) sendMessage(text.trim()); };

  const passedChallengers = history.filter(h => h.result?.hired).map(h => h.challenger_id);

  // ── CARD VIEW ──
  if (!activeChallenge && !result) {
    return (
      <DashboardLayout>
        <LoadingOverlay isOpen={starting} flow="challenger" de={lang === 'de'} />
        <div className="p-6 lg:p-10 max-w-5xl mx-auto" data-testid="challengers-page">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20"><Trophy size={22} className="text-white" /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{lang === 'de' ? 'Leadership Challengers' : 'Leadership Challengers'}</h1>
              <p className="text-sm text-muted-foreground font-medium">{lang === 'de' ? 'Stelle dich den Interviews mit legendären Leadern.' : 'Face legendary leaders in simulated interviews.'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challengers.map((c) => {
              const passed = passedChallengers.includes(c.challenger_id);
              const diff = DIFF[c.difficulty] || DIFF.medium;
              return (
                <Card key={c.challenger_id} className="group relative overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-black/[0.06] dark:border-white/[0.08] cursor-pointer card-premium"
                  onClick={() => !starting && startChallenge(c.challenger_id)} data-testid={`challenger-${c.challenger_id}`}>
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className="relative w-28 sm:w-32 shrink-0">
                        <img src={c.avatar} alt={c.name} className="w-full h-full object-cover min-h-[160px]"
                          loading="eager" decoding="async" fetchPriority="high"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        <div className="hidden w-full h-full items-center justify-center text-2xl font-black text-white min-h-[160px]" style={{ backgroundColor: c.color || '#6366F1' }}>
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {passed && <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">HIRED</div>}
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-bold">{c.name}</h3>
                            <Badge className={`${diff.bg} ${diff.text} text-[9px] font-bold border-0 px-2`}>{diff.label}</Badge>
                          </div>
                          <p className="text-xs font-semibold mb-0.5" style={{ color: c.color }}>{c.company} — {c.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 mt-1">{c.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Shield size={10} /><span>{c.style?.split(',')[0]}</span></div>
                          <div className="flex items-center gap-1 text-xs font-semibold group-hover:text-[#4A6200] transition-colors">
                            {lang === 'de' ? 'Challenge starten' : 'Start'} <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── CHAT VIEW ──
  if ((activeChallenge || messages.length > 0) && !result) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-[calc(100vh-2rem)]" data-testid="challenger-chat">
          {/* Header */}
          <div className="border-b border-border/50 px-4 py-3 flex items-center gap-3 bg-white/80 dark:bg-card/80 backdrop-blur-xl sticky top-0 z-10">
            <Button size="icon" variant="ghost" onClick={resetChallenge} className="shrink-0 w-8 h-8" data-testid="back-challengers-btn"><ArrowLeft size={18} /></Button>
            {activeChallengerData && (
              <>
                <div className="relative">
                  <Avatar className="w-10 h-10 border-2 shadow-sm" style={{ borderColor: activeChallengerData.color }}>
                    <AvatarImage src={activeChallengerData.avatar} />
                    <AvatarFallback style={{ backgroundColor: activeChallengerData.color, color: 'white' }} className="font-bold text-xs">{activeChallengerData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-card" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{activeChallengerData.name}</p>
                  <p className="text-[10px] font-medium truncate" style={{ color: activeChallengerData.color }}>{activeChallengerData.company} — {activeChallengerData.title}</p>
                </div>
                <button onClick={() => { setTtsEnabled(!ttsEnabled); if (ttsEnabled) stopSpeaking(); }}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors" data-testid="tts-toggle">
                  {ttsEnabled ? <Volume2 size={16} className="text-[#6B8A00] dark:text-[#BFFF00]" /> : <VolumeX size={16} className="text-muted-foreground" />}
                </button>
                {messages.filter(m => m.role === 'user').length >= 1 && (
                  <Button
                    size="sm"
                    onClick={endChallenge}
                    disabled={loading}
                    className="h-8 px-3 bg-[#BFFF00] hover:bg-[#d4ff4d] text-[#0A0A0A] text-[11px] font-black shrink-0"
                    data-testid="end-challenge-btn"
                  >
                    {lang === 'de' ? 'Beenden & Feedback' : 'End & Feedback'}
                  </Button>
                )}
                <Badge variant="outline" className="text-[9px] font-bold border-amber-300 text-amber-600 shrink-0"><Zap size={8} className="mr-0.5" /> LIVE</Badge>
              </>
            )}
          </div>

          {/* ── MEETING STAGE (Iter 92.54 · 11x.ai-style): big "camera on" view ── */}
          {activeChallengerData && (
            <div className="px-4 pt-3" data-testid="challenger-meeting-stage">
              <div
                className="relative max-w-2xl mx-auto h-44 sm:h-56 rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
                style={{ background: `linear-gradient(135deg, #0A0A0A 30%, ${activeChallengerData.color}33 130%)` }}
              >
                {/* Subtle grid — video-call backdrop */}
                <div aria-hidden className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />

                {/* Challenger "camera feed" — large portrait */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <span
                      aria-hidden
                      className="absolute -inset-2 rounded-full"
                      style={{
                        border: `2px solid ${activeChallengerData.color}`,
                        opacity: loading ? 0.9 : 0.45,
                        animation: loading ? 'ping 1.6s cubic-bezier(0,0,0.2,1) infinite' : 'none',
                      }}
                    />
                    <img
                      src={activeChallengerData.avatar}
                      alt={activeChallengerData.name}
                      className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover shadow-2xl"
                      style={{ border: `3px solid ${activeChallengerData.color}`, animation: 'wladBreath 4.5s ease-in-out infinite' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                </div>

                {/* LIVE badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-black tracking-[0.14em] text-white/80">LIVE MEETING</span>
                </div>

                {/* Name plate */}
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/55 backdrop-blur-md border border-white/10">
                  <p className="text-[12px] font-bold text-white leading-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {activeChallengerData.name}
                  </p>
                  <p className="text-[9.5px] text-white/50">
                    {activeChallengerData.company} · {loading ? (lang === 'de' ? 'denkt nach…' : 'thinking…') : (lang === 'de' ? 'im Gespräch' : 'in conversation')}
                  </p>
                </div>

                {/* Self tile — "your camera" */}
                <div className="absolute bottom-3 right-3 w-16 h-11 sm:w-20 sm:h-14 rounded-lg bg-[#141414] border border-white/15 shadow-lg flex items-center justify-center overflow-hidden" data-testid="meeting-self-tile">
                  <span className="text-[13px] font-black text-[#BFFF00]">
                    {(user?.name || 'Du').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                  <span className="absolute bottom-1 left-1.5 text-[7px] font-bold text-white/40 uppercase tracking-wider">{lang === 'de' ? 'Du' : 'You'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div key={`ch-msg-${msg.role}-${i}`} className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
                  {msg.role === 'assistant' && activeChallengerData && (
                    <Avatar className="w-8 h-8 shrink-0 shadow-sm border" style={{ borderColor: activeChallengerData.color + '40' }}>
                      <AvatarImage src={activeChallengerData.avatar} />
                      <AvatarFallback style={{ backgroundColor: activeChallengerData.color, color: 'white' }} className="text-[10px] font-bold">{activeChallengerData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[78%] ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] rounded-2xl rounded-br-md shadow-md shadow-[#BFFF00]/15'
                    : 'bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-2xl rounded-bl-md shadow-sm'
                  } px-4 py-3`}>
                    {msg.role === 'assistant' && activeChallengerData && <p className="text-[10px] font-bold mb-1 opacity-60">{activeChallengerData.name}</p>}
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {/* Typing */}
              {loading && activeChallengerData && (
                <div className="flex items-end gap-2.5 animate-fade-in">
                  <Avatar className="w-8 h-8 shrink-0 shadow-sm border" style={{ borderColor: activeChallengerData.color + '40' }}>
                    <AvatarImage src={activeChallengerData.avatar} />
                    <AvatarFallback style={{ backgroundColor: activeChallengerData.color, color: 'white' }} className="text-[10px] font-bold">{activeChallengerData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="bg-white dark:bg-card border border-black/[0.06] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" /><div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} /></div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input (no pre-canned answers — open reflection & voice only) */}
          <div className="border-t border-border/50 bg-white/80 dark:bg-card/80 backdrop-blur-xl">
            <div className="flex gap-2 p-3 max-w-2xl mx-auto items-end">
              <VoiceRecorder onTranscription={handleVoiceResult} disabled={loading} />
              <Textarea data-testid="challenger-input" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={lang === 'de' ? 'Deine Antwort — frei formulieren oder einsprechen...' : 'Your answer — type freely or speak...'}
                className="resize-none min-h-[44px] max-h-32 rounded-xl border-black/[0.08] bg-gray-50 dark:bg-muted/30 focus:bg-white dark:focus:bg-card transition-colors" rows={1} />
              <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} size="icon"
                className="bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] shadow-md shadow-[#BFFF00]/15 shrink-0 w-10 h-10 rounded-xl"
                data-testid="challenger-send-btn">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── RESULT VIEW ──
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-2xl mx-auto" data-testid="challenge-result">
        <div className="animate-fade-in space-y-6">
          <div className="text-center">
            {activeChallengerData && (
              <div className="relative inline-block mb-4">
                <Avatar className="w-20 h-20 border-4 shadow-xl" style={{ borderColor: result?.hired ? '#22C55E' : '#EF4444' }}>
                  <AvatarImage src={activeChallengerData.avatar} />
                  <AvatarFallback style={{ backgroundColor: activeChallengerData.color, color: 'white' }} className="text-xl font-bold">{activeChallengerData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${result?.hired ? 'bg-green-500' : 'bg-red-500'}`}>
                  {result?.hired ? <Trophy size={14} className="text-white" /> : <Star size={14} className="text-white" />}
                </div>
              </div>
            )}
            <h2 className="text-2xl font-black mb-1">{result?.hired ? (lang === 'de' ? 'Du bist eingestellt!' : "You're Hired!") : (lang === 'de' ? 'Noch nicht...' : 'Not Yet...')}</h2>
            <p className="text-sm text-muted-foreground mb-3">{activeChallengerData?.name} — {activeChallengerData?.title}</p>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#BFFF00]/[0.06] to-[#BFFF00]/[0.04] dark:from-[#BFFF00]/10 dark:to-purple-500/10">
              <span className="text-3xl font-black gradient-text">{result?.score || 0}</span><span className="text-sm text-muted-foreground">/ 100</span>
            </div>
          </div>
          {result?.feedback && (
            <Card className="bg-white/80 dark:bg-card/80"><CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 shrink-0 mt-0.5"><AvatarImage src={activeChallengerData?.avatar} /><AvatarFallback style={{ backgroundColor: activeChallengerData?.color, color: 'white' }} className="text-[10px] font-bold">{activeChallengerData?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                <div><p className="text-[10px] font-bold text-muted-foreground mb-1">{activeChallengerData?.name}</p><p className="text-sm leading-relaxed">{cleanText(result.feedback)}</p></div>
              </div>
            </CardContent></Card>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result?.strengths?.length > 0 && (
              <Card className="border-l-[3px] border-l-green-500"><CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-2">{lang === 'de' ? 'Stärken' : 'Strengths'}</p>
                <ul className="space-y-1.5">{result.strengths.map((s, i) => <li key={`str-${i}`} className="text-xs flex gap-1.5"><span className="text-green-500 shrink-0">+</span>{cleanText(s)}</li>)}</ul>
              </CardContent></Card>
            )}
            {result?.improvements?.length > 0 && (
              <Card className="border-l-[3px] border-l-amber-500"><CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-2">{lang === 'de' ? 'Verbesserungen' : 'Improvements'}</p>
                <ul className="space-y-1.5">{result.improvements.map((s, i) => <li key={`imp-${i}`} className="text-xs flex gap-1.5"><span className="text-amber-500 shrink-0">-</span>{cleanText(s)}</li>)}</ul>
              </CardContent></Card>
            )}
          </div>
          {result?.detailed_analysis && (
            <Card className="bg-white/80 dark:bg-card/80" data-testid="challenge-detailed-analysis"><CardContent className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{lang === 'de' ? 'Detail-Analyse' : 'Detailed Analysis'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'kommunikation', label: lang === 'de' ? 'Kommunikation' : 'Communication', color: '#0EA5E9' },
                  { key: 'fuehrung', label: lang === 'de' ? 'Führung' : 'Leadership', color: '#BFFF00' },
                  { key: 'strategie', label: lang === 'de' ? 'Strategie' : 'Strategy', color: '#8B5CF6' },
                  { key: 'authentizitaet', label: lang === 'de' ? 'Authentizität' : 'Authenticity', color: '#EC4899' },
                ].filter(d => result.detailed_analysis[d.key]).map(d => (
                  <div key={d.key} className="p-3 rounded-xl bg-muted/30 border-l-[3px]" style={{ borderLeftColor: d.color }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: d.color }}>{d.label}</p>
                    <p className="text-xs leading-relaxed">{cleanText(result.detailed_analysis[d.key])}</p>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}
          {result?.next_steps?.length > 0 && (
            <Card className="border-l-[3px] border-l-[#BFFF00]" data-testid="challenge-next-steps"><CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B8A00] dark:text-[#BFFF00] mb-2">{lang === 'de' ? 'Deine nächsten 7 Tage' : 'Your Next 7 Days'}</p>
              <ul className="space-y-1.5">{result.next_steps.map((s, i) => <li key={`ns-${i}`} className="text-xs flex gap-2"><span className="font-black text-[#6B8A00] dark:text-[#BFFF00] shrink-0">{i + 1}.</span>{cleanText(s)}</li>)}</ul>
            </CardContent></Card>
          )}
          {/* WladBot 3.0 — conversion nudge at the emotional peak (Iter 92.56) */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]" data-testid="result-wladbot-nudge">
            <WladBotAvatar size={40} live />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#BFFF00] mb-1">WladBot 3.0</p>
              <p className="text-[12px] text-white/70 leading-relaxed">
                {lang === 'de'
                  ? '„Stark, dass du dich der Challenge gestellt hast. Leader, die jetzt ein Strategiegespräch buchen, setzen ihr Feedback 3× schneller um — 15 Minuten, die sich lohnen."'
                  : '"Strong move taking the challenge. Leaders who book a strategy call now act on their feedback 3× faster — 15 minutes well spent."'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={resetChallenge} variant="outline" className="flex-1 font-semibold h-11" data-testid="try-another-btn">{lang === 'de' ? 'Anderen Challenger' : 'Try Another'}</Button>
            <Button onClick={() => openStrategyCall('challengers')} className="flex-1 bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white font-bold h-11 shadow-md" data-testid="book-coaching-btn">{lang === 'de' ? 'Strategiegespräch buchen' : 'Book Strategy Call'}</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
