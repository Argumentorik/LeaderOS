import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

/**
 * ThreeStepPath · „Dein Weg in drei Schritten": Leader-Check → Live-Webinar →
 * 14 Tage LeaderOS. Die Reihenfolge ist Absicht (WEBINAR_FUNNEL.md): erst der
 * Check, dann das Webinar, der Test erst danach.
 *
 * Drei Bildkarten mit Editorial-Fotos (public/journal/topics/), Schritt 1 als
 * Einstieg in Lime markiert. Keine künstliche Verknappung: Das Webinar ist
 * kostenlos und hat kein erfundenes Platzlimit.
 *
 * Props:
 *   tone      'light' | 'dark'
 *   checkUrl  Ziel für Schritt 1 (mit UTM der jeweiligen Seite)
 *   trialUrl  Ziel für Schritt 3
 *   webinarHref  Ziel für Schritt 2 (Default /webinar)
 *   onTrack   (event, props) => void
 */
const STEPS = [
  {
    nr: '01',
    kicker: 'Start hier',
    title: 'Leader-Check',
    where: 'auf leadercheck.de',
    sub: '10 Minuten, die dein Führungsprofil schwarz auf weiß zeigen.',
    cta: 'Zum Check (10 Min.)',
    img: '/journal/topics/ai.webp',
    alt: 'Führungskraft macht den Leader-Check am Laptop',
    key: 'check',
  },
  {
    nr: '02',
    kicker: 'Do, 26. November · 10:00',
    title: 'Live-Webinar',
    where: 'kostenlos, 90 Minuten',
    sub: 'Das System live im Einsatz: keine Theorie, sondern echte Hebel.',
    cta: 'Platz sichern',
    img: '/journal/topics/stage.webp',
    alt: 'Rede vor vollem Saal',
    key: 'webinar',
  },
  {
    nr: '03',
    kicker: 'Erst nach dem Check',
    title: '14 Tage LeaderOS',
    where: 'kostenlos auf leaderos.de',
    sub: 'KI-Coach, Simulationen und 3 Video-Analysen: jeden Tag trainieren.',
    cta: '14 Tage testen',
    img: '/journal/topics/app.webp',
    alt: 'Training mit der LeaderOS-App auf dem Smartphone',
    key: 'trial',
  },
];

const TONES = {
  light: { bg: 'transparent', card: '#FFFFFF', line: 'rgba(10,10,10,0.1)', ink: '#0A0A0A', muted: '#5F6166', accent: '#5A7700', pill: '#0A0A0A', pillInk: '#FFFFFF' },
  dark: { bg: '#0A0A0A', card: '#121212', line: 'rgba(255,255,255,0.1)', ink: '#FFFFFF', muted: 'rgba(255,255,255,0.62)', accent: '#BFFF00', pill: '#FFFFFF', pillInk: '#0A0A0A' },
};

export function ThreeStepPath({
  tone = 'light',
  checkUrl = 'https://leadercheck.de',
  trialUrl = 'https://leaderos.de/signup?trial=14',
  webinarHref = '/webinar',
  eyebrow = 'Dein Weg in drei Schritten',
  title = 'Erst der Check. Dann live. Dann jeden Tag.',
  onTrack,
  className = '',
}) {
  const t = TONES[tone] || TONES.light;
  const reduce = useReducedMotion();
  const href = { check: checkUrl, webinar: webinarHref, trial: trialUrl };
  const external = (u) => /^https?:/.test(u);

  return (
    <section className={className} style={{ background: t.bg }} aria-labelledby="three-step-title" data-testid="three-step-path">
      <div className="mx-auto" style={{ maxWidth: 1280, padding: '72px 20px' }}>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.26em]" style={{ color: t.accent }}>▸ {eyebrow}</p>
        <h2 id="three-step-title" className="mt-3 text-[32px] md:text-[48px] leading-[1.02] tracking-[-0.03em]"
          style={{ fontFamily: 'Geist, Inter, system-ui, sans-serif', fontWeight: 500, color: t.ink }}>
          {title}
        </h2>

        <ol className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {STEPS.map((s, i) => {
            const first = i === 0;
            return (
              <motion.li
                key={s.key}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex flex-col rounded-3xl overflow-hidden"
                style={{ background: t.card, border: `1px solid ${first ? t.accent : t.line}`, boxShadow: first ? `0 0 0 1px ${t.accent}` : 'none' }}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={s.img} alt={s.alt} loading="lazy" decoding="async"
                    className="absolute inset-0 w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-[1.04]" />
                  <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.55), rgba(10,10,10,0) 55%)' }} />
                  <span className="absolute left-4 bottom-3 font-mono font-bold text-white" style={{ fontSize: 44, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.nr}</span>
                  <span className="absolute right-3 top-3 rounded-full font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ padding: '6px 10px', background: first ? '#BFFF00' : 'rgba(255,255,255,0.92)', color: '#0A0A0A' }}>
                    {s.kicker}
                  </span>
                </div>
                <div className="flex flex-col flex-1" style={{ padding: '22px 22px 24px' }}>
                  <h3 className="text-[22px] md:text-[24px] leading-[1.15] tracking-[-0.02em]" style={{ fontFamily: 'Geist, Inter, system-ui, sans-serif', fontWeight: 600, color: t.ink }}>
                    {s.title}
                    <span className="block text-[14px] mt-1 font-mono font-normal tracking-normal" style={{ color: t.muted }}>{s.where}</span>
                  </h3>
                  <p className="mt-3 text-[15px] leading-[1.5] flex-1" style={{ color: t.muted }}>{s.sub}</p>
                  <a
                    href={href[s.key]}
                    {...(external(href[s.key]) ? { target: '_blank', rel: 'noopener' } : {})}
                    onClick={() => onTrack?.('three_step_click', { step: s.key })}
                    className="mt-5 inline-flex items-center justify-center gap-2 h-12 rounded-full text-[14px] font-semibold transition-transform active:scale-[0.97] hover:-translate-y-0.5"
                    style={first ? { background: '#BFFF00', color: '#0A0A0A' } : { background: t.pill, color: t.pillInk }}
                    data-testid={`three-step-${s.key}`}
                  >
                    {s.cta} <ArrowUpRight size={16} />
                  </a>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
