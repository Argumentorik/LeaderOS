import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { User, Briefcase, Users, Target, TrendingUp, ShieldCheck, Download, Video, Star, ArrowRight } from 'lucide-react';
import { ResultCards } from './ResultCards';
import SmartText from '../shared/SmartText';
import VoicePlayButton from '../shared/VoicePlayButton';

// Compose a spoken summary from whatever fields the workflow returned (max ~800 chars)
const buildSpeechText = (result) => {
  const parts = [];
  if (result.event_concept) parts.push(result.event_concept);
  if (result.decision_summary) parts.push(result.decision_summary);
  if (typeof result.recommendation === 'string') parts.push(`Meine Empfehlung: ${result.recommendation}`);
  if (result.optimized_text) parts.push(result.optimized_text);
  if (typeof result.result === 'string') parts.push(result.result);
  if (Array.isArray(result.tips) && result.tips.length) {
    parts.push('Meine wichtigsten Tipps: ' + result.tips.slice(0, 3).map(t => (typeof t === 'string' ? t : '')).filter(Boolean).join('. '));
  }
  if (Array.isArray(result.next_steps) && result.next_steps.length) {
    parts.push('Deine nächsten Schritte: ' + result.next_steps.slice(0, 3).map(t => (typeof t === 'string' ? t : t?.action || '')).filter(Boolean).join('. '));
  }
  return parts.filter(Boolean).join(' ').slice(0, 790);
};

const PersonaSummary = ({ persona, de }) => (
  <Card className="bg-gradient-to-r from-[#BFFF00]/[0.06] to-[#BFFF00]/[0.04] dark:from-[#BFFF00]/[0.04] dark:to-[#BFFF00]/[0.03] border-[#BFFF00]/20 dark:border-[#BFFF00]/10">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <User size={14} className="text-[#6B8A00] dark:text-[#BFFF00]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A6200] dark:text-[#BFFF00]">{de ? 'Dein Profil' : 'Your Profile'}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {persona.role && <Badge variant="outline" className="text-xs border-[#BFFF00]/20 text-[#4A6200]"><Briefcase size={10} className="mr-1" /> {persona.role}</Badge>}
        {persona.industry && <Badge variant="outline" className="text-xs border-[#BFFF00]/20 text-[#4A6200]"><TrendingUp size={10} className="mr-1" /> {persona.industry}</Badge>}
        {persona.team && <Badge variant="outline" className="text-xs border-[#BFFF00]/20 text-[#4A6200]"><Users size={10} className="mr-1" /> {persona.team}</Badge>}
      </div>
      {persona.goals && <p className="text-xs text-muted-foreground mt-2"><Target size={10} className="inline mr-1" /> {persona.goals}</p>}
    </CardContent>
  </Card>
);

const CounterCheckCard = ({ text, de }) => (
  <Card className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-500/5 dark:to-orange-500/5 border-amber-200/30 dark:border-amber-500/10">
    <CardContent className="p-5 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-amber-600" />
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">{de ? 'Gegencheck — Devil\'s Advocate' : 'Counter-Check — Devil\'s Advocate'}</h4>
      </div>
      <SmartText text={text} accent="#F59E0B" icon={ShieldCheck} />
    </CardContent>
  </Card>
);

const GoalsReflection = ({ persona, de }) => (
  <Card className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-500/5 dark:to-teal-500/5 border-emerald-200/30 dark:border-emerald-500/10">
    <CardContent className="p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Target size={16} className="text-emerald-600" />
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{de ? 'Deine Ziele & Reflexion' : 'Your Goals & Reflection'}</h4>
      </div>
      {persona.goals && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200/30 dark:border-emerald-500/10">
          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">{de ? 'Persönliche Ziele' : 'Personal Goals'}</p>
          <p className="text-sm">{persona.goals}</p>
        </div>
      )}
      {persona.employeeGoals && (
        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-500/5 border border-teal-200/30 dark:border-teal-500/10">
          <p className="text-[10px] font-bold text-teal-600 uppercase mb-1">{de ? 'Ziele für dein Team' : 'Team Goals'}</p>
          <p className="text-sm">{persona.employeeGoals}</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export const WorkflowResultPanel = ({
  result, persona, onDownloadPDF, onNavigateVideo, onOpenUpsell, de,
}) => (
  <div className="space-y-5 animate-fade-in">
    <div className="text-center py-2 space-y-3">
      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs font-bold px-3 py-1">
        {de ? 'WORKFLOW ABGESCHLOSSEN' : 'WORKFLOW COMPLETE'}
      </Badge>
      {buildSpeechText(result) && (
        <div className="flex justify-center">
          <VoicePlayButton
            text={buildSpeechText(result)}
            persona="wlad"
            variant="primary"
            size="md"
            label={de ? 'Ergebnis anhören' : 'Listen to result'}
            testId="workflow-audio-btn"
          />
        </div>
      )}
    </div>

    {result.format_error && result.raw_text && (
      <div className="p-5 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08]" data-testid="workflow-raw-fallback">
        <SmartText text={result.raw_text} accent="#BFFF00" />
      </div>
    )}

    {(persona.role || persona.goals) && <PersonaSummary persona={persona} de={de} />}

    <ResultCards result={result} de={de} />

    {result.counter_check && <CounterCheckCard text={result.counter_check} de={de} />}

    {(persona.goals || persona.employeeGoals) && <GoalsReflection persona={persona} de={de} />}

    <div className="flex gap-3">
      <Button onClick={onDownloadPDF} className="flex-1 bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-semibold h-11 shadow-sm" data-testid="workflow-download-pdf-btn">
        <Download size={14} className="mr-2" /> PDF Report
      </Button>
      <Button variant="outline" onClick={onNavigateVideo} className="flex-1 border-[#BFFF00]/20 dark:border-[#BFFF00]/15 text-[#4A6200] font-semibold h-11" data-testid="workflow-video-btn">
        <Video size={14} className="mr-2" /> {de ? 'Üben' : 'Practice'}
      </Button>
    </div>

    <div className="upsell-border">
      <div className="p-5 flex items-center gap-4" data-testid="workflow-upsell">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
          <Star size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold">{de ? 'Experten-Umsetzungsunterstützung gewünscht?' : 'Want expert implementation support?'}</p>
          <p className="text-[12px] text-muted-foreground">{de ? 'Erhalte 1:1 Coaching für die perfekte Umsetzung' : 'Get 1:1 coaching to execute this workflow perfectly'}</p>
        </div>
        <Button onClick={onOpenUpsell} className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A2E] text-white font-bold shadow-sm shrink-0" data-testid="workflow-upsell-btn">
          4.977 EUR <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  </div>
);
