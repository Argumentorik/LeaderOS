import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { ProfileAccountTab } from '../components/profile/ProfileAccountTab';
import { BillingSection } from '../components/profile/BillingSection';
import { ProfileSecurityTab } from '../components/profile/ProfileSecurityTab';
import { GdprSection } from '../components/profile/GdprSection';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import logger from '../lib/logger';
import { toast } from 'sonner';
import {
  Camera, Edit3, Save, X, Trophy, Flame, Zap, Target, Users, Crown,
  Star, Sparkles, Gift, ArrowRight, CheckCircle2, MessageCircle, Brain,
  Video, Mic, Wrench, BookOpen, Share2, Building2, Loader2,
  Activity as ActivityIcon, TrendingUp, Linkedin, Calendar, Settings, Shield
} from 'lucide-react';
// Lucide icon lookup for activity feed
const ACTION_ICONS = {
  check: CheckCircle2, flame: Flame, target: Target, video: Video, mic: Mic,
  brain: Brain, wrench: Wrench, book: BookOpen, gift: Gift, share: Share2,
  building: Building2, crown: Crown, message: MessageCircle, chat: MessageCircle,
  sparkle: Sparkles,
};

const LEVEL_META = {
  'Teamplayer':           { color: '#64748B', next: 'Mentor',              threshold: 200,   min: 0 },
  'Mentor':               { color: '#00AAFF', next: 'Kommunikator',        threshold: 500,   min: 200 },
  'Kommunikator':         { color: '#FFB800', next: 'Strategischer Denker', threshold: 1000, min: 500 },
  'Strategischer Denker': { color: '#FF4444', next: 'Visionär',            threshold: 2000,  min: 1000 },
  'Visionär':             { color: '#BFFF00', next: null,                  threshold: 99999, min: 2000 },
  // Legacy fallbacks (pre-migration users)
  'Emerging Leader':      { color: '#64748B', next: 'Mentor',              threshold: 200,   min: 0 },
  'Capable Leader':       { color: '#00AAFF', next: 'Kommunikator',        threshold: 500,   min: 200 },
  'Confident Leader':     { color: '#FFB800', next: 'Strategischer Denker', threshold: 1000, min: 500 },
  'Strategic Leader':     { color: '#FF4444', next: 'Visionär',            threshold: 2000,  min: 1000 },
  'Visionary Leader':     { color: '#BFFF00', next: null,                  threshold: 99999, min: 2000 },
};

// ─────────────────────────────────────────────────────────────────────────
// Sub-components (keeps the main component under 150 lines)
// ─────────────────────────────────────────────────────────────────────────

const ProfileAvatar = ({ picture, name, onUpload, uploading }) => {
  const fileRef = useRef(null);
  const initials = (name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const imgUrl = picture
    ? (picture.startsWith('http') ? picture : `/api/files/${picture}`)
    : null;

  return (
    <div className="relative group shrink-0">
      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[#BFFF00] to-[#6B8A00] flex items-center justify-center shadow-lg shadow-[#BFFF00]/20 ring-4 ring-white dark:ring-[#0A0A0A] transition-all duration-300 group-hover:ring-[#BFFF00]/50 group-hover:shadow-[#BFFF00]/40">
        {imgUrl ? (
          <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl font-black text-[#0A0A0A]">{initials}</span>
        )}
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 w-8 h-8 rounded-xl bg-[#0A0A0A] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
        data-testid="profile-avatar-upload"
        aria-label="Upload profile picture"
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
      </button>
      <input
        ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
        onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])}
        className="hidden" data-testid="profile-avatar-input"
      />
    </div>
  );
};

const StatTile = ({ icon: Icon, label, value, color = '#BFFF00', testid }) => (
  <div className="group p-3 rounded-xl bg-white/70 dark:bg-card/60 backdrop-blur border border-black/[0.04] dark:border-white/[0.06] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-black/[0.08] dark:hover:border-white/[0.12]" data-testid={testid}>
    <div className="flex items-center gap-2 mb-1.5">
      <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ background: `${color}1F` }}>
        <Icon size={12} style={{ color }} strokeWidth={2.5} />
      </span>
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
    <p className="text-xl font-black tabular-nums">{value}</p>
  </div>
);

