import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LandingFooter } from '../components/landing/LandingFooter';
import { WladMark } from '../components/brand/WladMark';
import { applyPageMeta } from '../lib/pageMeta';
import { trackGoogleAdsWebinarConversion } from '../lib/googleAds';
import { trackBingWebinarLead } from '../lib/bingUet';
import { WEBINAR_CAMPAIGN, WEBINAR_END, WEBINAR_START, WEBINAR_TS } from '../data/webinarEvent';

/**
 * WebinarThankYouPage · /webinar/danke · der Moment direkt nach der Anmeldung.
 *
 * routes/webinar.py verschickt die echte Bestätigung + Erinnerungen; diese
 * Seite führt den Funnel weiter, in drei Schritten:
 *   1. Termin in den Kalender (die Anmeldung wird real).
 *   2. Die 4-teilige Videoserie freischalten (das Versprechen von /webinar).
 *   3. LeaderOS kennenlernen: 14 Tage kostenlos oder erst mal die Kurse ansehen.
 * Dazu die Empfehlung an Kolleginnen und Kollegen, die günstigste Lead-Quelle.
 *
 * `?v=f`: der Lead kam über den Fallback (Supabase-Edge-Function, siehe
 * WebinarPage.js), nicht über das FastAPI-Backend. Dann versprechen wir keine
 * Bestätigungs- oder Erinnerungs-Mails, die niemand verschickt.
 *
 * Gleiche Athletic-Editorial-DNA wie /webinar (frontend/DESIGN.md).
 */

const DATE_SHORT = 'Do 29. Oktober 2026 · 10:00 Uhr · Live';

const googleCalendarUrl = () => {
  const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const details = encodeURIComponent(
    'Live-Webinar: das Leadership Operating System für Führungskräfte.\n\nJoin via LeaderOS: https://leader-os.de/webinar'
  );
  return (
    'https://www.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent('Trainiere Führung. Nicht nur Wissen. · Live-Webinar') +
    `&dates=${fmt(WEBINAR_START)}/${fmt(WEBINAR_END)}` +
    `&details=${details}` +
    '&location=' + encodeURIComponent('Online — LeaderOS')
  );
};

const VIDEOS = [
  ['Warum die meisten Führungskräfte unsichtbar bleiben', '8 Min'],
  ['Natürliche Autorität, ohne lauter zu werden', '11 Min'],
  ['Weniger arbeiten, mehr bewirken', '9 Min'],
  ['Dein 30-Tage-Plan zur KI-nativen Führungskraft', '12 Min'],
];

