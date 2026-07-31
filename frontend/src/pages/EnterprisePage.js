import { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../lib/api';
import logger from '../lib/logger';
import { toast } from 'sonner';
import {
  Building, Users, ArrowRight, Check, Loader2,
  CheckCircle2, TrendingUp, Sparkles, Award, Phone,
  Brain, Target, Zap, Shield, Star, Play
} from 'lucide-react';

export default function EnterprisePage() {
  const { lang } = useLanguage();
  const de = lang === 'de';
  const [step, setStep] = useState('explore'); // explore | form | thanks
  const [form, setForm] = useState({ company: '', name: '', email: '', teamSize: '', message: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.email || !form.company) return;
    setLoading(true);
    try {
      await api.post('/enterprise/submit', { ...form, lang });
      setStep('thanks');
      toast.success(de ? 'Anfrage gesendet!' : 'Request sent!');
    } catch (err) { logger.error(err); toast.error('Error'); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto" data-testid="enterprise-page">

        {step === 'thanks' ? (
          <div className="p-10 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#BFFF00]/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-[#BFFF00]" />
            </div>
            <h2 className="text-2xl font-black">{de ? 'Vielen Dank!' : 'Thank you!'}</h2>
            <p className="text-muted-foreground mt-2">{de ? 'Unser Enterprise-Team meldet sich innerhalb von 24 Stunden.' : 'Our enterprise team will contact you within 24 hours.'}</p>
          </div>
        ) : step === 'form' ? (
          <div className="p-6 lg:p-10 animate-fade-in">
            <button onClick={() => setStep('explore')} className="text-sm text-muted-foreground hover:text-foreground mb-6">&larr; {de ? 'Zurück' : 'Back'}</button>
            <h2 className="text-2xl font-black mb-1">{de ? 'Enterprise-Anfrage' : 'Enterprise Request'}</h2>
            <p className="text-sm text-muted-foreground mb-6">{de ? 'Wir erstellen ein maßgeschneidertes Angebot für Ihr Team.' : 'We create a custom proposal for your team.'}</p>
            <div className="space-y-4 max-w-lg">
              <div><label className="text-sm font-semibold block mb-1">{de ? 'Unternehmen' : 'Company'}</label><Input value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Firma GmbH" className="h-11" data-testid="enterprise-company" /></div>
              <div><label className="text-sm font-semibold block mb-1">{de ? 'Ihr Name' : 'Your Name'}</label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Max Mustermann" className="h-11" data-testid="enterprise-name" /></div>
              <div><label className="text-sm font-semibold block mb-1">E-Mail</label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="max@firma.de" className="h-11" data-testid="enterprise-email" /></div>
              <div><label className="text-sm font-semibold block mb-1">{de ? 'Team-Größe' : 'Team Size'}</label><Input value={form.teamSize} onChange={e => setForm({...form, teamSize: e.target.value})} placeholder={de ? 'z.B. 50 Mitarbeiter' : 'e.g. 50 employees'} className="h-11" data-testid="enterprise-team-size" /></div>
              <div><label className="text-sm font-semibold block mb-1">{de ? 'Nachricht (optional)' : 'Message (optional)'}</label><textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder={de ? 'Was sind Ihre Ziele?' : 'What are your goals?'} className="w-full h-24 rounded-xl border border-black/[0.08] p-3 text-sm bg-gray-50 resize-none" data-testid="enterprise-message" /></div>
              <Button onClick={submit} disabled={loading || !form.email || !form.company} className="w-full bg-[#0A0A0A] text-white font-bold h-12" data-testid="enterprise-submit-btn">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>{de ? 'Anfrage senden' : 'Send Request'} <ArrowRight size={16} className="ml-2" /></>}
              </Button>
            </div>
          </div>
        ) : (
          /* ═══ EXPLORE VIEW — Education + Trust + CTA ═══ */
          <div className="p-6 lg:p-10 space-y-8 animate-fade-in">

            {/* Hero */}
            <div className="bg-[#0A0A0A] text-white rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
              <div className="relative z-10">
                <Badge className="bg-[#BFFF00]/10 text-[#BFFF00] border-[#BFFF00]/20 text-[10px] font-bold mb-4">{de ? 'FÜR TEAMS & UNTERNEHMEN' : 'FOR TEAMS & ORGANIZATIONS'}</Badge>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
                  {de ? <><span>KI-Leadership für</span><br/><span className="text-[#BFFF00]">Ihr gesamtes Team</span></> : <><span>AI Leadership for</span><br/><span className="text-[#BFFF00]">your entire team</span></>}
                </h1>
                <p className="text-white/50 text-sm max-w-lg mb-6">
                  {de ? 'Befähigen Sie Ihre Führungskräfte, KI strategisch einzusetzen. Maßgeschneiderte Programme, Gruppen-Coaching und messbare Ergebnisse.' : 'Enable your leaders to use AI strategically. Custom programs, group coaching and measurable results.'}
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => setStep('form')} className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold h-11 px-6" data-testid="enterprise-start-btn">
                    {de ? 'Beratung anfordern' : 'Request Consultation'} <ArrowRight size={16} className="ml-2" />
                  </Button>
                  <Button variant="outline" className="border-white/15 text-white hover:bg-white/5 font-semibold h-11 px-5">
                    <Phone size={14} className="mr-2" /> {de ? 'Direkt anrufen' : 'Call directly'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, title: de ? '10+ Stunden/Woche gespart' : '10+ hours/week saved', desc: de ? 'Automatisiere repetitive Aufgaben und fokussiere auf das Wesentliche.' : 'Automate repetitive tasks and focus on what matters.' },
                { icon: Brain, title: de ? 'KI-gestützte Entscheidungen' : 'AI-enhanced decisions', desc: de ? 'Bessere Entscheidungen durch KI-gestützte Analyse und Frameworks.' : 'Better decisions through AI-powered analysis and frameworks.' },
                { icon: Shield, title: de ? 'Zukunftssichere Führung' : 'Future-ready leadership', desc: de ? 'Bleiben Sie vorn im Zeitalter der künstlichen Intelligenz.' : 'Stay ahead in the age of artificial intelligence.' },
              ].map(v => (
                <Card key={v.title} className="border-black/[0.04]">
                  <CardContent className="p-5">
                    <v.icon size={20} className="text-[#BFFF00] mb-3" />
                    <p className="text-sm font-bold">{v.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{v.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ── ROI Calculator (interactive) ── */}
            <Card className="bg-gradient-to-br from-[#BFFF00]/[0.04] to-transparent border-[#BFFF00]/20">
              <CardContent className="p-6">
                <Badge className="bg-[#BFFF00]/10 text-[#0A0A0A] dark:text-[#BFFF00] border-0 text-[10px] font-black mb-3">
                  <Zap size={10} className="mr-1" /> {de ? 'ROI-RECHNER' : 'ROI CALCULATOR'}
                </Badge>
                <h3 className="text-lg font-black mb-3">{de ? 'Was Ihr Team gewinnt' : 'What your team gains'}</h3>
                <EnterpriseROICalculator de={de} />
              </CardContent>
            </Card>

            {/* What's Included */}
            <div>
              <h2 className="text-xl font-black mb-4">{de ? 'Enterprise-Programm' : 'Enterprise Program'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(de ? [
                  { icon: Brain, t: 'KI-Enablement Programm', d: 'Individuelle Lernpfade für jedes Teammitglied' },
                  { icon: Users, t: 'Gruppen-Coaching Sessions', d: 'Monatliche Live-Sessions mit Leadership-Experten' },
                  { icon: Target, t: 'Team Produktivitäts-System', d: 'Workflows und Automationen für Ihr Team' },
                  { icon: Sparkles, t: 'Executive KI-Strategie', d: 'C-Level Beratung zur KI-Transformation' },
                ] : [
                  { icon: Brain, t: 'AI Enablement Program', d: 'Custom learning paths for every team member' },
                  { icon: Users, t: 'Group Coaching Sessions', d: 'Monthly live sessions with leadership experts' },
                  { icon: Target, t: 'Team Productivity System', d: 'Workflows and automations for your team' },
                  { icon: Sparkles, t: 'Executive AI Strategy', d: 'C-level consulting on AI transformation' },
                ]).map(item => (
                  <div key={item.t} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-muted/30 border border-black/[0.03]">
                    <div className="w-9 h-9 rounded-lg bg-[#BFFF00]/10 flex items-center justify-center shrink-0">
                      <item.icon size={16} className="text-[#BFFF00]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.t}</p>
                      <p className="text-[11px] text-muted-foreground">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            <Card className="bg-gray-50 dark:bg-muted/20 border-black/[0.04]">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-1 mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-amber-500 fill-amber-500" />)}
                </div>
                <blockquote className="text-sm font-medium italic text-muted-foreground max-w-lg mx-auto">
                  {de ? '"WladBot hat die Art und Weise verändert, wie unser Leadership-Team Entscheidungen trifft. Die KI-Workflows sparen uns 15+ Stunden pro Woche."' : '"WladBot has changed how our leadership team makes decisions. The AI workflows save us 15+ hours per week."'}
                </blockquote>
                <p className="text-xs font-bold mt-3">{de ? 'CEO, Tech-Startup (200 MA)' : 'CEO, Tech Startup (200 employees)'}</p>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-[#0A0A0A] text-white border-0">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-black mb-2">{de ? 'Bereit, Ihr Team zu transformieren?' : 'Ready to transform your team?'}</h3>
                <p className="text-sm text-white/50 mb-4">{de ? 'Wir erstellen ein individuelles Angebot für Ihr Unternehmen.' : 'We create a custom proposal for your company.'}</p>
                <Button onClick={() => setStep('form')} className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold h-12 px-8" data-testid="enterprise-bottom-cta">
                  {de ? 'B2B Beratung anfordern' : 'Request B2B Consultation'} <ArrowRight size={16} className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ── ROI Calculator — simple slider-based revenue projection ────────────────
const EnterpriseROICalculator = ({ de }) => {
  const [teamSize, setTeamSize] = useState(25);
  const [salary, setSalary] = useState(85000); // avg leader annual salary EUR
  // Assumption: 10h/week saved x 47 weeks x (hourly rate)
  const hourlyRate = salary / (47 * 40);
  const hoursSavedYear = teamSize * 10 * 47;
  const valueSaved = Math.round(hoursSavedYear * hourlyRate);
  // Volume-discount applied to 997 base price (matches /api/payments/enterprise/quote logic)
  const discountTier = teamSize >= 200 ? 0.5 : teamSize >= 100 ? 0.4 : teamSize >= 50 ? 0.3
    : teamSize >= 20 ? 0.2 : teamSize >= 10 ? 0.15 : teamSize >= 5 ? 0.1 : 0;
  const investmentPerSeat = Math.round(997 * (1 - discountTier));
  const investmentAssumed = teamSize * investmentPerSeat;
  const roiPct = Math.round(((valueSaved - investmentAssumed) / investmentAssumed) * 100);

  return (
    <div className="space-y-4" data-testid="roi-calculator">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {de ? 'Team-Größe' : 'Team size'}: <span className="text-[#BFFF00] font-black">{teamSize}</span>
          </label>
          <input type="range" min="5" max="100" value={teamSize} onChange={e => setTeamSize(parseInt(e.target.value, 10))}
            className="w-full accent-[#BFFF00] mt-2" data-testid="roi-team-slider" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {de ? 'Ø Gehalt/Jahr' : 'Avg salary/year'}: <span className="text-[#BFFF00] font-black">€{salary.toLocaleString('de-DE')}</span>
          </label>
          <input type="range" min="50000" max="200000" step="5000" value={salary} onChange={e => setSalary(parseInt(e.target.value, 10))}
            className="w-full accent-[#BFFF00] mt-2" data-testid="roi-salary-slider" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-white dark:bg-card/70 border border-black/[0.04] dark:border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{de ? 'Zeitersparnis/Jahr' : 'Time saved/year'}</p>
          <p className="text-lg font-black mt-1 tabular-nums">{hoursSavedYear.toLocaleString('de-DE')}h</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-card/70 border border-black/[0.04] dark:border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{de ? 'Wertschöpfung' : 'Value created'}</p>
          <p className="text-lg font-black mt-1 tabular-nums text-[#BFFF00]">€{valueSaved.toLocaleString('de-DE')}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-[#0A0A0A] text-white">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{de ? 'ROI' : 'ROI'}</p>
          <p className="text-lg font-black mt-1 tabular-nums text-[#BFFF00]">{roiPct > 0 ? '+' : ''}{roiPct}%</p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/80 italic">
        {de
          ? `Basiert auf Ø 10h/Woche Zeitersparnis durch KI-Workflows und 47 Arbeitswochen/Jahr. Investment: €${investmentPerSeat.toLocaleString('de-DE')}/Seat (Enterprise-Volume-Discount ${Math.round(discountTier * 100)}%).`
          : `Based on avg 10h/week saved through AI workflows and 47 work weeks/year. Investment: €${investmentPerSeat.toLocaleString('de-DE')}/seat (Enterprise volume discount ${Math.round(discountTier * 100)}%).`}
      </p>
    </div>
  );
};
