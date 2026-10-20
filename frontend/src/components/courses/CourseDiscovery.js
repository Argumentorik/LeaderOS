import { Play, ChevronDown } from 'lucide-react';
import { CATEGORY_META, STATUS_FILTERS, t } from './courseMeta';

export const CourseHero = ({ de, total, seen, onStart, onBrowse }) => {
  const pct = total ? Math.round((seen / total) * 100) : 0;
  return (
    <section className="relative rounded-3xl bg-[#0A0A0A] text-white overflow-hidden" data-testid="courses-hero">
      <div aria-hidden className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />
      <div aria-hidden className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-[#BFFF00]/20 blur-3xl" />
      <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 p-7 sm:p-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#BFFF00]">{de ? 'Kurs-Bibliothek' : 'Course library'}</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3 leading-[1.05]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {de ? 'Lernen. Üben. Führen. Alles an einem Ort.' : 'Learn. Practice. Lead. All in one place.'}
          </h1>
          <p className="text-sm sm:text-base text-white/60 mt-4 max-w-xl">
            {de ? `Echte Führungssituationen statt Theorie — vom 30-Sekunden-Statement bis zur Boardroom-Strategie. 10 Kurse, ${total} Folgen, Folge 1 immer kostenlos.`
              : `Real leadership situations instead of theory — from the 30-second statement to boardroom strategy. 10 courses, ${total} episodes, episode 1 always free.`}
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <button type="button" onClick={onStart} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#BFFF00] text-black text-[13px] font-black hover:bg-[#D4FF4D] transition-colors" data-testid="courses-hero-start">
              <Play size={14} /> {de ? 'Kostenlos starten' : 'Start for free'}
            </button>
            <button type="button" onClick={onBrowse} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-white/20 text-[13px] font-bold hover:bg-white/10 transition-colors" data-testid="courses-hero-browse">
              {de ? 'Alle Kurse' : 'All courses'} <ChevronDown size={14} />
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 self-start lg:self-center" data-testid="courses-progress">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">{de ? 'Dein Fortschritt' : 'Your progress'}</p>
          <p className="text-3xl font-black mt-2"><span className="text-[#BFFF00]">{seen}</span> <span className="text-white/40 text-lg">/ {total}</span></p>
          <p className="text-[12px] text-white/60">{de ? 'Folgen gesehen' : 'episodes watched'}</p>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#BFFF00] transition-[width] duration-700" style={{ width: `${pct}%` }} /></div>
          <p className="text-[11px] text-white/40 mt-2">{pct}% · {de ? 'Jede gesehene Folge zählt für dein Level.' : 'Every watched episode counts toward your level.'}</p>
        </div>
      </div>
    </section>
  );
};

export const CategoryTiles = ({ de, active, onPick, counts }) => (
  <section className="mt-10" data-testid="courses-categories">
    <h2 className="text-lg md:text-xl font-black">{de ? 'Nach Kategorie stöbern' : 'Browse by category'}</h2>
    <div className="grid sm:grid-cols-3 gap-4 mt-4">
      {Object.entries(CATEGORY_META).map(([key, m]) => (
        <button key={key} type="button" onClick={() => onPick(active === key ? 'all' : key)}
          className={`group relative h-40 rounded-2xl overflow-hidden text-left border-2 transition-all ${active === key ? 'border-[#BFFF00] shadow-lg shadow-[#BFFF00]/20' : 'border-transparent hover:border-white/20'}`}
          data-testid={`course-category-${key}`} aria-pressed={active === key}>
          <img src={m.img} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <p className="font-black text-[15px] leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{t(m, de)}</p>
            <p className="text-[11px] text-white/60 mt-0.5">{t(m.blurb, de)} · {counts[key] || 0} {de ? 'Kurse' : 'courses'}</p>
          </div>
        </button>
      ))}
    </div>
  </section>
);

const FilterChip = ({ active, onClick, children, testid }) => (
  <button type="button" onClick={onClick} aria-pressed={active} data-testid={testid}
    className={`h-8 px-3 rounded-full text-[11.5px] font-bold border transition-colors ${active ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] dark:bg-[#BFFF00] dark:text-black dark:border-[#BFFF00]' : 'border-black/[0.1] dark:border-white/[0.15] text-muted-foreground hover:text-foreground'}`}>
    {children}
  </button>
);

export const CourseFilters = ({ de, category, status, onCategory, onStatus }) => (
  <div className="flex flex-wrap items-center gap-2 mt-4" data-testid="courses-filters">
    <FilterChip active={category === 'all'} onClick={() => onCategory('all')} testid="course-filter-cat-all">{de ? 'Alle Kategorien' : 'All categories'}</FilterChip>
    {Object.entries(CATEGORY_META).map(([key, m]) => (
      <FilterChip key={key} active={category === key} onClick={() => onCategory(key)} testid={`course-filter-cat-${key}`}>{t(m, de)}</FilterChip>
    ))}
    <span className="hidden sm:block w-px h-5 bg-black/[0.1] dark:bg-white/[0.15] mx-1" />
    {STATUS_FILTERS.map((f) => (
      <FilterChip key={f.key} active={status === f.key} onClick={() => onStatus(f.key)} testid={`course-filter-status-${f.key}`}>{t(f, de)}</FilterChip>
    ))}
  </div>
);
