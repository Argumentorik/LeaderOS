/**
 * EnterpriseLandingPage.js — Public marketing surface at /for-teams
 * Iter 128 (Wlad-Direktive · Godmode Enterprise Funnel):
 *   CEO/business-owner focused landing page. Sells the story of empowering
 *   teams with AI + Communication + Leadership skills, plus the "Bring Your
 *   Own RAG" story (companies upload their books/SOPs/onboarding material
 *   and get a private internal WladBot for their people).
 *
 *   Non-authenticated — captures leads via /api/enterprise/public-lead.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { WladMark } from '../components/brand/WladMark';
import {
  ArrowRight, Sparkles, Building2, Brain, MessageSquareText, Shield,
  Users, UploadCloud, Layers, Check, Lock, Cpu, LineChart, ChevronRight,
  Award, Target, Mail, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BENEFITS = [
  {
    icon: Brain,
    de: {
      title: 'AI-Fluency für dein ganzes Team',
      body: 'Führungskräfte, die KI nicht nur nutzen — sondern damit denken, entscheiden, delegieren. Kein Buzzword-Training. Echte tägliche Anwendung.'
    },
    en: {
      title: 'AI-fluency across your team',
      body: 'Leaders who don\'t just use AI — they think, decide, and delegate with it. No buzzword training. Daily, applied practice.'
    }
  },
  {
    icon: MessageSquareText,
    de: {
      title: 'Kommunikation, die trägt',
      body: 'Weiße Rhetorik, Verhandlung, Konfliktgespräche, Feedback. Basierend auf Wlads Frameworks — trainiert im Alltag deiner Leute.'
    },
    en: {
      title: 'Communication that holds under pressure',
      body: 'Rhetoric, negotiation, conflict, feedback. Wlad\'s frameworks, drilled into your team\'s daily workflow.'
    }
  },
  {
    icon: Award,
    de: {
      title: 'Führung als System',
      body: 'Kein Coaching-Blitz, der nach 2 Wochen verpufft. LeaderOS wird Teil des Betriebssystems — Micro-Praxis jeden Tag, messbar.'
    },
    en: {
      title: 'Leadership as an operating system',
      body: 'Not a two-week coaching sugar-high. LeaderOS becomes part of the daily operating system — measurable micro-practice every day.'
    }
  },
];

const RAG_FEATURES = [
  { icon: UploadCloud, de: 'Deine Bücher, SOPs, Onboarding-Docs', en: 'Your books, SOPs, onboarding docs' },
  { icon: Lock,        de: 'Isoliert · nie in fremde Modelle',    en: 'Isolated · never leaks to public models' },
  { icon: Cpu,         de: 'Interner Company-Bot 24/7',           en: 'Your internal company bot, 24/7' },
  { icon: LineChart,   de: 'Nutzungsanalytik pro Team',           en: 'Team-level usage analytics' },
];

const TRUST_LINE = [
  { de: 'DSGVO-konform · Hosting in EU', en: 'GDPR compliant · EU hosting' },
  { de: 'SSO & rollenbasierte Rechte', en: 'SSO & role-based access' },
  { de: 'Custom Onboarding', en: 'Custom onboarding' },
  { de: 'Dedizierter Success-Manager', en: 'Dedicated success manager' },
];

export default function EnterpriseLandingPage() {
  const { lang } = useLanguage();
  const de = lang === 'de';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden" data-testid="enterprise-landing">
      <TopNav de={de} />
      <Hero de={de} />
      <BenefitsBlock de={de} />
      <BringYourOwnRAG de={de} />
      <HowItWorks de={de} />
      <SocialProof de={de} />
      <LeadForm de={de} />
      <Footer de={de} />
    </div>
  );
}

/* ═══════════════════════════════════ SECTIONS ═══════════════════════════ */