const LevelProgress = ({ xp, level, de }) => {
  const meta = LEVEL_META[level] || LEVEL_META['Teamplayer'];
  const nextMeta = meta.next ? LEVEL_META[meta.next] : null;
  const prevThreshold = meta.min || 0;
  const curr = nextMeta ? meta.threshold : 99999;
  const pct = nextMeta ? Math.min(100, Math.max(0, ((xp - prevThreshold) / (curr - prevThreshold)) * 100)) : 100;

  return (
    <div className="p-4 rounded-2xl" style={{ background: `linear-gradient(135deg, ${meta.color}15, ${meta.color}04)`, border: `1px solid ${meta.color}30` }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: meta.color }}>
            {de ? 'Aktuelles Level' : 'Current Level'}
          </p>
          <p className="text-base font-black">{level}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tabular-nums" style={{ color: meta.color }}>{xp.toLocaleString('de-DE')}</p>
          <p className="text-[9px] text-muted-foreground">XP</p>
        </div>
      </div>
      {meta.next ? (
        <>
          <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: meta.color }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[9px]">
            <span className="text-muted-foreground font-semibold">{prevThreshold} XP</span>
            <span className="font-bold" style={{ color: meta.color }}>
              {de ? 'Nächstes Level' : 'Next'}: {meta.next}
            </span>
            <span className="text-muted-foreground font-semibold">{curr} XP</span>
          </div>
        </>
      ) : (
        <div className="text-center pt-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: `${meta.color}18`, color: meta.color }}>
            <Crown size={10} /> {de ? 'Höchstes Level erreicht' : 'Max level reached'}
          </span>
        </div>
      )}
    </div>
  );
};

