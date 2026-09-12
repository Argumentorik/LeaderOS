import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Play, Target } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { takeSlice } from '../../lib/dashboardBootstrap';
import { WLAD_AVATAR } from '../../lib/brand';

const FOCUS_EN = { 'Boardroom-Rhetorik': 'Boardroom rhetoric', 'Strategisches EQ': 'Strategic EQ', 'KI-Kompetenz': 'AI competence' };

/** Deine ersten 7 Schritte: Fokus aus Leader-Check/Onboarding, ein Schritt pro Tag. Fällt auf `fallback` zurück, wenn alles erledigt ist. */
export const JourneyCard = ({ de = true, fallback }) => {
  const navigate = useNavigate();
  const [journey, setJourney] = useState(() => takeSlice('journey') ?? undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (journey !== undefined) return;
    api.get('/journey').then((r) => setJourney(r.data)).catch((e) => { logger.warn('journey load', e); setJourney(null); });
  }, [journey]);

  const step = journey?.today;
  if (!step) return fallback ?? null;

  const markDone = async () => {
    setSaving(true);
    try { const r = await api.post(`/journey/complete/${step.day}`); setJourney(r.data); } catch (e) { logger.warn('journey complete', e); } finally { setSaving(false); }
  };
  const focusLabel = de ? journey.focus_label : (FOCUS_EN[journey.focus_label] || journey.focus_label);

  return (
    <Card className="bg-[#0A0A0A] text-white border-0 mb-6 overflow-hidden" data-testid="journey-card" data-anim="dash-cta">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <img src={WLAD_AVATAR} alt="Wlad" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-white/10 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#BFFF00]/80">{de ? `Schritt ${step.day} von 7` : `Step ${step.day} of 7`}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#BFFF00]/10 text-[#BFFF00]" data-testid="journey-focus">
                  <Target size={10} /> {de ? 'Fokus' : 'Focus'}: {focusLabel}
                </span>
              </div>
              <h3 className="text-lg font-black mt-1" data-testid="journey-step-title">{step.title}</h3>
              <p className="text-sm text-white/60 mt-0.5 leading-relaxed" data-testid="journey-step-task">{step.task}</p>
              <p className="text-[11.5px] text-white/35 mt-2" data-testid="journey-reason">{journey.reason}{journey.role_hint ? ` ${journey.role_hint}` : ''}</p>
              <div className="flex items-center gap-1.5 mt-3" aria-label={de ? 'Fortschritt der ersten Woche' : 'First week progress'} data-testid="journey-progress">
                {journey.week.map((s) => (
                  <span key={s.day} className={`h-1.5 rounded-full transition-all ${s.done ? 'w-6 bg-[#BFFF00]' : s.today ? 'w-6 bg-white/60' : 'w-3 bg-white/15'}`} title={`${de ? 'Schritt' : 'Step'} ${s.day}: ${s.title}`} />
                ))}
                <span className="text-[10px] text-white/35 ml-1">{step.minutes} Min</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
            <Button onClick={() => navigate(step.path)} className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold h-11 px-5 w-full sm:w-auto shadow-lg shadow-[#BFFF00]/20" data-testid="journey-step-btn">
              <Play size={14} className="mr-1.5" /> {step.cta}
            </Button>
            <Button variant="ghost" onClick={markDone} disabled={saving} className="h-9 text-[12px] text-white/60 hover:text-white hover:bg-white/[0.06]" data-testid="journey-step-done">
              <Check size={13} className="mr-1" /> {de ? 'Als erledigt markieren' : 'Mark as done'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
