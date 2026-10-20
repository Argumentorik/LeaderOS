import { Button } from '../ui/button';
import { WLAD_AVATAR, WLAD_WELCOME_VIDEO } from '../../lib/brand';
import { ArrowRight, BookOpen, Video, Flame, Smartphone, Shield, Lock, Users, Play } from 'lucide-react';

const formatVideoLength = (seconds, de) => {
  if (!seconds) return de ? 'in wenigen Sekunden' : 'in seconds';
  if (seconds < 90) return de ? `in ${seconds} Sekunden` : `in ${seconds} seconds`;
  const mins = Math.round(seconds / 60);
  return de ? `in ${mins} Minuten` : `in ${mins} minutes`;
};

/* Step 0: Welcome — Wlad greets the user personally (Iter 131.3: real headshot, lime aura) */
export const WelcomeStep = ({ de, firstName, videoRef, videoStarted, setVideoStarted, videoDuration, setVideoDuration, next }) => (
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
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) setVideoDuration(Math.round(d));
          }}
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
            <span className="text-[11px] font-bold text-white/90 tracking-wide" data-testid="onboarding-video-duration">
              {de
                ? `Wlad erklärt dir Leader-OS ${formatVideoLength(videoDuration, true)}`
                : `Wlad explains Leader-OS ${formatVideoLength(videoDuration, false)}`}
            </span>
          </button>
        )}
      </div>
    </div>
    <Button onClick={next} className="glow-lime btn-shine bg-gradient-to-r from-[#BFFF00] to-[#9ACC00] text-[#0A0A0A] font-bold px-8 h-12 shadow-lg shadow-[#BFFF00]/15" data-testid="onboarding-start-btn">
      {de ? "Los geht's" : "Let's Go"} <ArrowRight size={16} className="ml-2" />
    </Button>
  </div>
);

/* Step 1: GODMODE showcase — why this is not a normal chatbot */
export const FeaturesStep = ({ de, next }) => (
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
);
