import { useCallback, useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { ChevronDown, ChevronUp, Check, Loader2, Video } from 'lucide-react';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { VideoSourcePanel } from './VideoSourcePanel';

const EpisodeRow = ({ ep, onChanged }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border" data-testid={`course-episode-row-${ep.id}`}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-3 py-2 text-left"
              data-testid={`course-episode-toggle-${ep.id}`}>
        <span className="text-[10px] font-mono text-muted-foreground">{ep.number}</span>
        <span className="flex-1 truncate text-[12.5px] font-semibold text-foreground">{ep.title}</span>
        <span className="text-[10px] text-muted-foreground">
          {ep.video_source === 'vimeo' ? 'Vimeo' : ep.video_source === 'upload' ? 'Eigenes Video' : 'kein Video'}
        </span>
        {ep.ready && <Check size={13} className="text-[#5a7a00] dark:text-[#BFFF00]" />}
        {open ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 pb-3">
          <VideoSourcePanel kind="course" id={ep.id} data={ep} onChanged={onChanged} />
        </div>
      )}
    </div>
  );
};

/** Kurs-Folgen: Vimeo-Link oder eigenes Video pro Folge — mit Download für Detailarbeit. */
export const CourseEpisodesManager = () => {
  const [data, setData] = useState(null);
  const [openCourse, setOpenCourse] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/media/course-episodes');
      setData(res.data);
    } catch (e) {
      logger.error('course-episodes load failed', e);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) {
    return (
      <Card className="flex items-center justify-center p-8 bg-card border-border">
        <Loader2 className="animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <div className="space-y-3" data-testid="course-episodes-manager">
      <Card className="flex items-center gap-3 border-[#BFFF00]/15 bg-gradient-to-br from-[#BFFF00]/[0.05] to-transparent p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#BFFF00]/15"><Video size={16} className="text-[#BFFF00]" /></div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{data.ready} / {data.total} Folgen haben ein Video</p>
          <p className="text-[11px] text-muted-foreground">Pro Folge: Vimeo-Link einfügen oder eigenes Video hochladen (MP4/MOV bis 2 GB). Sofort live.</p>
        </div>
        <div className="text-2xl font-black tabular-nums text-[#5a7a00] dark:text-[#BFFF00]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {Math.round((data.ready / Math.max(1, data.total)) * 100)}%
        </div>
      </Card>

      {data.courses.map((c) => (
        <Card key={c.slug} className="bg-card border-border p-3" data-testid={`course-videos-${c.slug}`}>
          <button type="button" onClick={() => setOpenCourse(openCourse === c.slug ? null : c.slug)}
                  className="flex w-full items-center gap-3 text-left" data-testid={`course-videos-toggle-${c.slug}`}>
            <span className="flex-1 truncate text-[13px] font-bold text-foreground">{c.title}</span>
            <span className="text-[11px] text-muted-foreground">{c.ready}/{c.total}</span>
            {openCourse === c.slug ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </button>
          {openCourse === c.slug && (
            <div className="mt-3 space-y-2">
              {c.episodes.map((ep) => <EpisodeRow key={ep.id} ep={ep} onChanged={load} />)}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default CourseEpisodesManager;
