/**
 * DashboardLearningVideos · Kompakte Vorschau der Leadership-Lern-Videos
 * direkt im Dashboard, damit User nicht erst in /my-path → Tab klicken müssen.
 *
 * Zeigt die ersten 6 Starter-Kurse als horizontal scrollbare Karten + einen
 * "Alle Kurse"-CTA zum vollen Tab in /my-path.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Play, Lock, Layers, Clock, ArrowRight, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import logger from '../../lib/logger';
import VideoPlayer from '../shared/VideoPlayer';

const VideoTile = ({ video, onPlay }) => {
  const { unlocked } = video;
  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      className="group relative shrink-0 w-[220px] rounded-xl overflow-hidden text-left transition-all hover:scale-[1.02] hover:shadow-lg"
      data-testid={`dashboard-video-tile-${video.id}`}
      style={{
        background: `linear-gradient(135deg, ${video.thumbnail_color}AA 0%, ${video.thumbnail_color}66 100%)`,
      }}
    >
      <div className="h-24 flex items-center justify-center relative">
        <div className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
          unlocked ? 'bg-white/95' : 'bg-black/40 backdrop-blur'
        }`}>
          {unlocked ? <Play size={18} className="text-black ml-0.5" fill="black" /> : <Lock size={16} className="text-foreground/90" />}
        </div>
        {unlocked && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-foreground text-[8px] font-black uppercase tracking-wider">
            Verfügbar
          </div>
        )}
      </div>
      <div className="p-3 bg-white/95 dark:bg-card/95 backdrop-blur">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1" style={{ color: video.thumbnail_color }}>
          {video.module}
        </p>
        <h4 className="text-[12px] font-black leading-tight line-clamp-2 mb-1.5">{video.title}</h4>
        <div className="flex items-center gap-2 text-[9px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-0.5"><Clock size={9} /> {video.duration}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="flex items-center gap-0.5"><Layers size={9} /> {video.episodes}</span>
        </div>
      </div>
    </button>
  );
};

export const DashboardLearningVideos = ({ de = true }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playerOpen, setPlayerOpen] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/my-path/videos');
        setData(res.data);
      } catch (err) {
        logger.error('Dashboard videos load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data) {
    return (
      <Card className="border-black/[0.04] dark:border-white/[0.06]" data-testid="dashboard-videos-loading">
        <CardContent className="p-5">
          <div className="h-32 rounded-xl skeleton-pulse" />
        </CardContent>
      </Card>
    );
  }

  const starters = data.starter_videos || [];
  if (starters.length === 0) return null;

  const handlePlay = (video) => {
    if (video.vimeo_id || video.vimeo_url || video.video_url) {
      setPlayerOpen(video);
      return;
    }
    navigate(`/chat?prefill=${encodeURIComponent('Erkläre mir die Kerninhalte von "' + video.title + '"')}`);
  };

  return (
    <Card className="border-black/[0.04] dark:border-white/[0.06] overflow-hidden" data-testid="dashboard-learning-videos" data-anim="dash-widget">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#BFFF00]/15 flex items-center justify-center">
              <Sparkles size={13} className="text-brand" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {de ? 'Lern-Videos' : 'Learning Videos'}
              </p>
              <h3 className="text-base font-black tracking-tight">
                {de ? 'Leadership-Grundlagen · Sofortstart' : 'Leadership Fundamentals · Quick Start'}
              </h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/lern-videos')}
            className="text-[11px] font-bold h-8 gap-1"
            data-testid="dashboard-videos-all-btn"
          >
            {de ? 'Alle Kurse' : 'All courses'} <ArrowRight size={11} />
          </Button>
        </div>

        <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1 snap-x snap-mandatory" style={{ scrollbarWidth: 'thin' }}>
          {starters.slice(0, 6).map((v) => (
            <div key={v.id} className="snap-start">
              <VideoTile video={v} onPlay={handlePlay} />
            </div>
          ))}
        </div>
      </CardContent>

      {playerOpen && (
        <div
          className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          onClick={() => setPlayerOpen(null)}
          data-testid="dashboard-video-modal"
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-foreground font-bold text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>{playerOpen.title}</h3>
              <button
                onClick={() => setPlayerOpen(null)}
                className="text-muted-foreground hover:text-foreground p-2 -mr-2"
                aria-label="close"
                data-testid="dashboard-video-close"
              >
                <X size={20} />
              </button>
            </div>
            <VideoPlayer
              src={playerOpen.vimeo_url || playerOpen.video_url}
              vimeoId={playerOpen.vimeo_id}
              title={playerOpen.title}
              autoplay
            />
            {playerOpen.description && (
              <p className="text-sm text-foreground/60 mt-4 leading-relaxed">{playerOpen.description}</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default DashboardLearningVideos;