const TopNav = ({ de }) => (
  <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0A0A]/85 backdrop-blur-xl" data-testid="enterprise-nav">
    <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-xl bg-[#BFFF00] flex items-center justify-center shadow-lg shadow-[#BFFF00]/20 group-hover:scale-[1.05] transition-transform">
          <WladMark size={20} />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-black tracking-tight">LeaderOS</div>
          <div className="text-[9px] font-bold tracking-widest text-[#BFFF00]/70">FOR TEAMS</div>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <Link to="/login" className="hidden sm:block text-[13px] font-bold text-white/70 hover:text-white transition-colors" data-testid="enterprise-nav-login">
          {de ? 'Anmelden' : 'Log in'}
        </Link>
        <a href="#lead-form" data-testid="enterprise-nav-cta">
          <Button className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-black h-9 px-4 text-[12px]">
            {de ? 'Gespräch anfragen' : 'Book a call'}
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </a>
      </div>
    </div>
  </nav>
);

const Hero = ({ de }) => (
  <section className="relative overflow-hidden">
    {/* Ambient lime glow */}
    <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#BFFF00]/[0.12] blur-[120px]" />
    <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-[#3B82F6]/[0.08] blur-[100px]" />
    <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <Badge className="bg-[#BFFF00]/15 text-[#BFFF00] border border-[#BFFF00]/25 font-black text-[10px] tracking-widest mb-6" data-testid="hero-badge">
        {de ? 'LEADEROS FÜR TEAMS · ENTERPRISE' : 'LEADEROS FOR TEAMS · ENTERPRISE'}
      </Badge>
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.98] mb-6 max-w-4xl">
        {de ? (
          <>
            Rüste dein Team mit <span className="text-[#BFFF00]">AI, Rhetorik</span><br className="hidden sm:block" /> und echter Führung aus.
          </>
        ) : (
          <>
            Equip your team with <span className="text-[#BFFF00]">AI, rhetoric,</span><br className="hidden sm:block" /> and real leadership.
          </>
        )}
      </h1>
      <p className="text-lg sm:text-xl text-white/70 max-w-2xl mb-10 leading-relaxed">
        {de
          ? 'LeaderOS ist das Führungs-Betriebssystem, das CEOs und Vorstände nutzen, damit ihre Manager KI täglich einsetzen, Konflikte souverän führen und Meetings mit einer Strategie starten — nicht mit Bauchgefühl.'
          : 'LeaderOS is the leadership operating system used by CEOs and boards to make their managers use AI daily, run conflicts calmly, and enter meetings with a strategy — not gut feeling.'}
      </p>
      <div className="flex flex-wrap items-center gap-3 mb-14">
        <a href="#lead-form" data-testid="hero-cta-primary">
          <Button className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-black h-12 px-6 shadow-lg shadow-[#BFFF00]/25 transition-all active:scale-[0.98]">
            <Sparkles size={16} className="mr-2" />
            {de ? 'Enterprise-Gespräch buchen' : 'Book enterprise call'}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </a>
        <a href="#byo-rag" data-testid="hero-cta-secondary">
          <Button variant="ghost" className="text-white hover:bg-white/[0.06] hover:text-[#BFFF00] font-black h-12 px-5 border border-white/10">
            {de ? 'Bring Your Own RAG →' : 'Bring Your Own RAG →'}
          </Button>
        </a>
      </div>

      {/* Trust strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-white/50">
        {TRUST_LINE.map((t, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Check size={12} className="text-[#BFFF00]" />
            <span>{de ? t.de : t.en}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const BenefitsBlock = ({ de }) => (
  <section className="border-t border-white/[0.05] bg-[#0F0F0F]" data-testid="benefits-block">
    <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24">
      <div className="mb-14 max-w-2xl">
        <div className="text-[11px] font-black tracking-widest text-[#BFFF00] mb-3">
          {de ? 'WARUM CEOs UND VORSTÄNDE JETZT HANDELN' : 'WHY CEOs AND BOARDS ACT NOW'}
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.05]">
          {de ? 'Deine Konkurrenz trainiert schon.' : 'Your competition is already training.'}
        </h2>
        <p className="text-white/60 mt-4 text-[15px] leading-relaxed">
          {de
            ? 'Führung ist in den nächsten 24 Monaten kein Bauchgefühl mehr, sondern ein System aus Sprache, Rahmen und KI-Werkzeugen. Wer das nicht institutionalisiert, verliert Talente an die, die es tun.'
            : 'In the next 24 months, leadership is no longer gut feeling — it\'s a system of language, frames, and AI tools. Companies that don\'t institutionalize this lose talent to those that do.'}
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {BENEFITS.map((b, i) => {
          const Icon = b.icon;
          const t = de ? b.de : b.en;
          return (
            <div key={i} className="relative rounded-3xl border border-white/[0.06] bg-[#141414] p-7 hover:border-[#BFFF00]/30 hover:bg-[#161616] transition-all" data-testid={`benefit-${i}`}>
              <div className="w-11 h-11 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center mb-5">
                <Icon size={19} className="text-[#BFFF00]" />
              </div>
              <h3 className="text-lg font-black leading-tight mb-2.5">{t.title}</h3>
              <p className="text-[13.5px] text-white/60 leading-relaxed">{t.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

const BringYourOwnRAG = ({ de }) => (
  <section id="byo-rag" className="relative overflow-hidden border-t border-white/[0.05]" data-testid="byo-rag">
    <div className="absolute top-1/2 -translate-y-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-[#BFFF00]/[0.06] blur-[110px]" />
    <div className="relative max-w-6xl mx-auto px-6 py-20 sm:py-28 grid lg:grid-cols-2 gap-14 items-center">
      <div>
        <div className="text-[11px] font-black tracking-widest text-[#BFFF00] mb-3">
          {de ? 'BRING YOUR OWN RAG' : 'BRING YOUR OWN RAG'}
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.02] mb-5">
          {de
            ? 'Dein Wissen. Dein Ton. Ein interner KI-Coach für dein Team.'
            : 'Your knowledge. Your tone. An internal AI coach for your team.'}
        </h2>
        <p className="text-white/65 leading-relaxed mb-8 text-[15px]">
          {de
            ? 'Lade deine Bücher, Playbooks, SOPs, Onboarding-Dokumente, Verkaufsscripts oder Führungsleitlinien hoch. LeaderOS baut daraus einen privaten Company-Bot — im gleichen Stil wie WladBot, aber ausschließlich mit deinem Wissen. Deine Mitarbeiter fragen ihn 24/7 im Alltag. Skalierbares Onboarding, konsistente Antworten, keine Lernkurve.'
            : 'Upload your books, playbooks, SOPs, onboarding docs, sales scripts, or leadership guidelines. LeaderOS turns them into a private company bot — same feel as WladBot, but built entirely from your own material. Your people ask it 24/7. Scalable onboarding, consistent answers, no learning curve.'}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {RAG_FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4" data-testid={`rag-feature-${i}`}>
                <div className="w-9 h-9 rounded-xl bg-[#BFFF00]/12 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[#BFFF00]" />
                </div>
                <div className="text-[13.5px] font-bold leading-snug pt-1.5">
                  {de ? f.de : f.en}
                </div>
              </div>
            );
          })}
        </div>
        <a href="#lead-form" data-testid="byo-rag-cta">
          <Button className="bg-white text-[#0A0A0A] hover:bg-[#BFFF00] font-black h-11 px-5 transition-all active:scale-[0.98]">
            {de ? 'BYO-RAG demo anfragen' : 'Request BYO-RAG demo'}
            <ArrowRight size={15} className="ml-2" />
          </Button>
        </a>
      </div>

      {/* Right: visual mockup */}
      <div className="relative">
        <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#151515] to-[#0F0F0F] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-[#BFFF00] flex items-center justify-center">
              <Building2 size={14} className="text-[#0A0A0A]" />
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-black">acme-bot</div>
              <div className="text-[10px] text-white/50 font-bold">
                {de ? 'Privater Company-Bot · 12.400 Chunks · dein Wissen' : 'Private company bot · 12,400 chunks · your knowledge'}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <ChatBubble side="user" text={de ? 'Wie handhaben wir Preisverhandlungen bei Enterprise-Kunden?' : 'How do we handle price negotiations on enterprise deals?'} />
            <ChatBubble side="bot" text={de
              ? 'Laut deinem internen Sales-Playbook (Kapitel 4.2) …'
              : 'Per your internal sales playbook (chapter 4.2) …'} />
            <ChatBubble side="user" text={de ? 'Was war unsere Retention-Regel für Q4?' : 'What was our retention rule for Q4?'} />
            <ChatBubble side="bot" text={de
              ? 'Aus dem Q4-OKR-Doc: 90-Tage-Aktivierung mit 2 Success-Reviews.'
              : 'From the Q4 OKR doc: 90-day activation with 2 success reviews.'} />
          </div>
          <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-[10px] text-white/40 font-bold">
            <Lock size={10} />
            {de ? 'ISOLIERTER TENANT · EU-HOSTING · KEIN DRITTZUGRIFF' : 'ISOLATED TENANT · EU HOSTING · NO THIRD-PARTY ACCESS'}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ChatBubble = ({ side, text }) => (
  <div className={`flex ${side === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
      side === 'user' ? 'bg-white/[0.08] text-white/90 rounded-tr-sm' : 'bg-[#BFFF00]/12 text-[#BFFF00] rounded-tl-sm border border-[#BFFF00]/15'
    }`}>
      {text}
    </div>
  </div>
);

const HowItWorks = ({ de }) => {
  const steps = de
    ? [
        { icon: Users, title: '1. Anfrage & Fit-Call', body: 'Wir klären in 30 Minuten: Teamgröße, Ziele, Kultur. Kein Sales-Pitch, ein ehrlicher Fit-Check.' },
        { icon: Layers, title: '2. RAG & Setup', body: 'Deine Inhalte werden ingested, Rollen und Rechte konfiguriert, ein Success-Plan mit klaren Metriken erstellt.' },
        { icon: Target, title: '3. Rollout & Habits', body: 'Führungskräfte bekommen tägliche Micro-Praxis, Managerinnen dediziertes Sparring, Vorstände Reports.' },
        { icon: Sparkles, title: '4. Iterieren & Skalieren', body: 'Alle 60 Tage Review, neue Playbooks, neue Rollen. Wächst mit deinem Unternehmen.' },
      ]
    : [
        { icon: Users, title: '1. Intro & fit call', body: 'A 30-minute honest fit check — team size, goals, culture. No sales pitch.' },
        { icon: Layers, title: '2. RAG & setup', body: 'Your content is ingested, roles and permissions configured, a success plan with clear metrics.' },
        { icon: Target, title: '3. Rollout & habits', body: 'Leaders get daily micro-practice, managers get dedicated sparring, executives get reports.' },
        { icon: Sparkles, title: '4. Iterate & scale', body: 'Every 60 days: review, new playbooks, new roles. Grows with your business.' },
      ];
  return (
    <section className="border-t border-white/[0.05] bg-[#0F0F0F]" data-testid="how-it-works">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-[11px] font-black tracking-widest text-[#BFFF00] mb-3">
          {de ? 'DEIN ROLLOUT' : 'YOUR ROLLOUT'}
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.02] mb-14 max-w-2xl">
          {de ? 'Kein 200-Seiten-Angebot. Ein klarer 4-Wochen-Plan.' : 'No 200-page proposal. A clean 4-week plan.'}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="rounded-3xl border border-white/[0.06] bg-[#141414] p-6 hover:border-[#BFFF00]/25 transition-all" data-testid={`step-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-[#BFFF00]/15 flex items-center justify-center mb-4">
                  <Icon size={17} className="text-[#BFFF00]" />
                </div>
                <div className="text-[15px] font-black mb-2 leading-tight">{s.title}</div>
                <div className="text-[13px] text-white/55 leading-relaxed">{s.body}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const SocialProof = ({ de }) => (
  <section className="border-t border-white/[0.05]" data-testid="social-proof">
    <div className="max-w-4xl mx-auto px-6 py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#BFFF00] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#BFFF00]/25">
        <WladMark size={26} />
      </div>
      <blockquote className="text-2xl sm:text-3xl font-black leading-[1.25] max-w-3xl mx-auto">
        {de
          ? '„Führung ohne System ist Glück. Wenn du 200 Leute führen willst, brauchst du ein Betriebssystem — nicht mehr Motivation."'
          : '"Leadership without a system is luck. If you lead 200 people, you need an operating system — not more motivation."'}
      </blockquote>
      <div className="mt-6 text-[13px] text-white/50 font-bold tracking-wider">
        WLAD JACHTCHENKO · {de ? 'GRÜNDER, LEADEROS' : 'FOUNDER, LEADEROS'}
      </div>
    </div>
  </section>
);

const LeadForm = ({ de }) => {
  const [form, setForm] = useState({
    company: '', name: '', email: '', teamSize: '', role: '', goals: '', wantsOwnRAG: false,
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.company || !form.email) {
      toast.error(de ? 'Firma und E-Mail sind Pflicht.' : 'Company and email are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/enterprise/public-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, lang: de ? 'de' : 'en' }),
      });
      if (!res.ok) throw new Error('failed');
      setDone(true);
      toast.success(de ? 'Danke! Wir melden uns innerhalb von 24h.' : 'Thanks! We\'ll reach out within 24h.');
    } catch {
      toast.error(de ? 'Etwas ist schiefgelaufen. Bitte erneut versuchen.' : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <section id="lead-form" className="border-t border-white/[0.05]" data-testid="lead-form-done">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#BFFF00] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#BFFF00]/25">
            <Check size={34} className="text-[#0A0A0A]" strokeWidth={3} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            {de ? 'Danke. Nachricht ist raus.' : 'Thanks. Message received.'}
          </h2>
          <p className="text-white/60 leading-relaxed text-[15px] max-w-xl mx-auto">
            {de
              ? 'Unser Enterprise-Team meldet sich innerhalb von 24 Stunden mit einem Terminvorschlag. Prüfe kurz deinen Posteingang (und ggf. Spam).'
              : 'Our enterprise team will reach out within 24 hours with a time slot. Please check your inbox (and spam) shortly.'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="lead-form" className="border-t border-white/[0.05] bg-[#0F0F0F]" data-testid="lead-form">
      <div className="max-w-3xl mx-auto px-6 py-20 sm:py-24">
        <div className="text-[11px] font-black tracking-widest text-[#BFFF00] mb-3">
          {de ? 'ENTERPRISE-GESPRÄCH' : 'ENTERPRISE CALL'}
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.02] mb-4">
          {de ? 'Erzähl uns kurz über dein Team.' : 'Tell us briefly about your team.'}
        </h2>
        <p className="text-white/55 leading-relaxed mb-10 text-[14px]">
          {de
            ? '30 Minuten Fit-Call. Kein Sales-Deck, kein Skript. Innerhalb von 24 Stunden bekommst du einen Terminvorschlag.'
            : '30-minute fit call. No sales deck, no script. You\'ll get a time slot within 24 hours.'}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label={de ? 'Firma *' : 'Company *'} testid="lf-company">
              <Input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 h-11 focus-visible:ring-[#BFFF00]/50" placeholder="Acme GmbH" data-testid="lf-company-input" />
            </FormField>
            <FormField label={de ? 'Dein Name' : 'Your name'} testid="lf-name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 h-11 focus-visible:ring-[#BFFF00]/50" placeholder={de ? 'Max Muster' : 'Alex Smith'} data-testid="lf-name-input" />
            </FormField>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label={de ? 'Business-E-Mail *' : 'Business email *'} testid="lf-email">
              <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 h-11 focus-visible:ring-[#BFFF00]/50" placeholder="ceo@acme.com" data-testid="lf-email-input" />
            </FormField>
            <FormField label={de ? 'Rolle' : 'Role'} testid="lf-role">
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 h-11 focus-visible:ring-[#BFFF00]/50" placeholder={de ? 'CEO, People Lead, ...' : 'CEO, People Lead, ...'} data-testid="lf-role-input" />
            </FormField>
          </div>
          <FormField label={de ? 'Wie groß ist dein Team?' : 'Team size?'} testid="lf-team-size">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['1-25', '26-100', '101-500', '500+'].map((sz) => (
                <button type="button" key={sz} onClick={() => setForm({ ...form, teamSize: sz })}
                  className={`h-10 rounded-xl border text-[12px] font-black transition-all ${
                    form.teamSize === sz
                      ? 'bg-[#BFFF00] border-[#BFFF00] text-[#0A0A0A]'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/70 hover:border-[#BFFF00]/40'
                  }`}
                  data-testid={`lf-team-${sz}`}>
                  {sz}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label={de ? 'Was ist dein Ziel?' : 'What\'s your goal?'} testid="lf-goals">
            <Textarea rows={3} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })}
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus-visible:ring-[#BFFF00]/50 resize-none"
              placeholder={de ? 'Kurz: was soll dein Team in 3-6 Monaten anders machen?' : 'Briefly: what should your team be doing differently in 3-6 months?'} data-testid="lf-goals-input" />
          </FormField>

          <label className="flex items-start gap-3 p-4 rounded-2xl border border-[#BFFF00]/25 bg-[#BFFF00]/[0.06] cursor-pointer hover:bg-[#BFFF00]/[0.09] transition-colors" data-testid="lf-byo-rag">
            <input type="checkbox" checked={form.wantsOwnRAG} onChange={(e) => setForm({ ...form, wantsOwnRAG: e.target.checked })}
              className="mt-1 accent-[#BFFF00] w-4 h-4" data-testid="lf-byo-rag-input" />
            <div>
              <div className="text-[13.5px] font-black text-[#BFFF00]">
                {de ? 'Ich will „Bring Your Own RAG" (interner Company-Bot)' : 'I want "Bring Your Own RAG" (internal company bot)'}
              </div>
              <div className="text-[12px] text-white/55 mt-1 leading-relaxed">
                {de
                  ? 'Wir zeigen dir wie du deine Bücher/SOPs/Docs zu einem privaten Bot machst — inkl. Preisrahmen und Timeline.'
                  : 'We\'ll show you how to turn your books/SOPs/docs into a private bot — pricing and timeline included.'}
              </div>
            </div>
          </label>

          <div className="pt-3">
            <Button type="submit" disabled={loading}
              className="w-full sm:w-auto bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-black h-12 px-7 shadow-lg shadow-[#BFFF00]/25 transition-all active:scale-[0.98]"
              data-testid="lf-submit">
              {loading ? <><Loader2 size={16} className="mr-2 animate-spin" /> {de ? 'Sende ...' : 'Sending ...'}</> : <>
                <Mail size={16} className="mr-2" />
                {de ? 'Anfrage senden' : 'Send request'}
                <ArrowRight size={16} className="ml-2" />
              </>}
            </Button>
            <p className="text-[11px] text-white/40 mt-4">
              {de ? 'Wir speichern deine Anfrage DSGVO-konform in der EU. Keine Newsletter-Falle.' : 'GDPR compliant. No newsletter trap.'}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
};

const FormField = ({ label, testid, children }) => (
  <div data-testid={testid}>
    <label className="block text-[11px] font-black tracking-wider text-white/60 mb-2 uppercase">{label}</label>
    {children}
  </div>
);

const Footer = ({ de }) => (
  <footer className="border-t border-white/[0.05] bg-[#0A0A0A]" data-testid="enterprise-footer">
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#BFFF00] flex items-center justify-center">
          <WladMark size={16} />
        </div>
        <div className="text-[12px] text-white/60">
          © {new Date().getFullYear()} LeaderOS · leader-check.de
        </div>
      </div>
      <div className="flex items-center gap-5 text-[12px] text-white/50">
        <Link to="/impressum" className="hover:text-white transition-colors">{de ? 'Impressum' : 'Legal'}</Link>
        <Link to="/datenschutz" className="hover:text-white transition-colors">{de ? 'Datenschutz' : 'Privacy'}</Link>
        <Link to="/agb" className="hover:text-white transition-colors">{de ? 'AGB' : 'Terms'}</Link>
      </div>
    </div>
  </footer>
);
