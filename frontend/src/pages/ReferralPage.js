import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import logger from '../lib/logger';
import { generatePDF } from '../lib/pdfGenerator';
import { toast } from 'sonner';
import { LEADERCHECK_URL } from '../lib/domains';
import {
  Share2, Copy, Users, Trophy, Star, ArrowRight, Gift,
  Linkedin, Award, TrendingUp, Crown, Zap, CheckCircle2,
  Target, Heart, Shield, ExternalLink
} from 'lucide-react';

const WLAD_AVATAR = 'https://leadercheck.de/wladbot-3-nobg.png';

export default function ReferralPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const de = lang === 'de';
  const [referralData, setReferralData] = useState(null);
  const [certData, setCertData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [refRes, certRes, lbRes] = await Promise.all([
        api.get('/referral/code'),
        api.get('/referral/certificate'),
        api.get('/referral/leaderboard'),
      ]);
      setReferralData(refRes.data);
      setCertData(certRes.data);
      setLeaderboard(lbRes.data);
    } catch (err) { logger.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyCode = () => {
    if (referralData?.share_url) {
      navigator.clipboard.writeText(referralData.share_url);
      toast.success(de ? 'Link kopiert!' : 'Link copied!');
    }
  };

  const shareOn = async (platform) => {
    const url = referralData?.share_url || LEADERCHECK_URL;
    const text = de
      ? `Ich nutze WladBot — das KI Leadership OS von Wlad Jachtchenko. Teste es kostenlos:`
      : `I use WladBot — the AI Leadership OS by Wlad Jachtchenko. Try it free:`;

    const links = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    };
    if (links[platform]) window.open(links[platform], '_blank');
    try { await api.post('/referral/share', { platform, content_type: 'referral' }); } catch (err) { logger.error('Share tracking failed:', err); }
  };

  const shareLeaderScore = async (platform) => {
    const text = de
      ? `Mein Leadership Score: ${certData?.leadership_score || 0}/100 — Level: ${certData?.level}. Teste deinen auf WladBot!`
      : `My Leadership Score: ${certData?.leadership_score || 0}/100 — Level: ${certData?.level}. Test yours on WladBot!`;
    const url = referralData?.share_url || LEADERCHECK_URL;

    const links = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    };
    if (links[platform]) window.open(links[platform], '_blank');
    try { await api.post('/referral/share', { platform, content_type: 'leader_score' }); } catch (err) { logger.error('Score share tracking failed:', err); }
  };

  const downloadCertificate = async () => {
    if (!certData) return;
    await generatePDF({
      title: `Leadership Zertifikat — ${certData.name}`,
      overall_assessment: `${certData.name} hat das WladBot Leadership Programm erfolgreich durchlaufen und dabei ${certData.simulations_completed} Simulationen und ${certData.challenges_completed} Challenger-Interviews absolviert.`,
      score: certData.leadership_score,
      strengths: [
        `Level: ${certData.level}`,
        `${certData.xp} XP gesammelt`,
        `Position: ${certData.position || 'Leader'}`,
        `Mitglied seit: ${certData.member_since ? new Date(certData.member_since).toLocaleDateString('de-DE') : 'N/A'}`,
      ],
      next_steps: [
        'Teile dein Zertifikat auf LinkedIn',
        'Lade 3 Kollegen ein und werde Connector',
        'Starte das nächste Playbook für dein Wachstum',
      ],
    }, `WladBot-Zertifikat-${certData.name?.replace(/\s+/g, '-')}`);
  };

  const tierColors = { Starter: 'text-gray-500', Connector: 'text-sky-500', Influencer: 'text-purple-500', Ambassador: 'text-amber-500', Legend: 'text-rose-500' };
  const tierIcons = { Starter: Star, Connector: Users, Influencer: Zap, Ambassador: Crown, Legend: Trophy };

  if (loading) return <DashboardLayout><div className="p-10 text-center"><div className="w-12 h-12 border-3 border-[#BFFF00] border-t-transparent rounded-full animate-spin mx-auto" /></div></DashboardLayout>;

  const tier = referralData?.tier || {};
  const nextTier = referralData?.next_tier;
  const TierIcon = tierIcons[tier.name] || Star;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6 bg-gradient-mesh min-h-screen" data-testid="referral-page">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Gift size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{de ? 'Empfehlen & Verdienen' : 'Refer & Earn'}</h1>
            <p className="text-sm text-muted-foreground font-medium">{de ? 'Teile WladBot. Verdiene Rewards. Steige im Tier auf.' : 'Share WladBot. Earn rewards. Level up your tier.'}</p>
          </div>
        </div>

        {/* Referral Code Card */}
        <Card className="bg-gradient-to-br from-[#BFFF00]/[0.06] to-[#BFFF00]/[0.04] dark:from-[#BFFF00]/[0.04] dark:to-[#BFFF00]/[0.03] border-[#BFFF00]/20 animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge className={`${tierColors[tier.name] || ''} bg-white dark:bg-card border text-xs font-bold`}>
                  <TierIcon size={12} className="mr-1" /> {tier.name}
                </Badge>
                <p className="text-2xl font-black mt-2">{referralData?.referral_count || 0} <span className="text-base text-muted-foreground font-medium">{de ? 'Empfehlungen' : 'Referrals'}</span></p>
              </div>
              {nextTier && (
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{de ? 'Nächstes Tier' : 'Next Tier'}</p>
                  <p className="text-sm font-bold">{nextTier.name}</p>
                  <p className="text-xs text-muted-foreground">{de ? `Noch ${nextTier.min_refs - (referralData?.referral_count || 0)} Empfehlungen` : `${nextTier.min_refs - (referralData?.referral_count || 0)} more referrals`}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Input value={referralData?.share_url || ''} readOnly className="bg-white dark:bg-card font-mono text-sm" data-testid="referral-url" />
              <Button onClick={copyCode} variant="outline" className="shrink-0 font-semibold" data-testid="copy-referral-btn">
                <Copy size={14} className="mr-1" /> {de ? 'Kopieren' : 'Copy'}
              </Button>
            </div>

            {/* Social Share Buttons */}
            <div className="flex gap-2 mt-4">
              <Button onClick={() => shareOn('linkedin')} className="flex-1 bg-[#0A66C2] text-white font-semibold h-10" data-testid="share-linkedin">
                <Linkedin size={14} className="mr-1.5" /> LinkedIn
              </Button>
              <Button onClick={() => shareOn('twitter')} className="flex-1 bg-black text-white font-semibold h-10" data-testid="share-twitter">
                <ExternalLink size={14} className="mr-1.5" /> X / Twitter
              </Button>
              <Button onClick={() => shareOn('whatsapp')} className="flex-1 bg-[#25D366] text-white font-semibold h-10" data-testid="share-whatsapp">
                <Share2 size={14} className="mr-1.5" /> WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tier Progress */}
        <div className="grid grid-cols-5 gap-2 animate-fade-in">
          {(referralData?.tiers || []).map((t) => {
            const active = (referralData?.referral_count || 0) >= t.min_refs;
            const TIcon = tierIcons[t.name] || Star;
            return (
              <div key={t.name} className={`p-3 rounded-xl text-center border transition-all ${active ? 'bg-gradient-to-br from-[#BFFF00]/[0.06] to-[#BFFF00]/[0.04] dark:from-[#BFFF00]/10 dark:to-purple-500/10 border-[#BFFF00]/20/50' : 'bg-white dark:bg-card border-black/[0.04] dark:border-white/[0.06] opacity-50'}`} data-testid={`tier-${t.name.toLowerCase()}`}>
                <TIcon size={16} className={`mx-auto mb-1 ${active ? 'text-[#6B8A00] dark:text-[#BFFF00]' : 'text-muted-foreground'}`} />
                <p className="text-[10px] font-bold">{t.name}</p>
                <p className="text-[9px] text-muted-foreground">{t.min_refs}+ refs</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Leader Score Share */}
          <Card className="animate-fade-in">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2"><Award size={16} className="text-[#6B8A00] dark:text-[#BFFF00]" /> {de ? 'Leader Score teilen' : 'Share Leader Score'}</h3>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-[#BFFF00]/[0.06] to-[#BFFF00]/[0.04] dark:from-[#BFFF00]/[0.04] dark:to-[#BFFF00]/[0.03]">
                <div className="text-center">
                  <p className="text-3xl font-black gradient-text">{certData?.leadership_score || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-bold">/100</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{certData?.name}</p>
                  <p className="text-xs text-muted-foreground">{certData?.level} — {certData?.xp || 0} XP</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => shareLeaderScore('linkedin')} className="flex-1 bg-[#0A66C2] text-white text-xs" data-testid="share-score-linkedin">
                  <Linkedin size={12} className="mr-1" /> LinkedIn
                </Button>
                <Button size="sm" onClick={() => shareLeaderScore('twitter')} className="flex-1 bg-black text-white text-xs" data-testid="share-score-twitter">
                  <ExternalLink size={12} className="mr-1" /> X
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Download */}
          <Card className="animate-fade-in">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2"><Award size={16} className="text-amber-500" /> {de ? 'Leadership Zertifikat' : 'Leadership Certificate'}</h3>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-200/30 text-center">
                <img src={WLAD_AVATAR} alt="Wlad" className="w-12 h-12 rounded-full mx-auto mb-2 ring-2 ring-amber-300" />
                <p className="text-xs font-bold">{de ? 'Zertifiziert von' : 'Certified by'}</p>
                <p className="text-sm font-black">Wlad Jachtchenko</p>
              </div>
              <Button onClick={downloadCertificate} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-sm" data-testid="download-certificate-btn">
                <Award size={14} className="mr-1.5" /> {de ? 'Zertifikat herunterladen (PDF)' : 'Download Certificate (PDF)'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3"><Trophy size={16} className="text-amber-500" /> {de ? 'Top Empfehler' : 'Top Referrers'}</h3>
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((l, lbIdx) => (
                  <div key={l.name || `lb-${lbIdx}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${lbIdx < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-gray-100 dark:bg-muted text-muted-foreground'}`}>{lbIdx + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{l.name}</p>
                      <p className="text-[10px] text-muted-foreground">{l.level}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">{l.referrals} refs</Badge>
                    <Badge className="text-[9px] font-bold bg-[#BFFF00]/[0.06] text-[#4A6200] border-0">{l.tier}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
