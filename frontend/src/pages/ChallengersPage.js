import { useState, useEffect, useRef, useCallback } from 'react';
import logger from '../lib/logger';
import { toast } from 'sonner';
import { FeatureVideoSection } from '../components/guide/FeatureVideoSection';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ChallengerCards } from '../components/challengers/ChallengerCards';
import { ChallengerChat } from '../components/challengers/ChallengerChat';
import { ChallengerResult } from '../components/challengers/ChallengerResult';
import { cleanText, speakPersona, stopSpeaking } from '../lib/challengerSpeech';
import api from '../lib/api';
import { swrGet } from '../lib/swrCache';

const CHALLENGER_CLIPS = ['bp-challengers'];

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

  const loadChallengers = useCallback(async () => {
    await swrGet('/challengers', setChallengers, { onError: (err) => logger.error(err) });
  }, []);
  const loadHistory = useCallback(async () => {
    await swrGet('/challengers/history', setHistory, { onError: (err) => logger.error(err) });
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
    } catch (err) {
      logger.error(err);
      toast.error(lang === 'de' ? 'Start fehlgeschlagen. Bitte versuche es erneut.' : 'Could not start. Please try again.');
    } finally { setStarting(false); }
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading || !activeChallenge) return;
    // 1.7: Eingabe erst bei Erfolg leeren; bei Fehler Text zurücklegen + Toast.
    const fromInput = !text;
    const sendId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMessages(prev => [...prev, { role: 'user', content: msg, _sendId: sendId }]);
    setLoading(true);
    try {
      const res = await api.post(`/challengers/${activeChallengerData.challenger_id}/message`, {
        message: msg, challenge_id: activeChallenge
      });
      const clean = cleanText(res.data.response);
      setMessages(prev => [...prev, { role: 'assistant', content: clean }]);
      if (res.data.result) setResult(res.data.result);
      else if (ttsEnabled) speakPersona(clean, activeChallengerData.challenger_id, api, lang);
      if (fromInput) setInput('');
    } catch (err) {
      logger.error(err);
      setMessages(prev => prev.filter(m => m._sendId !== sendId));
      if (fromInput) setInput(msg);
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' && detail
        ? detail
        : (lang === 'de' ? 'Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.' : 'Could not send message. Please try again.'));
    } finally { setLoading(false); }
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
    } catch (err) {
      logger.error(err);
      toast.error(lang === 'de' ? 'Auswertung fehlgeschlagen. Bitte versuche es erneut.' : 'Could not finish. Please try again.');
    } finally { setLoading(false); }
  };

  const resetChallenge = () => {
    stopSpeaking();
    setActiveChallenge(null); setActiveChallengerData(null); setMessages([]); setResult(null);
    loadHistory();
  };

  const handleVoiceResult = (text) => { if (text.trim()) sendMessage(text.trim()); };

  const de = lang === 'de';
  const passedChallengers = history.filter(h => h.result?.hired).map(h => h.challenger_id);
  const inChat = activeChallenge && !result;

  return (
    <DashboardLayout>
      {!activeChallenge && !result && (
        <>
          <LoadingOverlay isOpen={starting} flow="challenger" de={de} />
          <div className="px-6 pt-6 lg:px-10 xl:px-14 w-full">
            <FeatureVideoSection slugs={CHALLENGER_CLIPS} de={de} />
          </div>
          <ChallengerCards challengers={challengers} passedIds={passedChallengers} de={de} starting={starting} onStart={startChallenge} />
        </>
      )}
      {inChat && (
        <ChallengerChat
          p={activeChallengerData} de={de} userName={user?.name} messages={messages} input={input} setInput={setInput}
          loading={loading} ttsEnabled={ttsEnabled}
          onToggleTts={() => { setTtsEnabled(!ttsEnabled); if (ttsEnabled) stopSpeaking(); }}
          onSend={sendMessage} onVoice={handleVoiceResult} onEnd={endChallenge} onBack={resetChallenge} scrollRef={scrollRef}
        />
      )}
      {result && <ChallengerResult result={result} p={activeChallengerData} de={de} onReset={resetChallenge} />}
    </DashboardLayout>
  );
}
