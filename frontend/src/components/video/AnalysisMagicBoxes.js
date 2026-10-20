import { Brain, Mic, Wand2, Lightbulb, MessageSquareText, TrendingUp, Target, Sparkles } from 'lucide-react';
import SmartText from '../shared/SmartText';
import { MagicBox } from './AnalysisAtoms';

/* Collapsible drill-down boxes (Iter 92.23.7 Mert: "open a magic box for more detailed information") */
export const AnalysisMagicBoxes = ({ analysis, de }) => (
  <div className="space-y-3" data-testid="magic-boxes">
    <div className="flex items-center gap-2 mt-2 mb-1 px-1">
      <Sparkles size={12} className="text-[#BFFF00]" />
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6B8A00] dark:text-[#BFFF00]">
        {de ? 'Tiefer eintauchen' : 'Dive deeper'}
      </span>
    </div>

    {analysis.sexier_scores && (
      <MagicBox icon={Brain} title={de ? 'Wlads SEXIER-Analyse' : "Wlad's SEXIER Analysis"} accent="#BFFF00" testId="magic-box-sexier">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          {[
            { letter: 'S', label: 'Statement', desc: de ? 'Klare These' : 'Clear thesis', score: analysis.sexier_scores.statement, color: '#F59E0B' },
            { letter: 'E', label: 'Explanation', desc: de ? 'Tiefe Begründung' : 'Deep reasoning', score: analysis.sexier_scores.explanation, color: '#EC4899' },
            { letter: 'X', label: 'eXample', desc: de ? 'Konkretes Beispiel' : 'Concrete example', score: analysis.sexier_scores.example, color: '#6366F1' },
            { letter: 'I', label: 'Impact', desc: de ? 'Relevanz fürs Gegenüber' : 'Relevance shown', score: analysis.sexier_scores.impact, color: '#0EA5E9' },
            { letter: 'E', label: de ? 'Expl. of Impact' : 'Expl. of Impact', desc: de ? 'Warum es wichtig ist' : 'Why it matters', score: analysis.sexier_scores.impact_explanation, color: '#8B5CF6' },
            { letter: 'R', label: 'Rebuttal', desc: de ? 'Einwand entkräftet' : 'Objection rebutted', score: analysis.sexier_scores.rebuttal, color: '#10B981' },
          ].map((p, i) => (
            <div key={`${p.letter}-${i}`} className="rounded-xl p-4 bg-white/60 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] text-center" data-testid={`sexier-tile-${i}`}>
              <p className="text-[10px] font-black tracking-widest" style={{ color: p.color }}>{p.letter}</p>
              <p className="text-3xl font-black" style={{ color: p.color, fontFamily: 'Outfit, sans-serif' }}>{p.score || 0}</p>
              <p className="text-[11px] font-bold mt-1">{p.label}</p>
              <p className="text-[9px] text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
        {analysis.framework_feedback?.sexier && (
          <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Wlads Bewertung' : "Wlad's verdict"}</p>
            <SmartText text={analysis.framework_feedback.sexier} accent="#BFFF00" icon={Lightbulb} />
          </div>
        )}
        {analysis.framework_feedback?.kommunikationsquadrant && (
          <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Kommunikationsquadrant' : 'Communication Quadrant'}</p>
            <SmartText text={analysis.framework_feedback.kommunikationsquadrant} accent="#10B981" icon={Target} />
          </div>
        )}
      </MagicBox>
    )}

    {/* Legacy fallback moved below — see bottom of stack */}

    {analysis.speech_analysis && (
      <MagicBox icon={Mic} title={de ? 'Rede-Analyse (Füllwörter, Tempo, Phrasen)' : 'Speech Analysis (Fillers, Pace, Phrases)'} accent="#F59E0B" testId="magic-box-speech">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {analysis.speech_analysis.filler_count !== undefined && (
            <div className="text-center p-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/10 border border-amber-500/10">
              <p className="text-2xl font-black text-amber-500" style={{ fontFamily: 'Outfit, sans-serif' }}>{analysis.speech_analysis.filler_count}</p>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{de ? 'Füllwörter' : 'Filler Words'}</p>
            </div>
          )}
          {analysis.speech_analysis.avg_sentence_length && (
            <div className="text-center p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
              <p className="text-sm font-bold capitalize">{analysis.speech_analysis.avg_sentence_length}</p>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{de ? 'Satzlänge' : 'Sentence Length'}</p>
            </div>
          )}
          {analysis.speech_analysis.speech_pace && (
            <div className="text-center p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
              <p className="text-sm font-bold capitalize">{analysis.speech_analysis.speech_pace}</p>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{de ? 'Tempo' : 'Pace'}</p>
            </div>
          )}
          {analysis.speech_analysis.key_phrases?.length > 0 && (
            <div className="text-center p-3 rounded-xl bg-green-50/50 dark:bg-green-500/10 border border-green-500/10">
              <p className="text-2xl font-black text-green-500" style={{ fontFamily: 'Outfit, sans-serif' }}>{analysis.speech_analysis.key_phrases.length}</p>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{de ? 'Starke Phrasen' : 'Strong Phrases'}</p>
            </div>
          )}
        </div>
        {analysis.speech_analysis.filler_words?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Erkannte Füllwörter' : 'Detected fillers'}</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.speech_analysis.filler_words.map((w, wIdx) => (
                <span key={`filler-${w}-${wIdx}`} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium">"{w}"</span>
              ))}
            </div>
          </div>
        )}
        {analysis.speech_analysis.key_phrases?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Deine stärksten Formulierungen' : 'Your strongest phrases'}</p>
            <ul className="space-y-1.5">
              {analysis.speech_analysis.key_phrases.map((p, i) => (
                <li key={`phrase-${i}`} className="text-[12px] italic text-foreground/80 pl-3 border-l-2 border-green-500/40">"{p}"</li>
              ))}
            </ul>
          </div>
        )}
      </MagicBox>
    )}

    {analysis.rewrite_suggestion && (
      <MagicBox icon={Wand2} title={de ? 'Vorgeschlagene Überarbeitung (Wlad-Style)' : 'Suggested Rewrite (Wlad-Style)'} accent="#0EA5E9" testId="magic-box-rewrite">
        <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-sky-50/50 to-[#BFFF00]/[0.04] dark:from-sky-500/[0.05] dark:to-[#BFFF00]/[0.03] border border-sky-500/15 italic">
          <p className="text-[13px] leading-relaxed">"{analysis.rewrite_suggestion}"</p>
        </div>
      </MagicBox>
    )}

    {analysis.practice_exercises?.length > 0 && (
      <MagicBox icon={Lightbulb} title={de ? 'Übungen für morgen' : 'Practice for Tomorrow'} accent="#BFFF00" testId="magic-box-practice">
        <div className="space-y-2 mt-3">
          {analysis.practice_exercises.map((ex, exIdx) => (
            <div key={`ex-${exIdx}`} className="flex gap-3 p-3 rounded-xl bg-[#BFFF00]/[0.06] dark:bg-[#BFFF00]/[0.04] border border-[#BFFF00]/20">
              <span className="w-7 h-7 rounded-lg bg-[#BFFF00] text-[#0A0A0A] font-black text-[11px] flex items-center justify-center shrink-0">{exIdx + 1}</span>
              <p className="text-[13px] leading-relaxed flex-1">{ex}</p>
            </div>
          ))}
        </div>
      </MagicBox>
    )}

    {analysis.transcript && (
      <MagicBox icon={MessageSquareText} title={de ? 'Dein Transkript' : 'Your Transcript'} accent="#94A3B8" testId="magic-box-transcript">
        <p className="text-[13px] italic text-muted-foreground leading-relaxed mt-3 p-4 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">"{analysis.transcript}"</p>
      </MagicBox>
    )}

    {analysis.improvement_vs_previous && analysis.improvement_vs_previous !== 'null' && (
      <MagicBox icon={TrendingUp} title={de ? 'Vergleich mit vorherigen Versuchen' : 'vs. Previous Attempts'} accent="#10B981" testId="magic-box-progress">
        <div className="mt-3"><SmartText text={analysis.improvement_vs_previous} accent="#10B981" icon={TrendingUp} /></div>
      </MagicBox>
    )}

    {/* Vertiefung: klassische 3 Säulen — bewusst GANZ UNTEN (SEXIER ist das Haupt-Framework) */}
    {(analysis.logos_score || analysis.ethos_score || analysis.pathos_score) && (
      <MagicBox icon={Brain} title={de ? 'Vertiefung: 3 Säulen der Überzeugung (Logos · Ethos · Pathos)' : 'Deep-dive: 3 Pillars (Logos · Ethos · Pathos)'} accent="#8B5CF6" testId="magic-box-pillars">
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[
            { label: 'Logos', desc: de ? 'Logik & Daten' : 'Logic & Data', score: analysis.logos_score, color: '#6366F1' },
            { label: 'Ethos', desc: de ? 'Glaubwürdigkeit' : 'Credibility', score: analysis.ethos_score, color: '#8B5CF6' },
            { label: 'Pathos', desc: de ? 'Emotion' : 'Emotion', score: analysis.pathos_score, color: '#A78BFA' },
          ].map((p) => (
            <div key={p.label} className="rounded-xl p-4 bg-white/60 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] text-center">
              <p className="text-3xl font-black" style={{ color: p.color, fontFamily: 'Outfit, sans-serif' }}>{p.score || 0}</p>
              <p className="text-[11px] font-bold mt-1">{p.label}</p>
              <p className="text-[9px] text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
        {analysis.framework_feedback?.drei_saeulen && (
          <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Wlads Bewertung' : "Wlad's verdict"}</p>
            <SmartText text={analysis.framework_feedback.drei_saeulen} accent="#BFFF00" icon={Lightbulb} />
          </div>
        )}
        {!analysis.sexier_scores && analysis.framework_feedback?.kommunikationsquadrant && (
          <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">{de ? 'Kommunikationsquadrant' : 'Communication Quadrant'}</p>
            <SmartText text={analysis.framework_feedback.kommunikationsquadrant} accent="#10B981" icon={Target} />
          </div>
        )}
      </MagicBox>
    )}
  </div>
);
