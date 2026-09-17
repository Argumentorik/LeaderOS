import { useNavigate } from 'react-router-dom';
import { Target, MessageCircle, CheckCircle2, BookOpen, Timer, RefreshCw, Video, Flame, Lock, ArrowRight } from 'lucide-react';
import { VideoThumb } from '../shared/VideoThumb';

const BENEFITS = [
  { icon: Target, de: ['Echte Situationen, keine Theorie', 'Jede Folge startet mit einem Moment aus deinem Führungsalltag.'], en: ['Real situations, no theory', 'Every episode starts with a moment from your leadership day.'] },
  { icon: MessageCircle, de: ['Frag WladBot direkt aus der Folge', 'Ein Klick — und du besprichst die Folge auf deine Situation gemünzt.'], en: ['Ask WladBot right from the episode', 'One click — discuss the episode applied to your situation.'] },
  { icon: CheckCircle2, de: ['Folge gesehen = Fortschritt gezählt', 'Dein Level wächst mit jeder Folge automatisch mit.'], en: ['Watched = progress counted', 'Your level grows automatically with every episode.'] },
  { icon: BookOpen, de: ['Sofort anwenden: Playbook zu jedem Kurs', 'Skripte und Checklisten für das nächste Gespräch.'], en: ['Apply instantly: a playbook per course', 'Scripts and checklists for your next conversation.'] },
  { icon: Timer, de: ['Kurze Folgen, max. 12 Minuten', 'Passt zwischen zwei Meetings — ohne Qualitätsverlust.'], en: ['Short episodes, max. 12 minutes', 'Fits between two meetings — no loss of depth.'] },
  { icon: RefreshCw, de: ['Neue Folgen erscheinen automatisch', 'Sobald Wlad aufnimmt, ist die Folge hier — ohne Update.'], en: ['New episodes appear automatically', 'As soon as Wlad records, the episode is here.'] },
];

export const WhatsInside = ({ de }) => (
  <section className="mt-16 grid lg:grid-cols-[1fr_1.1fr] gap-8 items-center" data-testid="courses-whats-inside">
    <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-[#0A0A0A]">
      <img src="/courses/executive-presence.jpg" alt="Wlad Jachtchenko im Kurs" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <p className="absolute bottom-5 left-5 right-5 text-white text-[13px] font-semibold leading-snug">
        {de ? '„Rhetorik ist kein Talent. Es ist ein System — und Systeme kann man lernen.“' : '"Rhetoric is not a talent. It is a system — and systems can be learned."'}
        <span className="block text-[11px] text-white/60 font-normal mt-1">— Wlad Jachtchenko</span>
      </p>
    </div>
    <div>
      <h2 className="text-lg md:text-xl font-black">{de ? 'Was drin ist' : "What's inside"}</h2>
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {BENEFITS.map((b) => {
          const [title, sub] = de ? b.de : b.en;
          const Icon = b.icon;
          return (
            <div key={title} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-card p-4">
              <span className="w-8 h-8 rounded-lg bg-[#BFFF00]/15 text-[#4A6200] dark:text-[#BFFF00] flex items-center justify-center"><Icon size={15} /></span>
              <p className="text-[13px] font-black mt-3 leading-tight">{title}</p>
              <p className="text-[11.5px] text-muted-foreground mt-1">{sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export const MoreFromLeaderOS = ({ de }) => {
  const navigate = useNavigate();
  const items = [
    { icon: MessageCircle, to: '/chat', testid: 'courses-more-chat', de: ['Frag WladBot', 'Dein KI-Coach kennt Bücher, Kurse und Live-Calls — stell die Frage, die dich gerade beschäftigt.', 'Zum Chat'], en: ['Ask WladBot', 'Your AI coach knows the books, courses and live calls — ask what is on your mind.', 'Open chat'] },
    { icon: Video, to: '/video-guide', testid: 'courses-more-guide', de: ['Onboarding-Videos', 'Wlad erklärt dir die Plattform in kurzen Clips — vom Check-in bis zur Video-Analyse.', 'Videos ansehen'], en: ['Onboarding videos', 'Wlad walks you through the platform in short clips.', 'Watch videos'] },
    { icon: Flame, to: '/challenge', testid: 'courses-more-challenge', de: ['30-Tage-Challenge', 'Jeden Tag eine Aufgabe, 10 Fragen, ein Fortschritt — das Programm, das Gewohnheiten baut.', 'Challenge öffnen'], en: ['30-day challenge', 'One task a day, 10 questions, visible progress.', 'Open challenge'] },
  ];
  return (
    <section className="mt-16" data-testid="courses-more">
      <h2 className="text-lg md:text-xl font-black">{de ? 'Mehr aus Leader-OS' : 'More from Leader-OS'}</h2>
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        {items.map((it) => {
          const [title, sub, cta] = de ? it.de : it.en;
          const Icon = it.icon;
          return (
            <div key={it.to} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-card p-5 flex flex-col">
              <span className="w-9 h-9 rounded-xl bg-[#0A0A0A] dark:bg-[#BFFF00] text-[#BFFF00] dark:text-black flex items-center justify-center"><Icon size={16} /></span>
              <p className="text-[15px] font-black mt-3">{title}</p>
              <p className="text-[12px] text-muted-foreground mt-1 flex-1">{sub}</p>
              <button type="button" onClick={() => navigate(it.to)} className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-black text-[#4A6200] dark:text-[#BFFF00] hover:gap-2.5 transition-all" data-testid={it.testid}>
                {cta} <ArrowRight size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const CoursesUpsell = ({ data, de }) => {
  const navigate = useNavigate();
  const locked = data.courses.filter((c) => !c.unlocked);
  if (!locked.length) return null;
  const episodes = locked.reduce((s, c) => s + c.episode_count, 0);
  const target = data.tier === 'free' ? 'Leadership OS' : 'Leadership OS PLUS';
  return (
    <div className="mt-8 rounded-2xl border border-[#BFFF00]/30 bg-[#0A0A0A] text-white overflow-hidden grid md:grid-cols-[auto_1fr_auto] items-center gap-5 p-5" data-testid="courses-upsell-banner">
      <div className="hidden md:block w-40 aspect-video rounded-xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-70"><VideoThumb src={locked[0].thumbnail_url} title={locked[0].title} showPlay={false} /></div>
        <span className="absolute inset-0 flex items-center justify-center"><Lock size={18} className="text-[#BFFF00]" /></span>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#BFFF00]">{de ? 'Noch gesperrt' : 'Still locked'}</p>
        <p className="text-lg font-black mt-1">{de ? `${locked.length} Kurse · ${episodes} Folgen warten auf dich` : `${locked.length} courses · ${episodes} episodes are waiting`}</p>
        <p className="text-[12.5px] text-white/60 mt-1">{de ? `Mit ${target} schalten sich alle Folgen sofort frei — Folge 1 bleibt für alle kostenlos.` : `With ${target} every episode unlocks instantly — episode 1 stays free for everyone.`}</p>
      </div>
      <button type="button" onClick={() => navigate('/coaching')} className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-[#BFFF00] text-black text-[13px] font-black hover:bg-[#D4FF4D] transition-colors" data-testid="courses-upsell-cta">
        {de ? 'Pakete ansehen' : 'See plans'} <ArrowRight size={14} />
      </button>
    </div>
  );
};
