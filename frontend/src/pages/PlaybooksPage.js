import { useState, useEffect, useRef, useCallback } from 'react';
import logger from '../lib/logger';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { FeatureVideoSection } from '../components/guide/FeatureVideoSection';
import { generatePDF } from '../lib/pdfGenerator';
import api from '../lib/api';
import { swrGet } from '../lib/swrCache';
import { useNavigate } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';
import { toolsDe, toolsEn } from '../lib/toolsData';
import { PlaybookListCard } from '../components/playbooks/PlaybookListCard';
import { PlaybookChatView } from '../components/playbooks/PlaybookChatView';

const PLAYBOOK_CLIPS = ['bp-playbooks'];

// Exakte Modul-Reihenfolge der NEUEN Gesprächstraining-Seite (10 Hauptmodule).
const MAIN_MODULE_IDS = [
  'difficult-conversation', 'argumentation-training', 'team-meeting', 'conflict-resolution',
  'delegation', 'motivation-talk', 'crisis-communication', 'negotiation-strategy',
  'salary-negotiation', 'board-pitch',
];

export default function PlaybooksPage() {
  const { lang } = useLanguage();
  const de = lang === 'de';
  const navigate = useNavigate();
  const tools = de ? toolsDe : toolsEn;
  const [playbooks, setPlaybooks] = useState([]);
  const [activePlaybook, setActivePlaybook] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [adviceReport, setAdviceReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const scrollRef = useRef(null);

  const loadPlaybooks = useCallback(async () => {
    await swrGet('/playbooks', setPlaybooks, { onError: (err) => logger.error(err) });
  }, []);

  useEffect(() => { loadPlaybooks(); }, [loadPlaybooks]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [chatMessages]);

  const startPlaybook = async (playbook) => {
    setLoading(true);
    try {
      await api.post(`/playbooks/${playbook.playbook_id}/start`);
      setActivePlaybook(playbook);
      setCurrentStep(0);
      setCompleted(false);
      setAdviceReport(null);
      const firstStep = playbook.steps[0];
      setChatMessages([
        { from: 'wlad', text: de
          ? `Willkommen beim Playbook "${playbook.title}"! Ich führe dich Schritt für Schritt durch. Lass uns starten.`
          : `Welcome to the "${playbook.title}" playbook! I'll guide you step by step. Let's begin.` },
        { from: 'wlad', text: firstStep?.prompt || firstStep?.title || '', isStep: true, stepIdx: 0, stepTitle: firstStep?.title },
      ]);
    } catch (err) { logger.error(err); } finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setChatMessages(prev => [...prev, { from: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post(`/playbooks/${activePlaybook.playbook_id}/step`, {
        step_index: currentStep,
        user_input: userMsg
      });
      const aiResp = res.data.response;
      const adviceText = aiResp?.advice || JSON.stringify(aiResp);

      setChatMessages(prev => [...prev, { from: 'wlad', text: adviceText, keyPoints: aiResp?.key_points }]);

      if (res.data.completed) {
        setCompleted(true);
        setChatMessages(prev => [...prev, {
          from: 'wlad',
          text: de ? 'Hervorragend! Du hast alle Schritte abgeschlossen. Soll ich deinen persönlichen Advice Report erstellen?'
                  : 'Excellent! You completed all steps. Shall I create your personal advice report?',
          isCompletion: true,
        }]);
      } else if (currentStep < activePlaybook.steps.length - 1) {
        const nextIdx = currentStep + 1;
        setCurrentStep(nextIdx);
        const nextStep = activePlaybook.steps[nextIdx];
        setTimeout(() => {
          setChatMessages(prev => [...prev, {
            from: 'wlad',
            text: nextStep?.prompt || nextStep?.title || '',
            isStep: true, stepIdx: nextIdx, stepTitle: nextStep?.title,
          }]);
        }, 600);
      } else {
        setCompleted(true);
        setChatMessages(prev => [...prev, {
          from: 'wlad',
          text: de ? 'Du hast alle Schritte abgeschlossen! Soll ich deinen persönlichen Advice Report generieren?'
                  : 'You completed all steps! Shall I generate your personal advice report?',
          isCompletion: true,
        }]);
      }
    } catch (err) {
      logger.error(err);
      setChatMessages(prev => [...prev, { from: 'wlad', text: de ? 'Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.' : 'Sorry, there was an error. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const handleVoiceResult = (text) => setInput(prev => prev ? prev + ' ' + text : text);

  const generateReport = async () => {
    setGeneratingReport(true);
    setChatMessages(prev => [...prev, {
      from: 'wlad',
      text: de ? 'Einen Moment... Ich erstelle deinen persönlichen Leadership Report.' : "One moment... I'm creating your personal leadership report.",
      isLoading: true,
    }]);
    try {
      const res = await api.post(`/playbooks/${activePlaybook.playbook_id}/report`);
      setAdviceReport(res.data);
      setChatMessages(prev => prev.filter(m => !m.isLoading).concat({
        from: 'wlad',
        text: de ? 'Dein persönlicher Advice Report ist fertig! Du kannst ihn als PDF herunterladen.' : 'Your personal advice report is ready! You can download it as PDF.',
        isReport: true,
      }));
    } catch (err) { logger.error(err); } finally { setGeneratingReport(false); }
  };

  const handleDownloadPDF = async () => {
    if (!adviceReport) return;
    setGeneratingPDF(true);
    try {
      await generatePDF({
        title: activePlaybook?.title || 'Leadership Playbook Report',
        overall_assessment: adviceReport.overall_assessment,
        score: adviceReport.score,
        top_10_insights: adviceReport.top_10_insights,
        strengths: adviceReport.strengths,
        improvements: adviceReport.improvements,
        next_steps: adviceReport.next_steps,
        leadership_recommendations: adviceReport.leadership_recommendations,
      }, `WLAD AI-${activePlaybook?.title?.replace(/\s+/g, '-') || 'Report'}`);
    } catch (err) { logger.error('PDF generation error:', err); }
    finally { setGeneratingPDF(false); }
  };

  const resetPlaybook = () => {
    setActivePlaybook(null);
    setCurrentStep(0);
    setChatMessages([]);
    setCompleted(false);
    setAdviceReport(null);
    setInput('');
  };

  if (!activePlaybook) {
    const orderedPlaybooks = MAIN_MODULE_IDS
      .map((id) => playbooks.find((p) => p.playbook_id === id))
      .filter(Boolean);
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-10 xl:px-14 w-full space-y-8 bg-gradient-mesh min-h-screen" data-testid="gespraechstraining-page">
          <div className="flex items-center gap-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shadow-lg shadow-[#BFFF00]/15">
              <Target size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{de ? 'Gesprächstraining' : 'Conversation Training'}</h1>
              <p className="text-sm text-muted-foreground font-medium">{de ? 'Interaktive Coaching-Sitzungen mit persönlichem Report' : 'Interactive coaching sessions with personal report'}</p>
            </div>
          </div>

          <FeatureVideoSection slugs={PLAYBOOK_CLIPS} de={de} />

          <div className="space-y-4">
            <h2 className="text-base md:text-lg font-black tracking-tight" data-testid="main-modules-heading">{de ? 'Module' : 'Modules'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 animate-fade-in stagger-1">
              {orderedPlaybooks.map((pb) => (
                <PlaybookListCard key={pb.playbook_id} pb={pb} onStart={startPlaybook} loading={loading} de={de} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-base md:text-lg font-black tracking-tight" data-testid="bonus-tools-heading">{de ? 'Bonus-Tools' : 'Bonus Tools'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {tools.map((t) => (
                <button key={t.id} type="button"
                  onClick={() => navigate(`/tools?tool=${t.id}`)}
                  data-testid={`bonus-tool-${t.id}`}
                  className="text-left rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-card hover:shadow-lg hover:shadow-black/[0.04] hover:-translate-y-0.5 transition-all duration-300 group p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                      <t.icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold mb-0.5">{t.title}</h3>
                      <p className="text-[12px] text-muted-foreground">{t.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PlaybookChatView
        activePlaybook={activePlaybook}
        currentStep={currentStep}
        chatMessages={chatMessages}
        input={input}
        setInput={setInput}
        loading={loading}
        completed={completed}
        adviceReport={adviceReport}
        generatingReport={generatingReport}
        generatingPDF={generatingPDF}
        scrollRef={scrollRef}
        onReset={resetPlaybook}
        onSend={sendMessage}
        onVoice={handleVoiceResult}
        onGenerateReport={generateReport}
        onDownloadPDF={handleDownloadPDF}
        de={de}
      />
    </DashboardLayout>
  );
}
