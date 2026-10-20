/**
 * SharedFolderPage — public read-only view of a shared folder (Iter 92.23.9 P2).
 *
 * Mert: "Folder Sharing — Folder als read-only Link teilen
 *        (z.B. 'Show Wlad my Q2 board prep')"
 *
 * Mounted under /f/:slug. No auth required. Renders folder metadata + a
 * curated, PII-light list of items (mission scores + chat titles + dates).
 * Includes an OG-friendly hero so links shared in Slack/LinkedIn look great.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import logger from '../lib/logger';
import { Folder, Loader2, MessageSquareText, Video, Calendar, Eye, ArrowRight, Sparkles } from 'lucide-react';

const scoreColor = (s) => {
  if (s == null) return '#94A3B8';
  if (s >= 80) return '#4ADE80';
  if (s >= 60) return '#FBBF24';
  if (s >= 40) return '#FB923C';
  return '#F87171';
};

export default function SharedFolderPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/folders/share/${slug}`, { skipAuth: true }).then((res) => {
      if (alive) setData(res.data);
    }).catch((err) => {
      logger.warn('shared folder fetch failed:', err?.message);
      if (alive) setError(err?.response?.status === 404 ? 'not_found' : 'error');
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]" data-testid="shared-folder-loading">
        <Loader2 size={28} className="animate-spin text-[#BFFF00]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white px-6" data-testid="shared-folder-error">
        <div className="max-w-md text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
            <Folder size={22} className="text-rose-400" />
          </div>
          <h1 className="text-xl font-black">Geteilter Ordner nicht gefunden</h1>
          <p className="text-sm text-white/50">Der Link ist abgelaufen oder der Besitzer hat das Teilen widerrufen.</p>
          <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#BFFF00] hover:underline">Zur Startseite <ArrowRight size={12} /></Link>
        </div>
      </div>
    );
  }

  const { folder, owner, items, share } = data;
  const accent = folder.color || '#BFFF00';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden" data-testid="shared-folder-page">
      {/* aurora glow */}
      <div className="absolute -top-20 -right-32 w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none opacity-30" style={{ background: accent }} />
      <div className="absolute -bottom-20 -left-32 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none opacity-20" style={{ background: '#A78BFA' }} />

      <div className="relative max-w-3xl mx-auto px-6 py-12 lg:py-16 space-y-10">
        {/* Brand row */}
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#BFFF00] to-[#9ACC00] flex items-center justify-center shadow-md shadow-[#BFFF00]/30">
              <span className="text-sm font-black text-[#0A0A0A]" style={{ fontFamily: 'Outfit, sans-serif' }}>W</span>
            </div>
            <p className="text-[11px] font-black tracking-[0.18em] text-white group-hover:text-[#BFFF00] transition-colors">LEADER·OS</p>
          </Link>
          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <Eye size={10} /> <span>{share?.views || 0} {share?.views === 1 ? 'view' : 'views'}</span>
          </div>
        </header>

        {/* Hero */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-[0.18em] uppercase" style={{ background: `${accent}1A`, color: accent, border: `1px solid ${accent}40` }}>
            <Folder size={10} /> Geteilter Ordner
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{folder.name}</h1>
          {folder.context_summary && (
            <p className="text-base text-white/70 leading-relaxed max-w-2xl">{folder.context_summary}</p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden">
              {owner.picture ? (
                <img src={owner.picture} alt={owner.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[12px] font-black text-white/60">{(owner.name || 'L')[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-[12px] font-bold text-white">{owner.name}</p>
              {owner.level && <p className="text-[10px] text-white/40">{owner.level}</p>}
            </div>
          </div>
        </section>

        {/* Items */}
        <section className="space-y-3" data-testid="shared-folder-items">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            {items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'} im Ordner
          </p>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
              <p className="text-[12px] text-white/40">Der Owner hat noch nichts in diesen Ordner abgelegt.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={`item-${i}`} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-3 hover:border-[color:var(--it-accent)] transition-colors" style={{ '--it-accent': `${accent}40` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: it.item_type === 'video_mission' ? `${accent}1A` : 'rgba(96,165,250,0.12)', color: it.item_type === 'video_mission' ? accent : '#60A5FA' }}>
                    {it.item_type === 'video_mission' ? <Video size={14} /> : <MessageSquareText size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-white truncate">{it.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40">
                      <Calendar size={9} />
                      <span>{(it.created_at || '').slice(0, 10)}</span>
                      <span className="text-white/20">·</span>
                      <span className="capitalize">{it.item_type === 'video_mission' ? 'Video-Mission' : 'Chat'}</span>
                    </div>
                  </div>
                  {it.item_type === 'video_mission' && it.score != null && (
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black leading-none" style={{ color: scoreColor(it.score), fontFamily: 'Outfit, sans-serif' }}>{it.score}</p>
                      <p className="text-[8px] text-white/30 uppercase tracking-wider mt-0.5">/100</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#BFFF00]/[0.08] via-[#0F0F1A] to-[#0A0A0A] border border-[#BFFF00]/20 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[#BFFF00]/10 blur-3xl" />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BFFF00] text-[#0A0A0A] text-[9px] font-black tracking-[0.18em] uppercase">
              <Sparkles size={9} /> Leader OS
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Baue deinen eigenen Leadership-Workspace.
            </h2>
            <p className="text-[13px] text-white/60 leading-relaxed">Video-Analysen, Chats und Reflektionen — gebündelt nach echten Projekten. Wlad's KI hat immer den vollen Kontext.</p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#BFFF00] text-[#0A0A0A] text-[12px] font-black hover:bg-[#A8E600] transition-colors"
              data-testid="shared-folder-cta-signup"
            >
              Kostenlos starten <ArrowRight size={12} />
            </Link>
          </div>
        </section>

        <footer className="text-center text-[10px] text-white/30 pt-4">
          Geteilt am {(share?.created_at || '').slice(0, 10)} · <Link to="/" className="hover:text-[#BFFF00]">leaderos.de</Link>
        </footer>
      </div>
    </div>
  );
}
