import { ArrowRight, Check, X, Lock } from 'lucide-react';
import { WladBotAvatar } from '../brand/WladBotAvatar';

/* /coaching — product-first sections. No invented metrics, no fake proof,
   no hype copy. Every claim here is either a product fact or clearly an example. */

const H2 = ({ children }) => (
  <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-center">{children}</h2>
);

/* ── ATF Score-Teaser — clearly labeled example of the product dashboard ── */
export const ScoreTeaser = ({ de, onCta }) => {
  const dims = de
    ? [['Kommunikation', 71, '#BFFF00'], ['Entscheidungsstärke', 58, '#34d399'], ['Konfliktlösung', 43, '#f59e0b']]
    : [['Communication', 71, '#BFFF00'], ['Decision Making', 58, '#34d399'], ['Conflict Resolution', 43, '#f59e0b']];
  return (
    <div className="relative hidden lg:flex items-center justify-center" data-testid="hero-score-teaser">
      <div aria-hidden className="absolute inset-8 bg-gradient-to-br from-[#BFFF00]/[0.16] via-transparent to-emerald-500/[0.10] rounded-[3rem] blur-3xl pointer-events-none" />
      <div className="relative w-[380px] rounded-[28px] border border-white/[0.09] bg-gradient-to-b from-[#141414] to-[#0B0B0B] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] p-7 rotate-[1.5deg] hover:rotate-0 transition-transform duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <WladBotAvatar size={30} live />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">{de ? 'Dein Leadership-Profil' : 'Your leadership profile'}</p>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.12] text-[8.5px] font-black tracking-wider text-white/50">{de ? 'BEISPIEL' : 'EXAMPLE'}</span>
        </div>

        <div className="flex items-end gap-3 mb-6">
          <p className="text-6xl font-black text-white tabular-nums leading-none">62<span className="text-2xl text-white/40">%</span></p>
          <div className="pb-1">
            <p className="text-[11px] font-bold text-white">Leadership Score</p>
            <p className="text-[10px] text-white/40 font-semibold">{de ? 'aus deinen Sessions berechnet' : 'computed from your sessions'}</p>
          </div>
        </div>

        <div className="space-y-3.5">
          {dims.map(([label, val, color]) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-white/60">{label}</span>
                <span className="text-[11px] font-black text-white tabular-nums">{val}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${val}%`, background: color, boxShadow: `0 0 8px ${color}66` }} />
              </div>
            </div>
          ))}
          <div className="relative pt-1">
            <div className="space-y-3.5 blur-[5px] select-none opacity-60" aria-hidden>
              {[[de ? 'Delegation' : 'Delegation', 66], [de ? 'Strategisches Denken' : 'Strategic Thinking', 51]].map(([l, v]) => (
                <div key={l}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-white/60">{l}</span>
                    <span className="text-[11px] font-black text-white">{v}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-white/30" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <button onClick={onCta} className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[11px] font-black shadow-lg shadow-[#BFFF00]/30 transition-all hover:scale-[1.04] active:scale-[0.96]" data-testid="score-teaser-unlock">
                <Lock size={11} strokeWidth={2.8} /> {de ? 'Vollständiges Profil freischalten' : 'Unlock complete profile'}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-5 pt-4 border-t border-white/[0.07] text-[10px] text-white/35 text-center">
          {de ? 'Beispielansicht — dein Profil entsteht aus deinen echten Sessions.' : 'Example view — your profile is built from your real sessions.'}
        </p>
      </div>
    </div>
  );
};

/* ── Warum Kurse scheitern — factual product contrast ── */
export const WhyCoursesFail = ({ de }) => (
  <section className="space-y-8" data-testid="why-courses-fail">
    <H2>{de ? <>Warum die meisten Leadership-Kurse <span className="text-red-500">scheitern</span></> : <>Why most leadership courses <span className="text-red-500">fail</span></>}</H2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
      <div className="p-6 rounded-3xl border border-black/[0.06] dark:border-white/[0.07] bg-white/60 dark:bg-card/40">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-4">{de ? 'Die meisten Kurse' : 'Most courses'}</p>
        <div className="space-y-3">
          {(de ? ['Videos anschauen', 'Notizen machen', 'Alles wieder vergessen'] : ['Watch videos', 'Take notes', 'Forget everything']).map((t) => (
            <div key={t} className="flex items-center gap-2.5 text-[13.5px] text-muted-foreground"><X size={13} className="text-red-500/70" /> {t}</div>
          ))}
        </div>
        <p className="mt-5 text-[12px] text-muted-foreground italic">{de ? 'Kurse vermitteln Information.' : 'Courses teach information.'}</p>
      </div>
      <div className="p-6 rounded-3xl border border-[#BFFF00]/30 bg-[#BFFF00]/[0.04] shadow-[0_16px_40px_-20px_rgba(191,255,0,0.3)]">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#4A6200] dark:text-[#BFFF00] mb-4">Leader-OS</p>
        <div className="space-y-3">
          {(de ? ['Üben — mit KI-Gegenüber', 'Feedback nach Wlads Frameworks', 'Wiederholen, bis es sitzt', 'Gewohnheiten aufbauen'] : ['Practice — with an AI counterpart', 'Feedback via Wlad\'s frameworks', 'Repeat until it sticks', 'Build habits']).map((t) => (
            <div key={t} className="flex items-center gap-2.5 text-[13.5px] font-medium"><Check size={13} className="text-[#6B8A00] dark:text-[#BFFF00]" strokeWidth={3} /> {t}</div>
          ))}
        </div>
        <p className="mt-5 text-[12px] font-bold">{de ? 'Leader-OS trainiert Verhalten.' : 'Leader-OS trains behavior.'}</p>
      </div>
    </div>
  </section>
);

/* ── The Engine — the actual product loop ── */
export const EngineLoop = ({ de }) => {
  const steps = de
    ? ['Lernen', 'Üben', 'KI-Feedback', 'Simulation', 'Reflexion', 'Praxis']
    : ['Learn', 'Practice', 'AI Feedback', 'Simulation', 'Reflection', 'Real World'];
  return (
    <section className="space-y-8" data-testid="engine-loop">
      <H2>{de ? <>So arbeitet <span className="gradient-text">Leader-OS</span></> : <>How <span className="gradient-text">Leader-OS</span> works</>}</H2>
      <div className="relative max-w-3xl mx-auto rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-8 overflow-hidden">
        <div aria-hidden className="absolute -top-16 left-1/2 -translate-x-1/2 h-40 w-72 rounded-full bg-[#BFFF00]/[0.08] blur-[60px] pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-center gap-2.5">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2.5">
              <span className="px-4 py-2.5 rounded-full border border-[#BFFF00]/25 bg-[#BFFF00]/[0.07] text-[13px] font-bold text-white whitespace-nowrap">{s}</span>
              {i < steps.length - 1 && <ArrowRight size={13} className="text-[#BFFF00]/60" />}
            </div>
          ))}
        </div>
        <p className="relative text-center text-[11px] font-black uppercase tracking-[0.24em] text-[#BFFF00]/70 mt-6">{de ? 'Wiederholen — jeden Tag' : 'Repeat — every day'}</p>
      </div>
    </section>
  );
};

/* ── Vergleich Ohne/Mit — factual product contrast ── */
export const ComparisonTable = ({ de }) => {
  const rows = de
    ? [['Gespräche erraten', 'Gespräche vorher üben'], ['Leadership-Bücher lesen', 'Leadership-Gewohnheiten aufbauen'], ['Hoffen, dass Meetings gut laufen', 'Vorbereitet reingehen'], ['Emotional reagieren', 'Strategisch antworten'], ['Theorie lernen', 'Echte Skills aufbauen']]
    : [['Guess conversations', 'Practice them first'], ['Read leadership books', 'Build leadership habits'], ['Hope meetings go well', 'Walk in prepared'], ['React emotionally', 'Respond strategically'], ['Learn theory', 'Build real skill']];
  return (
    <section className="space-y-8" data-testid="comparison-table">
      <H2>{de ? <>Ohne vs. <span className="gradient-text">mit Leader-OS</span></> : <>Without vs. <span className="gradient-text">with Leader-OS</span></>}</H2>
      <div className="max-w-2xl mx-auto rounded-3xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden">
        <div className="grid grid-cols-2 bg-black/[0.03] dark:bg-white/[0.03] text-[10px] font-black uppercase tracking-[0.16em]">
          <div className="px-5 py-3 text-muted-foreground">{de ? 'Ohne Leader-OS' : 'Without Leader-OS'}</div>
          <div className="px-5 py-3 text-[#4A6200] dark:text-[#BFFF00]">{de ? 'Mit Leader-OS' : 'With Leader-OS'}</div>
        </div>
        {rows.map(([a, b]) => (
          <div key={a} className="grid grid-cols-2 border-t border-black/[0.04] dark:border-white/[0.05] text-[13px]">
            <div className="px-5 py-3.5 text-muted-foreground flex items-center gap-2"><X size={12} className="text-red-500/60 shrink-0" /> {a}</div>
            <div className="px-5 py-3.5 font-semibold flex items-center gap-2 bg-[#BFFF00]/[0.03]"><Check size={12} className="text-[#6B8A00] dark:text-[#BFFF00] shrink-0" strokeWidth={3} /> {b}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ── Risk Reversal — real, verifiable guarantee ── */
export const RiskReversal = ({ de, onCta }) => (
  <section className="text-center space-y-5 py-4" data-testid="risk-reversal">
    <H2>{de ? <>Teste <span className="gradient-text">alles.</span></> : <>Try <span className="gradient-text">everything.</span></>}</H2>
    <p className="text-[15px] text-muted-foreground max-w-md mx-auto leading-relaxed">
      {de
        ? <><span className="font-bold text-foreground">30 Tage Geld-zurück.</span><br />Keine Fragen, keine Verträge — eine E-Mail genügt.</>
        : <><span className="font-bold text-foreground">30-day money-back.</span><br />No questions, no contracts — one email is enough.</>}
    </p>
    <button onClick={onCta} className="px-6 h-11 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[13.5px] font-bold shadow-lg shadow-[#BFFF00]/20 transition-all hover:scale-[1.02] active:scale-[0.97]" data-testid="risk-reversal-cta">
      {de ? 'Risikofrei starten' : 'Start risk-free'}
    </button>
  </section>
);

/* ── Personalization (Free-Tier only) — based on the user's real XP ── */
export const PersonalBlock = ({ de, user, onCta }) => {
  if (!user) return null;
  const firstName = (user.name || '').split(' ')[0] || 'Leader';
  const xp = user.xp || 0;
  return (
    <section className="max-w-xl mx-auto" data-testid="personal-block">
      <div className="relative rounded-3xl border border-[#BFFF00]/25 bg-[#0A0A0A] p-7 overflow-hidden">
        <div aria-hidden className="absolute -top-14 -right-8 h-36 w-36 rounded-full bg-[#BFFF00]/[0.12] blur-[50px] pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <WladBotAvatar size={48} live />
          <div className="flex-1">
            <p className="text-xl font-black text-white">{firstName},</p>
            <p className="text-[14px] text-white/60 leading-relaxed mt-2">
              {de
                ? <>du hast bereits <span className="font-black text-[#BFFF00]">{xp} XP</span> in deine Führung investiert. Das Leadership OS schaltet Simulationen, Frameworks und den Coach ohne Limit frei.</>
                : <>you&rsquo;ve already invested <span className="font-black text-[#BFFF00]">{xp} XP</span> into your leadership. Leadership OS unlocks simulations, frameworks and the coach without limits.</>}
            </p>
            <button onClick={onCta} className="mt-4 px-5 h-10 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[12.5px] font-bold shadow-lg shadow-[#BFFF00]/25 transition-all hover:scale-[1.02] active:scale-[0.97]" data-testid="personal-block-cta">
              {de ? 'Alles freischalten' : 'Unlock everything'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