const ActivityFeed = ({ activities, de }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12">
        <ActivityIcon size={32} className="mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">
          {de ? 'Noch keine Aktivitäten. Starte deine erste Mission!' : 'No activities yet. Start your first mission!'}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-1.5" data-testid="activity-feed">
      {activities.map((a) => {
        const Icon = ACTION_ICONS[a.icon] || Sparkles;
        const date = a.created_at ? new Date(a.created_at) : null;
        const timeStr = date ? date.toLocaleDateString(de ? 'de-DE' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
        return (
          <div key={a.activity_id} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-card/70 border border-black/[0.04] dark:border-white/[0.06] hover:shadow-sm transition-shadow" data-testid={`activity-${a.action}`}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${a.xp_color}18` }}>
              <Icon size={15} style={{ color: a.xp_color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold leading-tight">{a.label}</p>
              <p className="text-[10px] text-muted-foreground">{timeStr}</p>
            </div>
            {a.xp_delta > 0 && (
              <Badge className="text-[10px] font-black border-0 tabular-nums px-2" style={{ background: `${a.xp_color}18`, color: a.xp_color }}>
                +{a.xp_delta} XP
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
};

const EditProfileForm = ({ profile, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({
    name: profile.name || '', position: profile.position || '',
    company: profile.company || '', industry: profile.industry || '',
    bio: profile.bio || '', linkedin_url: profile.linkedin_url || '',
    about_me: profile.about_me || '',
  });
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="space-y-3" data-testid="edit-profile-form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input placeholder="Name" value={form.name} onChange={e => update('name', e.target.value)} data-testid="profile-edit-name" />
        <Input placeholder="Position" value={form.position} onChange={e => update('position', e.target.value)} data-testid="profile-edit-position" />
        <Input placeholder="Company" value={form.company} onChange={e => update('company', e.target.value)} data-testid="profile-edit-company" />
        <Input placeholder="Industry" value={form.industry} onChange={e => update('industry', e.target.value)} data-testid="profile-edit-industry" />
      </div>
      <Input placeholder="LinkedIn URL" value={form.linkedin_url} onChange={e => update('linkedin_url', e.target.value)} data-testid="profile-edit-linkedin" />
      <Textarea placeholder="Bio / Leadership-Motto" rows={3} value={form.bio} onChange={e => update('bio', e.target.value)} data-testid="profile-edit-bio" />

      {/* Über mich — der wichtigste Input für persönliches Feedback (Iter 136) */}
      <div className="rounded-2xl border border-[#BFFF00]/25 bg-[#BFFF00]/[0.04] p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-black">Über mich</p>
          <span className="text-[10px] font-bold text-muted-foreground">
            {form.about_me.length}/6000
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Alles, was WladBot über dich wissen sollte, um dir konkret statt allgemein zu antworten:
          Position und Verantwortung, Team und Umfeld, deine Stärken und Baustellen, aktuelle Projekte
          und Herausforderungen, Ziele, Arbeits- und Kommunikationsstil, Erfahrungen, Vorlieben.
          Schreib frei, so viel oder so wenig du willst. Du kannst das jederzeit ändern — WladBot nutzt
          immer die aktuelle Version.
        </p>
        <Textarea
          rows={10}
          maxLength={6000}
          value={form.about_me}
          onChange={e => update('about_me', e.target.value)}
          placeholder={'Beispiel: Ich leite seit 2 Jahren ein 12-köpfiges Vertriebsteam in einem Maschinenbau-Mittelständler. Stark bin ich in Analyse und Struktur, schwer fällt mir, unangenehme Dinge direkt anzusprechen — ich verpacke zu weich. Aktuell baue ich ein neues Vertriebsgebiet auf, zwei erfahrene Kollegen blockieren. Ziel: bis Q4 als Bereichsleiter wahrgenommen werden. Ich arbeite gern vorbereitet, mag klare Frameworks, keine Motivationssprüche.'}
          className="text-sm leading-relaxed"
          data-testid="profile-edit-about-me"
        />
        {profile.about_me_updated_at && (
          <p className="text-[10px] text-muted-foreground">
            Zuletzt aktualisiert: {new Date(profile.about_me_updated_at).toLocaleDateString('de-DE')}
          </p>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(form)} disabled={saving} className="bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-black" data-testid="profile-save-btn">
          {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
          Speichern
        </Button>
        <Button variant="outline" onClick={onCancel} data-testid="profile-cancel-btn">
          <X size={14} className="mr-1.5" /> Abbrechen
        </Button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Main ProfilePage
// ─────────────────────────────────────────────────────────────────────────

const TIER_LABELS = { free: 'Free', standard: 'Leadership OS', accelerator: 'Leadership OS PLUS', enterprise: 'Enterprise' };

export default function ProfilePage() {
  const { lang } = useLanguage();
  const { checkAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const TAB_VALUES = ['activity', 'stats', 'account', 'security'];
  const activeTab = TAB_VALUES.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'activity';
  const setActiveTab = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    next.delete('focus');
    setSearchParams(next, { replace: true });
  };
  const de = lang === 'de';

  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, act] = await Promise.all([
        api.get('/profile/me'),
        api.get('/profile/activity', { params: { limit: 30, lang } }),
      ]);
      setProfile(me.data);
      setActivity(act.data);
    } catch (err) { logger.error(err); toast.error('Profile load failed'); }
    finally { setLoading(false); }
  }, [lang]);

  useEffect(() => { load(); }, [load]);

  const uploadPicture = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/upload/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(p => ({ ...p, picture: res.data.path }));
      if (checkAuth) await checkAuth();
      toast.success(de ? 'Profilbild aktualisiert!' : 'Profile picture updated!');
    } catch (err) {
      logger.error(err);
      toast.error(err?.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); }
  };

  const savePatch = async (form) => {
    setSaving(true);
    try {
      await api.patch('/profile/me', form);
      setProfile(p => ({ ...p, ...form }));
      setEditing(false);
      if (checkAuth) await checkAuth();
      toast.success(de ? 'Profil gespeichert!' : 'Profile saved!');
    } catch (err) { logger.error(err); toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-3 border-[#BFFF00] border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;
  }

  const joinedYears = profile.member_since ? Math.floor((Date.now() - new Date(profile.member_since).getTime()) / (365 * 24 * 3600 * 1000)) : 0;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6" data-testid="profile-page">

        {/* ─── HERO ─── */}
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.06] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)]" style={{
          background: 'linear-gradient(135deg, #0A0A0A 0%, #161616 100%)',
        }}>
          <div className="absolute inset-0 opacity-[0.10]" style={{
            backgroundImage: 'radial-gradient(circle at 25% 20%, #BFFF00 0%, transparent 55%)',
          }} />
          <div aria-hidden className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-emerald-500/[0.07] blur-[80px] pointer-events-none" />
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <ProfileAvatar picture={profile.picture} name={profile.name} onUpload={uploadPicture} uploading={uploading} />
            <div className="flex-1 min-w-0 text-white">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BFFF00]/12 border border-[#BFFF00]/25 text-[9px] font-black uppercase tracking-[0.16em] text-[#BFFF00]">
                  <Crown size={9} strokeWidth={2.8} />
                  {TIER_LABELS[profile.tier] || TIER_LABELS.free} {joinedYears >= 1 ? `· ${joinedYears}+ ${de ? 'Jahre' : 'yrs'}` : ''}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate" data-testid="profile-name">{profile.name || 'Leader'}</h1>
              <p className="text-sm text-white/60 truncate">
                {profile.position && `${profile.position}${profile.company ? ` · ${profile.company}` : ''}`}
                {!profile.position && !profile.company && (de ? 'Position nicht gesetzt' : 'Position not set')}
              </p>
              {profile.bio && <p className="text-xs text-white/50 mt-2 italic">&ldquo;{profile.bio}&rdquo;</p>}

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Button size="sm" onClick={() => setEditing(!editing)} className="bg-white/10 hover:bg-white/15 text-white backdrop-blur border border-white/10 h-8 text-[11px]" data-testid="profile-edit-btn">
                  {editing ? <X size={12} className="mr-1" /> : <Edit3 size={12} className="mr-1" />}
                  {editing ? (de ? 'Abbrechen' : 'Cancel') : (de ? 'Profil bearbeiten' : 'Edit profile')}
                </Button>
                {profile.linkedin_url && (
                  <Button size="sm" onClick={() => window.open(profile.linkedin_url, '_blank')} className="bg-[#0A66C2] hover:bg-[#0A66C2]/90 h-8 text-[11px]" data-testid="profile-linkedin-btn">
                    <Linkedin size={12} className="mr-1" /> LinkedIn
                  </Button>
                )}
                <Button size="sm" onClick={() => navigate('/referrals')} className="bg-[#BFFF00] hover:bg-[#D4FF4D] text-[#0A0A0A] font-black h-8 text-[11px]" data-testid="profile-referrals-btn">
                  <Gift size={12} className="mr-1" /> {de ? 'Empfehlen & Verdienen' : 'Refer & Earn'}
                </Button>
              </div>
            </div>

            {/* Streak badge */}
            {profile.streak > 0 && (
              <div className="hidden sm:flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20 shrink-0">
                <Flame size={28} className="text-orange-400 mb-1 animate-pulse" />
                <p className="text-3xl font-black text-white tabular-nums">{profile.streak}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-orange-300">{de ? 'Tage Streak' : 'Day streak'}</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── EDIT FORM (inline, appears under hero) ─── */}
        {editing && (
          <Card className="animate-fade-in border-[#BFFF00]/30">
            <CardContent className="p-5">
              <EditProfileForm profile={profile} onSave={savePatch} onCancel={() => setEditing(false)} saving={saving} />
            </CardContent>
          </Card>
        )}

        {/* ─── ÜBER MICH (read view) — Kontext für WladBot (Iter 136) ─── */}
        {!editing && (
          <Card className={profile.about_me ? '' : 'border-[#BFFF00]/30'} data-testid="about-me-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-black">{de ? 'Über mich' : 'About me'}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {de
                      ? 'Dieser Kontext fließt in jede WladBot-Antwort ein — Chat, Video-Feedback, Strategien.'
                      : 'This context flows into every WladBot answer — chat, video feedback, strategies.'}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="h-8 text-[11px] shrink-0" data-testid="about-me-edit-btn">
                  <Edit3 size={12} className="mr-1" />
                  {profile.about_me ? (de ? 'Bearbeiten' : 'Edit') : (de ? 'Jetzt ausfüllen' : 'Fill in now')}
                </Button>
              </div>
              {profile.about_me ? (
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-muted-foreground" data-testid="about-me-text">
                  {profile.about_me}
                </p>
              ) : (
                <p className="text-[12px] text-muted-foreground" data-testid="about-me-empty">
                  {de
                    ? 'Noch leer. Je konkreter du hier über deine Rolle, dein Team, deine Baustellen und Ziele schreibst, desto konkreter wird das Feedback — statt allgemeiner Ratschläge.'
                    : 'Still empty. The more concrete you are about your role, team, blockers and goals, the more concrete the feedback gets.'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── LEVEL PROGRESS ─── */}
        <LevelProgress xp={profile.xp} level={profile.level} de={de} />

        {/* ─── STATS GRID ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatTile icon={Zap} label={de ? 'XP Total' : 'Total XP'} value={profile.xp.toLocaleString('de-DE')} color="#BFFF00" testid="stat-xp" />
          <StatTile icon={Flame} label={de ? 'Streak' : 'Streak'} value={profile.streak || 0} color="#FF8A00" testid="stat-streak" />
          <StatTile icon={Target} label={de ? '30-T Tage' : 'Ch. days'} value={profile.stats.challenge_days_completed} color="#FF4444" testid="stat-challenge-days" />
          <StatTile icon={Brain} label={de ? 'Sessions' : 'Sessions'} value={profile.stats.chat_sessions} color="#9333EA" testid="stat-sessions" />
          <StatTile icon={Gift} label={de ? 'Empf.' : 'Refs'} value={profile.stats.referrals} color="#F59E0B" testid="stat-referrals" />
          <StatTile icon={MessageCircle} label={de ? 'Posts' : 'Posts'} value={profile.stats.community_posts} color="#14B8A6" testid="stat-posts" />
        </div>

        {/* ─── 3-DIMENSIONAL SCORES ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid="dimension-scores">
          {[
            { label: de ? 'Leadership' : 'Leadership', value: profile.leadership_score, color: '#BFFF00', icon: Crown },
            { label: de ? 'Kommunikation' : 'Communication', value: profile.communication_score, color: '#00AAFF', icon: MessageCircle },
            { label: 'EQ', value: profile.eq_score, color: '#FFB800', icon: Sparkles },
          ].map(d => (
            <Card key={d.label} className="group border-black/[0.04] dark:border-white/[0.06] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110" style={{ background: `${d.color}1F` }}>
                    <d.icon size={14} style={{ color: d.color }} strokeWidth={2.5} />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{d.label}</span>
                </div>
                <p className="text-2xl font-black tabular-nums">{d.value}<span className="text-sm text-muted-foreground font-bold">/100</span></p>
                <div className="h-1 mt-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${d.value}%`, background: d.color }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── TABS: Activity + Achievements ─── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/40 p-1 h-auto" data-testid="profile-tabs">
            <TabsTrigger value="activity" className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm" data-testid="profile-tab-activity">
              <ActivityIcon size={13} /> {de ? 'Letzte Aktivitäten' : 'Recent Activity'}
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm" data-testid="profile-tab-stats">
              <TrendingUp size={13} /> {de ? '30-Tage Übersicht' : '30-Day Overview'}
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm" data-testid="profile-tab-account">
              <Settings size={13} /> {de ? 'Konto' : 'Account'}
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm" data-testid="profile-tab-security">
              <Shield size={13} /> {de ? 'Sicherheit' : 'Security'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-4">
            <Card className="border-black/[0.04] dark:border-white/[0.06]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black">{de ? 'Dein Leader-Journal' : 'Your Leader Journal'}</h3>
                    <p className="text-[11px] text-muted-foreground">{de ? `${activity?.total || 0} Einträge · +${activity?.xp_last_30d || 0} XP in den letzten 30 Tagen` : `${activity?.total || 0} entries · +${activity?.xp_last_30d || 0} XP in last 30 days`}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate('/my-path')} className="text-[11px] h-8" data-testid="profile-view-journey">
                    {de ? 'Journey ansehen' : 'View journey'} <ArrowRight size={11} className="ml-1" />
                  </Button>
                </div>
                <ActivityFeed activities={activity?.activities || []} de={de} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <Card className="border-black/[0.04] dark:border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <div className="text-center py-4">
                  <p className="text-6xl font-black tabular-nums text-[#BFFF00]">+{activity?.xp_last_30d || 0}</p>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-2">{de ? 'XP in 30 Tagen' : 'XP in 30 days'}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <Calendar size={14} className="mx-auto text-[#BFFF00] mb-1" />
                    <p className="text-lg font-black">{activity?.total || 0}</p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase">{de ? 'Aktionen' : 'Actions'}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <Flame size={14} className="mx-auto text-orange-500 mb-1" />
                    <p className="text-lg font-black">{profile.streak || 0}</p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase">{de ? 'Streak' : 'Streak'}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <Trophy size={14} className="mx-auto text-amber-500 mb-1" />
                    <p className="text-lg font-black">{profile.stats.simulations}</p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase">{de ? 'Sims' : 'Sims'}</p>
                  </div>
                </div>
                <Button onClick={() => navigate('/challenge')} className="w-full bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] text-white font-bold" data-testid="profile-go-challenge">
                  <Flame size={14} className="mr-2" /> {de ? '30-Tage Challenge öffnen' : 'Open 30-Day Challenge'} <ArrowRight size={14} className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-4 space-y-4">
            <ProfileAccountTab de={de} />
            <BillingSection de={de} />
            <GdprSection de={de} />
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <ProfileSecurityTab de={de} />
          </TabsContent>
        </Tabs>

      </div>
    </DashboardLayout>
  );
}
