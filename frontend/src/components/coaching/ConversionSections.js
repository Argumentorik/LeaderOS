import { useState } from 'react';
import { XCircle, ArrowDown, ArrowRight, Check, X } from 'lucide-react';
import { WladBotAvatar } from '../brand/WladBotAvatar';

/* Iter 92.60 — /coaching als Conversion-Engine (Hormozi-Formel):
   Hook → Agitate → Vision → Mechanism → Proof → Value → Risk Reversal → Identity Close */

const H2 = ({ children }) => (
  <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-center">{children}</h2>
);

/* ── 1b. ATF Score-Teaser — "unfinished profile" hook (Hero rechts) ── */
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
          <span className="px-2 py-0.5 rounded-md bg-[#BFFF00]/12 border border-[#BFFF00]/25 text-[8.5px] font-black tracking-wider text-[#BFFF00]">LIVE</span>
        </div>

        <div className="flex items-end gap-3 mb-6">
          <p className="text-6xl font-black text-white tabular-nums leading-none">62<span className="text-2xl text-white/40">%</span></p>
          <div className="pb-1">
            <p className="text-[11px] font-bold text-white">Leadership Score</p>
            <p className="text-[10px] text-emerald-400 font-bold">▲ +9 {de ? 'diesen Monat' : 'this month'}</p>
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
          {/* Locked rows — unfinished-progress psychology */}
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
              <button onClick={onCta} className="px-4 h-9 rounded-full bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[11px] font-black shadow-lg shadow-[#BFFF00]/30 transition-all hover:scale-[1.04] active:scale-[0.96]" data-testid="score-teaser-unlock">
                🔒 {de ? 'Vollständiges Profil freischalten' : 'Unlock complete profile'}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-5 pt-4 border-t border-white/[0.07] text-[10px] text-white/35 text-center">
          {de ? 'Dein Dashboard ist nicht statisch — es kennt dich bereits.' : 'Your dashboard isn\'t static — it already knows you.'}
        </p>
      </div>
    </div>
  );
};

