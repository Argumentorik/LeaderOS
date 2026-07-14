import { useEffect, useRef } from 'react';
import logger from '../lib/logger';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { WladMark } from '../components/brand/WladMark';
import { postLoginRoute } from '../lib/postLoginRoute';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace('#', ''));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        navigate('/login');
        return;
      }

      try {
        const res = await api.post('/auth/google-session', { session_id: sessionId });
        login(res.data.user);
        navigate(postLoginRoute(res.data.user), { replace: true, state: { user: res.data.user } });
      } catch (err) {
        logger.error('Google auth callback failed:', err);
        navigate('/login');
      }
    };

    processSession();
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center motion-fade-in-up">
        <div className="mx-auto mb-4 animate-pulse-glow rounded-xl">
          <WladMark size={56} animated />
        </div>
        <p className="text-muted-foreground text-sm">Authentifizierung läuft…</p>
      </div>
    </div>
  );
}
