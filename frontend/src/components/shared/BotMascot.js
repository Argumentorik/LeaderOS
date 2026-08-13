import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { BotMascotRinging } from './BotMascotRinging';
import { BotMascotPanel } from './BotMascotPanel';

const WLAD_IMG = 'https://leadercheck.de/wladbot-3-nobg.png';

export const BotMascot = () => {
  const [phase, setPhase] = useState('idle');
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const de = lang === 'de';

  useEffect(() => {
    const dismissed = sessionStorage.getItem('wlad_call_dismissed');
    if (dismissed) return;
    const timer = setTimeout(() => setPhase('ringing'), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = useCallback(() => setPhase('connected'), []);
  const handleDecline = useCallback(() => {
    setPhase('idle');
    sessionStorage.setItem('wlad_call_dismissed', '1');
  }, []);
  const handleReopen = useCallback(() => setPhase('connected'), []);
  const handleClose = useCallback(() => setPhase('idle'), []);

  const handleNavigate = useCallback((path) => {
    setPhase('idle');
    navigate(path);
  }, [navigate]);

  const handleCheckout = useCallback(async (pkgId) => {
    setCheckoutLoading(pkgId);
    try {
      const res = await api.post('/payments/checkout', { package_id: pkgId, origin_url: window.location.origin });
      if (res.data.url) window.location.href = res.data.url;
    } catch (err) {
      logger.error('Checkout error:', err);
    } finally {
      setCheckoutLoading('');
    }
  }, []);

  // No idle button — only ringing call and connected panel
  if (phase === 'idle') return null;

  if (phase === 'ringing') {
    return <><BotMascotRinging de={de} onAccept={handleAccept} onDecline={handleDecline} /><BotMascotStyles /></>;
  }

  return <><BotMascotPanel de={de} onClose={handleClose} onNavigate={handleNavigate} onCheckout={handleCheckout} checkoutLoading={checkoutLoading} /><BotMascotStyles /></>;
};

const BotMascotStyles = () => (
  <style>{`
    @keyframes wlad-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes wlad-slide-up { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes wlad-ring-1 { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(1.6); opacity: 0; } }
    @keyframes wlad-ring-2 { 0% { transform: scale(1); opacity: 0.2; } 100% { transform: scale(2); opacity: 0; } }
    @keyframes wlad-pulse-green { 0%, 100% { box-shadow: 0 0 0 0 rgba(48,209,88,0.4); } 50% { box-shadow: 0 0 0 14px rgba(48,209,88,0); } }
    .wlad-fade-in { animation: wlad-fade-in 0.4s ease-out; }
    .wlad-slide-up { animation: wlad-slide-up 0.45s cubic-bezier(0.16,1,0.3,1); }
    .wlad-ring-1 { animation: wlad-ring-1 2s cubic-bezier(0,0,0.2,1) infinite; }
    .wlad-ring-2 { animation: wlad-ring-2 2.5s cubic-bezier(0,0,0.2,1) infinite 0.5s; }
    .wlad-pulse-green { animation: wlad-pulse-green 2s ease-in-out infinite; }
  `}</style>
);
