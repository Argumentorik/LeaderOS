import { useState, useEffect, lazy, Suspense } from 'react';
import logger from '../lib/logger';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../lib/api';
import {
  Sparkles, Target, ArrowRight, Compass, Users, Handshake, ShieldCheck, Clock, ChevronRight
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

// Iter 128 (Godmode · Wlad-Direktive): Der klassische Text-Sim-Flow wurde entfernt.
// Die Seite bleibt als /simulations erreichbar (Sidebar/MobileNav ändert sich
// nicht), fungiert aber jetzt als premium Launchpad, das direkt in den
// SEXIER-Argumentation-Prep Wizard führt — das ist unser echtes Vorbereitungs-
// tool. Alte Live-Chat-Simulation, Scenarios API, VoiceRecorder etc. sind raus.
const ArgumentationPrepModal = lazy(() =>
  import('../components/simulations/ArgumentationPrepModal').then(m => ({ default: m.ArgumentationPrepModal }))
);

const USE_CASES = [
  { icon: Handshake, de: 'Gehaltsverhandlung', en: 'Salary negotiation' },
  { icon: Users,     de: 'Schwieriges Feedbackgespräch', en: 'Tough feedback talk' },
  { icon: Compass,   de: 'Board- oder Investor-Pitch', en: 'Board / investor pitch' },
  { icon: ShieldCheck, de: 'Konfliktgespräch entschärfen', en: 'De-escalate a conflict' },
];

const HOW_STEPS = [
  { de: 'Situation eingeben', en: 'Enter the situation' },
  { de: 'Ziel & Gegenseite klären', en: 'Clarify goal & counterpart' },
  { de: 'SEXIER-Strategie erhalten', en: 'Get your SEXIER strategy' },
  { de: 'Als PDF mitnehmen', en: 'Take the PDF into the room' },
];

export default function SimulationsPage() {
  const { lang } = useLanguage();
  const de = lang === 'de';
  const [argPrepOpen, setArgPrepOpen] = useState(false);
  const [sharedTemplate, setSharedTemplate] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Backwards compatible: ?prep=1 (from Dashboard shortcuts) opens the wizard
  // directly. ?tpl=… loads a shared template.
  useEffect(() => {
    if (searchParams.get('prep') === '1') {
      setArgPrepOpen(true);
      searchParams.delete('prep');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
        toast.success(de ? `Geteilte Vorlage geladen: ${res.data.label}` : `Shared template loaded: ${res.data.label}`, { duration: 2600 });
      } catch (err) {
        logger.error('shared tpl load', err);
        toast.error(de ? 'Diese Vorlage ist nicht mehr verfügbar.' : 'This template is no longer available.');
      } finally {
        searchParams.delete('tpl');
        setSearchParams(searchParams, { replace: true });
      }
    })();
  }, [searchParams, setSearchParams, de]);

  return (
    <DashboardLayout>
      <div className="min-h-screen" data-testid="simulations-page">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#BFFF00]/[0.06] via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-6 py-14 sm:py-20">
            <Badge className="bg-[#BFFF00] text-[#0A0A0A] font-black text-[10px] tracking-wide mb-5 border-0" data-testid="sim-hero-badge">
              SEXIER · ARGUMENTATION PREP
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-5">
              {de ? (
                <>Bereite dein nächstes<br/><span className="text-[#6B8A00] dark:text-[#BFFF00]">wichtiges Gespräch</span> vor.</>
              ) : (
                <>Prepare your next<br/><span className="text-[#6B8A00] dark:text-[#BFFF00]">critical conversation.</span></>
              )}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
              {de
                ? 'Kein generisches Rollenspiel. Ein persönlicher Coaching-Wizard, der dich Schritt für Schritt zu einer Strategie führt, die im Raum funktioniert — inkl. Einwandbehandlung, Formulierungen und PDF.'
                : 'No generic roleplay. A personal coaching wizard that guides you step by step to a strategy that works in the room — objection handling, phrasing, and a PDF to take with you.'}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setArgPrepOpen(true)}
                className="bg-[#0A0A0A] hover:bg-[#1A1A2E] text-[#BFFF00] font-black h-12 px-6 shadow-lg shadow-black/20 transition-all active:scale-[0.98]"
                data-testid="sim-hero-start"
              >
                <Sparkles size={16} className="mr-2" />
                {de ? 'Prep starten' : 'Start prep'}
                <ArrowRight size={16} className="ml-2" />
              </Button>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Clock size={12} />
                {de ? '~4 Minuten · 4 Schritte' : '~4 minutes · 4 steps'}
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-black mb-1">{de ? 'So läuft es ab' : 'How it works'}</h2>
            <p className="text-[13px] text-muted-foreground">{de ? 'Vier Schritte, keine Fragebögen-Hölle.' : 'Four steps, no survey hell.'}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {HOW_STEPS.map((step, i) => (
              <div
                key={step.en}
                className="relative rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 bg-white/70 dark:bg-card/60 backdrop-blur-sm"
                data-testid={`sim-step-${i + 1}`}
              >
                <div className="text-[11px] font-black text-[#6B8A00] dark:text-[#BFFF00] tracking-wider mb-2">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="text-[13px] font-bold leading-snug">
                  {de ? step.de : step.en}
                </div>
              </div>
            ))}
          </div>

          {/* Use cases */}
          <div className="mt-14">
            <h2 className="text-lg sm:text-xl font-black mb-1">{de ? 'Wofür Führungskräfte es nutzen' : 'What leaders use it for'}</h2>
            <p className="text-[13px] text-muted-foreground mb-6">{de ? 'Alles, was mehr ist als „mal eben ein Meeting".' : 'Anything more than "just another meeting".'}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {USE_CASES.map((u, i) => {
                const Icon = u.icon;
                return (
                  <button
                    key={u.en}
                    type="button"
                    onClick={() => setArgPrepOpen(true)}
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-card/60 hover:border-[#BFFF00]/50 hover:shadow-md transition-all text-left"
                    data-testid={`sim-usecase-${i}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center shrink-0 group-hover:bg-[#BFFF00]/25 transition-colors">
                      <Icon size={18} className="text-[#6B8A00] dark:text-[#BFFF00]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold">{de ? u.de : u.en}</div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-14 rounded-3xl bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] p-8 sm:p-10 text-white relative overflow-hidden" data-testid="sim-bottom-cta">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[#BFFF00]/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className="text-[#BFFF00]" />
                <span className="text-[11px] font-black tracking-wider text-[#BFFF00]">
                  {de ? 'BEREIT?' : 'READY?'}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black mb-3 leading-tight max-w-xl">
                {de
                  ? 'Kein Bauchgefühl mehr. Geh mit einem Plan in den Raum.'
                  : "No more guessing. Walk in with a plan."}
              </h3>
              <p className="text-white/70 max-w-lg mb-6 text-[14px]">
                {de
                  ? 'Nutze deine Credits für eine SEXIER-Strategie, die auf Wlads Frameworks basiert — inkl. Einwandkatalog und PDF.'
                  : "Use your credits for a SEXIER strategy built on Wlad's frameworks — including objection catalog and PDF."}
              </p>
              <Button
                onClick={() => setArgPrepOpen(true)}
                className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-black h-12 px-6 shadow-lg shadow-[#BFFF00]/25 transition-all active:scale-[0.98]"
                data-testid="sim-bottom-start"
              >
                <Sparkles size={16} className="mr-2" />
                {de ? 'Jetzt Prep starten' : 'Start prep now'}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {argPrepOpen && (
          <Suspense fallback={null}>
            <ArgumentationPrepModal
              initialTemplate={sharedTemplate}
              onClose={() => { setArgPrepOpen(false); setSharedTemplate(null); }}
              onLaunchSimulation={() => {
                // Bridge for legacy callers — text-sim is gone, so we simply
                // close and let the user re-open the wizard for another prep.
                setArgPrepOpen(false);
                setSharedTemplate(null);
                toast.success(de ? 'Strategie fertig. Starte einfach eine neue Vorbereitung.' : 'Strategy ready. Start another prep anytime.');
              }}
            />
          </Suspense>
        )}
      </div>
    </DashboardLayout>
  );
}
