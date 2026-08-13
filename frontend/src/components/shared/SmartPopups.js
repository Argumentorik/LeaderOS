import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { X, ArrowRight, Zap, Share2, Gift, Flame } from 'lucide-react';

const WLAD = '/wladbot-avatar-clean.png';

// Pages where SmartPopups should NEVER fire (user already on a high-intent flow,
// or active work that a popup would interrupt).
const POPUP_BLOCKED_PATHS = [
  '/coaching', '/payment-success', '/downloads', '/onboarding',
  '/tools', '/missions', '/simulations', '/playbooks', '/challengers',
  '/leader-diagnose', '/chat', '/video-challenge',
];

export const SmartPopups = ({ userData }) => {
  const [popup, setPopup] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const onBlockedPath = POPUP_BLOCKED_PATHS.some(p => location.pathname.startsWith(p));

  const check = useCallback(() => {
    if (!userData || onBlockedPath) return;
    const dismissed = JSON.parse(localStorage.getItem('wladbot_popups') || '{}');
    const now = Date.now();
    const cooldown = 7 * 24 * 60 * 60 * 1000;       // 7 Tage zwischen demselben Popup-Typ
    const oneDay = 24 * 60 * 60 * 1000;

    // Track first session timestamp for 7-day grace period (no upsell pressure for new users)
    let firstSeen = parseInt(localStorage.getItem('wladbot_first_seen') || '0');
    if (!firstSeen) { firstSeen = now; localStorage.setItem('wladbot_first_seen', String(now)); }
    const hoursSinceSignup = (now - firstSeen) / (60 * 60 * 1000);

    const sessions = parseInt(localStorage.getItem('wladbot_sessions') || '0');
    localStorage.setItem('wladbot_sessions', String(sessions + 1));

    // Hard rate-limit: max 1 popup pro Tag insgesamt, ganz egal welcher Typ
    const lastAnyPopupAt = parseInt(localStorage.getItem('wladbot_last_any_popup') || '0');
    if (now - lastAnyPopupAt < oneDay) return;

    // Per-session throttle: nur 1 Popup pro Session, niemals früher als 30s nach Start
    const sessionShown = sessionStorage.getItem('wladbot_popup_shown_this_session');
    if (sessionShown) return;

    const trigger = (id, delay) => {
      setTimeout(() => {
        setPopup(id);
        sessionStorage.setItem('wladbot_popup_shown_this_session', '1');
        localStorage.setItem('wladbot_last_any_popup', String(Date.now()));
      }, delay);
    };

    // Popup 1: Re-engagement — nur nach 5+ Sessions ohne Streak
    if (!dismissed.reeng || now - dismissed.reeng > cooldown) {
      const streak = userData.streak?.days || 0;
      if (streak === 0 && sessions > 5) {
        trigger('reeng', 8000);
        return;
      }
    }
    // Popup 2: Achievement — nur 1× pro Session, nach 8 Sessions
    if (!dismissed.achieve || now - dismissed.achieve > cooldown) {
      const xp = userData.xp || 0;
      if (xp > 0 && xp % 250 < 30 && sessions > 8) {
        trigger('achieve', 10000);
        return;
      }
    }
    // Popup 3: Premium nudge — nur nach 7 TAGEN aktiver Nutzung + 8+ Sessions
    if (!dismissed.premium || now - dismissed.premium > cooldown * 2) {
      if (!userData.premium && sessions >= 8 && hoursSinceSignup >= 7 * 24) {
        trigger('premium', 12000);
        return;
      }
    }
  }, [userData, onBlockedPath]);

  useEffect(() => { check(); }, [check]);
  // Auto-dismiss any active popup when navigating into a blocked path
  useEffect(() => { if (onBlockedPath && popup) setPopup(null); }, [onBlockedPath, popup]);

  const dismiss = (id) => {
    const d = JSON.parse(localStorage.getItem('wladbot_popups') || '{}');
    d[id] = Date.now();
    localStorage.setItem('wladbot_popups', JSON.stringify(d));
    setPopup(null);
  };

  if (!popup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => dismiss(popup)} data-testid={`popup-${popup}`}>
      <div className="w-[400px] max-w-[90vw] mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
        {popup === 'reeng' && (
          <Card className="border-0 shadow-2xl overflow-hidden bg-white dark:bg-card">
            <div className="bg-[#0A0A0A] p-5 text-white relative">
              <button onClick={() => dismiss('reeng')} className="absolute top-3 right-3 text-white/40 hover:text-white"><X size={16} /></button>
              <img src={WLAD} alt="Wlad" className="w-12 h-12 rounded-full mx-auto mb-2 ring-2 ring-white/10 object-cover" />
              <p className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider">Wlad sagt</p>
            </div>
            <CardContent className="p-5 text-center space-y-3">
              <p className="text-sm font-semibold leading-relaxed">"Konsistenz schlägt Talent. Jeden Tag ein kleiner Schritt — das unterscheidet echte Leader."</p>
              <p className="text-xs text-muted-foreground">Deine Challenge wartet auf dich.</p>
              <Button onClick={() => { dismiss('reeng'); navigate('/challenge'); }} className="w-full bg-[#0A0A0A] text-white font-bold h-11" data-testid="popup-reeng-cta">
                <Flame size={14} className="mr-1.5 text-[#BFFF00]" /> Jetzt weitermachen <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {popup === 'achieve' && (
          <Card className="border-0 shadow-2xl overflow-hidden bg-white dark:bg-card">
            <div className="bg-[#BFFF00] p-5 text-[#0A0A0A] text-center relative">
              <button onClick={() => dismiss('achieve')} className="absolute top-3 right-3 text-black/30 hover:text-black"><X size={16} /></button>
              <div className="w-14 h-14 rounded-2xl bg-[#0A0A0A] flex items-center justify-center mx-auto mb-2">
                <Zap size={24} className="text-[#BFFF00]" />
              </div>
              <p className="text-lg font-black">{Math.floor((userData?.xp || 0) / 100) * 100}+ XP!</p>
              <p className="text-xs text-black/50 mt-1">Level: {userData?.level || 'Emerging Leader'}</p>
            </div>
            <CardContent className="p-5 text-center space-y-3">
              <p className="text-sm font-semibold">Du machst echten Fortschritt!</p>
              <p className="text-xs text-muted-foreground">Bleib dran — deine nächste Challenge wartet.</p>
              <Button onClick={() => { dismiss('achieve'); navigate('/challenge'); }} className="w-full bg-[#0A0A0A] text-white font-bold h-11" data-testid="popup-achieve-cta">
                <Flame size={14} className="mr-1.5 text-[#BFFF00]" /> Nächste Challenge starten <ArrowRight size={14} className="ml-1.5" />
              </Button>
              <button onClick={() => dismiss('achieve')} className="text-xs text-muted-foreground hover:text-foreground">Später</button>
            </CardContent>
          </Card>
        )}

        {popup === 'premium' && (
          <Card className="border-0 shadow-2xl overflow-hidden bg-white dark:bg-card">
            <div className="bg-[#0A0A0A] p-5 text-white text-center relative">
              <button onClick={() => dismiss('premium')} className="absolute top-3 right-3 text-white/40 hover:text-white"><X size={16} /></button>
              <div className="w-14 h-14 rounded-2xl bg-[#BFFF00]/15 flex items-center justify-center mx-auto mb-2">
                <Gift size={24} className="text-[#BFFF00]" />
              </div>
              <p className="text-lg font-black">Launch-Preis sichern</p>
            </div>
            <CardContent className="p-5 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Du nutzt WladBot aktiv — schalte 16 Video-Missionen, 300 Challenge-Fragen und unbegrenztes Coaching frei.</p>
              <p className="text-2xl font-black">€997 <span className="text-sm font-normal text-muted-foreground">/ Jahr</span></p>
              <Button onClick={() => { dismiss('premium'); navigate('/coaching'); }} className="w-full bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold h-11" data-testid="popup-premium-cta">
                Premium werden <ArrowRight size={14} className="ml-1.5" />
              </Button>
              <button onClick={() => dismiss('premium')} className="text-xs text-muted-foreground hover:text-foreground">Vielleicht später</button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
