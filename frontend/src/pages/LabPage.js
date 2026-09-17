import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight, CalendarDays, CheckCircle2, GraduationCap, PlayCircle, Users, Target,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PublicPageShell } from '../components/layout/PublicPageShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { usePricing } from '../contexts/PricingContext';
import api from '../lib/api';
import logger from '../lib/logger';
import { useSeo } from '../lib/seo';

/**
 * Leadership LAB (Iter 186) — eigenes Angebot mit eigener Anmeldung.
 *
 * Öffentlich erreichbar wie das Leadership-Programm. Zwei Stufen:
 * Interesse eintragen (ohne Bezahlung) und Anmeldung zum Start (nach dem Kauf).
 */

const FACTS = [
  { icon: PlayCircle, title: '72 Folgen', text: 'Videokurse zu Führung, Rhetorik, Verhandlung und KI — jede Folge unter 12 Minuten.' },
  { icon: Users, title: 'Live-Calls mit Begleitung', text: 'Regelmäßige Termine mit Wlad: eigene Fälle, Sparring, Antworten auf deine Fragen.' },
  { icon: Target, title: 'KI und Systeme', text: 'Du arbeitest mit einem Coach, der deine Lage kennt, und mit Werkzeugen, die Denkarbeit abnehmen.' },
  { icon: GraduationCap, title: 'Der Denkwechsel', text: 'Am Ende führst du Gespräche anders — vorbereitet, klar, ohne dich zu verbiegen.' },
];

const FAQS = [
  { q: 'Wie viel Zeit brauche ich pro Woche?', a: 'Zwei bis drei Stunden: eine bis zwei Folgen, eine Übung, ein Live-Call im Monat.' },
  { q: 'Brauche ich Vorkenntnisse?', a: 'Nein. Die 30 Tage sind der Einstieg, das LAB baut darauf auf.' },
  { q: 'Was, wenn ich einen Live-Call verpasse?', a: 'Jeder Call wird aufgezeichnet und liegt in deinem Konto.' },
  { q: 'Wie ist das LAB von den 30 Tagen getrennt?', a: 'Die 30 Tage sind für jeden und kostenlos. Das LAB ist die Weiterbildung mit Kursen und Live-Calls.' },
];

const InterestForm = ({ startGroups, onDone }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', role: '', team_size: '', pain: '',
    start_group: startGroups?.[0]?.id || '',
  });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name und E-Mail brauchen wir.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/lab/interest', form);
      toast.success(res.data.message);
      onDone?.();
    } catch (err) {
      logger.error('lab interest', err);
      toast.error(err?.response?.data?.detail || 'Eintragen hat nicht funktioniert.');
    } finally { setSaving(false); }
  };
  return (
    <Card data-testid="lab-interest-form"><CardContent className="p-5 space-y-3">
      <p className="text-[13px] text-muted-foreground">
        Ohne Bezahlung. Du bekommst die Termine der nächsten Startgruppe und alle Startinfos.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
               placeholder="Dein Name" data-testid="lab-interest-name" />
        <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
               placeholder="E-Mail" data-testid="lab-interest-email" />
        <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
               placeholder="Deine Rolle" data-testid="lab-interest-role" />
        <Input value={form.team_size} onChange={(e) => setForm({ ...form, team_size: e.target.value })}
               placeholder="Teamgröße" data-testid="lab-interest-team" />
      </div>
      <Textarea value={form.pain} onChange={(e) => setForm({ ...form, pain: e.target.value })}
                placeholder="Was drückt gerade am meisten?" rows={3} data-testid="lab-interest-pain" />
      <select value={form.start_group} onChange={(e) => setForm({ ...form, start_group: e.target.value })}
              className="w-full h-11 rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-transparent px-3 text-[13px]"
              data-testid="lab-interest-group">
        {(startGroups || []).map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
      </select>
      <Button onClick={submit} disabled={saving}
              className="w-full sm:w-auto bg-[#BFFF00] text-black hover:bg-[#D4FF4D] font-black h-11"
              data-testid="lab-interest-submit">
        Interesse eintragen <ArrowRight size={14} className="ml-1.5" />
      </Button>
    </CardContent></Card>
  );
};

const EnrollForm = ({ startGroups, onDone }) => {
  const [form, setForm] = useState({ start_group: startGroups?.[0]?.id || '', goal: '', consent_live_calls: false });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      const res = await api.post('/lab/enroll', form);
      toast.success(res.data.message);
      onDone?.(res.data.enrollment);
    } catch (err) {
      toast.error(err?.response?.data?.detail?.message || err?.response?.data?.detail || 'Anmeldung fehlgeschlagen.');
    } finally { setSaving(false); }
  };
  return (
    <Card data-testid="lab-enroll-form"><CardContent className="p-5 space-y-3">
      <p className="text-[13px] text-muted-foreground">
        Kurze Aufnahme: Startgruppe wählen, Ziel festhalten, den Live-Terminen zustimmen.
      </p>
      <select value={form.start_group} onChange={(e) => setForm({ ...form, start_group: e.target.value })}
              className="w-full h-11 rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-transparent px-3 text-[13px]"
              data-testid="lab-enroll-group">
        {(startGroups || []).map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
      </select>
      <Textarea value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
                placeholder="Was willst du am Ende können?" rows={3} data-testid="lab-enroll-goal" />
      <label className="flex items-start gap-2 text-[13px]">
        <input type="checkbox" checked={form.consent_live_calls} className="mt-1"
               onChange={(e) => setForm({ ...form, consent_live_calls: e.target.checked })}
               data-testid="lab-enroll-consent" />
        <span>Ich nehme an den Live-Terminen meiner Gruppe teil (Aufzeichnung liegt danach im Konto).</span>
      </label>
      <Button onClick={submit} disabled={saving} className="bg-[#BFFF00] text-black hover:bg-[#D4FF4D] font-black h-11"
              data-testid="lab-enroll-submit">
        Anmeldung abschließen <ArrowRight size={14} className="ml-1.5" />
      </Button>
    </CardContent></Card>
  );
};