/* ── 2. Der Preis des Bleibens ── */
export const CostSection = ({ de }) => {
  const items = de
    ? ['Schwierige Gespräche werden noch schwieriger', 'Dein Team verliert leise das Vertrauen', 'Beförderungen gehen an die Lauteren', 'Der Stress kommt mit nach Hause', 'Du hinterfragst dich selbst — immer öfter']
    : ['Hard conversations get harder', 'Your team quietly loses confidence', 'Promotions go to louder people', 'Stress follows you home', 'You second-guess yourself — more and more'];
  return (
    <section className="space-y-8" data-testid="cost-section">
      <H2>{de ? <>Was kostet es dich, <span className="gradient-text">zu bleiben, wo du bist?</span></> : <>What is staying where you are <span className="gradient-text">costing you?</span></>}</H2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {items.map((t, i) => (
          <div key={t} className={`flex items-start gap-3 p-4 rounded-2xl border border-red-500/15 bg-red-500/[0.03] hover:border-red-500/30 transition-colors ${i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
            <XCircle size={16} className="text-red-500/70 shrink-0 mt-0.5" />
            <p className="text-[13px] font-semibold leading-snug">{t}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-muted-foreground text-[15px] max-w-md mx-auto leading-relaxed">
        {de ? <>Nichts davon passiert über Nacht.<br /><span className="font-bold text-foreground">Es passiert ein Gespräch nach dem anderen.</span></> : <>None of this happens overnight.<br /><span className="font-bold text-foreground">It happens one conversation at a time.</span></>}
      </p>
    </section>
  );
};

/* ── 3. Identity Shift ── */
export const IdentityShift = ({ de }) => {
  const steps = de
    ? [{ k: 'Heute', v: 'Du managst Menschen.' }, { k: 'Morgen', v: 'Menschen vertrauen dir.' }, { k: 'Irgendwann', v: 'Menschen folgen dir.' }, { k: 'Am Ende', v: 'Menschen werden Leader — wegen dir.' }]
    : [{ k: 'Today', v: 'You manage people.' }, { k: 'Tomorrow', v: 'People trust you.' }, { k: 'Eventually', v: 'People follow you.' }, { k: 'Finally', v: 'People become leaders because of you.' }];
  return (
    <section className="py-4" data-testid="identity-shift">
      <div className="max-w-2xl mx-auto space-y-1 text-center">
        {steps.map((s, i) => (
          <div key={s.k}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground/60 mb-1">{s.k}</p>
            <p className={`font-black tracking-tight leading-tight ${i === 3 ? 'text-3xl sm:text-4xl gradient-text' : 'text-2xl sm:text-3xl'}`}>{s.v}</p>
            {i < 3 && <ArrowDown size={18} className="mx-auto my-3 text-[#BFFF00]" />}
          </div>
        ))}
        <p className="pt-6 text-[13px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{de ? 'Das ist Transformation.' : 'This is transformation.'}</p>
      </div>
    </section>
  );
};

/* ── 4. Warum Kurse scheitern ── */
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
          {(de ? ['Üben — mit KI-Gegenüber', 'Feedback nach Wlads Frameworks', 'Wiederholen, bis es sitzt', 'Gewohnheiten aufbauen', 'Der Leader werden'] : ['Practice — with an AI counterpart', 'Feedback via Wlad\'s frameworks', 'Repeat until it sticks', 'Build habits', 'Become the leader']).map((t, i) => (
            <div key={t} className={`flex items-center gap-2.5 text-[13.5px] ${i === 4 ? 'font-black' : 'font-medium'}`}><Check size={13} className="text-[#6B8A00] dark:text-[#BFFF00]" strokeWidth={3} /> {t}</div>
          ))}
        </div>
        <p className="mt-5 text-[12px] font-bold">{de ? 'Leader-OS trainiert Verhalten.' : 'Leader-OS trains behavior.'}</p>
      </div>
    </div>
  </section>
);

/* ── 7. The Engine ── */
export const EngineLoop = ({ de }) => {
  const steps = de
    ? ['Lernen', 'Üben', 'KI-Feedback', 'Simulation', 'Reflexion', 'Praxis']
    : ['Learn', 'Practice', 'AI Feedback', 'Simulation', 'Reflection', 'Real World'];
  return (
    <section className="space-y-8" data-testid="engine-loop">
      <H2>{de ? <>So funktioniert <span className="gradient-text">die Maschine</span></> : <>How <span className="gradient-text">the engine</span> works</>}</H2>
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
        <p className="relative text-center text-[11px] font-black uppercase tracking-[0.24em] text-[#BFFF00]/70 mt-6">↻ {de ? 'Wiederholen — jeden Tag' : 'Repeat — every day'}</p>
      </div>
    </section>
  );
};

/* ── 5. Montagmorgen ── */
export const MondayMorning = ({ de }) => {
  const rows = de
    ? [['Statt zu überlegen, was du sagen sollst …', 'weißt du es schon.'], ['Statt Konflikten auszuweichen …', 'löst du sie ruhig.'], ['Statt auf Respekt zu hoffen …', 'bekommst du ihn — ganz natürlich.']]
    : [['Instead of wondering what to say …', 'you already know.'], ['Instead of avoiding conflict …', 'you handle it calmly.'], ['Instead of hoping for respect …', 'you get it — naturally.']];
  return (
    <section className="space-y-8" data-testid="monday-morning">
      <H2>{de ? <>Stell dir <span className="gradient-text">Montagmorgen</span> vor.</> : <>Imagine <span className="gradient-text">Monday morning</span>.</>}</H2>
      <div className="max-w-xl mx-auto space-y-4">
        {rows.map(([a, b]) => (
          <div key={a} className="text-center">
            <p className="text-[15px] text-muted-foreground">{a}</p>
            <p className="text-[17px] font-black">{b}</p>
          </div>
        ))}
        <p className="text-center pt-2 text-[13px] font-bold uppercase tracking-[0.16em] text-[#4A6200] dark:text-[#BFFF00]">{de ? 'Genau das trainiert Leader-OS.' : 'That is what Leader-OS trains.'}</p>
      </div>
    </section>
  );
};

/* ── 6. Proof — große Zahlen ── */
export const ProofNumbers = ({ de }) => {
  const nums = de
    ? [['140.000+', 'Trainierte Leadership-Entscheidungen'], ['82 %', 'Fühlen sich sicherer in Gesprächen'], ['94 %', 'Empfehlen Leader-OS weiter'], ['4,9 ★', 'Durchschnittliche Bewertung']]
    : [['140,000+', 'Leadership decisions practiced'], ['82%', 'Feel more confident'], ['94%', 'Recommend Leader-OS'], ['4.9★', 'Average rating']];
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="proof-numbers">
      {nums.map(([n, l]) => (
        <div key={l} className="text-center p-5 rounded-2xl border border-black/[0.05] dark:border-white/[0.06] bg-white/60 dark:bg-card/40 hover:-translate-y-0.5 transition-transform">
          <p className="text-3xl sm:text-4xl font-black gradient-text tabular-nums">{n}</p>
          <p className="text-[11px] font-semibold text-muted-foreground mt-1.5 leading-snug">{l}</p>
        </div>
      ))}
    </section>
  );
};

/* ── 10a. Value vor Preis ── */
export const ValueIntro = ({ de }) => {
  const rows = de
    ? [['Beförderung', '+12.000 €/Jahr'], ['Klarere Kommunikation', '20 Std. gespart/Monat'], ['Weniger Konflikte', 'Weniger Stress — messbar'], ['Selbstvertrauen', 'Karriere, die dir folgt']]
    : [['Promotion', '+€12,000/year'], ['Clearer communication', '20 hrs saved/month'], ['Less conflict', 'Measurably less stress'], ['Confidence', 'A career that follows you']];
  return (
    <div className="space-y-6 mb-10" data-testid="value-intro">
      <H2>{de ? <>Was zahlt bessere Führung <span className="gradient-text">wirklich</span>?</> : <>What does better leadership <span className="gradient-text">actually pay</span>?</>}</H2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {rows.map(([k, v]) => (
          <div key={k} className="p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.06] bg-white/60 dark:bg-card/40 text-center">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{k}</p>
            <p className="text-[15px] font-black mt-1">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CoffeeLine = ({ de }) => (
  <p className="text-center mt-8 text-[15px] text-muted-foreground" data-testid="coffee-line">
    {de ? <>Das ist <span className="font-black text-foreground">weniger als 2,73 € pro Tag</span> — dein Kaffee kostet mehr.</> : <>That&rsquo;s <span className="font-black text-foreground">less than €2.73 a day</span> — your coffee costs more.</>}
  </p>
);

/* ── 11. Vergleich Ohne/Mit ── */
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

/* ── 12. ROI-Rechner ── */
export const RoiCalculator = ({ de }) => {
  const [team, setTeam] = useState(15);
  const conversations = Math.round(team * 0.8);
  const hours = Math.round(conversations * 1.5);
  const value = hours * 95;
  const monthly = 83; // 997€ / 12
  const roi = Math.round((value / monthly) * 100);
  return (
    <section className="space-y-8" data-testid="roi-calculator">
      <H2>{de ? <>Rechne es <span className="gradient-text">selbst</span> aus.</> : <>Do the <span className="gradient-text">math</span> yourself.</>}</H2>
      <div className="max-w-xl mx-auto rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-7 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12px] font-bold text-white/70">{de ? 'Wie viele Menschen führst du?' : 'How many people do you lead?'}</label>
            <span className="text-xl font-black text-[#BFFF00] tabular-nums">{team}</span>
          </div>
          <input
            type="range" min="3" max="50" value={team}
            onChange={(e) => setTeam(parseInt(e.target.value))}
            className="w-full accent-[#BFFF00] cursor-pointer"
            data-testid="roi-slider"
          />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            [conversations, de ? 'Schwierige Gespräche/Monat' : 'Hard conversations/mo'],
            [`${hours} h`, de ? 'Stunden Reibungsverlust' : 'Hours lost to friction'],
            [`${value.toLocaleString('de-DE')} €`, de ? 'Wert zurückgewonnen/Monat' : 'Value recovered/mo'],
          ].map(([v, l]) => (
            <div key={l} className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <p className="text-lg font-black text-white tabular-nums">{v}</p>
              <p className="text-[9.5px] text-white/40 font-semibold mt-0.5 leading-tight">{l}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]">
          <div>
            <p className="text-[11px] text-white/40 font-semibold">Leader-OS</p>
            <p className="text-[15px] font-black text-white">{monthly} €<span className="text-[11px] text-white/40 font-semibold">/{de ? 'Monat' : 'mo'}</span></p>
          </div>
          <ArrowRight size={16} className="text-white/30" />
          <div className="text-right">
            <p className="text-[11px] text-white/40 font-semibold">ROI</p>
            <p className="text-2xl font-black text-[#BFFF00] tabular-nums" data-testid="roi-value">{roi.toLocaleString('de-DE')} %</p>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── 13. Risk Reversal ── */
export const RiskReversal = ({ de, onCta }) => (
  <section className="text-center space-y-5 py-4" data-testid="risk-reversal">
    <H2>{de ? <>Teste <span className="gradient-text">alles.</span></> : <>Try <span className="gradient-text">everything.</span></>}</H2>
    <p className="text-[15px] text-muted-foreground max-w-md mx-auto leading-relaxed">
      {de
        ? <>Wenn Leader-OS nicht dein Leadership-Betriebssystem wird: <span className="font-bold text-foreground">30 Tage Geld-zurück.</span><br />Keine Fragen. Keine Verträge. Keine peinlichen E-Mails.</>
        : <>If Leader-OS doesn&rsquo;t become your leadership operating system: <span className="font-bold text-foreground">30-day money-back.</span><br />No questions. No contracts. No awkward emails.</>}
    </p>
    <button onClick={onCta} className="px-6 h-11 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[13.5px] font-bold shadow-lg shadow-[#BFFF00]/20 transition-all hover:scale-[1.02] active:scale-[0.97]" data-testid="risk-reversal-cta">
      {de ? 'Risikofrei starten →' : 'Start risk-free →'}
    </button>
  </section>
);

/* ── Secret Section: Behavioral Personalization (nur Free-Tier) ── */
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
                ? <>du hast bereits <span className="font-black text-[#BFFF00]">{xp} XP</span> in deine Führung investiert. Jeder Check-in, jede Session — alles zahlt auf den Leader ein, der du wirst.<br /><span className="font-bold text-white">Hör jetzt nicht auf.</span> Leadership OS schaltet alles frei, worauf du hinarbeitest.</>
                : <>you&rsquo;ve already invested <span className="font-black text-[#BFFF00]">{xp} XP</span> into your leadership. Every check-in, every session — it all counts toward the leader you&rsquo;re becoming.<br /><span className="font-bold text-white">Don&rsquo;t stop now.</span> Leadership OS unlocks everything you&rsquo;ve been working toward.</>}
            </p>
            <button onClick={onCta} className="mt-4 px-5 h-10 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[12.5px] font-bold shadow-lg shadow-[#BFFF00]/25 transition-all hover:scale-[1.02] active:scale-[0.97]" data-testid="personal-block-cta">
              {de ? 'Alles freischalten →' : 'Unlock everything →'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── 15. Final Emotional Close ── */
export const FinalClose = ({ de, onCta }) => (
  <section className="text-center space-y-6 py-8" data-testid="final-close">
    <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
      {de ? <>In einem Jahr <span className="gradient-text">ab heute …</span></> : <>One year <span className="gradient-text">from today …</span></>}
    </h2>
    <p className="text-[16px] text-muted-foreground max-w-lg mx-auto leading-relaxed">
      {de
        ? <>… hast du entweder hunderte bessere Gespräche geführt.<br />Oder <span className="font-bold text-foreground">exakt dieselben wie heute.</span></>
        : <>… you&rsquo;ll either have had hundreds of better conversations.<br />Or <span className="font-bold text-foreground">the exact same ones.</span></>}
    </p>
    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground">{de ? 'Die Entscheidung beginnt heute.' : 'The choice starts today.'}</p>
    <button onClick={onCta} className="px-8 h-13 py-3.5 rounded-2xl bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] text-[15px] font-black shadow-xl shadow-[#BFFF00]/25 transition-all hover:scale-[1.03] active:scale-[0.97]" data-testid="final-close-cta">
      {de ? 'Werde der Leader, an den man sich erinnert →' : 'Become the leader people remember →'}
    </button>
  </section>
);
