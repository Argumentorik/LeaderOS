import { useEffect, useRef } from 'react';

/**
 * LabSection · "Über uns" als Beweis-Sektion: das LeaderOS-Lab.
 *
 * Headline (Team-Vorgabe): "Wir liefern Ergebnisse, die Bestand haben."
 * Statt einer Text-Über-uns-Wand: ein swipebarer Karten-Stapel, der zeigt,
 * WORAN das Lab arbeitet — KI-Coach, Simulationen, Kohorten-Daten,
 * Frameworks. Interaktions-Mechanik portiert aus der Nixito-Referenz
 * (gestapelte, rotierte Pastell-Karten; Drag mit Velocity-Throw; Pfeiltasten;
 * aria-live; Karten-Recycling), Farb-/Typo-Ebene an unsere DNA angepasst
 * (Outfit-Display, Mono-Eyebrow, schwarze Pills). Pastell-Tints der
 * Referenz bleiben als Stapel-Signatur erhalten.
 *
 * Kein neues Package: Drag-Physik läuft über Pointer-Events + Web
 * Animations API direkt auf DOM-Refs in einem Effect. Alle Zahlen kanon-
 * geprüft (docs/gtm/WLAD_CANON.md · Kohorte N=240 aus dem Journal).
 */

const CARDS = [
  {
    code: 'LAB-01',
    tint: '#ffffff',
    cover: '/journal/covers/cover-01.webp',
    title: 'WladBot · der KI-Coach',
    line: 'Sparring um 22:47 Uhr, geprüft gegen Wlads Kanon.',
    href: 'https://leaderos.de/signup?trial=14',
    cta: 'Im Trial testen',
  },
  {
    code: 'LAB-02',
    tint: '#ffe8f9',
    cover: '/journal/covers/cover-02.webp',
    title: 'Simulations-Lab',
    line: 'Kündigung, Konflikt, Gehalt: üben, bevor es zählt.',
    href: '/webinar',
    cta: 'Live im Webinar sehen',
  },
  {
    code: 'LAB-03',
    tint: '#e1f1e6',
    cover: '/journal/covers/cover-03.webp',
    title: 'Daten statt Bauchgefühl',
    line: 'Kohorte N=240: Reflex-Zeit im Median von 90 auf 22 Sekunden.',
    href: '/journal/der-ki-sprint-was-dreissig-tage-strukturierte-anwendung-veraendern',
    cta: 'Zur Auswertung',
  },
  {
    code: 'LAB-04',
    tint: '#fffbde',
    cover: '/journal/covers/cover-04.webp',
    title: '11 Frameworks, 13 Bücher',
    line: 'Von SEXIER bis B-W-W — destilliert, nicht erfunden.',
    href: '/journal',
    cta: 'Ins Journal',
  },
];

const STATE_TRANSFORMS = [
  'translate3d(0,0,0) rotate(0deg) scale(1,1)',
  'translate3d(-9.51px,27.07px,0) rotate(1.146deg) scale(.94152,.92391)',
  'translate3d(-8.09px,43.7px,0) rotate(-5.143deg) scale(.88304,.86767)',
  'translate3d(-12.71px,64.35px,0) rotate(8.615deg) scale(.82456,.81022)',
];

const CSS = `
.lab-deck{position:relative;width:min(342px,88vw);height:493px;margin:0 auto}
.lab-card{position:absolute;top:0;left:0;width:min(342px,88vw);height:460px;border-radius:40px;overflow:hidden;background:#fff;
  box-shadow:0 22px 48px rgba(0,0,0,var(--lab-shadow,0));transform-origin:50% 50%;user-select:none;-webkit-user-drag:none;
  transition:transform 430ms cubic-bezier(.22,.78,.2,1),opacity 320ms ease;border:1px solid rgba(0,0,0,.07)}
.lab-card[data-state="0"]{z-index:4;cursor:grab;touch-action:pan-y}
.lab-card[data-state="1"]{z-index:3}
.lab-card[data-state="2"]{z-index:2}
.lab-card[data-state="3"]{z-index:1}
.lab-card.is-dragging{z-index:30;cursor:grabbing;transition:none;will-change:transform}
.lab-card.is-leaving{z-index:30;pointer-events:none;will-change:transform,opacity}
.lab-card.is-recycling{z-index:0;transform:translate3d(-7px,86px,0) rotate(12deg) scale(.72,.7)!important;opacity:0!important;transition:none!important}
.lab-tint{position:absolute;inset:0;z-index:20;border-radius:inherit;pointer-events:none;opacity:1;
  transition:opacity 360ms cubic-bezier(.22,.78,.2,1),background-color 430ms cubic-bezier(.22,.78,.2,1)}
.lab-card[data-state="0"] .lab-tint{opacity:0}
.lab-art{position:absolute;top:0;left:0;width:100%;height:300px;overflow:hidden;background:#0a0a0a}
.lab-art img{width:100%;height:100%;object-fit:cover;display:block;filter:grayscale(35%)}
.lab-code{position:absolute;top:20px;right:20px;display:grid;place-items:center;height:28px;padding:0 12px;border-radius:999px;
  background:rgba(255,255,255,.96);backdrop-filter:blur(5px);font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.14em;font-weight:700}
.lab-copy{position:absolute;left:26px;right:26px;top:322px}
.lab-copy h3{margin:0;font-family:Outfit,sans-serif;font-weight:900;font-style:italic;font-size:23px;line-height:1.2;letter-spacing:-.02em;color:#000}
.lab-copy p{margin:8px 0 0;font-size:14px;line-height:1.5;color:#4b4b4d;max-width:36ch}
.lab-go{position:absolute;right:22px;bottom:20px;display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 18px;border-radius:999px;
  background:#000;color:#fff;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.lab-go:hover{background:#1a1a1a}
.lab-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media (prefers-reduced-motion:reduce){.lab-card,.lab-tint{transition-duration:1ms}}
`;

