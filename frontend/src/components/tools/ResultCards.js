import { Card, CardContent } from '../ui/card';
import { Check, X, Lightbulb, Star, Target } from 'lucide-react';
import SmartText from '../shared/SmartText';

const ResultSection = ({ title, gradient, children }) => (
  <Card className="bg-white/80 dark:bg-card/80 border-black/[0.04] dark:border-white/[0.06]">
    <CardContent className="p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradient}`} />
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h4>
      </div>
      {children}
    </CardContent>
  </Card>
);

const ResultField = ({ label, value }) => (
  <div>
    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">{label}</p>
    <p className="text-sm">{value}</p>
  </div>
);

const ConversationPlanCard = ({ plan, de }) => (
  <ResultSection title={de ? 'Gesprächsplan' : 'Conversation Plan'} gradient="from-[#0A0A0A] to-[#111]">
    {plan.opening && <ResultField label={de ? 'Eröffnung' : 'Opening'} value={plan.opening} />}
    {plan.main_points?.map((p, i) => <ResultField key={`cp-pt-${i}`} label={`${de ? 'Punkt' : 'Point'} ${i + 1}`} value={p} />)}
    {plan.closing && <ResultField label={de ? 'Abschluss' : 'Closing'} value={plan.closing} />}
  </ResultSection>
);

const FeedbackCard = ({ items, de }) => (
  <ResultSection title={de ? 'Feedback-Formulierungen' : 'Feedback Formulations'} gradient="from-green-500 to-emerald-500">
    {items.map((f, i) => (
      <p key={`ff-${i}`} className="text-sm p-2.5 rounded-xl bg-green-50 dark:bg-green-500/5 border border-green-200/30 dark:border-green-500/10 italic">"{f}"</p>
    ))}
  </ResultSection>
);

const GuideQuestionsCard = ({ items, de }) => (
  <ResultSection title={de ? 'Leitfragen' : 'Guide Questions'} gradient="from-amber-500 to-orange-500">
    {items.map((q, i) => (
      <div key={`gq-${i}`} className="flex gap-2 text-sm"><Lightbulb size={12} className="text-amber-500 shrink-0 mt-0.5" />{q}</div>
    ))}
  </ResultSection>
);

const OptimizedTextCard = ({ text, tone, de }) => (
  <ResultSection title={de ? 'Optimierte Version' : 'Optimized Version'} gradient="from-cyan-500 to-blue-500">
    <SmartText text={text} accent="#06B6D4" icon={Lightbulb} />
    {tone && <p className="text-xs text-muted-foreground mt-2">{de ? 'Tonfall' : 'Tone'}: {tone}</p>}
  </ResultSection>
);

const ProConCards = ({ pros, cons }) => (
  <div className="grid grid-cols-2 gap-3">
    {pros?.length > 0 && (
      <ResultSection title="PRO" gradient="from-green-500 to-emerald-500">
        {pros.map((p, i) => <div key={`pro-${i}`} className="flex gap-2 text-sm"><Check size={12} className="text-green-500 shrink-0 mt-0.5" />{p}</div>)}
      </ResultSection>
    )}
    {cons?.length > 0 && (
      <ResultSection title="CONTRA" gradient="from-red-500 to-rose-500">
        {cons.map((c, i) => <div key={`con-${i}`} className="flex gap-2 text-sm"><X size={12} className="text-red-500 shrink-0 mt-0.5" />{c}</div>)}
      </ResultSection>
    )}
  </div>
);

const HighImpactCard = ({ items, de }) => (
  <ResultSection title={de ? 'Hoher Impact · Sofort umsetzen' : 'High Impact · Do First'} gradient="from-[#0A0A0A] to-[#1A1A2E]">
    {items.map((t, i) => (
      <div key={`hi-${i}`} className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200/30 dark:border-blue-500/10">
        <p className="text-sm font-medium">{t.task}</p>
        <p className="text-xs text-muted-foreground">{t.why}</p>
      </div>
    ))}
  </ResultSection>
);

const DevelopmentPlanCard = ({ items, de }) => (
  <ResultSection title={de ? 'Entwicklungsplan' : 'Development Plan'} gradient="from-pink-500 to-rose-500">
    {items.map((d, i) => (
      <div key={`dp-${i}`} className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/5">
        <p className="text-sm font-medium">{d.goal}</p>
        <p className="text-xs text-muted-foreground">{d.action} · {d.timeline}</p>
      </div>
    ))}
  </ResultSection>
);

