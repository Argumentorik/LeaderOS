import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL hash
        const hash = window.location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          console.error("No session_id found in URL");
          navigate('/diagnose');
          return;
        }

        const sessionId = sessionIdMatch[1];

        // Exchange session_id for session_token
        const response = await fetch(`${API}/api/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });

        if (!response.ok) {
          throw new Error('Session exchange failed');
        }

        const user = await response.json();

        // Store user data for the form
        localStorage.setItem('emergent_user', JSON.stringify({
          session_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role
        }));

        // Navigate to diagnose page with pre-filled user data
        navigate('/diagnose', { state: { user } });

      } catch (error) {
        console.error("Auth callback error:", error);
        navigate('/diagnose');
      }
    };

    processAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center" data-testid="auth-callback">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C8FF00]/20 to-[#C8FF00]/10 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-manrope font-extrabold text-xl text-white">W</span>
          </div>
        </div>
        <p className="font-inter text-slate-500">Daten werden übernommen...</p>
      </div>
    </div>
  );
}
