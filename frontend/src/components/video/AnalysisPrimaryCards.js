import { Card, CardContent } from '../ui/card';
import { CheckCircle2, Target, Lightbulb, BarChart3 } from 'lucide-react';
import VoicePlayButton from '../shared/VoicePlayButton';
import SmartText from '../shared/SmartText';
import { ScoreChip } from './AnalysisAtoms';

const NumberedList = ({ items, gradient, border, prefix }) => (
  <div className="space-y-2.5">
    {items.slice(0, 3).map((s, i) => (
      <div key={`${prefix}-${i}`} className={`flex gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.03] border ${border}`}>
        <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-sm`}>{i + 1}</span>
        <p className="text-[13px] leading-relaxed flex-1 text-foreground">{s}</p>
      </div>
    ))}
  </div>
);

/* 3 Stärken + 3 Verbesserungen — TOP of screen (Iter 92.23.7 Mert) */
export const StrengthsImprovements = ({ analysis, de }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="strengths-improvements-primary">
    {analysis.strengths?.length > 0 && (
      <Card className="border-l-[3px] border-l-green-500 bg-gradient-to-br from-green-50/40 to-transparent dark:from-green-500/[0.04] dark:to-transparent border-black/[0.06] dark:border-white/[0.06]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center"><CheckCircle2 size={15} className="text-green-500" /></div>
            <div>
              <h4 className="text-[13px] font-black text-green-700 dark:text-green-300 leading-tight">{de ? '3 Dinge, die du gut gemacht hast' : '3 things you did well'}</h4>
              <p className="text-[10px] text-muted-foreground">{de ? 'Deine Stärken — bau darauf auf' : 'Your strengths — build on these'}</p>
            </div>
          </div>
          <NumberedList items={analysis.strengths} gradient="from-green-500 to-emerald-600" border="border-green-500/10" prefix="strength" />
        </CardContent>
      </Card>
    )}
    {analysis.improvements?.length > 0 && (
      <Card className="border-l-[3px] border-l-amber-500 bg-gradient-to-br from-amber-50/40 to-transparent dark:from-amber-500/[0.04] dark:to-transparent border-black/[0.06] dark:border-white/[0.06]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center"><Target size={15} className="text-amber-500" /></div>
            <div>
              <h4 className="text-[13px] font-black text-amber-700 dark:text-amber-300 leading-tight">{de ? '3 Dinge, die du verbessern kannst' : '3 things to improve'}</h4>
              <p className="text-[10px] text-muted-foreground">{de ? 'Konkrete Übungen für deinen nächsten Versuch' : 'Concrete exercises for next time'}</p>
            </div>
          </div>
          <NumberedList items={analysis.improvements} gradient="from-amber-500 to-orange-500" border="border-amber-500/10" prefix="improve" />
        </CardContent>
      </Card>
    )}
  </div>
);

/* Wlad-Assessment Player — premium prominence right after 3+3 */
export const WladAssessmentCard = ({ analysis, de }) => (
<Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0A0A0A] via-[#0F0F1A] to-[#1A1A2E] text-white relative" data-testid="wlad-assessment">
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BFFF00]/10 ring-1 ring-[#BFFF00]/30 backdrop-blur-sm z-10">
        <div className="w-3.5 h-3.5 rounded-sm bg-[#BFFF00] flex items-center justify-center">
          <span className="text-[7px] font-black text-black leading-none">W</span>
        </div>
        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#BFFF00] leading-none">LEADER-OS</span>
      </div>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shadow-xl shadow-[#BFFF00]/30 ring-2 ring-[#BFFF00]/20" aria-label="LEADER-OS">
              <span className="text-2xl font-black text-black leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>W</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#0A0A0A] flex items-center justify-center ring-2 ring-[#BFFF00]">
              <CheckCircle2 size={11} className="text-[#BFFF00]" strokeWidth={3} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <div>
                <p className="text-[14px] font-black tracking-tight">Wlad Jachtchenko</p>
                <p className="text-[10px] font-bold text-[#BFFF00]/80 uppercase tracking-widest">Persönliche Einschätzung · KI-Voice</p>
              </div>
              <VoicePlayButton
                text={analysis.wlad_assessment}
                persona="wlad"
                size="sm"
                variant="primary"
                label={de ? 'Wlad anhören' : 'Listen to Wlad'}
                testId="wlad-assessment-play"
                showWave
              />
            </div>
            <div className="text-white/90 mt-2 [&_*]:!text-white/90 [&_.text-foreground]:!text-white [&_strong]:!text-white">
              <SmartText text={analysis.wlad_assessment} accent="#BFFF00" icon={Lightbulb} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
);

/* Compact Score Strip */
export const ScoreStrip = ({ analysis, de }) => (
  <Card className="bg-gradient-to-br from-white/80 to-white/60 dark:from-white/[0.03] dark:to-white/[0.01] border-black/[0.04] dark:border-white/[0.06]">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={13} className="text-muted-foreground" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">{de ? 'Deine Scores' : 'Your Scores'}</h4>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{de ? 'Gesamt' : 'Overall'}</p>
          <p className="text-3xl font-black leading-none" style={{
            color: analysis.overall_score >= 80 ? '#10B981' : analysis.overall_score >= 60 ? '#F59E0B' : '#EF4444',
            fontFamily: 'Outfit, sans-serif',
          }}>{analysis.overall_score || 0}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="video-scores">
        <ScoreChip value={analysis.clarity_score}    label={de ? 'Klarheit' : 'Clarity'}        color="#0EA5E9" gradient="from-sky-500 to-blue-500" />
        <ScoreChip value={analysis.confidence_score} label={de ? 'Selbstvertrauen' : 'Confidence'} color="#A855F7" gradient="from-violet-500 to-purple-500" />
        <ScoreChip value={analysis.empathy_score}    label={de ? 'Empathie' : 'Empathy'}       color="#EC4899" gradient="from-pink-500 to-rose-500" />
        <ScoreChip value={analysis.structure_score}  label={de ? 'Struktur' : 'Structure'}     color="#10B981" gradient="from-emerald-500 to-teal-500" />
      </div>
    </CardContent>
  </Card>
);