const NextStepsCard = ({ items, de }) => (
  <ResultSection title={de ? 'Nächste Schritte' : 'Next Steps'} gradient="from-emerald-500 to-cyan-500">
    <ol className="text-sm space-y-1.5">
      {items.map((s, i) => (
        <li key={`ns-${i}`} className="flex gap-2.5">
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
          {s}
        </li>
      ))}
    </ol>
  </ResultSection>
);

const AgendaCard = ({ items }) => (
  <ResultSection title="Agenda" gradient="from-orange-500 to-amber-500">
    {items.map((item, i) => (
      <div key={`ag-${i}`} className="flex items-center gap-3 p-2 rounded-lg bg-orange-50 dark:bg-orange-500/5">
        <span className="text-xs font-mono text-orange-600 dark:text-orange-400 shrink-0 w-14">{item.duration}</span>
        <div><p className="text-sm font-medium">{item.topic}</p></div>
      </div>
    ))}
  </ResultSection>
);

const ListCard = ({ title, gradient, items, icon: Icon, color }) => (
  <ResultSection title={title} gradient={gradient}>
    {items.map((t, i) => (
      <div key={`${title}-${i}`} className="flex gap-2 text-sm">
        <Icon size={12} className={`${color} shrink-0 mt-0.5`} />
        {typeof t === 'string' ? t : (t.task || t.topic || JSON.stringify(t))}
      </div>
    ))}
  </ResultSection>
);

const DelegateCard = ({ items, de }) => (
  <ResultSection title={de ? 'Delegieren' : 'Delegate'} gradient="from-sky-500 to-blue-500">
    {items.map((d, i) => (
      <div key={`del-${i}`} className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200/30 dark:border-blue-500/10">
        <p className="text-sm font-medium">{d.task}</p>
        {d.to_whom && <p className="text-xs text-muted-foreground">{de ? 'An' : 'To'}: {d.to_whom}</p>}
        {d.why && <p className="text-xs text-muted-foreground italic mt-0.5">{d.why}</p>}
      </div>
    ))}
  </ResultSection>
);

const EliminateCard = ({ items, de }) => (
  <ResultSection title={de ? 'Eliminieren' : 'Eliminate'} gradient="from-red-500 to-rose-500">
    {items.map((d, i) => (
      <div key={`elim-${i}`} className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200/30 dark:border-red-500/10">
        <p className="text-sm font-medium">{d.task}</p>
        {d.reason && <p className="text-xs text-muted-foreground italic mt-0.5">{d.reason}</p>}
      </div>
    ))}
  </ResultSection>
);

const ScheduleLaterCard = ({ items, de }) => (
  <ResultSection title={de ? 'Später einplanen' : 'Schedule Later'} gradient="from-violet-500 to-purple-500">
    {items.map((d, i) => (
      <div key={`sched-${i}`} className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/5 border border-violet-200/30 dark:border-violet-500/10">
        <p className="text-sm font-medium">{d.task}</p>
        {d.why && <p className="text-xs text-muted-foreground italic mt-0.5">{d.why}</p>}
      </div>
    ))}
  </ResultSection>
);

const DailyPlanCard = ({ items, de }) => (
  <ResultSection title={de ? 'Tagesplan' : 'Daily Plan'} gradient="from-cyan-500 to-teal-500">
    {items.map((d, i) => (
      <div key={`dp-${i}`} className="flex items-start gap-3 p-2.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-500/5">
        <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 shrink-0 w-24">{d.time_block}</span>
        <span className="text-sm">{d.focus}</span>
      </div>
    ))}
  </ResultSection>
);

const WeeklyThemesCard = ({ items, de }) => (
  <ResultSection title={de ? 'Wochen-Themen' : 'Weekly Themes'} gradient="from-pink-500 to-rose-500">
    {items.map((t, i) => (
      <div key={`wt-${i}`} className="flex gap-2 text-sm p-2 rounded-lg bg-pink-50/50 dark:bg-pink-500/5">
        <span className="text-pink-500 font-bold shrink-0">{i + 1}</span>
        <span>{t}</span>
      </div>
    ))}
  </ResultSection>
);

