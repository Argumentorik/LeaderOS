import { ArrowUpRight, Lock, Play } from 'lucide-react';
import { COURSES, COURSE_ACCESS, COURSE_TRIAL_URL, courseForArticle } from '../../../data/leaderOsCourses';

/**
 * ArticleCourseCta · CTA unter dem Artikel (und im Journal-Index).
 *
 * Verbindet das Gelesene mit dem passenden Kurs der LeaderOS-Bibliothek
 * (courseForArticle: Slug/Tags/Titel → v1–v10) und nennt die zwei
 * ehrlichen nächsten Schritte: 14 Tage testen oder das kostenlose Webinar.
 * Ohne Artikel (Journal-Index) zeigt es den Einstiegskurs.
 */

const track = (event, props = {}) => {
  if (typeof window !== 'undefined' && window.posthog?.capture) {
    try { window.posthog.capture(event, { surface: 'leader-os', funnel: 'article-course-cta', ...props }); } catch {}
  }
};

export const ArticleCourseCta = ({ article = null, placement = 'article' }) => {
  const course = courseForArticle(article);
  const isMaster = course.group === 'master';
  const slug = article?.slug || 'journal-index';
  const trialUrl = `${COURSE_TRIAL_URL}&utm_source=journal&utm_medium=article-cta&utm_campaign=${encodeURIComponent(slug)}`;

  return (
    <aside
      aria-label="Der passende Kurs in LeaderOS"
      data-testid="article-course-cta"
      className="mt-14 md:mt-16 relative overflow-hidden rounded-[22px] bg-[#0A0A0A] text-white border-2 border-black"
    >
      <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: `url(${course.photo})` }} />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.92)_0%,rgba(10,10,10,0.7)_55%,rgba(10,10,10,0.45)_100%)]" />
      <div className="relative p-6 sm:p-8 md:p-10">
        <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.26em] text-[#BFFF00] mb-4">
          ▸ AUS DEM LESEN WIRD KÖNNEN · KURS {course.code}
        </p>
        <h3
          className="text-[28px] sm:text-[36px] md:text-[44px] leading-[1.02] tracking-[-0.03em] font-extrabold"
          style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
        >
          {course.title}<span className="text-[#BFFF00]">.</span>
        </h3>
        <p className="mt-3 max-w-xl text-[15px] md:text-[16.5px] leading-[1.55] text-white/80">
          {course.desc} Der Kurs ist Teil der Bibliothek in LeaderOS, zusammen mit WladBot und den Simulationen, in denen du das Gespräch übst.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/70">
          {isMaster ? <Lock size={12} aria-hidden /> : <Play size={12} aria-hidden />}
          {COURSE_ACCESS[course.group]}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={trialUrl}
            onClick={() => track('article_cta_trial', { placement, article: slug, course: course.id })}
            data-testid="article-cta-trial"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[#BFFF00] text-[#0A0A0A] font-bold text-[13.5px] hover:bg-white transition-colors"
          >
            14 Tage kostenlos testen <ArrowUpRight size={15} />
          </a>
          <a
            href="/#kurse"
            onClick={() => track('article_cta_courses', { placement, article: slug, course: course.id })}
            className="inline-flex items-center h-12 px-5 rounded-full border border-white/45 text-white font-semibold text-[13.5px] hover:bg-white/10 transition-colors"
          >
            Alle {COURSES.length} Kurse ansehen
          </a>
          <a
            href="/webinar"
            onClick={() => track('article_cta_webinar', { placement, article: slug })}
            className="inline-flex items-center h-12 px-2 text-white/75 hover:text-white underline underline-offset-4 text-[13.5px]"
          >
            oder zum Live-Webinar am 26.11.
          </a>
        </div>
      </div>
    </aside>
  );
};

export default ArticleCourseCta;
