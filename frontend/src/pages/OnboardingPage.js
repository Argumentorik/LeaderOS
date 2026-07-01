import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { WladMark } from '../components/brand/WladMark';
import { useBookConsultation } from '../components/brand/BookConsultationButton';
import api from '../lib/api';
import {
  ArrowRight, Sparkles, Users, Target, Brain,
  MessageSquareText, Zap, Shield, ChevronRight,
  ExternalLink, CheckCircle2, Crown, Briefcase,
  GraduationCap, Building, TrendingUp, Calendar, Phone, Clock,
  Youtube, Instagram, Linkedin, Search, Mic, MessageCircle, Newspaper, HelpCircle
} from 'lucide-react';

const STEPS = ['welcome', 'profile', 'role', 'goal', 'heard', 'wladhub', 'call', 'done'];

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ role: '', team_size: '', primary_goal: '', experience_level: '', has_wladhub_diagnosis: false, heard_from: '' });
  const [profileData, setProfileData] = useState({ position: '', company: '', industry: '' });
  const [loading, setLoading] = useState(false);
  const [wladhubScores, setWladhubScores] = useState({ ki_kompetenz: '', boardroom_rhetorik: '', strategisches_eq: '' });
  const de = lang === 'de';
  const openBooking = useBookConsultation();

  const roles = [
    { id: 'team-lead', icon: Users, label: de ? 'Team Lead' : 'Team Lead', desc: de ? '3-10 Mitarbeiter' : '3-10 reports' },
    { id: 'manager', icon: Briefcase, label: 'Manager', desc: de ? '10-30 Mitarbeiter' : '10-30 reports' },
    { id: 'director', icon: Building, label: de ? 'Director / VP' : 'Director / VP', desc: de ? 'Mehrere Teams' : 'Multiple teams' },
    { id: 'c-level', icon: Crown, label: 'C-Level / Executive', desc: de ? 'Gesamte Organisation' : 'Entire org' },
    { id: 'aspiring', icon: GraduationCap, label: de ? 'Angehende Führungskraft' : 'Aspiring Leader', desc: de ? 'Noch kein Team' : 'No team yet' },
  ];

  const goals = [
    { id: 'communication', icon: MessageSquareText, label: de ? 'Bessere Kommunikation' : 'Better Communication', desc: de ? 'Überzeugender praesentieren & argumentieren' : 'Present & argue more persuasively' },
    { id: 'conflicts', icon: Shield, label: de ? 'Konflikte lösen' : 'Resolve Conflicts', desc: de ? 'Schwierige Gespräche souveraen führen' : 'Handle tough conversations confidently' },
    { id: 'delegation', icon: Target, label: de ? 'Besser delegieren' : 'Better Delegation', desc: de ? 'Aufgaben abgeben & Team stärken' : 'Delegate tasks & empower team' },
    { id: 'strategy', icon: Brain, label: de ? 'Strategischer denken' : 'Think Strategically', desc: de ? 'Bessere Entscheidungen treffen' : 'Make better decisions' },
    { id: 'career', icon: TrendingUp, label: de ? 'Karriere beschleunigen' : 'Accelerate Career', desc: de ? 'Nächste Befoerderung vorbereiten' : 'Prepare next promotion' },
    { id: 'eq', icon: Sparkles, label: de ? 'EQ entwickeln' : 'Develop EQ', desc: de ? 'Emotionale Intelligenz stärken' : 'Strengthen emotional intelligence' },
  ];

  // Iter 92.45 (Mert · Riverside-style): marketing attribution channels.
  // Grid of ~12 sources — auto-advance on click, "Sonst" as free-text is
  // omitted for simplicity (we can add if attribution insight demands it).
  const heardSources = [
    { id: 'youtube',     icon: Youtube,       label: 'YouTube' },
    { id: 'instagram',   icon: Instagram,     label: 'Instagram' },
    { id: 'linkedin',    icon: Linkedin,      label: 'LinkedIn' },
    { id: 'google',      icon: Search,        label: 'Google' },
    { id: 'podcast',     icon: Mic,           label: 'Podcast' },
    { id: 'friend',      icon: MessageCircle, label: de ? 'Freund/Kollege' : 'Friend/Colleague' },
    { id: 'wlad_book',   icon: Newspaper,     label: de ? 'Wlads Buch' : 'Wlad\'s Book' },
    { id: 'leadercheck', icon: CheckCircle2,  label: 'leader-check.de' },
    { id: 'event',       icon: Calendar,      label: de ? 'Event/Konferenz' : 'Event/Conference' },
    { id: 'tiktok',      icon: Zap,           label: 'TikTok' },
    { id: 'chatgpt',     icon: Sparkles,      label: de ? 'ChatGPT / KI' : 'ChatGPT / AI' },
    { id: 'other',       icon: HelpCircle,    label: de ? 'Sonst wie' : 'Other' },
  ];

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  const finish = async () => {
    setLoading(true);
    try {
      // Save profile data (position, company, industry)
      if (profileData.position || profileData.company || profileData.industry) {
        await api.put('/auth/profile', profileData);
      }
      await api.post('/wladhub/onboarding', data);

      // Import WladHub scores if provided
      const ki = parseInt(wladhubScores.ki_kompetenz);
      const br = parseInt(wladhubScores.boardroom_rhetorik);
      const eq = parseInt(wladhubScores.strategisches_eq);
      if (ki > 0 || br > 0 || eq > 0) {
        await api.post('/wladhub/import', {
          ki_kompetenz: ki || 0, boardroom_rhetorik: br || 0,
          strategisches_eq: eq || 0, overall_score: Math.round((ki + br + eq) / 3),
          strengths: [], improvements: [], action_plan: [],
        });
      }

      // Refresh user data
      const res = await api.get('/auth/me');
      setUser(res.data);
      navigate('/dashboard');
    } catch (err) {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh p-4" data-testid="onboarding-page">
      <div className="w-full max-w-xl animate-fade-in">

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={`step-${i}`} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] w-10' : 'bg-gray-200 dark:bg-muted w-6'}`} />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center space-y-6 motion-fade-in-up">
            <div className="mx-auto inline-flex animate-pulse-glow rounded-3xl">
              <WladMark size={88} animated />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{de ? `Willkommen, ${user?.name?.split(' ')[0] || 'Leader'}!` : `Welcome, ${user?.name?.split(' ')[0] || 'Leader'}!`}</h1>
              <p className="text-base text-muted-foreground mt-2 max-w-md mx-auto">
                {de ? 'Lass uns dein persönliches Leadership-Profil einrichten. Das dauert nur 60 Sekunden.' : "Let's set up your personal leadership profile. Takes only 60 seconds."}
              </p>
            </div>
            <Button onClick={next} className="bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-bold px-8 h-12 shadow-lg shadow-[#BFFF00]/15" data-testid="onboarding-start-btn">
              {de ? "Los geht's" : "Let's Go"} <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {/* Step 1: Profile (Position, Company, Industry) */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-black">{de ? 'Erzähl uns mehr über dich' : 'Tell us more about you'}</h2>
              <p className="text-sm text-muted-foreground mt-1">{de ? 'Damit wir alles hyper-personalisieren können.' : 'So we can hyper-personalize everything.'}</p>
            </div>
            <div className="space-y-3 max-w-md mx-auto">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">{de ? 'Deine Position' : 'Your Position'} *</label>
                <input value={profileData.position} onChange={e => setProfileData(p => ({ ...p, position: e.target.value }))}
                  placeholder={de ? 'z.B. Head of Sales, CTO, VP Marketing...' : 'e.g. Head of Sales, CTO, VP Marketing...'}
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-card text-sm focus:ring-2 focus:ring-[#BFFF00]/20 focus:border-[#BFFF00] transition-all"
                  data-testid="onboarding-position" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">{de ? 'Unternehmen' : 'Company'}</label>
                <input value={profileData.company} onChange={e => setProfileData(p => ({ ...p, company: e.target.value }))}
                  placeholder={de ? 'z.B. BMW, SAP, Startup...' : 'e.g. BMW, SAP, Startup...'}
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-card text-sm focus:ring-2 focus:ring-[#BFFF00]/20 focus:border-[#BFFF00] transition-all"
                  data-testid="onboarding-company" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">{de ? 'Branche' : 'Industry'}</label>
                <input value={profileData.industry} onChange={e => setProfileData(p => ({ ...p, industry: e.target.value }))}
                  placeholder={de ? 'z.B. Tech, Finanzen, Gesundheit, Automobil...' : 'e.g. Tech, Finance, Health, Automotive...'}
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-card text-sm focus:ring-2 focus:ring-[#BFFF00]/20 focus:border-[#BFFF00] transition-all"
                  data-testid="onboarding-industry" />
              </div>
            </div>
            <div className="flex justify-center pt-2">
              <Button onClick={next} disabled={!profileData.position.trim()}
                className="bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-bold px-8 h-11 shadow-lg shadow-[#BFFF00]/15" data-testid="onboarding-profile-next">
                {de ? 'Weiter' : 'Continue'} <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Role */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-black">{de ? 'Was beschreibt dich am besten?' : 'What best describes you?'}</h2>
              <p className="text-sm text-muted-foreground mt-1">{de ? 'Damit dein KI-Coach optimal auf dich eingestellt wird.' : 'So your AI coach is optimally calibrated for you.'}</p>
            </div>
            <div className="space-y-2">
              {roles.map((role) => (
                <button key={role.id} onClick={() => { setData(d => ({ ...d, role: role.id })); next(); }}
                  className={`flex items-center gap-4 w-full p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 text-left ${data.role === role.id ? 'border-[#BFFF00] bg-[#BFFF00]/[0.06] dark:bg-[#BFFF00]/10' : 'border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-card/80'}`}
                  data-testid={`role-${role.id}`}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shrink-0 shadow-sm">
                    <role.icon size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{role.label}</p>
                    <p className="text-xs text-muted-foreground">{role.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Goal */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-black">{de ? 'Was ist dein wichtigstes Ziel?' : "What's your most important goal?"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{de ? 'Wir personalisieren deine Erfahrung basierend darauf.' : "We'll personalize your experience based on this."}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map((goal) => (
                <button key={goal.id} onClick={() => { setData(d => ({ ...d, primary_goal: goal.id })); next(); }}
                  className={`flex flex-col items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 text-left ${data.primary_goal === goal.id ? 'border-[#BFFF00] bg-[#BFFF00]/[0.06] dark:bg-[#BFFF00]/10' : 'border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-card/80'}`}
                  data-testid={`goal-${goal.id}`}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shadow-sm">
                    <goal.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{goal.label}</p>
                    <p className="text-xs text-muted-foreground">{goal.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: How did you hear about us? — Iter 92.45 (Riverside-style attribution) */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-black">{de ? 'Wie hast du von uns gehört?' : 'How did you hear about us?'}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {de ? 'Hilft uns, mehr Menschen wie dich zu erreichen.' : 'Helps us reach more people like you.'}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {heardSources.map((src) => (
                <button
                  key={src.id}
                  onClick={() => { setData((d) => ({ ...d, heard_from: src.id })); next(); }}
                  data-testid={`heard-${src.id}`}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-[#BFFF00]/40 ${
                    data.heard_from === src.id
                      ? 'border-[#BFFF00] bg-[#BFFF00]/[0.08]'
                      : 'border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-card/60'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shadow-sm">
                    <src.icon size={16} className="text-[#0A0A0A]" strokeWidth={2.5} />
                  </div>
                  <p className="text-[11px] font-bold text-center leading-tight">{src.label}</p>
                </button>
              ))}
            </div>
            <div className="text-center pt-2">
              <button
                onClick={next}
                className="text-xs text-muted-foreground hover:text-[#4A6200] dark:hover:text-[#BFFF00] font-semibold transition-colors"
                data-testid="heard-skip"
              >
                {de ? 'Überspringen →' : 'Skip →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: WladHub */}
        {step === 5 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-black">{de ? 'Hast du die WladHub-Diagnose gemacht?' : 'Have you done the WladHub Diagnosis?'}</h2>
              <p className="text-sm text-muted-foreground mt-1">{de ? 'Deine Diagnose-Ergebnisse fließen direkt in deinen KI-Coach ein.' : 'Your diagnosis results flow directly into your AI coach.'}</p>
            </div>

            <Card className="border-amber-200/50 dark:border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-500/5 dark:to-orange-500/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">WladHub Leadership-Diagnose</p>
                    <p className="text-xs text-muted-foreground">{de ? '10 Minuten, sofortiger Report' : '10 minutes, instant report'}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{de ? 'Deine Scores eingeben (optional)' : 'Enter your scores (optional)'}</p>
                  {[
                    { key: 'ki_kompetenz', label: 'KI-Kompetenz', color: 'border-[#BFFF00]/30 focus:ring-[#BFFF00]' },
                    { key: 'boardroom_rhetorik', label: 'Boardroom-Rhetorik', color: 'border-rose-300 focus:ring-rose-500' },
                    { key: 'strategisches_eq', label: 'Strategisches EQ', color: 'border-emerald-300 focus:ring-emerald-500' },
                  ].map((field) => (
                    <div key={field.key} className="flex items-center gap-3">
                      <label className="text-xs font-medium w-36 shrink-0">{field.label}</label>
                      <input type="number" min="0" max="100" placeholder="0-100"
                        value={wladhubScores[field.key]}
                        onChange={(e) => setWladhubScores(s => ({ ...s, [field.key]: e.target.value }))}
                        className={`flex-1 h-9 px-3 text-sm rounded-lg border bg-white dark:bg-muted ${field.color} focus:outline-none focus:ring-2`}
                        data-testid={`wladhub-score-${field.key}`}
                      />
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full text-xs font-bold border-amber-300 hover:bg-amber-50 dark:border-amber-500/30 dark:hover:bg-amber-500/5"
                  onClick={() => window.open('https://leader-check.de', '_blank', 'noopener,noreferrer')} data-testid="wladhub-onboarding-link">
                  <ExternalLink size={12} className="mr-1.5" /> {de ? 'Noch keine Diagnose? Jetzt auf WladHub machen' : "No diagnosis yet? Do it on WladHub"}
                </Button>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={next} className="flex-1 font-semibold" data-testid="skip-wladhub-btn">
                {de ? 'Überspringen' : 'Skip'}
              </Button>
              <Button onClick={() => { setData(d => ({ ...d, has_wladhub_diagnosis: true })); next(); }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/20"
                data-testid="save-wladhub-btn">
                {de ? 'Speichern & weiter' : 'Save & Continue'} <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Strategy Call CTA — Cal.com (Iter 92.10: no "Free" wording, premium positioning) */}
        {step === 6 && (
          <div className="space-y-5 animate-fade-in" data-testid="onboarding-call-step">
            <div className="text-center">
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase tracking-wider px-3 py-1 mb-3">
                {de ? '15 Min · Unverbindlich · 1:1' : '15 min · No strings · 1:1'}
              </Badge>
              <h2 className="text-2xl font-black tracking-tight">{de ? 'Sicher den schnellsten Weg.' : 'Lock in the fastest path.'}</h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                {de
                  ? 'Bevor du loslegst — sichere dir einen Termin mit unserem Argumentorik-Berater. 15 Min, in denen du klar bekommst: wo stehst du, wo blockierst du, was sind deine nächsten 30 Tage.'
                  : 'Before you dive in — book a slot with our Argumentorik consultant. 15 min to find out where you stand, where you block yourself, what your next 30 days should be.'}
              </p>
            </div>

            <Card className="overflow-hidden border-emerald-200/40 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/40 to-[#BFFF00]/[0.04] dark:from-emerald-500/[0.04] dark:to-[#BFFF00]/[0.03]">
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-[#BFFF00] flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                    <Phone size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{de ? 'Strategiegespräch' : 'Strategy Call'}</p>
                    <p className="text-xs text-muted-foreground">{de ? 'Mit Wlads Head Coach · 1:1' : "With Wlad's Head Coach · 1:1"}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {de ? 'Slots offen' : 'slots open'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { icon: Clock, label: de ? '15 Min' : '15 min' },
                    { icon: Sparkles, label: de ? '1:1 Strategie' : '1:1 strategy' },
                    { icon: Shield, label: de ? 'Unverbindlich' : 'No pressure' },
                  ].map((b) => (
                    <div key={b.label} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/60 dark:bg-card/40">
                      <b.icon size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] font-bold text-foreground/80">{b.label}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={openBooking}
                  className="w-full glow-lime btn-shine bg-gradient-to-r from-emerald-500 to-[#9ACC00] text-[#0A0A0A] font-bold h-11 shadow-lg shadow-emerald-500/20"
                  data-testid="onboarding-book-call-btn"
                >
                  <Calendar size={14} className="mr-1.5" />
                  {de ? 'Termin auswählen' : 'Pick a slot'}
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={next}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                data-testid="onboarding-skip-call-btn"
              >
                {de ? 'Überspringen — ich starte direkt' : 'Skip — I want to start now'} →
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Done */}
        {step === 7 && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30">
              <CheckCircle2 size={36} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black">{de ? 'Alles eingerichtet!' : 'All set!'}</h2>
              <p className="text-base text-muted-foreground mt-2 max-w-md mx-auto">
                {de ? 'Dein persönlicher KI-Coach ist jetzt auf dich kalibriert. Starte mit deinem ersten Daily Check-in oder erkunde das Dashboard.' : 'Your personal AI coach is now calibrated for you. Start with your first daily check-in or explore the dashboard.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button onClick={finish} disabled={loading}
                className="bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-bold h-12 shadow-lg shadow-[#BFFF00]/15"
                data-testid="finish-onboarding-btn">
                {loading ? (de ? 'Wird eingerichtet...' : 'Setting up...') : (de ? 'Zum Dashboard' : 'Go to Dashboard')} <ArrowRight size={16} className="ml-2" />
              </Button>
              <Badge className="mx-auto bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-500/20 text-xs font-bold px-3 py-1">
                +5 XP {de ? 'verdient' : 'earned'}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
