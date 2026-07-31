import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import logger from '../lib/logger';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { Progress } from '../components/ui/progress';
import { VoiceRecorder } from '../components/shared/VoiceRecorder';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../lib/api';
import { openStrategyCall } from '../lib/calendly';
import { downloadHTMLReport } from '../lib/reportGenerator';
import {
  Swords, Play, Send, Square, Loader2, Trophy, Target,
  HeartHandshake, MessageSquareText, ArrowRight, Star,
  Download, X, Mic, Pause, Sparkles
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SimulationBriefing } from '../components/shared/SimulationBriefing';
// Perf: the prep wizard is heavy (framer-motion steps, voice input) and only
// opens on demand — lazy chunk keeps the simulations page load fast.
const ArgumentationPrepModal = lazy(() =>
  import('../components/simulations/ArgumentationPrepModal').then(m => ({ default: m.ArgumentationPrepModal }))
);
import { stopAllAudio } from '../lib/audioBus';
import { toast } from 'sonner';

const difficultyConfig = {
  easy: { gradient: 'from-green-500 to-emerald-500', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200/40 dark:border-green-500/20', label: 'Leicht', labelEn: 'Easy', minutes: '~5 Min' },
  medium: { gradient: 'from-amber-500 to-orange-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200/40 dark:border-amber-500/20', label: 'Mittel', labelEn: 'Medium', minutes: '~8 Min' },
  hard: { gradient: 'from-red-500 to-pink-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200/40 dark:border-red-500/20', label: 'Schwer', labelEn: 'Hard', minutes: '~10 Min' },
};

const ScenarioCard = ({ scenario, onStart, loading, de = true }) => {
  const isPrep = scenario.kind === 'preparation';
  const diff = difficultyConfig[scenario.difficulty] || difficultyConfig.medium;
  // Iter 121.6: preparation-cards get a distinct visual identity (Wlad-lime
  // gradient + Sparkles icon + "SEXIER-PREP" badge) so users understand this
  // isn't a live simulation but a coaching wizard.
  const gradient = isPrep ? 'from-[#BFFF00] to-[#9ACC00]' : diff.gradient;
  return (
    <Card className={`hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-1 hover:border-[#BFFF00]/40 transition-all duration-300 group cursor-pointer border-black/[0.04] dark:border-white/[0.06] overflow-hidden ${isPrep ? 'ring-1 ring-[#BFFF00]/30' : ''}`} onClick={() => onStart(scenario)} data-testid={`scenario-${scenario.scenario_id}`}>
      <CardContent className="p-5 relative">
        <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradient} opacity-70`} />
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            {isPrep ? <Sparkles size={18} className="text-[#0A0A0A]" /> : <Swords size={18} className="text-white" />}
          </div>
          <div className="flex items-center gap-1.5">
            {isPrep ? (
              <Badge className="bg-[#BFFF00] text-[#0A0A0A] text-[10px] font-black border-0">SEXIER-PREP</Badge>
            ) : (
              <>
                <Badge className={`${diff.bg} ${diff.text} text-[10px] font-bold border-0`}>{de ? diff.label : diff.labelEn}</Badge>
                <Badge className="bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground text-[10px] font-bold border-0">{diff.minutes}</Badge>
              </>
            )}
          </div>
        </div>
        <h3 className="text-[15px] font-bold mb-1 group-hover:text-[#6B8A00] dark:group-hover:text-[#BFFF00] transition-colors">{scenario.title}</h3>
        <p className="text-[12px] text-muted-foreground mb-3 line-clamp-2">{scenario.description}</p>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            {isPrep ? <><Target size={10} /> Vor-Coaching · 4 Schritte</> : <><Mic size={10} /> Voice + Text</>}
          </p>
          <Button size="sm" disabled={loading} className={`font-bold text-xs h-8 shadow-sm transition-all group-hover:scale-[1.04] ${isPrep ? 'bg-[#0A0A0A] hover:bg-[#1A1A2E] text-[#BFFF00]' : 'bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] shadow-[#BFFF00]/20'}`} data-testid={`start-sim-${scenario.scenario_id}`}>
            {isPrep ? <><Sparkles size={12} className="mr-1" /> Prep starten</> : <><Play size={12} className="mr-1" fill="currentColor" /> Start</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ScenarioSkeleton = () => (
  <div className="rounded-xl border border-black/[0.04] dark:border-white/[0.06] p-5 space-y-3 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 rounded-xl bg-black/[0.06] dark:bg-white/[0.08]" />
      <div className="w-16 h-5 rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
    </div>
    <div className="h-4 w-3/4 rounded bg-black/[0.06] dark:bg-white/[0.08]" />
    <div className="h-3 w-full rounded bg-black/[0.04] dark:bg-white/[0.06]" />
    <div className="h-3 w-2/3 rounded bg-black/[0.04] dark:bg-white/[0.06]" />
  </div>
);

const ScoreDisplay = ({ scores, messages, navigate, onRestart }) => {
  const [showUpsell, setShowUpsell] = useState(false);

  const downloadReport = () => {
    downloadHTMLReport({
      title: 'Leadership Simulation Report',
      subtitle: 'AI-Powered Performance Analysis',
      scores: [
        { label: 'Empathy', value: scores.empathy_score || 0, color: '#EC4899' },
        { label: 'Leadership', value: scores.leadership_score || 0, color: '#2563EB' },
        { label: 'Clarity', value: scores.clarity_score || 0, color: '#06B6D4' },
        { label: 'Overall', value: scores.overall_score || 0, color: '#F59E0B' },
      ],
      sections: [
        ...(scores.feedback ? [{ title: 'KI-Feedback', content: scores.feedback, type: 'info' }] : []),
        ...(scores.strengths?.length ? [{ title: 'Stärken', content: scores.strengths, type: 'success' }] : []),
        ...(scores.improvements?.length ? [{ title: 'Verbesserungspotenzial', content: scores.improvements, type: 'warning' }] : []),
        { title: 'Gesprächsverlauf', content: messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n') },
      ],
    });
  };

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in" data-testid="simulation-scores">
      {/* Upsell Popup */}
      {showUpsell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg mx-4 animate-slide-up"><div className="upsell-border"><div className="p-8 text-center">
            <button onClick={() => setShowUpsell(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={20} /></button>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25"><Star size={28} className="text-white" /></div>
            <h2 className="text-2xl font-black mb-2">Persönliches Coaching freischalten</h2>
            <p className="text-muted-foreground mb-4">Beschleunige dein Leadership-Wachstum mit 1:1 Experten-Coaching basierend auf deinen Simulationsergebnissen.</p>
            <div className="flex items-center justify-center gap-2 mb-6"><span className="text-4xl font-black gradient-text">997</span><span className="text-lg text-muted-foreground">EUR / 6 Monate</span></div>
            <Button className="w-full bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white font-bold h-12 shadow-lg shadow-blue-500/25" onClick={() => openStrategyCall('simulations')} data-testid="sim-upsell-cta">
              Strategiegespräch buchen <ArrowRight size={16} className="ml-2" />
            </Button>
          </div></div></div>
        </div>
      )}

      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
          <Trophy size={28} className="text-white" />
        </div>
        <h3 className="text-xl font-black">Simulation abgeschlossen</h3>
        <p className="text-sm text-muted-foreground">Hier ist dein personalisierter Leistungsreport</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Empathie', score: scores.empathy_score, gradient: 'from-pink-500 to-rose-500' },
          { label: 'Leadership', score: scores.leadership_score, gradient: 'from-[#0A0A0A] to-[#1A1A2E]' },
          { label: 'Klarheit', score: scores.clarity_score, gradient: 'from-cyan-500 to-blue-500' },
          { label: 'Gesamt', score: scores.overall_score, gradient: 'from-amber-500 to-orange-500' },
        ].map((s) => (
          <Card key={s.label} className="bg-white/60 dark:bg-card/50 border-black/[0.04] dark:border-white/[0.06]">
            <CardContent className="p-4">
              <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</span>
              <p className="text-3xl font-black mt-1">{s.score}</p>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-muted mt-2 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${s.gradient} transition-all duration-1000`} style={{ width: `${s.score}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {scores.feedback && (
        <Card className="bg-gradient-to-r from-blue-50 to-[#BFFF00]/[0.04] dark:from-blue-500/5 dark:to-[#BFFF00]/[0.03] border-sky-200/30 dark:border-blue-500/10">
          <CardContent className="p-5"><p className="text-sm leading-relaxed">{scores.feedback}</p></CardContent>
        </Card>
      )}

      {scores.strengths?.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-green-600">Stärken</p>
          {scores.strengths.map((s, i) => <div key={`str-${s.slice(0,20)}-${i}`} className="flex items-center gap-2 text-sm"><div className="w-1.5 h-1.5 rounded-full bg-green-500" />{s}</div>)}
        </div>
      )}
      {scores.improvements?.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-500">Verbesserungspotenzial</p>
          {scores.improvements.map((s, i) => <div key={`imp-${s.slice(0,20)}-${i}`} className="flex items-center gap-2 text-sm"><div className="w-1.5 h-1.5 rounded-full bg-red-500" />{s}</div>)}
        </div>
      )}

      {/* Download Report */}
      <Button variant="outline" onClick={downloadReport} className="w-full border-black/10 dark:border-white/10 font-semibold" data-testid="download-report-btn">
        <Download size={14} className="mr-2" /> Vollständigen Bericht herunterladen
      </Button>

      {/* Back to arena */}
      <Button onClick={onRestart} className="w-full bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-black h-11 shadow-md shadow-[#BFFF00]/20" data-testid="sim-restart-btn">
        <Swords size={15} className="mr-2" /> Neue Simulation starten
      </Button>

      {/* Upsell */}
      <div className="upsell-border">
        <div className="p-5 flex items-center gap-4" data-testid="sim-upsell-banner">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
            <Star size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold">Willst du dich 3x schneller verbessern?</p>
            <p className="text-[12px] text-muted-foreground">Hol dir personalisiertes 1:1 Coaching basierend auf deinen Ergebnissen</p>
          </div>
          <Button onClick={() => setShowUpsell(true)} className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white font-bold shadow-sm shrink-0" data-testid="sim-upsell-btn">
            Mehr erfahren <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function SimulationsPage() {
  const { lang } = useLanguage();
  const [scenarios, setScenarios] = useState([]);
  const [scenariosLoading, setScenariosLoading] = useState(true);
  const [activeSim, setActiveSim] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState(null);
  const [briefingScenario, setBriefingScenario] = useState(null);
  // Iter 121.6: separate „Argumentation vorbereiten"-Wizard (nicht die klassische Simulation)
  const [argPrepOpen, setArgPrepOpen] = useState(false);
  const [sharedTemplate, setSharedTemplate] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  // Iter 121.6: proper Pause (nicht mehr Beenden!) — hält Audio an, aber
  // activeSim, messages und der Kontext bleiben komplett erhalten.
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const loadScenarios = useCallback(async () => {
    try { const res = await api.get('/simulations/scenarios'); setScenarios(res.data); }
    catch (err) { logger.error('Failed to load scenarios:', err); }
    finally { setScenariosLoading(false); }
  }, []);
  useEffect(() => { loadScenarios(); }, [loadScenarios]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Iter 124 (Wlad Godmode): open ArgPrep w/ shared template when ?tpl= is present.
  // ?prep=1 (dashboard quick-access) opens the wizard directly.
  useEffect(() => {
    if (searchParams.get('prep') === '1') {
      setArgPrepOpen(true);
      searchParams.delete('prep');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const token = searchParams.get('tpl');
    if (!token) return;
    (async () => {
      try {
        const res = await api.get(`/simulations/argumentation-templates/shared/${token}`);
        setSharedTemplate({
          id: res.data.template_id,
          template_id: res.data.template_id,
          label: res.data.label,
          hint: res.data.hint,
          data: res.data.data,
        });
        setArgPrepOpen(true);
        toast.success(`Geteilte Vorlage geladen: ${res.data.label}`, { duration: 2600 });
      } catch (err) {
        logger.error('shared tpl load', err);
        toast.error('Diese Vorlage ist nicht mehr verfügbar.');
      } finally {
        searchParams.delete('tpl');
        setSearchParams(searchParams, { replace: true });
      }
    })();
  }, [searchParams, setSearchParams]);

  const startSimulation = async (scenarioId, setup = {}) => {
    setLoading(true);
    try {
      const res = await api.post('/simulations', { scenario: scenarioId, ...setup });
      setActiveSim(res.data.simulation_id);
      setActiveScenario(briefingScenario);
      setMessages([{ role: 'assistant', content: res.data.initial_message }]);
      setScores(null);
      setBriefingScenario(null);
    } catch (err) { logger.error('Failed to start simulation:', err); } finally { setLoading(false); }
  };
  const sendMessage = async (overrideMsg) => {
    const text = (overrideMsg || input).trim();
    if (!text || loading || !activeSim) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await api.post(`/simulations/${activeSim}/message`, { message: text });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
      if (res.data.scores) setScores(res.data.scores);
      if (res.data.ended) setActiveSim(null);
    } catch (err) { logger.error('Failed to send sim message:', err); } finally { setLoading(false); }
  };
  const endSimulation = async () => {
    if (!activeSim) return;
    setLoading(true);
    try {
      const res = await api.post(`/simulations/${activeSim}/message`, { message: 'end simulation' });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
      if (res.data.scores) setScores(res.data.scores);
      setActiveSim(null);
    } catch (err) { logger.error('Failed to end simulation:', err); } finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen" data-testid="simulations-page">
        {/* Header */}
        <div className="border-b border-black/[0.06] dark:border-white/[0.06] px-6 py-4 flex items-center justify-between bg-white/80 dark:bg-card/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-sm">
              <Swords size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black">{lang === 'de' ? 'Leadership Simulationen' : 'Leadership Simulations'}</h2>
              <p className="text-[11px] text-muted-foreground font-medium">{lang === 'de' ? 'Übe echte Gespräche. Nutze Stimme oder Text. Werde bewertet.' : 'Practice real conversations. Use voice or text. Get scored.'}</p>
            </div>
          </div>
          {activeSim && (
            <div className="flex items-center gap-2">
              {/* Iter 121.6: Pause hält Audio an, State/Transcript bleibt.
                  Nutzer kann jederzeit auf „Weiter" klicken und dort weitermachen. */}
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  if (!paused) {
                    stopAllAudio('simulation-pause');
                    setPaused(true);
                  } else {
                    setPaused(false);
                  }
                }}
                className={`font-black border-black/10 dark:border-white/10 ${paused ? 'text-[#6B8A00] dark:text-[#BFFF00] hover:bg-[#BFFF00]/10' : 'text-foreground/80'}`}
                data-testid="pause-simulation-btn"
                title={paused ? (lang === 'de' ? 'Simulation fortsetzen' : 'Resume simulation') : (lang === 'de' ? 'Audio pausieren — Konversation bleibt erhalten' : 'Pause audio — conversation is preserved')}
              >
                {paused ? <><Play size={16} className="mr-2" fill="currentColor" /> {lang === 'de' ? 'Weiter' : 'Resume'}</> : <><Pause size={16} className="mr-2" fill="currentColor" /> {lang === 'de' ? 'Pause' : 'Pause'}</>}
              </Button>
              <Button
                size="lg"
                onClick={endSimulation}
                className="bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-500/25"
                data-testid="end-simulation-btn"
              >
                <Square size={16} className="mr-2" fill="white" /> {lang === 'de' ? 'JETZT BEENDEN & BEWERTEN' : 'END NOW & SCORE'}
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 px-6 py-6 bg-gradient-mesh">
          {!activeSim && !scores && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] p-6 sm:p-8 text-white">
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#BFFF00]/10 blur-3xl" />
                <Badge className="bg-[#BFFF00] text-[#0A0A0A] border-0 text-[10px] font-black mb-3">TRAINING ARENA</Badge>
                <h3 className="text-2xl sm:text-3xl font-black mb-1.5">{lang === 'de' ? 'Übe die Gespräche, die zählen.' : 'Practice the conversations that matter.'}</h3>
                <p className="text-sm text-white/60 max-w-lg">{lang === 'de' ? 'Reale Leadership-Szenarien mit KI-Gegenüber. Sprich oder schreibe — am Ende bekommst du eine ehrliche Bewertung mit konkretem Feedback.' : 'Real leadership scenarios with an AI counterpart. Speak or type — at the end you get an honest score with concrete feedback.'}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    { icon: Swords, label: lang === 'de' ? `${scenarios.length || '…'} Szenarien` : `${scenarios.length || '…'} scenarios` },
                    { icon: Mic, label: lang === 'de' ? 'Voice + Text' : 'Voice + text' },
                    { icon: Trophy, label: lang === 'de' ? 'KI-Bewertung + Report' : 'AI score + report' },
                  ].map((c) => (
                    <span key={c.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] text-[11px] font-bold">
                      <c.icon size={11} className="text-[#BFFF00]" /> {c.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenariosLoading
                  ? [1, 2, 3, 4, 5, 6].map((i) => <ScenarioSkeleton key={i} />)
                  : scenarios.map((s) => (
                    <ScenarioCard
                      key={s.scenario_id}
                      scenario={s}
                      onStart={(sc) => {
                        // Iter 121.6: argumentation-prep goes through the SEXIER wizard,
                        // everything else through the standard briefing.
                        if (sc.kind === 'preparation' || sc.scenario_id === 'argumentation-prep') {
                          setArgPrepOpen(true);
                        } else {
                          setBriefingScenario(sc);
                        }
                      }}
                      loading={loading}
                      de={lang === 'de'}
                    />
                  ))}
              </div>
            </div>
          )}
          {(activeSim || messages.length > 0) && !scores && (
            <div className="max-w-3xl mx-auto space-y-3">
              {/* Iter 121.6: Pause-Banner — deutliches visuelles Signal, dass
                  die Simulation aktiv ist, aber gerade wartet. */}
              {paused && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#BFFF00]/10 border border-[#BFFF00]/30" data-testid="simulation-paused-banner">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#BFFF00] flex items-center justify-center">
                      <Pause size={14} className="text-[#0A0A0A]" fill="#0A0A0A" />
                    </div>
                    <div>
                      <p className="text-[13px] font-black">{lang === 'de' ? 'Simulation pausiert' : 'Simulation paused'}</p>
                      <p className="text-[11px] text-foreground/70">{lang === 'de' ? 'Konversation und Kontext bleiben erhalten. Klick "Weiter" um fortzufahren.' : 'Conversation and context are preserved. Click "Resume" to continue.'}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setPaused(false)} className="bg-[#0A0A0A] text-[#BFFF00] font-black shrink-0" data-testid="simulation-resume-btn">
                    <Play size={12} className="mr-1" fill="currentColor" /> {lang === 'de' ? 'Weiter' : 'Resume'}
                  </Button>
                </div>
              )}
              {/* Immersive simulation header */}
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {lang === 'de' ? 'LIVE SIMULATION' : 'LIVE SIMULATION'}
                  {activeScenario?.title ? ` · ${activeScenario.title}` : ''}
                </span>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <p className="text-[11px] text-muted-foreground">{lang === 'de' ? 'Reagiere natürlich — per Stimme oder Text.' : 'Respond naturally — voice or text.'}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07] text-muted-foreground" data-testid="sim-round-counter">
                    {lang === 'de' ? 'Runde' : 'Round'} {messages.filter((m) => m.role === 'user').length + 1}
                  </span>
                </div>
                <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold mt-2 flex items-center justify-center gap-1">
                  <Square size={10} fill="currentColor" />
                  {lang === 'de' ? 'Wenn fertig: oben rechts auf "JETZT BEENDEN" klicken' : 'When done: click "END NOW" in top right corner'}
                </p>
              </div>
              {messages.map((msg, i) => (
                <div key={`sim-msg-${msg.role}-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-2'} animate-fade-in`}>
                  {msg.role !== 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <span className="text-[10px] font-black text-white select-none">{(activeScenario?.title || 'KI').slice(0, 1).toUpperCase()}</span>
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white rounded-tr-sm'
                      : 'bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.06] rounded-tl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-2" data-testid="sim-typing-indicator">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <span className="text-[10px] font-black text-white select-none">{(activeScenario?.title || 'KI').slice(0, 1).toUpperCase()}</span>
                  </div>
                  <div className="bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 typing-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 typing-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 typing-dot" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
          {scores && (
            <ScoreDisplay
              scores={scores}
              messages={messages}
              navigate={navigate}
              onRestart={() => { setScores(null); setMessages([]); setActiveScenario(null); }}
            />
          )}
        </ScrollArea>

        {briefingScenario && (
          <SimulationBriefing
            scenario={briefingScenario}
            loading={loading}
            de={lang === 'de'}
            onClose={() => setBriefingScenario(null)}
            onStart={(setup) => startSimulation(briefingScenario.scenario_id, setup)}
          />
        )}

        {argPrepOpen && (
          <Suspense fallback={null}>
          <ArgumentationPrepModal
            initialTemplate={sharedTemplate}
            onClose={() => { setArgPrepOpen(false); setSharedTemplate(null); }}
            onLaunchSimulation={() => {
              // Bridge: after the SEXIER strategy is ready, drop the user into
              // a live simulation with the negotiation-flavour scenario so
              // they can practice with what they just prepared.
              setArgPrepOpen(false);
              setSharedTemplate(null);
              const bridgeScenario = scenarios.find(s => s.scenario_id === 'salary-negotiation')
                                  || scenarios.find(s => s.category === 'negotiation')
                                  || scenarios[0];
              if (bridgeScenario) setBriefingScenario(bridgeScenario);
            }}
          />
          </Suspense>
        )}

        {activeSim && !paused && (
          <div className="border-t border-black/[0.06] dark:border-white/[0.06] p-4 bg-white/80 dark:bg-card/80 backdrop-blur-xl">
            <div className="flex gap-3 max-w-3xl mx-auto">
              <VoiceRecorder onTranscription={(text) => setInput(prev => prev + ' ' + text)} disabled={loading} />
              <Textarea data-testid="simulation-input" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={lang === 'de' ? 'Antworte natürlich (oder nutze Stimme)...' : 'Respond naturally (or use voice)...'} className="resize-none min-h-[44px] max-h-32 bg-gray-50 dark:bg-muted/30 border-black/[0.06] dark:border-white/[0.06] rounded-xl" rows={1} />
              <Button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white px-4 shrink-0 shadow-lg shadow-blue-500/15" data-testid="simulation-send-btn">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
