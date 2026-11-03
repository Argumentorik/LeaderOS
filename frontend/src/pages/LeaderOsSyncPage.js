/**
 * LeaderOsSyncPage · /auth/sync — receives the leader-check.de handoff.
 *
 * leader-check redirects here with `?sync_token=<jwt>` (and optional `?next=`).
 * We exchange it for a first-party LeaderOS session (httponly cookie) and drop
 * the visitor straight into the funnel — no second login. Default landing is
 * /free-videos so a fresh lead sees their videos immediately.
 *
 * Must live on the App host (leaderos.de) so the session cookie is same-origin.
 * The index.js guard + tierRedirect ensure the token reaches this route with
 * its query intact even if leader-check points at the marketing host.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { WladMark } from '../components/brand/WladMark';

export default function LeaderOsSyncPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-invoke guard (token is single-use)
    ran.current = true;

    const token = params.get('sync_token');
    const nextRaw = params.get('next') || '/free-videos';
    const next = nextRaw.startsWith('/') ? nextRaw : '/free-videos';

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await api.post('/auth/leader-os-sync', { sync_token: token });
        login(res.data.user, 'leader_check');
        navigate(next, { replace: true });
      } catch {
        setFailed(true);
        setTimeout(() => navigate('/login?sync=failed', { replace: true }), 1800);
      }
    })();
  }, [params, navigate, login]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-6" data-testid="leader-os-sync">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <WladMark size={44} animated />
        </div>
        {failed ? (
          <>
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-red-400 mb-2">▸ SYNC FEHLGESCHLAGEN</div>
            <h1 className="text-2xl font-black tracking-tight">Der Link ist abgelaufen</h1>
            <p className="text-sm text-white/60 mt-3">Kein Problem — wir leiten dich zum Login weiter.</p>
          </>
        ) : (
          <>
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand mb-2">▸ LEADER · OS</div>
            <h1 className="text-2xl font-black tracking-tight">Dein Zugang wird vorbereitet…</h1>
            <p className="text-sm text-white/60 mt-3">Einen Moment — wir synchronisieren dein Profil.</p>
            <div className="mt-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-white/20 border-t-brand rounded-full animate-spin" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
