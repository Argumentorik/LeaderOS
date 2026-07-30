/**
 * ArgumentationPrepModal — SEXIER-Framework Guided Wizard.
 *
 * Ersetzt den alten „Remote Team motivieren" Simulator (Iter 121.6, Wlad-
 * Feedback). Vor jeder wichtigen Argumentation läuft der User durch 4
 * Schritte:
 *   1. Kontext  (Hintergrund · Ziel · Beziehung)
 *   2. Deine Argumente  (Kernpunkte · Evidenz · Priorisierung)
 *   3. Gegenseite  (Einwände · Gegenargumente · Verborgene Interessen)
 *   4. Coaching-Fokus  (Framing? Rebuttals? Schwachstellen?)
 *
 * Backend `POST /api/simulations/argumentation-prep` liefert eine komplette
 * SEXIER-Strategie zurück, die der User dann direkt in die anschließende
 * Live-Simulation mitnehmen kann.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, Loader2, Target, Lightbulb, Shield, Copy, Check, Swords, Wand2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { toast } from 'sonner';
import { StrategySkeleton } from './StrategySkeleton';
import { FieldVoiceButton } from './FieldVoiceButton';
import { PREP_TEMPLATES } from './prepTemplates';

const STEPS = [
  { id: 'context',    icon: Target,    title: 'Kontext',     hint: 'Worum geht es? Was willst du erreichen?' },
  { id: 'arguments',  icon: Sparkles,  title: 'Argumente',   hint: 'Deine Kernpunkte, Belege, Priorisierung.' },
  { id: 'objections', icon: Shield,    title: 'Gegenseite',  hint: 'Was wird der Gegenüber sagen? Warum?' },
  { id: 'coaching',   icon: Lightbulb, title: 'Coaching',    hint: 'Wo brauchst du besonders Hilfe?' },
];

const initialData = {
  background: '', goal: '', relationship: '',
  main_points: '', evidence: '', prioritised: '',
  expected_objections: '', counterarguments: '', hidden_interests: '',
  coaching_focus: '',
};

export function ArgumentationPrepModal({ onClose, onLaunchSimulation }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState(null);
  const [copied, setCopied] = useState(false);
  const [appliedTemplateId, setAppliedTemplateId] = useState(null);

  const update = (patch) => setData(d => ({ ...d, ...patch }));

  const applyTemplate = (tpl) => {
    setData({ ...tpl.data });
    setAppliedTemplateId(tpl.id);
    // Jump straight to the final step — user just needs to tweak coaching focus.
    setStep(STEPS.length - 1);
    toast.success(`Vorlage geladen: ${tpl.label}`, { duration: 2200 });
  };

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/simulations/argumentation-prep', data);
      setStrategy(res.data);
      toast.success('SEXIER-Strategie erstellt · +3 Leadership-XP');
    } catch (err) {
      logger.error('argumentation-prep failed', err);
      toast.error('Strategie konnte nicht erstellt werden. Bitte nochmal.');
    } finally {
      setLoading(false);
    }
  };

  const copyStrategy = async () => {
    if (!strategy?.strategy_markdown) return;
    try {
      await navigator.clipboard.writeText(strategy.strategy_markdown);
      setCopied(true);
      toast.success('Strategie in die Zwischenablage kopiert');
      setTimeout(() => setCopied(false), 1600);
    } catch (e) { logger.warn('clipboard write failed', e); }
  };

  const canProceed = () => {
    // Require at least the essential fields per step, but never block hard —
    // the AI-Coach is happy with 1-2 fields per section.
    if (step === 0) return (data.background || data.goal).trim().length > 0;
    if (step === 1) return (data.main_points || '').trim().length > 0;
    return true;
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-6" data-testid="argumentation-prep-modal" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Header step={step} strategyReady={!!strategy} onClose={onClose} />

        {/* Iter 121.10 (Wlad-Bug): Radix ScrollArea intercepted wheel/touch
            events inside the modal. Switched to native overflow — same look,
            works reliably on mobile Safari + desktop trackpads. */}
        <div className="flex-1 overflow-y-auto overscroll-contain" data-testid="argumentation-prep-scroll" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              {loading && !strategy ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <StrategySkeleton />
                </motion.div>
              ) : strategy ? (
                <motion.div
                  key="strategy"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  <StrategyView strategy={strategy} onCopy={copyStrategy} copied={copied} />
                </motion.div>
              ) : (
                <motion.div
                  key={`step-${step}`}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                >
                  <StepIndicator step={step} />
                  {step === 0 && <TemplatesRow onApply={applyTemplate} appliedId={appliedTemplateId} />}
                  {step === 0 && <ContextStep data={data} onChange={update} />}
                  {step === 1 && <ArgumentsStep data={data} onChange={update} />}
                  {step === 2 && <ObjectionsStep data={data} onChange={update} />}
                  {step === 3 && <CoachingStep data={data} onChange={update} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Footer
          step={step} strategy={strategy} loading={loading}
          canProceed={canProceed()}
          onBack={() => setStep(s => Math.max(0, s - 1))}
          onNext={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
          onGenerate={generate}
          onLaunchSim={onLaunchSimulation}
          onClose={onClose}
        />
      </motion.div>
    </div>
  );
}

const Header = ({ step, strategyReady, onClose }) => (
  <div className="px-6 sm:px-8 py-4 flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.06]">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-[#BFFF00] flex items-center justify-center shrink-0">
        <Sparkles size={16} className="text-[#0A0A0A]" />
      </div>
      <div className="min-w-0">
        <p className="text-[9.5px] font-black uppercase tracking-[0.2em] text-muted-foreground">SEXIER-Prep · Wlad Coaching</p>
        <h2 className="text-base sm:text-lg font-black tracking-tight truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {strategyReady ? 'Deine Argumentations-Strategie' : `Schritt ${step + 1} · ${STEPS[step].title}`}
        </h2>
      </div>
    </div>
    <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" data-testid="argumentation-prep-close" aria-label="Schließen">
      <X size={18} />
    </button>
  </div>
);

const TemplatesRow = ({ onApply, appliedId }) => (
  <div className="mb-5 -mt-1" data-testid="argumentation-prep-templates">
    <div className="flex items-center gap-2 mb-2.5">
      <Wand2 size={12} className="text-[#6B8A00] dark:text-[#BFFF00]" strokeWidth={2.4} />
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
        Vorlage laden · Wlad-kuratiert
      </span>
    </div>
    <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 snap-x snap-mandatory" style={{ scrollbarWidth: 'thin' }}>
      {PREP_TEMPLATES.map((tpl) => {
        const Icon = tpl.icon;
        const active = appliedId === tpl.id;
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onApply(tpl)}
            className={`group snap-start shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all active:scale-[0.97] ${
              active
                ? 'bg-[#BFFF00] border-[#BFFF00] text-[#0A0A0A] shadow-md shadow-[#BFFF00]/25'
                : 'bg-white dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-foreground/85 hover:border-[#BFFF00]/50 hover:bg-[#BFFF00]/[0.04]'
            }`}
            data-testid={`argprep-template-${tpl.id}`}
            title={tpl.hint}
          >
            <span
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                active ? 'bg-[#0A0A0A]/10' : 'bg-black/[0.04] dark:bg-white/[0.05] group-hover:bg-[#BFFF00]/15'
              }`}
              style={active ? {} : { color: tpl.accent }}
            >
              <Icon size={12} strokeWidth={2.4} />
            </span>
            <div className="min-w-0">
              <div className="text-[11.5px] font-black leading-tight">{tpl.label}</div>
              <div className={`text-[9.5px] leading-tight mt-0.5 ${active ? 'text-[#0A0A0A]/60' : 'text-muted-foreground/80'}`}>
                {tpl.hint}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

const StepIndicator = ({ step }) => (
  <div className="flex items-center gap-2 mb-6" data-testid="argumentation-prep-steps">
    {STEPS.map((s, i) => {
      const Icon = s.icon;
      const active = i === step;
      const done = i < step;
      return (
        <div key={s.id} className="flex-1 flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
              active ? 'bg-[#BFFF00] text-[#0A0A0A] shadow-lg shadow-[#BFFF00]/30' :
              done   ? 'bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00]' :
                       'bg-black/[0.04] dark:bg-white/[0.05] text-muted-foreground'
            }`}
          >
            <Icon size={13} strokeWidth={2.5} />
            <span className={`text-[11px] font-black tracking-tight ${active ? '' : 'hidden sm:inline'}`}>{s.title}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${done ? 'bg-[#BFFF00]/40' : 'bg-black/[0.05] dark:bg-white/[0.05]'}`} />}
        </div>
      );
    })}
  </div>
);

const Field = ({ label, hint, value, onChange, placeholder, testId, rows = 3 }) => {
  const appendVoice = (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    const next = value?.trim() ? `${value.trim()} ${trimmed}` : trimmed;
    onChange(next);
    toast.success('Aufnahme übernommen · +' + trimmed.split(/\s+/).length + ' Wörter', { duration: 1800 });
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[12px] font-black text-foreground/90 tracking-tight">{label}</label>
        <FieldVoiceButton onTranscribed={appendVoice} testId={testId ? `${testId}-mic` : undefined} />
      </div>
      {hint && <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="resize-none text-[13px] focus-visible:ring-[#BFFF00]/40 focus-visible:ring-offset-0"
        data-testid={testId}
      />
    </div>
  );
};

const ContextStep = ({ data, onChange }) => (
  <div className="space-y-5">
    <Intro icon={Target} title="Kontext des Gesprächs" text="Erzähl kurz, worum es geht. Wlad braucht die Fakten UND die Emotion, um dich richtig zu coachen." />
    <Field label="Hintergrund" hint="Was ist passiert? Warum kommt es zu diesem Gespräch?"
      value={data.background} onChange={(v) => onChange({ background: v })}
      placeholder="z.B. Mein CFO blockiert seit 3 Wochen unser Team-Bonus-Programm ..."
      testId="argprep-background" />
    <Field label="Ziel" hint="Was willst du KONKRET erreichen? In einem Satz."
      value={data.goal} onChange={(v) => onChange({ goal: v })}
      placeholder="z.B. Zustimmung zum 40k Bonus-Budget für Q4."
      testId="argprep-goal" />
    <Field label="Beziehung zum Gegenüber" hint="Wer ist die andere Person? Machtverhältnis, Historie, Emotion."
      value={data.relationship} onChange={(v) => onChange({ relationship: v })}
      placeholder="z.B. Direkter Vorgesetzter, kurzer Ton, mag Zahlen, hasst Emotionen ..."
      testId="argprep-relationship" />
  </div>
);

const ArgumentsStep = ({ data, onChange }) => (
  <div className="space-y-5">
    <Intro icon={Sparkles} title="Deine Argumente" text="Sammle deine Kernpunkte. Wlad strukturiert sie danach nach dem SEXIER-Framework — mit Statement, Beleg, Beispiel, Impact und Rebuttal." />
    <Field label="Kernpunkte" hint="Deine 3–5 stärksten Argumente, stichpunktartig."
      value={data.main_points} onChange={(v) => onChange({ main_points: v })}
      placeholder="1. Bonus steigert Retention · 2. Team-Umsatz +18% Q3 · 3. Wettbewerber zieht ab ..."
      testId="argprep-main-points" rows={5} />
    <Field label="Belege / Evidenz" hint="Zahlen, Daten, Beispiele — was macht deine Punkte unangreifbar?"
      value={data.evidence} onChange={(v) => onChange({ evidence: v })}
      placeholder="z.B. Retention-Report Q3, Kompensations-Benchmark Kienbaum 2025 ..."
      testId="argprep-evidence" />
    <Field label="Priorisierung" hint="Welches Argument bringst du zuerst? Welches ist der Trumpf?"
      value={data.prioritised} onChange={(v) => onChange({ prioritised: v })}
      placeholder="Zuerst Retention (Financial Impact), dann Team-Umsatz (Beweis), zuletzt Wettbewerb ..."
      testId="argprep-prioritised" />
  </div>
);

const ObjectionsStep = ({ data, onChange }) => (
  <div className="space-y-5">
    <Intro icon={Shield} title="Die Gegenseite antizipieren" text="Wer den Einwand vorher kennt, hat schon gewonnen. Denk wie dein Gegenüber — was WIRD er/sie sagen?" />
    <Field label="Wahrscheinliche Einwände" hint="Was wird die Gegenseite dagegenhalten?"
      value={data.expected_objections} onChange={(v) => onChange({ expected_objections: v })}
      placeholder="1. 'Budget ist eingefroren' · 2. 'Andere Teams sind wichtiger' · 3. 'Warum jetzt?' ..."
      testId="argprep-objections" rows={4} />
    <Field label="Meine Gegenargumente (Roh)" hint="Wie willst du diese Einwände entkräften? — Wlad schleift dann."
      value={data.counterarguments} onChange={(v) => onChange({ counterarguments: v })}
      placeholder="z.B. Budget-Freeze gilt nicht für Retention-Investments; ROI in 4 Monaten ..."
      testId="argprep-counterarguments" rows={4} />
    <Field label="Verborgene Interessen der Gegenseite" hint="Was WILL die andere Person wirklich? (Geld, Karriere, Kontrolle, Anerkennung ...)"
      value={data.hidden_interests} onChange={(v) => onChange({ hidden_interests: v })}
      placeholder="z.B. CFO will nicht als 'zu großzügig' beim Vorstand gelten — Framing muss ihn schützen ..."
      testId="argprep-hidden-interests" />
  </div>
);

const CoachingStep = ({ data, onChange }) => (
  <div className="space-y-5">
    <Intro icon={Lightbulb} title="Coaching-Fokus" text="Wo genau brauchst du Wlads Blick? Er identifiziert Schwachstellen, verbessert Framing und schleift deine Rebuttals." />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {[
        { key: 'Argumente stärken', label: 'Argumente stärken' },
        { key: 'Framing & Wording verbessern', label: 'Framing & Wording' },
        { key: 'Schwachstellen finden', label: 'Schwachstellen finden' },
        { key: 'Rebuttals schleifen', label: 'Rebuttals schleifen' },
      ].map(({ key, label }) => {
        const active = (data.coaching_focus || '').includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              const parts = (data.coaching_focus || '').split(',').map(s => s.trim()).filter(Boolean);
              const next = active ? parts.filter(p => p !== key) : [...parts, key];
              onChange({ coaching_focus: next.join(', ') });
            }}
            className={`flex items-center justify-center px-4 py-3 rounded-xl border text-[12px] font-black transition-all ${
              active ? 'bg-[#BFFF00] border-[#BFFF00] text-[#0A0A0A] shadow-lg shadow-[#BFFF00]/25'
                     : 'bg-white dark:bg-card border-black/[0.08] dark:border-white/[0.08] text-foreground/80 hover:border-[#BFFF00]/50'
            }`}
            data-testid={`argprep-focus-${key.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {label}
          </button>
        );
      })}
    </div>
    <Field label="Eigene Coaching-Frage (optional)" hint="Etwas Spezifisches, worauf Wlad achten soll?"
      value={data.coaching_focus} onChange={(v) => onChange({ coaching_focus: v })}
      placeholder="Optional freier Text ..." testId="argprep-coaching-free" rows={2} />
  </div>
);

