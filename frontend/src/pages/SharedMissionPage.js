/**
 * SharedMissionPage — Public showcase of a user's video-mission analysis.
 *
 * Mert (Iter 92.23, P2): User können ihre besten Mission-Scores teilen.
 * URL Format: /m/{slug}
 *
 * Page Goal:
 *   1. Social-Proof: zeige Score + Wlad's Einschätzung
 *   2. Conversion: prominenter CTA "Jetzt selbst testen → Leader-OS"
 *   3. Authenticity: Username + Avatar, Wlad-Logo Watermark
 *
 * Public route — no auth required. Backend redacts PII (no full transcript).
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trophy, Sparkles, CheckCircle2, Target, Eye, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import logger from '../lib/logger';

const ScoreTile = ({ label, value, color }) => (
  <div className="rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06] p-3 text-center">
    <p className="text-2xl font-black" style={{ color }}>{value || 0}</p>
    <p className="text-[9px] uppercase tracking-widest font-bold text-white/40 mt-1">{label}</p>
  </div>
);

export default function SharedMissionPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/missions/share/${slug}`);
        setData(res.data);
      } catch (err) {
        logger.error('Shared mission load failed:', err);
        setError(err?.response?.status === 404 ? 'gone' : 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#BFFF00]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle size={40} className="text-white/30 mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">Mission nicht gefunden</h1>
        <p className="text-sm text-white/50 mb-6 max-w-md">
          Diese geteilte Mission existiert nicht mehr oder der Link ist abgelaufen.
        </p>
        <Button onClick={() => navigate('/')} className="bg-[#BFFF00] hover:bg-[#A8E600] text-black font-black">
          Zur Startseite
        </Button>
      </div>
    );
  }

  const scoreColor =
    data.overall_score >= 85 ? '#10B981' :
    data.overall_score >= 70 ? '#F59E0B' :
    data.overall_score >= 50 ? '#3B82F6' :
    '#EF4444';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#0F0F1A] to-[#0A0A0A] text-white" data-testid="shared-mission-page">
      {/* Top Bar */}
      <div className="border-b border-white/[0.06] backdrop-blur-md sticky top-0 z-50 bg-[#0A0A0A]/80">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" data-testid="shared-mission-brand">
            <div className="w-9 h-9 rounded-lg bg-[#BFFF00] flex items-center justify-center font-black text-black text-lg shadow-lg shadow-[#BFFF00]/20">
              W
            </div>
            <div>
              <p className="text-sm font-black tracking-tight">LEADER-OS</p>
              <p className="text-[9px] uppercase tracking-widest text-white/40">powered by WladBot</p>
            </div>
          </Link>
          <Button
            onClick={() => navigate('/login')}
            className="bg-[#BFFF00] hover:bg-[#A8E600] text-black font-black h-9 text-xs"
            data-testid="shared-mission-cta-top"
          >
            Selbst testen <ArrowRight size={13} className="ml-1" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {/* Author */}
        <div className="flex items-center gap-3" data-testid="shared-mission-author">
          {data.user_picture ? (
            <img src={data.user_picture} alt={data.user_name} className="w-12 h-12 rounded-full ring-2 ring-[#BFFF00]/30" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#BFFF00]/15 flex items-center justify-center font-black text-[#BFFF00]">
              {(data.user_name || 'L')[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-black">{data.user_name || 'Ein Leader'}</p>
            <p className="text-xs text-white/40 flex items-center gap-2">
              hat eine Mission abgeschlossen
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] text-white/50 text-[10px]">
                <Eye size={9} /> {data.view_count || 1}
              </span>
            </p>
          </div>
        </div>

        {/* Mission Title */}
        <div data-testid="shared-mission-title">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-[#BFFF00]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#BFFF00]">
              {data.challenge_difficulty || 'Mittel'} · Video Mission
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {data.challenge_title}
          </h1>
          {data.challenge_description && (
            <p className="text-base text-white/60 mt-3 max-w-2xl">{data.challenge_description}</p>
          )}
        </div>

        {/* Hero Score */}
        <Card className="border-0 bg-gradient-to-br from-[#1A1A2E] via-[#0F0F1A] to-[#0A0A0A] overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-10"
            style={{ background: `radial-gradient(circle at 30% 20%, ${scoreColor}, transparent 60%)` }}
            aria-hidden
          />
          <CardContent className="p-8 sm:p-10 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Mission Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl sm:text-8xl font-black leading-none" style={{ color: scoreColor }}>
                    {data.overall_score || 0}
                  </span>
                  <span className="text-2xl font-black text-white/30">/100</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                <ScoreTile label="Klarheit" value={data.clarity_score} color="#00AAFF" />
                <ScoreTile label="Souveränität" value={data.confidence_score} color="#7C3AED" />
                <ScoreTile label="Empathie" value={data.empathy_score} color="#EC4899" />
                <ScoreTile label="Struktur" value={data.structure_score} color="#10B981" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEXIER (neu) — Fallback: 3 Säulen für Alt-Analysen */}
        {data.sexier_scores ? (
          <Card className="border-[#BFFF00]/15 bg-white/[0.02]">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#BFFF00] mb-4">
                Wlads SEXIER-Analyse
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <ScoreTile label="S · Statement" value={data.sexier_scores.statement} color="#F59E0B" />
                <ScoreTile label="E · Explanation" value={data.sexier_scores.explanation} color="#EC4899" />
                <ScoreTile label="X · eXample" value={data.sexier_scores.example} color="#6366F1" />
                <ScoreTile label="I · Impact" value={data.sexier_scores.impact} color="#0EA5E9" />
                <ScoreTile label="E · Expl. of Impact" value={data.sexier_scores.impact_explanation} color="#8B5CF6" />
                <ScoreTile label="R · Rebuttal" value={data.sexier_scores.rebuttal} color="#10B981" />
              </div>
            </CardContent>
          </Card>
        ) : (data.logos_score || data.ethos_score || data.pathos_score) > 0 && (
          <Card className="border-[#BFFF00]/15 bg-white/[0.02]">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#BFFF00] mb-4">
                Wlads 3 Säulen der Überzeugung
              </p>
              <div className="grid grid-cols-3 gap-4">
                <ScoreTile label="Logos · Logik" value={data.logos_score} color="#6366F1" />
                <ScoreTile label="Ethos · Kredibilität" value={data.ethos_score} color="#8B5CF6" />
                <ScoreTile label="Pathos · Emotion" value={data.pathos_score} color="#A78BFA" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wlad's Assessment */}
        {data.wlad_assessment && (
          <Card className="border-0 bg-gradient-to-br from-[#1A1A2E] to-[#0A0A0A] relative">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BFFF00]/10 ring-1 ring-[#BFFF00]/30">
              <div className="w-3.5 h-3.5 rounded-sm bg-[#BFFF00] flex items-center justify-center">
                <span className="text-[7px] font-black text-black leading-none">W</span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#BFFF00] leading-none">LEADER-OS</span>
            </div>
            <CardContent className="p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#BFFF00] mb-3">
                Wlad Jachtchenkos Einschätzung
              </p>
              <p className="text-lg sm:text-xl leading-relaxed text-white/95 font-medium">
                "{data.wlad_assessment}"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Strengths + Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.strengths?.length > 0 && (
            <Card className="border-l-[3px] border-l-green-500 bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5">
                <p className="text-[11px] font-black uppercase tracking-wider text-green-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={12} /> 3 Dinge top gemacht
                </p>
                <ul className="space-y-2.5">
                  {data.strengths.map((s, idx) => (
                    <li key={`s-${idx}`} className="flex gap-2 text-sm leading-relaxed text-white/85">
                      <span className="text-xs font-black text-green-500 w-5 shrink-0 mt-0.5">{idx + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {data.improvements?.length > 0 && (
            <Card className="border-l-[3px] border-l-amber-500 bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5">
                <p className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                  <Target size={12} /> 3 Verbesserungspunkte
                </p>
                <ul className="space-y-2.5">
                  {data.improvements.map((s, idx) => (
                    <li key={`i-${idx}`} className="flex gap-2 text-sm leading-relaxed text-white/85">
                      <span className="text-xs font-black text-amber-500 w-5 shrink-0 mt-0.5">{idx + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Final CTA — the conversion driver */}
        <Card className="border-0 bg-gradient-to-r from-[#BFFF00] to-[#A8E600] text-black overflow-hidden">
          <CardContent className="p-8 sm:p-10 text-center">
            <Trophy size={32} className="mx-auto mb-3" />
            <h2 className="text-2xl sm:text-3xl font-black mb-2">
              Willst du auch so eine Analyse?
            </h2>
            <p className="text-sm sm:text-base font-medium mb-5 max-w-lg mx-auto opacity-80">
              Werde der nächste {data.user_name || 'Leader'}. KI-gestütztes Leadership-Training,
              Wlad Jachtchenkos Frameworks, sofortiges Feedback nach jeder Übung.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => navigate('/login')}
                className="bg-[#0A0A0A] hover:bg-[#1A1A2E] text-white font-black h-12 px-8 text-base shadow-xl shadow-black/30"
                data-testid="shared-mission-cta-bottom"
              >
                Jetzt selbst testen <ArrowRight size={16} className="ml-1.5" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-black hover:bg-black/10 font-bold h-12 px-6"
              >
                Mehr erfahren
              </Button>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-5">
              Powered by Leader-OS · WladBot · KI-Coach
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
