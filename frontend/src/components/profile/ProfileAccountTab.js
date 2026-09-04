import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Lock, Building2, Share2, Download, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import logger from '../../lib/logger';
import { toast } from 'sonner';

/**
 * ProfileAccountTab — Account & security settings:
 * - Password change
 * - Quick access to Enterprise, Referrals, Downloads
 *
 * Replaces the previous sidebar entries for Empfehlungen / Downloads / Enterprise.
 */
export const ProfileAccountTab = ({ de }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentPwRef = useRef(null);
  useEffect(() => {
    if (searchParams.get('focus') !== 'password' || !currentPwRef.current) return;
    currentPwRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    currentPwRef.current.focus();
  }, [searchParams]);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) {
      toast.error(de ? 'Passwörter stimmen nicht überein.' : 'Passwords do not match.');
      return;
    }
    if (pw.next.length < 8 || !/\d/.test(pw.next) || !/[^\d]/.test(pw.next)) {
      toast.error(de ? 'Min. 8 Zeichen mit Buchstaben und Zahlen.' : 'Min. 8 characters with letters and numbers.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/password/change', {
        current_password: pw.current,
        new_password: pw.next,
      });
      setPw({ current: '', next: '', confirm: '' });
      setShowSuccess(true);
      toast.success(de ? 'Passwort geändert.' : 'Password changed.');
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      logger.error('password change failed', err);
      toast.error(detail || (de ? 'Fehler beim Ändern.' : 'Change failed.'));
    } finally {
      setSaving(false);
    }
  };

  const quickLinks = [
    {
      id: 'enterprise',
      icon: Building2,
      title: de ? 'Leadership OS Enterprise' : 'Leadership OS Enterprise',
      description: de
        ? 'B2B-Pakete für Teams · Volume-Discount 10–50% · Lead-Form anfordern'
        : 'B2B packages for teams · Volume discount 10–50% · Request quote',
      onClick: () => navigate('/enterprise'),
    },
    {
      id: 'referral',
      icon: Share2,
      title: de ? 'Empfehlungen' : 'Referrals',
      description: de
        ? 'Empfehle Freunde und sammle Credits + XP'
        : 'Invite friends and earn credits + XP',
      onClick: () => navigate('/referral'),
    },
    {
      id: 'downloads',
      icon: Download,
      title: de ? 'PDF Downloads' : 'PDF Downloads',
      description: de
        ? 'Leadership-Reports, 30-Tage-Plan, Wlads Frameworks als PDF'
        : 'Leadership reports, 30-day plan, Wlad frameworks as PDF',
      onClick: () => navigate('/downloads'),
    },
  ];

  return (
    <div className="space-y-5" data-testid="profile-account-tab">
      {/* Password change */}
      <Card className="border-black/[0.04] dark:border-white/[0.06]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E] flex items-center justify-center">
              <Lock size={14} className="text-[#BFFF00]" />
            </div>
            <div>
              <h3 className="text-sm font-black">{de ? 'Passwort ändern' : 'Change password'}</h3>
              <p className="text-[11px] text-muted-foreground">
                {de ? 'Andere Sessions werden nach Erfolg abgemeldet.' : 'Other sessions are logged out on success.'}
              </p>
            </div>
          </div>

          {showSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2" data-testid="password-success">
              <CheckCircle2 size={14} />
              {de ? 'Passwort erfolgreich geändert.' : 'Password changed successfully.'}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3" data-testid="password-form">
            <div>
              <Label htmlFor="current_pw" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {de ? 'Aktuelles Passwort' : 'Current password'}
              </Label>
              <Input
                id="current_pw"
                ref={currentPwRef}
                type="password"
                required
                autoComplete="current-password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
                className="mt-1.5"
                data-testid="password-current"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new_pw" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {de ? 'Neues Passwort' : 'New password'}
                </Label>
                <Input
                  id="new_pw"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  className="mt-1.5"
                  data-testid="password-new"
                />
              </div>
              <div>
                <Label htmlFor="confirm_pw" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {de ? 'Bestätigen' : 'Confirm'}
                </Label>
                <Input
                  id="confirm_pw"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  className="mt-1.5"
                  data-testid="password-confirm"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={saving || !pw.current || !pw.next || !pw.confirm}
              className="w-full bg-[#0A0A0A] dark:bg-white dark:text-[#0A0A0A] text-white font-bold h-10"
              data-testid="password-submit"
            >
              {saving
                ? <><Loader2 size={14} className="mr-2 animate-spin" /> {de ? 'Speichere...' : 'Saving...'}</>
                : (de ? 'Passwort aktualisieren' : 'Update password')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card className="border-black/[0.04] dark:border-white/[0.06]">
        <CardContent className="p-5">
          <h3 className="text-sm font-black mb-3">{de ? 'Konto & Mehr' : 'Account & More'}</h3>
          <div className="space-y-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={link.onClick}
                  data-testid={`profile-link-${link.id}`}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-black/[0.04] dark:border-white/[0.06] hover:border-[#BFFF00]/40 hover:bg-[#BFFF00]/[0.02] transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 group-hover:bg-[#BFFF00]/10 transition-colors">
                    <Icon size={15} className="text-foreground/70 group-hover:text-[#BFFF00] transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{link.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{link.description}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground/40 group-hover:text-[#BFFF00] transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
