import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import logger from '../lib/logger';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PublicPageShell } from '../components/layout/PublicPageShell';
import { UniversityHero, LabBlock, Curriculum } from '../components/courses/Curriculum';
import { WhatsInside, MoreFromLeaderOS } from '../components/courses/CourseSections';

export default function CoursesPage() {
  const { lang } = useLanguage();
  const de = lang !== 'en';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/courses').then((r) => setData(r.data)).catch((e) => logger.error('courses load failed', e));
  }, []);

  const courses = useMemo(() => data?.courses || [], [data]);

  const body = (
    <div className="p-4 sm:p-8 xl:px-12 w-full" data-testid="courses-page">
      <UniversityHero data={data} de={de} onSecure={() => navigate('/leadership-programm')} />
      <LabBlock de={de} launch={data?.launch} />
      {!data ? (
        <div className="mt-10 text-sm text-muted-foreground" data-testid="courses-loading">{de ? 'Lade Studienplan…' : 'Loading…'}</div>
      ) : (
        <>
          <Curriculum courses={courses} de={de} launch={data.launch} />
          <WhatsInside de={de} />
          <MoreFromLeaderOS de={de} />
        </>
      )}
    </div>
  );

  if (!user) return <PublicPageShell>{body}</PublicPageShell>;
  return <DashboardLayout>{body}</DashboardLayout>;
}
