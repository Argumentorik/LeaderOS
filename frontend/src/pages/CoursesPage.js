import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import logger from '../lib/logger';
import { useLanguage } from '../contexts/LanguageContext';
import { CourseCard } from '../components/courses/CourseCard';
import { CourseHero, CategoryTiles, CourseFilters } from '../components/courses/CourseDiscovery';
import { WhatsInside, MoreFromLeaderOS, CoursesUpsell } from '../components/courses/CourseSections';
import { matchesStatus } from '../components/courses/courseMeta';

export default function CoursesPage() {
  const { lang } = useLanguage();
  const de = lang !== 'en';
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const listRef = useRef(null);

  useEffect(() => {
    api.get('/courses').then((r) => setData(r.data)).catch((e) => logger.error('courses load failed', e));
  }, []);

  const courses = useMemo(() => data?.courses || [], [data]);
  const counts = useMemo(() => courses.reduce((acc, c) => ({ ...acc, [c.category]: (acc[c.category] || 0) + 1 }), {}), [courses]);
  const visible = courses.filter((c) => (category === 'all' || c.category === category) && matchesStatus(c, status));

  const startFree = () => {
    const c = courses.find((x) => x.seen_count === 0) || courses[0];
    if (c) navigate(`/kurse/${c.slug}?folge=1`);
  };
  const pickCategory = (key) => { setCategory(key); listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto" data-testid="courses-page">
      <CourseHero de={de} total={data?.total_episodes || 72} seen={data?.seen_total || 0} onStart={startFree} onBrowse={() => listRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      {!data ? (
        <div className="mt-10 text-sm text-muted-foreground" data-testid="courses-loading">{de ? 'Lade Kurse…' : 'Loading…'}</div>
      ) : (
        <>
          <CategoryTiles de={de} active={category} onPick={pickCategory} counts={counts} />
          <section ref={listRef} className="mt-12 scroll-mt-6" data-testid="courses-list">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h2 className="text-lg md:text-xl font-black">{de ? 'Alle Kurse' : 'All courses'}</h2>
              <p className="text-[12px] text-muted-foreground" data-testid="courses-count">{visible.length} {de ? 'von' : 'of'} {courses.length}</p>
            </div>
            <CourseFilters de={de} category={category} status={status} onCategory={setCategory} onStatus={setStatus} />
            {visible.length === 0 ? (
              <p className="mt-8 text-sm text-muted-foreground" data-testid="courses-empty">{de ? 'Kein Kurs passt zu diesem Filter.' : 'No course matches this filter.'}</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                {visible.map((c) => <CourseCard key={c.slug} course={c} de={de} />)}
              </div>
            )}
            <CoursesUpsell data={data} de={de} />
          </section>
          <WhatsInside de={de} />
          <MoreFromLeaderOS de={de} />
        </>
      )}
    </div>
  );
}