export default function LabPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { open: openPricing } = usePricing();
  const [info, setInfo] = useState(null);

  useSeo({
    path: '/leadership-lab',
    title: 'Leadership LAB · 72 Folgen, Live-Calls und KI für Führungskräfte',
    description: 'Die Weiterbildung von Wlad Jachtchenko: 72 Videofolgen, Live-Calls mit Begleitung, KI-Coach und Systeme. Startgruppen, Ablauf, Preise und häufige Fragen.',
  });

  useEffect(() => {
    api.get('/lab/info').then((r) => setInfo(r.data)).catch((e) => logger.warn('lab info', e));
  }, []);

  const enrolled = info?.enrollment;
  const body = (
    <div className="p-6 lg:p-10 xl:px-14 w-full space-y-12" data-testid="lab-page">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A6200] dark:text-[#BFFF00]">
          Die Weiterbildung
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mt-2">Leadership LAB</h1>
        <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          72 Folgen, Live-Calls mit Begleitung, ein KI-Coach, der deine Lage kennt — über Wochen,
          nicht über ein Wochenende. Für Führungskräfte, die nicht mehr improvisieren wollen.
        </p>
        <p className="text-[13px] text-muted-foreground mt-2 max-w-2xl">
          Die 30 Tage sind der Einstieg für jeden und kostenlos. Das LAB ist der Schritt danach.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2" data-testid="lab-facts">
        {FACTS.map((f) => (
          <Card key={f.title}><CardContent className="p-5">
            <f.icon size={18} className="text-[#4A6200] dark:text-[#BFFF00]" />
            <p className="text-[15px] font-black mt-2.5">{f.title}</p>
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{f.text}</p>
          </CardContent></Card>
        ))}
      </section>

      <section data-testid="lab-schedule">
        <h2 className="text-base md:text-lg font-black">So läuft es ab</h2>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">Feste Startgruppen, damit die Live-Calls zusammen stattfinden.</p>
        <div className="mt-3 space-y-2">
          {(info?.start_groups || []).map((g) => (
            <Card key={g.id}><CardContent className="p-4 flex items-center gap-3">
              <CalendarDays size={16} className="text-[#4A6200] dark:text-[#BFFF00] shrink-0" />
              <span className="text-[13.5px] font-semibold">{g.label}</span>
            </CardContent></Card>
          ))}
        </div>
      </section>

      <section data-testid="lab-signup">
        <h2 className="text-base md:text-lg font-black">
          {enrolled ? 'Du bist angemeldet' : info?.has_access ? 'Anmeldung zum Start' : 'Interesse eintragen'}
        </h2>
        <p className="text-[12.5px] text-muted-foreground mt-0.5 mb-3">
          {enrolled
            ? 'Deine Gruppe und die Live-Termine stehen in deinem Konto.'
            : info?.has_access
              ? 'Du hast Zugang — es fehlt nur die kurze Aufnahme.'
              : 'Zwei Stufen: erst Interesse ohne Bezahlung, die Anmeldung kommt nach dem Kauf.'}
        </p>
        {enrolled ? (
          <Card data-testid="lab-enrolled-card"><CardContent className="p-5 space-y-2">
            <p className="text-[13.5px] font-bold inline-flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
              {(info.start_groups || []).find((g) => g.id === enrolled.start_group)?.label || enrolled.start_group}
            </p>
            <p className="text-[13px] text-muted-foreground">Dein Ziel: {enrolled.goal}</p>
            <Button variant="outline" onClick={() => navigate('/kurse')} className="h-10 text-[12.5px]" data-testid="lab-to-courses">
              Zu den Kursen <ArrowRight size={13} className="ml-1" />
            </Button>
          </CardContent></Card>
        ) : info?.has_access ? (
          <EnrollForm startGroups={info?.start_groups} onDone={(e) => setInfo({ ...info, enrollment: e })} />
        ) : (
          <>
            <InterestForm startGroups={info?.start_groups} onDone={() => setInfo({ ...info, interest_registered: true })} />
            <div className="mt-3">
              <Button onClick={() => (user ? openPricing('leadership_os') : navigate('/signup?next=/leadership-lab'))}
                      className="bg-[#0A0A0A] dark:bg-white dark:text-black text-white font-black h-11"
                      data-testid="lab-buy-btn">
                Preise ansehen und buchen <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </div>
          </>
        )}
      </section>

      <section data-testid="lab-faq">
        <h2 className="text-base md:text-lg font-black">Häufige Fragen</h2>
        <div className="mt-3 space-y-2.5">
          {FAQS.map((f) => (
            <Card key={f.q}><CardContent className="p-4">
              <p className="text-[13.5px] font-bold">{f.q}</p>
              <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{f.a}</p>
            </CardContent></Card>
          ))}
        </div>
      </section>
    </div>
  );

  if (!user) return <PublicPageShell>{body}</PublicPageShell>;
  return <DashboardLayout>{body}</DashboardLayout>;
}
