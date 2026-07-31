import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import { useCredits } from '../contexts/CreditContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import logger from '../lib/logger';
import { CheckCircle2, Loader2, XCircle, ArrowRight, Zap, Crown, Flame, Brain, Video, Target, Users, Star, FileText, MessageCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const { lang } = useLanguage();
  const de = lang === 'de';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { reload: reloadCredits } = useCredits();
  const { checkAuth } = useAuth();
  const [status, setStatus] = useState('checking');
  const [paymentData, setPaymentData] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }
    let attempts = 0;

    const poll = async () => {
      try {
        const res = await api.get(`/payments/checkout/status/${sessionId}`);
        if (res.data.payment_status === 'paid') {
          setStatus('success');
          setPaymentData(res.data);
          reloadCredits();
          if (checkAuth) checkAuth();
          return;
        }
        if (res.data.status === 'expired') { setStatus('expired'); return; }
        attempts++;
        if (attempts < 5) setTimeout(poll, 2000);
        else setStatus('timeout');
      } catch {
        attempts++;
        if (attempts < 5) setTimeout(poll, 2000);
        else setStatus('error');
      }
    };
    poll();
  }, [sessionId, reloadCredits, checkAuth]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-lg mx-auto flex items-center justify-center min-h-[60vh]" data-testid="payment-success-page">
        {status === 'checking' && (
          <Card className="w-full border-black/[0.04]">
            <CardContent className="p-8 text-center space-y-4">
              <Loader2 size={40} className="mx-auto text-[#BFFF00] animate-spin" />
              <h2 className="text-xl font-black">{de ? 'Zahlung wird überprüft...' : 'Verifying payment...'}</h2>
              <p className="text-sm text-muted-foreground">{de ? 'Bitte warte einen Moment.' : 'Please wait a moment.'}</p>
            </CardContent>
          </Card>
        )}

        {status === 'success' && (
          <Card className="w-full border-0 overflow-hidden animate-fade-in">
            <div className="bg-[#0A0A0A] p-6 text-white text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#BFFF00] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={32} className="text-[#0A0A0A]" />
              </div>
              <Badge className="bg-[#BFFF00] text-[#0A0A0A] border-0 text-sm font-bold px-4 py-1 mb-2">
                <Crown size={14} className="mr-1" /> PREMIUM AKTIV
              </Badge>
              <h2 className="text-2xl font-black mt-2">{de ? 'Willkommen, Leader!' : 'Welcome, Leader!'}</h2>
              <p className="text-white/50 text-sm mt-1">{de ? 'Dein Zugang ist freigeschaltet. Alle Features sind jetzt verfügbar.' : 'Your access is unlocked. All features are now available.'}</p>
            </div>
            <CardContent className="p-6 space-y-4">
              {/* What's unlocked */}
              <div className="space-y-2">
                {[
                  { icon: Flame, label: de ? '30-Tage KI-Leadership Programm' : '30-Day AI Leadership Program', unlocked: true },
                  { icon: Brain, label: de ? 'Unbegrenzter KI-Coach' : 'Unlimited AI Coach', unlocked: true },
                  { icon: Video, label: de ? '16 Video-Missionen' : '16 Video Missions', unlocked: true },
                  { icon: Target, label: de ? '10 Geführte Workflows' : '10 Guided Workflows', unlocked: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#BFFF00]/5 border border-[#BFFF00]/10">
                    <item.icon size={16} className="text-[#BFFF00] shrink-0" />
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    <CheckCircle2 size={14} className="text-[#BFFF00] shrink-0" />
                  </div>
                ))}
              </div>

              {paymentData && (
                <div className="text-center py-1">
                  <p className="text-xs text-muted-foreground">{paymentData.amount} {paymentData.currency?.toUpperCase()} · 2 Jahre Zugang</p>
                </div>
              )}

              <Button onClick={() => navigate('/challenge')} className="w-full bg-[#BFFF00] text-[#0A0A0A] hover:bg-[#D4FF4D] font-bold h-12 shadow-lg shadow-[#BFFF00]/20" data-testid="success-start-challenge">
                <Zap size={16} className="mr-2" /> {de ? '30-Tage Challenge starten' : 'Start 30-Day Challenge'} <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full font-semibold h-11" data-testid="success-go-dashboard">
                {de ? 'Zum Dashboard' : 'Go to Dashboard'}
              </Button>

              {/* Quick PDF + Tools links */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button onClick={() => navigate('/downloads')} variant="outline" className="text-xs h-10" data-testid="success-go-downloads">
                  <FileText size={13} className="mr-1.5" /> {de ? 'PDF-Downloads' : 'PDF Downloads'}
                </Button>
                <Button onClick={() => navigate('/chat')} variant="outline" className="text-xs h-10" data-testid="success-go-chat">
                  <MessageCircle size={13} className="mr-1.5" /> {de ? 'KI-Coach starten' : 'Start AI Coach'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(status === 'error' || status === 'expired' || status === 'timeout') && (
          <Card className="w-full border-black/[0.04]">
            <CardContent className="p-8 text-center space-y-4">
              <XCircle size={40} className="mx-auto text-red-500" />
              <h2 className="text-xl font-black">{de ? 'Zahlung nicht abgeschlossen' : 'Payment not completed'}</h2>
              <p className="text-sm text-muted-foreground">{de ? 'Bitte versuche es erneut.' : 'Please try again.'}</p>
              <Button onClick={() => navigate('/coaching')} className="bg-[#0A0A0A] text-white font-bold">
                {de ? 'Zurück' : 'Go Back'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