export const LabSection = () => {
  const deckRef = useRef(null);
  const statusRef = useRef(null);

  useEffect(() => {
    const deck = deckRef.current;
    const status = statusRef.current;
    if (!deck) return undefined;
    const cards = Array.from(deck.querySelectorAll('.lab-card'));
    if (cards.length === 0) return undefined;

    let order = [...cards];
    let drag = null;
    let locked = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const applyStates = () => {
      order.forEach((card, i) => {
        card.dataset.state = String(i);
        if (!card.classList.contains('is-dragging') && !card.classList.contains('is-leaving')) {
          card.style.transform = STATE_TRANSFORMS[i];
        }
        const isTop = i === 0;
        card.tabIndex = isTop ? 0 : -1;
        card.setAttribute('aria-hidden', String(!isTop));
        const link = card.querySelector('.lab-go');
        if (link) link.tabIndex = isTop ? 0 : -1;
      });
    };

    const returnTop = (card, x, y) => {
      locked = true;
      const rotation = Math.max(-12, Math.min(12, x * 0.035));
      const anim = card.animate(
        [
          { transform: `translate3d(${x}px,${y}px,0) rotate(${rotation}deg)` },
          { transform: STATE_TRANSFORMS[0] },
        ],
        { duration: reducedMotion.matches ? 1 : 320, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' }
      );
      anim.finished.finally(() => {
        anim.cancel();
        card.style.transform = STATE_TRANSFORMS[0];
        card.style.removeProperty('--lab-shadow');
        locked = false;
      });
    };

    const throwTop = (card, direction, x, y, restoreFocus) => {
      if (locked || card !== order[0]) return;
      locked = true;
      card.classList.add('is-leaving');
      const rotation = Math.max(-12, Math.min(12, x * 0.035));
      const anim = card.animate(
        [
          { transform: `translate3d(${x}px,${y}px,0) rotate(${rotation}deg)`, opacity: 1 },
          { transform: `translate3d(${direction * 540}px,${y + Math.min(72, Math.abs(x) * 0.16)}px,0) rotate(${direction * 20}deg)`, opacity: 0.18 },
        ],
        { duration: reducedMotion.matches ? 1 : 430, easing: 'cubic-bezier(.2,.72,.18,1)', fill: 'forwards' }
      );
      const oldTop = order[0];
      order = [order[1], order[2], order[3], oldTop];
      applyStates();
      anim.finished.finally(() => {
        oldTop.classList.add('is-recycling');
        anim.cancel();
        oldTop.style.removeProperty('--lab-shadow');
        oldTop.classList.remove('is-leaving');
        // reflow so the recycle state paints before transitioning back in
        oldTop.getBoundingClientRect();
        requestAnimationFrame(() => {
          oldTop.classList.remove('is-recycling');
          oldTop.style.transform = STATE_TRANSFORMS[3];
          window.setTimeout(() => {
            locked = false;
            if (restoreFocus) order[0].focus({ preventScroll: true });
          }, reducedMotion.matches ? 1 : 330);
        });
      });
      if (status) status.textContent = `Karte weggewischt. Nächste: ${order[0].querySelector('h3')?.textContent || ''}`;
    };

    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      e.preventDefault();
      const now = performance.now();
      const dt = Math.max(1, now - drag.lastTime);
      drag.velocityX = drag.velocityX * 0.65 + ((e.clientX - drag.lastX) / dt) * 0.35;
      drag.lastX = e.clientX;
      drag.lastTime = now;
      drag.x = e.clientX - drag.startX;
      drag.y = Math.max(-48, Math.min(48, (e.clientY - drag.startY) * 0.3));
      const rotation = Math.max(-12, Math.min(12, drag.x * 0.035));
      drag.card.style.transform = `translate3d(${drag.x}px,${drag.y}px,0) rotate(${rotation}deg)`;
      drag.card.style.setProperty('--lab-shadow', String(Math.min(0.24, Math.abs(drag.x) / 650)));
    };

    const endDrag = () => {
      if (!drag) return;
      const d = drag;
      if (d.card.hasPointerCapture(d.pointerId)) d.card.releasePointerCapture(d.pointerId);
      d.card.classList.remove('is-dragging');
      deck.removeEventListener('pointermove', onMove);
      deck.removeEventListener('pointerup', onUp);
      deck.removeEventListener('pointercancel', onCancel);
      drag = null;
      return d;
    };

    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const d = endDrag();
      const projected = d.x + d.velocityX * 150;
      const shouldThrow = Math.abs(d.x) >= 76 || (Math.abs(projected) >= 112 && Math.abs(d.x) >= 18);
      if (shouldThrow) throwTop(d.card, Math.sign(d.x || d.velocityX) || 1, d.x, d.y);
      else returnTop(d.card, d.x, d.y);
    };

    const onCancel = (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const d = endDrag();
      returnTop(d.card, d.x, d.y);
    };

    const onDown = (e) => {
      const card = e.currentTarget;
      if (locked || card !== order[0] || e.target.closest('a')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = {
        card,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        x: 0, y: 0, velocityX: 0,
        lastX: e.clientX,
        lastTime: performance.now(),
      };
      card.classList.add('is-dragging');
      card.setPointerCapture(e.pointerId);
      deck.addEventListener('pointermove', onMove);
      deck.addEventListener('pointerup', onUp);
      deck.addEventListener('pointercancel', onCancel);
    };

    const onKey = (e) => {
      if (locked || e.currentTarget !== order[0]) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      throwTop(order[0], e.key === 'ArrowRight' ? 1 : -1, 0, 0, true);
    };

    cards.forEach((card) => {
      card.addEventListener('pointerdown', onDown);
      card.addEventListener('keydown', onKey);
    });
    applyStates();

    return () => {
      cards.forEach((card) => {
        card.removeEventListener('pointerdown', onDown);
        card.removeEventListener('keydown', onKey);
      });
      deck.removeEventListener('pointermove', onMove);
      deck.removeEventListener('pointerup', onUp);
      deck.removeEventListener('pointercancel', onCancel);
    };
  }, []);

  return (
    <section id="lab" className="relative w-full bg-white border-y-2 border-black" aria-label="Über uns · das LeaderOS Lab">
      <style>{CSS}</style>
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-16 md:py-24 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div>
          <p className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.28em] text-brand-strong mb-3 font-mono">
            ▸ ÜBER UNS · DAS LEADEROS LAB
          </p>
          <h2
            className="text-balance leading-[0.95] tracking-[-0.04em] text-black"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(34px, 5.5vw, 64px)' }}
          >
            Wir liefern Ergebnisse, die Bestand haben<span className="text-brand not-italic">.</span>
          </h2>
          <p className="mt-6 text-[15.5px] md:text-[16.5px] leading-[1.65] text-black/70 max-w-[52ch]">
            LeaderOS ist das Lab hinter Wlads Methodik: Hier wird Führungstraining
            gebaut, gemessen und verbessert — mit einem KI-Coach auf geprüftem
            Wissen, Simulationen mit Score und Kohorten-Daten statt
            Seminar-Bauchgefühl. Wische durch die vier Bereiche.
          </p>
          <p className="mt-4 text-[12px] font-mono uppercase tracking-[0.18em] text-black/45">
            ← ziehen oder Pfeiltasten →
          </p>
        </div>

        <div className="lab-deck" ref={deckRef}>
          {CARDS.map((c, i) => (
            <article
              key={c.code}
              className="lab-card"
              data-state={String(i)}
              style={{ transform: STATE_TRANSFORMS[i] }}
              aria-label={`${c.title}. Nach links oder rechts wischen.`}
            >
              <div className="lab-art">
                <img src={c.cover} alt="" loading="lazy" />
                <span className="lab-code">▸ {c.code}</span>
              </div>
              <div className="lab-copy">
                <h3>{c.title}</h3>
                <p>{c.line}</p>
              </div>
              <a className="lab-go" href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                {c.cta}
              </a>
              <span className="lab-tint" style={{ background: c.tint }} aria-hidden="true" />
            </article>
          ))}
          <p className="lab-status" aria-live="polite" ref={statusRef} />
        </div>
      </div>
    </section>
  );
};
