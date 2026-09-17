import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { GuideVideoPlayer } from './GuideVideoPlayer';

let featurePromise = null;
const loadFeatureClips = () => {
  if (!featurePromise) {
    featurePromise = api.get('/guide/clips', { params: { kind: 'feature' } })
      .then((r) => r.data?.clips || [])
      .catch((e) => { featurePromise = null; logger.warn('feature clips', e); return []; });
  }
  return featurePromise;
};

/** Wlads Best-Practice-Video für ein Feature (Playbooks, Missionen, Video-Analyse). Ohne fertiges Video: nichts. */
export const FeatureVideoSection = ({ slugs, de = true, dark = false, compact = false }) => {
  const [clips, setClips] = useState([]);
  useEffect(() => { loadFeatureClips().then((all) => setClips(all.filter((c) => slugs.includes(c.slug) && (c.video_url || c.vimeo_id)))); }, [slugs]);
  if (!clips.length) return null;
  return (
    <section className={`animate-fade-in ${compact ? '' : 'mb-6'}`} data-testid={`feature-video-section-${slugs[0]}`}>
      <p className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] mb-2 ${dark ? 'text-[#BFFF00]' : 'text-[#4A6200] dark:text-[#BFFF00]'}`}>
        <Sparkles size={11} /> {de ? 'Best Practice von WladBot' : 'Best practice from WladBot'}
      </p>
      <div className={`grid gap-4 ${clips.length > 1 ? 'md:grid-cols-2' : 'max-w-2xl'}`}>
        {clips.map((c) => <GuideVideoPlayer key={c.slug} clip={c} de={de} />)}
      </div>
    </section>
  );
};
