import { useState, useEffect, useRef } from 'react';
import logger from '../lib/logger';
import { FeatureVideoSection } from '../components/guide/FeatureVideoSection';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { generatePDF } from '../lib/pdfGenerator';
import { toolsDe, toolsEn } from '../lib/toolsData';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { toast } from 'sonner';
import { PersonaStep, StepContent } from '../components/tools/WorkflowSteps';
import { DeepAssistModal } from '../components/tools/DeepAssistModal';
import { ToolsUpsellModal } from '../components/tools/ToolsUpsellModal';
import { ToolsGrid } from '../components/tools/ToolsGrid';
import { StepIndicator } from '../components/tools/StepIndicator';
import { WorkflowResultPanel } from '../components/tools/WorkflowResultPanel';

const WORKFLOW_CLIPS = ['bp-workflows'];

const buildPersonaText = (persona) => {
  const parts = [];
  if (persona.role) parts.push(`Rolle: ${persona.role}`);
  if (persona.industry) parts.push(`Branche: ${persona.industry}`);
  if (persona.team) parts.push(`Team: ${persona.team}`);
  if (persona.goals) parts.push(`Persönliche Ziele: ${persona.goals}`);
  if (persona.employeeGoals) parts.push(`Mitarbeiter-Ziele: ${persona.employeeGoals}`);
  return parts.join('\n');
};

const EMPTY_PERSONA = { role: '', industry: '', team: '', goals: '', employeeGoals: '' };