export const ResultCards = ({ result, de }) => {
  if (!result) return null;
  const cards = [];

  if (result.conversation_plan) {
    cards.push(<ConversationPlanCard key="cp" plan={result.conversation_plan} de={de} />);
  }
  if (result.feedback_formulations?.length > 0) {
    cards.push(<FeedbackCard key="ff" items={result.feedback_formulations} de={de} />);
  }
  if (result.guide_questions?.length > 0) {
    cards.push(<GuideQuestionsCard key="gq" items={result.guide_questions} de={de} />);
  }
  if (result.optimized_text) {
    cards.push(<OptimizedTextCard key="ot" text={result.optimized_text} tone={result.tone_analysis} de={de} />);
  }
  if (result.pros || result.cons) {
    cards.push(<ProConCards key="pc" pros={result.pros} cons={result.cons} />);
  }
  if (result.recommendation) {
    cards.push(
      <ResultSection key="rec" title={de ? 'Empfehlung' : 'Recommendation'} gradient="from-[#BFFF00] to-[#9ACC00]">
        <SmartText text={result.recommendation} accent="#BFFF00" icon={Star} />
      </ResultSection>
    );
  }
  if (result.event_concept) {
    cards.push(
      <ResultSection key="ec" title={de ? 'Event-Konzept' : 'Event Concept'} gradient="from-emerald-500 to-green-500">
        <SmartText text={result.event_concept} accent="#10B981" icon={Target} />
      </ResultSection>
    );
  }
  if (result.location_suggestions?.length > 0) {
    cards.push(<ListCard key="ls" title={de ? 'Location-Vorschläge' : 'Location Suggestions'} gradient="from-teal-500 to-emerald-500" items={result.location_suggestions} icon={Target} color="text-teal-500" />);
  }
  if (result.location_tips?.length > 0) {
    cards.push(<ListCard key="lt" title={de ? 'Standort-Tipps' : 'Location Tips'} gradient="from-cyan-500 to-teal-500" items={result.location_tips} icon={Lightbulb} color="text-cyan-500" />);
  }
  if (result.budget_estimate) {
    cards.push(
      <ResultSection key="be" title={de ? 'Budget-Schätzung' : 'Budget Estimate'} gradient="from-amber-500 to-yellow-500">
        <p className="text-sm font-medium">{result.budget_estimate}</p>
      </ResultSection>
    );
  }
  if (result.tips?.length > 0) {
    cards.push(<ListCard key="tips" title={de ? 'Profi-Tipps' : 'Pro Tips'} gradient="from-[#BFFF00] to-blue-500" items={result.tips} icon={Star} color="text-[#6B8A00] dark:text-[#BFFF00]" />);
  }
  if (result.agenda?.length > 0 && result.agenda[0]?.topic) {
    cards.push(<AgendaCard key="ag" items={result.agenda} />);
  }
  if (result.high_impact?.length > 0) {
    cards.push(<HighImpactCard key="hi" items={result.high_impact} de={de} />);
  }
  if (result.delegate?.length > 0) {
    cards.push(<DelegateCard key="dl" items={result.delegate} de={de} />);
  }
  if (result.eliminate?.length > 0) {
    cards.push(<EliminateCard key="el" items={result.eliminate} de={de} />);
  }
  if (result.schedule_later?.length > 0) {
    cards.push(<ScheduleLaterCard key="sl" items={result.schedule_later} de={de} />);
  }
  if (result.daily_plan?.length > 0) {
    cards.push(<DailyPlanCard key="dpl" items={result.daily_plan} de={de} />);
  }
  if (result.weekly_themes?.length > 0) {
    cards.push(<WeeklyThemesCard key="wt" items={result.weekly_themes} de={de} />);
  }
  if (result.development_plan?.length > 0) {
    cards.push(<DevelopmentPlanCard key="dp" items={result.development_plan} de={de} />);
  }
  if (result.next_steps?.length > 0) {
    cards.push(<NextStepsCard key="ns" items={result.next_steps} de={de} />);
  }
  if (result.result && typeof result.result === 'string') {
    cards.push(
      <ResultSection key="fb" title={de ? 'Ergebnis' : 'Result'} gradient="from-[#0A0A0A] to-[#1A1A2E]">
        <SmartText text={result.result} accent="#BFFF00" icon={Lightbulb} />
      </ResultSection>
    );
  }

  return <div className="space-y-4">{cards}</div>;
};