const Intro = ({ icon: Icon, title, text }) => (
  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#BFFF00]/8 border border-[#BFFF00]/20">
    <div className="w-9 h-9 rounded-xl bg-[#BFFF00] flex items-center justify-center shrink-0">
      <Icon size={16} className="text-[#0A0A0A]" />
    </div>
    <div>
      <h3 className="text-[14px] font-black tracking-tight">{title}</h3>
      <p className="text-[12px] text-foreground/70 mt-0.5 leading-relaxed">{text}</p>
    </div>
  </div>
);

const StrategyView = ({ strategy, onCopy, copied }) => (
  <div className="space-y-4" data-testid="argumentation-strategy-view">
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/30">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-[#6B8A00] dark:text-[#BFFF00]" />
        <span className="text-[12px] font-black">SEXIER-Strategie · fertig zum Einsatz</span>
      </div>
      <Button size="sm" variant="outline" onClick={onCopy} className="text-[11px] font-black h-8" data-testid="argumentation-strategy-copy">
        {copied ? <><Check size={12} className="mr-1" /> Kopiert</> : <><Copy size={12} className="mr-1" /> Kopieren</>}
      </Button>
    </div>
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-[13.5px] leading-relaxed [&_h2]:text-[15px] [&_h2]:font-black [&_h2]:mt-4 [&_h2]:mb-2 [&_ul]:my-1.5 [&_strong]:text-foreground"
      data-testid="argumentation-strategy-markdown"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(strategy.strategy_markdown) }}
    />
  </div>
);

