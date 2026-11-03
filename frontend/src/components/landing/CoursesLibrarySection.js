import { useState } from 'react';
import { ArrowUpRight, ChevronRight, Lock, Play } from 'lucide-react';
import { COURSES, COURSE_ACCESS, COURSE_TRIAL_URL, FRAMEWORK_DRILLS } from '../../data/leaderOsCourses';

/**
 * CoursesLibrarySection · die Kurs-Bibliothek als Streaming-Fenster.
 *
 * Visuelle Sprache aus der visionOS-Vorlage (Glasfenster über unscharfem
 * Foto, Pill-Chrome, helle Typo), in Markenfarben: schwarzer Grund, Lime-
 * Akzent, mono BIB-Codes statt Icon-Suppe. Das Fenster selbst trägt KEIN
 * backdrop-filter, damit die Panels darin das Hintergrundfoto wirklich
 * frosten (ein backdrop-filter am Fenster macht es zum Backdrop-Root).
 *
 * Inhalt: data/leaderOsCourses.js (App-Katalog, 6 Grundlagen + 4 Master).
 * Keine Laufzeiten, keine Folgenzahlen, keine Zähler.
 */

const GROUPS = [
  { id: 'basics', label: 'Grundlagen', count: COURSES.filter((c) => c.group === 'basics').length },
  { id: 'master', label: 'Master-Programme', count: COURSES.filter((c) => c.group === 'master').length },
];

const track = (event, props = {}) => {
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try { window.posthog.capture(event, { surface: 'leader-os', funnel: 'course-library', ...props }); } catch {}
  }
};

const glass = 'bg-white/[0.10] backdrop-blur-xl border border-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]';

