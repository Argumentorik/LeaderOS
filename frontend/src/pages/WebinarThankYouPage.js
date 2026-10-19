import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Check } from 'lucide-react';
import { LandingFooter } from '../components/landing/LandingFooter';
import { PlusCircleCTA } from '../components/landing/PlusCircleCTA';
import { WladMark } from '../components/brand/WladMark';
import { applyPageMeta } from '../lib/pageMeta';
import { trackGoogleAdsWebinarConversion } from '../lib/googleAds';
import { trackBingWebinarLead } from '../lib/bingUet';

/**
 * WebinarThankYouPage · /webinar/danke · dedicated confirmation surface for
 * the webinar squeeze page (routes/webinar.py sends the real confirmation
 * email + reminders; this page is the on-screen moment right after signup).
 *
 * Kept separate from the generic /thank-you (leader-check funnel) because
 * the next steps differ completely: add-to-calendar, and — per the explicit
 * growth goal — a direct bridge into starting the LeaderOS trial NOW
 * instead of waiting for the webinar date.
 */

const WEBINAR_START = new Date('2026-10-29T10:00:00+01:00');
const WEBINAR_END = new Date('2026-10-29T11:30:00+01:00');

const googleCalendarUrl = () => {
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const details = encodeURIComponent(
    'Live-Webinar: das Leadership Operating System für Führungskräfte.\n\nJoin via LeaderOS: https://leader-os.de/webinar'
  );
  return (
    'https://www.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent('Führe besser. Jeden Tag. · Live-Webinar') +
    `&dates=${fmt(WEBINAR_START)}/${fmt(WEBINAR_END)}` +
    `&details=${details}` +
    '&location=' + encodeURIComponent('Online — LeaderOS')
  );
};

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function WebinarThankYouPage() {
  const [params] = useSearchParams();
  const email = params.get('email');
  // Vom Kommunikations-Check auf /kommunikation: das Framework, das aus den
  // Antworten hervorging — die Danke-Seite spricht die Person damit direkt an.
  const focus = (params.get('focus') || '').slice(0, 40);

  useEffect(() => {
    // Match the light /webinar funnel — force light, restore on leave.
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');

    const restoreMeta = applyPageMeta({
      title: 'Platz gesichert · Live-Webinar · LeaderOS',
      description: 'Dein Platz im kostenlosen LeaderOS Live-Webinar ist reserviert. Zum Kalender hinzufügen und direkt weitermachen.',
      url: 'https://leader-os.de/webinar/danke',
      image: 'https://leader-os.de/og-wlad.jpg',
    });

    // Conversion an Google Ads (Label) und Microsoft (UET) genau einmal pro
    // Anmeldung: Reload der Danke-Seite zählt nicht doppelt. Meta und
    // LinkedIn feuern bereits im Formular (WebinarPage.js).
    try {
      const key = 'lo_webinar_conv_' + (params.get('email') || 'anon');
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        trackGoogleAdsWebinarConversion(key);
        trackBingWebinarLead();
      }
    } catch { /* storage blockiert → Conversion trotzdem einmal senden */
      trackGoogleAdsWebinarConversion();
      trackBingWebinarLead();
    }

    return () => { restoreMeta(); if (wasDark) root.classList.add('dark'); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-background text-foreground min-h-[100dvh] antialiased" data-testid="webinar-thank-you-page">
      <header className="max-w-[1100px] mx-auto px-5 md:px-10 pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" aria-label="LeaderOS Startseite">
          <WladMark size={34} />
          <span className="font-black tracking-tight text-foreground text-[19px]" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>
            Leader<span className="text-brand mx-0.5">·</span>OS
          </span>
        </Link>
      </header>

      <main id="main-content" className="max-w-[820px] mx-auto px-5 md:px-10 pt-14 md:pt-20 pb-24 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="inline-flex w-11 h-11 items-center justify-center bg-brand text-[#0A0A0A] mb-7"
        >
          <Check size={22} strokeWidth={3} />
        </motion.div>

        <motion.h1
          initial="hidden" animate="show" variants={FADE_UP}
          className="text-balance text-[36px] sm:text-[56px] md:text-[68px] leading-[0.95] tracking-[-0.04em] text-foreground max-w-2xl"
          style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
        >
          Platz gesichert<span className="text-brand not-italic">.</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="show" custom={1} variants={FADE_UP}
          className="text-balance mt-6 max-w-xl text-[16px] md:text-[18px] leading-[1.55] text-foreground/70"
        >
          {email ? (
            <>Wir haben <strong className="text-foreground">{email}</strong> vorgemerkt und dir eine Bestätigung geschickt — inklusive Kalender-Link. 24h und 1h vor dem Webinar meldet sich LeaderOS automatisch nochmal.</>
          ) : (
            <>Deine Anmeldung ist bestätigt — check deine Mails. 24h und 1h vor dem Webinar meldet sich LeaderOS automatisch nochmal.</>
          )}
        </motion.p>

        {focus && (
          <motion.p
            initial="hidden" animate="show" custom={2} variants={FADE_UP}
            className="mt-5 inline-flex items-center gap-2.5 border-2 border-brand/50 bg-brand/[0.08] px-4 py-2.5 text-[13px] font-semibold text-foreground"
            data-testid="webinar-thankyou-focus"
          >
            <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-brand">▸ Dein Fokus</span>
            {focus} — genau das nimmt Wlad im Webinar an einem echten Fall auseinander.
          </motion.p>
        )}

        <motion.div initial="hidden" animate="show" custom={2} variants={FADE_UP} className="mt-8">
          <motion.a
            href={googleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="webinar-thankyou-calendar"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className="inline-flex items-center gap-2.5 h-13 px-6 py-3.5 border-2 border-foreground bg-background hover:bg-foreground hover:text-background transition-colors text-[12.5px] font-bold uppercase tracking-[0.14em]"
          >
            <Calendar size={16} /> Zum Kalender hinzufügen
          </motion.a>
        </motion.div>

        {/* Ascension step 1 · the 4-video series is the featured bonus —
            the promise made on /webinar ("schaltest du auf der Bestätigungs-
            seite frei") is kept HERE. One video per day per mail, so the
            registrant arrives at the webinar already warmed up. */}
        <motion.section
          initial="hidden" animate="show" custom={3} variants={FADE_UP}
          className="mt-16 pt-12 border-t-2 border-foreground/12 w-full"
        >
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand mb-4">▸ DEIN TEILNEHMER-BONUS · SCHRITT 1 VON 2</p>
          <h2
            className="text-balance text-[26px] sm:text-[36px] leading-[1.0] tracking-[-0.03em] text-foreground max-w-xl mx-auto"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
          >
            Schalte jetzt die 4-teilige Videoserie frei<span className="text-brand not-italic">.</span>
          </h2>
          <p className="text-balance mt-4 max-w-xl mx-auto text-[15px] leading-[1.6] text-foreground/65">
            Damit du maximal vom Webinar profitierst: „Führung beginnt hier" — vier Videos
            von Wlad, ein Video pro Tag in dein Postfach. Wer die Serie vorher gesehen hat,
            holt aus den 90 Minuten Live-Session doppelt so viel raus.
          </p>

          <ol className="mt-7 max-w-xl mx-auto text-left space-y-2.5">
            {[
              ['Warum die meisten Führungskräfte unsichtbar bleiben', '8 Min'],
              ['Natürliche Autorität — ohne lauter zu werden', '11 Min'],
              ['Weniger arbeiten, mehr bewirken', '9 Min'],
              ['Dein 30-Tage-Plan zur KI-nativen Führungskraft', '12 Min'],
            ].map(([title, duration], i) => (
              <li key={title} className="flex items-center gap-3.5 border-2 border-foreground/10 px-4 py-3">
                <span
                  className="shrink-0 inline-flex w-7 h-7 items-center justify-center bg-brand text-[#0A0A0A] text-[12.5px] font-black"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-[13.5px] font-semibold text-foreground leading-[1.35]">{title}</span>
                <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-foreground/40">{duration}</span>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex justify-center">
            <PlusCircleCTA
              href="/fuehrung-beginnt-hier?utm_source=webinar&utm_medium=thankyou&utm_campaign=webinar-2026-10-29"
              testId="webinar-thankyou-cta-videos"
            >
              Videoserie freischalten · kostenlos
            </PlusCircleCTA>
          </div>
        </motion.section>

        {/* Referral loop · a registrant recommending the webinar to a
            colleague is the cheapest lead source we have. Plain share
            intents, no tracking params beyond utm. */}
        <motion.section
          initial="hidden" animate="show" custom={4} variants={FADE_UP}
          className="mt-14 pt-10 border-t border-foreground/10 w-full"
        >
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] text-brand mb-4">▸ KENNST DU JEMANDEN, DER FÜHREN MUSS?</p>
          <p className="text-balance max-w-xl mx-auto text-[15px] leading-[1.6] text-foreground/65">
            Das Webinar ist kostenlos — und zu zweit diskutiert es sich besser.
            Lade eine Kollegin oder einen Kollegen ein:
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[
              ['WhatsApp', `https://wa.me/?text=${encodeURIComponent('Kostenloses Live-Webinar mit Wlad Jachtchenko (3× SPIEGEL-Bestseller) am 29.10. — Führung täglich trainieren statt einmal im Jahr Seminar: https://leader-os.de/webinar?utm_source=share-whatsapp&utm_medium=referral&utm_campaign=webinar-2026-10-29')}`],
              ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://leader-os.de/webinar?utm_source=share-linkedin&utm_medium=referral&utm_campaign=webinar-2026-10-29')}`],
              ['E-Mail', `mailto:?subject=${encodeURIComponent('Kostenloses Live-Webinar: Führung wird trainiert')}&body=${encodeURIComponent('Hi,\n\nam 29.10. um 10 Uhr zeigt Wlad Jachtchenko (3× SPIEGEL-Bestseller) live, wie Führung täglich trainierbar wird — kostenlos, mit Q&A.\n\nHier anmelden: https://leader-os.de/webinar?utm_source=share-email&utm_medium=referral&utm_campaign=webinar-2026-10-29')}`],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 px-5 border-2 border-foreground/20 hover:border-foreground text-foreground text-[11.5px] font-bold uppercase tracking-[0.14em] transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </motion.section>

        {/* Ascension step 2 · the trial bridge — don't make them wait. */}
        <motion.section
          initial="hidden" animate="show" custom={5} variants={FADE_UP}
          className="mt-14 pt-10 border-t border-foreground/10 w-full"
        >
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.24em] text-foreground/45 mb-4">▸ SCHRITT 2 · WENN DU NICHT WARTEN WILLST</p>
          <p className="text-balance max-w-xl mx-auto text-[15px] leading-[1.6] text-foreground/65">
            Das Webinar ist der Impuls. LeaderOS ist das System, das danach trägt — WladBot als
            24/7-Coach, tägliche Mikro-Drills, dieselbe Methodik. Du kannst deine 14 Tage
            kostenlos schon jetzt starten, ganz ohne auf den Termin zu warten.
          </p>
          <div className="mt-6">
            <a
              href="https://leaderos.de/signup?trial=14&utm_source=webinar&utm_medium=thankyou&utm_campaign=webinar-2026-10-29"
              data-testid="webinar-thankyou-cta-trial"
              className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground/55 hover:text-foreground transition-colors"
            >
              14 Tage kostenlos starten →
            </a>
          </div>
        </motion.section>
      </main>

      <LandingFooter />
    </div>
  );
}