/** Minimal markdown → HTML (headings, bold, bullets) — no external deps. */
function renderMarkdown(md) {
  if (!md) return '';
  const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let html = esc(md);
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Bullets
  html = html.replace(/(^|\n)- (.+)/g, (_, br, item) => `${br}<li>${item}</li>`);
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  return html.replace(/\n{2,}/g, '<br /><br />').replace(/\n/g, ' ');
}

const Footer = ({ step, strategy, loading, canProceed, onBack, onNext, onGenerate, onLaunchSim, onClose }) => {
  const lastStep = step === STEPS.length - 1;
  return (
    <div className="border-t border-black/[0.05] dark:border-white/[0.06] px-6 sm:px-8 py-4 flex items-center justify-between gap-3 bg-white/95 dark:bg-card/95">
      {!strategy ? (
        <>
          <Button variant="ghost" onClick={onBack} disabled={step === 0 || loading} className="font-black text-[12px]" data-testid="argumentation-prep-back">
            <ArrowLeft size={14} className="mr-1" /> Zurück
          </Button>
          {!lastStep ? (
            <Button onClick={onNext} disabled={!canProceed} className="bg-[#0A0A0A] hover:bg-[#1A1A2E] text-white font-black text-[12px] px-5 transition-transform active:scale-[0.97]" data-testid="argumentation-prep-next">
              Weiter <ArrowRight size={14} className="ml-1" />
            </Button>
          ) : (
            <Button
              onClick={onGenerate}
              disabled={loading}
              className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-black text-[12px] px-5 shadow-lg shadow-[#BFFF00]/30 transition-all active:scale-[0.97] disabled:opacity-90"
              data-testid="argumentation-prep-generate"
            >
              {loading
                ? <><Loader2 size={14} className="mr-1.5 animate-spin" /> Wlad schleift ...</>
                : <><Sparkles size={14} className="mr-1.5" /> SEXIER-Strategie erstellen</>}
            </Button>
          )}
        </>
      ) : (
        <>
          <Button variant="ghost" onClick={onClose} className="font-black text-[12px]" data-testid="argumentation-strategy-close">
            Fertig
          </Button>
          <Button onClick={onLaunchSim} className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-black text-[12px] px-5 shadow-lg shadow-[#BFFF00]/30" data-testid="argumentation-launch-sim">
            <Swords size={14} className="mr-1" /> Jetzt in Simulation üben
          </Button>
        </>
      )}
    </div>
  );
};

export default ArgumentationPrepModal;