export const CoursesLibrarySection = ({ id = 'kurse', placement = 'landing', heading = true }) => {
  const [group, setGroup] = useState('basics');
  const list = COURSES.filter((c) => c.group === group);
  const [selId, setSelId] = useState(list[0].id);
  const sel = COURSES.find((c) => c.id === selId) || list[0];
  const isMaster = sel.group === 'master';

  const pickGroup = (g) => {
    setGroup(g);
    setSelId(COURSES.find((c) => c.group === g).id);
    track('course_tab', { placement, group: g });
  };
  const pickCourse = (c) => {
    setSelId(c.id);
    track('course_select', { placement, course: c.id });
  };

  return (
    <section
      id={id}
      aria-label="Kurs-Bibliothek in LeaderOS"
      data-testid="courses-library"
      className="relative isolate w-full overflow-hidden bg-[#0A0A0A] text-white border-y-2 border-black"
    >
      {/* Unscharfer „Raum“ hinter dem Glas */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-center scale-110 blur-[26px] opacity-70 transition-[background-image] duration-500"
        style={{ backgroundImage: `url(${sel.photo})` }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_85%_0%,rgba(191,255,0,0.14),transparent_70%),linear-gradient(180deg,rgba(10,10,10,0.55),rgba(10,10,10,0.82))]" />

      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 md:px-10 py-16 md:py-24">
        {heading && (
          <div className="max-w-3xl mb-9 md:mb-12">
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.28em] text-[#BFFF00] mb-4">
              ▸ KURS-BIBLIOTHEK · IM SYSTEM
            </p>
            <h2
              className="text-[34px] sm:text-[48px] md:text-[62px] leading-[0.95] tracking-[-0.035em]"
              style={{ fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}
            >
              Die Kurse sind <span className="text-white/60">das Fundament</span><span className="text-[#BFFF00] not-italic">.</span>
            </h2>
            <p className="mt-5 text-[15px] md:text-[17px] leading-[1.6] text-white/75 max-w-2xl">
              Sechs Grundlagen-Kurse, vier Master-Programme und elf Framework-Drills.
              Dazu im selben System: WladBot als KI-Coach und Simulationen, in denen
              du das schwierige Gespräch vorher übst.
            </p>
          </div>
        )}

        {/* ── Fenster ─────────────────────────────────────────────────── */}
        <div className="rounded-[22px] md:rounded-[30px] bg-[rgba(70,66,62,0.40)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28),0_24px_60px_rgba(0,0,0,0.30)] p-2.5 sm:p-3.5 md:p-5">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 md:mb-4">
            <div className={`inline-flex items-center gap-2 rounded-full px-3.5 h-10 ${glass}`}>
              <Lock size={12} aria-hidden className="text-white/70" />
              <span className="font-mono text-[11.5px] tracking-[0.04em] text-white/85">leader-os.de/kurse</span>
            </div>
            <div role="tablist" aria-label="Kursgruppen" className="inline-flex rounded-full p-1 bg-black/20">
              {GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  aria-selected={group === g.id}
                  onClick={() => pickGroup(g.id)}
                  data-testid={`course-tab-${g.id}`}
                  className={`h-10 px-3.5 sm:px-4 rounded-full text-[12px] sm:text-[12.5px] font-bold tracking-[0.02em] transition-colors ${
                    group === g.id ? 'bg-white text-[#0A0A0A]' : 'text-white/75 hover:text-white'
                  }`}
                >
                  {g.label} <span className={group === g.id ? 'text-[#0A0A0A]/55' : 'text-white/45'}>{g.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="grid lg:grid-cols-12 gap-2.5 md:gap-4">
            {/* Hero · ausgewählter Kurs (mobil zuerst) */}
            <article
              className="lg:col-span-7 lg:order-2 relative overflow-hidden rounded-[18px] md:rounded-[24px] min-h-[340px] md:min-h-[440px] flex flex-col justify-end"
              data-testid="course-hero"
            >
              <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center transition-[background-image] duration-500"
                style={{ backgroundImage: `url(${sel.photo})` }}
              />
              <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,5,10,0.78)_0%,rgba(2,5,10,0.35)_60%,transparent_100%),linear-gradient(180deg,transparent_30%,rgba(2,5,10,0.85)_100%)]" />
              <div className="relative p-5 sm:p-7 md:p-9">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`rounded-full px-3 h-7 inline-flex items-center font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${glass}`}>{sel.code}</span>
                  <span className={`rounded-full px-3 h-7 inline-flex items-center text-[11.5px] font-semibold ${glass}`}>{sel.module}</span>
                  <span className={`rounded-full px-3 h-7 inline-flex items-center text-[11.5px] font-semibold ${glass}`}>{sel.level}</span>
                </div>
                <h3
                  key={sel.id}
                  className="text-[30px] sm:text-[40px] md:text-[48px] leading-[1.02] tracking-[-0.03em] font-extrabold [text-shadow:0_2px_18px_rgba(0,0,0,0.5)] animate-[kFadeIn_0.45s_ease]"
                  style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                >
                  {sel.title}
                </h3>
                <p className="mt-3 max-w-md text-[14.5px] md:text-[16px] leading-[1.55] text-white/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]">{sel.desc}</p>
                <p className="mt-3 inline-flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#BFFF00]">
                  {isMaster ? <Lock size={12} aria-hidden /> : <Play size={12} aria-hidden />}
                  {COURSE_ACCESS[sel.group]}
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <a
                    href={COURSE_TRIAL_URL}
                    onClick={() => track('course_cta_trial', { placement, course: sel.id })}
                    data-testid="course-cta-trial"
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white text-[#0A0A0A] font-bold text-[13.5px] hover:bg-[#BFFF00] transition-colors"
                  >
                    14 Tage kostenlos testen <ArrowUpRight size={15} />
                  </a>
                  <a
                    href="/#pricing"
                    onClick={() => track('course_cta_pricing', { placement, course: sel.id })}
                    className="inline-flex items-center h-12 px-5 rounded-full border border-white/45 text-white font-semibold text-[13.5px] hover:bg-white/10 transition-colors"
                  >
                    Zugang & Preise
                  </a>
                </div>
              </div>
            </article>

            {/* Liste */}
            <div className={`lg:col-span-5 lg:order-1 rounded-[18px] md:rounded-[24px] p-2.5 md:p-3.5 ${glass}`}>
              <div className="flex items-baseline justify-between px-2 pb-2.5 md:pb-3">
                <h3 className="text-[15px] md:text-[17px] font-semibold tracking-[0.02em]">{group === 'basics' ? 'Grundlagen' : 'Master-Programme'}</h3>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">{list.length} Kurse</span>
              </div>
              <ul className="space-y-1.5">
                {list.map((c) => {
                  const active = c.id === sel.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => pickCourse(c)}
                        aria-pressed={active}
                        data-testid={`course-${c.id}`}
                        className={`w-full flex items-center gap-3 rounded-2xl p-2 text-left transition-colors min-h-[60px] ${
                          active ? 'bg-white/[0.20]' : 'hover:bg-white/[0.10]'
                        }`}
                      >
                        <span
                          aria-hidden
                          className="shrink-0 w-11 h-[52px] rounded-lg flex items-end p-1.5 font-mono text-[9px] font-bold tracking-[0.1em] text-white/90"
                          style={{ background: `linear-gradient(160deg, ${c.tint}CC, #14161c)` }}
                        >
                          {c.code}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] md:text-[14.5px] font-semibold leading-tight truncate">{c.title}</span>
                          <span className="block mt-0.5 text-[11.5px] text-white/60 truncate">{c.module} · {c.level}</span>
                        </span>
                        <ChevronRight size={16} aria-hidden className={`shrink-0 ${active ? 'text-[#BFFF00]' : 'text-white/40'}`} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Framework-Drills */}
          <div className={`mt-2.5 md:mt-4 rounded-[18px] md:rounded-[24px] px-4 py-3.5 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center gap-2.5 md:gap-5 ${glass}`}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#BFFF00] shrink-0">+ 11 Framework-Drills</p>
            <p className="text-[13px] md:text-[13.5px] leading-[1.5] text-white/75">
              {FRAMEWORK_DRILLS.join(' · ')} u. a. Alle elf Wlad-Frameworks gibt es als drillbare Kurse.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoursesLibrarySection;