export default function ToolsPage() {
  const { lang } = useLanguage();
  const de = lang === 'de';
  const tools = de ? toolsDe : toolsEn;
  const [activeTool, setActiveTool] = useState(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const { user } = useAuth();
  // Iter 160 (Tester-Feedback „Daten immer neu eingeben“): Persona aus Profil vorbelegen + letzte Eingabe merken (nur Rollen-/Zieltexte, nichts Sensibles)
  const personaKey = user?.user_id ? `wlad_workflow_persona_${user.user_id}` : null;
  const [persona, setPersona] = useState(EMPTY_PERSONA);
  const hydratedKeyRef = useRef(null);
  useEffect(() => {
    if (!personaKey || hydratedKeyRef.current === personaKey) return; // erst wenn der User geladen ist, genau einmal
    hydratedKeyRef.current = personaKey;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(personaKey) || 'null'); } catch (e) { logger.warn('persona restore skipped', e); }
    setPersona(saved ? { ...EMPTY_PERSONA, ...saved } : {
      ...EMPTY_PERSONA,
      role: user?.position || user?.role_title || '',
      industry: user?.industry || user?.branche || '',
      team: user?.team_size ? String(user.team_size) : '',
      goals: user?.goals || '',
    });
  }, [personaKey, user]);
  useEffect(() => {
    if (personaKey && hydratedKeyRef.current === personaKey && Object.values(persona).some(Boolean)) {
      try { localStorage.setItem(personaKey, JSON.stringify(persona)); } catch (e) { logger.warn('persona save skipped', e); }
    }
  }, [persona, personaKey]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [showDeepAssist, setShowDeepAssist] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmitWorkflow = async () => {
    if (loading || !activeTool) return;
    setLoading(true);
    setResult(null);
    setError('');
    const inputText = activeTool.steps.map((step, i) => `${step.q}: ${answers[i] || 'Nicht angegeben'}`).join('\n');
    try {
      const res = await api.post(`/tools/${activeTool.id}`, { input: inputText, persona: buildPersonaText(persona) });
      setResult(res.data.result);
      setCurrentStep(activeTool.steps.length);
    } catch (err) {
      logger.error('Workflow error:', err);
      const detail = err?.response?.status === 402
        ? (de ? 'Deine Credits sind aufgebraucht — bitte upgrade dein Paket.' : 'You are out of credits — please upgrade your plan.')
        : (err?.response?.data?.detail || (de
            ? 'Dein Ergebnis konnte nicht erstellt werden. Bitte klicke auf „Erneut versuchen" — deine Antworten sind gespeichert.'
            : 'Your result could not be generated. Please click "Try again" — your answers are saved.'));
      setError(detail);
      toast.error(detail, { duration: 6000 });
    } finally { setLoading(false); }
  };

  const handleDownloadPDF = async () => {
    if (!result || !activeTool) return;
    await generatePDF({
      title: `${de ? 'Workflow-Report' : 'Workflow Report'}: ${activeTool.title}`,
      overall_assessment: result.event_concept || result.decision_summary || result.result || '',
      conversation_plan: result.conversation_plan,
      feedback_formulations: result.feedback_formulations,
      guide_questions: result.guide_questions,
      optimized_text: result.optimized_text,
      pros: result.pros, cons: result.cons,
      recommendation: result.recommendation, counter_check: result.counter_check,
      high_impact: result.high_impact, development_plan: result.development_plan,
      agenda: result.agenda, next_steps: result.next_steps,
      location_suggestions: result.location_suggestions,
      location_tips: result.location_tips,
      materials_needed: result.materials_needed,
      budget_estimate: result.budget_estimate,
      tips: result.tips,
      strengths: result.strengths, improvements: result.improvements || result.weaknesses,
    }, `WladBot-${activeTool.title.replace(/\s+/g, '-')}`);
  };

  // Persona bleibt beim Wechsel/Neustart erhalten (Tester-Feedback: „Daten immer neu eingeben“)
  const resetTool = () => {
    setActiveTool(null); setCurrentStep(-1); setAnswers({}); setResult(null);
  };

  const selectTool = (t) => {
    setActiveTool(t); setCurrentStep(-1); setAnswers({}); setResult(null);
  };

  const totalSteps = activeTool ? activeTool.steps.length + 1 : 0;
  const isPersonaStep = currentStep === -1;
  const currentStepData = activeTool?.steps[currentStep];
  const isLastStep = activeTool && currentStep === activeTool.steps.length - 1;
  const isComplete = activeTool && currentStep >= activeTool.steps.length;
  const personaComplete = persona.role.trim().length > 0;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-4xl mx-auto bg-gradient-mesh min-h-screen" data-testid="tools-page">
        {showUpsell && <ToolsUpsellModal onClose={() => setShowUpsell(false)} de={de} />}

        {!activeTool && (
          <>
            <FeatureVideoSection slugs={WORKFLOW_CLIPS} de={de} />
            <ToolsGrid
              tools={tools}
              onSelectTool={selectTool}
              onOpenDeepAssist={() => setShowDeepAssist(true)}
              de={de}
            />
          </>
        )}

        {activeTool && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={resetTool} className="font-semibold" data-testid="back-to-tools-btn">
                <ArrowLeft size={16} className="mr-1" /> {de ? 'Zurück' : 'Back'}
              </Button>
            </div>

            <div className="text-center space-y-3">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeTool.gradient} flex items-center justify-center mx-auto shadow-lg`}>
                <activeTool.icon size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-black">{activeTool.title}</h2>
              <StepIndicator currentStep={currentStep + 1} totalSteps={totalSteps} toolGradient={activeTool.gradient} />
            </div>

            {isPersonaStep && !isComplete && (
              <PersonaStep
                persona={persona} setPersona={setPersona}
                activeTool={activeTool} personaComplete={personaComplete}
                onNext={() => setCurrentStep(0)} de={de}
              />
            )}

            {!isComplete && !isPersonaStep && currentStepData && (
              <StepContent
                activeTool={activeTool} currentStep={currentStep}
                currentStepData={currentStepData} answers={answers}
                setAnswers={setAnswers} isLastStep={isLastStep}
                loading={loading}
                onPrev={() => setCurrentStep(currentStep === 0 ? -1 : currentStep - 1)}
                onNext={() => setCurrentStep(currentStep + 1)}
                onSubmit={handleSubmitWorkflow} de={de}
              />
            )}

            {loading && <LoadingOverlay isOpen={loading} de={de} title={de ? 'Dein Leadership-Muster wird analysiert' : 'Analyzing your leadership pattern'} />}

            {error && !loading && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3" data-testid="workflow-error-box">
                <p className="text-sm font-semibold text-red-500">{error}</p>
                <Button onClick={handleSubmitWorkflow} className="bg-[#BFFF00] text-[#0A0A0A] font-bold h-10" data-testid="workflow-retry-btn">
                  {de ? 'Erneut versuchen' : 'Try again'}
                </Button>
              </div>
            )}

            {isComplete && result && !loading && (
              <WorkflowResultPanel
                result={result}
                persona={persona}
                onDownloadPDF={handleDownloadPDF}
                onNavigateVideo={() => navigate('/missions')}
                onOpenUpsell={() => setShowUpsell(true)}
                de={de}
              />
            )}
          </div>
        )}

        <DeepAssistModal
          open={showDeepAssist}
          onClose={() => setShowDeepAssist(false)}
          toolId={activeTool?.id}
          de={de}
        />
      </div>
    </DashboardLayout>
  );
}
