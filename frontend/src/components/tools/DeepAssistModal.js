import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import api from '../../lib/api';
import logger from '../../lib/logger';
import {
  Sparkles, MessageSquare, Target, Loader2, CheckCircle2, X, Clock, Lightbulb,
  ChevronRight, Wand2,
} from 'lucide-react';
import SmartText from '../shared/SmartText';

/**
 * DeepAssistModal · 3-Step AI Assistant (Argumentation / Tips / Action Plan).
 * Invoked via a "KI-Assistent" button anywhere in the app (Tools, Workflows, Simulations).
 *
 * Props:
 *   open, onClose · modal state
 *   toolId · optional workflow ID context
 *   de · language
 *   defaultSituation · optional pre-filled situation
 */
export const DeepAssistModal = ({ open, onClose, toolId, de = true, defaultSituation = '' }) => {
  const [situation, setSituation] = useState(defaultSituation);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    if (!situation.trim() || loading) return;
    setLoading(true); setError('');
    try {
      const res = await api.post('/tools/deep-assist', {
        situation: situation.trim(), goal: goal.trim(), tool_id: toolId || null,
      });
      setResult(res.data);
    } catch (err) {
      logger.error(err);
      setError(err.response?.data?.detail || (de ? 'Analyse fehlgeschlagen' : 'Analysis failed'));
    } finally { setLoading(false); }
  };

  const reset = () => { setResult(null); setSituation(''); setGoal(''); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl" onClick={(e) => e.stopPropagation()} data-testid="deep-assist-modal">
        <div className="sticky top-0 z-10 bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] text-white p-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center">
                <Wand2 size={18} className="text-[#BFFF00]" />
              </div>
              <div>
                <h2 className="text-lg font-black">{de ? 'KI Deep-Assist' : 'AI Deep Assist'}</h2>
                <p className="text-[11px] text-white/60">{de ? '3 Schritte: Argumentation · Tipps · Aktionsplan' : '3 steps: Argumentation · Tips · Action Plan'}</p>
              </div>
            </div>
            <button onClick={onClose} data-testid="deep-assist-close" className="text-white/50 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <CardContent className="p-5 space-y-4">
          {!result ? (
            <>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">{de ? 'Situation beschreiben' : 'Describe the situation'}</label>
                <Textarea
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder={de ? 'Bsp: Ich muss meinen Manager überzeugen, ein Remote-Arbeitsmodell für 4 Teammitglieder zu erlauben...' : 'Example: I need to convince my manager to allow remote work for 4 team members...'}
                  className="min-h-[110px] resize-none text-[13px] bg-gray-50 dark:bg-muted/30 border-black/[0.06] dark:border-white/[0.06] rounded-xl"
                  data-testid="da-situation"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">{de ? 'Ziel (optional)' : 'Goal (optional)'}</label>
                <Textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={de ? 'Bsp: Zustimmung bis Freitag' : 'Example: Approval by Friday'}
                  className="min-h-[60px] resize-none text-[13px] bg-gray-50 dark:bg-muted/30 border-black/[0.06] dark:border-white/[0.06] rounded-xl"
                  data-testid="da-goal"
                />
              </div>
              {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
              <Button
                onClick={run}
                disabled={!situation.trim() || loading}
                className="w-full bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] hover:shadow-lg hover:shadow-[#BFFF00]/20 font-bold h-11"
                data-testid="da-run-btn"
              >
                {loading ? <><Loader2 size={14} className="mr-2 animate-spin" /> {de ? 'WladBot analysiert...' : 'WladBot analyzing...'}</>
                : <><Sparkles size={14} className="mr-2" /> {de ? 'Deep-Assist starten (kostet 1 Credit)' : 'Start Deep Assist (1 credit)'}</>}
              </Button>
            </>
          ) : (
            <div className="space-y-5">
              {/* 1. Argumentation */}
              <section data-testid="da-section-arg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-[#BFFF00] flex items-center justify-center text-[#0A0A0A] font-black text-[11px]">1</div>
                  <h3 className="text-[13px] font-black flex items-center gap-1.5"><MessageSquare size={13} /> {de ? 'Argumentation (Logos · Ethos · Pathos)' : 'Argumentation'}</h3>
                </div>
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#BFFF00]/[0.06] to-[#9ACC00]/[0.02] border border-[#BFFF00]/15">
                  <SmartText text={result.argumentation} accent="#BFFF00" icon={MessageSquare} />
                </div>
              </section>

              {/* 2. Tips */}
              <section data-testid="da-section-tips">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-[11px]">2</div>
                  <h3 className="text-[13px] font-black flex items-center gap-1.5"><Lightbulb size={13} /> {de ? 'Inhaltliche Tipps' : 'Content Tips'}</h3>
                </div>
                <ul className="space-y-1.5">
                  {(result.tips || []).map((tip, i) => (
                    <li key={`tip-${i}-${String(tip).slice(0, 40)}`} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-500/5 text-[12.5px]">
                      <CheckCircle2 size={13} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 3. Action Plan */}
              <section data-testid="da-section-plan">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center text-white font-black text-[11px]">3</div>
                  <h3 className="text-[13px] font-black flex items-center gap-1.5"><Target size={13} /> {de ? 'Konkreter Aktionsplan' : 'Action Plan'}</h3>
                </div>
                <div className="space-y-2">
                  {(result.action_plan || []).map((step, i) => (
                    <div key={`step-${step.step || i + 1}-${String(step.action || '').slice(0, 30)}`} className="flex gap-2.5 p-3 rounded-xl bg-white dark:bg-card border border-black/[0.04] dark:border-white/[0.06]">
                      <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-black text-[10px] shrink-0">{step.step || i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-bold">{step.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-0 text-[9px] font-bold"><Clock size={8} className="mr-0.5" />{step.deadline}</Badge>
                          {step.why && <span className="text-[10px] text-muted-foreground">{step.why}</span>}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground/30 self-center" />
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={reset} className="flex-1" data-testid="da-reset-btn">
                  {de ? 'Neu starten' : 'New query'}
                </Button>
                <Button onClick={onClose} className="flex-1 bg-[#0A0A0A] text-white hover:bg-[#1A1A2E]" data-testid="da-done-btn">
                  {de ? 'Fertig' : 'Done'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeepAssistModal;