const SHARE_URL = (src) => `https://leader-os.de/webinar?utm_source=share-${src}&utm_medium=referral&utm_campaign=${WEBINAR_CAMPAIGN}`;
const SHARE = [
  ['WhatsApp', `https://wa.me/?text=${encodeURIComponent(`Kostenloses Live-Webinar mit Wlad Jachtchenko (3× SPIEGEL-Bestseller) am 29.10.: Führung täglich trainieren statt einmal im Jahr Seminar. ${SHARE_URL('whatsapp')}`)}`],
  ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL('linkedin'))}`],
  ['E-Mail', `mailto:?subject=${encodeURIComponent('Kostenloses Live-Webinar: Führung wird trainiert')}&body=${encodeURIComponent(`Hi,\n\nam 29.10. um 10 Uhr zeigt Wlad Jachtchenko (3× SPIEGEL-Bestseller) live, wie Führung täglich trainierbar wird. Kostenlos, mit Q&A.\n\nHier anmelden: ${SHARE_URL('email')}`)}`],
];

const daysLeft = () => Math.max(0, Math.ceil((WEBINAR_TS - Date.now()) / 86400000));
const daysLabel = (d) => (d === 0 ? 'Heute' : d === 1 ? 'Morgen' : `Noch ${d} Tage`);

const Dot = () => <span className="p">.</span>;

export default function WebinarThankYouPage() {
  const [params] = useSearchParams();
  const email = params.get('email');
  // Vom Kommunikations-Check auf /kommunikation: das Framework, das aus den
  // Antworten hervorging. Die Danke-Seite spricht die Person damit direkt an.
  const focus = (params.get('focus') || '').slice(0, 40);
  const viaFallback = params.get('v') === 'f';
  const [days] = useState(daysLeft);

  useEffect(() => {
    // Passend zum hellen /webinar-Funnel: hell erzwingen, beim Verlassen zurück.
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
    <div className="wt" data-testid="webinar-thank-you-page">
      <style>{CSS}</style>

      <main id="main-content">
        {/* ── Bestätigung · Ink, Kalender als erster Schritt ──────────────── */}
        <section className="wt-hero">
          <div className="wrap">
            <Link to="/" className="brand" aria-label="LeaderOS Startseite">
              <WladMark size={28} variant="outline" />
              <span>Leader<span className="dot">·</span>OS</span>
            </Link>

            <p className="bib eyebrow">{DATE_SHORT}</p>
            <h1 className="disp">Platz gesichert<Dot /></h1>
            <p className="lead">
              {viaFallback ? (
                <>
                  {email ? <>Wir haben <strong>{email}</strong> vorgemerkt.</> : <>Deine Anmeldung ist vorgemerkt.</>}{' '}
                  Trag dir den Termin jetzt in den Kalender ein, dann verpasst du den Start nicht.
                </>
              ) : (
                <>
                  {email ? <>Wir haben <strong>{email}</strong> vorgemerkt und dir eine Bestätigung geschickt, inklusive Kalender-Link.</> : <>Deine Anmeldung ist bestätigt, check deine Mails.</>}{' '}
                  24 Stunden und 1 Stunde vor dem Webinar meldet sich LeaderOS automatisch nochmal.
                </>
              )}
            </p>

            {focus && (
              <p className="focus" data-testid="webinar-thankyou-focus">
                <span className="bib">Dein Fokus</span>
                {focus}: genau das nimmt Wlad im Webinar an einem echten Fall auseinander.
              </p>
            )}

            <div className="actions">
              <a href={googleCalendarUrl()} target="_blank" rel="noopener noreferrer" data-testid="webinar-thankyou-calendar" className="pill lime">
                Zum Kalender hinzufügen <span aria-hidden className="arrow">→</span>
              </a>
              <span className="bib mute">{daysLabel(days)} · 90 Minuten · 0 €</span>
            </div>
          </div>
        </section>

        {/* ── Schritt 1 · die Videoserie (das Versprechen von /webinar) ───── */}
        <section className="sec wt-videos">
          <div className="wrap split">
            <figure className="ph">
              <img src="/journal/topics/presence.webp" alt="" loading="lazy" decoding="async" style={{ objectPosition: '50% 40%' }} />
              <figcaption className="bib tag">Fig. 01 · Führung beginnt hier</figcaption>
            </figure>
            <div>
              <p className="bib eyebrow">Dein Teilnehmer-Bonus · Schritt 1 von 2</p>
              <h2 className="disp h2">Vier Videos von Wlad. Jetzt freischalten<Dot /></h2>
              <p className="lead">
                „Führung beginnt hier": ein Video pro Tag in dein Postfach. Wer die Serie vor dem
                Webinar gesehen hat, holt aus den 90 Minuten live doppelt so viel raus.
              </p>
              <ol className="rows">
                {VIDEOS.map(([title, dur], i) => (
                  <li key={title} className="row">
                    <span className="bib code">{String(i + 1).padStart(2, '0')}</span>
                    <span className="txt">{title}</span>
                    <span className="bib dur">{dur}</span>
                  </li>
                ))}
              </ol>
              <p className="actions">
                <Link
                  to={`/fuehrung-beginnt-hier?utm_source=webinar&utm_medium=thankyou&utm_campaign=${WEBINAR_CAMPAIGN}`}
                  data-testid="webinar-thankyou-cta-videos"
                  className="pill ink"
                >
                  Videoserie freischalten · kostenlos <span aria-hidden className="arrow">→</span>
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* ── Schritt 2 · LeaderOS kennenlernen, nicht auf den Termin warten ─ */}
        <section className="sec wt-system cloud">
          <div className="wrap split rev">
            <figure className="ph">
              <img src="/journal/topics/sprint-b.webp" alt="" loading="lazy" decoding="async" style={{ objectPosition: '50% 55%' }} />
              <figcaption className="bib tag">Fig. 02 · Training</figcaption>
            </figure>
            <div>
              <p className="bib eyebrow">Schritt 2 · Wenn du nicht warten willst</p>
              <h2 className="disp h2">Bis zum 29. Oktober: schon mal trainieren<Dot /></h2>
              <p className="lead">
                Das Webinar ist der Impuls. LeaderOS ist das System, das danach trägt: sechs
                Grundlagen-Kurse, vier Master-Programme, elf Framework-Drills, Simulationen und
                WladBot als KI-Coach mit Wlads Methodik. Die ersten 14 Tage sind kostenlos.
              </p>
              <div className="actions">
                <a
                  href={`https://leaderos.de/signup?trial=14&utm_source=webinar&utm_medium=thankyou&utm_campaign=${WEBINAR_CAMPAIGN}`}
                  data-testid="webinar-thankyou-cta-trial"
                  className="pill ink"
                >
                  14 Tage kostenlos starten <span aria-hidden className="arrow">→</span>
                </a>
                <a href="/kurse" target="_blank" rel="noopener" className="bib link">Alle Kurse ansehen ↗</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Empfehlung · die günstigste Lead-Quelle ─────────────────────── */}
        <section className="sec wt-share">
          <div className="wrap narrow">
            <p className="bib eyebrow">Kennst du jemanden, der führen muss?</p>
            <h2 className="disp h2">Zu zweit diskutiert es sich besser<Dot /></h2>
            <p className="lead">Das Webinar ist kostenlos. Lade eine Kollegin oder einen Kollegen ein:</p>
            <div className="actions">
              {SHARE.map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="pill ghost">{label}</a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

/* ── Styles · dieselben Tokens wie /webinar ───────────────────────────── */

const CSS = `
.wt{--ink:#0A0A0A;--cloud:#f5f5f5;--mute:#707072;--stone:#9e9ea0;--hair:#e5e5e5;--lime:#BFFF00;--limeInk:#5A7700;
  --disp:'Outfit','Inter',system-ui,sans-serif;--body:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,'SF Mono',Menlo,monospace;
  background:#fff;color:var(--ink);font-family:var(--body);-webkit-font-smoothing:antialiased;overflow-x:clip}
.wt *,.wt *::before,.wt *::after{box-sizing:border-box}
.wt .wrap{max-width:1280px;margin:0 auto;padding:0 20px}
.wt .wrap.narrow{max-width:860px}
@media(min-width:900px){.wt .wrap{padding:0 40px}}
.wt .sec{padding:clamp(64px,9vw,120px) 0}
.wt .cloud{background:var(--cloud)}
.wt .disp{font-family:var(--disp);font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-.045em;line-height:.9;margin:0;text-wrap:balance}
.wt .disp .p{color:var(--lime);font-style:normal}
.wt .h2{font-size:clamp(36px,5.4vw,78px)}
.wt .bib{font-family:var(--mono);font-size:10.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;line-height:1.6}
.wt .bib.mute{color:var(--mute)}
.wt .bib.link{color:var(--limeInk);text-decoration:none;display:inline-block;padding:6px 0}
.wt .bib.link:hover{color:var(--ink)}
.wt .eyebrow{display:flex;align-items:center;gap:10px;margin:0 0 20px;color:var(--limeInk)}
.wt .eyebrow::before{content:'';flex:none;width:7px;height:7px;border-radius:999px;background:var(--lime);box-shadow:0 0 0 3px rgba(191,255,0,.22)}
.wt .lead{font-size:clamp(16px,1.3vw,19px);line-height:1.55;color:#39393b;max-width:640px;margin:22px 0 0}
.wt .lead strong{color:var(--ink)}
.wt .actions{display:flex;flex-wrap:wrap;align-items:center;gap:14px 24px;margin:30px 0 0}
.wt .brand{display:inline-flex;align-items:center;gap:10px;font-family:var(--disp);font-weight:900;font-size:17px;letter-spacing:-.03em;text-decoration:none;color:#fff;margin-bottom:clamp(40px,8vw,96px)}
.wt .brand .dot{color:var(--lime)}

.wt .pill{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:56px;padding:0 28px;border-radius:999px;border:0;cursor:pointer;
  font-family:var(--body);font-weight:700;font-size:14.5px;letter-spacing:.01em;text-decoration:none;white-space:nowrap;transition:background .25s,color .25s,transform .25s,box-shadow .25s}
.wt .pill .arrow{font-weight:400;transition:transform .25s}
.wt .pill:hover .arrow{transform:translateX(3px)}
.wt .pill:active{transform:scale(.97)}
.wt .pill.ink{background:var(--ink);color:#fff}
.wt .pill.ink:hover{background:var(--lime);color:var(--ink)}
.wt .pill.lime{background:var(--lime);color:var(--ink)}
.wt .pill.lime:hover{background:#fff}
.wt .pill.ghost{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1.5px rgba(10,10,10,.25);height:48px;padding:0 22px}
.wt .pill.ghost:hover{box-shadow:inset 0 0 0 1.5px var(--ink)}

.wt-hero{background:var(--ink);color:#fff;padding:28px 0 clamp(64px,9vw,120px)}
.wt-hero .eyebrow{color:var(--lime)}
.wt-hero h1{font-size:clamp(52px,11vw,132px);color:#fff}
.wt-hero .lead{color:rgba(255,255,255,.8)}
.wt-hero .lead strong{color:#fff}
.wt-hero .focus{margin:22px 0 0;max-width:640px;padding:16px 0 0;border-top:1px solid rgba(255,255,255,.18);font-size:15px;line-height:1.5;color:rgba(255,255,255,.85)}
.wt-hero .focus .bib{display:block;color:var(--lime);margin-bottom:6px}
.wt-hero .bib.mute{color:rgba(255,255,255,.55)}

.wt .split{display:grid;gap:36px}
@media(min-width:900px){.wt .split{grid-template-columns:5fr 7fr;gap:clamp(48px,6vw,96px);align-items:center}.wt .split.rev{grid-template-columns:7fr 5fr}.wt .split.rev>.ph{order:2}}
.wt .ph{position:relative;overflow:hidden;margin:0;background:var(--cloud);aspect-ratio:4/3}
@media(min-width:900px){.wt .ph{aspect-ratio:4/5}}
.wt .ph img{display:block;width:100%;height:100%;object-fit:cover;transition:transform 1.2s cubic-bezier(.2,.8,.2,1)}
.wt .ph:hover img{transform:scale(1.03)}
.wt .ph .tag{position:absolute;left:14px;bottom:14px;margin:0;padding:7px 11px;background:rgba(10,10,10,.78);color:#fff;letter-spacing:.16em}

.wt .rows{list-style:none;margin:28px 0 0;padding:0;border-top:1px solid var(--hair)}
.wt .row{display:grid;grid-template-columns:40px 1fr auto;gap:12px 16px;padding:16px 0;border-bottom:1px solid var(--hair);align-items:baseline}
.wt .row .code{color:var(--limeInk)}
.wt .row .txt{font-size:15.5px;line-height:1.45;font-weight:600;color:var(--ink)}
.wt .row .dur{color:var(--stone);white-space:nowrap}
`;
