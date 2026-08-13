import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { WladBotAvatar } from '../components/brand/WladBotAvatar';
import { WLAD_AVATAR, WLAD_WELCOME_VIDEO } from '../lib/brand';
import { WladGuide } from '../components/onboarding/WladGuide';
import { useBookConsultation } from '../components/brand/BookConsultationButton';
import api from '../lib/api';
import { LEADERCHECK_URL } from '../lib/domains';
import {
  ArrowRight, Sparkles, Users, Target, Brain,
  MessageSquareText, Zap, Shield, ChevronRight,
  ExternalLink, CheckCircle2, Crown, Briefcase,
  GraduationCap, Building, TrendingUp, Calendar, Phone, Clock,
  Youtube, Instagram, Linkedin, Search, Mic, MessageCircle, Newspaper, HelpCircle,
  Video, Smartphone, Lock, BookOpen, Flame, Play
} from 'lucide-react';

const STEPS = ['welcome', 'features', 'profile', 'role', 'goal', 'heard', 'wladhub', 'call', 'done'];

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ role: '', team_size: '', primary_goal: '', experience_level: '', has_wladhub_diagnosis: false, heard_from: '' });
  const [profileData, setProfileData] = useState({ position: '', company: '', industry: '' });
  const [loading, setLoading] = useState(false);
  const [wladhubScores, setWladhubScores] = useState({ ki_kompetenz: '', boardroom_rhetorik: '', strategisches_eq: '' });
  const [videoStarted, setVideoStarted] = useState(false);
  const videoRef = useRef(null);
  const de = lang === 'de';
  const openBooking = useBookConsultation();
  const firstName = user?.name?.split(' ')[0] || (de ? 'Leader' : 'Leader');

  const roles = [
    { id: 'team-lead', icon: Users, label: de ? 'Team Lead' : 'Team Lead', desc: de ? '3-10 Mitarbeiter' : '3-10 reports' },
    { id: 'manager', icon: Briefcase, label: 'Manager', desc: de ? '10-30 Mitarbeiter' : '10-30 reports' },
    { id: 'director', icon: Building, label: de ? 'Director / VP' : 'Director / VP', desc: de ? 'Mehrere Teams' : 'Multiple teams' },
    { id: 'c-level', icon: Crown, label: 'C-Level / Executive', desc: de ? 'Gesamte Organisation' : 'Entire org' },
    { id: 'aspiring', icon: GraduationCap, label: de ? 'Angehende Führungskraft' : 'Aspiring Leader', desc: de ? 'Noch kein Team' : 'No team yet' },
  ];

  const goals = [
    { id: 'communication', icon: MessageSquareText, label: de ? 'Bessere Kommunikation' : 'Better Communication', desc: de ? 'Überzeugender präsentieren & argumentieren' : 'Present & argue more persuasively' },
    { id: 'conflicts', icon: Shield, label: de ? 'Konflikte lösen' : 'Resolve Conflicts', desc: de ? 'Schwierige Gespräche souverän führen' : 'Handle tough conversations confidently' },
    { id: 'delegation', icon: Target, label: de ? 'Besser delegieren' : 'Better Delegation', desc: de ? 'Aufgaben abgeben & Team stärken' : 'Delegate tasks & empower team' },
    { id: 'strategy', icon: Brain, label: de ? 'Strategischer denken' : 'Think Strategically', desc: de ? 'Bessere Entscheidungen treffen' : 'Make better decisions' },
    { id: 'career', icon: TrendingUp, label: de ? 'Karriere beschleunigen' : 'Accelerate Career', desc: de ? 'Nächste Beförderung vorbereiten' : 'Prepare next promotion' },
    { id: 'eq', icon: Sparkles, label: de ? 'EQ entwickeln' : 'Develop EQ', desc: de ? 'Emotionale Intelligenz stärken' : 'Strengthen emotional intelligence' },
  ];

  const heardSources = [
    { id: 'youtube',     icon: Youtube,       label: 'YouTube' },
    { id: 'instagram',   icon: Instagram,     label: 'Instagram' },
    { id: 'linkedin',    icon: Linkedin,      label: 'LinkedIn' },
    { id: 'google',      icon: Search,        label: 'Google' },
    { id: 'podcast',     icon: Mic,           label: 'Podcast' },
    { id: 'friend',      icon: MessageCircle, label: de ? 'Freund/Kollege' : 'Friend/Colleague' },
    { id: 'wlad_book',   icon: Newspaper,     label: de ? 'Wlads Buch' : 'Wlad\'s Book' },
    { id: 'leadercheck', icon: CheckCircle2,  label: 'leadercheck.de' },
    { id: 'event',       icon: Calendar,      label: de ? 'Event/Konferenz' : 'Event/Conference' },
    { id: 'tiktok',      icon: Zap,           label: 'TikTok' },
    { id: 'chatgpt',     icon: Sparkles,      label: de ? 'ChatGPT / KI' : 'ChatGPT / AI' },
    { id: 'other',       icon: HelpCircle,    label: de ? 'Sonst wie' : 'Other' },
  ];

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  // ── WladBot speaks — reacts to previous answers (Fabulous-style guide) ──
  const roleLabel = roles.find(r => r.id === data.role)?.label;
  const goalLabel = goals.find(g => g.id === data.primary_goal)?.label;
  const guideMessages = de ? {
    2: `${firstName}, damit ich dich richtig coache, brauche ich Kontext. Wer bist du im Business?`,
    3: 'Verstanden. Und welche Rolle beschreibt dich am besten? Danach kalibriere ich mein Coaching.',
    4: roleLabel
      ? `${roleLabel}. Ich kenne deine Baustellen. Woran arbeiten wir zuerst?`
      : 'Woran arbeiten wir zuerst? Ein Fokus schlägt zehn Vorsätze.',
    5: 'Kurz aus Neugier: wie hast du von uns gehört? Das hilft uns, mehr Leader wie dich zu finden.',
    6: 'Hast du schon eine Leader-Diagnose gemacht? Deine Scores machen mein Coaching von Tag 1 an präziser.',
    7: 'Mein Tipp: 15 Minuten mit einem echten Coach, danach kennst du deinen schnellsten Weg. Kein Muss.',
  } : {
    2: `${firstName}, to coach you properly I need context. Who are you in business?`,
    3: 'Got it. Which role describes you best? I calibrate my coaching to it.',
    4: roleLabel
      ? `${roleLabel}. I know your pain points. What do we tackle first?`
      : 'What do we tackle first? One focus beats ten resolutions.',
    5: 'Quick curiosity: how did you hear about us? It helps us find more leaders like you.',
    6: 'Done a leader diagnosis yet? Your scores make my coaching sharper from day one.',
    7: 'My tip: 15 minutes with a real coach, then you know your fastest path. No pressure.',
  };

  const finish = async () => {
    setLoading(true);
    try {
      if (profileData.position || profileData.company || profileData.industry) {
        await api.put('/auth/profile', profileData);
      }
      await api.post('/wladhub/onboarding', data);

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

      const res = await api.get('/auth/me');
      setUser(res.data);
      navigate('/dashboard');
    } catch (err) {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const progressPct = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh p-4 relative overflow-hidden" data-testid="onboarding-page">
      {/* Cinematic aurora depth */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 h-[30rem] w-[30rem] rounded-full bg-[#BFFF00]/[0.06] blur-[130px]" />
        <div className="absolute -bottom-24 -left-24 h-[26rem] w-[26rem] rounded-full bg-emerald-500/[0.05] blur-[120px]" />
      </div>

      <div className="w-full max-w-xl animate-fade-in relative z-10">

        {/* Progress — bar + step counter + % */}
        <div className="mb-8" data-testid="onboarding-progress">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground/60">
              {de ? `Schritt ${step + 1} von ${STEPS.length}` : `Step ${step + 1} of ${STEPS.length}`}
            </span>
            <span className="text-[10px] font-black text-[#4A6200] dark:text-[#BFFF00] tabular-nums">{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] shadow-[0_0_10px_rgba(191,255,0,0.5)] transition-all duration-700 ease-out"
              style={{ width: `${Math.max(progressPct, 4)}%` }}
            />
          </div>
        </div>

        {/* WladBot guides every step (2-7) */}
        {step >= 2 && step <= 7 && (
          <div className="mb-6">
            <WladGuide message={guideMessages[step]} />
          </div>
        )}

        {/* Step 0: Welcome — Wlad greets the user personally.
            Iter 131.3: replaced the AI-slop Pixar avatar with a premium
            frame around Wlad Jachtchenko's real headshot — lime aura,
            emerald "online" dot, no cartoon vibes. */}
        {step === 0 && (
          <div className="text-center space-y-6 motion-fade-in-up">
            <div className="mx-auto inline-flex relative" data-testid="onboarding-wlad-portrait">
              <div className="absolute inset-0 rounded-full bg-[#BFFF00] blur-xl opacity-30 scale-110" aria-hidden />
              <div className="relative w-28 h-28 rounded-full p-[3px] bg-gradient-to-br from-[#BFFF00] via-[#9ACC00] to-[#6B8A00] shadow-[0_20px_60px_-15px_rgba(191,255,0,0.55)]">
                <img
                  src={WLAD_AVATAR}
                  alt="Wlad Jachtchenko"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-background animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[0.22em] uppercase text-[#6B8A00] dark:text-[#BFFF00] mb-1">
                WladBot · trainiert auf Wlad Jachtchenkos Material
              </p>              <h1 className="text-3xl font-black tracking-tight">
                {de ? `Hi ${firstName}, schön, dass du da bist.` : `Hi ${firstName}, glad you're here.`}
              </h1>
              <p className="text-base text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
                {de
                  ? 'Ich arbeite mit Wlad Jachtchenkos Material: seine Bücher, Kurse und Coachings. Damit ich dir konkret helfen kann, brauche ich ein paar kurze Angaben von dir.'
                  : "I work from Wlad Jachtchenko's material: his books, courses and coaching sessions. To help you concretely, I need a few short answers from you."}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {de ? 'Online · antwortet in Sekunden' : 'Online · replies in seconds'}
              </div>
            </div>
            <div className="max-w-xl mx-auto" data-testid="onboarding-welcome-video">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-black/[0.08] dark:border-white/[0.1] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]">
                <video
                  ref={videoRef}
                  src={WLAD_WELCOME_VIDEO}
                  className="w-full h-full object-contain bg-black"
                  controls={videoStarted}
                  playsInline
                  preload="metadata"
                  onPlay={() => setVideoStarted(true)}
                />
                {!videoStarted && (
                  <button
                    type="button"
                    onClick={() => { videoRef.current?.play(); setVideoStarted(true); }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/55 group"
                    data-testid="onboarding-video-play"
                  >
                    <span className="w-14 h-14 rounded-full bg-[#BFFF00] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                      <Play size={20} className="text-[#0A0A0A] ml-0.5" fill="#0A0A0A" />
                    </span>
                    <span className="text-[11px] font-bold text-white/90 tracking-wide">
                      {de ? 'Wlad erklärt dir Leader-OS in 2 Minuten' : 'Wlad explains Leader-OS in 2 minutes'}
                    </span>
                  </button>
                )}
              </div>
            </div>
            <Button onClick={next} className="glow-lime btn-shine bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-bold px-8 h-12 shadow-lg shadow-[#BFFF00]/15" data-testid="onboarding-start-btn">
              {de ? "Los geht's" : "Let's Go"} <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {/* Step 1: GODMODE Showcase — why this is not a normal chatbot */}
        {step === 1 && (
          <div className="animate-fade-in" data-testid="onboarding-features-step">
            <div className="relative rounded-3xl overflow-hidden bg-[#0A0A0A] border border-white/[0.08] shadow-[0_50px_140px_-30px_rgba(191,255,0,0.25)] p-5 sm:p-7">
              {/* Aurora glow layers */}
              <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#BFFF00]/15 blur-3xl" aria-hidden />
              <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />

              <div className="relative">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#BFFF00] font-black mb-2 animate-fade-in">
                  {de ? 'Das ist kein gewöhnlicher ChatBot' : 'This is not an ordinary chatbot'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-[1.08] animate-fade-in" style={{ letterSpacing: '-0.03em' }}>
                  {de ? 'Wlad. Immer an deiner Seite.' : 'Wlad. Always by your side.'}
                </h2>
                <p className="text-[13px] text-white/55 mt-2 max-w-md animate-fade-in" style={{ animationDelay: '100ms' }}>
                  {de
                    ? 'Zum Weiterbilden, Reflektieren und Wachsen, auf Basis von Wlad Jachtchenkos Büchern, Kursen und Coaching-Praxis.'
                    : "To learn, reflect and grow, based on Wlad Jachtchenko's books, courses and coaching practice."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  {[
                    {
                      icon: BookOpen,
                      title: de ? 'Wlads gesamtes Wissen' : "Wlad's entire knowledge",
                      desc: de ? 'Jede Antwort basiert auf Wlad Jachtchenkos Büchern, Vorträgen & Coaching-Praxis. In Sekunden bei dir.' : "Every answer draws on Wlad Jachtchenko's books, talks & coaching practice. With you in seconds.",
                    },
                    {
                      icon: Video,
                      title: de ? 'Video-Feedback wie im 1:1' : 'Video feedback like a 1:1',
                      desc: de ? 'Rede aufnehmen → präzises Feedback nach Wlad Jachtchenkos Methodik. Plus Lernvideos on demand.' : "Record a speech → precise feedback via Wlad Jachtchenko's methodology. Plus learning videos on demand.",
                    },
                    {
                      icon: Flame,
                      title: de ? 'Jeden Tag besser werden' : 'Get better every day',
                      desc: de ? 'Challenges, Reflexions-Check-ins & dein persönlicher Wachstumspfad. Kein Stillstand.' : 'Challenges, reflection check-ins & your personal growth path. No standing still.',
                    },
                    {
                      icon: Smartphone,
                      title: de ? 'Immer dabei, auch mobil' : 'Always with you, mobile too',
                      desc: de ? 'Desktop, Tablet oder Smartphone: Wlad ist da, wann und wo du ihn brauchst.' : "Desktop, tablet or phone: Wlad is there whenever and wherever you need him.",
                    },
                  ].map((f, i) => (
                    <div
                      key={f.title}
                      style={{ animationDelay: `${150 + i * 90}ms` }}
                      className="animate-fade-in flex flex-col items-start gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-[#BFFF00]/35 hover:bg-white/[0.05] transition-all"
                      data-testid={`feature-card-${i}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shadow-[0_0_18px_rgba(191,255,0,0.25)]">
                        <f.icon size={16} className="text-[#0A0A0A]" strokeWidth={2.4} />
                      </div>
                      <p className="text-[13.5px] font-bold text-white leading-tight">{f.title}</p>
                      <p className="text-[11.5px] text-white/55 leading-snug">{f.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Trust & community strip */}
                <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1.5 mt-5 pt-4 border-t border-white/[0.07]" data-testid="onboarding-trust-strip">
                  {[
                    { icon: Shield, label: de ? 'DSGVO-konform: was mit deinen Daten passiert' : 'GDPR compliant: what happens with your data', href: '/datenschutz' },
                    { icon: Lock, label: de ? 'Sichere Zahlung (Stripe)' : 'Secure payments (Stripe)' },
                    { icon: Users, label: de ? 'Teil der Leader-Community' : 'Part of the leader community' },
                  ].map((t) => t.href ? (
                    <a
                      key={t.label}
                      href={t.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[10px] font-bold text-white/60 hover:text-[#BFFF00] underline decoration-white/15 hover:decoration-[#BFFF00]/60 underline-offset-2 transition-colors"
                      data-testid="onboarding-dsgvo-link"
                    >
                      <t.icon size={11} className="text-[#BFFF00]/80" /> {t.label}
                    </a>
                  ) : (
                    <span key={t.label} className="flex items-center gap-1.5 text-[10px] font-bold text-white/45">
                      <t.icon size={11} className="text-[#BFFF00]/80" /> {t.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button onClick={next} className="glow-lime btn-shine bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-bold px-8 h-12 shadow-lg shadow-[#BFFF00]/15" data-testid="onboarding-features-next">
                {de ? 'Ja, das will ich' : "Yes, I want this"} <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Profile (Position, Company, Industry) */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-3 max-w-md mx-auto">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">{de ? 'Deine Position' : 'Your Position'} *</label>
                <input value={profileData.position} onChange={e => setProfileData(p => ({ ...p, position: e.target.value }))}
                  data-testid="onboarding-position-input"
                  placeholder={de ? 'z.B. Head of Sales, CTO, VP Marketing...' : 'e.g. Head of Sales, CTO, VP Marketing...'}
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-card text-sm focus:ring-2 focus:ring-[#BFFF00]/20 focus:border-[#BFFF00] transition-all"
                  data-testid="onboarding-position" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">{de ? 'Unternehmen' : 'Company'}</label>
                <input value={profileData.company} onChange={e => setProfileData(p => ({ ...p, company: e.target.value }))}
                  data-testid="onboarding-company-input"
                  placeholder={de ? 'z.B. BMW, SAP, Startup...' : 'e.g. BMW, SAP, Startup...'}
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-card text-sm focus:ring-2 focus:ring-[#BFFF00]/20 focus:border-[#BFFF00] transition-all"
                  data-testid="onboarding-company" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">{de ? 'Branche' : 'Industry'}</label>
                <input value={profileData.industry} onChange={e => setProfileData(p => ({ ...p, industry: e.target.value }))}
                  data-testid="onboarding-industry-input"
                  placeholder={de ? 'z.B. Tech, Finanzen, Gesundheit, Automobil...' : 'e.g. Tech, Finance, Health, Automotive...'}
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-card text-sm focus:ring-2 focus:ring-[#BFFF00]/20 focus:border-[#BFFF00] transition-all"
                  data-testid="onboarding-industry" />
              </div>
            </div>
            <div className="flex justify-center pt-2">
              <Button onClick={next} disabled={!profileData.position.trim()}
                className="glow-lime bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-bold px-8 h-11 shadow-lg shadow-[#BFFF00]/15" data-testid="onboarding-profile-next">
                {de ? 'Weiter' : 'Continue'} <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Role — staggered entrance */}
        {step === 3 && (
          <div className="space-y-2 animate-fade-in">
            {roles.map((role, idx) => (
              <button key={role.id} onClick={() => { setData(d => ({ ...d, role: role.id })); next(); }}
                style={{ animationDelay: `${idx * 60}ms` }}
                className={`animate-fade-in flex items-center gap-4 w-full p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-[#BFFF00]/50 text-left ${data.role === role.id ? 'border-[#BFFF00] bg-[#BFFF00]/[0.06] dark:bg-[#BFFF00]/10' : 'border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-card/80'}`}
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
        )}

        {/* Step 4: Goal — staggered grid */}
        {step === 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            {goals.map((goal, idx) => (
              <button key={goal.id} onClick={() => { setData(d => ({ ...d, primary_goal: goal.id })); next(); }}
                style={{ animationDelay: `${idx * 55}ms` }}
                className={`animate-fade-in flex flex-col items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-[#BFFF00]/50 text-left ${data.primary_goal === goal.id ? 'border-[#BFFF00] bg-[#BFFF00]/[0.06] dark:bg-[#BFFF00]/10' : 'border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-card/80'}`}
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
        )}

        {/* Step 5: How did you hear about us? */}
        {step === 5 && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {heardSources.map((src, idx) => (
                <button
                  key={src.id}
                  onClick={() => { setData((d) => ({ ...d, heard_from: src.id })); next(); }}
                  data-testid={`heard-${src.id}`}
                  style={{ animationDelay: `${idx * 35}ms` }}
                  className={`animate-fade-in flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-[#BFFF00]/40 ${
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-muted-foreground hover:text-[#4A6200] dark:hover:text-[#BFFF00] border border-black/[0.06] dark:border-white/[0.06] hover:border-[#BFFF00]/40 bg-white/60 dark:bg-card/40 hover:bg-[#BFFF00]/[0.06] transition-all"
                data-testid="heard-skip"
              >
                {de ? 'Überspringen' : 'Skip'}
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Kostenlose Leadership-Diagnose */}
        {step === 6 && (
          <div className="space-y-5 animate-fade-in">
            <Card className="border-amber-200/50 dark:border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-500/5 dark:to-orange-500/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{de ? 'Kostenlose Leadership-Diagnose' : 'Free leadership diagnosis'}</p>
                    <p className="text-xs text-muted-foreground">{de ? '10 Minuten · sofortiger Report · individuelles Feedback' : '10 minutes · instant report · personal feedback'}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{de ? 'Schon gemacht? Deine Scores hier eintragen (optional)' : 'Already done it? Add your scores here (optional)'}</p>
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

                <Button className="w-full text-xs font-black h-11 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:brightness-110 transition-all"
                  onClick={() => window.open(LEADERCHECK_URL, '_blank', 'noopener,noreferrer')} data-testid="wladhub-onboarding-link">
                  <ExternalLink size={13} className="mr-1.5" /> {de ? 'Kostenlose Diagnose jetzt starten' : 'Start free diagnosis now'}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center mt-2 font-medium">
                  {de ? '10 Min · sofortiger Report · macht mein Coaching ab Tag 1 individueller' : '10 min · instant report · makes coaching more personal from day 1'}
                </p>
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

        {/* Step 7: Strategy Call CTA — Cal.com */}
        {step === 7 && (
          <div className="space-y-5 animate-fade-in" data-testid="onboarding-call-step">
            <div className="text-center">
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase tracking-wider px-3 py-1">
                {de ? '15 Min · Unverbindlich · 1:1' : '15 min · No strings · 1:1'}
              </Badge>
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
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {de ? 'online buchbar' : 'book online'}
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
                {de ? 'Überspringen, ich starte direkt' : 'Skip, I want to start now'} →
              </button>
            </div>
          </div>
        )}

        {/* Step 8: Done — Wlad confirms, personalized summary.
            Iter 131.3: real Wlad photo instead of the Pixar avatar. */}
        {step === 8 && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="relative mx-auto inline-flex" data-testid="onboarding-finish-portrait">
              <div className="absolute inset-0 rounded-full bg-[#BFFF00] blur-xl opacity-30 scale-110" aria-hidden />
              <div className="relative w-24 h-24 rounded-full p-[3px] bg-gradient-to-br from-[#BFFF00] via-[#9ACC00] to-[#6B8A00] shadow-[0_18px_50px_-15px_rgba(191,255,0,0.55)]">
                <img src={WLAD_AVATAR} alt="Wlad Jachtchenko" className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="absolute -top-1 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/40 border-2 border-white dark:border-[#0A0A0A]">
                <CheckCircle2 size={16} className="text-white" />
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-black">{de ? `Alles gespeichert, ${firstName}.` : `All saved, ${firstName}.`}</h2>
              <p className="text-base text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                {de
                  ? 'Dein Dashboard ist auf deine Rolle und dein Ziel eingestellt. Du kannst das jederzeit im Profil ändern.'
                  : 'Your dashboard is set up for your role and your goal. You can change this anytime in your profile.'}
              </p>
              {/* Personalized profile chips */}
              {(roleLabel || goalLabel) && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4" data-testid="onboarding-summary-chips">
                  {roleLabel && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#BFFF00]/10 text-[#4A6200] dark:text-[#BFFF00] border border-[#BFFF00]/25">
                      <Briefcase size={11} /> {roleLabel}
                    </span>
                  )}
                  {goalLabel && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                      <Target size={11} /> {goalLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button onClick={finish} disabled={loading}
                className="glow-lime btn-shine bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-bold h-12 shadow-lg shadow-[#BFFF00]/15"
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
