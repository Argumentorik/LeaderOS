import { useState, useEffect, useRef, useCallback } from 'react';
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
  Download, X, Mic
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SimulationBriefing } from '../components/shared/SimulationBriefing';

const difficultyConfig = {
  easy: { gradient: 'from-green-500 to-emerald-500', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200/40 dark:border-green-500/20' },
  medium: { gradient: 'from-amber-500 to-orange-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200/40 dark:border-amber-500/20' },
  hard: { gradient: 'from-red-500 to-pink-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200/40 dark:border-red-500/20' },
};

const ScenarioCard = ({ scenario, onStart, loading }) => {
  const diff = difficultyConfig[scenario.difficulty] || difficultyConfig.medium;
  return (
    <Card className={`hover:shadow-xl hover:shadow-black/[0.06] hover:-translate-y-1 hover:border-[#BFFF00]/40 transition-all duration-300 group cursor-pointer border-black/[0.04] dark:border-white/[0.06]`} onClick={() => onStart(scenario)} data-testid={`scenario-${scenario.scenario_id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${diff.gradient} flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Swords size={18} className="text-white" />
          </div>
          <Badge className={`${diff.bg} ${diff.text} text-[10px] font-bold border-0`}>{scenario.difficulty}</Badge>
        </div>
        <h3 className="text-[15px] font-bold mb-1">{scenario.title}</h3>
        <p className="text-[12px] text-muted-foreground mb-3 line-clamp-2">{scenario.description}</p>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Mic size={10} /> Voice + Text</p>
          <Button size="sm" disabled={loading} className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-bold text-xs h-8 shadow-sm shadow-[#BFFF00]/20 transition-all group-hover:scale-[1.04]" data-testid={`start-sim-${scenario.scenario_id}`}>
            <Play size={12} className="mr-1" fill="currentColor" /> Start
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ScoreDisplay = ({ scores, messages, navigate }) => {
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
  const [activeSim, setActiveSim] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState(null);
  const [briefingScenario, setBriefingScenario] = useState(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const loadScenarios = useCallback(async () => { try { const res = await api.get('/simulations/scenarios'); setScenarios(res.data); } catch (err) { logger.error('Failed to load scenarios:', err); } }, []);
  useEffect(() => { loadScenarios(); }, [loadScenarios]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const startSimulation = async (scenarioId, setup = {}) => {
    setLoading(true);
    try {
      const res = await api.post('/simulations', { scenario: scenarioId, ...setup });
      setActiveSim(res.data.simulation_id);
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
            <Button
              size="lg"
              onClick={endSimulation}
              className="bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-500/25 animate-pulse"
              data-testid="end-simulation-btn"
            >
              <Square size={16} className="mr-2" fill="white" /> {lang === 'de' ? 'JETZT BEENDEN & BEWERTEN' : 'END NOW & SCORE'}
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 px-6 py-6 bg-gradient-mesh">
          {!activeSim && !scores && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h3 className="text-2xl font-black mb-1">{lang === 'de' ? 'Leadership Training Arena' : 'Leadership Training Arena'}</h3>
                <p className="text-sm text-muted-foreground">{lang === 'de' ? 'Übe reale Szenarien mit KI. Nutze deine Stimme für ein realistisches Erlebnis.' : 'Practice real-world scenarios with AI. Use your voice for a realistic experience.'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenarios.map((s) => <ScenarioCard key={s.scenario_id} scenario={s} onStart={() => setBriefingScenario(s)} loading={loading} />)}
              </div>
            </div>
          )}
          {(activeSim || messages.length > 0) && !scores && (
            <div className="max-w-3xl mx-auto space-y-3">
              {/* Immersive simulation header */}
              <div className="text-center mb-6">
                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 text-xs font-bold px-3 py-1">{lang === 'de' ? 'LIVE SIMULATION' : 'LIVE SIMULATION'}</Badge>
                <p className="text-[11px] text-muted-foreground mt-2">{lang === 'de' ? 'Reagiere natürlich. Nutze Stimme oder Text. Die KI reagiert dynamisch.' : 'Respond naturally. Use voice or text. The AI reacts dynamically.'}</p>
                <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold mt-2 flex items-center justify-center gap-1">
                  <Square size={10} fill="currentColor" />
                  {lang === 'de' ? 'Wenn fertig: oben rechts auf "JETZT BEENDEN" klicken' : 'When done: click "END NOW" in top right corner'}
                </p>
              </div>
              {messages.map((msg, i) => (
                <div key={`sim-msg-${msg.role}-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : ''} animate-fade-in`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white rounded-tr-sm'
                      : 'bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.06] rounded-tl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && <div className="flex"><div className="bg-white dark:bg-card border border-black/[0.06] dark:border-white/[0.06] rounded-2xl px-4 py-3 flex gap-1 shadow-sm"><div className="w-2 h-2 rounded-full bg-sky-50 dark:bg-sky-500/100 typing-dot" /><div className="w-2 h-2 rounded-full bg-sky-50 dark:bg-sky-500/100 typing-dot" /><div className="w-2 h-2 rounded-full bg-sky-50 dark:bg-sky-500/100 typing-dot" /></div></div>}
              <div ref={scrollRef} />
            </div>
          )}
          {scores && <ScoreDisplay scores={scores} messages={messages} navigate={navigate} />}
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

        {activeSim && (
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
